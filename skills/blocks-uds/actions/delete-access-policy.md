# Action: delete-access-policy

## Purpose

Deletes a data access policy by its itemId.

---

## Endpoint

```
DELETE $API_BASE_URL/uds/v1/data-access/policy/delete?itemId=$POLICY_ITEM_ID&projectKey=$X_BLOCKS_KEY
```

---

## curl

```bash
curl --location --request DELETE "$API_BASE_URL/uds/v1/data-access/policy/delete?itemId=$POLICY_ITEM_ID&projectKey=$X_BLOCKS_KEY" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

---

## Request Body / Query Parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| itemId | string | yes | Policy ID |
| projectKey | string | yes | Use $X_BLOCKS_KEY |

---

## On Success (200)

```json
{
  "isSuccess": true,
  "message": "Access policy deleted successfully",
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
| 400 | Missing itemId | Ensure itemId query parameter is provided |
| 401 | Invalid token | Verify ACCESS_TOKEN is valid and not expired |
| 403 | Missing cloudadmin role | Ensure user has cloudadmin permissions |
