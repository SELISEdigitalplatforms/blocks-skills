# Frontend integration — schema admin (React 19 / Vite / TanStack Query)

Targets the `blocks-construct-react` stack. For most apps schema configuration is done in the Blocks portal, not in app code — reach for this only when you're building an admin surface that manages schemas at runtime. To *use* the resulting data, see **[blocks-data-gateway-crud](../../blocks-data-gateway-crud/references/react.md)**.

## Env

```bash
# .env — client-safe only, Vite-prefixed
VITE_BLOCKS_API_URL=https://api.seliseblocks.com
VITE_BLOCKS_PROJECT_KEY=<tenant_id>   # project key = token tenant_id; sent as x-blocks-key
```

`VITE_BLOCKS_PROJECT_KEY` is the project's `tenant_id` (what the portal exposes as `BLOCKS_X_BLOCKS_KEY`) — a public project identifier, safe to ship. **Not** the account login key. The access token comes from the auth store at runtime (`blocks-setup` / `blocks-iam`).

## Admin client slice

Admin endpoints return the envelope `{ isSuccess, message, httpStatusCode, data, errors }`; mutations put `ActionResponse { acknowledged, itemId, totalImpactedData, message }` in `data`. Base is `${VITE_BLOCKS_API_URL}/data/v4` (no `/api`).

```ts
// src/features/data-admin/api.ts
import { useAuthStore } from "@/stores/auth";

const BASE = `${import.meta.env.VITE_BLOCKS_API_URL}/data/v4`;
const KEY = import.meta.env.VITE_BLOCKS_PROJECT_KEY as string;

export interface ApiEnvelope<T> {
  isSuccess?: boolean;
  message?: string | null;
  httpStatusCode?: number;
  data?: T;
  errors?: Array<{ propertyName?: string; errorMessage?: string }>;
}
export interface ActionResponse {
  acknowledged?: boolean;
  itemId?: string | null;
  totalImpactedData?: number;
  message?: string | null;
}
export interface SchemaSummary {
  id: string;
  schemaName: string;
  collectionName: string;
  schemaType: number;
  querySchema: string;        // -> get<querySchema> for reads
  mutationSchemas: string[];  // exact insert/update/delete names
  fields?: Array<{ name: string; type: string; isArray: boolean; isPIIData: boolean; isUniqueData: boolean }>;
}

async function admin<T>(path: string, init: RequestInit = {}, _retried = false): Promise<ApiEnvelope<T>> {
  const token = useAuthStore.getState().accessToken;
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "x-blocks-key": KEY, // = tenant_id
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  if (res.status === 401 && !_retried) {
    await useAuthStore.getState().refreshSession();
    return admin<T>(path, init, true);
  }
  return (await res.json()) as ApiEnvelope<T>;
}

const withKey = (body: object) => JSON.stringify({ ...body, projectKey: KEY });

export const dataAdmin = {
  listSchemas: (keyword = "") =>
    admin<{ totalCount: number; items: SchemaSummary[] }>(
      `/schemas?ProjectKey=${KEY}&Keyword=${encodeURIComponent(keyword)}&PageNo=1&PageSize=50`,
    ),
  getSchema: (id: string) => admin<SchemaSummary>(`/schemas/get-by-id?id=${id}&projectKey=${KEY}`),
  defineSchema: (body: object) => admin<ActionResponse>(`/schemas/define`, { method: "POST", body: withKey(body) }),
  saveFields: (body: object) => admin<ActionResponse>(`/schemas/fields`, { method: "POST", body: withKey(body) }),
  createValidation: (body: object) => admin<ActionResponse>(`/data-validations`, { method: "POST", body: withKey(body) }),
  changeAccess: (body: object) => admin<ActionResponse>(`/data-access/security/change`, { method: "POST", body: withKey(body) }),
  // Every schema/field/validation/access edit is STAGED until this runs:
  reload: () => admin<boolean>(`/schema-configurations/reload`, { method: "POST" }),
};
```

## TanStack Query hooks

```ts
// src/features/data-admin/hooks.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dataAdmin } from "./api";

export function useSchemas(keyword = "") {
  return useQuery({
    queryKey: ["data-admin", "schemas", keyword],
    queryFn: () => dataAdmin.listSchemas(keyword),
    select: (env) => env.data, // { totalCount, items }
  });
}

export function useReload() {
  return useMutation({ mutationFn: dataAdmin.reload });
}

// Create-then-reload: staged changes aren't live until reload succeeds.
export function useDefineSchema() {
  const qc = useQueryClient();
  const reload = useReload();
  return useMutation({
    mutationFn: dataAdmin.defineSchema,
    onSuccess: async () => {
      await reload.mutateAsync();
      qc.invalidateQueries({ queryKey: ["data-admin", "schemas"] });
    },
  });
}
```

Request-body shapes for `defineSchema` / `saveFields` / `createValidation` / `changeAccess` are in [../flows/configure-schema.md](../flows/configure-schema.md). After any of them, **always reload** — the gateway (and the CRUD hooks in blocks-data-gateway-crud) won't see the change until it succeeds.

## Error handling

- `ApiEnvelope.errors` on 400 is a `ValidationFailure[]`; a `ProblemDetails { title, status, detail }` shows up on some 400/404s — branch on `errors` vs `detail`.
- 401 → wrong `x-blocks-key` (must be tenant_id) or expired token; the client above refreshes-then-retries once.
