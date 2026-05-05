# Action: update-validation

## Purpose

Updates validation rules for a field. Replaces all existing rules with the new set.

---

## Endpoint

```
PUT $API_BASE_URL/uds/v1/data-validations
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/data-validations" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "projectKey": "$X_BLOCKS_KEY",
    "itemId": "$VALIDATION_ITEM_ID",
    "schemaId": "$SCHEMA_ID",
    "fieldName": "email",
    "validations": [
      { "type": 0, "value": null, "secondaryValue": null, "errorMessage": "Required", "isActive": true },
      { "type": 1, "value": null, "secondaryValue": null, "errorMessage": "Invalid email", "isActive": true }
    ]
  }'
```

---

## Request Body / Query Parameters

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| projectKey | string | yes | Use $X_BLOCKS_KEY |
| itemId | string | yes | Validation ID from get-validation |
| schemaId | string | yes | Schema ID |
| fieldName | string | yes | Field name |
| validations | array | yes | Complete new validation list (replaces existing) |

---

## On Success (200)

```json
{
  "isSuccess": true,
  "message": "Validation updated successfully",
  "httpStatusCode": 200,
  "data": {
    "acknowledged": true,
    "itemId": "$VALIDATION_ITEM_ID",
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
| 400 | Invalid fields | Verify all fields are valid and complete |
| 401 | Invalid token | Verify ACCESS_TOKEN is valid and not expired |
| 403 | Missing cloudadmin role | Ensure user has cloudadmin permissions |
