# blocks-data — TypeScript Contracts

> Generated from `https://api.seliseblocks.com/data/v4/swagger/v1/swagger.json` — do not edit by hand.
> Regenerate with `python3 tools/generate-api-docs.py data`.

Types for every schema referenced by this service's endpoints (see `endpoints.md`).
Integer enums are emitted as numeric unions — the C# member names are not published
in the swagger, so treat the meanings as unverified until observed from the live API.

```ts
export interface 0ServiceResponseOfPaginationResponse {
  isSuccess?: boolean;
  message?: string | null;
  httpStatusCode?: number;
  data?: PaginationResponseOfSchemaDefinitionResponse;
  errors?: ValidationFailure[];
}

export interface 0ServiceResponseOfPaginationResponse {
  isSuccess?: boolean;
  message?: string | null;
  httpStatusCode?: number;
  data?: PaginationResponseOfDataValidationResponse;
  errors?: ValidationFailure[];
}

export type AccessModifier = 0 | 1 | 2 | 3;  // int enum — member names not published in swagger

export interface ActionResponse {
  acknowledged?: boolean;
  itemId?: string | null;
  totalImpactedData?: number;
  message?: string | null;
}

export interface BaseResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
}

export interface BaseSortRequest {
  property?: string | null;
  isDescending?: boolean;
}

export interface CollectionDetailResponse {
  name?: string | null;
  collectionName?: string | null;
  description?: string | null;
  type?: string | null;
  fields?: CollectionFieldResponse[];
}

export interface CollectionFieldResponse {
  name?: string | null;
  type?: string | null;
  description?: string | null;
  fields?: CollectionFieldResponse[];
}

export interface CollectionListResponse {
  collections?: CollectionSummaryResponse[];
}

export interface CollectionSummaryResponse {
  name?: string | null;
  collectionName?: string | null;
  description?: string | null;
  type?: string | null;
}

export interface CollectionsDataCount {
  collectionName?: string | null;
  schemaName?: string | null;
  count?: number;
}

export type ConditionSource = 0 | 1 | 2;  // int enum — member names not published in swagger

export interface ConfigureSchemaSecurityRequest {
  schemaId?: string | null;
  operation?: PolicyOperation;
  policyType?: PolicyType;
  fieldNames?: string[];
  accessLevel?: SchemaAccessLevel;
}

export interface CreateDataAccessPolicyRequest {
  policyName?: string | null;
  policyDescription?: string | null;
  policyType?: PolicyType;
  operation?: PolicyOperation;
  schemaName?: string | null;
  schemaId?: string | null;
  fieldNames?: string[];
  ruleGroup?: PolicyRuleGroup;
  priority?: number;
  isAllowPolicy?: boolean;
}

export interface CreateDataGatewayConfigurationRequest {
  itemId?: string | null;
  connectionString?: string | null;
  databaseName?: string | null;
  projectKey?: string | null;
}

export interface CreateDataValidationRequest {
  schemaId?: string | null;
  fieldName?: string | null;
  validations?: ValidationRuleRequest[];
}

export interface CreateFolderRequest {
  userId?: string | null;
  itemId?: string | null;
  artifactName?: string | null;
  configurationName?: string | null;
  description?: string | null;
  parentId?: string | null;
  dmsWorkspaceId?: string | null;
  dmsWorkspaceName?: string | null;
  tags?: string[];
  metaData?: Record<string, MetaValuePair>;
  organizationId?: string | null;
  fileStorageId?: string | null;
}

export interface CreateSchemaDefinitionRequest {
  collectionName?: string | null;
  schemaName?: string | null;
  schemaType?: SchemaType;
  fields?: FieldDefinitionRequest[];
}

export interface CreateSchemaRequest {
  collectionName?: string | null;
  schemaName?: string | null;
  schemaType?: SchemaType;
}

export interface DataAccessPolicy {
  itemId?: string | null;
  createdDate?: string;
  lastUpdatedDate?: string;
  createdBy?: string | null;
  language?: string | null;
  lastUpdatedBy?: string | null;
  organizationId?: string | null;
  tags?: string[];
  deletedDate?: string | null;
  isDeleted?: boolean;
  referencePolicyId?: string | null;
  policyName?: string | null;
  policyDescription?: string | null;
  policyType?: PolicyType;
  operation?: PolicyOperation;
  schemaName?: string | null;
  schemaId?: string | null;
  fieldNames?: string[];
  ruleGroup?: PolicyRuleGroup;
  priority?: number;
  isAllowPolicy?: boolean;
}

export interface DataServiceConfigurationResponse {
  dbConnectionString?: string | null;
  isCollectionNameEditable?: boolean;
  collectionNamePattern?: string | null;
  databaseName?: string | null;
  projectKey?: string | null;
  projectShortKey?: string | null;
  itemId?: string | null;
}

export interface DataValidation {
  itemId?: string | null;
  createdDate?: string;
  lastUpdatedDate?: string;
  createdBy?: string | null;
  language?: string | null;
  lastUpdatedBy?: string | null;
  organizationId?: string | null;
  tags?: string[];
  deletedDate?: string | null;
  isDeleted?: boolean;
  schemaId?: string | null;
  fieldName?: string | null;
  validations?: ValidationRule[];
}

export interface DataValidationResponse {
  itemId?: string | null;
  schemaId?: string | null;
  fieldName?: string | null;
  validations?: ValidationRuleResponse[];
  createdDate?: string;
  lastUpdatedDate?: string;
}

export interface DeleteFileRequest {
  fileId?: string | null;
  configurationName?: string | null;
  eventQueueName?: string | null;
}

export interface DeleteFolderRequest {
  folderId: string | null;
  configurationName?: string | null;
}

export interface DeleteMockDataRequest {
  schemaNames?: string[];
}

export interface DmsFileAndFolderInfo {
  parentId?: string | null;
  type?: number;
  name?: string | null;
  fileStorageId?: string | null;
  extension?: string | null;
  sizeInBytes?: string | null;
  version?: number;
  description?: string | null;
  itemId?: string | null;
  lastUpdatedDate?: string;
}

export interface DmsResponse {
  result?: unknown | null;
  message?: string | null;
  httpStatusCode?: HttpStatusCode;
}

export interface ExportSchemaRequest {
  messageCoRelationId?: string | null;
  exportOption?: SchemaExportOption;
}

export interface FieldDefinitionRequest {
  name?: string | null;
  type?: string | null;
  isArray?: boolean;
  isPIIData?: boolean;
  isUniqueData?: boolean;
  description?: string | null;
}

export interface FieldDefinitionResponse {
  name?: string | null;
  type?: string | null;
  isArray?: boolean;
  isPIIData?: boolean;
  isUniqueData?: boolean;
  description?: string | null;
  fields?: FieldDefinitionResponse[];
  readAccessLevel?: SchemaAccessLevel;
  writeAccessLevel?: SchemaAccessLevel;
  editAccessLevel?: SchemaAccessLevel;
  deleteAccessLevel?: SchemaAccessLevel;
  validationRule?: DataValidation;
  totalValidationRules?: number;
  totalReadPolicies?: number;
  totalWritePolicies?: number;
  totalEditPolicies?: number;
  totalDeletePolicies?: number;
}

export interface FileMetaDataResponse {
  type?: string | null;
  value?: string | null;
}

export interface FileResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  url?: string | null;
  accessModifier?: AccessModifier;
  itemId?: string | null;
  tags?: string[];
  metaData?: Record<string, FileMetaDataResponse>;
  name?: string | null;
  parentDirectoryID?: string | null;
  systemName?: string | null;
  type?: number;
  typeString?: string | null;
  createDate?: string;
  createdBy?: string | null;
  language?: string | null;
  tenantId?: string | null;
  sizeInBytes?: number;
}

export interface GetDmsFileAndFolderRequest {
  parentId?: string | null;
  configurationName?: string | null;
  searchKey?: string | null;
  moduleName?: string | null;
  skip?: number | null;
  take?: number | null;
}

export interface GetDmsFileAndFolderResponse {
  dmsFileAndFolderInfos?: DmsFileAndFolderInfo[];
  totalCount?: number;
}

export interface GetFile {
  itemId?: string | null;
  url?: string | null;
  tenantId?: string | null;
  accessModifier?: AccessModifier;
  metaData?: Record<string, MetaValue>;
  name?: string | null;
  parentDirectoryID?: string | null;
  systemName?: string | null;
  type?: StructureType;
  typeString?: string | null;
  currentVersion?: number;
  additionalProperties?: Record<string, string>;
}

export interface GetFilesInfoFilter {
  name?: string | null;
  tenantId?: string | null;
  additionalProperties?: Record<string, string>;
}

export interface GetFilesInfoRequest {
  page?: number;
  pageSize?: number;
  sort?: BaseSortRequest;
  filter?: GetFilesInfoFilter;
}

export interface GetFilesInfoResponse {
  data?: GetFile[];
  errors?: Record<string, string>;
  totalCount?: number;
}

export interface GetFilesRequest {
  fileIds?: string[];
  configurationName?: string | null;
}

export interface GetPreSignedUrlForUploadRequest {
  itemId?: string | null;
  metaData?: string | null;
  name?: string | null;
  parentDirectoryId?: string | null;
  tags?: string | null;
  accessModifier?: string | null;
  configurationName?: string | null;
  moduleName?: ModuleName;
  additionalProperties?: Record<string, string>;
}

export interface GetPreSignedUrlForUploadResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  uploadUrl?: string | null;
  fileId?: string | null;
}

export type HttpStatusCode = 100 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226 | 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308 | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 421 | 422 | 423 | 424 | 426 | 428 | 429 | 431 | 451 | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511;  // int enum — member names not published in swagger

export interface ImportSchemaRequest {
  fileId: string | null;
  messageCoRelationId?: string | null;
}

export interface LocalStorageUploadResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  fileId?: string | null;
  fileVersion?: number;
}

export interface MetaValue {
  type?: string | null;
  value?: string | null;
}

export interface MetaValuePair {
  type?: string | null;
  value?: string | null;
}

export interface MockDataResponse {
  items?: CollectionsDataCount[];
}

export type ModuleName = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;  // int enum — member names not published in swagger

export interface PaginationResponseOfDataValidationResponse {
  totalCount?: number;
  items?: DataValidationResponse[];
}

export interface PaginationResponseOfSchemaDefinitionResponse {
  totalCount?: number;
  items?: SchemaDefinitionResponse[];
}

export type PolicyLogicalOperator = 0 | 1;  // int enum — member names not published in swagger

export type PolicyOperation = 0 | 1 | 2 | 3 | 4;  // int enum — member names not published in swagger

export type PolicyOperator = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;  // int enum — member names not published in swagger

export interface PolicyRule {
  leftSource?: ConditionSource;
  leftOperand?: string | null;
  operator?: PolicyOperator;
  rightSource?: ConditionSource;
  rightOperand?: string | null;
  staticValue?: unknown | null;
  description?: string | null;
}

export interface PolicyRuleGroup {
  logicalOperator?: PolicyLogicalOperator;
  rules?: PolicyRule[];
  nestedGroups?: PolicyRuleGroup[];
}

export type PolicyType = 0 | 1;  // int enum — member names not published in swagger

export interface ProblemDetails {
  type?: string | null;
  title?: string | null;
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
}

export interface RegexAssistantRequest {
  description?: string | null;
  exampleText?: string | null;
  temperature?: number;
  additionalContext?: string | null;
}

export interface SaveFieldDefinitionRequest {
  schemaDefinitionItemId?: string | null;
  deletableFieldNames?: string[];
  fields?: FieldDefinitionRequest[];
}

export type SchemaAccessLevel = 0 | 1 | 2 | 3;  // int enum — member names not published in swagger

export interface SchemaAccessLevelCounts {
  public?: number;
  user?: number;
  custom?: number;
}

export interface SchemaAggregationResponse {
  read?: SchemaAccessLevelCounts;
  write?: SchemaAccessLevelCounts;
  edit?: SchemaAccessLevelCounts;
  delete?: SchemaAccessLevelCounts;
  totalPublicPermission?: number;
  totalUserPermission?: number;
  totalCustomPermission?: number;
}

export interface SchemaDefinitionListResponse {
  schemas?: PaginationResponseOfSchemaDefinitionResponse;
  aggregation?: SchemaAggregationResponse;
}

export interface SchemaDefinitionResponse {
  id?: string | null;
  collectionName?: string | null;
  fields?: FieldDefinitionResponse[];
  schemaName?: string | null;
  schemaType?: SchemaType;
  projectKey?: string | null;
  projectShortKey?: string | null;
  projectSchemaName?: string | null;
  querySchema?: string | null;
  mutationSchemas?: string[];
  readAccessLevel?: SchemaAccessLevel;
  writeAccessLevel?: SchemaAccessLevel;
  editAccessLevel?: SchemaAccessLevel;
  deleteAccessLevel?: SchemaAccessLevel;
  readPolicies?: DataAccessPolicy[];
  writePolicies?: DataAccessPolicy[];
  editPolicies?: DataAccessPolicy[];
  deletePolicies?: DataAccessPolicy[];
  schemaReferences?: string[];
  totalSchemaReferences?: number;
  totalReadPolicies?: number;
  totalWritePolicies?: number;
  totalEditPolicies?: number;
  totalDeletePolicies?: number;
}

export type SchemaExportOption = 0 | 1 | 2 | 3;  // int enum — member names not published in swagger

export type SchemaType = 1 | 2;  // int enum — member names not published in swagger

export interface ServiceResponseOfActionResponse {
  isSuccess?: boolean;
  message?: string | null;
  httpStatusCode?: number;
  data?: ActionResponse;
  errors?: ValidationFailure[];
}

export interface ServiceResponseOfBoolean {
  isSuccess?: boolean;
  message?: string | null;
  httpStatusCode?: number;
  data?: boolean;
  errors?: ValidationFailure[];
}

export interface ServiceResponseOfCollectionDetailResponse {
  isSuccess?: boolean;
  message?: string | null;
  httpStatusCode?: number;
  data?: CollectionDetailResponse;
  errors?: ValidationFailure[];
}

export interface ServiceResponseOfCollectionListResponse {
  isSuccess?: boolean;
  message?: string | null;
  httpStatusCode?: number;
  data?: CollectionListResponse;
  errors?: ValidationFailure[];
}

export interface ServiceResponseOfDataServiceConfigurationResponse {
  isSuccess?: boolean;
  message?: string | null;
  httpStatusCode?: number;
  data?: DataServiceConfigurationResponse;
  errors?: ValidationFailure[];
}

export interface ServiceResponseOfDataValidationResponse {
  isSuccess?: boolean;
  message?: string | null;
  httpStatusCode?: number;
  data?: DataValidationResponse;
  errors?: ValidationFailure[];
}

export interface ServiceResponseOfList {
  isSuccess?: boolean;
  message?: string | null;
  httpStatusCode?: number;
  data?: DataValidationResponse[];
  errors?: ValidationFailure[];
}

export interface ServiceResponseOfMockDataResponse {
  isSuccess?: boolean;
  message?: string | null;
  httpStatusCode?: number;
  data?: MockDataResponse;
  errors?: ValidationFailure[];
}

export interface ServiceResponseOfSchemaDefinitionListResponse {
  isSuccess?: boolean;
  message?: string | null;
  httpStatusCode?: number;
  data?: SchemaDefinitionListResponse;
  errors?: ValidationFailure[];
}

export interface ServiceResponseOfSchemaDefinitionResponse {
  isSuccess?: boolean;
  message?: string | null;
  httpStatusCode?: number;
  data?: SchemaDefinitionResponse;
  errors?: ValidationFailure[];
}

export type Severity = 0 | 1 | 2;  // int enum — member names not published in swagger

export type StructureType = 0 | 1;  // int enum — member names not published in swagger

export interface UpdateDataAccessPolicyRequest {
  itemId?: string | null;
  policyName?: string | null;
  policyDescription?: string | null;
  fieldNames?: string[];
  ruleGroup?: PolicyRuleGroup;
  priority?: number | null;
  isAllowPolicy?: boolean | null;
}

export interface UpdateDataGatewayConfigurationRequest {
  itemId?: string | null;
  connectionString?: string | null;
  databaseName?: string | null;
  projectKey?: string | null;
  isCollectionNameEditable?: boolean;
  collectionNamePattern?: string | null;
}

export interface UpdateDataValidationRequest {
  itemId?: string | null;
  schemaId?: string | null;
  fieldName?: string | null;
  validations?: ValidationRuleRequest[];
}

export interface UpdateFileRequest {
  itemId?: string | null;
  additionalProperties?: Record<string, string>;
}

export interface UpdateSchemaDefinitionRequest {
  collectionName?: string | null;
  schemaName?: string | null;
  schemaType?: SchemaType;
  fields?: FieldDefinitionRequest[];
  itemId?: string | null;
}

export interface UpdateSchemaRequest {
  collectionName?: string | null;
  schemaName?: string | null;
  schemaType?: SchemaType;
  itemId?: string | null;
}

export interface UploadFileRequest {
  userId?: string | null;
  itemId?: string | null;
  artifactName?: string | null;
  configurationName?: string | null;
  description?: string | null;
  parentId?: string | null;
  dmsWorkspaceId?: string | null;
  dmsWorkspaceName?: string | null;
  tags?: string[];
  metaData?: Record<string, MetaValuePair>;
  organizationId?: string | null;
  fileStorageId?: string | null;
}

export interface UploadFilesRequest {
  upload?: UploadFileRequest[];
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

export interface ValidationRule {
  type?: ValidationType;
  value?: unknown | null;
  secondaryValue?: unknown | null;
  errorMessage?: string | null;
  isActive?: boolean;
}

export interface ValidationRuleRequest {
  type?: ValidationType;
  value?: unknown | null;
  secondaryValue?: unknown | null;
  errorMessage?: string | null;
  isActive?: boolean;
}

export interface ValidationRuleResponse {
  type?: ValidationType;
  value?: unknown | null;
  secondaryValue?: unknown | null;
  errorMessage?: string | null;
  isActive?: boolean;
}

export type ValidationType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;  // int enum — member names not published in swagger

```
