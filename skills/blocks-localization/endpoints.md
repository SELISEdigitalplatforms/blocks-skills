# blocks-localization — API Endpoints

> Generated from `https://api.seliseblocks.com/localization/v4/swagger/v1/swagger.json` — do not edit by hand.
> Regenerate with `python3 tools/generate-api-docs.py localization`.

**Base URL:** `https://api.seliseblocks.com/localization/v4`

**Authentication** (see `blocks-setup` skill for obtaining tokens):
- `x-blocks-key: <X_BLOCKS_KEY>` header — required on every request
- `Authorization: Bearer <access_token>` — required for authenticated operations

**35 endpoints** across 6 controllers.

## Contents

- [Assistant](#assistant) (1)
- [Config](#config) (2)
- [Glossary](#glossary) (5)
- [Key](#key) (20)
- [Language](#language) (4)
- [Module](#module) (3)

## Assistant

### `POST /api/Assistant/GetTranslationSuggestion`

**Request body** (`application/json`):

```ts
{
  elementType?: string | null
  elementApplicationContext?: string | null
  elementDetailContext?: string | null
  temperature?: number
  maxCharacterLength?: number | null
  sourceText?: string | null
  destinationLanguage?: string | null
  currentLanguage?: string | null
  glossaryIds?: string[]
  moduleId?: string | null
  destinationLanguageCode?: string | null
  projectKey?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

## Config

### `GET /api/Config/GetWebHook`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ProjectKey` | query | string | yes |  |

**Response 200:**

```ts
{
  itemId?: string | null
  createDate?: string (date-time)
  lastUpdateDate?: string (date-time)
  url: string | null
  contentType: string | null
  blocksWebhookSecret: {
    secret: string | null
    headerKey: string | null
  }
  isDisabled?: boolean
  projectKey: string | null
}
```

### `POST /api/Config/SaveWebHook`

**Request body** (`application/json`):

```ts
{
  itemId?: string | null
  createDate?: string (date-time)
  lastUpdateDate?: string (date-time)
  url: string | null
  contentType: string | null
  blocksWebhookSecret: {
    secret: string | null
    headerKey: string | null
  }
  isDisabled?: boolean
  projectKey: string | null
}
```

**Response 200:**

```ts
{
  success?: boolean
  errorMessage?: string | null
  validationErrors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

## Glossary

### `DELETE /api/Glossary/Delete`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ItemId` | query | string | no |  |
| `ProjectKey` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /api/Glossary/Get`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `itemId` | query | string | no |  |
| `projectKey` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /api/Glossary/GetSuggestedGlossaries`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ItemId` | query | string | no |  |
| `ProjectKey` | query | string | no |  |
| `MaxResults` | query | integer (int32) | no |  |

**Response 200:**

```ts
{
  suggestedGlossaries?: {
    itemId?: string | null
    name?: string | null
    language?: string | null
    type?: string | null
    context?: string | null
    additionalNote?: string | null
    isGlobal?: boolean
    moduleIds?: string[]
    createDate?: string (date-time)
    lastUpdateDate?: string (date-time)
    projectKey?: string | null
  }[]
}
```

### `GET /api/Glossary/Gets`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ProjectKey` | query | string | no |  |
| `SearchText` | query | string | no |  |
| `PageNumber` | query | integer (int32) | no |  |
| `PageSize` | query | integer (int32) | no |  |
| `IsGlobal` | query | boolean | no |  |
| `ModuleId` | query | string | no |  |

**Response 200:**

```ts
{
  items?: {
    itemId?: string | null
    name?: string | null
    language?: string | null
    type?: string | null
    context?: string | null
    additionalNote?: string | null
    isGlobal?: boolean
    moduleIds?: string[]
    createDate?: string (date-time)
    lastUpdateDate?: string (date-time)
    projectKey?: string | null
  }[]
  totalCount?: number
}
```

### `POST /api/Glossary/Save`

**Request body** (`application/json`):

```ts
{
  itemId?: string | null
  name?: string | null
  language?: string | null
  type?: string | null
  context?: string | null
  additionalNote?: string | null
  isGlobal?: boolean
  moduleIds?: string[]
  createDate?: string (date-time)
  lastUpdateDate?: string (date-time)
  projectKey?: string | null
}
```

**Response 200:**

```ts
{
  success?: boolean
  errorMessage?: string | null
  validationErrors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

## Key

### `DELETE /api/Key/Delete`

Deletes a specific key by item ID.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ItemId` | query | string | no |  |
| `ProjectKey` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `DELETE /api/Key/DeleteKeys`

Deletes multiple keys by a list of item IDs. All deleted keys share the same OperationId in the timeline.

**Request body** (`application/json`):

```ts
{
  itemIds?: string[]
  projectKey?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Key/GenerateUilmFile`

Generates a UILM file for download. Must be called before calling /key/getuilmfile.

**Request body** (`application/json`):

```ts
{
  guid?: string | null
  moduleId?: string | null
  projectKey?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /api/Key/Get`

Retrieves a specific key by item ID.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ItemId` | query | string | no |  |
| `ProjectKey` | query | string | no |  |

**Response 200:**

```ts
{
  itemId?: string | null
  keyName?: string | null
  moduleId?: string | null
  resources?: {
    value?: string | null
    culture?: string | null
    characterLength?: number
  }[]
  routes?: string[]
  glossaryIds?: string[]
  isPartiallyTranslated?: boolean
  isNewKey?: boolean
  lastUpdateDate?: string (date-time)
  createDate?: string (date-time)
  context?: string | null
  shouldPublish?: boolean | null
  projectKey?: string | null
}
```

### `GET /api/Key/GetLanguageFileGenerationHistory`

Gets a paginated list of language file generation history entries.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `PageSize` | query | integer (int32) | no |  |
| `PageNumber` | query | integer (int32) | no |  |
| `ProjectKey` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /api/Key/GetLocalizationTimeline`

Retrieves the localization-level overview timeline grouped by operation.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `PageSize` | query | integer (int32) | no |  |
| `PageNumber` | query | integer (int32) | no |  |
| `UserId` | query | string | no |  |
| `LogFrom` | query | string | no |  |
| `LogFromValues` | query | array | no |  |
| `ExcludeLogFromValues` | query | array | no |  |
| `CreateDateRange.StartDate` | query | string (date-time) | no |  |
| `CreateDateRange.EndDate` | query | string (date-time) | no |  |
| `SortProperty` | query | string | no |  |
| `IsDescending` | query | boolean | no |  |
| `ProjectKey` | query | string | no |  |

**Response 200:**

```ts
{
  totalCount?: number
  operations?: {
    operationId?: string | null
    logFrom?: string | null
    userName?: string | null
    userId?: string | null
    createDate?: string (date-time)
    affectedKeysCount?: number
    currentData?: {
      itemId?: string | null
      createDate?: string (date-time)
      lastUpdateDate?: string (date-time)
      createdBy?: string | null
      lastUpdatedBy?: string | null
      tenantId?: string | null
      keyName?: string | null
      moduleId?: string | null
      value?: string | null
      resources?: {
        value?: string | null
        culture?: string | null
        characterLength?: number
      }[]
      routes?: string[]
      glossaryIds?: string[]
      context?: string | null
      isPartiallyTranslated?: boolean
    }
    previousData?: {
      itemId?: string | null
      createDate?: string (date-time)
      lastUpdateDate?: string (date-time)
      createdBy?: string | null
      lastUpdatedBy?: string | null
      tenantId?: string | null
      keyName?: string | null
      moduleId?: string | null
      value?: string | null
      resources?: {
        value?: string | null
        culture?: string | null
        characterLength?: number
      }[]
      routes?: string[]
      glossaryIds?: string[]
      context?: string | null
      isPartiallyTranslated?: boolean
    }
  }[]
}
```

### `GET /api/Key/GetTimeline`

Retrieves Key timeline with pagination.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `PageSize` | query | integer (int32) | no |  |
| `PageNumber` | query | integer (int32) | no |  |
| `EntityId` | query | string | no |  |
| `UserId` | query | string | no |  |
| `CreateDateRange.StartDate` | query | string (date-time) | no |  |
| `CreateDateRange.EndDate` | query | string (date-time) | no |  |
| `SortProperty` | query | string | no |  |
| `IsDescending` | query | boolean | no |  |
| `ProjectKey` | query | string | no |  |

**Response 200:**

```ts
{
  totalCount?: number
  timelines?: {
    itemId?: string | null
    entityId?: string | null
    createDate?: string (date-time)
    lastUpdateDate?: string (date-time)
    currentData?: {
      itemId?: string | null
      createDate?: string (date-time)
      lastUpdateDate?: string (date-time)
      createdBy?: string | null
      lastUpdatedBy?: string | null
      tenantId?: string | null
      keyName?: string | null
      moduleId?: string | null
      value?: string | null
      resources?: {
        value?: string | null
        culture?: string | null
        characterLength?: number
      }[]
      routes?: string[]
      glossaryIds?: string[]
      context?: string | null
      isPartiallyTranslated?: boolean
    }
    previousData?: {
      itemId?: string | null
      createDate?: string (date-time)
      lastUpdateDate?: string (date-time)
      createdBy?: string | null
      lastUpdatedBy?: string | null
      tenantId?: string | null
      keyName?: string | null
      moduleId?: string | null
      value?: string | null
      resources?: {
        value?: string | null
        culture?: string | null
        characterLength?: number
      }[]
      routes?: string[]
      glossaryIds?: string[]
      context?: string | null
      isPartiallyTranslated?: boolean
    }
    logFrom?: string | null
    userId?: string | null
    rollbackFrom?: string | null
    userName?: string | null
    operationId?: string | null
  }[]
}
```

### `GET /api/Key/GetTimelineByOperationId`

Retrieves timeline entries for a specific operation by OperationId.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `OperationId` | query | string | no |  |
| `PageSize` | query | integer (int32) | no |  |
| `PageNumber` | query | integer (int32) | no |  |
| `ProjectKey` | query | string | no |  |

**Response 200:**

```ts
{
  totalCount?: number
  timelines?: {
    itemId?: string | null
    entityId?: string | null
    createDate?: string (date-time)
    lastUpdateDate?: string (date-time)
    currentData?: {
      itemId?: string | null
      createDate?: string (date-time)
      lastUpdateDate?: string (date-time)
      createdBy?: string | null
      lastUpdatedBy?: string | null
      tenantId?: string | null
      keyName?: string | null
      moduleId?: string | null
      value?: string | null
      resources?: {
        value?: string | null
        culture?: string | null
        characterLength?: number
      }[]
      routes?: string[]
      glossaryIds?: string[]
      context?: string | null
      isPartiallyTranslated?: boolean
    }
    previousData?: {
      itemId?: string | null
      createDate?: string (date-time)
      lastUpdateDate?: string (date-time)
      createdBy?: string | null
      lastUpdatedBy?: string | null
      tenantId?: string | null
      keyName?: string | null
      moduleId?: string | null
      value?: string | null
      resources?: {
        value?: string | null
        culture?: string | null
        characterLength?: number
      }[]
      routes?: string[]
      glossaryIds?: string[]
      context?: string | null
      isPartiallyTranslated?: boolean
    }
    logFrom?: string | null
    userId?: string | null
    rollbackFrom?: string | null
    userName?: string | null
    operationId?: string | null
  }[]
}
```

### `GET /api/Key/GetUilmExportedFiles`

Gets a paginated list of exported UILM files.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `PageSize` | query | integer (int32) | no |  |
| `PageNumber` | query | integer (int32) | no |  |
| `ProjectKey` | query | string | no |  |
| `SearchText` | query | string | no |  |
| `CreateDateRange.StartDate` | query | string (date-time) | no |  |
| `CreateDateRange.EndDate` | query | string (date-time) | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /api/Key/GetUilmFile`

Returns a JSON UILM file for a specified module and language.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `Language` | query | string | no |  |
| `ModuleName` | query | string | no |  |
| `ProjectKey` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Key/Gets`

Retrieves all available keys based on applied filters.

**Request body** (`application/json`):

```ts
{
  pageSize?: number
  pageNumber?: number
  keySearchText?: string | null
  searchKey?: string | null
  moduleIds?: string[]
  isPartiallyTranslated?: boolean
  missingLanguages?: string[]
  createDateRange?: {
    startDate?: string (date-time) | null
    endDate?: string (date-time) | null
  }
  sortProperty?: string | null
  isDescending?: boolean
  projectKey?: string | null
  resourceSearchFilters?: {
    culture?: string | null
    searchText?: string | null
  }[]
  lastUpdateDateRange?: {
    startDate?: string (date-time) | null
    endDate?: string (date-time) | null
  }
  glossaryId?: string | null
}
```

**Response 200:**

```ts
{
  totalCount?: number
  keys?: {
    itemId?: string | null
    keyName?: string | null
    moduleId?: string | null
    resources?: {
      value?: string | null
      culture?: string | null
      characterLength?: number
    }[]
    routes?: string[]
    glossaryIds?: string[]
    isPartiallyTranslated?: boolean
    isNewKey?: boolean
    lastUpdateDate?: string (date-time)
    createDate?: string (date-time)
    context?: string | null
    shouldPublish?: boolean | null
    projectKey?: string | null
  }[]
}
```

### `POST /api/Key/GetsByKeyNames`

Retrieves keys by an array of key names without pagination or filtering.

**Request body** (`application/json`):

```ts
{
  keyNames?: string[]
  moduleId?: string | null
  projectKey?: string | null
}
```

**Response 200:**

```ts
{
  keys?: {
    itemId?: string | null
    keyName?: string | null
    moduleId?: string | null
    resources?: {
      value?: string | null
      culture?: string | null
      characterLength?: number
    }[]
    routes?: string[]
    glossaryIds?: string[]
    isPartiallyTranslated?: boolean
    isNewKey?: boolean
    lastUpdateDate?: string (date-time)
    createDate?: string (date-time)
    context?: string | null
    shouldPublish?: boolean | null
    projectKey?: string | null
  }[]
  errorMessage?: string | null
}
```

### `POST /api/Key/RollBack`

Reverts keys to a previous state.

**Request body** (`application/json`):

```ts
{
  itemId?: string | null
  projectKey?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Key/Save`

Saves a new or existing key to the system.

**Request body** (`application/json`):

```ts
{
  itemId?: string | null
  keyName?: string | null
  moduleId?: string | null
  resources?: {
    value?: string | null
    culture?: string | null
    characterLength?: number
  }[]
  routes?: string[]
  glossaryIds?: string[]
  isPartiallyTranslated?: boolean
  isNewKey?: boolean
  lastUpdateDate?: string (date-time)
  createDate?: string (date-time)
  context?: string | null
  shouldPublish?: boolean | null
  projectKey?: string | null
}
```

**Response 200:**

```ts
{
  success?: boolean
  errorMessage?: string | null
  validationErrors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

### `POST /api/Key/SaveKeys`

Saves multiple keys to the system in a single operation.

**Request body** (`application/json`):

```ts
{
  itemId?: string | null
  keyName?: string | null
  moduleId?: string | null
  resources?: {
    value?: string | null
    culture?: string | null
    characterLength?: number
  }[]
  routes?: string[]
  glossaryIds?: string[]
  isPartiallyTranslated?: boolean
  isNewKey?: boolean
  lastUpdateDate?: string (date-time)
  createDate?: string (date-time)
  context?: string | null
  shouldPublish?: boolean | null
  projectKey?: string | null
}[]
```

**Response 200:**

```ts
{
  success?: boolean
  errorMessage?: string | null
  validationErrors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

### `POST /api/Key/TranslateAll`

Translates all keys without values. If a module is specified, only keys from that module are translated.

**Request body** (`application/json`):

```ts
{
  moduleId?: string | null
  messageCoRelationId?: string | null
  projectKey?: string | null
  defaultLanguage?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Key/TranslateKey`

Translates a specific BlocksLanguageKey by sending it to the translation queue.

**Request body** (`application/json`):

```ts
{
  keyId: string | null
  messageCoRelationId: string | null
  projectKey: string | null
  defaultLanguage: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Key/TranslateKeys`

Translates multiple BlocksLanguageKeys by sending a single bulk event to the translation queue.  
All translated keys share the same OperationId in the timeline.

**Request body** (`application/json`):

```ts
{
  keyIds: string[]
  messageCoRelationId: string | null
  projectKey: string | null
  defaultLanguage: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Key/UilmExport`

Exports all modules or selected ones with their keys.

**Request body** (`application/json`):

```ts
{
  outputType?: 0 | 1 | 2 | 3 | 4 | 5 (int enum)
  messageCoRelationId?: string | null
  appIds?: string[]
  languages?: string[]
  referenceFileId?: string | null
  callerTenantId?: string | null
  startDate?: string (date-time)
  endDate?: string (date-time)
  projectKey?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Key/UilmImport`

Imports a UILM file. Existing keys are updated. Existing modules are not replaced. New keys are added; removed keys are ignored.

**Request body** (`application/json`):

```ts
{
  messageCoRelationId?: string | null
  fileId: string | null
  projectKey?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

## Language

### `DELETE /api/Language/Delete`

Deletes a specific language.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `LanguageName` | query | string | no |  |
| `ProjectKey` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /api/Language/Gets`

Retrieves all available languages.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ProjectKey` | query | string | no |  |

**Response 200:**

```ts
{
  itemId?: string | null
  languageName?: string | null
  languageCode?: string | null
  isDefault?: boolean
  projectKey?: string | null
}[]
```

### `POST /api/Language/Save`

Saves a new or existing language.

**Request body** (`application/json`):

```ts
{
  itemId?: string | null
  languageName?: string | null
  languageCode?: string | null
  isDefault?: boolean
  projectKey?: string | null
}
```

**Response 200:**

```ts
{
  success?: boolean
  errorMessage?: string | null
  validationErrors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

### `POST /api/Language/SetDefault`

Sets the default language.

**Request body** (`application/json`):

```ts
{
  languageName?: string | null
  projectKey?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

## Module

### `GET /api/Module/Gets`

Retrieves a list of all available modules.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ProjectKey` | query | string | no |  |

**Response 200:**

```ts
{
  itemId?: string | null
  createDate?: string (date-time)
  lastUpdateDate?: string (date-time)
  createdBy?: string | null
  lastUpdatedBy?: string | null
  tenantId?: string | null
  moduleName?: string | null
  name?: string | null
}[]
```

### `POST /api/Module/Save`

Saves a new module or updates an existing one.

**Request body** (`application/json`):

```ts
{
  itemId?: string | null
  moduleName?: string | null
  projectKey?: string | null
}
```

**Response 200:**

```ts
{
  success?: boolean
  errorMessage?: string | null
  validationErrors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

### `POST /api/Module/TagGlossary`

**Request body** (`application/json`):

```ts
{
  moduleId?: string | null
  glossaryIds?: string[]
  projectKey?: string | null
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  itemId?: string | null
}
```
