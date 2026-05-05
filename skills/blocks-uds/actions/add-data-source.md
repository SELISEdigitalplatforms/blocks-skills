# Action: add-data-source

## Purpose

Creates a new database connection configuration. Required before schemas can store data.

---

## Endpoint

```
POST $API_BASE_URL/uds/v1/data-sources/add
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/data-sources/add" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "itemId": "$PROJECT_SLUG-db",
    "connectionString": "mongodb+srv://<username>:<password>@cluster.mongodb.net",
    "databaseName": "mydb",
    "projectKey": "$X_BLOCKS_KEY"
  }'
```

---

## Request Body / Query Parameters

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| itemId | string | yes | Unique identifier — use project slug + "-db" |
| connectionString | string | yes | MongoDB connection string (mongodb+srv:// or mongodb://) |
| databaseName | string | yes | Database name in MongoDB |
| projectKey | string | yes | Use $X_BLOCKS_KEY |

---

## On Success (200)

```json
{
  "isSuccess": true,
  "message": "Data source added successfully",
  "httpStatusCode": 200,
  "data": {
    "acknowledged": true,
    "itemId": "$ITEM_ID",
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
| 400 | Duplicate itemId, invalid connection string | Use unique itemId and verify connection string format |
| 401 | Invalid token | Verify ACCESS_TOKEN is valid and not expired |
| 403 | Missing cloudadmin role | Ensure user has cloudadmin permissions |
| 500 | MongoDB unreachable | Verify MongoDB is accessible and credentials are correct |

---

## Next Steps

Call reload-configuration after adding data source.
