# Action: get-schema-validations

## Purpose

Retrieves all validation rules for all fields on a specific schema.

---

## Endpoint

```
GET $API_BASE_URL/uds/v1/data-validations/by-schema-id?schemaId=$SCHEMA_ID&projectKey=$X_BLOCKS_KEY
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/data-validations/by-schema-id?schemaId=$SCHEMA_ID&projectKey=$X_BLOCKS_KEY" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

---

## Query Parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| schemaId | string | yes | Schema ID |
| projectKey | string | yes | Use $X_BLOCKS_KEY |

---

## On Success (200)

```json
{
  "isSuccess": true,
  "message": "string",
  "httpStatusCode": 200,
  "data": [
    {
      "itemId": "validation-id-1",
      "schemaId": "schema-id",
      "fieldName": "email",
      "validations": [
        { "type": 0, "value": null, "secondaryValue": null, "errorMessage": "Required", "isActive": true },
        { "type": 1, "value": null, "secondaryValue": null, "errorMessage": "Invalid email", "isActive": true }
      ]
    },
    {
      "itemId": "validation-id-2",
      "schemaId": "schema-id",
      "fieldName": "price",
      "validations": [
        { "type": 2, "value": "0", "secondaryValue": null, "errorMessage": "Price must be positive", "isActive": true }
      ]
    }
  ],
  "errors": []
}
```

---

## On Failure

| Status | Cause | Action |
|--------|-------|--------|
| 401 | Invalid token | Provide a valid ACCESS_TOKEN |
| 500 | Internal Server Error | Retry or contact support |
