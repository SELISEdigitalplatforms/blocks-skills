# blocks-deployment

CI/CD build management, VCS repository configuration, and GitHub integration for SELISE Blocks — via the CloudBuild v1 API.

---

## What this skill does

| Category | Coverage |
|----------|---------|
| **Build** | Trigger builds (auto-deploy or manual), monitor status, get build reports |
| **Repository** | List repos, get details, update domain settings, update build settings |
| **VCS** | List VCS repos, get details, update domain/config, hosting configuration |
| **GitHub** | Get user, list repos with search/pagination, list/check branches, clone URL, webhooks |

---

## Framework Support

| Stack | Reference |
|-------|-----------|
| React (Next.js / Vite) | `references/react-vite.md` |
| Next.js | `references/nextjs-deployment.md` |
| Angular | `references/angular.md` |
| Blazor .NET | `references/blazor-dotnet.md` |
| React Native | `references/react-native.md` |
| Flutter | `references/flutter.md` |
| Hosting providers | `references/hosting-providers.md` |
| Webhook setup | `references/webhook-setup.md` |
| Migration guides | `references/bridge-strategies.md` |

---

## Quick Start

```
Set up a GitHub repo for auto-deploy
```

```
Trigger a build on the main branch
```

```
Check build status
```

```
Configure hosting region and machine size for my repo
```

---

## Skill Structure

```
skills/blocks-deployment/
├── SKILL.md                      <- Intent map, naming conventions, verification checklist
├── contracts.md                  <- All request/response schemas from cloudbuild/v1 swagger
├── meta.json                     <- Machine-readable skill metadata
├── README.md                     <- This file
├── evals/                        <- Evaluation tests
│   ├── README.md
│   └── evals.json
├── references/                   <- Framework-specific CI/CD patterns
│   ├── react-vite.md
│   ├── nextjs-deployment.md
│   ├── angular.md
│   ├── blazor-dotnet.md
│   ├── react-native.md
│   ├── flutter.md
│   ├── hosting-providers.md
│   ├── webhook-setup.md
│   └── bridge-strategies.md
├── flows/
│   ├── deploy-code-flow.md      <- Trigger build, poll status, verify deployment
│   └── setup-repository-flow.md <- Connect repo, configure domains, enable webhooks
└── actions/                      <- 15 single-API operations
    ├── trigger-build.md          <- POST /Build/run-build (auto-deploy)
    ├── manual-build.md          <- POST /Build/manual (build-only)
    ├── get-build.md             <- GET /Build
    ├── get-builds.md            <- GET /Build
    ├── get-repos.md             <- GET /Build/repos
    ├── get-repo-details.md      <- GET /Build/repo-details
    ├── update-repo-settings.md  <- POST /Build/repo-settings-update
    ├── get-build-settings.md    <- GET /Build/settings
    ├── get-build-reports.md     <- GET /Build/reports
    ├── get-hosting-config.md   <- GET /VcsRepository/HostingConfiguration
    ├── get-github-user.md       <- GET /Github/user
    ├── get-github-repos.md     <- GET /Github/repos (with search + pagination)
    ├── get-github-branches.md  <- GET /Github/branches
    ├── check-github-branch.md   <- GET /Github/GithubBranchExists
    └── create-github-webhook.md <- POST /Github/webhook
```

---

## API Base Path

All endpoints: `{apiUrl}/cloudbuild/v1`

> **NOT** `/deployment/v1` — the CloudBuild API uses `/cloudbuild/v1` as its prefix.

## Auth Header

```
x-blocks-key: {projectKey}
```

> Auth is via `x-blocks-key` header only. Do NOT use `Authorization: Bearer` — that is for the `/Auth/AccessToken` endpoint.

## Response Envelope

All responses wrap in `BaseApiResponse`:
- `isSuccess` (boolean)
- `errors` (dictionary: `{ fieldName: message }`, NOT an array)
- `message` (string)
- `statusCode` (number)
- `data` (payload)

`BuildResponse` adds a top-level `buildId` field outside the `data` wrapper.

---

## Key Field Names

The CloudBuild API uses conventions that differ from standard REST APIs. Wrong field names silently return null or fail.

| Wrong | Correct | Why |
|-------|---------|-----|
| `repositoryId` | `repoId` | Build trigger, repo details, settings |
| `projectKey` (query param) | `ProjectKey` | PascalCase query param |
| `repoId` (query param) | `RepoId` | PascalCase query param |
| `Authorization: Bearer` | `x-blocks-key` header | All authenticated requests |
| `data.build.buildId` | `buildId` (top-level) | `BuildResponse` envelope |
| `errors[]` (array) | `errors{}` (dictionary) | All response envelopes |
| `x-blocks-key` header | `x-blocks-key` query param | `POST /Github/webhook` only |

---

## Flows

| Flow | What it does |
|------|--------------|
| `deploy-code-flow.md` | Select repo/branch, trigger build, monitor status, verify deployment |
| `setup-repository-flow.md` | Connect repo, configure domains, set up GitHub webhook |

---

## Environment Variables

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
NEXT_PUBLIC_X_BLOCKS_KEY=your-project-key
```

---

## Framework Support

| Stack | Reference |
|-------|-----------|
| React (Next.js / Vite) | `references/react-vite.md` |
| Next.js | `references/nextjs-deployment.md` |
| Angular | `references/angular.md` |
| Blazor .NET | `references/blazor-dotnet.md` |
| React Native | `references/react-native.md` |
| Flutter | `references/flutter.md` |
| Hosting providers | `references/hosting-providers.md` |
| Webhook setup | `references/webhook-setup.md` |
| Migration guides | `references/bridge-strategies.md` |

---

## Version

**1.1.0** — Scoped to cloudbuild/v1 swagger. All endpoints updated to `/cloudbuild/v1/`. `RepoBuildRequest` fields corrected to `repoId`, `hostingProviderId`, `regionId`, `machineConfigId`.
