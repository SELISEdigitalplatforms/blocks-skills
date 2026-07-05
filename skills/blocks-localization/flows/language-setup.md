# Set up project languages (including the default)

Use this when a project needs its language list created or changed: adding languages, renaming/correcting a language's code, choosing the default (source) language, or removing a language. Do this **before** creating translation keys — every key resource's `culture` must match a `languageCode` registered here, and machine translation needs a default language to translate *from*.

Preconditions: `x-blocks-key` + Bearer token (see blocks-setup). projectKey = your Blocks Key — pass the same `$X_BLOCKS_KEY` value wherever `projectKey` / `ProjectKey` is required.

## Steps

1. `GET /api/Language/Gets?ProjectKey=<projectKey>` — list what already exists ([endpoints.md#language](../endpoints.md#language)).
   Response is a bare array of `Language` objects: `{ itemId, languageName, languageCode, isDefault, projectKey }`. Keep the `itemId` of any language you plan to update, and note which entry has `isDefault: true`.

2. `POST /api/Language/Save` — once per language to add or update.
   ```json
   {
     "languageName": "German",
     "languageCode": "de",
     "isDefault": false,
     "projectKey": "<projectKey>"
   }
   ```
   - Create: omit `itemId`. Update (e.g. fix a code): include the `itemId` from step 1.
   - Set `isDefault: true` on exactly one language — typically the language your app is authored in.
   - Use the same `languageCode` values you will later use as `culture` in key resources and as `Language` when fetching UILM files. Pick one convention (e.g. `de` or `de-DE`) and stay consistent across the whole project.
   - Response is the `ApiResponse` envelope `{ success, errorMessage, validationErrors }`. It does **not** return the new language's `itemId` — re-run step 1 if you need it.

3. `POST /api/Language/SetDefault` — if the default needs to move to an existing language:
   ```json
   { "languageName": "English", "projectKey": "<projectKey>" }
   ```
   Identified by `languageName`, not id or code. Response shape not documented in swagger — inspect the live response; rely on step 5 to confirm.

4. (Optional) `DELETE /api/Language/Delete?LanguageName=<name>&ProjectKey=<projectKey>` — remove a language. Deletion is by **name**, not `itemId`. Response shape not documented in swagger.
   - Don't delete the default language without first moving the default (step 3).
   - Existing key resources with that culture are not something this endpoint documents cleaning up — after deleting, spot-check a few keys via `POST /api/Key/Gets` for orphaned resources.

Error paths: `401` → refresh the token per blocks-setup. `success: false` in an `ApiResponse` → read `errorMessage` and `validationErrors[].propertyName`/`errorMessage` — typical causes are a missing `projectKey` or duplicate language.

## Verify

`GET /api/Language/Gets?ProjectKey=<projectKey>` — confirm:
- every intended language appears with the right `languageCode`;
- exactly one entry has `isDefault: true`, and it's the one you set.
