# React integration — blocks-logic

Target stack: React 19 + TypeScript + Vite + Tailwind + shadcn/ui + TanStack Query +
Zustand (matches `blocks-construct-react`). This guide wires the `logic/v4` service into
that stack: a typed fetch slice, query/mutation hooks for the highest-value endpoints,
and one component sketch.

Env (see `blocks-setup`): `VITE_BLOCKS_API_URL` (`https://api.seliseblocks.com`) and
`VITE_X_BLOCKS_KEY` — nothing else. Never put credentials or non-public keys in
`VITE_` vars — the Bearer token comes from the auth store at runtime, not from env.

## API client slice

```ts
// src/features/logic/client.ts
import { useAuthStore } from '@/state/auth-store'; // Zustand store from blocks-setup wiring

const BASE = `${import.meta.env.VITE_BLOCKS_API_URL}/logic/v4`;
// projectKey = your Blocks Key — the same value sent in the x-blocks-key header.
export const X_BLOCKS_KEY = import.meta.env.VITE_X_BLOCKS_KEY as string;

export class LogicApiError extends Error {
  constructor(public status: number, public body: unknown) {
    super(`logic/v4 request failed: ${status}`);
  }
}

export async function logicFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { accessToken } = useAuthStore.getState();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'x-blocks-key': X_BLOCKS_KEY,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  if (res.status === 401) {
    // Refresh via POST /iam/v4/auth/refresh, then retry once — see blocks-setup.
    await useAuthStore.getState().refresh();
    return logicFetch<T>(path, init);
  }
  if (!res.ok) throw new LogicApiError(res.status, await res.json().catch(() => null));
  return (await res.json().catch(() => undefined)) as T;
}
```

## Types

Mirror `contracts.md` into `src/features/logic/contracts.ts` and import by name:

```ts
import type {
  WorkflowGetsRequestDto,
  WorkflowCreateRequestDto,
  WorkflowUpdateRequestDto,
  WorkflowPublishNewVersionRequestDto,
  StepExecuteRequestDto,
  GetPreSignedUrlForUploadRequest,
  GetPreSignedUrlForUploadResponse,
  MailServerConfiguration,
  DeploymentDriverBaseApiResponse,
  BaseResponse,
} from './contracts';
```

Most `Workflow` endpoints have **no response schema in swagger**. Type those responses as
`unknown` at the client boundary and narrow behind a small parser you validate against
the live API once (e.g., with zod) — do not invent interfaces and trust them.

## Query keys

```ts
// src/features/logic/keys.ts
export const logicKeys = {
  workflows: (params: Partial<WorkflowGetsRequestDto>) => ['logic', 'workflows', params] as const,
  workflow: (workflowId: string) => ['logic', 'workflow', workflowId] as const,
  executions: (workflowId: string) => ['logic', 'executions', workflowId] as const,
  execution: (executionId: string) => ['logic', 'execution', executionId] as const,
  mailConfigs: () => ['logic', 'mail-configs'] as const,
  deploymentAuth: () => ['logic', 'deployment-auth'] as const,
};
```

## Hooks

