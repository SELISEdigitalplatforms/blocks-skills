# Action: get-schema-unadapted-changes

## Purpose

Retrieves pending schema changes that have not been applied to the GraphQL schema. Use after schema migrations to check what still needs adapting.

---

## Endpoint

```
GET $API_BASE_URL/uds/v1/schemas/unadapted-changes?projectKey=$X_BLOCKS_KEY
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/schemas/unadapted-changes?projectKey=$X_BLOCKS_KEY" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

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
  "message": "string",
  "httpStatusCode": 200,
  "data": [
    {
      "schemaId": "string",
      "schemaName": "string",
      "collectionName": "string",
      "changes": [
        {
          "fieldName": "string",
          "changeType": "Added",
          "description": "string"
        }
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
| 403 | Missing cloudadmin role | Assign cloudadmin role |
