# Action: get-field-validation

## Purpose

Retrieves validation rules for a specific field on a schema.

---

## Endpoint

```
GET $API_BASE_URL/uds/v1/data-validations/by-schema-and-field?schemaId=$SCHEMA_ID&fieldName=$FIELD_NAME&projectKey=$X_BLOCKS_KEY
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/data-validations/by-schema-and-field?schemaId=$SCHEMA_ID&fieldName=email&projectKey=$X_BLOCKS_KEY" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

---

## Query Parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| schemaId | string | yes | Schema ID |
| fieldName | string | yes | Exact field name |
| projectKey | string | yes | Use $X_BLOCKS_KEY |

---

## On Success (200)

```json
{
  "isSuccess": true,
  "message": "string",
  "httpStatusCode": 200,
  "data": {
    "itemId": "validation-id",
    "schemaId": "schema-id",
    "fieldName": "email",
    "validations": [
      { "type": 0, "value": null, "secondaryValue": null, "errorMessage": "Required", "isActive": true },
      { "type": 1, "value": null, "secondaryValue": null, "errorMessage": "Invalid email", "isActive": true },
      { "type": 7, "value": null, "secondaryValue": null, "errorMessage": "Email already exists", "isActive": true }
    ],
    "createdDate": "2024-01-01T00:00:00Z",
    "lastUpdatedDate": "2024-01-02T00:00:00Z"
  },
  "errors": []
}
```

---

## On Failure

| Status | Cause | Action |
|--------|-------|--------|
| 401 | Invalid token | Provide a valid ACCESS_TOKEN |
| 404 | Validation not found | Check schemaId and fieldName |
