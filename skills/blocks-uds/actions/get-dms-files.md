# Action: get-dms-files

## Purpose

Lists files and folders in the Document Management System with pagination and search.

---

## Endpoint

```
POST $API_BASE_URL/uds/v1/Files/GetDmsFileAndFolder
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/Files/GetDmsFileAndFolder" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "parentId": null,
    "configurationName": "default",
    "projectKey": "$X_BLOCKS_KEY",
    "searchKey": "",
    "skip": 0,
    "take": 50
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| parentId | string | no | Parent folder ID — null for root |
| configurationName | string | no | Storage config name |
| projectKey | string | yes | Use $X_BLOCKS_KEY |
| searchKey | string | no | Filter by name |
| moduleName | string | no | Module identifier |
| skip | integer | no | Pagination offset |
| take | integer | no | Page size |

---

## On Success (200)

```json
{
  "isSuccess": true,
  "message": "string",
  "httpStatusCode": 200,
  "data": {
    "dmsFileAndFolderInfos": [
      {
        "parentId": null,
        "type": 0,
        "name": "Product Images",
        "fileStorageId": "storage-id",
        "extension": null,
        "sizeInBytes": "0",
        "version": 1,
        "description": "Product images folder",
        "itemId": "folder-id-abc",
        "lastUpdatedDate": "2024-01-01T00:00:00Z"
      },
      {
        "parentId": "folder-id-abc",
        "type": 1,
        "name": "hero-image.png",
        "fileStorageId": "storage-id",
        "extension": "png",
        "sizeInBytes": "123456",
        "version": 1,
        "description": "Hero banner image",
        "itemId": "file-id-xyz",
        "lastUpdatedDate": "2024-01-02T00:00:00Z"
      }
    ],
    "totalCount": 2
  },
  "errors": []
}
```

---

## On Failure

| Status | Cause | Action |
|--------|-------|--------|
| 401 | Invalid token | Check ACCESS_TOKEN validity |
| 403 | Missing cloudadmin role | Assign cloudadmin role |
