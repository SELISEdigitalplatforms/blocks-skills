---
name: blocks-data-storage
description: "Build file and document-management features on SELISE Blocks Data: upload/download, directory trees, cursor-paginated browse/search, versions, rename/move/copy, soft delete/trash/restore, sharing, access policies, and inheritance. Use whenever a user mentions files, attachments, documents, images, folders, a file browser, shared files, permissions, or version history. This is separate from schemas/records: store the returned fileId in a field managed through blocks-data-gateway-crud."
---

# Blocks Data — Storage

Storage is a permission-aware object tree containing directories and files. Uploading a new file creates the file object and initial version directly in that tree. The old DMS registration and folder routes are retired.

## Authentication

- **Browser/runtime:** send `x-blocks-key: <PTENANT>`, the signed-in user's session credentials, and `credentials: "include"` when cookie-based authentication is used.
- **Admin/terminal:** prefer `blocks data files *`; the CLI resolves the selected project and impersonation context. For raw admin calls, send the root account tenant as `x-blocks-key` with the impersonated project's Bearer `PTOK`. The token carries project scope—do not add invented `projectKey` fields to storage DTOs.
- **Provider PUT:** send no Blocks Bearer token and no `x-blocks-key`. Send only headers required by the signed provider policy, such as `Content-Type` and Azure's `x-ms-blob-type: BlockBlob`.

Prefer the Blocks CLI for terminal work and `@seliseblocks/client` for app code:

- `blocksClient.data.files` — upload/download, metadata, versions, copy/move/rename/delete.
- `blocksClient.data.directories` — create/get/update/delete/move.
- `blocksClient.data.objects` — list/search/trash/shared/restore/purge/share/access/inheritance.

## Canonical route groups

Base URL: `https://api.seliseblocks.com/data/v4`. Current routes are lowercase kebab-case.

### Files

| Operation | Method and route |
|---|---|
| Get one / many / info | `GET /files/get-file`, `POST /files/get-files`, `POST /files/get-files-info` |
| Cloud upload metadata | `POST /files/get-pre-signed-url-for-upload` |
| Local upload | `POST /files/upload-file-to-local-storage` multipart |
| Additional properties | `POST /files/update-file-additional-info` |
| Delete/trash | `POST /files/delete-file` |
| Version history / create version | `GET /files/get-file-versions`, `POST /files/create-file-version` |
| Copy / move / rename | `POST /files/copy-file`, `POST /files/move-file`, `POST /files/rename-file` |

### Directories

| Operation | Method and route |
|---|---|
| Create / get / update | `POST /directory/create-directory`, `GET /directory/get-directory`, `POST /directory/update-directory` |
| Delete / move | `POST /directory/delete-directory`, `POST /directory/move-directory` |

Root-directory creation exists as a separate owner-only internal capability. Do not expose it as a normal app action.

### Object discovery and access

| Operation | Method and route |
|---|---|
| Browse / search | `GET /objects/get-objects`, `GET /objects/search-objects` |
| Trash / shared | `GET /objects/get-trash`, `GET /objects/get-shared-objects` |
| Restore / purge | `POST /objects/restore-from-trash`, `POST /objects/delete-from-trash` |
| Access entries / effective access | `GET /objects/get-access-policies`, `GET /objects/resolve-access` |
| Grant / update / revoke | `POST /objects/grant-access`, `POST /objects/update-access-policy`, `POST /objects/revoke-access-policy` |
| Inheritance / share | `POST /objects/toggle-inheritance`, `POST /objects/share-object` |

## Routing

| Need | Read |
|---|---|
| Upload and download | [flows/upload-files.md](flows/upload-files.md) |
| Browse, folders, versions, trash, move/copy, sharing, ACLs | [flows/object-management.md](flows/object-management.md) |
| React integration | [references/react.md](references/react.md) |
| Associate a file with a record | Store `fileId` via [blocks-data-gateway-crud](../blocks-data-gateway-crud/SKILL.md) |

## Core behavior

- **Cloud upload:** the pre-sign call creates the file/version metadata and returns `uploadUrl` + `fileId`; PUT the bytes to the provider URL. No registration call follows.
- **Local upload:** one authenticated multipart call creates metadata and stores version 1.
- **Cloud parent resolution:** when `parentDirectoryId` is empty, `moduleName` resolves to that module's default directory. The backend default is `8` (`Default_Construct`); pass the intended module or a concrete directory id.
- **Local parent resolution:** an empty parent stays at the top level.
- **Existing `itemId`:** either upload path creates another version after an Edit check.
- **Delete:** `permanent: false` moves an object to trash; `true` removes it. The backend DTO default is `true`, so always send the choice explicitly. The CLI defaults to safe soft deletion and requires `--permanent` for destructive removal.
- **Object pages:** use opaque `cursor`, `nextCursor`, and `hasMore`. Limit is 1–200 (default 50); version history is 1–100 (default 25). Access filtering can return a short page while `hasMore` remains true.
- **Object types:** use lowercase `"directory"` / `"file"` for list filters and discriminators.

## Permission model

Every request passes both endpoint authorization and an object ACL check. Permissions are ordered:

`View` → `Download` → `Edit` → `Delete` → `Manage` → `Owner`

Higher permissions imply lower ones. Children inherit ancestor access while `inheritsParentAccess` is true. New files inherit from their directory.

Render UI actions from the returned `permissions` flags (`canView`, `canDownload`, `canEdit`, `canDelete`, `canManage`, `canOwner`) and still handle 403/404 races. Hidden reads may return 404 rather than reveal that an inaccessible id exists.

## Gotchas

- Do not use `/Files/GetDmsFileAndFolder`, `/Files/UploadFile`, `/Files/CreateFolder`, `/Files/DeleteFolder`, `data.dms.*`, or the old `dms-*` CLI commands.
- The pre-sign call mutates metadata before the provider PUT. Handle a failed PUT as a partial workflow.
- File names need an allowed extension; a directory may restrict extensions.
- File names must be unique within a directory. Move/copy can fail on collision or extension policy.
- `Private` is the safe upload default. Use `Public` only for intended unauthenticated download.
- Never send Blocks auth headers to a pre-signed provider URL.
- Access enums are JSON strings: resource `Directory|File`, principal `User|Role|Everyone|Organization`, effect `Allow|Deny`, and the permissions above.
- `get-access-policies` currently returns direct entries; although its request model has `includeInherited`, the controller does not use it. Use `resolve-access` for effective permissions.
- A Deny targeting the owner is rejected. Turning inheritance off is rejected until a direct Allow exists.
