# Action: upload-to-local-storage

## Purpose

Uploads a file directly to local storage. Use for small files (<5 MB) in non-S3 deployments. Multipart form data.

---

## Endpoint

```
POST $API_BASE_URL/uds/v1/Files/UploadFileToLocalStorage
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/Files/UploadFileToLocalStorage" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --form "File=@/path/to/document.pdf" \
  --form "Name=document.pdf" \
  --form "Tags=invoice,2024" \
  --form "AccessModifier=Private" \
  --form "ProjectKey=$X_BLOCKS_KEY"
```

---

## Form Fields (multipart/form-data)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| File | binary | yes | File binary data |
| ItemId | string | no | Pre-existing item ID |
| MetaData | string | no | JSON string metadata |
| Name | string | yes | Display name |
| ParentDirectoryId | string | no | DMS folder ID |
| Tags | string | no | Comma-separated tags |
| AccessModifier | string | yes | Public or Private |
| ConfigurationName | string | no | Storage config |
| ProjectKey | string | yes | Use $X_BLOCKS_KEY |
| AdditionalProperties | object | no | Key-value metadata |

---

## On Success (200)

```json
{
  "errors": {},
  "isSuccess": true,
  "fileId": "file-id-abc123",
  "fileVersion": 1
}
```

---

## On Failure

| Status | Cause | Action |
|--------|-------|--------|
| 400 | Missing required fields | Ensure File and AccessModifier are provided |
| 401 | Invalid token | Check ACCESS_TOKEN validity |
| 403 | Missing cloudadmin role | Assign cloudadmin role |
| 413 | File too large | Use pre-signed URL for large files |
