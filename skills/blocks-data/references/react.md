# React integration — blocks-data

Targets the `blocks-construct-react` stack: React 19 + TypeScript + Vite + Tailwind + shadcn/ui + TanStack Query + Zustand. This guide wires the data service (`/data/v4`) into that stack: a typed fetch slice, query/mutation hooks for the highest-value endpoints, and a component sketch.

Env (`.env`) — client-safe values only, prefixed for Vite:

```bash
VITE_BLOCKS_API_URL=https://api.seliseblocks.com
VITE_X_BLOCKS_KEY=<your x-blocks-key>
```

These are the only two Vite vars. Where API payloads or queries need a `projectKey`, **projectKey = your Blocks Key** — reuse `VITE_X_BLOCKS_KEY`; there is no separate env var. Never put passwords or non-public secrets in `VITE_` vars. Tokens come from the auth store at runtime (login/refresh flows: **blocks-setup** / **blocks-iam**).

## Types

`contracts.md` is generated documentation, not an importable module — copy the interfaces you need into `src/features/data/types.ts`. Response envelopes are generated as per-payload `…Of…` interfaces (`ServiceResponseOfSchemaDefinitionResponse`, `PaginationResponseOfDataValidationResponse`, …); instead of copying each one, use a single local generic that mirrors the documented response shape:

```ts
// src/features/data/types.ts
// Copied from blocks-data contracts.md (keep in sync when the swagger regenerates)

export interface ApiEnvelope<T> {
  isSuccess?: boolean;
  message?: string | null;
  httpStatusCode?: number;
  data?: T;
  errors?: ValidationFailure[];
}

export interface ValidationFailure {
  propertyName?: string | null;
  errorMessage?: string | null;
  attemptedValue?: unknown | null;
  severity?: 0 | 1 | 2;
  errorCode?: string | null;
}

export interface ActionResponse {
  acknowledged?: boolean;
  itemId?: string | null;
  totalImpactedData?: number;
  message?: string | null;
}

// Copy these from contracts.md verbatim:
// SchemaDefinitionResponse, FieldDefinitionRequest, CreateSchemaDefinitionRequest,
// SaveFieldDefinitionRequest, DataValidationResponse, CreateDataValidationRequest,
// GetPreSignedUrlForUploadRequest, GetPreSignedUrlForUploadResponse,
// GetFilesInfoRequest, GetFilesInfoResponse, FileResponse
```

## API client slice

```ts
// src/features/data/api.ts
import { useAuthStore } from "@/stores/auth"; // Zustand store holding accessToken (see blocks-setup)
import type {
  ApiEnvelope,
  ActionResponse,
  SchemaDefinitionResponse,
  CreateSchemaDefinitionRequest,
  SaveFieldDefinitionRequest,
  DataValidationResponse,
  CreateDataValidationRequest,
  GetPreSignedUrlForUploadRequest,
  GetPreSignedUrlForUploadResponse,
  GetFilesInfoRequest,
  GetFilesInfoResponse,
  FileResponse,
} from "./types";

const BASE = `${import.meta.env.VITE_BLOCKS_API_URL}/data/v4`;

export class DataApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`data/v4 request failed with ${status}`);
  }
}

async function dataFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "x-blocks-key": import.meta.env.VITE_X_BLOCKS_KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  if (res.status === 401) {
    // Delegate refresh-then-retry to the shared auth helper (blocks-setup skill).
    await useAuthStore.getState().refreshSession();
    return dataFetch<T>(path, init);
  }
  if (!res.ok) throw new DataApiError(res.status, await res.json().catch(() => null));
  return res.json() as Promise<T>;
}

// projectKey = your Blocks Key (same value as the x-blocks-key header).
const X_BLOCKS_KEY = import.meta.env.VITE_X_BLOCKS_KEY;
const qs = (params: Record<string, string | number | boolean | undefined>) =>
  "?" +
  new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)]),
  ).toString();

export const dataApi = {
  // Schema — note the PascalCase query params on list endpoints
  listSchemas: (opts: { keyword?: string; pageNo?: number; pageSize?: number } = {}) =>
    dataFetch<ApiEnvelope<{ totalCount?: number; items?: SchemaDefinitionResponse[] }>>(
      `/api/schemas${qs({
        ProjectKey: X_BLOCKS_KEY,
        Keyword: opts.keyword,
        PageNo: opts.pageNo ?? 1,
        PageSize: opts.pageSize ?? 20,
      })}`,
    ),

  getSchemaById: (id: string) =>
    dataFetch<ApiEnvelope<SchemaDefinitionResponse>>(
      `/api/schemas/get-by-id${qs({ id, projectKey: X_BLOCKS_KEY })}`,
    ),

  defineSchema: (body: CreateSchemaDefinitionRequest) =>
    dataFetch<ApiEnvelope<ActionResponse>>(`/api/schemas/define`, {
      method: "POST",
      body: JSON.stringify({ ...body, projectKey: X_BLOCKS_KEY }),
    }),

  saveFields: (body: SaveFieldDefinitionRequest) =>
    dataFetch<ApiEnvelope<ActionResponse>>(`/api/schemas/fields`, {
      method: "POST",
      body: JSON.stringify({ ...body, projectKey: X_BLOCKS_KEY }),
    }),

  reloadConfigurations: () =>
    dataFetch<ApiEnvelope<boolean>>(`/api/schema-configurations/reload`, { method: "POST" }),

  // Validations
  validationsBySchema: (schemaId: string) =>
    dataFetch<ApiEnvelope<DataValidationResponse[]>>(
      `/api/data-validations/by-schema-id${qs({ schemaId, projectKey: X_BLOCKS_KEY })}`,
    ),

  createValidation: (body: CreateDataValidationRequest) =>
    dataFetch<ApiEnvelope<ActionResponse>>(`/api/data-validations`, {
      method: "POST",
      body: JSON.stringify({ ...body, projectKey: X_BLOCKS_KEY }),
    }),

  // Files / DMS — flat responses, NOT the ApiEnvelope
  getPresignedUploadUrl: (body: GetPreSignedUrlForUploadRequest) =>
    dataFetch<GetPreSignedUrlForUploadResponse>(`/api/Files/GetPreSignedUrlForUpload`, {
      method: "POST",
      body: JSON.stringify({ ...body, projectKey: X_BLOCKS_KEY }),
    }),

  getFile: (fileId: string) =>
    dataFetch<FileResponse>(`/api/Files/GetFile${qs({ FileId: fileId, ProjectKey: X_BLOCKS_KEY })}`),

  getFilesInfo: (body: Omit<GetFilesInfoRequest, "projectKey">) =>
    dataFetch<GetFilesInfoResponse>(`/api/Files/GetFilesInfo`, {
      method: "POST",
      body: JSON.stringify({ ...body, projectKey: X_BLOCKS_KEY }),
    }),
};
```

