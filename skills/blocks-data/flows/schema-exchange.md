# Export and import schemas between projects

Use when copying a project's data model to another project (e.g. dev → staging, or cloning a template project). Both operations are **async**: the API acknowledges immediately and delivers the result via notification, correlated by the `messageCoRelationId` you supply. Preconditions: Bearer tokens valid for **both** projects and each project's own Blocks Key (`x-blocks-key`) — **`projectKey` = that project's Blocks Key** (same value).

## Steps

1. Generate a correlation id (any UUID) — you'll use it to match the completion notification.

2. `POST /schema-exchange/export` — against the **source** project ([endpoints.md#schemaexchange](../endpoints.md#schemaexchange)).
   ```json
   {
     "projectKey": "<source Blocks Key>",
     "messageCoRelationId": "<uuid>",
     "exportOption": 0
   }
   ```
   - `projectKey` is required (the only required field).
   - `exportOption` is a `0|1|2|3` int enum with unpublished member names (contracts.md: `SchemaExportOption`) — meanings unknown; `0` is the safest default, or compare with what the OS portal sends when exporting.
   - Per the swagger description, the call "returns immediately with the fileId" and the exported JSON is delivered via notification. Keep `data.itemId` from the response — verify live whether it is the fileId; the notification payload correlated by `messageCoRelationId` is the authoritative source (subscribe/receive via the **blocks-os** skill's Notification capability).

3. Wait for the export notification (or poll the file): the exported JSON lands in blob storage as a file. You can confirm it exists with `GET /Files/GetFile?FileId=<fileId>&ProjectKey=<source Blocks Key>` (see [upload-files.md](upload-files.md)) — the `url` lets you inspect the JSON before importing.

4. `POST /schema-exchange/import` — against the **target** project. Switch headers to the target project's `x-blocks-key` (and a token that's valid there).
   ```json
   {
     "projectKey": "<target Blocks Key>",
     "fileId": "<fileId from the export>",
     "messageCoRelationId": "<new uuid>"
   }
   ```
   - `projectKey` and `fileId` are both required. The `fileId` **must reference a file produced by an export** (swagger: "must reference a file uploaded to blob storage via an export operation") — don't hand-craft the JSON and upload it yourself and expect it to import.
   - Returns an immediate acknowledgement; the import result arrives via notification correlated by the new `messageCoRelationId`.

5. `POST /schema-configurations/reload` — against the **target** project, after the import notification reports success, so imported schemas go live in the runtime.

Error paths: 400 `ProblemDetails` → missing `projectKey`/`fileId`. 401 → refresh via blocks-setup; remember the two projects need their own credentials. If the import notification reports failures for individual schemas (shape not documented — inspect live), resolve conflicts (e.g. pre-existing schemas with the same name) in the target and re-import.

## Verify

- `GET /schemas?ProjectKey=<target Blocks Key>&PageSize=100` — the exported schemas appear in the target with their fields.
- Spot-check one schema: `GET /schemas/info-by-name?schemaName=<name>&projectKey=<target Blocks Key>`.
- `GET /schemas/unadapted-change-logs?projectKey=<target Blocks Key>` — empty after the final reload.
- Note: whether access policies and validations travel with the export depends on `exportOption` (enum meanings unpublished) — verify with `GET /data-access/policy/get` and `GET /data-validations/by-schema-id` in the target rather than assuming.
