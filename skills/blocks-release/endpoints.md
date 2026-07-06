# blocks-release — API Endpoints

> Generated from `https://api.seliseblocks.com/release/v4/swagger/v1/swagger.json` — do not edit by hand.
> Regenerate with `python3 tools/generate-api-docs.py release`.

**Base URL:** `https://api.seliseblocks.com/release/v4`

**URL pattern:** every endpoint is `{base}/{endpoint}` — do **not** prefix with `/api/`. e.g. `GET {base}/Github/IsAuthorized`, `POST {base}/Build/trigger`. The `/api/` from the swagger `basePath` is not part of the URL served by the gateway.

**Authentication** (see `blocks-setup` skill for obtaining tokens):
- `x-blocks-key: <X_BLOCKS_KEY>` header — required on every request
- `Authorization: Bearer <access_token>` — required for authenticated operations

**24 endpoints** across 5 controllers.

## Contents

- [AnalyticsTool](#analyticstool) (2)
- [Auth](#auth) (5)
- [Build](#build) (9)
- [DeploymentHubBroadcast](#deploymenthubbroadcast) (1)
- [Github](#github) (7)

## AnalyticsTool

### `GET /AnalyticsTool/ProcessDependencyTrackUser`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `buildId` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /AnalyticsTool/ProcessSonarQubeUser`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `buildId` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

## Auth

### `GET /Auth/AccessToken`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `code` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `DELETE /Auth/DeleteAuthorization`

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /Auth/IsAuthorized`

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /Auth/RemoveAuthorization`

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /Auth/TestPing`

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

## Build

### `GET /Build`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `buildId` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /Build/manual`

**Request body** (`application/json`):

```ts
{
  repoId?: string | null
  projectKey?: string | null
  hostingProviderId?: string | null
  regionId?: string | null
  machineConfigId?: string | null
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  data?: unknown | null
  message?: string | null
  statusCode?: 100 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226 | 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308 | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 421 | 422 | 423 | 424 | 426 | 428 | 429 | 431 | 451 | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 (int enum)
  buildId?: string | null
}
```

### `GET /Build/repo-details`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `RepoId` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /Build/repo-settings-update`

**Request body** (`application/json`):

```ts
{
  projectKey?: string | null
  repoId?: string | null
  hostingProviderId?: string | null
  regionId?: string | null
  machineConfigId?: string | null
  deploymentType?: string | null
  customDomain?: string | null
  lastDeploymentDate?: string (date-time) | null
  lastDeploymentStatus?: string | null
  deploySettings?: {
    hostingProvider?: {
      id?: string | null
      name?: string | null
      status?: string | null
      region?: {
        id?: string | null
        name?: string | null
        status?: string | null
        machineSpecs?: MachineConfig[]
      }[]
    }
    region?: {
      id?: string | null
      name?: string | null
      status?: string | null
      machineSpecs?: {
        id?: string | null
        ram?: string | null
        cpu?: string | null
        bandwidth?: string | null
        status?: string | null
      }[]
    }
    machineConfig?: {
      id?: string | null
      ram?: string | null
      cpu?: string | null
      bandwidth?: string | null
      status?: string | null
    }
  }
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /Build/repo-update`

**Request body** (`application/json`):

```ts
{
  projectKey?: string | null
  projectEnv?: string | null
  repoWithDomains?: {
    repoId?: string | null
    repoUrl?: string | null
    customDeploymentDomain?: string | null
  }[]
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  data?: unknown | null
  message?: string | null
  statusCode?: 100 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226 | 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308 | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 421 | 422 | 423 | 424 | 426 | 428 | 429 | 431 | 451 | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 (int enum)
}
```

### `GET /Build/reports`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `buildId` | query | string | no |  |
| `type` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /Build/repos-list`

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /Build/run-build`

**Request body** (`application/json`):

```ts
{
  repoId?: string | null
  projectKey?: string | null
  hostingProviderId?: string | null
  regionId?: string | null
  machineConfigId?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /Build/settings`

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

## DeploymentHubBroadcast

### `POST /DeploymentHubBroadcast/broadcast`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `X-Internal-Secret` | header | string | no |  |

**Request body** (`application/json`):

```ts
{
  payload?: unknown | null
  userIds?: string[]
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

## Github

### `GET /Github/CreateWebhook`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `RepoId` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /Github/GithubBranchExists`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `repoId` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /Github/branches`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `repo` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /Github/clone`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `repo` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /Github/repos`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `Search` | query | string | no |  |
| `PageNumber` | query | integer (int32) | no |  |
| `PageSize` | query | integer (int32) | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /Github/user`

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /Github/webhook`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `x-blocks-key` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.
