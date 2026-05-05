# Next.js CI/CD Pipeline

## Overview

Next.js projects on SELISE Blocks can use CloudBuild for automated builds and deployments. The deployment skill integrates with Next.js App Router and Pages Router patterns.

## Deployment Flow

1. **Connect repo** — Use `setup-repository-flow` to connect the GitHub repo
2. **Configure build** — Set hosting, region, and machine config via `update-repo-settings`
3. **Create webhook** — Use `create-github-webhook` to trigger builds on push
4. **Monitor** — Poll `get-build` with `refetchInterval` until terminal state

## Service Integration

```ts
// lib/blocks/cloudbuild.ts
const BASE = process.env.NEXT_PUBLIC_BLOCKS_API_URL + '/cloudbuild/v1';

export const cloudbuildService = {
  triggerBuild: async (payload: { repoId: string; projectKey: string; hostingProviderId?: string; regionId?: string; machineConfigId?: string }) => {
    const res = await fetch(`${BASE}/Build/run-build`, {
      method: 'POST',
      headers: { 'x-blocks-key': payload.projectKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  getBuild: async (buildId: string, projectKey: string) => {
    const res = await fetch(`${BASE}/Build?buildId=${buildId}&ProjectKey=${projectKey}`, {
      headers: { 'x-blocks-key': projectKey },
    });
    return res.json();
  },
};
```

## Environment Variables

```bash
NEXT_PUBLIC_BLOCKS_API_URL=https://api.seliseblocks.com
NEXT_PUBLIC_PROJECT_KEY=your-project-key
```

## Server-Side Build Trigger

For GitHub Actions workflows that trigger Blocks builds:

```yaml
# .github/workflows/deploy.yml
name: Trigger Blocks Build
on:
  push:
    branches: [main]

jobs:
  trigger-build:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger CloudBuild
        run: |
          curl -X POST "${{ vars.BLOCKS_API_URL }}/cloudbuild/v1/Build/run-build" \
            -H "x-blocks-key: ${{ vars.BLOCKS_PROJECT_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{
              "repoId": "${{ vars.BLOCKS_REPO_ID }}",
              "projectKey": "${{ vars.BLOCKS_PROJECT_KEY }}",
              "hostingProviderId": "${{ vars.BLOCKS_HOSTING_PROVIDER_ID }}",
              "regionId": "${{ vars.BLOCKS_REGION_ID }}",
              "machineConfigId": "${{ vars.BLOCKS_MACHINE_CONFIG_ID }}"
            }'
```

## Next.js Build Output

The CloudBuild pipeline should produce a standard Next.js output:

```bash
# In the build container
npm run build
# Output: .next/ directory with standalone export
```

## Framework Notes

- Next.js App Router uses React 18+ server components — API calls should be in server components or Route Handlers
- For client-side polling, use a `useEffect` with `setInterval` or React Query `useQuery` with `refetchInterval`
- Environment variables for project key should use `NEXT_PUBLIC_` prefix for client-side access
- Build timeout should account for Next.js compilation (typically 3-5 minutes)
