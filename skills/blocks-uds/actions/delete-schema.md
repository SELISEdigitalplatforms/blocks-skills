# Action: delete-schema

## Purpose

Deletes a schema definition and its backing MongoDB collection. This action cannot be undone.

---

## Endpoint

```
DELETE $API_BASE_URL/uds/v1/schemas?id=$SCHEMA_ID&projectKey=$X_BLOCKS_KEY
```

---

## curl

```bash
curl --location --request DELETE "$API_BASE_URL/uds/v1/schemas?id=$SCHEMA_ID&projectKey=$X_BLOCKS_KEY" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

---

## Query Parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | Schema ID |
| projectKey | string | yes | Use $X_BLOCKS_KEY |

---

## On Success (200)

```json
{
  "isSuccess": true,
  "message": "Schema deleted successfully",
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
| 400 | Invalid schema ID | Provide a valid schema ID |
| 401 | Invalid token | Provide a valid ACCESS_TOKEN |
| 403 | Missing cloudadmin role | Ensure user has cloudadmin role |
