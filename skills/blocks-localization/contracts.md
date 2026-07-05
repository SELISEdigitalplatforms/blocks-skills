# blocks-localization — TypeScript Contracts

> Generated from `https://api.seliseblocks.com/localization/v4/swagger/v1/swagger.json` — do not edit by hand.
> Regenerate with `python3 tools/generate-api-docs.py localization`.

Types for every schema referenced by this service's endpoints (see `endpoints.md`).
Integer enums are emitted as numeric unions — the C# member names are not published
in the swagger, so treat the meanings as unverified until observed from the live API.

```ts
export interface ApiResponse {
  success?: boolean;
  errorMessage?: string | null;
  validationErrors?: ValidationFailure[];
}

export interface BaseMutationResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  itemId?: string | null;
}

export interface BlocksLanguageKey {
  itemId?: string | null;
  createDate?: string;
  lastUpdateDate?: string;
  createdBy?: string | null;
  lastUpdatedBy?: string | null;
  tenantId?: string | null;
  keyName?: string | null;
  moduleId?: string | null;
  value?: string | null;
  resources?: Resource[];
  routes?: string[];
  glossaryIds?: string[];
  context?: string | null;
  isPartiallyTranslated?: boolean;
}

export interface BlocksLanguageModule {
  itemId?: string | null;
  createDate?: string;
  lastUpdateDate?: string;
  createdBy?: string | null;
  lastUpdatedBy?: string | null;
  tenantId?: string | null;
  moduleName?: string | null;
  name?: string | null;
}

export interface BlocksWebhook {
  itemId?: string | null;
  createDate?: string;
  lastUpdateDate?: string;
  url: string | null;
  contentType: string | null;
  blocksWebhookSecret: BlocksWebhookSecret;
  isDisabled?: boolean;
  projectKey: string | null;
}

export interface BlocksWebhookSecret {
  secret: string | null;
  headerKey: string | null;
}

export interface DateRange {
  startDate?: string | null;
  endDate?: string | null;
}

export interface DeleteKeysRequest {
  itemIds?: string[];
  projectKey?: string | null;
}

export interface GenerateUilmFilesRequest {
  guid?: string | null;
  moduleId?: string | null;
  projectKey?: string | null;
}

export interface GetGlossariesResponse {
  items?: Glossary[];
  totalCount?: number;
}

export interface GetKeyTimelineQueryResponse {
  totalCount?: number;
  timelines?: KeyTimeline[];
}

export interface GetKeysByKeyNamesRequest {
  keyNames?: string[];
  moduleId?: string | null;
  projectKey?: string | null;
}

export interface GetKeysByKeyNamesResponse {
  keys?: Key[];
  errorMessage?: string | null;
}

export interface GetKeysQueryResponse {
  totalCount?: number;
  keys?: Key[];
}

export interface GetKeysRequest {
  pageSize?: number;
  pageNumber?: number;
  keySearchText?: string | null;
  searchKey?: string | null;
  moduleIds?: string[];
  isPartiallyTranslated?: boolean;
  missingLanguages?: string[];
  createDateRange?: DateRange;
  sortProperty?: string | null;
  isDescending?: boolean;
  projectKey?: string | null;
  resourceSearchFilters?: ResourceSearchFilter[];
  lastUpdateDateRange?: DateRange;
  glossaryId?: string | null;
}

export interface GetLocalizationTimelineResponse {
  totalCount?: number;
  operations?: LocalizationTimelineEntry[];
}

export interface GetSuggestedGlossariesResponse {
  suggestedGlossaries?: Glossary[];
}

export interface Glossary {
  itemId?: string | null;
  name?: string | null;
  language?: string | null;
  type?: string | null;
  context?: string | null;
  additionalNote?: string | null;
  isGlobal?: boolean;
  moduleIds?: string[];
  createDate?: string;
  lastUpdateDate?: string;
  projectKey?: string | null;
}

export interface Key {
  itemId?: string | null;
  keyName?: string | null;
  moduleId?: string | null;
  resources?: Resource[];
  routes?: string[];
  glossaryIds?: string[];
  isPartiallyTranslated?: boolean;
  isNewKey?: boolean;
  lastUpdateDate?: string;
  createDate?: string;
  context?: string | null;
  shouldPublish?: boolean | null;
  projectKey?: string | null;
}

export interface KeyTimeline {
  itemId?: string | null;
  entityId?: string | null;
  createDate?: string;
  lastUpdateDate?: string;
  currentData?: BlocksLanguageKey;
  previousData?: BlocksLanguageKey;
  logFrom?: string | null;
  userId?: string | null;
  rollbackFrom?: string | null;
  userName?: string | null;
  operationId?: string | null;
}

export interface Language {
  itemId?: string | null;
  languageName?: string | null;
  languageCode?: string | null;
  isDefault?: boolean;
  projectKey?: string | null;
}

export interface LocalizationTimelineEntry {
  operationId?: string | null;
  logFrom?: string | null;
  userName?: string | null;
  userId?: string | null;
  createDate?: string;
  affectedKeysCount?: number;
  currentData?: BlocksLanguageKey;
  previousData?: BlocksLanguageKey;
}

export type OutputType = 0 | 1 | 2 | 3 | 4 | 5;  // int enum — member names not published in swagger

export interface Resource {
  value?: string | null;
  culture?: string | null;
  characterLength?: number;
}

export interface ResourceSearchFilter {
  culture?: string | null;
  searchText?: string | null;
}

export interface RollbackRequest {
  itemId?: string | null;
  projectKey?: string | null;
}

export interface SaveModuleRequest {
  itemId?: string | null;
  moduleName?: string | null;
  projectKey?: string | null;
}

export interface SetDefaultLanguageRequest {
  languageName?: string | null;
  projectKey?: string | null;
}

export type Severity = 0 | 1 | 2;  // int enum — member names not published in swagger

export interface SuggestLanguageRequest {
  elementType?: string | null;
  elementApplicationContext?: string | null;
  elementDetailContext?: string | null;
  temperature?: number;
  maxCharacterLength?: number | null;
  sourceText?: string | null;
  destinationLanguage?: string | null;
  currentLanguage?: string | null;
  glossaryIds?: string[];
  moduleId?: string | null;
  destinationLanguageCode?: string | null;
  projectKey?: string | null;
}

export interface TagGlossaryRequest {
  moduleId?: string | null;
  glossaryIds?: string[];
  projectKey?: string | null;
}

export interface TranslateAllRequest {
  moduleId?: string | null;
  messageCoRelationId?: string | null;
  projectKey?: string | null;
  defaultLanguage?: string | null;
}

export interface TranslateBlocksLanguageKeyRequest {
  keyId: string | null;
  messageCoRelationId: string | null;
  projectKey: string | null;
  defaultLanguage: string | null;
}

export interface TranslateBlocksLanguageKeysRequest {
  keyIds: string[];
  messageCoRelationId: string | null;
  projectKey: string | null;
  defaultLanguage: string | null;
}

export interface UilmExportRequest {
  outputType?: OutputType;
  messageCoRelationId?: string | null;
  appIds?: string[];
  languages?: string[];
  referenceFileId?: string | null;
  callerTenantId?: string | null;
  startDate?: string;
  endDate?: string;
  projectKey?: string | null;
}

export interface UilmImportRequest {
  messageCoRelationId?: string | null;
  fileId: string | null;
  projectKey?: string | null;
}

export interface ValidationFailure {
  propertyName?: string | null;
  errorMessage?: string | null;
  attemptedValue?: unknown | null;
  customState?: unknown | null;
  severity?: Severity;
  errorCode?: string | null;
  formattedMessagePlaceholderValues?: Record<string, unknown | null>;
}

```
