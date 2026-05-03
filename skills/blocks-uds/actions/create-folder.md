# Action: create-folder

## Purpose

Creates a new folder in the Document Management System. Folders can be nested using parentId.

---

## Endpoint

```
POST $API_BASE_URL/uds/v1/Files/CreateFolder
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/Files/CreateFolder" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "itemId": null,
    "artifactName": "Product Images",
    "configurationName": "default",
    "description": "Product image assets",
    "parentId": null,
    "tags": ["product"],
    "projectKey": "$X_BLOCKS_KEY"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| userId | string | no | User ID |
| itemId | string | no | Pre-existing item ID |
| artifactName | string | no | Folder display name |
| configurationName | string | no | Storage config |
| description | string | no | Folder description |
| parentId | string | no | Parent folder ID — null for root |
| dmsWorkspaceId | string | no | DMS workspace ID |
| dmsWorkspaceName | string | no | DMS workspace name |
| tags | array | no | Tags |
| metaData | object | no | Key-value metadata |
| organizationId | string | no | Organization ID |
| fileStorageId | string | no | File storage ID |
| projectKey | string | yes | Use $X_BLOCKS_KEY |

---

## On Success (200)

```json
{
  "result": {},
  "message": "Folder created successfully",
  "httpStatusCode": 200
}
```

---

## On Failure

| Status | Cause | Action |
|--------|-------|--------|
| 400 | Missing required fields | Ensure projectKey is provided |
| 401 | Invalid token | Check ACCESS_TOKEN validity |
| 403 | Missing cloudadmin role | Assign cloudadmin role |
| 404 | Parent folder not found | Verify parentId exists |
