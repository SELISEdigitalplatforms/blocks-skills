# Action: GetOIDCClient

## Purpose

Retrieves a single OIDC client credential by project key and client ID.

## Endpoint

```
GET /idp/v1/Authentication/GetOIDCClient
```

## curl

```bash
curl -X GET 'https://api.blocks.example.com/idp/v1/Authentication/GetOIDCClient?ProjectKey=my-project&ClientId=client-uuid-string' \
  -H 'Authorization: Bearer $ACCESS_TOKEN' \
  -H 'x-blocks-key: $X_BLOCKS_KEY'
```

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ProjectKey` | string | Yes | The project key |
| `ClientId` | string | Yes | The OIDC client item ID |

## On Success (200)

```json
{
  "isSuccess": true,
  "errors": {},
  "oIDCClientCredential": {
    "itemId": "client-uuid-string",
    "createdDate": "2024-01-01T00:00:00Z",
    "lastUpdatedDate": "2024-01-01T00:00:00Z",
    "createdBy": "user-id",
    "language": "en",
    "lastUpdatedBy": "user-id",
    "organizationIds": ["org-id"],
    "tags": ["tag1"],
    "clientSecret": "secret-value",
    "redirectUri": "https://app.example.com/callback",
    "scope": "openid profile email",
    "audience": "https://api.example.com",
    "isAutoRedirect": true,
    "clientLogoUrl": "https://app.example.com/logo.png",
    "clientDisplayName": "My Application",
    "clientBrandColor": "#0066CC"
  }
}
```

## On Failure

```json
{
  "isSuccess": false,
  "errors": {
    "ClientId": "Client not found"
  }
}
```
