---
name: deployment
description: "Use this skill for deploying code, managing builds, triggering CI/CD pipelines, configuring VCS repositories, setting up GitHub webhooks for auto-deploy, and managing hosting configurations on SELISE Blocks via CloudBuild API. Also triggers when developers mention 'blocks-deployment', 'cloudbuild', 'CI/CD', 'auto-deploy', 'build pipeline', 'github webhook', 'deployment skill', or need build management, repository setup, or GitHub integration on SELISE Blocks. For codebase preparation (generating Dockerfile, env files, GitHub workflows, build scripts), use the 'blocks-deployment-readiness' sub-skill instead."
user-invocable: false
blocks-version: "1.1.0"
---

# Deployment Skill

## Purpose

Handles CI/CD build management, VCS repository configuration, and GitHub integration for SELISE Blocks via the CloudBuild v1 API.

Covers four sub-domains: Build (trigger and monitor), Repository (settings and details), VCS (hosting configuration), and GitHub (repos, branches, webhooks).

> Service scaling, deployment history, and rollback belong in a separate `blocks-runtime` skill.

---

## How to Answer "How do I use blocks-deployment?"

When a developer asks **"how to use blocks-deployment"**, **"what does blocks-deployment do"**, or **"how do I get started with blocks-deployment"**:

1. **Ask for their framework** — Next.js, React, Angular, Flutter, Blazor, etc.
2. **Ask what they want to do** — trigger a build, set up auto-deploy, configure hosting, etc.
3. **Point to the human overview** — direct them to `README.md` for a quick overview
4. **Point to the AI guide** — direct them to `SKILL.md` for the full execution guide
5. **Give a one-liner summary** — "blocks-deployment handles CI/CD: trigger builds, configure repos, set up GitHub webhooks for auto-deploy, and manage hosting settings for SELISE Blocks"

**Do NOT** generate a custom summary. The skill already has this information in `README.md` and `SKILL.md`. Link to those files instead of reproducing their content.

---

## When to Use

Example prompts that should route here:
- "Deploy my code"
- "Trigger a build on the main branch"
- "Check build status"
- "List my repositories"
- "Configure hosting settings for my repo"
- "Set up auto-deploy via GitHub webhook"
- "List GitHub repos"
- "Get hosting configuration (regions and machine sizes)"
- "Check if a branch exists"
- "Configure a custom domain for my deployed app"
- "Set up CI/CD for my Next.js project"
- "Why is my build failing?"

**For codebase preparation**, use `blocks-deployment-readiness` skill instead:
- "make my project deployment-ready"
- "prepare for deployment"
- "check if my app is ready to deploy"
- "set up deployment for my project"
- "generate a Dockerfile for my blocks app"
- "my project isn't deploying"

---

## Execution Context

Before executing any action or flow from this skill, read `../core/execution-context.md` for the required supporting files, load order, and cross-domain orchestration rules.

