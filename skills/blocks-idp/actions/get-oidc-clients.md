# Action: GetOIDCClients

## Purpose

Retrieves all OIDC client credentials for a given project.

## Endpoint

```
GET /idp/v1/Authentication/GetOIDCClients
```

## curl

```bash
curl -X GET 'https://api.blocks.example.com/idp/v1/Authentication/GetOIDCClients?ProjectKey=my-project' \
  -H 'Authorization: Bearer $ACCESS_TOKEN' \
  -H 'x-blocks-key: $X_BLOCKS_KEY'
```

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ProjectKey` | string | Yes | The project key |

## On Success (200)

```json
{
  "isSuccess": true,
  "errors": {},
  "oIDCClientCredentials": [
    {
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
  ]
}
```

## On Failure

```json
{
  "isSuccess": false,
  "errors": {
    "ProjectKey": "Project not found"
  }
}
```
