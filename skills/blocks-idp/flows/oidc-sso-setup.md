# Flow: oidc-sso-setup

## Trigger

User wants to configure OIDC client, SSO provider, or manage authorization for an application.

> "set up an OIDC client for my app"
> "configure SSO with Okta/Azure AD"
> "add Google login to my application"
> "manage OIDC clients"
> "enable or disable SSO for my project"
> "get the authorize endpoint URL"

---

## Pre-flight Questions

Before starting, confirm:

1. What is the application type? (web app, SPA, mobile, server-to-server)
2. For OIDC: What redirect URIs should be allowed? (e.g., `http://localhost:3000/api/auth/callback`)
3. For SSO: Which provider? (Okta, Azure AD, Google Workspace, GitHub, custom)
4. What scopes are needed? (`openid profile email offline_access` are standard)
5. Is this a new client/credential or updating an existing one?

---

## Flow Steps

### Step 1 — Discover Existing Configuration

Check if the project already has OIDC clients or SSO credentials configured:

```bash
# List existing OIDC clients
curl "$API_BASE_URL/idp/v1/Authentication/GetOIDCClients?ProjectKey=$X_BLOCKS_KEY" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY"

# List existing SSO credentials
curl "$API_BASE_URL/idp/v1/Authentication/GetSsoCredentials?ProjectKey=$X_BLOCKS_KEY" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY"

# Get available login options
curl "$API_BASE_URL/idp/v1/Authentication/GetLoginOptions" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

### Step 2 — Create or Update OIDC Client

For web apps and SPAs, create an OIDC client registration:

```bash
curl --location "$API_BASE_URL/idp/v1/Authentication/SaveOIDCClient" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "projectKey": "'$X_BLOCKS_KEY'",
    "redirectUri": "https://yourapp.com/api/auth/callback",
    "scope": "openid profile email offline_access",
    "audience": "https://yourapi.com",
    "isAutoRedirect": true,
    "clientDisplayName": "My Application",
    "clientBrandColor": "#1976d2"
  }'
```

Store the returned `clientId` (from the response `itemId`) and `clientSecret` (from the OIDC client credential object).

### Step 3 — Configure SSO Credential (Provider-Based)

For SSO with an external identity provider (Okta, Azure AD, Google):

```bash
curl --location "$API_BASE_URL/idp/v1/Authentication/SaveSsoCredential" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "projectKey": "'$X_BLOCKS_KEY'",
    "provider": "okta",
    "audience": "https://yourapp.okta.com",
    "clientId": "OKTA_CLIENT_ID",
    "clientSecret": "OKTA_CLIENT_SECRET",
    "wellKnownUrl": "https://yourapp.okta.com/.well-known/openid-configuration",
    "redirectUrl": "https://yourapp.com/api/auth/callback",
    "scope": "openid profile email",
    "initialRoles": ["user"],
    "isDisabled": false
  }'
```

### Step 4 — Build the Authorize URL

Construct the OIDC authorization URL for the redirect-based flow:

```
GET $API_BASE_URL/idp/v1/Authentication/Authorize
```

Query parameters:
| Param | Value |
|-------|-------|
| response_type | `code` |
| client_id | The client ID from Step 2 or SSO config |
| redirect_uri | Your registered callback URL |
| scope | `openid profile email offline_access` |
| state | Random string for CSRF protection (generate fresh UUID per login) |
| nonce | Random string for replay protection |

Example URL construction (JavaScript):
```javascript
const params = new URLSearchParams({
  response_type: 'code',
  client_id: 'your-client-id',
  redirect_uri: 'https://yourapp.com/api/auth/callback',
  scope: 'openid profile email offline_access',
  state: crypto.randomUUID(),
  nonce: crypto.randomUUID()
});
const authorizeUrl = `${apiBaseUrl}/idp/v1/Authentication/Authorize?${params}`;
window.location.href = authorizeUrl;
```

### Step 5 — Exchange Code for Token

After the redirect, exchange the authorization code for tokens:

```bash
curl --location "$API_BASE_URL/idp/v1/Authentication/Token" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "grant_type=authorization_code" \
  --data-urlencode "code=AUTHORIZATION_CODE_FROM_REDIRECT" \
  --data-urlencode "redirect_uri=https://yourapp.com/api/auth/callback" \
  --data-urlencode "client_id=your-client-id"
```

### Step 6 — Get User Info

Use the access token to get the authenticated user's profile:

```bash
curl "$API_BASE_URL/idp/v1/Authentication/GetUserInfo" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

### Step 7 — Configure Signup Settings

Control which signup methods are available for the project:

```bash
curl --location "$API_BASE_URL/idp/v1/Iam/SaveSignUpSetting" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "projectKey": "'$X_BLOCKS_KEY'",
    "isEmailPasswordSignUpEnabled": true,
    "isSSoSignUpEnabled": true
  }'
```

### Step 8 — Enable/Disable SSO

Toggle SSO availability:

```bash
curl --location "$API_BASE_URL/idp/v1/Authentication/UpdateStatus" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "itemId": "SSO_CREDENTIAL_ITEM_ID",
    "isEnabled": true,
    "projectKey": "'$X_BLOCKS_KEY'"
  }'
```

---

## OIDC Discovery

For dynamic configuration, fetch the OpenID configuration document:

```bash
curl "$API_BASE_URL/idp/v1/.well-known/openid-configuration?projectKey=$X_BLOCKS_KEY"
```

This returns issuer, authorization_endpoint, token_endpoint, userinfo_endpoint, jwks_uri, etc.

For token validation, fetch the JWKS:

```bash
curl "$API_BASE_URL/idp/v1/.well-known/jwks.json?projectKey=$X_BLOCKS_KEY"
```

---

## Delete OIDC Client or SSO Credential

To remove a configuration:

```bash
# Delete OIDC client
curl --location "$API_BASE_URL/idp/v1/Authentication/DeleteOIDCClient" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "projectKey": "'$X_BLOCKS_KEY'",
    "itemId": "CLIENT_ITEM_ID"
  }'

# Delete SSO credential
curl --location "$API_BASE_URL/idp/v1/Authentication/DeleteSsoCredential" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "projectKey": "'$X_BLOCKS_KEY'",
    "itemId": "SSO_ITEM_ID"
  }'
```

---

## Reference

- `references/oidc-sso-setup.md` — Framework-specific OIDC implementation guides
- `references/consent-flow.md` — UserAcknowledgement for consent handling
- `references/token-refresh.md` — Token refresh strategy
- `actions/save-oidc-client.md`
- `actions/get-oidc-clients.md`
- `actions/delete-oidc-client.md`
- `actions/save-sso-credential.md`
- `actions/get-sso-credentials.md`
- `actions/delete-sso-credential.md`
- `actions/update-sso-status.md`
- `actions/authorize.md`
- `actions/get-openid-configuration.md`
- `actions/get-jwks.md`
- `actions/get-login-options.md`
