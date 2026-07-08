---
name: blocks-data-storage
description: "Store and serve files on a SELISE Blocks project via the data service's DMS (document management system) — the `/data/v4/Files/*` API. Covers the pre-signed-URL upload (get upload URL → PUT the file binary to storage, with the Azure `x-ms-blob-type` header when needed → get download URL), downloading/listing files, folders (create/list/delete), tags/metadata/versions, and deleting files. Use whenever the user wants to upload, download, browse, organize, or delete FILES/attachments/documents/images on Blocks — 'upload a PDF and get a link', 'attach an image to a record', 'let users download this file', 'create a folder and list its contents', 'get a presigned upload URL'. This is separate from the data model: to define schemas use blocks-data-gateway-configuration, and to CRUD records use blocks-data-gateway-crud (store a file here, keep its fileId in a schema field there)."
---

# Blocks Data — Storage (Files / DMS)

DMS is the document management system embedded in the data service: pre-signed upload URLs, folders, tags, metadata, and versions, under `https://api.seliseblocks.com/data/v4/Files/*`. Store a file here and keep its `fileId` in a schema field (see **[blocks-data-gateway-configuration](../blocks-data-gateway-configuration/SKILL.md)** / **[blocks-data-gateway-crud](../blocks-data-gateway-crud/SKILL.md)**) to associate it with a record.

## Auth & keys (same model as the whole data service)

- **Login:** `POST https://api.seliseblocks.com/iam/v4/auth-login` with `{ "username", "password" }` → `access_token` (~5 min) + `refresh_token`.
- **The project key = the token's `tenant_id` claim.** Send it as the **`x-blocks-key` header** and, where a body/query needs it, as **`projectKey` / `ProjectKey`**. Plus `Authorization: Bearer <access_token>`. It's **not** the account/cloud login key. 401 → wrong key or expired token.

## URL & casing conventions (Files is the odd one out)

- Base: `https://api.seliseblocks.com/data/v4` — **no `/api/` prefix.**
- **`/Files/*` routes are PascalCase** (`/Files/GetFile`, `/Files/GetPreSignedUrlForUpload`, `/Files/GetFiles`, `/Files/GetDmsFileAndFolder`, …), and so are `GetFile`'s **query params** (`FileId`, `ConfigurationName`, `Version`).
- **Files does NOT use the standard data envelope.** Responses are flat (`FileResponse`, `GetPreSignedUrlForUploadResponse`, `DmsResponse` with an untyped `result`), and **`errors` is a `Record<string,string>`**, not an array. Branch your error handling accordingly.

## What's where

| I need to… | Go to |
|---|---|
| Upload, download, browse folders, delete files | [flows/upload-files.md](flows/upload-files.md) |
| Wire uploads/downloads into a React app | [references/react.md](references/react.md) |
| Associate a file with a data record | store the `fileId` in a schema field — **[blocks-data-gateway-crud](../blocks-data-gateway-crud/SKILL.md)** |

## Key concepts

- **Pre-signed upload = two steps** — `POST /Files/GetPreSignedUrlForUpload` (get `uploadUrl` + `fileId`) → `PUT <uploadUrl>` (the raw file **binary**, straight to the storage provider, no Blocks headers, URL expires so upload promptly). **You do not call `/Files/UploadFile`** — presign + PUT is the whole upload. `GET /Files/GetFile` then returns the download `url`.
- **Azure PUT header** — if the storage provider is Azure, the binary PUT **must** include `x-ms-blob-type: BlockBlob`. Detect Azure from the `uploadUrl` host (`*.blob.core.windows.net`) or the storage config's `storageStrategy: "Azure"`. Non-Azure providers don't need it.
- **`accessModifier`** — `"Public"` or `"Private"` in the upload request (Public = readable without auth). It's an `AccessModifier` int enum in read responses.
- **Required presign fields** — the `GetPreSignedUrlForUpload` body must include **`moduleName`** (an int; use `3` — recommended, though any int works) and **`parentDirectoryId`** as a **string, never `null`** (`""` = root, or a folder id). Omitting `moduleName` or sending `parentDirectoryId: null` is rejected.
- **`configurationName`** — which storage config to use; `"Default"` for the project default, or a `name` from the storage-config list. Storage configs live on the **logic** service: `GET https://api.seliseblocks.com/logic/v4/Storage/Gets` → array of `{ name, storageStrategy, connectionString, itemId, … }` (the `name` is the `configurationName`; `storageStrategy` is the provider).
- **Read/browse** — `GET /Files/GetFile` (query `FileId` + `ConfigurationName`), `POST /Files/GetFiles` (body `{ fileIds[], configurationName }`), `POST /Files/GetFilesInfo` (paginated info), `POST /Files/GetDmsFileAndFolder` (folder tree).
- **Folders** — `POST /Files/CreateFolder` (`artifactName` = name, `parentId` to nest), remove with `POST /Files/DeleteFolder`.

## Gotchas

- **No `/Files/UploadFile`.** Uploading is presign → binary PUT. Don't add a metadata-commit step.
- **Azure blob type** — an Azure PUT without `x-ms-blob-type: BlockBlob` fails; add it when the `uploadUrl` is an Azure Blob URL.
- **`x-blocks-key` on every request** (project key). The pre-signed PUT is pre-authorized so it needs **no Bearer token**, but still include `x-blocks-key` — the storage provider ignores unknown headers. (`auth-login` is the only Blocks call that omits `x-blocks-key`.)
- **`GetFile` confirms the upload** — a successful `GetFile` (with `FileId` + `ConfigurationName`) returning your file means it's stored.
- Flat responses — don't expect `{ isSuccess, data, errors[] }`; read the file fields directly and handle `errors` as a string map.
