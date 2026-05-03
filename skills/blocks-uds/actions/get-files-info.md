# Action: get-files-info

## Purpose

Retrieves metadata for multiple files without downloading the actual content.

---

## Endpoint

```
POST $API_BASE_URL/uds/v1/Files/GetFilesInfo
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/Files/GetFilesInfo" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "page": 1,
    "pageSize": 20,
    "sort": { "property": "createDate", "isDescending": true },
    "filter": { "name": "product" },
    "projectKey": "$X_BLOCKS_KEY"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| page | integer | no | Default: 1 |
| pageSize | integer | no | Default: 20 |
| sort | object | no | { property, isDescending } |
| filter | object | no | { name, tenantId, additionalProperties } |
| projectKey | string | yes | Use $X_BLOCKS_KEY |

---

## On Success (200)

```json
{
  "isSuccess": true,
  "message": "string",
  "httpStatusCode": 200,
  "data": {
    "data": [
      {
        "errors": {},
        "isSuccess": true,
        "url": "string",
        "accessModifier": 2,
        "itemId": "file-id",
        "tags": ["tag1"],
        "metaData": {},
        "name": "document.pdf",
        "parentDirectoryID": "folder-id",
        "systemName": "document.pdf",
        "type": 0,
        "typeString": "File",
        "createDate": "2024-01-01T00:00:00Z",
        "createdBy": "user-id",
        "language": "en",
        "tenantId": "tenant-id",
        "sizeInBytes": 12345
      }
    ],
    "errors": {},
    "totalCount": 1
  },
  "errors": []
}
```

---

## On Failure

| Status | Cause | Action |
|--------|-------|--------|
| 401 | Invalid token | Check ACCESS_TOKEN validity |
