# Action: get-validations

## Purpose

Retrieves a paginated list of all validation rules across all schemas.

---

## Endpoint

```
GET $API_BASE_URL/uds/v1/data-validations
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/data-validations?SchemaId=$SCHEMA_ID&FieldName=email&ProjectKey=$X_BLOCKS_KEY&PageNo=1&PageSize=20" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

---

## Request Body / Query Parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| SchemaId | string | no | Filter by schema ID |
| FieldName | string | no | Filter by field name |
| Keyword | string | no | General keyword search |
| ProjectKey | string | yes | Use $X_BLOCKS_KEY |
| PageNo | integer | no | Default: 1 |
| PageSize | integer | no | Default: 20 |
| SortBy | string | no | Sort field |
| SortDescending | boolean | no | Sort direction |

---

## On Success (200)

```json
{
  "isSuccess": true,
  "message": "string",
  "httpStatusCode": 200,
  "data": {
    "totalCount": 10,
    "items": [
      {
        "itemId": "validation-id",
        "schemaId": "schema-id",
        "fieldName": "email",
        "validations": [
          { "type": 0, "value": null, "secondaryValue": null, "errorMessage": "Required", "isActive": true },
          { "type": 1, "value": null, "secondaryValue": null, "errorMessage": "Invalid email", "isActive": true }
        ]
      }
    ]
  },
  "errors": []
}
```

---

## On Failure

| Status | Cause | Action |
|--------|-------|--------|
| 401 | Invalid token | Verify ACCESS_TOKEN is valid and not expired |
| 500 | Internal Server Error | Server-side issue, retry later |
