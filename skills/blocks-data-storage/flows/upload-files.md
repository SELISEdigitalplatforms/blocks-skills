# Upload and manage files (DMS)

Any file-storage task on the data service: upload via pre-signed URL, download, browse, delete. Preconditions: a Bearer token and the **project key** (project tenant id) sent as both `x-blocks-key` and `projectKey`. All `/Files/*` routes are PascalCase and do **not** use the standard data envelope — errors come back as `Record<string,string>`. Base: `https://api.seliseblocks.com/data/v4`.

## Upload = two steps (presign → PUT binary). No `/Files/UploadFile`.

The upload is **just two calls**: get a pre-signed URL, then PUT the file bytes to it. You do **not** call `/Files/UploadFile` — presign + PUT is the whole upload.

### Step 1 — Get a pre-signed upload URL — `POST /data/v4/Files/GetPreSignedUrlForUpload`
```json
{
  "name": "invoice-2026-07.pdf",
  "projectKey": "<project tenant id>",
  "accessModifier": "Private",
  "configurationName": "Default",
  "moduleName": 3,
  "parentDirectoryId": "",
  "tags": "invoices",
  "metaData": "{}"
}
```
Keep **`uploadUrl`** and **`fileId`** from the response.
- **`accessModifier`** — `"Public"` or `"Private"`. Public files are readable without auth; Private require access.
- **`configurationName`** — the storage configuration to use. `"Default"` targets the project's default store. To use a specific one, list the project's storage configs (see below) and pass its `name`.
- **`moduleName`** — **must have a value** (an int). Use **`3`** (recommended); any int is accepted, but don't omit it.
- **`parentDirectoryId`** — **must not be `null`**. Use `""` for the root, or a folder id to place the file inside a folder. Sending `null` is rejected — send an empty string instead.

### Step 2 — PUT the file bytes to `uploadUrl`
Upload the raw file **binary** with a `PUT` to the returned `uploadUrl`. This goes to the storage provider (blob storage), **not** the Blocks API — send **no** `x-blocks-key`/Bearer headers; the URL is pre-authorized and expires, so upload promptly.

**Azure needs one extra header.** If the storage provider is **Azure**, the PUT must include `x-ms-blob-type: BlockBlob` or Azure rejects it. Detect the provider from the `uploadUrl` host — an Azure Blob URL looks like `https://<account>.blob.core.windows.net/...` — or from the storage config's `storageStrategy` (see below). Other providers (e.g. S3) don't need this header.

```bash
# Azure example
curl -s -X PUT "<uploadUrl>" \
  -H "x-ms-blob-type: BlockBlob" \
  -H "Content-Type: application/pdf" \
  --data-binary @invoice-2026-07.pdf
```
On success the file is stored; use `fileId` from step 1 to reference it. (`GetFile` in the management section is the source of truth that it registered.)

## Which storage configurations exist? — `GET https://api.seliseblocks.com/logic/v4/Storage/Gets`

Storage configs live on the **logic** service (note the different host path). Same auth (`x-blocks-key` + Bearer). Returns an array; the `name` is what you pass as `configurationName`, and `storageStrategy` tells you the provider (so you know whether the PUT needs `x-ms-blob-type`):
```json
[
  {
    "name": "Default",
    "storageStrategy": "Azure",
    "connectionString": "D***…t",
    "itemId": "0ffac412-b0b6-4e31-aa17-4f194f09e4d8",
    "organizationId": "default",
    "createdDate": "2025-02-09T13:18:54.725Z"
  }
]
```
Most projects have a single `"Default"` (Azure). Only enumerate this when you need a non-default store or want to confirm the provider.

## Download & browse

- **Get one file — `GET /data/v4/Files/GetFile`** — query params `FileId` and `ConfigurationName` (PascalCase): `GET /Files/GetFile?FileId=<fileId>&ConfigurationName=Default`. The response `url` is the download link.
- **Get several files — `POST /data/v4/Files/GetFiles`** with a JSON body:
  ```json
  { "fileIds": ["<fileId>", "<fileId2>"], "configurationName": "Default" }
  ```
- **File info / listing — `POST /data/v4/Files/GetFilesInfo`** — paginated metadata: `{ page, pageSize, sort: { property, isDescending }, filter: { name?, additionalProperties? }, projectKey }` → `data[]` + `totalCount`.
- **DMS files & folders — `POST /data/v4/Files/GetDmsFileAndFolder`** — browse a folder tree: `{ parentId, skip, take, searchKey }`.

## Folders & delete

- Create folder: `POST /Files/CreateFolder` (`artifactName` = name, `parentId` to nest). Delete folder: `POST /Files/DeleteFolder` (`folderId`).
- Delete a file: `POST /Files/DeleteFile` with `{ "fileId": "<fileId>", "projectKey": "<project tenant id>" }` → `{ isSuccess }`.

Error paths: 401 → wrong `x-blocks-key`/expired token. A failed pre-signed PUT (expired URL) → redo step 1; don't reuse a stale `fileId`. An Azure PUT that 400s with a "blob type" error → you missed `x-ms-blob-type: BlockBlob`.

## Verify

- `GET /Files/GetFile?FileId=<fileId>&ConfigurationName=Default` → non-null `url`, correct `name`/`sizeInBytes`. Download the `url` and compare bytes for a full round-trip.
- `POST /Files/GetFilesInfo` filtered by `name` → the file appears.

## Associate a file with a record

Store the returned `fileId` in a schema field (e.g. `ItemImageFileId` String, or an `ItemImageFileIds` array). Define the field via **[blocks-data-gateway-configuration](../../blocks-data-gateway-configuration/SKILL.md)** and set it on insert/update via **[blocks-data-gateway-crud](../../blocks-data-gateway-crud/SKILL.md)**.
