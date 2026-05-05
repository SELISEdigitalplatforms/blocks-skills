# Action: get-schema-info

## Purpose

Lists all Entity-type schema collections (display name + collection name). Alias for `get-schema-collections`.

---

## Endpoint

```
GET $API_BASE_URL/uds/v1/schemas/info?projectKey=$X_BLOCKS_KEY
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/schemas/info?projectKey=$X_BLOCKS_KEY" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

---

## Query Parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| projectKey | string | yes | Use `$X_BLOCKS_KEY` |

---

## On Success (200)

```json
{
  "isSuccess": true,
  "message": "string",
  "httpStatusCode": 200,
  "data": {
    "collections": [
      { "name": "Product", "collectionName": "products", "description": "Product catalog", "type": "Entity" },
      { "name": "Order", "collectionName": "orders", "description": "Order records", "type": "Entity" }
    ]
  },
  "errors": []
}
```

---

## On Failure

| Status | Cause | Action |
|--------|-------|--------|
| 401 | Invalid token | Provide a valid ACCESS_TOKEN |
| 500 | Internal Server Error | Retry or contact support |
