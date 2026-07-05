# blocks-logic — API Endpoints

> Generated from `https://api.seliseblocks.com/logic/v4/swagger/v1/swagger.json` — do not edit by hand.
> Regenerate with `python3 tools/generate-api-docs.py logic`.

**Base URL:** `https://api.seliseblocks.com/logic/v4`

**Authentication** (see `blocks-setup` skill for obtaining tokens):
- `x-blocks-key: <X_BLOCKS_KEY>` header — required on every request
- `Authorization: Bearer <access_token>` — required for authenticated operations

**37 endpoints** across 4 controllers.

## Contents

- [Deployment](#deployment) (9)
- [Mail](#mail) (5)
- [Storage](#storage) (4)
- [Workflow](#workflow) (19)
- [Shared platform controllers](#shared-platform-controllers) — documented in other skills

## Deployment

### `GET /api/Deployment/AccessToken`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `code` | query | string | no |  |

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  data?: unknown | null
  message?: string | null
  statusCode?: 100 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226 | 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308 | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 421 | 422 | 423 | 424 | 426 | 428 | 429 | 431 | 451 | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 (int enum)
  error?: string | null
  reason?: string | null
}
```

### `DELETE /api/Deployment/DeleteAuthorization`

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  data?: unknown | null
  message?: string | null
  statusCode?: 100 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226 | 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308 | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 421 | 422 | 423 | 424 | 426 | 428 | 429 | 431 | 451 | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 (int enum)
  error?: string | null
  reason?: string | null
}
```

### `GET /api/Deployment/GetBranches`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `repo` | query | string | no |  |

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  data?: unknown | null
  message?: string | null
  statusCode?: 100 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226 | 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308 | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 421 | 422 | 423 | 424 | 426 | 428 | 429 | 431 | 451 | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 (int enum)
  error?: string | null
  reason?: string | null
}
```

### `GET /api/Deployment/GetRepos`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `Search` | query | string | no |  |
| `PageNumber` | query | integer (int32) | no |  |
| `PageSize` | query | integer (int32) | no |  |

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  data?: unknown | null
  message?: string | null
  statusCode?: 100 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226 | 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308 | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 421 | 422 | 423 | 424 | 426 | 428 | 429 | 431 | 451 | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 (int enum)
  error?: string | null
  reason?: string | null
}
```

### `GET /api/Deployment/GetReposList`

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  data?: unknown | null
  message?: string | null
  statusCode?: 100 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226 | 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308 | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 421 | 422 | 423 | 424 | 426 | 428 | 429 | 431 | 451 | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 (int enum)
  error?: string | null
  reason?: string | null
}
```

### `GET /api/Deployment/GetUser`

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  data?: unknown | null
  message?: string | null
  statusCode?: 100 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226 | 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308 | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 421 | 422 | 423 | 424 | 426 | 428 | 429 | 431 | 451 | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 (int enum)
  error?: string | null
  reason?: string | null
}
```

### `GET /api/Deployment/GithubBranchExists`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `repoId` | query | string | no |  |

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  data?: unknown | null
  message?: string | null
  statusCode?: 100 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226 | 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308 | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 421 | 422 | 423 | 424 | 426 | 428 | 429 | 431 | 451 | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 (int enum)
  error?: string | null
  reason?: string | null
}
```

### `GET /api/Deployment/IsAuthorized`

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  data?: unknown | null
  message?: string | null
  statusCode?: 100 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226 | 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308 | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 421 | 422 | 423 | 424 | 426 | 428 | 429 | 431 | 451 | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 (int enum)
  error?: string | null
  reason?: string | null
}
```

### `POST /api/Deployment/RemoveAuthorization`

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  data?: unknown | null
  message?: string | null
  statusCode?: 100 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226 | 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308 | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 421 | 422 | 423 | 424 | 426 | 428 | 429 | 431 | 451 | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 (int enum)
  error?: string | null
  reason?: string | null
}
```

## Mail

### `DELETE /api/Mail/Delete`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ConfigurationId` | query | string | no |  |
| `ProjectKey` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Mail/Duplicate`

**Request body** (`application/json`):

```ts
{
  configurationId?: string | null
  projectKey?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /api/Mail/Get`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ConfigurationName` | query | string | no |  |
| `ProjectKey` | query | string | no |  |

**Response 200:**

```ts
{
  configurationName?: string | null
  configurationId?: string | null
  host?: string | null
  port?: number
  enableSSL?: boolean
  senderName?: string | null
  senderAddress?: string | null
  senderUserName?: string | null
  accountPassword?: string | null
  lastUpdatedDate?: string (date-time)
  projectKey?: string | null
  isInbound?: boolean
  provider?: 0 | 1 (int enum)
}
```

### `GET /api/Mail/Gets`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ProjectKey` | query | string | no |  |

**Response 200:**

```ts
{
  itemId?: string | null
  createdDate?: string (date-time)
  lastUpdatedDate?: string (date-time)
  createdBy?: string | null
  language?: string | null
  lastUpdatedBy?: string | null
  organizationIds?: string[]
  tags?: string[]
  name?: string | null
  host?: string | null
  port?: number
  enableSSL?: boolean
  senderName?: string | null
  senderAddress?: string | null
  senderUserName?: string | null
  accountPassword?: string | null
  useDefaultCredentials?: boolean
  smtpClient?: 0 | 1 | 2 (int enum)
  isDefault?: boolean
  isInbound?: boolean
  provider?: 0 | 1 (int enum)
}[]
```

### `POST /api/Mail/Save`

**Request body** (`application/json`):

```ts
{
  configurationName?: string | null
  configurationId?: string | null
  host?: string | null
  port?: number
  enableSSL?: boolean
  senderName?: string | null
  senderAddress?: string | null
  senderUserName?: string | null
  accountPassword?: string | null
  lastUpdatedDate?: string (date-time)
  projectKey?: string | null
  isInbound?: boolean
  provider?: 0 | 1 (int enum)
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

## Storage

### `POST /api/Storage/DeleteFile`

**Request body** (`application/json`):

```ts
{
  fileId?: string | null
  configurationName?: string | null
  projectKey?: string | null
  eventQueueName?: string | null
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
}
```

### `GET /api/Storage/GetFile`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `FileId` | query | string | no |  |
| `Version` | query | integer (int64) | no |  |
| `ConfigurationName` | query | string | no |  |
| `ProjectKey` | query | string | no |  |

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  url?: string | null
  accessModifier?: 0 | 1 | 2 | 3 (int enum)
  itemId?: string | null
  tags?: string[]
  metaData?: { [key: string]: {
      type?: string | null
      value?: string | null
    } }
  name?: string | null
  parentDirectoryID?: string | null
  systemName?: string | null
  type?: number
  typeString?: string | null
  createDate?: string (date-time)
  createdBy?: string | null
  language?: string | null
  tenantId?: string | null
  sizeInBytes?: number
}
```

### `POST /api/Storage/GetFiles`

**Request body** (`application/json`):

```ts
{
  fileIds?: string[]
  configurationName?: string | null
  projectKey?: string | null
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  url?: string | null
  accessModifier?: 0 | 1 | 2 | 3 (int enum)
  itemId?: string | null
  tags?: string[]
  metaData?: { [key: string]: {
      type?: string | null
      value?: string | null
    } }
  name?: string | null
  parentDirectoryID?: string | null
  systemName?: string | null
  type?: number
  typeString?: string | null
  createDate?: string (date-time)
  createdBy?: string | null
  language?: string | null
  tenantId?: string | null
  sizeInBytes?: number
}[]
```

### `POST /api/Storage/GetPreSignedUrlForUpload`

**Request body** (`application/json`):

```ts
{
  itemId?: string | null
  metaData?: string | null
  name?: string | null
  parentDirectoryId?: string | null
  tags?: string | null
  accessModifier?: string | null
  configurationName?: string | null
  projectKey?: string | null
  moduleName?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 (int enum)
  additionalProperties?: { [key: string]: string }
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  uploadUrl?: string | null
  fileId?: string | null
}
```

## Workflow

### `POST /api/Workflow/Create`

**Request body** (`application/json`):

```ts
{
  projectKey: string
  name: string
  description?: string | null
  nodes?: unknown
  edges?: {
    id: string | null
    source: string | null
    target: string | null
    sourceHandle: string | null
    targetHandle: string | null
  }[]
  settings?: { [key: string]: string }
  createdAt?: string (date-time)
  updatedAt?: string (date-time)
  nodeOutputSchemas?: { [key: string]: {
      key?: string | null
      type?: string | null
    }[] }
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Workflow/CreateVersion`

**Request body** (`application/json`):

```ts
{
  projectKey: string
  workflowId: string
  name: string
  description?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `DELETE /api/Workflow/Delete`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `Id` | query | string | yes |  |
| `ProjectKey` | query | string | yes |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Workflow/Duplicate`

**Request body** (`application/json`):

```ts
{
  projectKey: string
  name: string
  workflowId: string
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /api/Workflow/Get`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `WorkflowId` | query | string | yes |  |
| `ProjectKey` | query | string | yes |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Workflow/GetAll`

**Request body** (`application/json`):

```ts
{
  projectKey: string
  search?: string | null
  isPublished?: boolean | null
  pageSize?: number
  pageNumber?: number
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /api/Workflow/GetExecution`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ProjectKey` | query | string | yes |  |
| `ExecutionId` | query | string | yes |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /api/Workflow/GetExecutions`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ProjectKey` | query | string | yes |  |
| `WorkflowId` | query | string | yes |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Workflow/GetVersions`

**Request body** (`application/json`):

```ts
{
  projectKey: string
  workflowId: string
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Workflow/GetWorkflowByVersion`

**Request body** (`application/json`):

```ts
{
  projectKey: string
  workflowId: string
  versionId: string
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Workflow/PublishNewVersion`

**Request body** (`application/json`):

```ts
{
  projectKey: string
  workflowId: string
  name: string
  description?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Workflow/PublishVersion`

**Request body** (`application/json`):

```ts
{
  projectKey: string
  workflowId: string
  versionId?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Workflow/Restore`

**Request body** (`application/json`):

```ts
{
  projectKey: string
  workflowId: string
  versionId: string
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Workflow/StepExecute`

**Request body** (`application/json`):

```ts
{
  projectKey: string | null
  workflowId: string | null
  nodeId: string | null
  sourceExecutionId?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Workflow/Unpublish`

**Request body** (`application/json`):

```ts
{
  projectKey: string
  workflowId: string
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `PUT /api/Workflow/Update`

**Request body** (`application/json`):

```ts
{
  projectKey: string
  itemId: string
  name?: string | null
  nodes?: {
    id: string | null
    name: string | null
    category: string | null
    type: string | null
    version: string | null
    position: {
      x?: number
      y?: number
    }
    parameters?: unknown
    settings?: unknown
  }[]
  edges?: {
    id: string | null
    source: string | null
    target: string | null
    sourceHandle: string | null
    targetHandle: string | null
  }[]
  settings?: { [key: string]: string }
  isPublished?: boolean | null
  nodeOutputSchemas?: { [key: string]: {
      key?: string | null
      type?: string | null
    }[] }
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Workflow/UpdateVersion`

**Request body** (`application/json`):

```ts
{
  projectKey: string
  versionId: string
  name: string
  description?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Workflow/Webhook/{projectKey}/{workflowId}/{webhookId}`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `projectKey` | path | string | yes |  |
| `workflowId` | path | string | yes |  |
| `webhookId` | path | string | yes |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Workflow/webhook-test/{projectKey}/{workflowId}/{webhookId}`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `projectKey` | path | string | yes |  |
| `workflowId` | path | string | yes |  |
| `webhookId` | path | string | yes |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

## Shared platform controllers

These routes are also served by this service but are platform-wide controllers.
They are documented in full in their canonical skill — use that skill's docs and
call them on this base URL only if you specifically need this service's instance.

### Documented in `blocks-localization`

| Method | Path | Summary |
|---|---|---|
| GET | `/api/Language/Gets` | Retrieves all available languages. |

### Documented in `blocks-monitor`

| Method | Path | Summary |
|---|---|---|
| DELETE | `/api/Health/DeleteHealth` |  |
| GET | `/api/Health/Ping/{itemId}` |  |
| POST | `/api/Health/SaveHealth` |  |
| POST | `/api/Health/UpdateHealth` |  |
| DELETE | `/api/Monitor/DeleteMonitor` |  |
| GET | `/api/Monitor/GetIncidentList` |  |
| GET | `/api/Monitor/GetMonitorById` |  |
| GET | `/api/Monitor/GetMonitorDetails` |  |
| GET | `/api/Monitor/GetMonitorDownTime` |  |
| GET | `/api/Monitor/GetMonitorList` |  |
| GET | `/api/Monitor/GetMonitorListByRepoId` |  |
| GET | `/api/Monitor/GetMonitorResponseTime` |  |
| GET | `/api/Monitor/IsExternalServiceConfigured` |  |
| POST | `/api/Monitor/SaveMonitor` |  |
| POST | `/api/Monitor/UpdateMonitor` |  |

### Documented in `blocks-os`

| Method | Path | Summary |
|---|---|---|
| POST | `/api/Captcha/Create` |  |
| GET | `/api/Captcha/Get` |  |
| GET | `/api/Captcha/Gets` |  |
| POST | `/api/Captcha/Save` |  |
| POST | `/api/Captcha/Submit` |  |
| POST | `/api/Captcha/UpdateStatus` |  |
| GET | `/api/Captcha/Verify` |  |
| POST | `/api/Mfa/DisableUserMfa` |  |
| POST | `/api/Mfa/GenerateOTP` |  |
| GET | `/api/Mfa/Get` |  |
| POST | `/api/Mfa/ResendOtp` |  |
| POST | `/api/Mfa/Save` |  |
| GET | `/api/Mfa/SetUpTotp` |  |
| POST | `/api/Mfa/VerifyOTP` |  |
| POST | `/api/Migration/DataCleanup` |  |
| GET | `/api/Migration/GetMigrationStatus` | Gets the migration status for projects with incomplete services. |
| POST | `/api/Migration/Migrate` |  |
| POST | `/api/Migration/Verify` | Verifies the OTP code for the migration process. |
| DELETE | `/api/Notification/Delete` |  |
| GET | `/api/Notification/Get` |  |
| GET | `/api/Notification/Gets` |  |
| POST | `/api/Notification/Save` |  |
| POST | `/api/People/ConfirmInvitation` |  |
| POST | `/api/People/Gets` |  |
| POST | `/api/People/Invite` |  |
| POST | `/api/People/RemoveAccess` |  |
| POST | `/api/People/ResendInvitation` |  |
| POST | `/api/People/Signup` |  |
| POST | `/api/People/TransferOwnerShip` |  |
| POST | `/api/Project/AddAsset` |  |
| POST | `/api/Project/Create` |  |
| POST | `/api/Project/Disable` |  |
| GET | `/api/Project/Get` |  |
| GET | `/api/Project/GetAsset` |  |
| GET | `/api/Project/GetThirdPartyJWTClaims` |  |
| GET | `/api/Project/GetTokenValidationParameters` |  |
| GET | `/api/Project/Gets` |  |
| POST | `/api/Project/Restore` |  |
| POST | `/api/Project/SaveThirdPartyJWTClaims` |  |
| POST | `/api/Project/UpdateProject` |  |
| POST | `/api/Project/UpdateTenantGroup` |  |
| POST | `/api/Project/UpdateTokenValidationParameters` |  |
| POST | `/api/Service/GetAll` |  |
| POST | `/api/Service/Register` |  |
| POST | `/api/Storage/Delete` |  |
| GET | `/api/Storage/Get` |  |
| GET | `/api/Storage/Gets` |  |
| POST | `/api/Storage/Save` |  |

### Documented in `blocks-utilities`

| Method | Path | Summary |
|---|---|---|
| GET | `/api/Notifier/GetNotifications` |  |
| GET | `/api/Notifier/GetUnreadNotificationsBySubscriptionFilter` |  |
| POST | `/api/Notifier/MarkAllNotificationAsRead` |  |
| POST | `/api/Notifier/MarkNotificationAsRead` |  |
| POST | `/api/Notifier/Notify` |  |
| GET | `/api/Template/Gets` |  |
