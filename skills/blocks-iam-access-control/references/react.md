# Frontend integration — permissions & roles (React 19 / TanStack Query)

Admin-screen wiring for RBAC. Same auth as the rest of IAM: `x-blocks-key: <project key>` + `Authorization: Bearer <token>` (the signed-in admin's token, or an impersonated project token in tooling).

## Env & client

```bash
VITE_BLOCKS_API_URL=https://api.seliseblocks.com
VITE_BLOCKS_PROJECT_KEY=<project tenant id>
```

```ts
// src/features/rbac/api.ts
import { useAuthStore } from "@/stores/auth";

const IAM = `${import.meta.env.VITE_BLOCKS_API_URL}/iam/v4/iam`;
const KEY = import.meta.env.VITE_BLOCKS_PROJECT_KEY as string;

export interface Paged<T> { totalCount: number; data: T[]; errors?: unknown }
export interface Permission { itemId: string; name: string; type: number; resource: string; resourceGroup: string; permissionSeverity: number; isBuiltIn: boolean; isArchived: boolean; roles: string[]; description: string }
export interface Role { itemId: string; name: string; slug: string; parentRoleSlug: string | null; ancestorRoleSlugs: string[]; canCreateOwn: boolean; description: string; count: number; createdFromDefault: boolean }

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

type PageReq = { page?: number; pageSize?: number; sort?: { property: string; isDescending: boolean }; filter?: Record<string, unknown>; roles?: string[] };

export const rbac = {
  // Lists are POST with a page/filter body
  listPermissions: (body: PageReq = {}) => iam<Paged<Permission>>(`/permissions`, { method: "POST", body: JSON.stringify({ page: 0, pageSize: 20, ...body }) }),
  getPermission: (id: string) => iam<{ data: Permission }>(`/permissions/${id}`),
  createPermission: (body: object) => iam(`/permissions/create`, { method: "POST", body: JSON.stringify(body) }),
  updatePermission: (id: string, body: object) => iam(`/permissions/${id}`, { method: "POST", body: JSON.stringify({ ...body, itemId: id }) }),

  listRoles: (body: PageReq = {}) => iam<Paged<Role>>(`/roles`, { method: "POST", body: JSON.stringify({ page: 0, pageSize: 20, ...body }) }),
  getRole: (id: string) => iam<{ data: Role }>(`/roles/${id}`),
  createRole: (body: object) => iam(`/roles/create`, { method: "POST", body: JSON.stringify(body) }),
  updateRole: (body: object) => iam(`/roles/update`, { method: "POST", body: JSON.stringify(body) }),
  // Add/remove by role slug; permissions identified by name
  assignPermissions: (slug: string, addPermissions: string[], removePermissions: string[] = []) =>
    iam(`/roles/assign-permissions`, { method: "POST", body: JSON.stringify({ slug, addPermissions, removePermissions }) }),
};
```

## Hooks

```ts
// src/features/rbac/hooks.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rbac } from "./api";

export const useRoles = (search = "") =>
  useQuery({ queryKey: ["rbac", "roles", search], queryFn: () => rbac.listRoles({ filter: { search } }) });

export const usePermissions = (search = "") =>
  useQuery({ queryKey: ["rbac", "permissions", search], queryFn: () => rbac.listPermissions({ filter: { search } }) });

export function useAssignPermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, add, remove }: { slug: string; add: string[]; remove?: string[] }) =>
      rbac.assignPermissions(slug, add, remove ?? []),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rbac", "roles"] }); qc.invalidateQueries({ queryKey: ["rbac", "permissions"] }); },
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: rbac.createRole, onSuccess: () => qc.invalidateQueries({ queryKey: ["rbac", "roles"] }) });
}
```

## Notes

- **Lists are POST** — pass `{ page, pageSize, sort, filter }`; read `totalCount` + `data`.
- **Assign by role `slug`, permissions by `name`.** `assignPermissions` adds and removes in one call and is not a full replace — send only the deltas.
- Gate these screens on the admin's own permissions; a frontend call runs with the signed-in user's rights.
- `type` / `permissionSeverity` are numeric enums — render them via a lookup you confirm against the portal, not guessed labels.
