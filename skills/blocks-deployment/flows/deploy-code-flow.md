# Flow: deploy-code-flow

## Trigger

User wants to deploy code — selecting a repository and branch, triggering a build, and verifying the deployment.

> "deploy my code"
> "build and deploy the main branch"
> "trigger a deployment"
> "push my code to production"
> "deploy the latest changes"

---

## Pre-flight Audit

Before starting, verify:

1. **Project key** — `$PROJECT_SLUG` is available
2. **Credentials** — `x-blocks-key` is valid
3. **Repository** — GitHub repo is connected to CloudBuild (`get-repos`)
4. **Branch** — Target branch exists (`check-github-branch` or `get-github-branches`)
5. **Hosting config** — Region and machine config are set if settings need configuration (`get-hosting-config`)

---

## Pre-flight Questions

If any of the above are unknown, confirm:

1. Which repository should be built? (list available repos with `get-repos` or `get-github-repos`)
2. Which branch should be built? (e.g. `main`, `develop`)
3. Build type: auto-deploy (`trigger-build`) or manual (`manual-build`)?

---

## Flow Steps

### Step 1 — Select Repository

Identify the target repository. If the user hasn't specified:

```
Action: get-repos
Input:
  ProjectKey = $PROJECT_SLUG
Output: list of repos configured in CloudBuild with repoId
```

Or for GitHub repos not yet connected:

```
Action: get-github-repos
Input:
  ProjectKey = $PROJECT_SLUG
  Search = (optional filter)
Output: GitHub repos with id, name, defaultBranch
```

---

### Step 2 — Verify Branch Exists

Before triggering, verify the branch exists:

```
Action: get-github-branches
Input:
  repo = owner/repo-name (from selected repo)
  ProjectKey = $PROJECT_SLUG
Output: list of branches
```

Or for a quick existence check:

```
Action: check-github-branch
Input:
  repoId = repo-id
  ProjectKey = $PROJECT_SLUG
Output: { exists: boolean, branchName: string }
```

---

### Step 3 — Trigger Build

```
Action: trigger-build  (auto-deploy)
Input:
  repoId = selected repo ID
  projectKey = $PROJECT_SLUG
  hostingProviderId = (optional)
  regionId = (optional)
  machineConfigId = (optional)
```

Or for build-only (no auto-deploy):

```
Action: manual-build
Input:
  repoId = selected repo ID
  projectKey = $PROJECT_SLUG
```

On `isSuccess: true` → capture the `buildId` and proceed to Step 4.
On `isSuccess: false` → inspect `errors` dictionary and surface field messages.

---

### Step 4 — Monitor Build Status

Poll the build status until it reaches a terminal state (`Succeeded`, `Failed`, `Cancelled`).

```
Action: get-build
Input:
  buildId = buildId from Step 3
  ProjectKey = $PROJECT_SLUG
```

**Poll every 10 seconds** while status is `Queued` or `InProgress`. Report status transitions:
- `Queued` → "Build is queued..."
- `InProgress` → "Build is running..."
- `Succeeded` → proceed to Step 5
- `Failed` → stop and report failure details
- `Cancelled` → stop and inform user

---

### Step 5 — Verify Deployment

If using `trigger-build` (auto-deploy), verify the deployment succeeded:

```
Action: get-repo-details
Input:
  RepoId = selected repo ID
  ProjectKey = $PROJECT_SLUG
Output: repo details including lastDeploymentStatus
```

Check that `lastDeploymentStatus` is `Succeeded`.

---

## Error Handling

| Error | Cause | Action |
|-------|-------|--------|
| `isSuccess: false` on trigger-build | Missing repo or invalid params | Inspect `errors` dict; verify repoId from `get-repos` |
| Build status `Failed` | Build errors (compilation, tests) | Check build logs via `get-build-reports` |
| Build status `Cancelled` | Build was manually cancelled | Re-trigger if needed |
| `401` | `x-blocks-key` invalid/expired | Verify project key in Cloud Portal |
| `403` | Missing `cloudadmin` role | Verify role in Cloud Portal |
| `404` | Wrong `API_BASE_URL` or project not found | Check environment URL |
| `repoId` not found | Repo not connected to CloudBuild | Use `get-repos` to find valid IDs |

---

## Frontend Output

| File | Purpose |
|------|---------|
| `modules/deployment/pages/build-list/build-list-page.tsx` | Build list with status badges and trigger button |
| `modules/deployment/components/build-status/build-status.tsx` | Real-time build status indicator |
| `modules/deployment/hooks/use-deployment.tsx` | `useTriggerBuild`, `useManualBuild`, `useGetBuild`, `useGetBuilds` hooks |
| `modules/deployment/services/deployment.service.ts` | API calls for build operations |
| `modules/deployment/types/deployment.type.ts` | `Build`, `RepoBuildRequest` interfaces |
| `modules/deployment/pages/repo-list/repo-list-page.tsx` | Connected repos with settings link |
| `modules/deployment/pages/repo-settings/repo-settings-page.tsx` | Repo settings editor (hosting, region, domain) |

---

## Build Status Polling Pattern (React Query)

```ts
export const useGetBuild = (buildId: string) =>
  useQuery({
    queryKey: ['builds', buildId],
    queryFn: () => deploymentService.getBuild(buildId),
    enabled: !!buildId,
    select: (res) => res.data,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.build?.status;
      return status === 'Queued' || status === 'InProgress' ? 10_000 : false;
    },
  });
```