## TanStack Query hooks

```ts
// src/features/data/hooks.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dataApi } from "./api";

const keys = {
  schemas: (keyword?: string) => ["data", "schemas", keyword ?? ""] as const,
  schema: (id: string) => ["data", "schema", id] as const,
  validations: (schemaId: string) => ["data", "validations", schemaId] as const,
  files: (page: number) => ["data", "files", page] as const,
};

export function useSchemas(keyword?: string) {
  return useQuery({
    queryKey: keys.schemas(keyword),
    queryFn: () => dataApi.listSchemas({ keyword }),
    select: (env) => env.data, // { totalCount, items }
  });
}

export function useSchema(id: string) {
  return useQuery({
    queryKey: keys.schema(id),
    queryFn: () => dataApi.getSchemaById(id),
    select: (env) => env.data,
    enabled: !!id,
  });
}

export function useDefineSchema() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: dataApi.defineSchema,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["data", "schemas"] }),
  });
}

export function useSaveFields(schemaId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: dataApi.saveFields,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.schema(schemaId) });
      qc.invalidateQueries({ queryKey: ["data", "schemas"] });
    },
  });
}

// Schema/field/validation changes are staged until this runs (see flows/*).
export function useReloadConfigurations() {
  return useMutation({ mutationFn: dataApi.reloadConfigurations });
}

export function useValidations(schemaId: string) {
  return useQuery({
    queryKey: keys.validations(schemaId),
    queryFn: () => dataApi.validationsBySchema(schemaId),
    select: (env) => env.data ?? [],
    enabled: !!schemaId,
  });
}

// Full upload pipeline: presign -> PUT bytes to storage -> confirm via GetFile.
export function useUploadFile() {
  return useMutation({
    mutationFn: async (file: File) => {
      const presign = await dataApi.getPresignedUploadUrl({
        name: file.name,
        accessModifier: "Private",
        metaData: "{}",
        tags: "",
      });
      if (!presign.uploadUrl || !presign.fileId) throw new Error("Presign failed");
      const put = await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!put.ok) throw new Error(`Storage upload failed: ${put.status}`);
      return dataApi.getFile(presign.fileId); // confirm registration + get download url
    },
  });
}
```

## Component sketch

```tsx
// src/features/data/components/schema-panel.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSchemas, useDefineSchema, useReloadConfigurations } from "../hooks";

export function SchemaPanel() {
  const [keyword, setKeyword] = useState("");
  const { data, isPending } = useSchemas(keyword);
  const define = useDefineSchema();
  const reload = useReloadConfigurations();

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder="Search schemas…" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        <Button
          variant="outline"
          disabled={reload.isPending}
          onClick={() => reload.mutate()}
        >
          {reload.isPending ? "Reloading…" : "Reload runtime"}
        </Button>
      </div>

      {isPending ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {data?.items?.map((s) => (
            <li key={s.id} className="flex items-center justify-between p-3">
              <div>
                <p className="font-medium">{s.schemaName}</p>
                <p className="text-muted-foreground text-xs">
                  {s.collectionName} · {s.fields?.length ?? 0} fields
                </p>
              </div>
              <span className="text-xs">{s.totalReadPolicies ?? 0} read policies</span>
            </li>
          ))}
        </ul>
      )}

      <Button
        disabled={define.isPending}
        onClick={() =>
          define.mutate(
            {
              schemaName: "Product",
              collectionName: "sb_product",
              schemaType: 1,
              fields: [{ name: "title", type: "String", isPIIData: false, isUniqueData: false }],
            },
            { onSuccess: () => reload.mutate() }, // changes are staged until reload
          )
        }
      >
        Create Product schema
      </Button>
    </div>
  );
}
```

## Error and session handling

- `DataApiError.body` for data endpoints is either the standard envelope (`errors: ValidationFailure[]`) or a `ProblemDetails` on 400/404 — branch on the presence of `errors` vs `detail`. Files/DMS endpoints return `errors` as a `Record<string, string>` instead.
- 401 handling above delegates to the auth store's refresh flow — implement it once per the **blocks-setup** skill (login `POST /iam/v4/api/auth/login`, refresh `POST /iam/v4/api/auth/refresh`) rather than per service.
- After any mutation that touches schemas, fields, validations, or policies, surface a "reload required" affordance (or auto-run `useReloadConfigurations`) — the runtime does not see staged changes until the reload succeeds.
