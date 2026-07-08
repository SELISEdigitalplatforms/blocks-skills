# Frontend integration — organizations (React 19 / TanStack Query)

`GET /organizations/my` powers an org switcher; the rest are admin screens. Auth: `x-blocks-key: <project key>` + `Authorization: Bearer <token>`. Remember the **non-standard envelope** (`isSuccess` + a named payload key, not `data`).

## Client

```ts
// src/features/orgs/api.ts
import { useAuthStore } from "@/stores/auth";

const IAM = `${import.meta.env.VITE_BLOCKS_API_URL}/iam/v4/iam`;
const KEY = import.meta.env.VITE_BLOCKS_PROJECT_KEY as string;

export interface Organization {
  itemId: string; name: string; description?: string; shortCode?: string; isEnabled?: boolean;
  email?: string; websiteUrl?: string; industry?: string; timeZone?: string; currency?: string;
  logoUrl?: string; theme?: { primaryColor?: string; secondaryColor?: string; tertiaryColor?: string };
  defaultRoleForMembers?: string[]; addresses?: Array<Record<string, unknown>>; createdDate?: string;
}
export interface OrgConfig {
  allowOrgCreationFromCloud: boolean; allowOrgCreationFromConstruct: boolean;
  allowOrgCreationFromSignup: boolean; allowOrgCreationFromPortal: boolean;
  isMultiOrgEnabled: boolean; consentForMultiOrgEnable: boolean; itemId?: string;
}

async function iam<T>(path: string, init: RequestInit = {}, _retried = false): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  const res = await fetch(`${IAM}${path}`, {
    ...init,
    headers: {
      "x-blocks-key": KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  if (res.status === 401 && !_retried) { await useAuthStore.getState().refreshSession(); return iam<T>(path, init, true); }
  if (!res.ok) throw new Error(`iam ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

type Env<K extends string, T> = { isSuccess: boolean; errors?: unknown } & { [P in K]?: T };

export const orgs = {
  // list is a GET with query params
  list: (params: Record<string, string | number | boolean> = {}) => {
    const qs = new URLSearchParams({ Page: "0", PageSize: "20", ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) });
    return iam<Env<"organizations", Organization[]>>(`/organizations?${qs}`);
  },
  my: () => iam<Env<"organizations", Organization[]>>(`/organizations/my`),
  get: (id: string) => iam<Env<"organization", Organization>>(`/organizations/${id}`),
  create: (body: object) => iam<Env<"itemId", string>>(`/organizations/create`, { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: object) => iam<Env<never, never>>(`/organizations/${id}`, { method: "POST", body: JSON.stringify(body) }),
  getConfig: () => iam<OrgConfig>(`/organizations/config`),               // flat, no envelope
  setConfig: (cfg: OrgConfig) => iam<{ isSuccess: boolean }>(`/organizations/config`, { method: "POST", body: JSON.stringify(cfg) }),
};
```

## Hooks + org switcher

```ts
// src/features/orgs/hooks.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orgs } from "./api";

export const useMyOrgs = () =>
  useQuery({ queryKey: ["iam", "orgs", "my"], queryFn: () => orgs.my(), select: (r) => r.organizations ?? [] });

export const useOrgConfig = () =>
  useQuery({ queryKey: ["iam", "orgs", "config"], queryFn: () => orgs.getConfig() });

export function useSetOrgConfig() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: orgs.setConfig, onSuccess: () => qc.invalidateQueries({ queryKey: ["iam", "orgs", "config"] }) });
}
```

```tsx
// org switcher
import { useMyOrgs } from "./hooks";

export function OrgSwitcher({ onPick }: { onPick: (id: string) => void }) {
  const { data: myOrgs = [] } = useMyOrgs();
  return (
    <select className="rounded border p-2" onChange={(e) => onPick(e.target.value)}>
      {myOrgs.map((o) => <option key={o.itemId} value={o.itemId}>{o.name}</option>)}
    </select>
  );
}
```

## Notes

- **Read the right key:** `organizations` (list/my), `organization` (get-by-id), `itemId` (create) — not `data`.
- **List is GET + query params** (`Page`, `PageSize`, `Sort.*`, `Filter.*`); config GET returns a **flat** object with no envelope.
- Switching the active org typically means re-scoping subsequent calls (and possibly re-impersonating in admin tooling) to that org — wire `onPick` into wherever you hold the active-org id.
- `isMultiOrgEnabled` (from config) gates whether more than one org is meaningful; hide org-creation UI when the relevant `allowOrgCreationFrom*` flag is false.
