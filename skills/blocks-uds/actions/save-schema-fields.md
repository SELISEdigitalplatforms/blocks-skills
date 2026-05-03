# Action: save-schema-fields

## Purpose

Adds or updates fields on a schema. REPLACES all existing fields — always provide the complete field list. Use deletableFieldNames to remove specific fields.

---

## Endpoint

```
POST $API_BASE_URL/uds/v1/schemas/fields
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/schemas/fields" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "schemaDefinitionItemId": "$SCHEMA_ID",
    "deletableFieldNames": [],
    "projectShortKey": "MP",
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
        "description": "Product price"
      }
    ],
    "projectKey": "$X_BLOCKS_KEY"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| schemaDefinitionItemId | string | yes | Schema ID |
| deletableFieldNames | array | no | Field names to remove |
| projectShortKey | string | no | Short key |
| fields | array | yes | Complete field list (REPLACES existing) |
| projectKey | string | yes | Use $X_BLOCKS_KEY |

---

## On Success (200)

```json
{
  "isSuccess": true,
  "message": "Fields saved successfully",
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

WARNING: This REPLACES all fields. Always provide complete field list. Missing fields from the list will be removed.

Next Steps: Call reload-configuration after saving fields.
