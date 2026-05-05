# Action: import-schema

## Purpose

Initiates an asynchronous import of schema definitions from a previously exported file. The fileId must reference a file uploaded via an export operation.

---

## Endpoint

```
POST $API_BASE_URL/uds/v1/schema-exchange/import
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/schema-exchange/import" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "projectKey": "$X_BLOCKS_KEY",
    "fileId": "$EXPORTED_FILE_ID",
    "messageCoRelationId": "550e8400-e29b-41d4-a716-446655440001"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| projectKey | string | yes | Use $X_BLOCKS_KEY |
| fileId | string | yes | File ID from export-schema result or notification |
| messageCoRelationId | string | no | UUID for tracking |

---

## On Success (200)

```json
{
  "isSuccess": true,
  "message": "Import initiated successfully",
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
| 400 | Invalid fileId | Provide a valid fileId from export-schema |
| 401 | Invalid token | Provide a valid ACCESS_TOKEN |
| 403 | Missing cloudadmin role | Ensure user has cloudadmin role |
