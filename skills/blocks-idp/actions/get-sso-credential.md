# Action: GetSsoCredential

## Purpose
Retrieves a single SSO/SAML credential configuration by project key and item ID.

## Endpoint
```
GET /idp/v1/Authentication/GetSsoCredential
```

## curl
```bash
curl -X GET 'https://api.example.com/idp/v1/Authentication/GetSsoCredential?ProjectKey=your-project-key&ItemId=credential-item-id' \
  -H 'Authorization: Bearer $ACCESS_TOKEN' \
  -H 'x-blocks-key: $X_BLOCKS_KEY'
```

## Query Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| ProjectKey | string | Yes | Project identifier |
| ItemId | string | Yes | Credential item identifier |

## On Success (200)
```json
{
  "isSuccess": true,
  "errors": {},
  "itemId": "credential-item-id",
  "createdDate": "2024-01-01T00:00:00Z",
  "lastUpdatedDate": "2024-01-01T00:00:00Z",
  "createdBy": "user-id",
  "language": "en",
  "lastUpdatedBy": "user-id",
  "organizationIds": ["org-123"],
  "tags": ["sso", "production"],
  "provider": "Okta",
  "audience": "https://app.example.com",
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "authorizationUrl": "https://your-okta-domain/oauth2/v1/authorize",
  "tokenUrl": "https://your-okta-domain/oauth2/v1/token",
  "getProfileUrl": "https://your-okta-domain/oauth2/v1/userinfo",
  "redirectUrl": "https://app.example.com/auth/callback",
  "wellKnownUrl": "https://your-okta-domain/.well-known/openid-configuration",
  "scope": "openid profile email",
  "userRoles": [
    {
      "itemId": "role-item-id",
      "name": "User",
      "slug": "user",
      "description": "Standard user role",
      "count": 10
    }
  ],
  "userPermissions": [
    {
      "itemId": "perm-item-id",
      "name": "Read",
      "type": 0,
      "description": "Read access permission",
      "resource": "documents"
    }
  ],
  "isDisabled": false,
  "sendAsResponse": false
}
```

## On Failure
| Status | Description |
|--------|-------------|
| 400 | Invalid query parameters |
| 401 | Unauthorized - invalid or missing access token |
| 403 | Forbidden - insufficient permissions |
| 404 | Credential not found |
| 500 | Internal server error |
