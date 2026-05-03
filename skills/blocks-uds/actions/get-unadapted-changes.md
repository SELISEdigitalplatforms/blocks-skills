# Action: get-unadapted-changes

## Purpose

Retrieves pending schema changes that have not yet been applied to the GraphQL schema. Call reload-configuration to apply them.

---

## Endpoint

```
GET $API_BASE_URL/uds/v1/schemas/unadapted-change-logs?projectKey=$X_BLOCKS_KEY
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/schemas/unadapted-change-logs?projectKey=$X_BLOCKS_KEY" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

---

## Query Parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| projectKey | string | yes | Use $X_BLOCKS_KEY |

---

## On Success (200)

```json
{
  "isSuccess": true,
  "message": "string",
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

If `data.totalImpactedData > 0`, there are pending changes. Call reload-configuration.

---

## On Failure

| Status | Cause | Action |
|--------|-------|--------|
| 401 | Invalid token | Provide a valid ACCESS_TOKEN |
| 500 | Internal Server Error | Retry or contact support |
