# Action: reload-configuration

## Purpose

Reloads the GraphQL schema configuration after any schema definition, field, or data source change. Required for schema changes to take effect.

---

## Endpoint

```
POST $API_BASE_URL/uds/v1/configurations/reload?projectKey=$X_BLOCKS_KEY
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/configurations/reload?projectKey=$X_BLOCKS_KEY" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --request POST
```

---

## Request Body / Query Parameters

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| projectKey | string | yes | Use $X_BLOCKS_KEY |

---

## On Success (200)

```json
{
  "isSuccess": true,
  "message": "string",
  "httpStatusCode": 200,
  "data": true,
  "errors": []
}
```

---

## On Failure

| Status | Cause | Action |
|--------|-------|--------|
| 500 | Internal Server Error | DB unreachable or schema conflict |
