# Action: DeleteClientCredential

## Purpose
Delete a client credential from a project.

## Endpoint
```
POST /idp/v1/Authentication/DeleteClientCredential
```

## curl
```bash
curl -X POST 'https://api.example.com/idp/v1/Authentication/DeleteClientCredential' \
  -H 'Authorization: Bearer $ACCESS_TOKEN' \
  -H 'x-blocks-key: $X_BLOCKS_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "itemId": "string",
    "projectKey": "string"
  }'
```

## Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| itemId | string | Yes | Client credential item ID |
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
| 404 | Not Found - Credential not found |
| 500 | Internal Server Error |
