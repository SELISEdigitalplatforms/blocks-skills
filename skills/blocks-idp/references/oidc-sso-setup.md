# OIDC SSO Setup Reference

OIDC client configuration and SSO credential management for frontend developers. Covers client registration, provider setup, authorization URL construction, and OIDC discovery.

See `contracts.md` for the `SaveOIDCClientRequest`, `OIDCClientCredential`, `SaveSsoCredentialRequest`, `SocialLoginCredential`, `Authorize Query Parameters`, and `AcknowledgeRequest` schemas.

---

## OIDC Flow Overview

The authorization code + PKCE flow is the recommended pattern for SPAs:

```
1. Generate PKCE pair (code_verifier + code_challenge)
2. Store code_verifier in sessionStorage
3. Redirect user to Authorization endpoint
4. User authenticates with the identity provider (Okta, Azure AD, etc.)
5. Provider redirects back with ?code=...&state=...
6. Exchange code for tokens at Token endpoint
7. Clear code_verifier from sessionStorage
8. Store tokens securely
```

PKCE is required for public clients (SPAs) because there is no way to securely store a client secret in the browser.

---

## OIDC Client Management

Admin-level actions for managing registered OIDC clients. These are typically called by admin dashboards, not by end-user applications.

### SaveOIDCClient — Create or Update

`POST /idp/v1/Authentication/SaveOIDCClient`

Registers or updates an OIDC client for the project. The client defines the redirect URI, scopes, audience, and branding for SSO logins.

```bash
curl --location "$API_BASE_URL/idp/v1/Authentication/SaveOIDCClient" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "clientDisplayName": "My App",
    "redirectUri": "https://myapp.com/auth/callback",
    "scope": "openid profile email offline_access",
    "audience": "https://api.myapp.com",
    "isAutoRedirect": false,
    "clientLogoUrl": "https://myapp.com/logo.png",
    "clientBrandColor": "#0066cc",
    "projectKey": "'$X_BLOCKS_KEY'",
    "itemId": null
  }'
```

Request fields:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| clientDisplayName | string | yes | Shown on the consent screen |
| redirectUri | string | yes | Must match exactly what is registered with the provider |
| scope | string | no | Space-separated OIDC scopes. Defaults to `openid profile email` |
| audience | string | no | Expected audience in the access token |
| isAutoRedirect | boolean | no | If true, skip the Blocks consent screen for returning users |
| clientLogoUrl | string | no | Displayed on the consent screen |
| clientBrandColor | string | no | Accent color for the login page |
| projectKey | string | yes | Use $X_BLOCKS_KEY |
| itemId | string/null | no | Set to update existing client, null to create |

Response:

```json
{
  "isSuccess": true,
  "errors": {},
  "itemId": "client-uuid-123"
}
```

On failure: `errors` contains field-level messages, for example `{ "redirectUri": "redirect_uri is invalid" }`.

See `contracts.md` for the full `SaveOIDCClientRequest` and `SaveOIDCClientResponse` schemas.

### GetOIDCClients — List All

`GET /idp/v1/Authentication/GetOIDCClients?ProjectKey=...`

```bash
curl --location "$API_BASE_URL/idp/v1/Authentication/GetOIDCClients?ProjectKey=$X_BLOCKS_KEY" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

Response:

```json
{
  "isSuccess": true,
  "errors": {},
  "oIDCClientCredentials": [
    {
      "itemId": "client-uuid-123",
      "clientDisplayName": "My App",
      "redirectUri": "https://myapp.com/auth/callback",
      "scope": "openid profile email offline_access",
      "audience": "https://api.myapp.com",
      "isAutoRedirect": false,
      "clientLogoUrl": "https://myapp.com/logo.png",
      "clientBrandColor": "#0066cc",
      "createdDate": "2024-01-01T00:00:00Z",
      "lastUpdatedDate": "2024-01-15T00:00:00Z",
      "organizationIds": [],
      "tags": []
    }
  ]
}
```

### DeleteOIDCClient — Remove

`POST /idp/v1/Authentication/DeleteOIDCClient`

```bash
curl --location "$API_BASE_URL/idp/v1/Authentication/DeleteOIDCClient" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: "application/json" \
  --data '{
    "projectKey": "'$X_BLOCKS_KEY'",
    "itemId": "client-uuid-123"
  }'
