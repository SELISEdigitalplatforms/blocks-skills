# Client Credentials Reference

Machine-to-machine OAuth2 client credentials grant. Used when a backend service, script, or CI pipeline needs to authenticate to another API without a user present.

See `contracts.md` for the `client_credentials` grant type contract, `SaveClientCredentialRequest`, `ClientCredential`, `DeleteClientCredentialRequest` schemas.

---

## What Client Credentials Are

The client credentials grant is for **server-to-server** authentication. There is no user login, no browser redirect, and no interactive consent screen. One service authenticates directly to the token endpoint using a `client_id` and `client_secret`, and receives an access token.

Use client credentials when:
- A backend service calls another backend service
- A CI/CD pipeline accesses protected resources
- A scheduled job (cron) needs to authenticate
- A mobile app backend talks to another API

Do NOT use client credentials for:
- User-facing web or mobile apps (use `grant_type=password` or OIDC authorization code flow)
- Browser-based SPAs (use OIDC with PKCE)
- When user identity is needed (use the password or authorization code grant)

---

## Credential Management

Admin-level actions for managing client credentials.

### SaveClientCredential — Create

`POST /idp/v1/Authentication/SaveClientCredential`

Creates a new named credential. The response returns the generated `client_secret` — this is the only time it is visible. Store it securely (e.g., in a secrets manager, not in source code).

```bash
curl --location "$API_BASE_URL/idp/v1/Authentication/SaveClientCredential" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "name": "build-server-credential",
    "roles": ["api-reader"],
    "projectKey": "'$X_BLOCKS_KEY'"
  }'
```

Request fields:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes | Descriptive name to identify the credential |
| roles | string[] | yes | Roles assigned to this credential. Determines what the access token permits |
| projectKey | string | yes | Use $X_BLOCKS_KEY |
| audiences | string[] | no | Restrict the issued access token to specific audiences |

Response:

```json
{
  "isSuccess": true,
  "errors": {},
  "itemId": "credential-uuid-789",
  "clientSecret": "cs_abc123xyz789..."
}
```

The `clientSecret` field is only returned on creation. It is not stored in plain text and cannot be retrieved again. If lost, delete the credential and create a new one.

See `contracts.md` for the full `SaveClientCredentialRequest` schema.

### GetClientCredentials — List All

`GET /idp/v1/Authentication/GetClientCredentials?ProjectKey=...`

```bash
curl --location "$API_BASE_URL/idp/v1/Authentication/GetClientCredentials?ProjectKey=$X_BLOCKS_KEY" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

Response:

```json
{
  "isSuccess": true,
  "errors": {},
  "data": [
    {
      "itemId": "credential-uuid-789",
      "name": "build-server-credential",
      "clientSecret": null,
      "roles": ["api-reader"],
      "isActive": true,
      "audiences": ["https://api.myapp.com"],
      "createdDate": "2024-01-01T00:00:00Z",
      "lastUpdatedDate": "2024-01-15T00:00:00Z",
      "organizationIds": [],
      "tags": []
    }
  ],
  "totalCount": 1
}
```

Note: `clientSecret` is `null` on all responses after creation. The actual secret is not retrievable.

### Update a Client Credential

`POST /idp/v1/Authentication/SaveClientCredential` with `itemId` set

Include the `itemId` field to update an existing credential. Only the fields you include are updated.

```bash
curl --location "$API_BASE_URL/idp/v1/Authentication/SaveClientCredential" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "itemId": "credential-uuid-789",
    "name": "build-server-credential-updated",
    "roles": ["api-reader", "api-writer"],
    "projectKey": "'$X_BLOCKS_KEY'"
  }'
```

### DeleteClientCredential — Remove

`POST /idp/v1/Authentication/DeleteClientCredential`

```bash
curl --location "$API_BASE_URL/idp/v1/Authentication/DeleteClientCredential" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "itemId": "credential-uuid-789",
    "projectKey": "'$X_BLOCKS_KEY'"
  }'
```

Response:

```json
{
  "isSuccess": true,
  "errors": {}
}
```

Deleting a credential invalidates all active tokens issued to it immediately.

---

## Token Exchange — client_credentials Grant

Exchange the client credentials for an access token. This is a direct server-to-server call with no user interaction.

`POST /idp/v1/Authentication/Token`

```bash
curl --location "$API_BASE_URL/idp/v1/Authentication/Token" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "grant_type=client_credentials" \
  --data-urlencode "client_id=$CLIENT_ID" \
  --data-urlencode "client_secret=$CLIENT_SECRET" \
  --data-urlencode "scope=read write"
