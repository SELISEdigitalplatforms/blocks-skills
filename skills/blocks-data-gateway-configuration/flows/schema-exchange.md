# Export and import schemas between projects

Use when copying a project's data model to another (e.g. dev → staging, or cloning a template project). Both operations are **async**: the API acknowledges immediately and delivers the result via notification, correlated by the `messageCoRelationId` you supply.

Preconditions: run **[get-into-project.md](get-into-project.md)** for **each** project — export/import are per-project, so you need an impersonated token for the source and another for the target. Header `x-blocks-key: $ROOT` + Bearer the relevant project's `$PTOK`; `projectKey` in the body = that project's tenant id (`$PTENANT`).

## Steps

1. Generate a correlation id (any UUID) — you'll use it to match the completion notification.

2. `POST /data/v4/schema-exchange/export` — against the **source** project (headers = source tenant_id + a token valid there).
   ```json
   {
     "projectKey": "<source tenant_id>",
     "messageCoRelationId": "<uuid>",
     "exportOption": 0
   }
   ```
   - `projectKey` is the only required field.
   - `exportOption` is a `0|1|2|3` int enum with unpublished member names — meanings unknown; `0` is the safest default, or compare with what the OS portal sends when exporting.
   - Per the swagger, the call "returns immediately with the fileId" and the exported JSON is delivered via notification. Keep `data.itemId` — verify live whether it is the fileId; the notification correlated by `messageCoRelationId` is authoritative (subscribe via the **blocks-os** skill's Notification capability).

3. Wait for the export notification (or poll the file): the exported JSON lands in blob storage as a file. Confirm it exists with `GET /data/v4/Files/GetFile?FileId=<fileId>&ConfigurationName=Default` (see **[blocks-data-storage](../../blocks-data-storage/SKILL.md)**) — the `url` lets you inspect the JSON before importing.

4. `POST /data/v4/schema-exchange/import` — against the **target** project. Switch headers to the target's `x-blocks-key` (tenant_id) and a token valid there.
   ```json
   {
     "projectKey": "<target tenant_id>",
     "fileId": "<fileId from the export>",
     "messageCoRelationId": "<new uuid>"
   }
   ```
   - `projectKey` and `fileId` are both required. The `fileId` **must reference a file produced by an export** (swagger: "must reference a file uploaded to blob storage via an export operation") — don't hand-craft the JSON and upload it yourself and expect it to import.
   - Returns an immediate acknowledgement; the import result arrives via notification correlated by the new `messageCoRelationId`.

5. `POST /data/v4/schema-configurations/reload` — against the **target** project, after the import notification reports success, so imported schemas go live in the runtime gateway.

Error paths: 400 `ProblemDetails` → missing `projectKey`/`fileId`. 401 → wrong `x-blocks-key`/expired token; remember the two projects need their own credentials. If the import notification reports failures for individual schemas (shape not documented — inspect live), resolve conflicts (e.g. pre-existing schemas with the same name) in the target and re-import.

## Verify

- `GET /data/v4/schemas?ProjectKey=<target tenant_id>&PageSize=100` — the exported schemas appear in the target with their fields.
- Spot-check one: `GET /data/v4/schemas/info-by-name?schemaName=<name>&projectKey=<target tenant_id>`.
- `GET /data/v4/schemas/unadapted-change-logs?projectKey=<target tenant_id>` — empty after the final reload.
- Whether access policies and validations travel with the export depends on `exportOption` (enum meanings unpublished) — verify with `GET /data-access/policy/get` and `GET /data-validations/by-schema-id` in the target rather than assuming.