```

Response uses the standard envelope:

```json
{
  "isSuccess": true,
  "errors": {}
}
```

---

## SSO Credential Management

SSO credentials represent the configuration for an external identity provider (Okta, Azure AD, Google Workspace, etc.). These are distinct from OIDC clients — SSO credentials connect Blocks to an external provider, while OIDC clients define how external clients connect to Blocks.

### SaveSsoCredential — Create or Update

`POST /idp/v1/Authentication/SaveSsoCredential`

```bash
curl --location "$API_BASE_URL/idp/v1/Authentication/SaveSsoCredential" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "provider": "Okta",
    "audience": "https://api.myapp.com",
    "clientId": "0oa1234567890abcdef",
    "clientSecret": "super-secret-value",
    "redirectUrl": "https://myapp.okta.com/oauth2/v1/authorize",
    "wellKnownUrl": "https://myorg.okta.com/.well-known/openid-configuration",
    "initialRoles": ["member"],
    "initialPermissions": ["read:profile"],
    "projectKey": "'$X_BLOCKS_KEY'",
    "isDisabled": false,
    "ssoType": 0,
    "itemId": null
  }'
```

Request fields:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| provider | string | yes | Display name (e.g. `Okta`, `AzureAD`, `Google`) |
| audience | string | no | Expected audience in the token from this provider |
| clientId | string | yes | Application client ID from the provider |
| clientSecret | string | yes | Client secret from the provider |
| redirectUrl | string | yes | Provider's authorization endpoint |
| wellKnownUrl | string | no | OIDC discovery URL. Preferred over manually setting endpoints |
| initialRoles | string[] | no | Roles assigned to new users on first SSO login |
| initialPermissions | string[] | no | Permissions assigned to new users on first SSO login |
| projectKey | string | yes | Use $X_BLOCKS_KEY |
| isDisabled | boolean | no | Disable this SSO provider without deleting it |
| ssoType | number | no | 0 = Standard, 1 = Apple. Defaults to 0 |
| itemId | string/null | no | Set to update existing credential |
| teamId | string | no | Apple-specific Team ID |
| keyId | string | no | Apple-specific Key ID for JWT auth |
| privateKey | string | no | Apple-specific private key (P8 format) |

Response:

```json
{
  "isSuccess": true,
  "errors": {},
  "itemId": "sso-credential-uuid-456"
}
```

See `contracts.md` for the full `SaveSsoCredentialRequest` and `SaveSsoCredentialResponse` schemas.

### GetSsoCredentials — List All

`GET /idp/v1/Authentication/GetSsoCredentials?ProjectKey=...`

```bash
curl --location "$API_BASE_URL/idp/v1/Authentication/GetSsoCredentials?ProjectKey=$X_BLOCKS_KEY" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

Response:

```json
{
  "isSuccess": true,
  "errors": {},
  "itemId": "sso-credential-uuid-456",
  "provider": "Okta",
  "audience": "https://api.myapp.com",
  "clientId": "0oa1234567890abcdef",
  "authorizationUrl": "https://myorg.okta.com/oauth2/v1/authorize",
  "tokenUrl": "https://myorg.okta.com/oauth2/v1/token",
  "userInfoUrl": "https://myorg.okta.com/oauth2/v1/userinfo",
  "wellKnownUrl": "https://myorg.okta.com/.well-known/openid-configuration",
  "isDisabled": false,
  "sendAsResponse": false
}
```

The response includes resolved endpoints from `wellKnownUrl` discovery when available.

### UpdateStatus — Enable or Disable

`POST /idp/v1/Authentication/UpdateSsoCredentialStatus`

```bash
curl --location "$API_BASE_URL/idp/v1/Authentication/UpdateSsoCredentialStatus" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "itemId": "sso-credential-uuid-456",
    "isEnabled": false,
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

Use this to temporarily disable an SSO provider (e.g., during maintenance) without deleting the configuration.

### DeleteSsoCredential — Remove

`POST /idp/v1/Authentication/DeleteSsoCredential`

```bash
curl --location "$API_BASE_URL/idp/v1/Authentication/DeleteSsoCredential" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "itemId": "sso-credential-uuid-456",
    "projectKey": "'$X_BLOCKS_KEY'"
  }'
