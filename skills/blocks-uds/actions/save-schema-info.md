# Action: save-schema-info

## Purpose

Saves field definitions for a schema. REPLACES all existing fields — provide complete field list. Use for initial field creation or full field replacement.

---

## Endpoint

```
POST $API_BASE_URL/uds/v1/schemas/info
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/schemas/info" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "collectionName": "products",
    "schemaName": "Product",
    "projectKey": "$X_BLOCKS_KEY",
    "schemaType": 1,
    "fields": [
      {
        "name": "title",
        "type": "String",
        "isArray": false,
        "isPIIData": false,
        "isUniqueData": false,
        "description": "Product title"
      },
      {
        "name": "price",
        "type": "Number",
        "isArray": false,
        "isPIIData": false,
        "isUniqueData": false,
        "description": "Product price in USD"
      }
    ]
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| collectionName | string | yes | MongoDB collection name |
| schemaName | string | yes | Display name |
| projectKey | string | yes | Use $X_BLOCKS_KEY |
| schemaType | integer | no | 1=Entity, 2=Dto |
| fields | array | yes | Complete field list (REPLACES existing) |

---

## On Success (200)

```json
{
  "isSuccess": true,
  "message": "Schema info saved successfully",
  "httpStatusCode": 200,
  "data": {
    "acknowledged": true,
    "itemId": null,
    "totalImpactedData": 0,
    "message": "string"
  },
  "errors": []
}
```

---

## On Failure

| Status | Cause | Action |
|--------|-------|--------|
| 400 | Invalid fields | Check request body |
| 401 | Invalid token | Provide a valid ACCESS_TOKEN |
| 403 | Missing cloudadmin role | Ensure user has cloudadmin role |

Next Steps: Call reload-configuration after saving fields.
