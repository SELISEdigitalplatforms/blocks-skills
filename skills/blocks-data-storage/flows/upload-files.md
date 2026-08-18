# Upload and download files

Use the Blocks CLI for terminal work and `@seliseblocks/client` for application code. Raw HTTP examples below document the wire contract. The current file routes are lowercase kebab-case under `https://api.seliseblocks.com/data/v4/files`.

## Choose an upload path

| Storage mode | Workflow |
|---|---|
| Cloud/object storage | Authenticated pre-sign request, then unauthenticated provider PUT |
| Local storage | One authenticated multipart request to Blocks Data |

Both workflows create the file object and version directly. Do not call a DMS registration endpoint afterward.

## Cloud upload

### 1. Create metadata and obtain a signed URL

`POST /data/v4/files/get-pre-signed-url-for-upload`

```json
{
  "name": "invoice-2026-08.pdf",
  "accessModifier": "Private",
  "configurationName": "Default",
  "moduleName": 8,
  "parentDirectoryId": "<directory id>",
  "tags": "invoices",
  "metaData": "{}",
  "additionalProperties": {
    "invoiceNumber": "INV-1042"
  }
}
```

Keep `uploadUrl` and `fileId` from the response. Check `isSuccess` and `errors` when present.

- Omit `itemId` to create a new file. Pass an existing file id as `itemId` to create a version after an Edit permission check.
- For cloud upload, an empty `parentDirectoryId` resolves through `moduleName` to that module's default directory.
- The backend module default is `8` (`Default_Construct`), but pass the module your feature actually uses.
- Use `Private` unless unauthenticated download is intentional.
- The request creates metadata before any bytes are uploaded. A failed provider PUT is a partial workflow; retry with a new pre-sign operation or remove the incomplete object according to product policy.

Do not add `projectKey`; project scope comes from authentication.

### 2. PUT bytes to the provider URL

The signed URL is already authorized. Send no Bearer token, cookie, or `x-blocks-key` to it.

```bash
curl -X PUT '<uploadUrl>' \
  -H 'Content-Type: application/pdf' \
  -H 'x-ms-blob-type: BlockBlob' \
  --data-binary @invoice-2026-08.pdf
```

`x-ms-blob-type` is required for Azure Blob uploads. For other providers, send only the headers required by the signed policy. Upload promptly because the URL expires.

### 3. Verify or download

`GET /data/v4/files/get-file?FileId=<fileId>&ConfigurationName=Default`

Use the returned `url` to download. Add `Version=<number>` to request a particular version. Query binding is case-insensitive in the service, but application code should use the SDK rather than constructing query strings.

## Local-storage upload

`POST /data/v4/files/upload-file-to-local-storage` as `multipart/form-data`.

| Field | Meaning |
|---|---|
| `File` | Required binary part |
| `Name` | Required file name |
| `ItemId` | Existing file id when creating a version |
| `ParentDirectoryId` | Parent directory; empty remains at top level |
| `AccessModifier` | Usually `Private` |
| `ConfigurationName` | Usually `Default` |
| `Tags` | Tag text |
| `MetaData` | Metadata string |
| `AdditionalProperties[key]` | Repeated additional-property fields |

Do not manually set a multipart boundary; let the HTTP client create it.

## CLI

```bash
# Complete cloud workflow: pre-sign, provider PUT, verify
blocks data files upload --file ./invoice.pdf \
  --parent-id '<directory id>' \
  --configuration-name Default

# Split workflow when another process performs the PUT
blocks data files presigned-upload-url \
  --name invoice.pdf \
  --parent-directory-id '<directory id>'

blocks data files upload-to-url \
  --url '<uploadUrl>' \
  --file ./invoice.pdf \
  --content-type application/pdf

# Local-storage deployment
blocks data files upload-to-local-storage --file ./invoice.pdf \
  --parent-directory-id '<directory id>'

blocks data files get '<fileId>' --configuration-name Default
blocks data files get-many '<fileId1>' '<fileId2>'
```

Run `blocks data files <command> --help` for exact flags in the installed CLI version.

## TypeScript SDK

```ts
const presign = await blocksClient.data.files.presignedUploadUrl({
  name: file.name,
  accessModifier: "Private",
  configurationName: "Default",
  moduleName: 8,
  parentDirectoryId,
  tags: "invoices",
  metaData: "{}",
});

// The endpoint response is currently unknown at the SDK boundary; validate it.
if (!presign || typeof presign !== "object") throw new Error("Upload was not prepared");
const { uploadUrl, fileId } = presign as { uploadUrl?: string; fileId?: string };
if (!uploadUrl || !fileId) throw new Error("Upload URL or file id is missing");

await blocksClient.data.files.uploadToUrl({
  url: uploadUrl,
  body: file,
  contentType: file.type || "application/octet-stream",
});

const stored = await blocksClient.data.files.get(fileId, {
  configurationName: "Default",
});
```

For local storage:

```ts
await blocksClient.data.files.uploadToLocalStorage({
  file,
  name: file.name,
  parentDirectoryId,
  accessModifier: "Private",
  configurationName: "Default",
});
```

## Versions

List versions with `GET /files/get-file-versions?fileId=<id>&limit=25&cursor=<cursor>`. To upload a cloud-backed version explicitly:

1. `POST /files/create-file-version` with `{ "fileId": "<id>", "configurationName": "Default" }`.
2. Validate its signed upload URL.
3. PUT the bytes using `data.files.uploadToUrl`.

Alternatively, pass the existing id as `itemId` to the normal cloud or local upload request.

## Other file operations

- Batch download metadata: `POST /files/get-files` with `fileIds` and optional `configurationName`.
- Metadata list: `POST /files/get-files-info` with paging/filter/sort fields.
- Additional properties: `POST /files/update-file-additional-info` with `itemId` and `additionalProperties`.
- Soft delete: `POST /files/delete-file` with `{ "fileId": "...", "permanent": false }`.
- Permanent delete: same route with `permanent: true`; make this an explicit destructive choice.

## Associate a file with a record

Store `fileId` in a schema field through [blocks-data-gateway-crud](../../blocks-data-gateway-crud/SKILL.md). The storage object remains the source of file metadata, content, versions, and access policy.
