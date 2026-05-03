# Action: get-schema

## Purpose

Retrieves a single schema by its ID, including all field definitions, access policies, and metadata.

---

## Endpoint

```
GET $API_BASE_URL/uds/v1/schemas/get-by-id?id=$SCHEMA_ID&projectKey=$X_BLOCKS_KEY
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/schemas/get-by-id?id=$SCHEMA_ID&projectKey=$X_BLOCKS_KEY" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

---

## Query Parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | Schema ID |
| projectKey | string | yes | Use $X_BLOCKS_KEY |

---

## On Success (200)

```json
{
  "isSuccess": true,
  "message": "string",
  "httpStatusCode": 200,
  "data": {
    "id": "schema-id",
    "schemaName": "Product",
    "collectionName": "products",
    "schemaType": 1,
    "projectKey": "my-project",
    "readAccessLevel": 2,
    "writeAccessLevel": 2,
    "fields": [
      {
        "name": "title",
        "type": "String",
        "isArray": false,
        "isPIIData": false,
        "isUniqueData": false,
        "description": "Product title"
      }
    ],
    "readPolicies": [],
    "writePolicies": []
  },
  "errors": []
}
```

---

## On Failure

| Status | Cause | Action |
|--------|-------|--------|
| 401 | Invalid token | Provide a valid ACCESS_TOKEN |
| 403 | Missing cloudadmin role | Ensure user has cloudadmin role |
| 404 | Schema not found | Check schema ID |
