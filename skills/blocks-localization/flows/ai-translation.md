# AI-assisted translation with glossary tagging

Use this to fill in missing translations — either interactively (one suggestion at a time, human in the loop) or in bulk via the asynchronous translation queue — while keeping brand and domain terminology consistent through glossaries.

Preconditions: languages configured with a default ([language-setup](language-setup.md)); keys exist with values in the default language ([key-management](key-management.md)); `x-blocks-key` + Bearer token.

## Steps

1. **Build the glossary** so the AI keeps product terms, tone, and protected words consistent ([endpoints.md#glossary](../endpoints.md#glossary)).
   `POST /api/Glossary/Save`:
   ```json
   {
     "name": "Blocks Console",
     "language": "en",
     "type": "product-term",
     "context": "Product name — never translate",
     "additionalNote": "Keep capitalization exactly as written",
     "isGlobal": true,
     "moduleIds": [],
     "projectKey": "<projectKey>"
   }
   ```
   - `isGlobal: true` applies it project-wide; otherwise scope with `moduleIds`.
   - `type` and `context` are free-text strings — swagger publishes no fixed vocabulary; use consistent values of your own (e.g. `product-term`, `do-not-translate`, `tone`).
   - Response is `ApiResponse` with no `itemId` — list them back with `GET /api/Glossary/Gets?ProjectKey=<projectKey>&PageSize=50&PageNumber=1` (`{ items, totalCount }`) to collect `itemId`s. `SearchText`, `IsGlobal`, and `ModuleId` filters are available.
   - Update by re-saving with `itemId`; remove with `DELETE /api/Glossary/Delete?ItemId=<glossaryId>&ProjectKey=<projectKey>` (response shape not documented in swagger).

2. **Tag glossaries to a module** so every key in that module inherits them: `POST /api/Module/TagGlossary` with `{ "moduleId": "<moduleId>", "glossaryIds": ["<glossaryId>", ...], "projectKey": "<projectKey>" }` ([endpoints.md#module](../endpoints.md#module)). This one returns `BaseMutationResponse` — check `isSuccess` (not `success`).

3. **(Optional) Per-key glossary suggestions:** `GET /api/Glossary/GetSuggestedGlossaries?ItemId=<keyItemId>&ProjectKey=<projectKey>&MaxResults=5` returns `{ suggestedGlossaries }` — glossaries the platform thinks are relevant to that key. Attach the chosen ones by re-saving the key with `glossaryIds` set (`POST /api/Key/Save`, see [key-management](key-management.md)).

4. **Interactive suggestion (human in the loop):** `POST /api/Assistant/GetTranslationSuggestion` ([endpoints.md#assistant](../endpoints.md#assistant)):
   ```json
   {
     "sourceText": "Build faster",
     "currentLanguage": "English",
     "destinationLanguage": "German",
     "destinationLanguageCode": "de",
     "glossaryIds": ["<glossaryId>"],
     "moduleId": "<moduleId>",
     "elementType": "heading",
     "elementApplicationContext": "Marketing landing page",
     "elementDetailContext": "Hero headline above the CTA button",
     "temperature": 0.2,
     "maxCharacterLength": 40,
     "projectKey": "<projectKey>"
   }
   ```
   - All fields optional per swagger; the more context you give (`elementType`, the two context fields, `maxCharacterLength` for space-constrained UI), the better the suggestion.
   - Response shape not documented in swagger — inspect the live response before wiring it into code.
   - This endpoint only *suggests* — persist the accepted text yourself by saving the key with the new resource (`POST /api/Key/Save` with the key's `itemId` and the full `resources` array including the new `{ value, culture }`).

5. **Bulk machine translation (asynchronous queue):** pick the scope —
   - One key: `POST /api/Key/TranslateKey` — `{ "keyId": "<keyItemId>", "messageCoRelationId": "<guid>", "projectKey": "<projectKey>", "defaultLanguage": "en" }`
   - Selected keys: `POST /api/Key/TranslateKeys` — same but `"keyIds": [...]`; all keys in the call share one `operationId` in the timeline.
   - Everything untranslated: `POST /api/Key/TranslateAll` — translates all keys without values; add `"moduleId"` to limit to one module.

   Notes:
   - All four fields are **required** on TranslateKey/TranslateKeys (see `TranslateBlocksLanguageKeyRequest` in [contracts.md](../contracts.md)). Generate a fresh GUID for `messageCoRelationId` and log it — it's your correlation handle.
   - `defaultLanguage` is the source language to translate **from** — use the project default's code.
   - These endpoints enqueue work and return immediately; response shapes are not documented in swagger. Completion is observed, not returned (see Verify).

Error paths: `401` → refresh token per blocks-setup. Empty/odd suggestions from step 4 → add more context fields and check the glossary language matches the source. Bulk translation appearing to do nothing → confirm the keys actually have a value in `defaultLanguage` (nothing to translate from) and that target languages are registered.

## Verify

- Poll `POST /api/Key/Gets` with `{ "moduleIds": ["<moduleId>"], "isPartiallyTranslated": true, "projectKey": "<projectKey>", "pageSize": 1, "pageNumber": 1 }` — `totalCount` should drop toward 0 as the queue drains. Or filter with `missingLanguages: ["de"]` for a specific target language.
- Spot-check a key: `GET /api/Key/Get?ItemId=<keyItemId>&ProjectKey=<projectKey>` — new `resources[]` entries for the target cultures.
- Audit the run: `GET /api/Key/GetLocalizationTimeline?ProjectKey=<projectKey>&PageSize=10&PageNumber=1` — the translation operation appears with its `affectedKeysCount`; drill in with `GetTimelineByOperationId` ([timeline-and-rollback](timeline-and-rollback.md)).
- After translations land, regenerate language files so the frontend sees them ([language-files-and-webhook](language-files-and-webhook.md)).
