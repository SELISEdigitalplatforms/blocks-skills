# Action: create-validation

## Purpose

Creates validation rules for a specific field on a schema. Rules are enforced on data writes via GraphQL.

---

## Endpoint

```
POST $API_BASE_URL/uds/v1/data-validations
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
    "schemaId": "$SCHEMA_ID",
    "fieldName": "email",
    "validations": [
      {
        "type": 0,
        "value": null,
        "secondaryValue": null,
        "errorMessage": "Email is required",
        "isActive": true
      },
      {
        "type": 1,
        "value": null,
        "secondaryValue": null,
        "errorMessage": "Must be a valid email address",
        "isActive": true
      },
      {
        "type": 7,
        "value": null,
        "secondaryValue": null,
        "errorMessage": "This email is already in use",
        "isActive": true
      }
    ]
  }'
```

---

## Request Body / Query Parameters

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| projectKey | string | yes | Use $X_BLOCKS_KEY |
| schemaId | string | yes | Schema ID from define-schema |
| fieldName | string | yes | Exact field name as defined in schema |
| validations | array | yes | One or more ValidationRuleRequest objects |

---

## ValidationRuleRequest

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| type | integer | yes | ValidationType: 0=Required, 1=Email, 2=Min, 3=Max, 4=MinLength, 5=MaxLength, 6=Regex, 7=Unique, 8=Pattern, 9=Custom, 10=Range, 11=(reserved) |
| value | any | no | Primary constraint value |
| secondaryValue | any | no | For range validations |
| errorMessage | string | yes | Message shown on validation failure |
| isActive | boolean | yes | Must be true to activate |

---

## On Success (200)

```json
{
  "isSuccess": true,
  "message": "Validation created successfully",
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
| 400 | Invalid validation type or missing fields | Verify validation types and required fields |
| 401 | Invalid token | Verify ACCESS_TOKEN is valid and not expired |
| 403 | Missing cloudadmin role | Ensure user has cloudadmin permissions |
| 404 | Schema not found | Verify schemaId exists |
