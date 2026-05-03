# Action: export-schema

## Purpose

Initiates an asynchronous export of schema definitions to a JSON file. Returns immediately with acknowledgement. The exported file is delivered via notification using messageCoRelationId.

---

## Endpoint

```
POST $API_BASE_URL/uds/v1/schema-exchange/export
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/schema-exchange/export" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "projectKey": "$X_BLOCKS_KEY",
    "messageCoRelationId": "550e8400-e29b-41d4-a716-446655440000",
    "exportOption": 3
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| projectKey | string | yes | Use $X_BLOCKS_KEY |
| messageCoRelationId | string | no | UUID for tracking notification |
| exportOption | integer | no | 0=Schema, 1=AccessPolicies, 2=ValidationRules, 3=All. Default: 3 |

---

## On Success (200)

```json
{
  "isSuccess": true,
  "message": "Export initiated successfully",
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
| 400 | Invalid exportOption | Use a valid exportOption value (0-3) |
| 401 | Invalid token | Provide a valid ACCESS_TOKEN |
| 403 | Missing cloudadmin role | Ensure user has cloudadmin role |
