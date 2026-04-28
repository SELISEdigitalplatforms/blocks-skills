# Action: GetSsoCredentials

## Purpose
Retrieves all SSO/SAML credential configurations for a project.

## Endpoint
```
GET /idp/v1/Authentication/GetSsoCredentials
```

## curl
```bash
curl -X GET 'https://api.example.com/idp/v1/Authentication/GetSsoCredentials?ProjectKey=your-project-key' \
  -H 'Authorization: Bearer $ACCESS_TOKEN' \
  -H 'x-blocks-key: $X_BLOCKS_KEY'
```

## Query Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| ProjectKey | string | Yes | Project identifier |

## On Success (200)
```json
{
  "isSuccess": true,
  "errors": {},
  "items": [
    {
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
      "getEmailUrl": "https://your-okta-domain/oauth2/v1/userinfo/email",
      "scope": "openid profile email",
      "isDisabled": false,
      "ssoType": 0,
      "sendAsResponse": false
    }
  ]
}
```

### SocialLoginCredential Schema

| Field | Type | Description |
|-------|------|-------------|
| itemId | string | Unique identifier |
| provider | string | SSO provider name |
| clientId | string | OAuth client ID |
| clientSecret | string | OAuth client secret |
| authorizationUrl | string | Authorization endpoint |
| tokenUrl | string | Token endpoint |
| getProfileUrl | string | Userinfo endpoint |
| redirectUrl | string | OAuth callback URL |
| wellKnownUrl | string | OIDC discovery URL |
| getEmailUrl | string | Email lookup endpoint |
| scope | string | OAuth scopes |
| ssoType | integer | SSO type enum |
| isDisabled | boolean | Whether credential is disabled |
| sendAsResponse | boolean | Whether to send credential in response |
| audience | string | Expected audience |
| createdDate | string | Creation timestamp |
| lastUpdatedDate | string | Last update timestamp |
| createdBy | string | Creator user ID |
| lastUpdatedBy | string | Last updater user ID |
| language | string | Language code |
| organizationIds | string[] | Associated organization IDs |
| tags | string[] | Credential tags |

## On Failure
| Status | Description |
|--------|-------------|
| 400 | Invalid query parameters |
| 401 | Unauthorized - invalid or missing access token |
| 403 | Forbidden - insufficient permissions |
| 404 | Project not found |
| 500 | Internal server error |
