# Action: delete-file

## Purpose

Deletes a file. Uses POST with JSON body — NOT query parameters.

---

## Endpoint

```
POST $API_BASE_URL/uds/v1/Files/DeleteFile
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/Files/DeleteFile" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "fileId": "$FILE_ID",
    "configurationName": "default",
    "projectKey": "$X_BLOCKS_KEY"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fileId | string | yes | File ID to delete |
| configurationName | string | no | Storage configuration |
| projectKey | string | yes | Use $X_BLOCKS_KEY |
| eventQueueName | string | no | Event queue name |

---

## On Success (200)

```json
{
  "errors": {},
  "isSuccess": true
}
```

---

## On Failure

| Status | Cause | Action |
|--------|-------|--------|
| 400 | Missing fileId | Provide fileId in request body |
| 401 | Invalid token | Check ACCESS_TOKEN validity |
| 403 | Missing cloudadmin role | Assign cloudadmin role |
| 404 | File not found | Verify FILE_ID exists |
