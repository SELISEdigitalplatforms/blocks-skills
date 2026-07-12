# Frontend integration — organizations (React 19 / TanStack Query)

`GET /organizations/my` returns **the signed-in user's own organizations** — it powers an org switcher and any "pick your workspace" screen; the rest are admin screens. Auth: `x-blocks-key: <project key>` + the caller's identity. In a frontend the caller is the logged-in user, whose session is the **SSO cookie**, so requests go out with `credentials: "include"` (and `Authorization: Bearer <token>` if your app also holds a token). Remember the **non-standard envelope** (`isSuccess` + a named payload key, not `data`).

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
    credentials: "include", // send the Blocks SSO session cookie — this is what identifies the logged-in user for /organizations/my
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

## Active-org store (persist the user's selection)

Which org the user is working in should survive reloads, so keep it in a small persisted store. The active id then re-scopes the rest of your calls.

```ts
// src/stores/active-org.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ActiveOrgState { activeOrgId: string | null; setActiveOrg: (id: string) => void }

export const useActiveOrg = create<ActiveOrgState>()(
  persist(
    (set) => ({ activeOrgId: null, setActiveOrg: (id) => set({ activeOrgId: id }) }),
    { name: "blocks-active-org" },
  ),
);
```

## Hooks + org switcher

```ts
// src/features/orgs/hooks.ts
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orgs } from "./api";
import { useActiveOrg } from "@/stores/active-org";

// The signed-in user's own organizations. Cookie-based, so it resolves as soon as the
// session exists — call it after login / after the SSO callback sets the cookie.
export const useMyOrgs = () =>
  useQuery({ queryKey: ["iam", "orgs", "my"], queryFn: () => orgs.my(), select: (r) => r.organizations ?? [] });

// Loads the user's orgs and keeps a valid active selection: preselect the first org on
// first load, and reset if the stored id is no longer one the user belongs to.
export function useMyOrgsWithActive() {
  const query = useMyOrgs();
  const { activeOrgId, setActiveOrg } = useActiveOrg();
  const list = query.data ?? [];
  useEffect(() => {
    if (!list.length) return;
    const stillValid = activeOrgId && list.some((o) => o.itemId === activeOrgId);
    if (!stillValid) setActiveOrg(list[0].itemId);
  }, [list, activeOrgId, setActiveOrg]);
  return { ...query, orgs: list, activeOrgId, setActiveOrg };
}

export const useOrgConfig = () =>
  useQuery({ queryKey: ["iam", "orgs", "config"], queryFn: () => orgs.getConfig() });

export function useSetOrgConfig() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: orgs.setConfig, onSuccess: () => qc.invalidateQueries({ queryKey: ["iam", "orgs", "config"] }) });
}
```

```tsx
// src/features/orgs/org-switcher.tsx — a complete "my organizations" control
import { useMyOrgsWithActive } from "./hooks";

export function OrgSwitcher() {
  const { orgs, activeOrgId, setActiveOrg, isPending, isError } = useMyOrgsWithActive();

  if (isPending) return <span className="text-muted-foreground text-sm">Loading organizations…</span>;
  if (isError) return <span className="text-destructive text-sm">Couldn't load your organizations</span>;
  if (orgs.length === 0) return <span className="text-muted-foreground text-sm">You're not a member of any organization</span>;
  if (orgs.length === 1) return <span className="text-sm font-medium">{orgs[0].name}</span>; // single org: no picker needed

  return (
    <select
      className="rounded border p-2"
      value={activeOrgId ?? ""}
      onChange={(e) => setActiveOrg(e.target.value)} // re-scope subsequent calls to the picked org
    >
      {orgs.map((o) => <option key={o.itemId} value={o.itemId}>{o.name}</option>)}
    </select>
  );
}
```

## Notes

- **`/organizations/my` = the logged-in user's orgs.** It reads the caller's identity from the SSO session cookie, so send `credentials: "include"` and call it only once the user is authenticated (after login / after the SSO callback — check auth with `GET /iam/me`, see **blocks-iam-users**). A 401 means the session isn't there yet; route to login rather than showing an empty list.
- **Persist the active org and preselect a valid one.** `useMyOrgsWithActive` defaults to the first org and self-heals if the stored id disappears; skip the dropdown entirely when the user has a single org.
- **Read the right key:** `organizations` (list/my), `organization` (get-by-id), `itemId` (create) — not `data`. `/my` items are lightweight (`itemId`, `name`, `createdDate`); fetch the full org with `orgs.get(id)` when you need branding/addresses/etc.
- **List is GET + query params** (`Page`, `PageSize`, `Sort.*`, `Filter.*`); config GET returns a **flat** object with no envelope.
- Switching the active org typically means re-scoping subsequent calls (and possibly re-impersonating in admin tooling) to that org — read `activeOrgId` from the store wherever you build requests.
- `isMultiOrgEnabled` (from config) gates whether more than one org is meaningful; hide org-creation UI when the relevant `allowOrgCreationFrom*` flag is false.
