# Localization Contracts

> All types confirmed against the UILM v1 Swagger spec at `https://api.example.com/uilm/v1/swagger/v1/swagger.json`.
>
> **API Base URL pattern:** Environment variable contains the base URL (e.g. `https://api.example.com`). All endpoints append `/uilm/v1/...`. Do NOT add `/api/v1` — the localization API uses `/uilm/v1` as its prefix. Example: `getUilmFile` → `https://api.example.com/uilm/v1/Key/GetUilmFile?Language=en&ModuleName=common&ProjectKey=KEY`.
>
> **Key Naming:** Use `SCREAMING_SNAKE_CASE` with semantic names. See the Translation Key Naming Conventions section in `SKILL.md`. Bad: `FOOTER_PRODUCT`, `FEATURE_SHIP_HOURS_TITLE`, `NAV_SIGN_IN`, `FOOTER_SERVICES`. Good: `SIGN_IN`, `DASHBOARD_OVERVIEW`, `PRODUCT`, `SERVICES`.

## Common Headers

```
Authorization: Bearer {accessToken}
x-blocks-key: {projectKey}
Content-Type: application/json
```

> The API accepts **Bearer JWT token** OR **x-blocks-key header**. Use whichever is configured for the project. The older `Authorization: ApiKey {key}` pattern is deprecated.

---

## Common Response: ApiResponse

```json
{
  "success": true,
  "errorMessage": null,
  "validationErrors": []
}
```

> `success` (not `isSuccess`) indicates outcome. `validationErrors` is an **array**, not a dictionary.

---

## Languages

### Language

```json
{
  "itemId": "string (nullable — omit to create)",
  "languageName": "string",
  "languageCode": "string",
  "isDefault": false,
  "isRTL": false,
  "projectKey": "string"
}
```

> Use `languageName` (not `name`), `languageCode` (not `code`). Omit `itemId` to create; include `itemId` to update.

### GetLanguagesResponse

```json
[
  {
    "itemId": "string",
    "languageName": "string",
    "languageCode": "string",
    "isDefault": false,
    "isRTL": false,
    "projectKey": "string"
  }
]
```

> The API returns an **array directly**, not wrapped in `data`. Use `languageCode` (not `code`) and `languageName` (not `name`).

### SetDefaultLanguageRequest

```json
{
  "languageName": "string",
  "projectKey": "string"
}
```

> Use `languageName` (not `languageId` or `itemId`).

### DeleteLanguageRequest (query params)

| Param | Type | Required |
|-------|------|----------|
| LanguageName | string | yes |
| ProjectKey | string | yes |

> Uses `LanguageName` query param — **not** `itemId`.

---

## Modules

### SaveModuleRequest

```json
{
  "itemId": "string (nullable — omit to create)",
  "moduleName": "string",
  "projectKey": "string"
}
```

> Omit `itemId` to create. Include `itemId` to update. Use `moduleName` (not `name`).

### BlocksLanguageModule (GetModulesResponse item)

```json
{
  "itemId": "string",
  "moduleName": "string",
  "name": "string",
  "createDate": "2024-01-01T00:00:00Z",
  "lastUpdateDate": "2024-01-01T00:00:00Z",
  "createdBy": "string",
  "lastUpdatedBy": "string",
  "tenantId": "string"
}
```

> The API returns an **array directly**. Use `moduleName` (not `name`).

---

## Keys

### Resource

Each translation value within a key is stored as a `Resource`:

```json
{
  "value": "string",
  "culture": "string",
  "characterLength": 0
}
```

> `culture` is the language code (e.g., `"en"`, `"de-DE"`). This replaces the flat `{languageCode, value}` pattern.

### Key

> [!IMPORTANT]
> `keyName` must follow **semantic naming conventions** — use SCREAMING_SNAKE_CASE with meaningful names. Bad: `BTN_SIGN_IN`, `FOOTER_PRODUCT`, `FEATURE_SHIP_HOURS_TITLE`, `DESC_1`. Good: `NAV_SIGN_IN`, `HOME_HERO_TITLE`, `HOME_SHIP_HOURS_DESC`. See the "Translation Key Naming Conventions" section in `SKILL.md`.

```json
{
  "itemId": "string (nullable — omit to create)",
  "keyName": "string",
  "moduleId": "string",
  "resources": [
    { "value": "string", "culture": "string", "characterLength": 0 }
  ],
  "routes": ["string"],
  "glossaryIds": ["string"],
  "isPartiallyTranslated": false,
  "isNewKey": false,
  "lastUpdateDate": "2024-01-01T00:00:00Z",
  "createDate": "2024-01-01T00:00:00Z",
  "context": "string",
  "shouldPublish": true,
  "projectKey": "string"
}
```

> Use `moduleId` (not `moduleName`). Use `resources[]` (not `translations[]`). Omit `itemId` to create; include `itemId` to update.

### SaveKeyRequest

```json
{
  "itemId": "string (nullable — omit to create)",
  "keyName": "string",
  "moduleId": "string",
  "resources": [
    { "value": "string", "culture": "string", "characterLength": 0 }
  ],
  "projectKey": "string"
}
```

