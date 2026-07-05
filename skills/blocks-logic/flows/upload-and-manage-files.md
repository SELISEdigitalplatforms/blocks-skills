# Upload and manage logic files (pre-signed URL flow)

Use when a workflow or logic deployment needs file assets: upload via pre-signed URL,
fetch download URLs/metadata, batch-read, and delete. These are the logic service's file
APIs ([endpoints.md#storage](../endpoints.md#storage)) — not the platform storage
*configuration* CRUD (`/api/Storage/Save|Get|Gets|Delete`), which is documented in
`blocks-os`.

Preconditions: token + `x-blocks-key` (`blocks-setup`). If your project uses a custom
storage configuration, know its `configurationName` (managed via `blocks-os`); otherwise
omit it to use the project default (default-resolution behavior is not documented in
swagger — verify on your project).

## Steps

1. `POST /api/Storage/GetPreSignedUrlForUpload` — request an upload slot.
   Body (all fields optional in schema; send what you know):
   - `name` — the file name (with extension).
   - `projectKey` — your project slug.
   - `configurationName` — storage configuration to use (omit for default).
   - `parentDirectoryId` — target folder, if you use directories.
   - `accessModifier` — a **string** here (e.g. `"Public"`/`"Private"` — exact accepted
     values are not documented in swagger; the related response enum is numeric
     `0 | 1 | 2 | 3`, names unverified). Verify accepted strings live.
   - `tags`, `metaData` — **strings** in this request (elsewhere tags are `string[]` and
     metadata is an object) — likely serialized values; verify the expected encoding live.
   - `itemId` — optional client-supplied id for the new file; leave null to let the
     server assign one.
   - `moduleName` — int enum `1–11`, member names not published in swagger; omit unless
     your project's conventions require a specific value.
   Keep `uploadUrl` and `fileId` from the response; a false `isSuccess` puts details in
   `errors`.

2. `PUT <uploadUrl>` — upload the raw bytes directly to the pre-signed URL.
   This goes to the storage provider, **not** to the Blocks API: no `x-blocks-key`, no
   Bearer token. Send the file body with an appropriate `Content-Type`. The URL is
   time-limited — upload promptly and request a fresh one if it expires.

3. `GET /api/Storage/GetFile?FileId=<fileId>&ProjectKey=<slug>` — confirm the upload and
   get the download `url`, plus metadata (`name`, `sizeInBytes`, `accessModifier`,
   `tags`, `metaData`, `createDate`, ...). Optional `Version` (int64) fetches a specific
   file version; `ConfigurationName` targets a non-default configuration.

4. Batch reads: `POST /api/Storage/GetFiles` with
   `{ fileIds: [...], projectKey, configurationName? }` → array of the same file shape.

5. Delete: `POST /api/Storage/DeleteFile` with
   `{ fileId, projectKey, configurationName?, eventQueueName? }` → `BaseResponse`
   (`isSuccess`, `errors`). `eventQueueName` optionally routes a deletion event to a
   queue — semantics beyond the field name are not documented in swagger.

Error paths:
- `401` on Blocks endpoints → refresh token (`blocks-setup`).
- `PUT` to `uploadUrl` fails (403/expired) → request a new pre-signed URL (step 1).
- `GetFile` returns `isSuccess: false` or a null `url` right after upload → the upload
  may not have completed; retry step 3, then re-upload if needed.

## Verify

- `GET /api/Storage/GetFile?FileId=...&ProjectKey=...` returns `isSuccess: true`,
  the expected `name`/`sizeInBytes`, and a non-null `url`.
- Fetching that `url` downloads the bytes you uploaded.
- After `DeleteFile`, `GetFile` for the same id no longer returns the file.
