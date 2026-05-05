# Action: get-validation

## Purpose

Retrieves a single validation rule by its ID.

---

## Endpoint

```
GET $API_BASE_URL/uds/v1/data-validations/get-by-id?validationId=$VALIDATION_ID&projectKey=$X_BLOCKS_KEY
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/data-validations/get-by-id?validationId=$VALIDATION_ID&projectKey=$X_BLOCKS_KEY" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

---

## Request Body / Query Parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| validationId | string | yes | Validation ID |
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
      { "type": 1, "value": null, "secondaryValue": null, "errorMessage": "Invalid email", "isActive": true }
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
| 401 | Invalid token | Verify ACCESS_TOKEN is valid and not expired |
| 404 | Validation not found | Verify validationId exists |
