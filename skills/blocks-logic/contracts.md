# blocks-logic — TypeScript Contracts

> Generated from `https://api.seliseblocks.com/logic/v4/swagger/v1/swagger.json` — do not edit by hand.
> Regenerate with `python3 tools/generate-api-docs.py logic`.

Types for every schema referenced by this service's endpoints (see `endpoints.md`).
Integer enums are emitted as numeric unions — the C# member names are not published
in the swagger, so treat the meanings as unverified until observed from the live API.

```ts
export type AccessModifier = 0 | 1 | 2 | 3;  // int enum — member names not published in swagger

export interface BaseResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
}

export interface DeleteFileRequest {
  fileId?: string | null;
  configurationName?: string | null;
  projectKey?: string | null;
  eventQueueName?: string | null;
}

export interface DeploymentDriverBaseApiResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  data?: unknown | null;
  message?: string | null;
  statusCode?: HttpStatusCode;
  error?: string | null;
  reason?: string | null;
}

export interface DuplicateMailConfigurationRequest {
  configurationId?: string | null;
  projectKey?: string | null;
}

export interface EdgeModel {
  id: string | null;
  source: string | null;
  target: string | null;
  sourceHandle: string | null;
  targetHandle: string | null;
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

export interface GetFilesRequest {
  fileIds?: string[];
  configurationName?: string | null;
  projectKey?: string | null;
}

export interface GetPreSignedUrlForUploadRequest {
  itemId?: string | null;
  metaData?: string | null;
  name?: string | null;
  parentDirectoryId?: string | null;
  tags?: string | null;
  accessModifier?: string | null;
  configurationName?: string | null;
  projectKey?: string | null;
  moduleName?: ModuleName;
  additionalProperties?: Record<string, string>;
}

export interface GetPreSignedUrlForUploadResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  uploadUrl?: string | null;
  fileId?: string | null;
}

export interface GetWorkflowByVersionRequestDto {
  projectKey: string;
  workflowId: string;
  versionId: string;
}

export type HttpStatusCode = 100 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226 | 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308 | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 421 | 422 | 423 | 424 | 426 | 428 | 429 | 431 | 451 | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511;  // int enum — member names not published in swagger

export interface MailConfiguration {
  configurationName?: string | null;
  configurationId?: string | null;
  host?: string | null;
  port?: number;
  enableSSL?: boolean;
  senderName?: string | null;
  senderAddress?: string | null;
  senderUserName?: string | null;
  accountPassword?: string | null;
  lastUpdatedDate?: string;
  projectKey?: string | null;
  isInbound?: boolean;
  provider?: MailServiceProvider;
}

export interface MailServerConfiguration {
  itemId?: string | null;
  createdDate?: string;
  lastUpdatedDate?: string;
  createdBy?: string | null;
  language?: string | null;
  lastUpdatedBy?: string | null;
  organizationIds?: string[];
  tags?: string[];
  name?: string | null;
  host?: string | null;
  port?: number;
  enableSSL?: boolean;
  senderName?: string | null;
  senderAddress?: string | null;
  senderUserName?: string | null;
  accountPassword?: string | null;
  useDefaultCredentials?: boolean;
  smtpClient?: SmtpClient;
  isDefault?: boolean;
  isInbound?: boolean;
  provider?: MailServiceProvider;
}

export type MailServiceProvider = 0 | 1;  // int enum — member names not published in swagger

export type ModuleName = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;  // int enum — member names not published in swagger

export interface NodeDto {
  id: string | null;
  name: string | null;
  category: string | null;
  type: string | null;
  version: string | null;
  position: Position;
  parameters?: unknown;
  settings?: unknown;
}

export interface NodeOutputSchemaField {
  key?: string | null;
  type?: string | null;
}

export interface Position {
  x?: number;
  y?: number;
}

export type SmtpClient = 0 | 1 | 2;  // int enum — member names not published in swagger

export interface StepExecuteRequestDto {
  projectKey: string | null;
  workflowId: string | null;
  nodeId: string | null;
  sourceExecutionId?: string | null;
}

export interface WorkflowCreateRequestDto {
  projectKey: string;
  name: string;
  description?: string | null;
  nodes?: unknown;
  edges?: EdgeModel[];
  settings?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
  nodeOutputSchemas?: Record<string, NodeOutputSchemaField[]>;
}

export interface WorkflowDuplicateRequestDto {
  projectKey: string;
  name: string;
  workflowId: string;
}

export interface WorkflowGetVersionsRequestDto {
  projectKey: string;
  workflowId: string;
}

export interface WorkflowGetsRequestDto {
  projectKey: string;
  search?: string | null;
  isPublished?: boolean | null;
  pageSize?: number;
  pageNumber?: number;
}

export interface WorkflowPublishNewVersionRequestDto {
  projectKey: string;
  workflowId: string;
  name: string;
  description?: string | null;
}

export interface WorkflowPublishVersionRequestDto {
  projectKey: string;
  workflowId: string;
  versionId?: string | null;
}

export interface WorkflowRestoreRequestDto {
  projectKey: string;
  workflowId: string;
  versionId: string;
}

export interface WorkflowUnpublishRequestDto {
  projectKey: string;
  workflowId: string;
}

export interface WorkflowUpdateRequestDto {
  projectKey: string;
  itemId: string;
  name?: string | null;
  nodes?: NodeDto[];
  edges?: EdgeModel[];
  settings?: Record<string, string>;
  isPublished?: boolean | null;
  nodeOutputSchemas?: Record<string, NodeOutputSchemaField[]>;
}

export interface WorkflowVersionCreateRequestDto {
  projectKey: string;
  workflowId: string;
  name: string;
  description?: string | null;
}

export interface WorkflowVersionUpdateRequestDto {
  projectKey: string;
  versionId: string;
  name: string;
  description?: string | null;
}

```
