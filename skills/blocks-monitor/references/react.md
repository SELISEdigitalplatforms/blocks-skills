# React integration — blocks-monitor

Stack assumptions (matches `blocks-construct-react`): React 19, TypeScript, Vite, Tailwind,
shadcn/ui, TanStack Query v5, Zustand auth store. Env: `VITE_BLOCKS_API_URL`
(`https://api.seliseblocks.com`) and `VITE_X_BLOCKS_KEY` set in `.env` — the `x-blocks-key` is sent
by browser apps, but never put credentials or non-public secrets in `VITE_` vars.

> Observability dashboards are usually **admin-facing**. Most Log/Trace/Monitor responses have no
> schema in swagger (endpoints.md flags each) — type those as `unknown` first, inspect the live
> payload, then write a local interface. Do not guess field names.

## Types

Copy the interfaces you need from `contracts.md` into `src/features/monitor/types.ts` (they are
generated from the live swagger). Used below: `LogsByDateRequest`, `GetLogsResponse`,
`GetTracesRequest`, `GetHttpStatusAnalyticsRequest`, `SaveMonitorConfigurationRequest`,
`UpdateMonitorConfigurationRequest`, `GetUsersRequest`, `GetUsersResponse`.

## API client slice

```ts
// src/features/monitor/api.ts
import { useAuthStore } from '@/stores/auth-store'; // holds accessToken (see blocks-setup)

const MONITOR_BASE = `${import.meta.env.VITE_BLOCKS_API_URL}/monitor/v4`;

export class BlocksApiError extends Error {
  constructor(public status: number, public body: unknown) {
    super(`monitor API ${status}`);
  }
}

async function monitorFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  const res = await fetch(`${MONITOR_BASE}${path}`, {
    ...init,
    headers: {
      'x-blocks-key': import.meta.env.VITE_X_BLOCKS_KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  if (res.status === 401) {
    // refresh via POST /iam/v4/auth/refresh, then retry — see blocks-setup
    throw new BlocksApiError(401, await res.text());
  }
  if (!res.ok) throw new BlocksApiError(res.status, await res.text());
  return res.json() as Promise<T>;
}

export const post = <T>(path: string, body: unknown) =>
  monitorFetch<T>(path, { method: 'POST', body: JSON.stringify(body) });
export const get = <T>(path: string, params?: Record<string, string | number | undefined>) => {
  const qs = params
    ? '?' +
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : '';
  return monitorFetch<T>(`${path}${qs}`);
};
export const del = <T>(path: string, params?: Record<string, string>) =>
  monitorFetch<T>(`${path}?${new URLSearchParams(params).toString()}`, { method: 'DELETE' });
```

Casing warning: query-param names go through **verbatim** — `Name`, `LastDate`, `ProjectKey`,
`TraceId` (PascalCase) on Log/Trace/Iam GETs, but `monitorId`, `projectKey`, `pageNumber`,
`monitorSourcetype` (camelCase, note the lowercase `t`) on Monitor/Health. Copy each name from
`endpoints.md` — do not normalize.

## Query hooks

