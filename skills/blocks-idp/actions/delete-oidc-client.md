# Action: DeleteOIDCClient

## Purpose

Deletes an OIDC client credential by project key and client ID.

## Endpoint

```
POST /idp/v1/Authentication/DeleteOIDCClient
```

## curl

```bash
curl -X POST 'https://api.blocks.example.com/idp/v1/Authentication/DeleteOIDCClient' \
  -H 'Authorization: Bearer $ACCESS_TOKEN' \
  -H 'x-blocks-key: $X_BLOCKS_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "projectKey": "my-project",
    "itemId": "client-uuid-string"
  }'
```

## Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `projectKey` | string | Yes | The project key |
| `itemId` | string | Yes | The OIDC client item ID to delete |

## On Success (200)

```json
{
  "isSuccess": true,
  "errors": {}
}
```

## On Failure

```json
{
  "isSuccess": false,
  "errors": {
    "itemId": "Client not found"
  }
}
```