```ts
// src/features/logic/hooks.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { logicFetch, X_BLOCKS_KEY } from './client';
import { logicKeys } from './keys';

// POST /Workflow/GetAll — list workflows (body pagination)
export function useWorkflows(params: Omit<WorkflowGetsRequestDto, 'projectKey'> = {}) {
  return useQuery({
    queryKey: logicKeys.workflows(params),
    queryFn: () =>
      logicFetch<unknown>('/Workflow/GetAll', {
        method: 'POST',
        body: JSON.stringify({ projectKey: X_BLOCKS_KEY, pageSize: 20, pageNumber: 1, ...params }),
      }),
  });
}

// GET /Workflow/Get — single workflow definition (PascalCase query params!)
export function useWorkflow(workflowId: string) {
  return useQuery({
    queryKey: logicKeys.workflow(workflowId),
    enabled: !!workflowId,
    queryFn: () =>
      logicFetch<unknown>(
        `/Workflow/Get?WorkflowId=${encodeURIComponent(workflowId)}&ProjectKey=${X_BLOCKS_KEY}`,
      ),
  });
}

// POST /Workflow/Create
export function useCreateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<WorkflowCreateRequestDto, 'projectKey'>) =>
      logicFetch<unknown>('/Workflow/Create', {
        method: 'POST',
        body: JSON.stringify({ projectKey: X_BLOCKS_KEY, ...body }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['logic', 'workflows'] }),
  });
}

// PUT /Workflow/Update — note the PUT verb
export function useUpdateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<WorkflowUpdateRequestDto, 'projectKey'>) =>
      logicFetch<unknown>('/Workflow/Update', {
        method: 'PUT',
        body: JSON.stringify({ projectKey: X_BLOCKS_KEY, ...body }),
      }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: logicKeys.workflow(vars.itemId) });
      qc.invalidateQueries({ queryKey: ['logic', 'workflows'] });
    },
  });
}

// POST /Workflow/PublishNewVersion — snapshot draft + publish
export function usePublishNewVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<WorkflowPublishNewVersionRequestDto, 'projectKey'>) =>
      logicFetch<unknown>('/Workflow/PublishNewVersion', {
        method: 'POST',
        body: JSON.stringify({ projectKey: X_BLOCKS_KEY, ...body }),
      }),
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: logicKeys.workflow(vars.workflowId) }),
  });
}

// GET /Workflow/GetExecutions — run history for one workflow
export function useExecutions(workflowId: string) {
  return useQuery({
    queryKey: logicKeys.executions(workflowId),
    enabled: !!workflowId,
    refetchInterval: 5_000, // executions change while runs are in flight
    queryFn: () =>
      logicFetch<unknown>(
        `/Workflow/GetExecutions?ProjectKey=${X_BLOCKS_KEY}&WorkflowId=${encodeURIComponent(workflowId)}`,
      ),
  });
}

// POST /Workflow/StepExecute — debug a single node
export function useStepExecute() {
  return useMutation({
    mutationFn: (body: Omit<StepExecuteRequestDto, 'projectKey'>) =>
      logicFetch<unknown>('/Workflow/StepExecute', {
        method: 'POST',
        body: JSON.stringify({ projectKey: X_BLOCKS_KEY, ...body }),
      }),
  });
}

// GET /Mail/Gets — SMTP configurations (typed: MailServerConfiguration[])
export function useMailConfigurations() {
  return useQuery({
    queryKey: logicKeys.mailConfigs(),
    queryFn: () =>
      logicFetch<MailServerConfiguration[]>(`/Mail/Gets?ProjectKey=${X_BLOCKS_KEY}`),
  });
}

// Pre-signed upload: POST /Storage/GetPreSignedUrlForUpload, then PUT the bytes
export function useUploadLogicFile() {
  return useMutation({
    mutationFn: async (file: File) => {
      const slot = await logicFetch<GetPreSignedUrlForUploadResponse>(
        '/Storage/GetPreSignedUrlForUpload',
        {
          method: 'POST',
          body: JSON.stringify({ name: file.name, projectKey: X_BLOCKS_KEY }),
        },
      );
      if (!slot.isSuccess || !slot.uploadUrl) throw new Error('No upload URL granted');
      // Raw PUT to the storage provider — no Blocks headers here.
      const put = await fetch(slot.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });
      if (!put.ok) throw new Error(`Upload failed: ${put.status}`);
      return slot.fileId!;
    },
  });
}
```

## Component sketch

```tsx
// src/features/logic/components/workflow-runs-panel.tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useExecutions, usePublishNewVersion } from '../api/hooks';

export function WorkflowRunsPanel({ workflowId }: { workflowId: string }) {
  const executions = useExecutions(workflowId);
  const publish = usePublishNewVersion();

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Runs</CardTitle>
        <Button
          size="sm"
          disabled={publish.isPending}
          onClick={() => publish.mutate({ workflowId, name: `v${Date.now()}` })}
        >
          Publish draft
        </Button>
      </CardHeader>
      <CardContent>
        {executions.isPending && <p className="text-muted-foreground">Loading…</p>}
        {executions.isError && <p className="text-destructive">Failed to load executions.</p>}
        {/* GetExecutions has no documented schema — render via a validated parser,
            e.g. parseExecutions(executions.data), not by casting blindly. */}
        <pre className="max-h-64 overflow-auto text-xs">
          {JSON.stringify(executions.data, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
}
```

## Notes

- **401 / refresh**: `logicFetch` retries once after `useAuthStore.getState().refresh()`;
  the refresh call itself (`POST /iam/v4/auth/refresh`) and store shape are defined
  in `blocks-setup` — keep a single retry to avoid loops when the refresh token is dead.
- **Casing**: GET query params are PascalCase (`WorkflowId`, `ProjectKey`), JSON bodies
  camelCase. `Update` is a PUT; `Delete` endpoints use query strings, not bodies.
- **Deployment endpoints** all return `DeploymentDriverBaseApiResponse` — type the hook
  as `DeploymentDriverBaseApiResponse`, then narrow `data` per live inspection.
- **Webhook triggers** (`POST /Workflow/Webhook/{projectKey}/{workflowId}/{webhookId}`)
  are for external callers; browser apps normally don't invoke them, but the same
  `logicFetch` works for in-app test triggers via `/Workflow/webhook-test/...`.
- **Secrets**: `MailServerConfiguration.accountPassword` comes back from `/Mail/Gets`
  — never render or log it; mask in any admin UI.
