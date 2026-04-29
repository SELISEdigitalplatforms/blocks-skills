# Action: UpdateStatus

## Purpose
Enables or disables an SSO/SAML credential.

## Endpoint
```
POST /idp/v1/Authentication/UpdateStatus
```

## curl
```bash
curl -X POST 'https://api.example.com/idp/v1/Authentication/UpdateStatus' \
  -H 'Authorization: Bearer $ACCESS_TOKEN' \
  -H 'x-blocks-key: $X_BLOCKS_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "itemId": "credential-item-id",
    "isEnabled": true,
    "projectKey": "your-project-key"
  }'
```

## Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| itemId | string | Yes | Credential item identifier |
| isEnabled | boolean | Yes | Set to true to enable, false to disable |
| projectKey | string | Yes | Project identifier |

## On Success (200)
```json
{
  "isSuccess": true,
  "errors": {}
}
```

## On Failure
| Status | Description |
|--------|-------------|
| 400 | Invalid request body or missing required fields |
| 401 | Unauthorized - invalid or missing access token |
| 403 | Forbidden - insufficient permissions |
| 404 | Credential not found |
| 500 | Internal server error |
