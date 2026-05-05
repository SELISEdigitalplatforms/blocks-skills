# Action: get-file

## Purpose

Retrieves a single file for download by its ID.

---

## Endpoint

```
GET $API_BASE_URL/uds/v1/Files/GetFile
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/Files/GetFile?FileId=$FILE_ID&ProjectKey=$X_BLOCKS_KEY" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

---

## Query Parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| FileId | string | yes | File ID |
| Version | integer | no | File version number |
| ConfigurationName | string | no | Storage configuration name |
| ProjectKey | string | yes | Use $X_BLOCKS_KEY |

---

## On Success (200)

```json
{
  "errors": {},
  "isSuccess": true,
  "url": "https://storage-url.com/file.png",
  "accessModifier": 2,
  "itemId": "file-id",
  "tags": ["product", "image"],
  "metaData": {},
  "name": "product-image.png",
  "parentDirectoryID": "folder-id",
  "systemName": "product-image.png",
  "type": 0,
  "typeString": "File",
  "createDate": "2024-01-01T00:00:00Z",
  "createdBy": "user-id",
  "language": "en",
  "tenantId": "tenant-id",
  "sizeInBytes": 12345
}
```

---

## On Failure

| Status | Cause | Action |
|--------|-------|--------|
| 401 | Invalid token | Check ACCESS_TOKEN validity |
| 404 | File not found | Verify FILE_ID exists |
