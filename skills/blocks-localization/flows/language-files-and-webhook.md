# Generate and retrieve language files; configure the webhook

Use this to publish translations to a running frontend (generate → fetch the per-module JSON language file), to run offline export/import cycles with translators, and to configure the webhook that tells your systems when localization content changed (so you can re-fetch files or bust caches).

Preconditions: keys with translated resources exist ([key-management](key-management.md), [ai-translation](ai-translation.md)); `x-blocks-key` + Bearer token. Note: your app's *runtime* fetch of language files still requires the `x-blocks-key` header — see [references/react.md](../references/react.md).

## Steps — language files

1. `POST /api/Key/GenerateUilmFile` — build/refresh the file server-side. Swagger is explicit: this **must be called before** `GetUilmFile` ([endpoints.md#key](../endpoints.md#key)).
   ```json
   { "guid": "<new-guid>", "moduleId": "<moduleId>", "projectKey": "<projectKey>" }
   ```
   Response shape not documented in swagger. Re-generate after any batch of key changes or a bulk translation run — fetching without regenerating serves stale content.

2. `GET /api/Key/GetUilmFile?Language=<languageCode>&ModuleName=<moduleName>&ProjectKey=<projectKey>` — download the JSON UILM file for one module + language. Note it takes the module **name** here (not `moduleId`) and the language code you registered. The response is described only as "a JSON UILM file" — the exact shape is not documented in swagger; inspect the live response once and code against what you see.

3. `GET /api/Key/GetLanguageFileGenerationHistory?PageSize=20&PageNumber=1&ProjectKey=<projectKey>` — paginated audit of generation runs; use it to confirm your step-1 generation actually ran, and when files were last built. Response shape not documented in swagger — inspect live.

## Steps — export / import (offline translator workflow)

4. `POST /api/Key/UilmExport` — export all or selected modules with their keys:
   ```json
   {
     "outputType": 0,
     "messageCoRelationId": "<new-guid>",
     "appIds": ["<moduleId>", "..."],
     "languages": ["en", "de"],
     "projectKey": "<projectKey>"
   }
   ```
   - `outputType` is an integer enum `0–5` whose member names are **not published in swagger** — the meanings (file formats) are unverified; test values against your project to find the format you need.
   - Modules are selected via `appIds[]` (not `moduleIds`) — a leftover from the UILM-era naming.
   - Response shape not documented; the export lands in the exported-files list (step 5).
5. `GET /api/Key/GetUilmExportedFiles?PageSize=20&PageNumber=1&ProjectKey=<projectKey>` — list exported files (supports `SearchText` and a `CreateDateRange`). Response shape not documented in swagger — inspect live to find the download reference.
6. `POST /api/Key/UilmImport` — bring an edited file back: `{ "fileId": "<fileId>", "messageCoRelationId": "<new-guid>", "projectKey": "<projectKey>" }`. `fileId` is required and refers to a file uploaded to Blocks storage — upload via the **blocks-os** skill (Storage) first. Import semantics per swagger: existing keys are updated, new keys are added, removed keys are ignored, existing modules are not replaced.

## Steps — webhook

7. `GET /api/Config/GetWebHook?ProjectKey=<projectKey>` — read the current config (one webhook per project). Returns the full `BlocksWebhook` shape including the secret ([endpoints.md#config](../endpoints.md#config)).
8. `POST /api/Config/SaveWebHook` — create or update:
   ```json
   {
     "url": "https://ci.example.com/hooks/blocks-localization",
     "contentType": "application/json",
     "blocksWebhookSecret": {
       "secret": "<random-long-secret>",
       "headerKey": "x-localization-signature"
     },
     "isDisabled": false,
     "projectKey": "<projectKey>"
   }
   ```
   - Include `itemId` (from step 7) when updating an existing config; omit for first-time setup.
   - The platform sends the `secret` value in the header named `headerKey` on each delivery — your receiver must check it; reject requests where it doesn't match.
   - Set `isDisabled: true` to pause deliveries without losing the config.
   - Response is the `ApiResponse` envelope — check `success` and `validationErrors`.
   - The delivery payload (when the platform calls your URL) is not documented in this swagger — log the first few deliveries to learn its shape before automating on it.

Typical wiring: webhook → your endpoint calls `GenerateUilmFile` + re-fetches `GetUilmFile` (or invalidates a CDN cache) so deployed apps pick up new translations without a release.

Error paths: `401` → refresh token per blocks-setup. `GetUilmFile` returning empty/stale content → you skipped step 1 or generated for a different module. Webhook not firing → confirm `isDisabled: false` via step 7 and that the URL is publicly reachable.

## Verify

- `GET /api/Key/GetLanguageFileGenerationHistory` — a new entry after step 1.
- `GET /api/Key/GetUilmFile` — returns your latest values for a key you just changed.
- `GET /api/Config/GetWebHook?ProjectKey=<projectKey>` — echoes back the exact `url`, `contentType`, `blocksWebhookSecret.headerKey`, and `isDisabled: false` you saved.
- End-to-end: save a key ([key-management](key-management.md)), watch your webhook receiver log a delivery carrying the configured secret header.
