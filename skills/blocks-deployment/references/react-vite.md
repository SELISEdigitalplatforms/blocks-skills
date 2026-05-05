# React + Vite CI/CD Dashboard

## Module Location

```
src/modules/deployment/
├── components/
│   ├── build-status/build-status.tsx
│   ├── hosting-selector/hosting-selector.tsx
│   ├── domain-input/domain-input.tsx
│   └── webhook-status/webhook-status.tsx
├── pages/
│   ├── build-list/build-list-page.tsx
│   ├── repo-list/repo-list-page.tsx
│   └── repo-settings/repo-settings-page.tsx
├── hooks/
│   └── use-deployment.tsx
├── services/
│   └── cloudbuild.service.ts
└── types/
    └── cloudbuild.type.ts
```

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS 3.4 |
| Component primitives | Radix UI |
| Icons | Lucide React |
| Forms | React Hook Form + Zod |
| State | React Query (TanStack Query) |

## Types

```ts
export type BuildStatus = 'Queued' | 'InProgress' | 'Succeeded' | 'Failed' | 'Cancelled';

export interface Build {
  buildId: string;
  branch: string;
  status: BuildStatus;
  startTime: string;
  endTime: string;
  commitHash: string;
  commitMessage: string;
}

export interface RepoBuildRequest {
  repoId: string;
  projectKey: string;
  hostingProviderId?: string;
  regionId?: string;
  machineConfigId?: string;
}

export interface GetBuildParams {
  buildId: string;
  ProjectKey: string;
}

export interface GetReposParams {
  ProjectKey: string;
}

export interface RepoUpdateRequest {
  projectKey: string;
  repoId: string;
  hostingProviderId?: string;
  regionId?: string;
  machineConfigId?: string;
  deploymentType?: string;
  customDomain?: string;
}

export interface HostingConfig {
  hostingProviders: HostingProvider[];
}

export interface HostingProvider {
  id: string;
  name: string;
  status: string;
  region: Region[];
}

export interface Region {
  id: string;
  name: string;
  status: string;
  machineSpecs: MachineConfig[];
}

export interface MachineConfig {
  id: string;
  ram: string;
  cpu: string;
  bandwidth: string;
  status: string;
}
```

## Service

```ts
import { axiosInstance } from '@/lib/axios';

const BASE = '/cloudbuild/v1';

export const cloudbuildService = {
  triggerBuild: (payload: RepoBuildRequest) =>
    axiosInstance.post(`${BASE}/Build/run-build`, payload),

  manualBuild: (payload: RepoBuildRequest) =>
    axiosInstance.post(`${BASE}/Build/manual`, payload),

  getBuild: (params: GetBuildParams) =>
    axiosInstance.get(`${BASE}/Build`, { params }),

  getRepos: (params: GetReposParams) =>
    axiosInstance.get(`${BASE}/Build/repos`, { params }),

  getRepoDetails: (params: { RepoId: string; ProjectKey: string }) =>
    axiosInstance.get(`${BASE}/Build/repo-details`, { params }),

  updateRepoSettings: (payload: RepoUpdateRequest) =>
    axiosInstance.post(`${BASE}/Build/repo-settings-update`, payload),

  getHostingConfig: () =>
    axiosInstance.get(`${BASE}/VcsRepository/HostingConfiguration`),

  getBuildSettings: () =>
    axiosInstance.get(`${BASE}/Build/settings`),

  getBuildReports: (params: { buildId: string; ProjectKey: string; type?: string }) =>
    axiosInstance.get(`${BASE}/Build/reports`, { params }),

  getGithubUser: (params: { ProjectKey: string }) =>
    axiosInstance.get(`${BASE}/Github/user`, { params }),

  getGithubRepos: (params: { ProjectKey: string; Search?: string; PageNumber?: number; PageSize?: number }) =>
    axiosInstance.get(`${BASE}/Github/repos`, { params }),

  getGithubBranches: (params: { repo: string; ProjectKey: string }) =>
    axiosInstance.get(`${BASE}/Github/branches`, { params }),

  checkGithubBranch: (params: { repoId: string; ProjectKey: string }) =>
    axiosInstance.get(`${BASE}/Github/GithubBranchExists`, { params }),

  createWebhook: (projectKey: string) =>
    axiosInstance.post(`${BASE}/Github/webhook?x-blocks-key=${projectKey}`),
};
```

