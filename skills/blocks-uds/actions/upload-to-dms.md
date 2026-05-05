# Action: upload-to-dms

## Purpose

Uploads a file to the Document Management System with full metadata. Use for folder-organized storage.

---

## Endpoint

```
POST $API_BASE_URL/uds/v1/Files/UploadFile
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/Files/UploadFile" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "upload": [
      {
        "userId": "$USER_ID",
        "itemId": null,
        "artifactName": "product-image.png",
        "configurationName": "default",
        "description": "Product hero image",
        "parentId": "$FOLDER_ID",
        "tags": ["product", "image"],
        "metaData": [{"type": "string", "value": "marketing"}],
        "organizationId": "$ORG_ID"
      }
    ],
    "projectKey": "$X_BLOCKS_KEY"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| upload | array | yes | Array of UploadFileRequest objects |
| projectKey | string | yes | Use $X_BLOCKS_KEY |

### UploadFileRequest

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| userId | string | no | User ID |
| itemId | string | no | For re-uploading existing |
| artifactName | string | no | Display name |
| configurationName | string | no | Storage config |
| description | string | no | File description |
| parentId | string | no | DMS folder ID |
| dmsWorkspaceId | string | no | DMS workspace ID |
| dmsWorkspaceName | string | no | DMS workspace name |
| tags | array | no | Tag strings |
| metaData | array | no | Array of {type, value} |
| organizationId | string | no | Organization ID |
| fileStorageId | string | no | File storage ID |

---

## On Success (200)

```json
{
  "result": {},
  "message": "File uploaded successfully",
  "httpStatusCode": 200
}
```

---

## On Failure

| Status | Cause | Action |
|--------|-------|--------|
| 401 | Invalid token | Check ACCESS_TOKEN validity |
| 403 | Missing cloudadmin role | Assign cloudadmin role |
| 413 | File too large | Use pre-signed URL for large files |
