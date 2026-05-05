# Action: delete-folder

## Purpose

Deletes a folder from the DMS. The folder must be empty.

---

## Endpoint

```
POST $API_BASE_URL/uds/v1/Files/DeleteFolder
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/Files/DeleteFolder" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "folderId": "$FOLDER_ID",
    "configurationName": "default",
    "projectKey": "$X_BLOCKS_KEY"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| folderId | string | yes | Folder ID |
| configurationName | string | no | Storage config |
| projectKey | string | yes | Use $X_BLOCKS_KEY |

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
| 400 | Missing folderId | Provide folderId in request body |
| 401 | Invalid token | Check ACCESS_TOKEN validity |
| 403 | Missing cloudadmin role | Assign cloudadmin role |
| 404 | Folder not found | Verify FOLDER_ID exists |