```

---

## Authorize Endpoint URL Construction

The authorization endpoint redirects the user to the identity provider to authenticate. Construct the URL with query parameters.

`GET /idp/v1/Authentication/Authorize`

```typescript
// src/lib/build-authorize-url.ts
export function buildAuthorizeUrl(params: {
  authorizationEndpoint: string
  clientId: string
  redirectUri: string
  state: string
  scope: string
  nonce?: string
  responseType?: string
  codeChallenge?: string
  codeChallengeMethod?: string
}): string {
  const search = new URLSearchParams({
    response_type: params.responseType ?? 'code',
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    state: params.state,
    scope: params.scope,
  })

  if (params.nonce) search.set('nonce', params.nonce)
  if (params.codeChallenge) {
    search.set('code_challenge', params.codeChallenge)
    search.set('code_challenge_method', params.codeChallengeMethod ?? 'S256')
  }

  return `${params.authorizationEndpoint}?${search.toString()}`
}

export function generateState(): string {
  const arr = new Uint8Array(32)
  crypto.getRandomValues(arr)
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}
```

Query parameters:

| Param | Required | Notes |
|-------|----------|-------|
| response_type | yes | Always `code` for authorization code flow |
| client_id | yes | From the OIDC client registration |
| redirect_uri | yes | Must exactly match the registered redirect URI |
| scope | yes | Space-separated list of scopes |
| state | yes | Random string to prevent CSRF. Generate with `generateState()` |
| nonce | no | Random string embedded in the ID token to prevent replay attacks |
| code_challenge | no | Required for PKCE — SHA-256 hash of code_verifier |
| code_challenge_method | no | Always `S256` when using PKCE |

---

## OIDC Discovery — .well-known/openid-configuration

Instead of hardcoding provider endpoints, fetch the OpenID configuration from the discovery document. This returns all endpoints and supported features.

```typescript
// src/lib/oidc-discovery.ts
export interface OpenIdConfiguration {
  issuer: string
  authorization_endpoint: string
  token_endpoint: string
  userinfo_endpoint: string
  jwks_uri: string
  scopes_supported: string[]
  response_types_supported: string[]
  response_modes_supported: string[]
  grant_types_supported: string[]
  subject_types_supported: string[]
  id_token_signing_alg_values_supported: string[]
  token_endpoint_auth_methods_supported: string[]
}

export async function fetchOpenIdConfiguration(wellKnownUrl: string): Promise<OpenIdConfiguration> {
  const res = await fetch(wellKnownUrl)
  if (!res.ok) throw new Error(`Discovery failed: ${res.status}`)
  return res.json() as OpenIdConfiguration
}
```

Example discovery URL for Okta:

```
https://myorg.okta.com/.well-known/openid-configuration
```

Typical response:

```json
{
  "issuer": "https://myorg.okta.com",
  "authorization_endpoint": "https://myorg.okta.com/oauth2/v1/authorize",
  "token_endpoint": "https://myorg.okta.com/oauth2/v1/token",
  "userinfo_endpoint": "https://myorg.okta.com/oauth2/v1/userinfo",
  "jwks_uri": "https://myorg.okta.com/oauth2/v1/keys",
  "scopes_supported": ["openid", "profile", "email", "offline_access"],
  "response_types_supported": ["code", "token", "id_token", "code token", "code id_token", "token id_token", "code token id_token"],
  "grant_types_supported": ["authorization_code", "refresh_token", "implicit", "client_credentials"]
}
```

Cache this response. It rarely changes. Add a short TTL (e.g., 1 hour) or cache indefinitely with a manual refresh on failure.

---

## JWKS Endpoint for Token Validation

The JSON Web Key Set (JWKS) endpoint contains the public keys used to verify the signatures of tokens issued by the provider.

```typescript
// src/lib/jwks.ts
export interface JwksKey {
  kty: string
  kid: string
  use: string
  alg: string
  n: string
  e: string
}

export interface JwksResponse {
  keys: JwksKey[]
}

