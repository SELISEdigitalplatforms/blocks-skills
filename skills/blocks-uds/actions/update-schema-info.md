# Action: update-schema-info

## Purpose

Updates existing schema metadata. To update fields, use save-schema-fields instead.

---

## Endpoint

```
PUT $API_BASE_URL/uds/v1/schemas/info
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/schemas/info" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --request PUT \
  --data '{
    "collectionName": "products",
    "schemaName": "Product",
    "projectKey": "$X_BLOCKS_KEY",
    "schemaType": 1,
    "itemId": "$SCHEMA_ID"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| collectionName | string | no | Updated collection name |
| schemaName | string | no | Updated display name |
| projectKey | string | yes | Use $X_BLOCKS_KEY |
| schemaType | integer | no | 1=Entity, 2=Dto |
| itemId | string | yes | Schema ID |

---

## On Success (200)

```json
{
  "isSuccess": true,
  "message": "Schema info updated successfully",
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
