# Action: update-schema-definition

## Purpose

Updates an existing schema definition including its fields. For metadata-only updates, use `update-schema`. For field-only updates, use `save-schema-fields`.

---

## Endpoint

```
PUT $API_BASE_URL/uds/v1/schemas/define
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/schemas/define" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --request PUT \
  --data '{
    "collectionName": "products",
    "schemaName": "Product",
    "projectKey": "$X_BLOCKS_KEY",
    "schemaType": 1,
    "projectShortKey": "MP",
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
    "itemId": "$SCHEMA_ID"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| collectionName | string | no | Updated collection name |
| schemaName | string | no | Updated display name |
| projectKey | string | yes | Use `$X_BLOCKS_KEY` |
| schemaType | integer | no | `1`=Entity, `2`=Dto |
| projectShortKey | string | no | Short key |
| fields | array | no | Complete field list if updating fields |
| itemId | string | yes | Schema ID |

---

## On Success (200)

```json
{
  "isSuccess": true,
  "message": "Schema updated successfully",
  "httpStatusCode": 200,
  "data": {
    "acknowledged": true,
    "itemId": "$SCHEMA_ID",
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
| 400 | Invalid fields | Check field types and constraints |
| 401 | Invalid token | Check ACCESS_TOKEN validity |
| 403 | Missing cloudadmin role | Assign cloudadmin role |

---

## Next Steps

Call `reload-configuration` after updating a schema.