export async function fetchSigningKey(jwksUri: string, kid: string): Promise<CryptoKey> {
  const res = await fetch(jwksUri)
  const jwks: JwksResponse = await res.json()

  const key = jwks.keys.find((k) => k.kid === kid)
  if (!key) throw new Error(`No key found with kid: ${kid}`)

  return crypto.subtle.importKey(
    'jwk',
    key,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['decrypt']
  )
}
```

Use the JWKS to validate ID tokens received from the OIDC provider. In most cases, the backend that validates the access token will also validate the ID token — only implement JWKS validation on the frontend if you are parsing ID token claims directly.

---

## Scopes Reference

| Scope | Description |
|-------|-------------|
| openid | Required. Indicates this is an OpenID Connect request. |
| profile | Access to the user's name, preferred username, and profile photo |
| email | Access to the user's email address |
| offline_access | Request a refresh token. Required for long-lived sessions in SPAs |

Request `openid profile email offline_access` for a full-featured SSO implementation that supports session persistence.

---

## Auto-Redirect vs Manual Redirect Patterns

### Auto-Redirect Pattern

When `isAutoRedirect: true` is set on the OIDC client, the Blocks backend automatically redirects to the identity provider without showing a login page. Use this for seamless SSO experiences.

```typescript
// Redirect directly to Blocks Authorize — the backend handles the redirect to the provider
const params = new URLSearchParams({
  response_type: 'code',
  client_id: OIDC_CLIENT_ID,
  redirect_uri: CALLBACK_URL,
  scope: 'openid profile email offline_access',
  state: generateState(),
})

window.location.href = `${API_BASE}/idp/v1/Authentication/Authorize?${params.toString()}`
```

The backend detects the `isAutoRedirect` flag and immediately sends the user to the configured SSO provider.

### Manual Redirect Pattern

Use manual redirect when you need to show a provider selection screen or handle the consent flow yourself.

```typescript
// 1. Get available SSO providers
const loginOptions = await axiosClient.get('/idp/v1/Authentication/GetLoginOptions')
// loginOptions.data.loginOptions[].type === "SSO"
// loginOptions.data.loginOptions[].providers is an array of provider names

// 2. Show provider selection UI
// 3. On selection, build and redirect to the authorize URL
const authUrl = buildAuthorizeUrl({
  authorizationEndpoint: provider.authorizationEndpoint,
  clientId: OIDC_CLIENT_ID,
  redirectUri: CALLBACK_URL,
  state: generateState(),
  scope: 'openid profile email offline_access',
  nonce: generateNonce(),
  codeChallenge: pkceChallenge,
  codeChallengeMethod: 'S256',
})

window.location.href = authUrl
```

See `actions/get-login-options.md` for the login options contract.

### Full PKCE + Authorization Code Flow

```typescript
// src/lib/oidc-login.ts
import { buildAuthorizeUrl, generateState } from '@/lib/build-authorize-url'

async function startOidcLogin(providerConfig: {
  authorizationEndpoint: string
  clientId: string
  redirectUri: string
  wellKnownUrl?: string
}) {
  const state = generateState()
  const nonce = generateState()

  const { verifier, challenge } = await generatePkcePair()

  sessionStorage.setItem('oidc_state', state)
  sessionStorage.setItem('oidc_nonce', nonce)
  sessionStorage.setItem('oidc_verifier', verifier)

  const authUrl = buildAuthorizeUrl({
    authorizationEndpoint: providerConfig.authorizationEndpoint,
    clientId: providerConfig.clientId,
    redirectUri: providerConfig.redirectUri,
    state,
    nonce,
    scope: 'openid profile email offline_access',
    codeChallenge: challenge,
    codeChallengeMethod: 'S256',
  })

  window.location.href = authUrl
}

async function generatePkcePair(): Promise<{ verifier: string; challenge: string }> {
  const verifier = generateState()
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)

  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  return { verifier, challenge }
}
```

---

## Summary of Request Headers

| Header | Value | When |
|--------|-------|------|
| `x-blocks-key` | `$X_BLOCKS_KEY` | All requests |
| `Authorization` | `Bearer <accessToken>` | Authenticated requests (admin operations) |
| `Content-Type` | `application/json` | JSON body requests |
| `Content-Type` | `application/x-www-form-urlencoded` | Token endpoint only |
