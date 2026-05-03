# Action: get-data-source

## Purpose

Retrieves the database connection configuration for the project. Use to check if a connection exists before adding or updating.

---

## Endpoint

```
GET $API_BASE_URL/uds/v1/data-sources/get?projectKey=$X_BLOCKS_KEY
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/data-sources/get?projectKey=$X_BLOCKS_KEY" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

---

## Request Body / Query Parameters

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
    "dbConnectionString": "mongodb+srv://...",
    "databaseName": "mydb",
    "projectKey": "my-project",
    "projectShortKey": "MP",
    "isActive": true,
    "itemId": "ds-item-id"
  },
  "errors": []
}
```

---

## On Failure

| Status | Cause | Action |
|--------|-------|--------|
| 404 | No data source found | Add a data source first using add-data-source |
| 401 | Invalid token | Verify ACCESS_TOKEN is valid and not expired |
| 500 | Internal Server Error | Server-side issue, retry later |

---

## Note

`dbConnectionString` is NOT returned on GET — it is encrypted. The field name in response is `dbConnectionString`.
