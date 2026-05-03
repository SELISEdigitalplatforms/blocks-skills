# Action: get-schema-by-collection

## Purpose

Retrieves the full schema definition including all fields by the schema's display name.

---

## Endpoint

```
GET $API_BASE_URL/uds/v1/schemas/info-by-name?schemaName=$SCHEMA_NAME&projectKey=$X_BLOCKS_KEY
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/schemas/info-by-name?schemaName=Product&projectKey=$X_BLOCKS_KEY" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

---

## Query Parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| schemaName | string | yes | Schema display name (e.g. Product) |
| projectKey | string | yes | Use $X_BLOCKS_KEY |

---

## On Success (200)

```json
{
  "isSuccess": true,
  "message": "string",
  "httpStatusCode": 200,
  "data": {
    "name": "Product",
    "collectionName": "products",
    "description": "Product catalog schema",
    "type": "Entity",
    "fields": [
      { "name": "title", "type": "String", "description": "Product title", "fields": [] },
      { "name": "price", "type": "Number", "description": "Price in USD", "fields": [] }
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
| 404 | Schema not found | Check schema name |