## Hooks

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cloudbuildService } from '../services/cloudbuild.service';

export const useGetBuild = (buildId: string, projectKey: string) =>
  useQuery({
    queryKey: ['builds', buildId],
    queryFn: () => cloudbuildService.getBuild({ buildId, ProjectKey: projectKey }),
    enabled: !!buildId,
    select: (res) => res.data,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.build?.status;
      return status === 'Queued' || status === 'InProgress' ? 10_000 : false;
    },
  });

export const useTriggerBuild = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cloudbuildService.triggerBuild,
    onSuccess: (res) => {
      const buildId = res.data?.buildId;
      if (buildId) {
        queryClient.invalidateQueries({ queryKey: ['builds'] });
      }
    },
  });
};

export const useGetRepos = (projectKey: string) =>
  useQuery({
    queryKey: ['repos', projectKey],
    queryFn: () => cloudbuildService.getRepos({ ProjectKey: projectKey }),
    select: (res) => res.data,
  });

export const useGetHostingConfig = () =>
  useQuery({
    queryKey: ['hosting-config'],
    queryFn: cloudbuildService.getHostingConfig,
    select: (res) => res.data,
  });

export const useUpdateRepoSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cloudbuildService.updateRepoSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['repos'] }),
  });
};
```

## Build Status Badge

```tsx
import { CheckCircle2, XCircle, Loader2, Clock, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BuildStatus } from '../../types/cloudbuild.type';

const statusConfig: Record<BuildStatus, { icon: React.ElementType; variant: string; label: string }> = {
  Queued: { icon: Clock, variant: 'secondary', label: 'Queued' },
  InProgress: { icon: Loader2, variant: 'default', label: 'In Progress' },
  Succeeded: { icon: CheckCircle2, variant: 'default', label: 'Succeeded' },
  Failed: { icon: XCircle, variant: 'destructive', label: 'Failed' },
  Cancelled: { icon: Ban, variant: 'secondary', label: 'Cancelled' },
};

export function BuildStatus({ status }: { status: BuildStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant as any} className="gap-1">
      <config.icon className={cn('h-3 w-3', status === 'InProgress' && 'animate-spin')} />
      {config.label}
    </Badge>
  );
}
```

## Cascading Hosting Selector

```tsx
export function HostingSelector({ value, onChange }: { value: RepoUpdateRequest; onChange: (v: RepoUpdateRequest) => void }) {
  const { data } = useGetHostingConfig();
  const providers = data?.data?.hostingProviders ?? [];
  const regions = providers.find(p => p.id === value.hostingProviderId)?.region ?? [];
  const machines = regions.find(r => r.id === value.regionId)?.machineSpecs ?? [];

  return (
    <div className="space-y-4">
      <Select value={value.hostingProviderId} onValueChange={v => onChange({ ...value, hostingProviderId: v, regionId: '', machineConfigId: '' })}>
        <SelectTrigger><SelectValue placeholder="Hosting provider" /></SelectTrigger>
        <SelectContent>
          {providers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={value.regionId} onValueChange={v => onChange({ ...value, regionId: v, machineConfigId: '' })} disabled={!value.hostingProviderId}>
        <SelectTrigger><SelectValue placeholder="Region" /></SelectTrigger>
        <SelectContent>
          {regions.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={value.machineConfigId} onValueChange={v => onChange({ ...value, machineConfigId: v })} disabled={!value.regionId}>
        <SelectTrigger><SelectValue placeholder="Machine config" /></SelectTrigger>
        <SelectContent>
          {machines.map(m => <SelectItem key={m.id} value={m.id}>{m.cpu} / {m.ram}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
```

## Rules

- Never hardcode `projectKey` — always from `import.meta.env.VITE_PROJECT_KEY` or app config
- Build status polling must stop at terminal state — do not poll indefinitely
- `ProjectKey` in API calls is PascalCase
- All pages must handle loading (`<Skeleton />`), error (`<ErrorAlert />`), and empty states
- Use `cn()` from `@/lib/utils` for conditional classNames
