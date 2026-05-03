# Action: delete-schema-by-id

## Purpose

Deletes a schema by its ID. Cloud-only endpoint using path parameter. For standard deletion, use `delete-schema`.

---

## Endpoint

```
DELETE $API_BASE_URL/uds/v1/schemas/{id}?projectKey=$X_BLOCKS_KEY
```

---

## curl

```bash
curl --location --request DELETE "$API_BASE_URL/uds/v1/schemas/$SCHEMA_ID?projectKey=$X_BLOCKS_KEY" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

---

## Path Parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | Schema ID |

---

## Query Parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| projectKey | string | yes | Use `$X_BLOCKS_KEY` |

---

## On Success (200)

```json
{
  "isSuccess": true,
  "message": "Schema deleted successfully",
  "httpStatusCode": 200,
  "data": {
    "acknowledged": true
  },
  "errors": []
}
```

---

## On Failure

| Status | Cause | Action |
|--------|-------|--------|
| 401 | Invalid token | Check ACCESS_TOKEN validity |
| 403 | Missing cloudadmin role | Assign cloudadmin role |
| 404 | Schema not found | Verify SCHEMA_ID exists |
