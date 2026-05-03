# Action: update-file-info

## Purpose

Updates metadata for an existing file after upload.

---

## Endpoint

```
POST $API_BASE_URL/uds/v1/Files/updateFileAdditionalInfo
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/Files/updateFileAdditionalInfo" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "itemId": "$FILE_ID",
    "additionalProperties": {
      "altText": "Product front view",
      "category": "marketing"
    },
    "projectKey": "$X_BLOCKS_KEY"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| itemId | string | yes | File ID |
| additionalProperties | object | no | Key-value metadata to update |
| projectKey | string | yes | Use $X_BLOCKS_KEY |

---

## On Success (200)

```json
{
  "isSuccess": true,
  "message": "File info updated successfully",
  "httpStatusCode": 200,
  "data": {},
  "errors": []
}
```

---

## On Failure

| Status | Cause | Action |
|--------|-------|--------|
| 400 | Missing itemId | Provide itemId in request body |
| 401 | Invalid token | Check ACCESS_TOKEN validity |
| 404 | File not found | Verify FILE_ID exists |
