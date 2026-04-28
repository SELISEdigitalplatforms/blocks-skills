# Action: import-uilm

## Purpose

Import a translation file into UILM using a file ID reference. The file must be uploaded separately first to obtain a `fileId`.

> [!IMPORTANT]
> Import is **not** a raw file upload. Pass a `fileId` (string reference) instead of the file itself. Upload the file through the UILM admin UI or a separate upload endpoint to get the `fileId`.

---

## Endpoint

```
POST {apiUrl}/uilm/v1/Key/UilmImport
```

---

## curl

```bash
curl --location "{apiUrl}/uilm/v1/Key/UilmImport" \
  --header "x-blocks-key: {projectKey}" \
  --header "Content-Type: application/json" \
  --data '{
    "messageCoRelationId": "550e8400-e29b-41d4-a716-446655440000",
    "fileId": "file-uuid-here",
    "projectKey": "{projectKey}"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| projectKey | string | yes | Use $PROJECT_KEY |
| fileId | string | yes | File ID from prior upload — not a raw file upload |
| messageCoRelationId | string | no | UUID for tracking |

> Do NOT send the JSON file as multipart form data. Use a `fileId` reference. The file must be flat JSON: `{ "KEY": "value" }`.

---

## On Success (200)

```json
{
  "success": true,
  "errorMessage": null,
  "validationErrors": []
}
```

---

## On Failure

* 400 — invalid file ID or format
* 401 — invalid or missing credentials — check `x-blocks-key` header
