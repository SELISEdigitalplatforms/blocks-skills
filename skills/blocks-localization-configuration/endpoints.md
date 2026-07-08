# Localization — endpoint contracts

From the live localization swagger. Base `https://api.seliseblocks.com/localization/v4` (PascalCase controllers, no `/api`). Headers: `x-blocks-key: <ROOT>` + `Authorization: Bearer <PTOK>`. `projectKey` in bodies / `ProjectKey` in query = `<PTENANT>`. Save responses are `{ success, errorMessage, validationErrors[] }`.

## Languages

### List — `GET /Language/Gets?ProjectKey=<PTENANT>`
→ `[{ itemId, languageName, languageCode, isDefault, projectKey }]`. `languageCode` is a culture (`en-US`, `de-DE`, `bn-BD`).

### Create / update — `POST /Language/Save`
```json
{ "itemId": "", "languageName": "German", "languageCode": "de-DE", "isDefault": false, "projectKey": "<PTENANT>" }
```
New language → `itemId: ""`; edit → pass the existing `itemId`.

### Set the default — `POST /Language/SetDefault`
```json
{ "languageName": "English", "projectKey": "<PTENANT>" }
```

### Delete — `DELETE /Language/Delete?LanguageName=<name>&ProjectKey=<PTENANT>`

## Modules

### List — `GET /Module/Gets?ProjectKey=<PTENANT>`
→ `[{ itemId, moduleName, name, tenantId, createDate, lastUpdateDate, createdBy, lastUpdatedBy }]`.

### Create / update — `POST /Module/Save`
```json
{ "itemId": "", "moduleName": "login", "projectKey": "<PTENANT>" }
```
Keep the returned/looked-up module `itemId` — it is the `moduleId` keys reference.

## Keys

### Save one — `POST /Key/Save`
```json
{
  "itemId": "",
  "keyName": "LOGIN",
  "moduleId": "25b40560-43b1-4263-88e7-407099e3b075",
  "resources": [
    { "value": "Login",    "culture": "en-US" },
    { "value": "Anmelden", "culture": "de-DE" },
    { "value": "লগইন",     "culture": "bn-BD" }
  ],
  "routes": [],
  "glossaryIds": [],
  "isPartiallyTranslated": false,
  "isNewKey": true,
  "context": "",
  "shouldPublish": true,
  "projectKey": "<PTENANT>"
}
```
- **`resources`** = one `{ value, culture }` per configured language; `culture` must equal a language's `languageCode` exactly. `value` is the translated text — **you fill it** by translating `keyName` (use `context` as a hint if the key name is ambiguous).
- New key → `isNewKey: true`, `itemId: ""`; edit → existing `itemId`, `isNewKey: false`.
- `isPartiallyTranslated: true` if some languages are still missing a value.
- `routes` optionally scopes a key to page routes; `glossaryIds` links glossary terms.

### Save many (recommended) — `POST /Key/SaveKeys`
Body is an **array** of the `/Key/Save` object. Prefer this whenever saving more than one key.

### Search / list — `POST /Key/Gets`
```json
{ "pageNumber": 1, "pageSize": 50, "moduleIds": ["<moduleId>"], "keySearchText": "", "isPartiallyTranslated": null, "missingLanguages": [], "projectKey": "<PTENANT>" }
```
→ `{ totalCount, keys: [ <key> ] }`. Filter by module, search text, partial-translation state, or `missingLanguages` (find keys lacking a given culture).

### Fetch by names — `POST /Key/GetsByKeyNames`
```json
{ "keyNames": ["LOGIN", "LOGOUT"], "moduleId": "<moduleId>", "projectKey": "<PTENANT>" }
```
→ `{ keys: [ <key> ], errorMessage }`. Use before editing to get current `itemId`s and existing resources.

### Get one — `GET /Key/Get?ItemId=<keyItemId>&ProjectKey=<PTENANT>` → the full key object.

### Delete — `DELETE /Key/Delete` / `DELETE /Key/DeleteKeys` (by id(s)).

## Generate runtime files (mandatory) — `POST /Key/GenerateUilmFile`
```json
{ "guid": "<any uuid, correlation id>", "moduleId": "<moduleId>", "projectKey": "<PTENANT>" }
```
Produces the UILM language files the frontend reads. **Run this after every key change**, once per affected module. Until it succeeds, `/Key/GetUilmFile` (implementation) returns stale data.

## Optional: platform AI translation — `POST /Key/TranslateKeys`
```json
{ "keyIds": ["<keyItemId>"], "defaultLanguage": "en-US", "messageCoRelationId": "<uuid>", "projectKey": "<PTENANT>" }
```
Asks the platform to machine-translate the given keys from `defaultLanguage` into the other languages (async; result correlated by `messageCoRelationId`). An alternative to filling `resources` values yourself — review machine output before generating. Related: `/Key/TranslateKey`, `/Key/TranslateAll`.

## History / timeline (read)
- `GET /Key/GetLanguageFileGenerationHistory` — past UILM generations.
- `GET /Key/GetLocalizationTimeline` / `GetTimeline` / `GetTimelineByOperationId` — change history; `POST /Key/RollBack` reverts an operation.
- `POST /Key/UilmExport` / `POST /Key/UilmImport` — export/import translation files between environments.
