# blocks-logic — API Endpoints

> Generated from `https://api.seliseblocks.com/logic/v4/swagger/v1/swagger.json` — do not edit by hand.
> Regenerate with `python3 tools/generate-api-docs.py logic`.

**Base URL:** `https://api.seliseblocks.com/logic/v4`

**URL pattern:** every endpoint is `{base}/{endpoint}` — do **not** prefix with `/api/`. e.g. `POST {base}/Workflow/Create`, `POST {base}/Deployment/IsAuthorized`. The `/api/` from the swagger `basePath` is not part of the URL served by the gateway.

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

### `GET /Deployment/AccessToken`

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

### `DELETE /Deployment/DeleteAuthorization`

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

### `GET /Deployment/GetBranches`

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

### `GET /Deployment/GetRepos`

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

### `GET /Deployment/GetReposList`

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

### `GET /Deployment/GetUser`

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

### `GET /Deployment/GithubBranchExists`

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

### `GET /Deployment/IsAuthorized`

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

### `POST /Deployment/RemoveAuthorization`

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

### `DELETE /Mail/Delete`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ConfigurationId` | query | string | no |  |
| `ProjectKey` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /Mail/Duplicate`

**Request body** (`application/json`):

```ts
{
  configurationId?: string | null
  projectKey?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /Mail/Get`

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

### `GET /Mail/Gets`

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

### `POST /Mail/Save`

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

### `POST /Storage/DeleteFile`

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

### `GET /Storage/GetFile`

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

### `POST /Storage/GetFiles`

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

### `POST /Storage/GetPreSignedUrlForUpload`

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

### `POST /Workflow/Create`

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

### `POST /Workflow/CreateVersion`

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

### `DELETE /Workflow/Delete`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `Id` | query | string | yes |  |
| `ProjectKey` | query | string | yes |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /Workflow/Duplicate`

**Request body** (`application/json`):

```ts
{
  projectKey: string
  name: string
  workflowId: string
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /Workflow/Get`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `WorkflowId` | query | string | yes |  |
| `ProjectKey` | query | string | yes |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /Workflow/GetAll`

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

### `GET /Workflow/GetExecution`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ProjectKey` | query | string | yes |  |
| `ExecutionId` | query | string | yes |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /Workflow/GetExecutions`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ProjectKey` | query | string | yes |  |
| `WorkflowId` | query | string | yes |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /Workflow/GetVersions`

**Request body** (`application/json`):

```ts
{
  projectKey: string
  workflowId: string
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /Workflow/GetWorkflowByVersion`

**Request body** (`application/json`):

```ts
{
  projectKey: string
  workflowId: string
  versionId: string
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /Workflow/PublishNewVersion`

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

### `POST /Workflow/PublishVersion`

**Request body** (`application/json`):

```ts
{
  projectKey: string
  workflowId: string
  versionId?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /Workflow/Restore`

**Request body** (`application/json`):

```ts
{
  projectKey: string
  workflowId: string
  versionId: string
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /Workflow/StepExecute`

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

### `POST /Workflow/Unpublish`

**Request body** (`application/json`):

```ts
{
  projectKey: string
  workflowId: string
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `PUT /Workflow/Update`

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

### `POST /Workflow/UpdateVersion`

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

### `POST /Workflow/Webhook/{projectKey}/{workflowId}/{webhookId}`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `projectKey` | path | string | yes |  |
| `workflowId` | path | string | yes |  |
| `webhookId` | path | string | yes |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /Workflow/webhook-test/{projectKey}/{workflowId}/{webhookId}`

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
| GET | `/Language/Gets` | Retrieves all available languages. |

### Documented in `blocks-monitor`

| Method | Path | Summary |
|---|---|---|
| DELETE | `/Health/DeleteHealth` |  |
| GET | `/Health/Ping/{itemId}` |  |
| POST | `/Health/SaveHealth` |  |
| POST | `/Health/UpdateHealth` |  |
| DELETE | `/Monitor/DeleteMonitor` |  |
| GET | `/Monitor/GetIncidentList` |  |
| GET | `/Monitor/GetMonitorById` |  |
| GET | `/Monitor/GetMonitorDetails` |  |
| GET | `/Monitor/GetMonitorDownTime` |  |
| GET | `/Monitor/GetMonitorList` |  |
| GET | `/Monitor/GetMonitorListByRepoId` |  |
| GET | `/Monitor/GetMonitorResponseTime` |  |
| GET | `/Monitor/IsExternalServiceConfigured` |  |
| POST | `/Monitor/SaveMonitor` |  |
| POST | `/Monitor/UpdateMonitor` |  |

### Documented in `blocks-os`

| Method | Path | Summary |
|---|---|---|
| POST | `/Captcha/Create` |  |
| GET | `/Captcha/Get` |  |
| GET | `/Captcha/Gets` |  |
| POST | `/Captcha/Save` |  |
| POST | `/Captcha/Submit` |  |
| POST | `/Captcha/UpdateStatus` |  |
| GET | `/Captcha/Verify` |  |
| POST | `/Mfa/DisableUserMfa` |  |
| POST | `/Mfa/GenerateOTP` |  |
| GET | `/Mfa/Get` |  |
| POST | `/Mfa/ResendOtp` |  |
| POST | `/Mfa/Save` |  |
| GET | `/Mfa/SetUpTotp` |  |
| POST | `/Mfa/VerifyOTP` |  |
| POST | `/Migration/DataCleanup` |  |
| GET | `/Migration/GetMigrationStatus` | Gets the migration status for projects with incomplete services. |
| POST | `/Migration/Migrate` |  |
| POST | `/Migration/Verify` | Verifies the OTP code for the migration process. |
| DELETE | `/Notification/Delete` |  |
| GET | `/Notification/Get` |  |
| GET | `/Notification/Gets` |  |
| POST | `/Notification/Save` |  |
| POST | `/People/ConfirmInvitation` |  |
| POST | `/People/Gets` |  |
| POST | `/People/Invite` |  |
| POST | `/People/RemoveAccess` |  |
| POST | `/People/ResendInvitation` |  |
| POST | `/People/Signup` |  |
| POST | `/People/TransferOwnerShip` |  |
| POST | `/Project/AddAsset` |  |
| POST | `/Project/Create` |  |
| POST | `/Project/Disable` |  |
| GET | `/Project/Get` |  |
| GET | `/Project/GetAsset` |  |
| GET | `/Project/GetThirdPartyJWTClaims` |  |
| GET | `/Project/GetTokenValidationParameters` |  |
| GET | `/Project/Gets` |  |
| POST | `/Project/Restore` |  |
| POST | `/Project/SaveThirdPartyJWTClaims` |  |
| POST | `/Project/UpdateProject` |  |
| POST | `/Project/UpdateTenantGroup` |  |
| POST | `/Project/UpdateTokenValidationParameters` |  |
| POST | `/Service/GetAll` |  |
| POST | `/Service/Register` |  |
| POST | `/Storage/Delete` |  |
| GET | `/Storage/Get` |  |
| GET | `/Storage/Gets` |  |
| POST | `/Storage/Save` |  |

### Documented in `blocks-utilities`

| Method | Path | Summary |
|---|---|---|
| GET | `/Notifier/GetNotifications` |  |
| GET | `/Notifier/GetUnreadNotificationsBySubscriptionFilter` |  |
| POST | `/Notifier/MarkAllNotificationAsRead` |  |
| POST | `/Notifier/MarkNotificationAsRead` |  |
| POST | `/Notifier/Notify` |  |
| GET | `/Template/Gets` |  |
