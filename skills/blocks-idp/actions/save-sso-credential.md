# Action: SaveSsoCredential

## Purpose
Creates or updates an SSO/SAML credential configuration for a project.

## Endpoint
```
POST /idp/v1/Authentication/SaveSsoCredential
```

## curl
```bash
curl -X POST 'https://api.example.com/idp/v1/Authentication/SaveSsoCredential' \
  -H 'Authorization: Bearer $ACCESS_TOKEN' \
  -H 'x-blocks-key: $X_BLOCKS_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "provider": "Okta",
    "audience": "https://app.example.com",
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "redirectUrl": "https://app.example.com/auth/callback",
    "wellKnownUrl": "https://your-okta-domain/.well-known/openid-configuration",
    "initialRoles": ["user", "admin"],
    "initialPermissions": ["read", "write"],
    "projectKey": "your-project-key",
    "isDisabled": false,
    "itemId": "optional-item-id-for-update",
    "ssoType": 0,
    "teamId": "team-123",
    "keyId": "key-id",
    "privateKey": "private-key-content"
  }'
```

## Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| provider | string | Yes | SSO provider name (e.g., Okta, AzureAD, Google) |
| audience | string | No | Expected audience in the token |
| clientId | string | Yes | OAuth/OIDC client ID |
| clientSecret | string | Yes | OAuth/OIDC client secret |
| redirectUrl | string | Yes | OAuth callback URL |
| wellKnownUrl | string | No | OpenID Connect discovery URL |
| initialRoles | string[] | No | Roles to assign on first login |
| initialPermissions | string[] | No | Permissions to assign on first login |
| projectKey | string | Yes | Project identifier |
| isDisabled | boolean | No | Whether the credential is disabled (default: false) |
| itemId | string | No | Include to update existing, omit to create |
| ssoType | integer | No | SSO type enum (0 = OIDC, 1 = SAML, etc.) |
| teamId | string | No | Team identifier for the credential |
| keyId | string | No | Key ID for JWT signing |
| privateKey | string | No | Private key content for JWT signing |

## On Success (200)
```json
{
  "isSuccess": true,
  "errors": {},
  "itemId": "created-or-updated-item-id"
}
```

## On Failure
| Status | Description |
|--------|-------------|
| 400 | Invalid request body or missing required fields |
| 401 | Unauthorized - invalid or missing access token |
| 403 | Forbidden - insufficient permissions |
| 404 | Project not found |
| 409 | Conflict - duplicate credential for provider |
| 500 | Internal server error |
