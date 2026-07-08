# Frontend integration — GraphQL CRUD (React 19 / Vite / TanStack Query)

Targets the `blocks-construct-react` stack (React 19 + TS + Vite + Tailwind + shadcn/ui + TanStack Query + Zustand). A tiny gateway client plus per-schema query/mutation hooks. The schema must already be created + reloaded via **[blocks-data-gateway-configuration](../../blocks-data-gateway-configuration/SKILL.md)**.

## Env

```bash
# .env — client-safe only, Vite-prefixed
VITE_BLOCKS_API_URL=https://api.seliseblocks.com
VITE_BLOCKS_PROJECT_KEY=<tenant_id>   # project key = token tenant_id; sent as x-blocks-key
```

`VITE_BLOCKS_PROJECT_KEY` is the project's `tenant_id` (what the portal exposes as `BLOCKS_X_BLOCKS_KEY`) — a public project identifier, safe to ship. **Not** the account login key. Never put passwords or the account secret in `VITE_` vars. The access token comes from the auth store at runtime (`blocks-setup` / `blocks-iam`).

## Gateway client

One function; no Apollo/urql needed (the gateway is a single POST endpoint). Add them if you want normalized caching or codegen.

```ts
// src/features/data/gateway.ts
import { useAuthStore } from "@/stores/auth"; // Zustand store: accessToken + refreshSession()

const GATEWAY = `${import.meta.env.VITE_BLOCKS_API_URL}/data/v4/gateway`;
const PROJECT_KEY = import.meta.env.VITE_BLOCKS_PROJECT_KEY as string;

export interface ActionResponse {
  acknowledged: boolean;
  itemId?: string | null;
  totalImpactedData: number;
  message?: string | null;
}
export interface GqlResult<T> {
  items: T[];
  totalCount: number;
  pageNo: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
export class GraphQLError extends Error {
  constructor(public errors: Array<{ message: string }>) {
    super(errors.map((e) => e.message).join("; "));
  }
}

export async function gql<T>(
  query: string,
  variables: Record<string, unknown> = {},
  _retried = false,
): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-blocks-key": PROJECT_KEY, // = tenant_id, on every gateway call
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  if (res.status === 401 && !_retried) {
    await useAuthStore.getState().refreshSession(); // refresh-then-retry once
    return gql<T>(query, variables, true);
  }
  const body = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (body.errors?.length) throw new GraphQLError(body.errors);
  if (!body.data) throw new Error(`Gateway ${res.status}: empty response`);
  return body.data;
}
```

## Per-schema CRUD hooks

Derive the operation names from the schema's `querySchema` / `mutationSchemas` (see [../flows/graphql-crud.md](../flows/graphql-crud.md)) — don't hand-pluralize. This factory captures the pattern once; instantiate per schema.

```ts
// src/features/data/make-crud.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gql, type ActionResponse, type GqlResult } from "./gateway";

interface CrudNames {
  query: string;      // "getProducts"      (from `get` + querySchema)
  insert: string;     // "insertProduct"    (from mutationSchemas)
  update: string;     // "updateProduct"
  remove: string;     // "deleteProduct"
  filterType: string; // "ProductFilterInput"
  sortType: string;   // "ProductSortInput"
  insertType: string; // "ProductInsertInput"
  updateType: string; // "ProductUpdateInput"
}

export function makeCrud<TRecord, TInsert, TUpdate>(n: CrudNames, fieldSelection: string) {
  function useList(vars: { where?: unknown; paging?: { pageNo: number; pageSize: number }; order?: unknown } = {}) {
    return useQuery({
      queryKey: ["data", n.query, vars],
      queryFn: () =>
        gql<Record<string, GqlResult<TRecord>>>(
          `query($where:${n.filterType},$paging:PaginationInput,$order:[${n.sortType}!]){
             ${n.query}(where:$where,paging:$paging,order:$order){
               totalCount pageNo pageSize totalPages hasNextPage hasPreviousPage
               items { ${fieldSelection} }
             }
           }`,
          vars,
        ).then((d) => d[n.query]),
    });
  }

  function useCreate() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (input: TInsert) =>
        gql<Record<string, ActionResponse>>(
          `mutation($input:${n.insertType}!){ ${n.insert}(input:$input){ acknowledged itemId totalImpactedData message } }`,
          { input },
        ).then((d) => d[n.insert]),
      onSuccess: () => qc.invalidateQueries({ queryKey: ["data", n.query] }),
    });
  }

  function useUpdate() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (v: { where: unknown; input: TUpdate }) =>
        gql<Record<string, ActionResponse>>(
          `mutation($where:${n.filterType},$input:${n.updateType}!){ ${n.update}(where:$where,input:$input){ acknowledged totalImpactedData message } }`,
          v,
        ).then((d) => d[n.update]),
      onSuccess: () => qc.invalidateQueries({ queryKey: ["data", n.query] }),
    });
  }

  function useDelete() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (where: unknown) =>
        gql<Record<string, ActionResponse>>(
          `mutation($where:${n.filterType}){ ${n.remove}(where:$where){ acknowledged totalImpactedData message } }`,
          { where },
        ).then((d) => d[n.remove]),
      onSuccess: () => qc.invalidateQueries({ queryKey: ["data", n.query] }),
    });
  }

  return { useList, useCreate, useUpdate, useDelete };
}
```

## Instantiate for a schema

```ts
// src/features/products/api.ts
import { makeCrud } from "@/features/data/make-crud";

export interface Product { ItemId: string; Title: string; Price: number; Sku: string }
export type ProductInsert = { Title: string; Price: number; Sku: string };
export type ProductUpdate = Partial<ProductInsert>;

export const productsCrud = makeCrud<Product, ProductInsert, ProductUpdate>(
  {
    query: "getProducts", insert: "insertProduct", update: "updateProduct", remove: "deleteProduct",
    filterType: "ProductFilterInput", sortType: "ProductSortInput",
    insertType: "ProductInsertInput", updateType: "ProductUpdateInput",
  },
  "ItemId Title Price Sku",
);
```

## Component sketch

```tsx
// src/features/products/product-list.tsx
import { productsCrud } from "./api";

export function ProductList() {
  const { data, isPending } = productsCrud.useList({ paging: { pageNo: 1, pageSize: 20 } });
  const create = productsCrud.useCreate();
  const remove = productsCrud.useDelete();

  if (isPending) return <p className="text-muted-foreground text-sm">Loading…</p>;
  return (
    <div className="space-y-3">
      <button className="rounded bg-primary px-3 py-1.5 text-primary-foreground" disabled={create.isPending}
        onClick={() => create.mutate({ Title: "New product", Price: 0, Sku: `SKU-${Date.now()}` })}>
        Add product
      </button>
      <ul className="divide-y rounded-md border">
        {data?.items.map((p) => (
          <li key={p.ItemId} className="flex items-center justify-between p-3">
            <span>{p.Title} — {p.Price}</span>
            <button className="text-sm text-destructive" onClick={() => remove.mutate({ ItemId: { eq: p.ItemId } })}>
              Delete
            </button>
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground text-xs">{data?.totalCount} total</p>
    </div>
  );
}
```

## Notes

- `where` is a generated `<Schema>FilterInput` — per-field operators `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `contains`, `in`, plus `and`/`or`. Omit to fetch all.
- After schema/field/validation/access edits in blocks-data-gateway-configuration, a **reload** must run or the gateway (and these hooks) won't see the change.
- GraphQL errors surface as `GraphQLError` (from the `{ errors: [...] }` body); `Field 'getX' does not exist` → schema not reloaded, or name hand-derived instead of read from `querySchema`/`mutationSchemas`.
