# Action: SaveClientCredential

## Purpose
Save or update a client credential for a project.

## Endpoint
```
POST /idp/v1/Authentication/SaveClientCredential
```

## curl
```bash
curl -X POST 'https://api.example.com/idp/v1/Authentication/SaveClientCredential' \
  -H 'Authorization: Bearer $ACCESS_TOKEN' \
  -H 'x-blocks-key: $X_BLOCKS_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "string",
    "roles": ["string"],
    "projectKey": "string"
  }'
```

## Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Client credential name |
| roles | string[] | Yes | Assigned roles |
| projectKey | string | Yes | Project key |

## On Success (200)
```json
{
  "isSuccess": true,
  "errors": []
}
```

## On Failure
| Status | Description |
|--------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 500 | Internal Server Error |
