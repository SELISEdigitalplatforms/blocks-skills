# Flow: upload-file-flow

## Trigger

User wants to upload a file, store a document, or manage file storage.

> "upload a file"
> "store a document"
> "file management"
> "I need to upload images for products"
> "save a PDF to the DMS"
> "upload to S3"

---

## Pre-flight Questions

Before starting, confirm:

1. What is the file type and approximate size?
   - Large files (>5 MB) → use S3 pre-signed URL path
   - Small files (≤5 MB) → direct upload path
2. Should the file be organized in a DMS folder?
   - Yes, with folders → use DMS upload path
   - No folder needed → use local storage or S3
3. What should the access modifier be? `Public` (no auth required to download) or `Private` (requires auth)?
4. Does a destination folder exist, or does it need to be created?
5. Are there tags or metadata to attach to the file?

---

## Flow Steps

### Path A — S3 Pre-signed URL Upload (recommended for files >5 MB or cloud deployments)

#### Step A1 — Generate Pre-signed Upload URL

```
Action: get-presigned-upload-url
Input:
  name              = "<display-name>"
  parentDirectoryId = null  (or folder ID for DMS organization)
  tags              = "tag1,tag2"
  accessModifier    = "Public" | "Private"
  projectKey        = $X_BLOCKS_KEY
```

> **IMPORTANT:** Response is DIRECT — `uploadUrl` and `fileId` are at the TOP level, NOT inside `data`. Store `uploadUrl` and `fileId` from the top-level response.

On success → store `fileId` as `$FILE_ID` and `uploadUrl` as `$UPLOAD_URL`.

---

#### Step A2 — Upload File to S3

PUT the file binary directly to the pre-signed URL. Do NOT include `Authorization` or `x-blocks-key`.

```bash
curl --location --request PUT "$UPLOAD_URL" \
  --header "Content-Type: application/octet-stream" \
  --data-binary "@/path/to/file"
```

In TypeScript:
```ts
await fetch(uploadUrl, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/octet-stream' },
  body: file,
})
```

Track upload progress via `XMLHttpRequest` `upload.onprogress` for UI progress bar.

---

#### Step A3 — Update File Metadata (optional)

After upload completes, register additional metadata:

```
Action: update-file-info
Input:
  itemId              = $FILE_ID
  additionalProperties = { "key": "value" }
  projectKey          = $X_BLOCKS_KEY
```

On success → upload complete.

---

### Path B — DMS Upload (for folder-organized file management)

#### Step B1 — Ensure Destination Folder Exists (optional)

```
Action: get-dms-files (POST /Files/GetDmsFileAndFolder)
Input:
  parentId = null
  projectKey = $X_BLOCKS_KEY
  skip = 0
  take = 50
```

**Branch:**
- If target folder in response → store its `itemId` as `$PARENT_FOLDER_ID` → skip to Step B2
- If not found → continue to Step B1a

##### Step B1a — Create Folder

```
Action: create-folder
Input:
  artifactName        = "<folder-name>"
  configurationName   = "default"
  description         = "<description>"
  parentId            = null  (or parent folder ID)
  tags                = []
  projectKey          = $X_BLOCKS_KEY
```

> Note: `CreateFolderRequest` has many fields including `parentId` (not `ParentDirectoryId`), `artifactName` (not `Name`), etc.

Store `result` data as `$PARENT_FOLDER_ID`. Continue to Step B2.

---

#### Step B2 — Upload File to DMS

```
Action: upload-to-dms
Input:
  upload = [
    {
      artifactName: "<display-name>",
      configurationName: "default",
      description: "<description>",
      parentId: $PARENT_FOLDER_ID,
      tags: ["tag1", "tag2"],
      metaData: [{ type: "string", value: "value" }]
    }
  ]
  projectKey = $X_BLOCKS_KEY
```

On success → upload complete. Call `get-dms-files` to refresh folder listing.

---

### Path C — Direct Local Storage Upload (for small files, non-S3 deployments)

#### Step C1 — Upload File to Local Storage

```
Action: upload-to-local-storage
Form fields:
  File           = <file binary>
  Name           = "<display-name>"
  Tags           = "tag1,tag2"
  AccessModifier = "Public" | "Private"
  ProjectKey     = $X_BLOCKS_KEY
```

On success → upload complete. Store returned `fileId` if further operations needed.

---

## Path Selection Guide

| Scenario | Recommended Path |
|----------|-----------------|
| File > 5 MB, cloud/S3 deployment | Path A (pre-signed URL) |
| File needs DMS folder organization | Path B (DMS upload) |
| File ≤5 MB, local storage deployment | Path C (local storage) |
| Images, videos for public CDN delivery | Path A with `accessModifier: Public` |
| Private documents (invoices, contracts) | Path A or B with `accessModifier: Private` |

---

## Error Handling

| Step | Error | Cause | Action |
|------|-------|-------|--------|
| Step A1 | 400 | Missing required fields | Check request body |
| Step A2 | 403 | S3 signature mismatch | URL expired — regenerate from Step A1 |
| Step A2 | timeout | File too large for time limit | Split into chunks or increase timeout |
| Step A3 | 404 | File not found | Check fileId from Step A1 response |
| Step B1a | 400 | Invalid parentId | Verify parent folder ID from get-dms-files |
| Step B2 | 413 | File too large | Use Path A (pre-signed URL) for large files |
| Step C1 | 413 | File too large | Use Path A (pre-signed URL) |
| Any | 401 | Expired token | Run get-token from blocks-idp |
| Any | 403 | Missing cloudadmin role | Add cloudadmin role in Cloud Portal → People |