```

Request parameters:

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| grant_type | string | yes | Must be `client_credentials` |
| client_id | string | yes | The credential's itemId or name |
| client_secret | string | yes | The secret returned when the credential was created |
| scope | string | no | Space-separated list of requested scopes. Defaults to the roles assigned to the credential |
| audience | string | no | Restrict the token to a specific audience |
| x-blocks-key | header | yes | Always required |

Response (200):

```json
{
  "access_token": "eyJhbGci...",
  "token_type": "Bearer",
  "expires_in": 8000,
  "refresh_token": null,
  "id_token": null
}
```

Key differences from user-based grants:
- `refresh_token` is `null` — machine credentials do not get refresh tokens
- `id_token` is `null` — there is no user identity in the flow
- The token is valid for the duration specified in `expires_in` (typically seconds, not days)
- When the token expires, the service must request a new token with the same credentials

See `contracts.md` for the full token response schema.

---

## Using the Access Token in Service-to-Service Calls

Include the access token in the `Authorization` header of all subsequent API requests.

```typescript
// src/lib/service-client.ts
const API_BASE = process.env.SERVICE_API_BASE_URL
const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET

interface CachedToken {
  token: string
  expiresAt: number
}

let cachedToken: CachedToken | null = null

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 30_000) {
    return cachedToken.token
  }

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  })

  const res = await fetch(`${API_BASE}/idp/v1/Authentication/Token`, {
    method: 'POST',
    headers: {
      'x-blocks-key': process.env.X_BLOCKS_KEY!,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!res.ok) {
    throw new Error(`Token request failed: ${res.status}`)
  }

  const data = await res.json()
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }

  return cachedToken.token
}

async function serviceRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken()

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'x-blocks-key': process.env.X_BLOCKS_KEY!,
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (res.status === 401) {
    cachedToken = null
    const newToken = await getAccessToken()
    const retryRes = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'x-blocks-key': process.env.X_BLOCKS_KEY!,
        Authorization: `Bearer ${newToken}`,
        ...options.headers,
      },
    })
    if (!retryRes.ok) throw new Error(`Request failed: ${retryRes.status}`)
    return retryRes.json() as T
  }

  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json() as T
}
```

---

## Credential Rotation Strategy

Client credentials do not expire on their own — they remain valid until manually deleted. Implement a rotation strategy to limit the blast radius of a leaked credential.

### Rotation Pattern

1. Create a new credential before revoking the old one
2. Update the consuming service to use the new credential
3. Verify the service works with the new credential
4. Delete the old credential

```typescript
// Example: credential rotation in a Node.js service
async function rotateCredential(): Promise<void> {
  // 1. Create new credential
  const createRes = await fetch(`${API_BASE}/idp/v1/Authentication/SaveClientCredential`, {
    method: 'POST',
    headers: {
      'x-blocks-key': process.env.X_BLOCKS_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `service-credential-${Date.now()}`,
      roles: ['api-reader'],
      projectKey: process.env.X_BLOCKS_KEY,
    }),
  })

  const { itemId: newId, clientSecret: newSecret } = await createRes.json()

  // 2. Write new credential to secrets manager
  await writeToSecretsManager('SERVICE_CLIENT_ID', newId)
  await writeToSecretsManager('SERVICE_CLIENT_SECRET', newSecret)

  // 3. Signal service to reload credentials (e.g., via SIGHUP, config reload endpoint)
  await signalServiceReload()

  // 4. Verify service is using new credential
  await waitForHealthy()

  // 5. Delete old credential
  await fetch(`${API_BASE}/idp/v1/Authentication/DeleteClientCredential`, {
    method: 'POST',
    headers: {
      'x-blocks-key': process.env.X_BLOCKS_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      itemId: process.env.CLIENT_ID,
      projectKey: process.env.X_BLOCKS_KEY,
    }),
  })
}
```

Store credentials in environment variables, a secrets manager (AWS Secrets Manager, Vault, GCP Secret Manager), or a `.env` file that is gitignored. Never commit credentials to source control.

---

## Audience Configuration

The `audience` parameter restricts the access token so it can only be used with specific resource servers. Set this when a token should only be valid for one API.

Request a token with a specific audience:

```bash
curl --location "$API_BASE_URL/idp/v1/Authentication/Token" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "grant_type=client_credentials" \
  --data-urlencode "client_id=$CLIENT_ID" \
  --data-urlencode "client_secret=$CLIENT_SECRET" \
  --data-urlencode "audience=https://api.myapp.com/inventory"
```

The resource server should validate the `aud` claim in the JWT matches its expected value.

---

## OIDC Client vs Client Credential — Comparison

| Aspect | OIDC Client | Client Credential |
|--------|-------------|-----------------|
| Context | User-facing SSO (Okta, Azure AD, Google) | Server-to-server, no user |
| User login | Yes — redirects through an identity provider | No |
| Client secret | Stored by the identity provider | Stored by your service |
| Scope | OIDC scopes (openid, profile, email) | API scopes (read, write, admin) |
| Refresh token | Yes (offline_access) | No |
| ID token | Yes | No |
| Use case | SPA or web app authenticating via SSO | Backend service, CI/CD, cron |

See `references/oidc-sso-setup.md` for OIDC client management. See `references/token-refresh.md` for token lifecycle management in user-facing applications.

---

## Summary of Request Headers

| Header | Value | When |
|--------|-------|------|
| `x-blocks-key` | `$X_BLOCKS_KEY` | All requests |
| `Authorization` | `Bearer <accessToken>` | Authenticated requests (admin operations) |
| `Content-Type` | `application/json` | JSON body requests |
| `Content-Type` | `application/x-www-form-urlencoded` | Token endpoint only |