At minimum, this skill requires:
- `contracts.md` — for API schemas, field names, and endpoint details
- `flows/` — for multi-step workflows (don't execute actions in isolation when a flow exists)
- `references/` — for framework-specific implementation guides

---

## Deployment-Readiness Skill

For **codebase preparation** tasks (generating Dockerfile, nginx.conf, .env files, GitHub workflows, build scripts), use the **standalone `blocks-deployment-readiness` skill** instead of this skill. This skill handles CloudBuild API operations — triggering builds, monitoring status, configuring webhooks, and managing hosting settings.

| Task | Use |
|------|-----|
| Prepare code for deployment (Dockerfile, workflows, env files) | `blocks-deployment-readiness` skill |
| Trigger a build via API | `blocks-deployment` skill |
| Check if project is deployment-ready | `blocks-deployment-readiness` skill |
| Monitor build status | `blocks-deployment` skill |
| Set up auto-deploy webhook | `blocks-deployment` skill |

---

## API Conventions

**Critical:** The CloudBuild API uses specific conventions that differ from standard REST APIs. Wrong field names silently return null or cause failures.

### Case Convention

| Location | Convention | Example |
|----------|------------|---------|
| Request body fields | `camelCase` | `repoId`, `projectKey`, `hostingProviderId` |
| Query parameters | `PascalCase` | `ProjectKey`, `RepoId`, `BuildId` |
| Response body fields | `camelCase` | `isSuccess`, `buildId`, `repoId` |
| Path segments | `PascalCase` | `/Build/run-build`, `/Github/webhook` |

### Field Naming Rules

| Wrong (don't use) | Correct (use this) | Context |
|-------------------|-------------------|---------|
| `repositoryId` | `repoId` | Build trigger, repo details, settings |
| `RepositoryId` | `RepoId` | Query parameters |
| `projectKey` (query param) | `ProjectKey` | Query parameters |
| `ProjectKey` (body) | `projectKey` | Request body |
| `Authorization: Bearer` | `x-blocks-key` header | All authenticated requests |
| `data.build.buildId` | `buildId` (top-level) | `BuildResponse` envelope |
| `errors[0]` (array index) | `errors{fieldName}` (dictionary) | All response envelopes |
| `repoId` (query param) | `RepoId` (PascalCase) | GET endpoints |
| `buildId` (query param) | `BuildId` (PascalCase) | GET endpoints |
| `x-blocks-key` header | `x-blocks-key` query param | `POST /Github/webhook` only |

### Header Convention

| Endpoint | Auth Method |
|----------|-------------|
| All endpoints except `POST /Github/webhook` | `x-blocks-key: {projectKey}` header |
| `POST /Github/webhook` | `x-blocks-key={projectKey}` query parameter |

### Response Envelope Convention

| Field | Location | Type | Notes |
|-------|----------|------|-------|
| `isSuccess` | top-level | boolean | Always present |
| `errors` | top-level | dictionary | `{ fieldName: message }`, NOT array |
| `message` | top-level | string | Human-readable message |
| `statusCode` | top-level | number | HTTP status |
| `data` | top-level | object | Payload wrapper |
| `buildId` | top-level | string | Only in `BuildResponse` (trigger endpoints) |

### Endpoint Naming Convention

| Pattern | Example |
|---------|---------|
| GET list | `GET /Build` (with query params) |
| GET single | `GET /Build?buildId=xxx` |
| POST action | `POST /Build/run-build` |
| POST create | `POST /Github/webhook` |

---

## Pre-flight Audit

Always run this audit before implementing anything. It determines the approach.

### Decision Tree

```
START: User wants to deploy code
│
├─► Is this a greenfield project?
│   ├─ YES → Run setup-repository-flow
│   │         → Connect repo
│   │         → Configure hosting
│   │         → Set up webhook
│   │
│   └─ NO → Continue to check status
│
├─► Is repo connected to CloudBuild?
│   ├─ YES → Use get-repos to find repoId
│   │         Continue to next check
│   │
│   └─ NO → Run setup-repository-flow first
│
├─► Is hosting configured?
│   ├─ YES → Verify config with get-hosting-config
│   │
│   └─ NO → Configure via update-repo-settings
│           (after running get-hosting-config)
│
├─► Is webhook set up for auto-deploy?
│   ├─ YES → Verify with get-repo-details
│   │
│   └─ NO → Use create-github-webhook
│
└─► Trigger build?
    ├─ YES → Verify branch exists first
    │         → check-github-branch or get-github-branches
    │         → deploy-code-flow
    │
    └─ NO → Check build status with get-build
```

### Step 1: Detect Stack

| Indicator | Framework |
|-----------|-----------|
| `package.json` + `app/` dir or `next.config.js` | Next.js App Router |
| `package.json` + `vite.config.ts` | Vite + React SPA |
| `package.json` + `react-native.config.js` | React Native |
| `angular.json` | Angular |
| `pubspec.yaml` | Flutter |
| `*.csproj` / `Program.cs` | .NET Blazor |
| No framework files | Vanilla HTML/JS |

### Step 2: Check Existing Deployment Setup

| Found | Implies | Action |
|-------|---------|--------|
| `.github/workflows/` with Blocks trigger | Already using CloudBuild | Skip to `get-build` for monitoring |
| `docker-compose.yml` or `Dockerfile` | Custom build pipeline | Verify CloudBuild is configured |
| `cloudbuild.yaml` in repo | GCP Cloud Build | Verify webhook is connected |
| No deployment config | Greenfield | Run `setup-repository-flow` |

### Step 3: Check CloudBuild Status

| Question | If Yes | If No |
|----------|--------|-------|
| Repo connected to CloudBuild? | Use `get-repos` to find `repoId` | Run `setup-repository-flow` |
| GitHub webhook set up? | Check `get-repo-details` for webhook status | Use `create-github-webhook` |
| Hosting settings configured? | Check `get-hosting-config` | Configure via `update-repo-settings` |
| Branch exists? | Verify with `check-github-branch` before triggering | List branches with `get-github-branches` |

### Step 4: Route Decision

| Scenario | Flow to Use |
|----------|-------------|
| First-time repo setup | `setup-repository-flow` → connect repo, configure hosting, set up webhook |
| Trigger a build and monitor | `deploy-code-flow` → select repo, trigger, poll, verify |
| Configure hosting/settings | `update-repo-settings` after `get-hosting-config` |
| Check existing build status | `get-build` with `refetchInterval` polling |
| Get hosting providers/regions | `get-hosting-config` |
| List GitHub repos | `get-github-repos` with search/pagination |
| Set up GitHub webhook | `create-github-webhook` |

### Required API Calls by Scenario

| Scenario | Required Calls (in order) |
|----------|---------------------------|
| First deploy | `get-hosting-config` → `setup-repository-flow` → `get-repos` → `create-github-webhook` |
| Trigger build | `get-repos` → `check-github-branch` → `trigger-build` → `get-build` (poll) |
| Update hosting | `get-hosting-config` → `update-repo-settings` |
| Check status | `get-build` (or `get-builds` for history) |
| Get reports | `get-build-reports` |

### Pre-flight Checklist

Before any deployment action, verify:
- [ ] Project key is available (`$PROJECT_SLUG` env var)
- [ ] API base URL is configured (includes `/cloudbuild/v1`)
- [ ] Repo is connected to CloudBuild (`get-repos` returns it)
- [ ] Target branch exists (`check-github-branch`)
- [ ] Hosting provider/region/machine IDs are valid (from `get-hosting-config`)

---

## Build Trigger Decision Guide

Use this guide to choose the right build endpoint.

### run-build vs manual

| Endpoint | When to use | Result |
|----------|------------|--------|
| `POST /Build/run-build` | Auto-deploy on success | Build + deployment triggered together |
| `POST /Build/manual` | Verify before deploying | Build only; deploy manually afterward |

**Use `run-build`** for:
- Feature branch merges to `main`
- Production deployments
- When you want the artifact deployed automatically

**Use `manual`** for:
- Testing a build without deploying
- Staging environments where you want to review before going live
- CI environments where deployment is handled separately

### Trigger a build (auto-deploy)

```bash
curl --location "$API_BASE_URL/cloudbuild/v1/Build/run-build" \
  --header "x-blocks-key: $PROJECT_SLUG" \
  --header "Content-Type: application/json" \
  --data '{
    "repoId": "repo-abc123",
    "projectKey": "my-project",
    "hostingProviderId": "aws-1",
    "regionId": "us-east-1",
    "machineConfigId": "medium"
  }'
# Response: { "buildId": "build-xyz789", "isSuccess": true, ... }
```

### Trigger a manual build (no deploy)

```bash
curl --location "$API_BASE_URL/cloudbuild/v1/Build/manual" \
  --header "x-blocks-key: $PROJECT_SLUG" \
  --header "Content-Type: application/json" \
  --data '{
    "repoId": "repo-abc123",
    "projectKey": "my-project"
  }'
```

### Monitor build status

```bash
# Poll every 10s while status is Queued or InProgress
curl --location "$API_BASE_URL/cloudbuild/v1/Build?buildId=build-xyz789&ProjectKey=my-project" \
  --header "x-blocks-key: $PROJECT_SLUG"

# Response data shape:
# {
#   "isSuccess": true,
#   "data": {
#     "build": {
#       "buildId": "build-xyz789",
#       "branch": "main",
#       "status": "Succeeded",   # Queued | InProgress | Succeeded | Failed | Cancelled
#       "startTime": "2024-01-01T00:00:00Z",
#       "endTime": "2024-01-01T00:05:00Z",
#       "commitHash": "abc123def",
#       "commitMessage": "fix: resolve login issue"
#     }
#   }
# }
```

---

## Hosting Configuration Decision Guide

Use this guide to choose the right hosting configuration.

### Machine config sizing

| Tier | CPU | RAM | Use Case |
|------|-----|-----|---------|
| `small` | 2 vCPU | 8 GB | Dev, small SPAs, prototypes |
| `medium` | 4 vCPU | 16 GB | Production, medium traffic |
| `large` | 8 vCPU | 32 GB | High traffic, enterprise, compute-heavy |

### Provider selection

| Provider | ID pattern | Best for |
|----------|-----------|---------|
| AWS | `aws-*` | General purpose, global CDN |
| Azure | `azure-*` | Microsoft ecosystem integration |
| GCP | `gcp-*` | GCP native services, BigQuery |

> IDs are illustrative — always use actual IDs from `get-hosting-config`. The response provides available `hostingProviders[].id` values for the current project.

### Get available hosting options

```bash
curl --location "$API_BASE_URL/cloudbuild/v1/VcsRepository/HostingConfiguration" \
  --header "x-blocks-key: $PROJECT_SLUG"

# Response:
# {
#   "isSuccess": true,
#   "data": {
#     "hostingProviders": [
#       {
#         "id": "aws-1",
#         "name": "AWS",
#         "region": [
#           {
#             "id": "us-east-1",
#             "name": "US East (N. Virginia)",
#             "machineSpecs": [
#               { "id": "small", "cpu": "2 vCPU", "ram": "8 GB", "bandwidth": "1 Gbps" },
#               { "id": "medium", "cpu": "4 vCPU", "ram": "16 GB", "bandwidth": "2 Gbps" }
#             ]
#           }
#         ]
#       }
#     ]
#   }
# }
```

### Cascading selection pattern

Hosting config requires three steps in order:

1. **Select provider** → populates available regions
2. **Select region** → populates available machine specs
3. **Select machine** → use the IDs in `update-repo-settings` or `trigger-build`

### Update repo settings with hosting config

```bash
curl --location "$API_BASE_URL/cloudbuild/v1/Build/repo-settings-update" \
  --header "x-blocks-key: $PROJECT_SLUG" \
  --header "Content-Type: application/json" \
  --data '{
    "projectKey": "my-project",
    "repoId": "repo-abc123",
    "hostingProviderId": "aws-1",
    "regionId": "us-east-1",
    "machineConfigId": "medium",
    "deploymentType": "auto",
    "customDomain": "app.example.com"
  }'

# Response: { "isSuccess": true, "errors": {} }
```

---

## GitHub Webhook Decision Guide

### Webhook events

CloudBuild listens for GitHub webhook events:

| Event | Trigger |
|-------|---------|
| `push` | Any push to any branch |
| `pull_request` | PR opened, closed, or synchronized |
| `release` | Release published |

### Create a webhook

```bash
# x-blocks-key goes as a QUERY PARAMETER, not a header
curl --location "$API_BASE_URL/cloudbuild/v1/Github/webhook?x-blocks-key=$PROJECT_SLUG" \
  --header "Content-Type: application/json"

# Response:
# {
#   "isSuccess": true,
#   "data": {
#     "webhookId": "wh-12345",
#     "url": "https://api.seliseblocks.com/cloudbuild/github/webhook/abc123",
#     "events": ["push"],
#     "active": true
#   }
# }
```

### List GitHub repos with search

```bash
curl --location "$API_BASE_URL/cloudbuild/v1/Github/repos?ProjectKey=my-project&Search=frontend&PageNumber=1&PageSize=30" \
  --header "x-blocks-key: $PROJECT_SLUG"

# Response:
# {
#   "isSuccess": true,
#   "data": {
#     "repos": [
#       { "id": "repo-123", "name": "frontend-app", "fullName": "org/frontend-app", "defaultBranch": "main", "private": false, "language": "TypeScript" }
#     ],
#     "totalCount": 1
#   }
# }
```

### List branches for a repo

```bash
curl --location "$API_BASE_URL/cloudbuild/v1/Github/branches?repo=org/frontend-app&ProjectKey=my-project" \
  --header "x-blocks-key: $PROJECT_SLUG"

# Response:
# {
#   "isSuccess": true,
#   "data": {
#     "branches": [
#       { "name": "main", "sha": "abc123", "protected": true },
#       { "name": "develop", "sha": "def456", "protected": false }
#     ]
#   }
# }
```

### Check if a branch exists

```bash
curl --location "$API_BASE_URL/cloudbuild/v1/Github/GithubBranchExists?repoId=repo-abc123&ProjectKey=my-project" \
  --header "x-blocks-key: $PROJECT_SLUG"

# Response:
# {
#   "isSuccess": true,
#   "data": { "exists": true, "branchName": "main" }
# }
```

> **Critical:** `x-blocks-key` is passed as a **query parameter** on `POST /Github/webhook` only. All other endpoints use it as a header.

---

## Intent Mapping

Use this table to route user requests. Check `flows/` first — if a flow covers the request, use it. For single-action requests, go directly to the action.

| User wants to... | Use |
|------------------|-----|
| Deploy code end-to-end | `flows/deploy-code-flow.md` |
| Set up a repo for auto-deploy | `flows/setup-repository-flow.md` |
| Trigger a build (auto-deploy) | `actions/trigger-build.md` → `POST /Build/run-build` |
| Trigger a manual build (no deploy) | `actions/manual-build.md` → `POST /Build/manual` |
| Check build status | `actions/get-build.md` |
| List builds | `actions/get-builds.md` |
| List connected repos | `actions/get-repos.md` |
| Get repo details | `actions/get-repo-details.md` |
| Update repo settings | `actions/update-repo-settings.md` |
| Get build settings | `actions/get-build-settings.md` |
| Get build reports | `actions/get-build-reports.md` |
| Get hosting config | `actions/get-hosting-config.md` |
| Get GitHub user | `actions/get-github-user.md` |
| List GitHub repos | `actions/get-github-repos.md` |
| List GitHub branches | `actions/get-github-branches.md` |
| Check if branch exists | `actions/check-github-branch.md` |
| Create GitHub webhook | `actions/create-github-webhook.md` |

---

## Flows

| Flow | File | Description |
|------|------|-------------|
| deploy-code-flow | flows/deploy-code-flow.md | Select repo/branch, trigger build, monitor, verify |
| setup-repository-flow | flows/setup-repository-flow.md | Connect repo, configure domains, enable webhooks |

---

## Base Path

All endpoints are prefixed with: `$API_BASE_URL/cloudbuild/v1`

> [!WARNING]
> The API uses `/cloudbuild/v1` as its path prefix, **not** `/deployment/v1`. If the env var is `https://api.example.com`, the full URL is `https://api.example.com/cloudbuild/v1/Build/run-build`. Appending `/deployment/v1` will result in 404s.

> [!WARNING]
> **Auth is via `x-blocks-key` header only.** The swagger `securitySchemes` defines only `x-blocks-key`. Do NOT use `Authorization: Bearer $ACCESS_TOKEN` — that is for a separate auth flow (the `/Auth/AccessToken` endpoint).

---

## Reference Implementations

| Stack | Reference | Notes |
|-------|-----------|-------|
| React (Next.js / Vite) | `references/react-vite.md` | React Query hooks, build status badge, hosting selector |
| Next.js | `references/nextjs-deployment.md` | App Router patterns, GitHub Actions integration |
| Angular | `references/angular.md` | Angular service, RxJS polling, GitHub Actions |
| Blazor .NET | `references/blazor-dotnet.md` | C# service, DTOs, Blazor component |
| React Native | `references/react-native.md` | Native mobile CI/CD patterns |
| Flutter | `references/flutter.md` | Dart service, CI/CD integration |
| Hosting providers | `references/hosting-providers.md` | AWS/Azure/GCP region + machine config |
| Webhook setup | `references/webhook-setup.md` | GitHub webhook configuration |
| Bridge strategies | `references/bridge-strategies.md` | Migrating from GitHub Actions, GitLab CI, Jenkins, GCP Cloud Build, Azure Pipelines |

---

## Field Name Pitfalls

> [!WARNING]
>
> ### errors is a Dictionary, Not an Array
>
> `errors` is `{ fieldName: message }`, not `["message"]`. Inspect `errors[fieldName]` to get field-level messages.
>
> ```ts
> // ❌ WRONG — treating errors as an array
> if (response.errors[0]) { ... }
> if (response.errors.length > 0) { ... }
>
> // ✅ CORRECT — accessing errors as a dictionary
> if (Object.keys(response.errors).length > 0) {
>   Object.entries(response.errors).forEach(([field, message]) => {
>     console.error(`${field}: ${message}`);
>   });
> }
> ```

### repoId vs repositoryId

The swagger uses `repoId` everywhere. Using `repositoryId` silently fails — the API returns `isSuccess: false` with no error message.

```ts
// ❌ WRONG
axiosInstance.post('/Build/run-build', { repositoryId: 'abc', projectKey: 'proj' })

// ✅ CORRECT
axiosInstance.post('/Build/run-build', { repoId: 'abc', projectKey: 'proj' })
```

### ProjectKey Case Sensitivity

Request body uses lowercase `projectKey`, query parameters use PascalCase `ProjectKey`.

```bash
# ❌ WRONG — lowercase projectKey in query param
GET /Build?buildId=abc&projectKey=my-project

# ✅ CORRECT — PascalCase ProjectKey in query param
GET /Build?buildId=abc&ProjectKey=my-project
```

```ts
// ❌ WRONG — PascalCase projectKey in body
axiosInstance.post('/Build/run-build', { ProjectKey: 'my-project', ... })

// ✅ CORRECT — lowercase projectKey in body
axiosInstance.post('/Build/run-build', { projectKey: 'my-project', ... })
```

### Auth Header Convention

`x-blocks-key` is the only auth method. Do NOT use `Authorization: Bearer`.

```ts
// ❌ WRONG
axiosInstance.post('/Build/run-build', payload, {
  headers: { Authorization: `Bearer ${token}`, ... }
})

// ✅ CORRECT — x-blocks-key header only
axiosInstance.post('/Build/run-build', payload, {
  headers: { 'x-blocks-key': projectKey, ... }
})
```

### buildId Location in Response

`BuildResponse` adds `buildId` as a top-level field outside the `data` wrapper.

```ts
// ❌ WRONG — buildId is not nested in data
const buildId = response.data.build.buildId;
const buildId = response.data.buildId;

// ✅ CORRECT — buildId is top-level in BuildResponse
const buildId = response.buildId;
```

### Build Polling Terminal States

Polling must stop at terminal states. Indefinite polling wastes resources.

```ts
// ✅ CORRECT — stop polling at terminal state
refetchInterval: (query) => {
  const status = query.state.data?.data?.build?.status;
  return status === 'Queued' || status === 'InProgress' ? 10_000 : false;
}
```

### GitHub Webhook Auth Exception

`POST /Github/webhook` requires `x-blocks-key` as a query parameter, not a header.

```bash
# ❌ WRONG — x-blocks-key as header
curl --location "$API_BASE_URL/cloudbuild/v1/Github/webhook" \
  --header "x-blocks-key: $PROJECT_SLUG"

# ✅ CORRECT — x-blocks-key as query parameter
curl --location "$API_BASE_URL/cloudbuild/v1/Github/webhook?x-blocks-key=$PROJECT_SLUG"
```

### Pre-Build Validation

Always verify prerequisites before triggering builds.

```ts
// ❌ WRONG — trigger without checking
await triggerBuild({ repoId: 'abc', branch: 'nonexistent' });

// ✅ CORRECT — verify branch first
const { exists } = await checkGithubBranch({ repoId: 'abc', branch: 'main' });
if (exists) {
  await triggerBuild({ repoId: 'abc', branch: 'main' });
}
```

### Hosting Config ID Validation

Never hardcode hosting provider IDs. Always fetch actual IDs from `get-hosting-config`.

```ts
// ❌ WRONG — hardcoded IDs
{ hostingProviderId: 'aws-1', regionId: 'us-east-1', machineConfigId: 'medium' }

// ✅ CORRECT — dynamic IDs from API
const config = await getHostingConfig();
const aws = config.hostingProviders.find(p => p.name === 'AWS');
const region = aws.regions.find(r => r.name.includes('Virginia'));
const machine = region.machineSpecs.find(m => m.cpu === '4 vCPU');
{ hostingProviderId: aws.id, regionId: region.id, machineConfigId: machine.id }
```

### Endpoint Path Prefix

All endpoints use `/cloudbuild/v1/` prefix, not `/deployment/v1/`.

```bash
# ❌ WRONG — wrong prefix
curl "$API_BASE_URL/deployment/v1/Build/run-build"

# ✅ CORRECT — correct prefix
curl "$API_BASE_URL/cloudbuild/v1/Build/run-build"
```

### Hosting Config Cascading Selection

Provider → Region → Machine must be selected in order.

```ts
// ❌ WRONG — select machine without provider
const machines = allMachineSpecs; // wrong

// ✅ CORRECT — cascading selection
const providers = hostingConfig.hostingProviders;
const region = providers.find(p => p.id === selectedProviderId).regions;
const machine = region.find(r => r.id === selectedRegionId).machineSpecs;
```

### Deployment Type Selection

Use `run-build` for auto-deploy, `manual` for build-only.

```ts
// Auto-deploy on success
await triggerAutoBuild({ repoId: 'abc' }); // POST /Build/run-build

// Build without deploy
await triggerManualBuild({ repoId: 'abc' }); // POST /Build/manual
```

### API Base URL Mismatch

API base URL must include `/cloudbuild/v1` path.

```ts
// ❌ WRONG — missing path prefix
const url = `${API_BASE_URL}/Build/run-build`; // results in 404

// ✅ CORRECT — include path prefix
const url = `${API_BASE_URL}/cloudbuild/v1/Build/run-build`;
```

---

## Verification Checklist

After implementing a deployment feature, verify all items:

### Build Trigger
- [ ] Uses `POST /cloudbuild/v1/Build/run-build` (not `/deployment/v1/`)
- [ ] Uses `repoId` in request body (not `repositoryId`)
- [ ] Uses `projectKey` (lowercase) in request body
- [ ] Uses `ProjectKey` (PascalCase) in query parameters
- [ ] Uses `x-blocks-key` header on all requests except `POST /Github/webhook`
- [ ] Uses `x-blocks-key` as query param on `POST /Github/webhook`
- [ ] Reads `buildId` from top-level response field (not nested in `data`)
- [ ] Includes `hostingProviderId`, `regionId`, `machineConfigId` when needed

### Build Monitoring
- [ ] Polling stops at terminal state (Succeeded, Failed, Cancelled)
- [ ] Polling interval is 10 seconds for Queued/InProgress states
- [ ] Status transitions reported to user (Queued → InProgress → Succeeded)
- [ ] Error states are handled with `get-build-reports` for logs
- [ ] React Query `refetchInterval` returns `false` at terminal state

### Repository Setup
- [ ] `get-repos` used to find `repoId` before triggering
- [ ] `get-hosting-config` used to get valid provider/region/machine IDs
- [ ] Branch existence verified with `check-github-branch` before triggering
- [ ] Custom domain validated before passing to `update-repo-settings`
- [ ] Deployment type correctly set (auto vs manual)

### GitHub Integration
- [ ] `create-github-webhook` uses `x-blocks-key` as query parameter (not header)
- [ ] Webhook URL from response matches GitHub webhook settings
- [ ] `get-github-branches` uses `repo` param as `owner/repo` format
- [ ] `check-github-branch` uses `RepoId` (PascalCase) query param
- [ ] Pagination parameters used correctly for large repo lists

### Hosting Configuration
- [ ] Provider selected before region (cascading selection)
- [ ] Region selected before machine config (cascading selection)
- [ ] IDs used from `get-hosting-config` response (not hardcoded)
- [ ] `machineConfigId` validated against region's `machineSpecs`

### Response Handling
- [ ] `errors` inspected as dictionary (`errors[fieldName]`)
- [ ] `Object.keys(errors).length > 0` used (not `errors[0]`)
- [ ] `isSuccess: false` response shows field-level error messages
- [ ] `isSuccess: true` response confirms action completed

### Security & Configuration
- [ ] Project key from environment variable (`process.env.PROJECT_SLUG`)
- [ ] API base URL includes `/cloudbuild/v1` path
- [ ] No hardcoded credentials or tokens
- [ ] `Authorization: Bearer` NOT used anywhere

### Error Messages
- [ ] User-friendly error messages shown for API failures
- [ ] Field-level validation errors displayed next to form fields
- [ ] 401 errors suggest checking Cloud Portal credentials
- [ ] 403 errors suggest verifying project permissions
- [ ] 404 errors suggest checking API URL configuration

---

## Troubleshooting

### HTTP Status Errors

| Status Code | Symptom | Likely Cause | Fix |
|-------------|---------|-------------|-----|
| 400 | `isSuccess: false` with field errors | Validation error | Inspect `errors` dict — `errors[fieldName]` gives the message |
| 400 | `errors: { repoId: "..." }` | Invalid `repoId` | Use `get-repos` to find connected repo IDs |
| 401 | All requests failing | Missing/invalid `x-blocks-key` | Verify project key in Cloud Portal |
| 403 | No permission for this project | Missing role | Verify `cloudadmin` role in Cloud Portal |
| 403 | `get-github-user` failing | GitHub not connected | Connect GitHub account in Cloud Portal |
| 404 | Endpoint not found | Wrong API path | Check URL is `https://api.example.com/cloudbuild/v1/` |
| 409 | Webhook creation failing | Webhook already exists | Use `GET /Github/CreateWebhook` to get existing webhook |

### Build Issues

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Build status `Failed` | Compilation or test failure | Call `get-build-reports` for build logs |
| Build status `Cancelled` | Build was manually cancelled | Re-trigger if needed |
| Build not deploying | Used `manual` instead of `run-build` | Use `POST /Build/run-build` for auto-deploy |
| Build triggered on wrong branch | Branch not verified | Use `check-github-branch` before triggering |
| Build stuck in `Queued` | System queue backlog | Wait and poll again; check `get-build-reports` |
| Build never starts | Repo not connected | Use `get-repos` to verify repo is connected |

### Repository Issues

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `repoId` not found | Repo not connected to CloudBuild | Use `get-repos` to find valid repo IDs |
| `repoId` validation error | Repo not in CloudBuild | Use `get-repos` to find connected repos |
| Repo not in list | Repo not connected | Run `setup-repository-flow` to connect |
| Wrong repo showing | Multiple repos with similar names | Use exact `repoId` from `get-repos` |

### Hosting Configuration Issues

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Hosting config empty | No providers available | Contact Cloud Portal support |
| Region dropdown empty | Provider not selected first | Select provider before region |
| Machine dropdown empty | Region not selected first | Select region before machine |
| Invalid provider ID | Hardcoded incorrect ID | Fetch IDs from `get-hosting-config` |
| Invalid region ID | ID from wrong provider | Re-fetch after selecting provider |
| Custom domain not working | Domain not verified | Verify DNS in Cloud Portal |

### GitHub Integration Issues

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Webhook not triggering builds | Wrong payload URL in GitHub | Verify URL from `create-github-webhook` response in GitHub settings |
| Webhook URL mismatch | GitHub webhook misconfigured | Check GitHub repo → Settings → Webhooks |
| `get-github-repos` returns empty | Search query too specific | Try without `Search` param |
| `get-github-branches` failing | Wrong repo format | Use `owner/repo` format |
| Branch not found | Branch doesn't exist | Use `get-github-branches` to list all branches |
| `check-github-branch` returning `false` | Branch deleted or renamed | Refresh branch list with `get-github-branches` |

### Field Naming Issues

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Request body ignored | Wrong field case | Use `projectKey` in body, `ProjectKey` in query |
| `repositoryId` not working | Wrong field name | Use `repoId` instead |
| `buildId` is undefined | Reading from wrong location | Read from `response.buildId`, not `response.data.buildId` |
| `errors` appears empty | Treating as array | Check `Object.keys(errors).length > 0` |

### Response Handling Issues

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Response is `null` | Wrong API path | Verify `/cloudbuild/v1/` prefix |
| `data` is `undefined` | Request failed silently | Check `isSuccess` before accessing `data` |
| Status always `InProgress` | Not polling properly | Use 10s interval, stop at terminal state |
| Build status not updating | Cache issue | Force refetch with `refetchInterval` |

### Common Error Messages

| Error Message | Meaning | Fix |
|---------------|---------|-----|
| `Repository not found` | `repoId` not in CloudBuild | Use `get-repos` to find valid IDs |
| `Project not found` | Invalid `projectKey` | Verify project key in Cloud Portal |
| `Branch not found` | Branch doesn't exist in repo | Use `get-github-branches` to list valid branches |
| `Invalid hosting provider` | Provider ID not found | Fetch valid IDs from `get-hosting-config` |
| `Webhook already exists` | Webhook configured | Use `GET /Github/CreateWebhook` to get existing |
| `GitHub not connected` | GitHub OAuth not set up | Connect GitHub in Cloud Portal |

---

## Action Index

### Build

| Action | File | Description |
|--------|------|-------------|
| trigger-build | actions/trigger-build.md | Trigger build with auto-deploy (`POST /Build/run-build`) |
| manual-build | actions/manual-build.md | Trigger build-only, no deploy (`POST /Build/manual`) |
| get-builds | actions/get-builds.md | Paginated build list (client-side aggregation) |
| get-build | actions/get-build.md | Get single build by ID |
| get-build-settings | actions/get-build-settings.md | Get build settings |
| get-build-reports | actions/get-build-reports.md | Get build reports |

### Repository

| Action | File | Description |
|--------|------|-------------|
| get-repos | actions/get-repos.md | List repos configured in CloudBuild |
| get-repo-details | actions/get-repo-details.md | Get repo details |
| update-repo-settings | actions/update-repo-settings.md | Update repo build settings |

### VCS

| Action | File | Description |
|--------|------|-------------|
| get-hosting-config | actions/get-hosting-config.md | Get hosting providers, regions, machine configs |

### GitHub

| Action | File | Description |
|--------|------|-------------|
| get-github-user | actions/get-github-user.md | Get authenticated GitHub user |
| get-github-repos | actions/get-github-repos.md | List GitHub repos with search + pagination |
| get-github-branches | actions/get-github-branches.md | List branches for a repo |
| check-github-branch | actions/check-github-branch.md | Check if a branch exists |
| create-github-webhook | actions/create-github-webhook.md | Create webhook for auto-deploy |
