# Action: define-schema

## Purpose

Creates a new schema definition including fields. At least one field is required in the fields array.

---

## Endpoint

```
POST $API_BASE_URL/uds/v1/schemas/define
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/schemas/define" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "collectionName": "products",
    "schemaName": "Product",
    "projectKey": "$X_BLOCKS_KEY",
    "schemaType": 1,
    "description": "Product catalog schema",
    "fields": [
      {
        "name": "title",
        "type": "String",
        "isArray": false,
        "isPIIData": false,
        "isUniqueData": false,
        "description": "Product title"
      }
    ]
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| collectionName | string | yes | MongoDB collection — lowercase, no spaces |
| schemaName | string | yes | Display name (e.g. Product) |
| projectKey | string | yes | Use $X_BLOCKS_KEY, NOT $PROJECT_SLUG |
| schemaType | integer | yes | 1=Entity, 2=Dto |
| description | string | no | Optional description |
| projectShortKey | string | no | Short key |
| fields | array | yes | At least one FieldDefinitionRequest required |

### FieldDefinitionRequest

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes | Field name |
| type | string | yes | String, Number, Boolean, Date, ObjectId, Object, Array |
| isArray | boolean | yes | Set true for array fields |
| isPIIData | boolean | no | Mark as PII |
| isUniqueData | boolean | no | Mark as unique |
| description | string | no | Field description |

---

## On Success (200)

```json
{
  "isSuccess": true,
  "message": "Schema defined successfully",
  "httpStatusCode": 200,
  "data": {
    "acknowledged": true,
    "itemId": "64a1b2c3d4e5f60001234567",
    "totalImpactedData": 0,
    "message": "string"
  },
  "errors": []
}
```

Store `data.data.itemId` as $SCHEMA_ID. Requires reload-configuration.

---

## On Failure

| Status | Cause | Action |
|--------|-------|--------|
| 400 | Fields_Are_Required (empty fields array) | Provide at least one field |
| 400 | duplicate collectionName | Use a unique collectionName |
| 400 | wrong projectKey | Use $X_BLOCKS_KEY |
| 401 | Invalid token | Provide a valid ACCESS_TOKEN |
| 403 | Missing cloudadmin role | Ensure user has cloudadmin role |

Next Steps: save-schema-fields to add fields, then reload-configuration
