# Action: get-files

## Purpose

Retrieves multiple files for download by their IDs.

---

## Endpoint

```
POST $API_BASE_URL/uds/v1/Files/GetFiles
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/Files/GetFiles" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "fileIds": ["file-id-1", "file-id-2"],
    "configurationName": "default",
    "projectKey": "$X_BLOCKS_KEY"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fileIds | array | yes | Array of file IDs |
| configurationName | string | no | Storage configuration |
| projectKey | string | yes | Use $X_BLOCKS_KEY |

---

## On Success (200)

```json
[
  {
    "errors": {},
    "isSuccess": true,
    "url": "https://storage-url.com/file1.png",
    "accessModifier": 2,
    "itemId": "file-id-1",
    "name": "file1.png"
  },
  {
    "errors": {},
    "isSuccess": true,
    "url": "https://storage-url.com/file2.png",
    "accessModifier": 2,
    "itemId": "file-id-2",
    "name": "file2.png"
  }
]
```

---

## On Failure

| Status | Cause | Action |
|--------|-------|--------|
| 401 | Invalid token | Check ACCESS_TOKEN validity |