```ts
// src/features/monitor/hooks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { get, post, del } from './api';
import type {
  LogsByDateRequest, GetLogsResponse,
  GetTracesRequest, GetHttpStatusAnalyticsRequest,
  SaveMonitorConfigurationRequest, UpdateMonitorConfigurationRequest,
} from './types';

// projectKey = your Blocks Key — the same value the `x-blocks-key` header sends.
const BLOCKS_KEY = import.meta.env.VITE_X_BLOCKS_KEY as string;

// -- Logs -----------------------------------------------------------------

/** POST /Log/GetLogsByDate — documented envelope { data, errors, totalCount } */
export function useServiceLogs(req: Omit<LogsByDateRequest, 'projectKey'>) {
  return useQuery({
    queryKey: ['monitor', 'logs', req],
    queryFn: () =>
      post<GetLogsResponse>('/Log/GetLogsByDate', { ...req, projectKey: BLOCKS_KEY }),
    enabled: !!req.serviceName, // serviceName is required by the API
  });
}

/** GET /Log/Live — polling live tail. Response undocumented in swagger: keep `unknown`
 *  until you have inspected the live payload, then type it locally. */
export function useLiveLogs(serviceName: string, enabled: boolean) {
  const cursor = useRef<string>(new Date().toISOString());
  return useQuery({
    queryKey: ['monitor', 'live-logs', serviceName],
    queryFn: async () => {
      const data = await get<unknown>('/Log/Live', {
        Name: serviceName,           // PascalCase — required
        LastDate: cursor.current,    // advance after inspecting the live shape
        ProjectKey: BLOCKS_KEY,
      });
      // TODO after live inspection: cursor.current = newest entry timestamp from `data`
      return data;
    },
    enabled: enabled && !!serviceName,
    refetchInterval: 5_000,
    refetchIntervalInBackground: false,
  });
}

// -- Traces ---------------------------------------------------------------

/** POST /Trace/GetTraces — response undocumented in swagger */
export function useTraces(req: Omit<GetTracesRequest, 'projectKey'>) {
  return useQuery({
    queryKey: ['monitor', 'traces', req],
    queryFn: () => post<unknown>('/Trace/GetTraces', { ...req, projectKey: BLOCKS_KEY }),
  });
}

/** GET /Trace/GetTrace — response undocumented in swagger */
export function useTrace(traceId: string | undefined) {
  return useQuery({
    queryKey: ['monitor', 'trace', traceId],
    queryFn: () =>
      get<unknown>('/Trace/GetTrace', { TraceId: traceId!, ProjectKey: BLOCKS_KEY }),
    enabled: !!traceId,
  });
}

/** POST /Trace/GetServiceAnalytics — startTime/endTime required */
export function useServiceAnalytics(req: Omit<GetHttpStatusAnalyticsRequest, 'projectKey'>) {
  return useQuery({
    queryKey: ['monitor', 'service-analytics', req],
    queryFn: () =>
      post<unknown>('/Trace/GetServiceAnalytics', { ...req, projectKey: BLOCKS_KEY }),
    enabled: !!req.startTime && !!req.endTime,
  });
}

// -- Uptime monitors --------------------------------------------------------

/** GET /Monitor/GetMonitorList — camelCase query params; response undocumented */
export function useMonitors(pageNumber = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['monitor', 'monitors', pageNumber, pageSize],
    queryFn: () =>
      get<unknown>('/Monitor/GetMonitorList', {
        projectKey: BLOCKS_KEY,
        pageNumber,
        pageSize,
      }),
  });
}

/** GET /Monitor/GetIncidentList */
export function useIncidents(monitorId: string | undefined, pageNumber = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['monitor', 'incidents', monitorId, pageNumber],
    queryFn: () =>
      get<unknown>('/Monitor/GetIncidentList', { monitorId: monitorId!, pageNumber, pageSize }),
    enabled: !!monitorId,
  });
}

/** POST /Monitor/SaveMonitor + DELETE /Monitor/DeleteMonitor */
export function useSaveMonitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SaveMonitorConfigurationRequest | UpdateMonitorConfigurationRequest) =>
      post<unknown>(
        'itemId' in body && body.itemId ? '/Monitor/UpdateMonitor' : '/Monitor/SaveMonitor',
        { ...body, projectKey: BLOCKS_KEY },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['monitor', 'monitors'] }),
  });
}

export function useDeleteMonitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => del<unknown>('/Monitor/DeleteMonitor', { itemId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['monitor', 'monitors'] }),
  });
}
```

## Component sketch — logs panel with live tail

```tsx
// src/features/monitor/components/logs-panel.tsx
import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectItem } from '@/components/ui/select';
import { useServiceLogs, useLiveLogs } from '../hooks';

export function LogsPanel({ serviceName }: { serviceName: string }) {
  const [level, setLevel] = useState<string | null>(null);
  const [live, setLive] = useState(false);

  const logs = useServiceLogs({
    serviceName,
    page: 0,
    pageSize: 50,
    sort: { isDescending: true },
    filter: { level, startDate: null, endDate: null, traceId: null, spanId: null },
  });
  const liveTail = useLiveLogs(serviceName, live);

  if (logs.isError) return <p className="text-destructive">Failed to load logs.</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <Select onValueChange={(v) => setLevel(v || null)}>
          {/* level strings are not documented in swagger — populate from observed values */}
          <SelectItem value="">All levels</SelectItem>
          <SelectItem value="Error">Error</SelectItem>
        </Select>
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={live} onCheckedChange={setLive} /> Live tail
        </label>
      </div>
      <p className="text-xs text-muted-foreground">{logs.data?.totalCount ?? 0} entries</p>
      <pre className="max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs">
        {/* data items are untyped in swagger (`unknown[]`) — render raw until the shape is
            confirmed live, then map to a proper row component */}
        {JSON.stringify(live ? liveTail.data : logs.data?.data, null, 2)}
      </pre>
    </div>
  );
}
```

## Errors & token refresh

- `401` from any hook → refresh the token (`POST /iam/v4/auth/refresh`) and retry; the
  full refresh/bootstrap procedure is in **blocks-setup**. Wire it into `monitorFetch` once your
  auth store exposes a `refresh()` action.
- Documented envelopes carry failures in `errors` (`Record<string, string>`) with `isSuccess:
  false` — surface those alongside HTTP errors.
- Back-office `/Iam/*` hooks (e.g. a `useAccounts` hook wrapping `POST /Iam/GetUsers` with
  `GetUsersRequest`/`GetUsersResponse`) follow the same pattern — but they are OS-portal-grade
  admin calls needing an admin token. Never ship them in an end-user app; app auth/profile UI
  belongs to **blocks-iam**.
