# React integration — blocks-release (CI/CD)

Target stack: React 19 + TypeScript + Vite + Tailwind + shadcn/ui + TanStack Query + Zustand
(matches `blocks-construct-react`). This wires the release service into an admin/deployments UI:
list repos, configure hosting, trigger builds, poll status, read reports.

Env (see blocks-setup): `VITE_BLOCKS_API_URL` (= `https://api.seliseblocks.com`) and
`VITE_X_BLOCKS_KEY`. Never put credentials in `VITE_` vars; the Bearer token comes from your auth
store at runtime. Note: a deployments UI is an *admin* surface — gate it behind an authorized
role, and only expose the x-blocks-key value that is safe for client use in your project.

## API client slice

```ts
// src/features/release/api/client.ts
// Types generated from swagger — see ../../../contracts.md
import type {
  BaseApiResponse,
  BuildResponse,
  RepoBuildRequest,
  RepoDomainUpdateRequest,
  RepoUpdateRequest,
} from './contracts'; // copy contracts.md's block into contracts.ts
import { useAuthStore } from '@/stores/auth'; // Zustand store from blocks-setup pattern

const BASE = `${import.meta.env.VITE_BLOCKS_API_URL}/release/v4`;

async function releaseFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'x-blocks-key': import.meta.env.VITE_X_BLOCKS_KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  if (res.status === 401) {
    // Expired token: refresh via blocks-setup's refresh flow, then retry once.
    await useAuthStore.getState().refresh();
    return releaseFetch<T>(path, init);
  }
  if (!res.ok) throw new Error(`release/v4 ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

// ---- Auth (GitHub authorization — NOT app login; that's blocks-iam) ----

// Response shape not documented in swagger — keep `unknown` until observed live.
export const getGithubAuthorized = () =>
  releaseFetch<unknown>('/api/Auth/IsAuthorized');

// ---- Github ----

export const getGithubUser = () => releaseFetch<unknown>('/api/Github/user');

export const getGithubRepos = (p: { search?: string; pageNumber?: number; pageSize?: number }) => {
  const q = new URLSearchParams();
  if (p.search) q.set('Search', p.search);           // PascalCase — per swagger
  if (p.pageNumber != null) q.set('PageNumber', String(p.pageNumber));
  if (p.pageSize != null) q.set('PageSize', String(p.pageSize));
  return releaseFetch<unknown>(`/api/Github/repos?${q}`);
};

export const getGithubBranches = (repo: string) =>
  releaseFetch<unknown>(`/api/Github/branches?repo=${encodeURIComponent(repo)}`);

// NOTE: mutating GET — creates a webhook on the GitHub repo. Call only on explicit user action.
export const createGithubWebhook = (repoId: string) =>
  releaseFetch<unknown>(`/api/Github/CreateWebhook?RepoId=${encodeURIComponent(repoId)}`);

// ---- Build ----

export const getConnectedRepos = () => releaseFetch<unknown>('/api/Build/repos-list');
export const getBuildSettings = () => releaseFetch<unknown>('/api/Build/settings');

export const getRepoDetails = (repoId: string) =>
  releaseFetch<unknown>(`/api/Build/repo-details?RepoId=${encodeURIComponent(repoId)}`);

export const getBuild = (buildId: string) =>
  releaseFetch<unknown>(`/api/Build?buildId=${encodeURIComponent(buildId)}`);

export const getBuildReports = (buildId: string, type?: string) => {
  const q = new URLSearchParams({ buildId });
  if (type) q.set('type', type); // valid values undocumented — derive from an unfiltered call
  return releaseFetch<unknown>(`/api/Build/reports?${q}`);
};

