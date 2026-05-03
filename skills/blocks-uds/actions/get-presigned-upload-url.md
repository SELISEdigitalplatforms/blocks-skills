# Action: get-presigned-upload-url

## Purpose

Generates a pre-signed URL for uploading a file directly to S3. Recommended for files >5 MB. The response is DIRECT — uploadUrl is at top level, NOT inside data.

---

## Endpoint

```
POST $API_BASE_URL/uds/v1/Files/GetPreSignedUrlForUpload
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/Files/GetPreSignedUrlForUpload" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "name": "product-image.png",
    "parentDirectoryId": null,
    "tags": "product,image",
    "accessModifier": "Public",
    "projectKey": "$X_BLOCKS_KEY"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| itemId | string | no | For re-uploading existing file |
| metaData | string | no | JSON string with metadata |
| name | string | yes | Display name |
| parentDirectoryId | string | no | DMS folder ID |
| tags | string | no | Comma-separated tags |
| accessModifier | string | no | Public or Private |
| configurationName | string | no | Storage config name |
| projectKey | string | yes | Use $X_BLOCKS_KEY |
| moduleName | integer | no | Module identifier 1-11 |
| additionalProperties | object | no | Extra key-value metadata |

---

## On Success (200)

```json
{
  "errors": {},
  "isSuccess": true,
  "uploadUrl": "https://s3.amazonaws.com/bucket/path/file.png?X-Amz-Signature=...",
  "fileId": "file-id-abc123"
}
```

> **IMPORTANT:** Response is DIRECT — `uploadUrl` and `fileId` are at the TOP level, NOT inside `data`. Do NOT use `data.uploadUrl`.

### Step 2 — Upload to S3

```bash
curl --location --request PUT "$UPLOAD_URL" \
  --header "Content-Type: application/octet-stream" \
  --data-binary "@/path/to/file.png"
```

---

## On Failure

| Status | Cause | Action |
|--------|-------|--------|
| 400 | Missing required fields | Provide name and projectKey |
| 401 | Invalid token | Check ACCESS_TOKEN validity |
| 403 | Missing cloudadmin role | Assign cloudadmin role |
