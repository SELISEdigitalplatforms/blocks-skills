# Action: delete-mock-data

## Purpose

Deletes mock/test data from specified schemas. Used to clean up test data.

---

## Endpoint

```
POST $API_BASE_URL/uds/v1/data-manage/mock-data
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/data-manage/mock-data" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "projectKey": "$X_BLOCKS_KEY",
    "schemaNames": ["Product", "Order"]
  }'
```

---

## Request Body / Query Parameters

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| projectKey | string | yes | Use $X_BLOCKS_KEY |
| schemaNames | array | yes | Array of schema names to clear |

---

## On Success (200)

```json
{
  "isSuccess": true,
  "message": "Mock data deleted successfully",
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
| 400 | Missing required fields | Ensure projectKey and schemaNames are provided |
| 401 | Invalid token | Verify ACCESS_TOKEN is valid and not expired |
| 403 | Missing cloudadmin role | Ensure user has cloudadmin permissions |