> Use `moduleId` (not `moduleName`). Use `resources[]` (not `translations[]`).

### SaveKeysRequest (batch)

```json
{
  "projectKey": "string",
  "moduleId": "string",
  "keys": [
    {
      "itemId": "string (nullable)",
      "keyName": "string",
      "resources": [
        { "value": "string", "culture": "string", "characterLength": 0 }
      ]
    }
  ]
}
```

> Use `moduleId` (not `moduleName`). Use `resources[]` (not `translations[]`).

### GetKeysRequest

```json
{
  "pageSize": 20,
  "pageNumber": 1,
  "keySearchText": "string",
  "searchKey": "string",
  "moduleIds": ["string"],
  "isPartiallyTranslated": false,
  "createDateRange": { "startDate": "date-time", "endDate": "date-time" },
  "sortProperty": "string",
  "isDescending": false,
  "projectKey": "string",
  "resourceSearchFilters": [
    { "culture": "string", "searchText": "string" }
  ],
  "lastUpdateDateRange": { "startDate": "date-time", "endDate": "date-time" }
}
```

> Uses `moduleIds` (plural, array) — not `moduleName`. Uses `keySearchText` and `searchKey` for text search. Uses `isPartiallyTranslated` (not `untranslatedOnly`).

### GetKeysQueryResponse

```json
{
  "totalCount": 0,
  "keys": [
    {
      "itemId": "string",
      "keyName": "string",
      "moduleId": "string",
      "resources": [
        { "value": "string", "culture": "string", "characterLength": 0 }
      ],
      "routes": ["string"],
      "glossaryIds": ["string"],
      "isPartiallyTranslated": false,
      "isNewKey": false,
      "context": "string",
      "shouldPublish": true,
      "projectKey": "string",
      "lastUpdateDate": "2024-01-01T00:00:00Z",
      "createDate": "2024-01-01T00:00:00Z"
    }
  ]
}
```

> Response uses `keys[]` (not `data[]`). Use `itemId` (not `keyId`). Uses `resources[]` (not `translations[]`).

### GetKeysByKeyNamesRequest

```json
{
  "keyNames": ["string"],
  "moduleId": "string",
  "projectKey": "string"
}
```

> Uses `moduleId` (not `moduleName`).

### GetKeysByKeyNamesResponse

```json
{
  "keys": [
    {
      "itemId": "string",
      "keyName": "string",
      "moduleId": "string",
      "resources": [
        { "value": "string", "culture": "string", "characterLength": 0 }
      ]
    }
  ],
  "errorMessage": null
}
```

> Response uses `keys[]`. Uses `resources[]` (not `translations[]`).

### GetKeyRequest (query params)

| Param | Type | Required |
|-------|------|----------|
| ItemId | string | yes |
| ProjectKey | string | yes |

> Uses `ItemId` (not `keyId`).

### GetKeyResponse

```json
{
  "itemId": "string",
  "keyName": "string",
  "moduleId": "string",
  "resources": [
    { "value": "string", "culture": "string", "characterLength": 0 }
  ],
  "isPartiallyTranslated": false,
  "context": "string"
}
```

> Uses `itemId` (not `keyId`). Uses `resources[]` (not `translations[]`).

### DeleteKeyRequest (query params)

| Param | Type | Required |
|-------|------|----------|
| ItemId | string | yes |
| ProjectKey | string | yes |

> Uses `ItemId` (not `keyId`).

### GetKeyTimelineRequest (query params)

| Param | Type | Required |
|-------|------|----------|
| PageSize | integer | yes |
| PageNumber | integer | yes |
| EntityId | string | yes |
| UserId | string | no |
| CreateDateRange.StartDate | date-time | no |
| CreateDateRange.EndDate | date-time | no |
| SortProperty | string | no |
| IsDescending | boolean | no |
| ProjectKey | string | yes |

> Uses `EntityId` (not `keyId`) — the timeline is keyed by entity, not by key type.

### GetKeyTimelineQueryResponse

```json
{
  "totalCount": 0,
  "timelines": [
    {
      "itemId": "string",
      "entityId": "string",
      "createDate": "2024-01-01T00:00:00Z",
      "lastUpdateDate": "2024-01-01T00:00:00Z",
      "currentData": { "$ref": "#/components/schemas/BlocksLanguageKey" },
      "previousData": { "$ref": "#/components/schemas/BlocksLanguageKey" },
      "logFrom": "string",
      "userId": "string",
      "rollbackFrom": "string",
      "userName": "string",
      "operationId": "string"
    }
  ]
}
```

> Uses `timelines[]` (not `data[]`). Each entry has `currentData` and `previousData` (full `BlocksLanguageKey` snapshots).

### BlocksLanguageKey

```json
{
  "itemId": "string",
  "createDate": "2024-01-01T00:00:00Z",
  "lastUpdateDate": "2024-01-01T00:00:00Z",
  "createdBy": "string",
  "lastUpdatedBy": "string",
  "tenantId": "string",
  "keyName": "string",
  "moduleId": "string",
  "value": "string",
  "resources": [
    { "value": "string", "culture": "string", "characterLength": 0 }
  ],
  "routes": ["string"],
  "glossaryIds": ["string"],
  "context": "string",
  "isPartiallyTranslated": false
}
```

