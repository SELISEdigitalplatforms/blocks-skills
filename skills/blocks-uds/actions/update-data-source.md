# Action: update-data-source

## Purpose

Updates an existing database connection. Use the itemId from get-data-source.

---

## Endpoint

```
PUT $API_BASE_URL/uds/v1/data-sources/update
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/data-sources/update" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "itemId": "$EXISTING_ITEM_ID",
    "connectionString": "mongodb+srv://<username>:<password>@cluster.mongodb.net",
    "databaseName": "mydb",
    "projectKey": "$X_BLOCKS_KEY",
    "isActive": true
  }'
```

---

## Request Body / Query Parameters

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| itemId | string | yes | ID from get-data-source |
| connectionString | string | yes | Updated MongoDB connection string |
| databaseName | string | yes | Updated database name |
| projectKey | string | yes | Use $X_BLOCKS_KEY |
| isActive | boolean | yes | Set false to disable. Omitting may deactivate! |

---

## On Success (200)

```json
{
  "isSuccess": true,
  "message": "Data source updated successfully",
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
| 400 | Invalid itemId or connection string | Verify itemId exists and connection string is valid |
| 401 | Invalid token | Verify ACCESS_TOKEN is valid and not expired |
| 403 | Missing cloudadmin role | Ensure user has cloudadmin permissions |
| 500 | MongoDB auth/connection failed | Verify MongoDB credentials and connectivity |

---

## Next Steps

Call reload-configuration after updating data source.
