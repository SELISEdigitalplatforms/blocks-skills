# Upload and manage files (DMS)

Use for any file storage task on the data service: upload via pre-signed URL, download, browse folders, delete. Preconditions: Bearer token and your Blocks Key (**`projectKey` = your Blocks Key**, the `X_BLOCKS_KEY` value). All routes here are PascalCase (`/api/Files/*`) and do **not** use the standard data-service envelope — errors come back as `Record<string, string>` ([endpoints.md#files](../endpoints.md#files)).

## Steps

1. `POST /api/Files/GetPreSignedUrlForUpload` — reserve a file slot and get an upload URL.
   ```json
   {
     "name": "invoice-2026-07.pdf",
     "projectKey": "$X_BLOCKS_KEY",
     "accessModifier": "Private",
     "parentDirectoryId": null,
     "tags": "invoices",
     "metaData": "{}",
     "configurationName": null,
     "additionalProperties": {}
   }
   ```
   Keep `uploadUrl` and `fileId` from the response.
   - Quirk: `accessModifier` is a **string** in this request but an `AccessModifier` int enum (`0|1|2|3`, names unpublished) in read responses. `tags` and `metaData` are strings here but arrays/maps elsewhere.
   - `moduleName` is a `1..11` int enum with unpublished member names — omit it unless you know your module's value.

2. `PUT <uploadUrl>` — upload the raw bytes directly to the returned storage URL with the file's `Content-Type`. This call goes to blob storage, not to the data API — no `x-blocks-key`/Bearer headers; the URL is pre-authorized and expires, so upload promptly. (Exact header requirements come from the storage provider; not covered by the swagger.)

3. `POST /api/Files/UploadFile` — register/commit file metadata in DMS.
   ```json
   {
     "projectKey": "$X_BLOCKS_KEY",
     "upload": [
       {
         "itemId": "<fileId from step 1>",
         "artifactName": "invoice-2026-07.pdf",
         "tags": ["invoices"],
         "description": "July invoice",
         "parentId": null,
         "fileStorageId": null
       }
     ]
   }
   ```
   Response is `DmsResponse` — `result` is untyped in swagger and the linkage field for the pre-signed `fileId` (`itemId` vs `fileStorageId`) is not documented; the body above follows the legacy convention. **Verify against the live response**, and treat step 4 as the source of truth for whether the upload is fully registered. If `GetFile` in step 4 already returns your file, this step may be optional for plain uploads.

4. `GET /api/Files/GetFile?FileId=<fileId>&ProjectKey=$X_BLOCKS_KEY` — fetch the file record; `url` is the download link. Note the **PascalCase query params** (`FileId`, `Version`, `ConfigurationName`, `ProjectKey`). For several files at once: `POST /api/Files/GetFiles` with `{ "fileIds": ["<fileId>", …], "projectKey": "$X_BLOCKS_KEY" }`.

5. Ongoing management, as needed:
   - Browse/paginate: `POST /api/Files/GetFilesInfo` with `{ page, pageSize, sort: { property, isDescending }, filter: { name?, additionalProperties? }, projectKey }` → `data[]` + `totalCount`.
   - Folders: `POST /api/Files/CreateFolder` (`artifactName` = folder name, `parentId` to nest); list a folder with `POST /api/Files/GetDmsFileAndFolder` (`parentId`, `skip`/`take`, `searchKey`); remove with `POST /api/Files/DeleteFolder` (`folderId` required).
   - Attach custom key-values: `POST /api/Files/updateFileAdditionalInfo` (`itemId`, `additionalProperties`) — response not documented in swagger.
   - Delete a file: `POST /api/Files/DeleteFile` with `{ "fileId": "<fileId>", "projectKey": "$X_BLOCKS_KEY" }` → `{ isSuccess }`.

Alternative for small/simple cases: `POST /api/Files/UploadFileToLocalStorage` uploads directly to local storage — the request body is **not documented in swagger** (likely multipart; verify live). Response gives `fileId` + `fileVersion`.

Error paths: 401 → refresh via blocks-setup. A failed pre-signed PUT (expired URL) → redo step 1; the `fileId` from a stale attempt should not be reused.

## Verify

- `GET /api/Files/GetFile?FileId=<fileId>&ProjectKey=$X_BLOCKS_KEY` → `isSuccess: true`, a non-null `url`, correct `name` and `sizeInBytes`. Download the `url` and compare bytes for a full round-trip check.
- `POST /api/Files/GetFilesInfo` filtered by `name` → the file appears with the expected `currentVersion`.
