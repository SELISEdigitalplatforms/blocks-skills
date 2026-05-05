# CloudBuild Contracts

## Common Headers

```
x-blocks-key: {projectKey}
Content-Type: application/json
```

> Auth is via `x-blocks-key` header only. The swagger `securitySchemes` defines only `x-blocks-key`. Do NOT use `Authorization: Bearer $ACCESS_TOKEN` — that is for a separate auth flow (the `/Auth/AccessToken` endpoint).

---

## Common Response: BaseApiResponse

```json
{
  "isSuccess": true,
  "errors": { "fieldName": "error message" },
  "message": "string",
  "statusCode": 200,
  "data": {}
}
```

> `errors` is a **dictionary** (key = field name, value = error message), not an array.
> When `isSuccess` is `false`, inspect `errors` to identify which field caused the failure.

---

## BuildResponse

Returned by `POST /Build/manual`. Same envelope as `BaseApiResponse` plus a top-level `buildId` field outside the `data` wrapper.

```json
{
  "isSuccess": true,
  "errors": null,
  "message": "string",
  "statusCode": 200,
  "data": {},
  "buildId": "string"
}
```

---

## RepoBuildRequest

Used to trigger a build via `POST /Build/run-build` or `POST /Build/manual`.

```json
{
  "repoId": "string",
  "projectKey": "string",
  "hostingProviderId": "string",
  "regionId": "string",
  "machineConfigId": "string"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| repoId | string | yes | ID of the repository in CloudBuild (from `GET /Build/repos`) |
| projectKey | string | yes | Project identifier from `$PROJECT_SLUG` |
| hostingProviderId | string | no | Hosting provider ID (e.g. AWS, Azure, GCP) |
| regionId | string | no | Region ID within the hosting provider |
| machineConfigId | string | no | Machine configuration ID (CPU/RAM spec) |

> `repoId` is the correct field name — NOT `repositoryId`. The old `repositoryId` field was incorrect per the swagger.

---

## Build

### GET /Build

Retrieve a single build by ID.

**Query params:**

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| buildId | string | yes | ID of the build |
| ProjectKey | string | yes | Use `$PROJECT_SLUG` |

**Build status values:** `Queued`, `InProgress`, `Succeeded`, `Failed`, `Cancelled`

---

## Repos

### GET /Build/repos

List repositories configured in CloudBuild for the project.

**Query params:**

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| ProjectKey | string | yes | Use `$PROJECT_SLUG` |

---

### GET /Build/repo-details

Get details for a specific repository.

**Query params:**

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| ProjectKey | string | yes | Use `$PROJECT_SLUG` |
| RepoId | string | yes | Repository ID |

---

### POST /Build/repo-update

Update repository domain settings.

**Request: RepoDomainUpdateRequest**

```json
{
  "projectKey": "string",
  "projectEnv": "string",
  "repoWithDomains": [
    {
      "repoId": "string",
      "repoUrl": "string",
      "customDeploymentDomain": "string"
    }
  ]
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| projectKey | string | yes | Use `$PROJECT_SLUG` |
| projectEnv | string | no | Environment (e.g. `production`, `staging`) |
| repoWithDomains | array | no | Array of `RepoWithDomain` objects |

### RepoWithDomain

```json
{
  "repoId": "string",
  "repoUrl": "string",
  "customDeploymentDomain": "string"
}
```

---

## Repo Settings

### POST /Build/repo-settings-update

Update repository build settings (hosting, region, machine config, custom domain).

**Request: RepoUpdateRequest**

```json
{
  "projectKey": "string",
  "repoId": "string",
  "hostingProviderId": "string",
  "regionId": "string",
  "machineConfigId": "string",
  "deploymentType": "string",
  "customDomain": "string",
  "lastDeploymentDate": "2024-01-01T00:00:00Z",
  "lastDeploymentStatus": "string",
  "deploySettings": {
    "hostingProvider": { "id": "string", "name": "string", "status": "string", "region": [] },
    "region": { "id": "string", "name": "string", "status": "string", "machineSpecs": [] },
    "machineConfig": { "id": "string", "ram": "string", "cpu": "string", "bandwidth": "string", "status": "string" }
  }
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| projectKey | string | yes | Use `$PROJECT_SLUG` |
| repoId | string | yes | Repository ID |
| hostingProviderId | string | no | Hosting provider ID |
| regionId | string | no | Region ID |
| machineConfigId | string | no | Machine configuration ID |
| deploymentType | string | no | Type of deployment |
| customDomain | string | no | Custom domain for the deployed app |
| lastDeploymentDate | string | no | ISO 8601 date-time |
| lastDeploymentStatus | string | no | Status of last deployment |
| deploySettings | object | no | Nested hosting/region/machine config |

---

## Build Settings & Reports

### GET /Build/settings

Get build settings for the project.

---

### GET /Build/reports

Get build reports for a specific build.

**Query params:**

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| buildId | string | yes | ID of the build |
| type | string | no | Report type |
| ProjectKey | string | yes | Use `$PROJECT_SLUG` |

---

## VCS Repository

### GET /VcsRepository/RepoList

List VCS repositories connected to the project.

**Query params:**

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| ProjectKey | string | yes | Use `$PROJECT_SLUG` |

---

### GET /VcsRepository/RepoDetails

Get details for a specific VCS repository.

**Query params:**

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| ProjectKey | string | yes | Use `$PROJECT_SLUG` |
| RepoId | string | yes | Repository ID |

---

### GET /VcsRepository/HostingConfiguration

Get available hosting providers, regions, and machine configurations.

---

### POST /VcsRepository/RepoDomainUpdate

Same as `POST /Build/repo-update` — uses `RepoDomainUpdateRequest`.

---

### POST /VcsRepository/RepoConfigurationUpdate

Same as `POST /Build/repo-settings-update` — uses `RepoUpdateRequest`.

---

## GitHub

### GET /Github/user

Get the authenticated GitHub user for the project.

**Query params:**

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| ProjectKey | string | yes | Use `$PROJECT_SLUG` |

---

### GET /Github/repos

List GitHub repositories with optional search and pagination.

**Query params:**

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| ProjectKey | string | yes | Use `$PROJECT_SLUG` |
| Search | string | no | Filter repos by name |
| PageNumber | integer | no | Page number (default: 1) |
| PageSize | integer | no | Page size (default: 30) |

---

### GET /Github/branches

List branches for a GitHub repository.

**Query params:**

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| repo | string | yes | Repository name (e.g. `owner/repo`) |
| ProjectKey | string | yes | Use `$PROJECT_SLUG` |

---

### GET /Github/GithubBranchExists

Check if a branch exists in a GitHub repository.

**Query params:**

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| repoId | string | yes | Repository ID |
| ProjectKey | string | yes | Use `$PROJECT_SLUG` |

---

### GET /Github/clone

Get clone URL for a GitHub repository.

**Query params:**

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| repo | string | yes | Repository name (e.g. `owner/repo`) |
| ProjectKey | string | yes | Use `$PROJECT_SLUG` |

---

### POST /Github/webhook

Create a GitHub webhook for auto-deploy triggers.

> Note: `x-blocks-key` is passed as a query parameter on this endpoint.

**Query params:**

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| x-blocks-key | string | yes | Use `$PROJECT_SLUG` |

---

### GET /Github/CreateWebhook

Get or create a GitHub webhook configuration.

**Query params:**

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| ProjectKey | string | yes | Use `$PROJECT_SLUG` |
| RepoId | string | yes | Repository ID |

---

## Hosting Config Types

### HostingProvider

```json
{
  "id": "string",
  "name": "string",
  "status": "string",
  "region": [
    { "id": "string", "name": "string", "status": "string", "machineSpecs": [] }
  ]
}
```

### Region

```json
{
  "id": "string",
  "name": "string",
  "status": "string",
  "machineSpecs": [
    { "id": "string", "ram": "string", "cpu": "string", "bandwidth": "string", "status": "string" }
  ]
}
```

### MachineConfig

```json
{
  "id": "string",
  "ram": "string",
  "cpu": "string",
  "bandwidth": "string",
  "status": "string"
}
```

### DeploySettings

```json
{
  "hostingProvider": { "id": "string", "name": "string", "status": "string", "region": [] },
  "region": { "id": "string", "name": "string", "status": "string", "machineSpecs": [] },
  "machineConfig": { "id": "string", "ram": "string", "cpu": "string", "bandwidth": "string", "status": "string" }
}
```
