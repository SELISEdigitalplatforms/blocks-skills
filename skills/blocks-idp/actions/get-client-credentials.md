# Action: GetClientCredentials

## Purpose
Retrieve all client credentials for a given project.

## Endpoint
```
GET /idp/v1/Authentication/GetClientCredentials
```

## curl
```bash
curl -X GET 'https://api.example.com/idp/v1/Authentication/GetClientCredentials?ProjectKey=string' \
  -H 'Authorization: Bearer $ACCESS_TOKEN' \
  -H 'x-blocks-key: $X_BLOCKS_KEY'
```

## Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| ProjectKey | string | Yes | Project key to filter credentials |

## On Success (200)
```json
[
  {
    "itemId": "string",
    "createdDate": "2024-01-01T00:00:00Z",
    "lastUpdatedDate": "2024-01-01T00:00:00Z",
    "createdBy": "string",
    "language": "string",
    "lastUpdatedBy": "string",
    "organizationIds": ["string"],
    "tags": ["string"],
    "name": "string",
    "clientSecret": "string",
    "roles": ["string"],
    "isActive": true,
    "audiences": ["string"]
  }
]
```

## On Failure
| Status | Description |
|--------|-------------|
| 400 | Bad Request - Invalid project key |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 500 | Internal Server Error |
