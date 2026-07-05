# Add and update translation keys (single and bulk)

Use this to create translation keys for new UI, update existing values, or bulk-load a whole page/module worth of strings. Preconditions: languages exist ([language-setup](language-setup.md)); `x-blocks-key` + Bearer token; `projectKey` at hand.

Key naming: use semantic SCREAMING_SNAKE_CASE names that describe the content, not the UI structure — `HOME_HERO_TITLE`, `ERROR_REQUIRED_FIELD`, `NAV_SIGN_IN`. Avoid layout/component prefixes (`FOOTER_`, `MODAL_`, `CARD_`) and numbered fragments (`DESC_1`); don't create keys for untranslatable text (brand names, legal boilerplate).

## Steps

1. `GET /api/Module/Gets?ProjectKey=<projectKey>` — find the target module's `itemId` ([endpoints.md#module](../endpoints.md#module)). Keys reference modules by **id** (`moduleId`), never by name.
   - Missing module? `POST /api/Module/Save` with `{ "moduleName": "dashboard", "projectKey": "<projectKey>" }`. The `ApiResponse` it returns has no `itemId`, so call `Module/Gets` again to pick up the new id.
   - Keep a `common` module for strings shared across routes; per-route modules for the rest.

2. `POST /api/Key/GetsByKeyNames` — check which of your key names already exist, so you upsert instead of duplicating ([endpoints.md#key](../endpoints.md#key)):
   ```json
   { "keyNames": ["HOME_HERO_TITLE", "HOME_HERO_SUBTITLE"], "moduleId": "<moduleId>", "projectKey": "<projectKey>" }
   ```
   Response: `{ keys, errorMessage }`. For every hit, keep `keys[].itemId` — you must include it when updating, otherwise Save creates a duplicate key.

3. Write the keys.
   - **Single key:** `POST /api/Key/Save`
     ```json
     {
       "keyName": "HOME_HERO_TITLE",
       "moduleId": "<moduleId>",
       "resources": [
         { "value": "Build faster", "culture": "en" },
         { "value": "Schneller bauen", "culture": "de" }
       ],
       "routes": ["/home"],
       "context": "Main headline on the landing page hero",
       "projectKey": "<projectKey>"
     }
     ```
   - **Bulk:** `POST /api/Key/SaveKeys` — the body is a **bare JSON array** of the same key objects (not wrapped in an object). All keys saved in one call share a single `operationId` in the timeline, which makes bulk changes auditable and rollback-friendly ([timeline-and-rollback](timeline-and-rollback.md)).
   - Rules for both:
     - `resources[].culture` must match a registered `languageCode` exactly.
     - Include `itemId` for updates (from step 2); omit it for creates.
     - It's fine to provide only the default language's value and leave other languages to machine translation ([ai-translation](ai-translation.md)) — the key will show `isPartiallyTranslated: true` until all languages have values.
     - `context` is worth filling in: the AI translator and human reviewers both use it.
     - Response is `ApiResponse` (`{ success, errorMessage, validationErrors }`) — no ids returned; re-query to get them.

4. Query keys when you need to browse or filter: `POST /api/Key/Gets` with a `GetKeysRequest` body — supports `pageSize`/`pageNumber`, `keySearchText`, `moduleIds`, `isPartiallyTranslated`, `missingLanguages` (e.g. `["de"]` for keys lacking German), `resourceSearchFilters` (search inside translated values per culture), date ranges, and sorting. Response: `{ totalCount, keys }`.

5. Delete when needed:
   - One key: `DELETE /api/Key/Delete?ItemId=<keyItemId>&ProjectKey=<projectKey>`.
   - Many keys: `DELETE /api/Key/DeleteKeys` with JSON body `{ "itemIds": [...], "projectKey": "<projectKey>" }`. Note: a DELETE with a request body — some HTTP clients (and older fetch polyfills) need explicit handling. All deletions in one call share one `operationId` in the timeline.
   - Neither delete documents a response schema in swagger — verify success by re-querying (step 4).

Error paths: `401` → refresh token via blocks-setup. `success: false` → inspect `validationErrors`; the usual culprits are an unknown `moduleId`, a `culture` that doesn't match any registered language, or a missing `projectKey`.

## Verify

- `POST /api/Key/GetsByKeyNames` with the names you just wrote — every key returned, `resources` containing the cultures you sent, `itemId` populated.
- After bulk writes, `GET /api/Key/GetLocalizationTimeline?ProjectKey=<projectKey>&PageSize=5&PageNumber=1` — the newest operation should show your change with the expected `affectedKeysCount`.
