# Flow: client-credentials

## Trigger

User wants to set up machine-to-machine authentication for a backend service, CLI tool, or API-to-API communication.

> "set up machine-to-machine auth for my API"
> "create client credentials for my backend service"
> "configure service-to-service authentication"
> "generate API credentials for my CLI tool"
> "machine-to-machine OAuth2"

---

## Pre-flight Questions

Before starting, confirm:

1. What is the service name? (used as the credential name)
2. What roles should the service have? (determines API permissions)
3. What audience/apis should this service access?
4. Is this a new credential or rotating an existing one?

---

## Flow Steps

### Step 1 — Create Client Credential

Create a named machine-to-machine credential. This is NOT an OIDC client — it uses the OAuth2 client_credentials grant.

```bash
curl --location "$API_BASE_URL/idp/v1/Authentication/SaveClientCredential" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "name": "my-backend-service",
    "roles": ["api-consumer", "data-reader"],
    "projectKey": "'$X_BLOCKS_KEY'"
  }'
```

Response:
```json
{
  "isSuccess": true,
  "errors": {},
  "itemId": "credential-item-id"
}
```

> **Note:** The `clientSecret` is returned in the `GetClientCredentials` response, NOT in the save response. Save the credential first, then immediately retrieve it to get the secret.

### Step 2 — Get Client Credentials

Retrieve the credential to capture the `clientSecret`. The secret is only shown once.

```bash
curl "$API_BASE_URL/idp/v1/Authentication/GetClientCredentials?ProjectKey=$X_BLOCKS_KEY" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

Response:
```json
[
  {
    "itemId": "credential-item-id",
    "name": "my-backend-service",
    "clientSecret": "cs_xxxxxxxxxxxxxxxxxxxx",
    "isActive": true,
    "audiences": ["https://api.blocks.cloud"],
    "roles": ["api-consumer", "data-reader"],
    "createdDate": "2024-01-01T00:00:00Z"
  }
]
```

> **Store the `clientSecret` securely now.** It is shown only once on creation.

### Step 3 — Exchange Credentials for Access Token

Use the client credentials to obtain an access token for service-to-service calls:

```bash
curl --location "$API_BASE_URL/idp/v1/Authentication/Token" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "grant_type=client_credentials" \
  --data-urlencode "client_id=credential-item-id" \
  --data-urlencode "client_secret=cs_xxxxxxxxxxxxxxxxxxxx" \
  --data-urlencode "scope=openid profile email"
```

Response:
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "Bearer",
  "expires_in": 8000,
  "refresh_token": "538b8ede...",
  "id_token": "eyJhbGci..."
}
```

### Step 4 — Use Access Token for API Calls

Use the access token in the Authorization header for all service-to-service requests:

```bash
curl "$API_BASE_URL/idp/v1/Iam/GetUsers" \
  --header "Authorization: Bearer eyJhbGci..." \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "page": 1,
    "pageSize": 10,
    "projectKey": "'$X_BLOCKS_KEY'"
  }'
```

### Step 5 — Token Refresh

When the access token expires, refresh using the refresh_token:

```bash
curl --location "$API_BASE_URL/idp/v1/Authentication/Token" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "grant_type=refresh_token" \
  --data-urlencode "refresh_token=538b8ede..." \
  --data-urlencode "client_id=credential-item-id" \
  --data-urlencode "client_secret=cs_xxxxxxxxxxxxxxxxxxxx"
```

---

## Token Rotation

To rotate credentials (generate new secret):

1. **Do not delete the old credential yet** — existing tokens are still valid
2. Save a new credential with the same name (or a versioned name like `my-service-v2`)
3. Update your service with the new `client_id` and `clientSecret`
4. Verify the new credentials work
5. Delete the old credential

```bash
# Delete old credential
curl --location "$API_BASE_URL/idp/v1/Authentication/DeleteClientCredential" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "itemId": "old-credential-item-id",
    "projectKey": "'$X_BLOCKS_KEY'"
  }'
```

---

## Environment Configuration

Store client credentials as environment variables on the service:

```bash
# .env (server-side only, NEVER expose to frontend)
BLOCKS_CLIENT_ID=credential-item-id
BLOCKS_CLIENT_SECRET=cs_xxxxxxxxxxxxxxxxxxxx
BLOCKS_PROJECT_KEY=your-project-key
BLOCKS_API_BASE_URL=https://api.blocks.cloud
```

---

## Security Considerations

1. **Never embed client credentials in frontend code** — client_credentials are for server-to-server communication
2. **Store secrets in secure storage** — environment variables, secrets manager (AWS Secrets Manager, HashiCorp Vault, Azure Key Vault)
3. **Use the principle of least privilege** — assign only the roles needed for the service's function
4. **Rotate credentials regularly** — at least every 90 days
5. **Monitor for misuse** — log all token exchanges and API calls
6. **Use HTTPS everywhere** — never send credentials over plain HTTP

---

## Reference

- `references/client-credentials.md` — Detailed implementation guide with code examples
- `references/token-refresh.md` — Token refresh strategy for long-running services
- `actions/save-client-credential.md`
- `actions/get-client-credentials.md`
- `actions/delete-client-credential.md`
- `contracts.md` — ClientCredential schema and Token endpoint details