export const triggerManualBuild = (body: RepoBuildRequest) =>
  releaseFetch<BuildResponse>('/api/Build/manual', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const updateRepoSettings = (body: RepoUpdateRequest) =>
  releaseFetch<unknown>('/api/Build/repo-settings-update', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const updateRepoDomains = (body: RepoDomainUpdateRequest) =>
  releaseFetch<BaseApiResponse>('/api/Build/repo-update', {
    method: 'POST',
    body: JSON.stringify(body),
  });
```

Most GET responses are typed `unknown` because the swagger documents no schema for them (see
endpoints.md). Once you have inspected the live payloads for your project, replace `unknown` with
local interfaces — do not guess field names up front.

## TanStack Query hooks

```ts
// src/features/release/api/hooks.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { RepoBuildRequest, RepoUpdateRequest } from './contracts';
import * as api from './client';

const keys = {
  authorized: ['release', 'github-authorized'] as const,
  repos: (search?: string) => ['release', 'github-repos', search ?? ''] as const,
  connected: ['release', 'connected-repos'] as const,
  settings: ['release', 'build-settings'] as const,
  repoDetails: (repoId: string) => ['release', 'repo-details', repoId] as const,
  build: (buildId: string) => ['release', 'build', buildId] as const,
  reports: (buildId: string) => ['release', 'build-reports', buildId] as const,
};

export const useGithubAuthorized = () =>
  useQuery({ queryKey: keys.authorized, queryFn: api.getGithubAuthorized });

export const useGithubRepos = (search?: string) =>
  useQuery({
    queryKey: keys.repos(search),
    queryFn: () => api.getGithubRepos({ search, pageNumber: 1, pageSize: 50 }),
  });

export const useConnectedRepos = () =>
  useQuery({ queryKey: keys.connected, queryFn: api.getConnectedRepos });

export const useBuildSettings = () =>
  useQuery({ queryKey: keys.settings, queryFn: api.getBuildSettings, staleTime: 5 * 60_000 });

export const useRepoDetails = (repoId: string | undefined) =>
  useQuery({
    queryKey: keys.repoDetails(repoId ?? ''),
    queryFn: () => api.getRepoDetails(repoId!),
    enabled: !!repoId,
  });

/** Poll a running build every 10s; stop when the caller flips `active` off. */
export const useBuild = (buildId: string | undefined, active: boolean) =>
  useQuery({
    queryKey: keys.build(buildId ?? ''),
    queryFn: () => api.getBuild(buildId!),
    enabled: !!buildId,
    refetchInterval: active ? 10_000 : false,
  });

export const useBuildReports = (buildId: string | undefined) =>
  useQuery({
    queryKey: keys.reports(buildId ?? ''),
    queryFn: () => api.getBuildReports(buildId!),
    enabled: !!buildId,
  });

export const useTriggerBuild = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: RepoBuildRequest) => api.triggerManualBuild(body),
    onSuccess: (res) => {
      // BuildResponse: { isSuccess, errors, message, statusCode, buildId }
      if (res.isSuccess && res.buildId) {
        qc.invalidateQueries({ queryKey: keys.connected });
      }
    },
  });
};

export const useUpdateRepoSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: RepoUpdateRequest) => api.updateRepoSettings(body),
    onSuccess: (_res, body) => {
      if (body.repoId) qc.invalidateQueries({ queryKey: keys.repoDetails(body.repoId) });
    },
  });
};
```

## Component sketch — trigger a build and watch it

```tsx
// src/features/release/components/DeployPanel.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useBuild, useTriggerBuild } from '../api/hooks';

export function DeployPanel({ repoId }: { repoId: string }) {
  const [buildId, setBuildId] = useState<string>();
  const [watching, setWatching] = useState(false);

  const trigger = useTriggerBuild();
  const build = useBuild(buildId, watching);

  const onDeploy = () =>
    trigger.mutate(
      // projectKey = your Blocks Key (same value as VITE_X_BLOCKS_KEY)
      { repoId, projectKey: import.meta.env.VITE_X_BLOCKS_KEY },
      {
        onSuccess: (res) => {
          if (res.isSuccess && res.buildId) {
            setBuildId(res.buildId);
            setWatching(true);
          }
        },
      },
    );

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <Button onClick={onDeploy} disabled={trigger.isPending}>
        {trigger.isPending ? 'Triggering…' : 'Deploy'}
      </Button>

      {trigger.data?.isSuccess === false && (
        <ul className="text-sm text-destructive">
          {Object.entries(trigger.data.errors ?? {}).map(([field, msg]) => (
            <li key={field}>{field}: {msg}</li>
          ))}
        </ul>
      )}

      {buildId && (
        <pre className="max-h-64 overflow-auto rounded bg-muted p-2 text-xs">
          {/* GET /api/Build response is undocumented in swagger — render raw until the
              status field is confirmed, then switch to a proper status badge and stop
              polling (setWatching(false)) on terminal states. */}
          {JSON.stringify(build.data, null, 2)}
        </pre>
      )}
    </div>
  );
}
```

## Errors & refresh

- The client above retries once on 401 via the auth store's `refresh()` — the refresh endpoint
  and store shape are defined in **blocks-setup** (`POST /iam/v4/api/auth/refresh`).
- `errors` in documented envelopes is a dictionary (`{ field: message }`), not an array — render
  entries, don't index.
- Do not wire `createGithubWebhook` or `GET /api/Github/clone` into queries — they are mutating
  GETs; call them only from explicit user actions (and never in `useQuery`, which refetches).
