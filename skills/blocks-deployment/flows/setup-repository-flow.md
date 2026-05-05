# Flow: setup-repository-flow

## Trigger

User wants to connect a GitHub repository to CloudBuild and configure it for auto-deploy — setting up hosting, regions, machine configs, custom domains, and GitHub webhooks.

> "set up my GitHub repo for auto-deploy"
> "configure hosting for my repo"
> "connect my repository to CloudBuild"
> "add a custom domain for my deployed app"
> "set up webhook for auto-deploy"

---

## Pre-flight Audit

Before starting, verify:

1. **Project key** — `$PROJECT_SLUG` is available
2. **Credentials** — `x-blocks-key` is valid
3. **GitHub access** — GitHub account is connected (`get-github-user`)
4. **Hosting options** — Available regions and machine configs are known (`get-hosting-config`)

---

## Pre-flight Questions

If any information is unknown, confirm:

1. Which GitHub repository should be connected? (use `get-github-repos` to list)
2. Which hosting provider and region? (AWS, Azure, GCP — from `get-hosting-config`)
3. Which machine configuration? (CPU/RAM spec — from `get-hosting-config`)
4. Custom domain? (optional)

---

## Flow Steps

### Step 1 — Connect GitHub Repository

First, verify GitHub access and list available repos:

```
Action: get-github-user
Input:
  ProjectKey = $PROJECT_SLUG
Output: GitHub user info (login, avatar)
```

Then list repos to find the one to connect:

```
Action: get-github-repos
Input:
  ProjectKey = $PROJECT_SLUG
  Search = (optional filter by name)
Output: GitHub repos with id, name, defaultBranch
```

---

### Step 2 — Get Available Hosting Configuration

Before configuring settings, get available options:

```
Action: get-hosting-config
Input: (no params — uses x-blocks-key header)
Output: hosting providers, regions, machine configs
```

Present the user with:
- **Hosting providers**: AWS, Azure, GCP, etc.
- **Regions**: per provider (e.g. `us-east-1`, `eu-west-1`)
- **Machine configs**: per region (e.g. `2 vCPU, 8GB RAM`)

---

### Step 3 — Configure Repository Settings

Update the repository with hosting and deployment settings:

```
Action: update-repo-settings
Input:
  projectKey = $PROJECT_SLUG
  repoId = selected repo ID
  hostingProviderId = selected provider ID
  regionId = selected region ID
  machineConfigId = selected machine config ID
  deploymentType = "auto" (for auto-deploy)
  customDomain = (optional) e.g. "app.example.com"
```

On `isSuccess: true` → proceed to Step 4.
On `isSuccess: false` → inspect `errors` dict and surface field messages.

---

### Step 4 — Verify Repository Details

Confirm the settings were applied correctly:

```
Action: get-repo-details
Input:
  RepoId = selected repo ID
  ProjectKey = $PROJECT_SLUG
Output: repo details with hosting, region, machine config, custom domain
```

---

### Step 5 — Set Up GitHub Webhook for Auto-Deploy

Create a webhook so pushes to the repository automatically trigger builds:

```
Action: create-github-webhook
Input: (x-blocks-key as query param)
  x-blocks-key = $PROJECT_SLUG
Output: webhook config with id, url, events
```

> Note: `x-blocks-key` is passed as a **query parameter** on this endpoint, not as a header.

---

### Step 6 — Verify Webhook Setup

List branches to confirm the repo is accessible:

```
Action: get-github-branches
Input:
  repo = owner/repo-name
  ProjectKey = $PROJECT_SLUG
Output: list of branches
```

---

## Error Handling

| Error | Cause | Action |
|-------|-------|--------|
| `isSuccess: false` on update-repo-settings | Validation error | Inspect `errors` dict |
| `403` on get-github-user | GitHub not connected | Connect GitHub in Cloud Portal |
| `409` on create-github-webhook | Webhook already exists | Webhook is already configured |
| `401` | `x-blocks-key` invalid | Verify project key |
| Hosting config empty | No providers available | Contact Cloud Portal support |
| `repoId` not found | Repo not in CloudBuild | Use `get-repos` to find valid IDs |

---

## Frontend Output

| File | Purpose |
|------|---------|
| `modules/deployment/pages/repo-connect/repo-connect-page.tsx` | GitHub repo picker with search and pagination |
| `modules/deployment/pages/repo-settings/repo-settings-page.tsx` | Hosting config form (provider, region, machine, domain) |
| `modules/deployment/components/hosting-selector/hosting-selector.tsx` | Dropdown for provider → region → machine cascade |
| `modules/deployment/components/domain-input/domain-input.tsx` | Custom domain input with validation |
| `modules/deployment/hooks/use-repository.tsx` | `useGetHostingConfig`, `useUpdateRepoSettings`, `useCreateWebhook` hooks |
| `modules/deployment/services/repository.service.ts` | API calls for repo and hosting operations |
| `modules/deployment/types/repository.type.ts` | `HostingProvider`, `Region`, `MachineConfig`, `RepoUpdateRequest` interfaces |

---

## Cascading Selector Pattern

Hosting configuration uses a cascading dropdown:

1. **Provider** — Select from `hostingProviders[]` (AWS, Azure, GCP)
2. **Region** — Filter by selected provider's `region[]`
3. **Machine** — Filter by selected region's `machineSpecs[]`

```ts
const [providerId, setProviderId] = useState('');
const [regionId, setRegionId] = useState('');
const [machineId, setMachineId] = useState('');

const providers = data?.hostingProviders ?? [];
const regions = providers.find(p => p.id === providerId)?.region ?? [];
const machines = regions.find(r => r.id === regionId)?.machineSpecs ?? [];
```