> The `value` field is the default/unlocalized value. `resources[]` holds per-language values via `culture` codes.

---

## UILM File Operations

### TranslateAllRequest

```json
{
  "moduleId": "string",
  "messageCoRelationId": "string",
  "projectKey": "string",
  "defaultLanguage": "string"
}
```

> Uses `moduleId` (not `moduleName`). `messageCoRelationId` is a UUID for tracking. `defaultLanguage` is the source language code.

### TranslateBlocksLanguageKeyRequest

```json
{
  "keyId": "string",
  "messageCoRelationId": "string",
  "projectKey": "string",
  "defaultLanguage": "string"
}
```

> `keyId` and `defaultLanguage` are required. `messageCoRelationId` is required — generate a UUID for each request.

### GetUilmFileRequest (query params)

| Param | Type | Required |
|-------|------|----------|
| Language | string | yes | Capitalized — not `languageCode` |
| ModuleName | string | yes | Not `moduleId` |
| ProjectKey | string | yes | |

> Returns a **flat JSON object** directly — `{ "KEY": "value" }` — NOT wrapped in `data` or `{translations: {...}}`. Do NOT access `.translations`.

### GenerateUilmFilesRequest

```json
{
  "guid": "string",
  "moduleId": "string",
  "projectKey": "string"
}
```

> Uses `moduleId` (not `moduleName`). `guid` is optional (server generates if omitted).

### UilmImportRequest

```json
{
  "messageCoRelationId": "string",
  "fileId": "string",
  "projectKey": "string"
}
```

> **Import is file-ID based**, not raw file upload. Upload the file separately to get a `fileId`, then pass that `fileId` here. Does NOT accept multipart file upload.

### UilmExportRequest

```json
{
  "outputType": 0,
  "messageCoRelationId": "string",
  "appIds": ["string"],
  "languages": ["string"],
  "referenceFileId": "string",
  "callerTenantId": "string",
  "startDate": "date-time",
  "endDate": "date-time",
  "projectKey": "string"
}
```

> Uses `appIds[]` (not `moduleIds[]`). `outputType` is an enum (0-5). `languages[]` filters by language codes.

### RollbackRequest

```json
{
  "itemId": "string",
  "projectKey": "string"
}
```

---

## Config

### BlocksWebhook

```json
{
  "itemId": "string (nullable — omit to create)",
  "createDate": "2024-01-01T00:00:00Z",
  "lastUpdateDate": "2024-01-01T00:00:00Z",
  "url": "string",
  "contentType": "string",
  "blocksWebhookSecret": {
    "secret": "string",
    "headerKey": "string"
  },
  "isDisabled": false,
  "projectKey": "string"
}
```

> Required fields: `url`, `contentType`, `blocksWebhookSecret.secret`, `blocksWebhookSecret.headerKey`, `projectKey`. The `events` array pattern is not used — the webhook receives all localization events by default.

---

## OutputType Enum

Used by `UilmExportRequest`:

| Value | Meaning |
|-------|---------|
| 0 | Default |
| 1 | Format 1 |
| 2 | Format 2 |
| 3 | Format 3 |
| 4 | Format 4 |
| 5 | Format 5 |

---

## Field Name Reference

| Old (Incorrect) | Correct | Used In |
|-----------------|---------|---------|
| `id` | `itemId` | Language, Key delete/get, Rollback |
| `name` | `languageName` | Language |
| `code` | `languageCode` | Language, Resource.culture |
| `moduleId` (for modules) | `moduleName` | Module/Save, Module/Gets |
| `moduleName` (for keys) | `moduleId` | Key/Save, Key/Gets, TranslateAll, GenerateUilmFile, UilmImport, UilmExport |
| `translations[]` | `resources[]` | Key, GetKeys, GetKeysByNames, SaveKey, SaveKeys |
| `data[]` | `keys[]` | GetKeysQueryResponse, GetKeysByKeyNamesResponse |
| `keyId` | `itemId` | GetKey, GetKeysResponse items |
| `keyId` | `EntityId` | GetKeyTimeline query |
| `languageCode` | `culture` | Resource.culture |
| `languageId` | `languageName` | SetDefaultLanguage |
| `itemId` (delete language) | `LanguageName` | Language/Delete (query param) |
| `filter.search` | `keySearchText` | GetKeysRequest |
| `filter.untranslatedOnly` | `isPartiallyTranslated` | GetKeysRequest |
| `moduleIds[]` (in SaveKey body) | `moduleId` (singular) | SaveKey, SaveKeys |
| `moduleIds[]` (in export) | `appIds[]` | UilmExportRequest |
| `language` | `languageCode` | GetUilmFile (as `Language`), Glossary.language |
| `languageCode` (import/export body) | Not used in import | UilmImport uses fileId, not languageCode |
| `moduleId` (for modules) | `moduleName` | Module/Save, Module/Gets |
