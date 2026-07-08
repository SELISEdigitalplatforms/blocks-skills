# Frontend integration — file upload/download (React 19 / Vite / TanStack Query)

Targets the `blocks-construct-react` stack. The DMS upload is two steps — presign, then a binary PUT to the returned URL (with `x-ms-blob-type: BlockBlob` for Azure); **no `/Files/UploadFile`**. This wraps it in one hook. Files responses are **flat** (no `{ isSuccess, data, errors[] }` envelope) and `/Files/*` routes are PascalCase.

## Env

```bash
VITE_BLOCKS_API_URL=https://api.seliseblocks.com
VITE_BLOCKS_PROJECT_KEY=<tenant_id>   # project key = token tenant_id; sent as x-blocks-key
```

`VITE_BLOCKS_PROJECT_KEY` is the project's `tenant_id` (public identifier, safe to ship) — **not** the account login key. Access token from the auth store at runtime (`blocks-setup`).

## Files client

```ts
// src/features/files/api.ts
import { useAuthStore } from "@/stores/auth";

const BASE = `${import.meta.env.VITE_BLOCKS_API_URL}/data/v4`;
const KEY = import.meta.env.VITE_BLOCKS_PROJECT_KEY as string;

export interface PresignResponse { uploadUrl?: string; fileId?: string }
export interface FileRecord { fileId?: string; name?: string; url?: string; sizeInBytes?: number; currentVersion?: number }

// Files endpoints are flat (no ApiEnvelope) and errors is a Record<string,string>.
async function filesApi<T>(path: string, init: RequestInit = {}, _retried = false): Promise<T> {
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
    return filesApi<T>(path, init, true);
  }
  if (!res.ok) throw new Error(`Files ${res.status}`);
  return res.json() as Promise<T>;
}

export const files = {
  presign: (name: string, accessModifier: "Public" | "Private" = "Private", configurationName = "Default") =>
    filesApi<PresignResponse>(`/Files/GetPreSignedUrlForUpload`, {
      method: "POST",
      // moduleName must be an int (3 recommended); parentDirectoryId must be a string, never null ("" = root).
      body: JSON.stringify({ name, projectKey: KEY, accessModifier, configurationName, moduleName: 3, parentDirectoryId: "", tags: "", metaData: "{}" }),
    }),
  // GetFile takes FileId + ConfigurationName (PascalCase query params)
  get: (fileId: string, configurationName = "Default") =>
    filesApi<FileRecord>(`/Files/GetFile?FileId=${fileId}&ConfigurationName=${configurationName}`),
  getMany: (fileIds: string[], configurationName = "Default") =>
    filesApi<FileRecord[]>(`/Files/GetFiles`, { method: "POST", body: JSON.stringify({ fileIds, configurationName }) }),
  del: (fileId: string) =>
    filesApi<{ isSuccess?: boolean }>(`/Files/DeleteFile`, {
      method: "POST",
      body: JSON.stringify({ fileId, projectKey: KEY }),
    }),
};
```

## Upload hook (presign → binary PUT). No `/Files/UploadFile`.

```ts
// src/features/files/hooks.ts
import { useMutation } from "@tanstack/react-query";
import { files } from "./api";

const KEY = import.meta.env.VITE_BLOCKS_PROJECT_KEY as string;

// x-blocks-key rides on every request (platform rule); Azure ignores non-x-ms headers, so it's safe on the SAS PUT.
// Azure Blob also requires x-ms-blob-type — detect Azure from the upload URL host.
function providerHeaders(uploadUrl: string, contentType: string): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": contentType || "application/octet-stream", "x-blocks-key": KEY };
  if (/\.blob\.core\.windows\.net/i.test(uploadUrl)) h["x-ms-blob-type"] = "BlockBlob";
  return h;
}

export function useUploadFile() {
  return useMutation({
    mutationFn: async (file: File) => {
      const { uploadUrl, fileId } = await files.presign(file.name);
      if (!uploadUrl || !fileId) throw new Error("Presign failed");

      // Raw bytes straight to the storage provider. The URL is pre-authorized (no Bearer token),
      // but still send x-blocks-key; add x-ms-blob-type: BlockBlob for Azure.
      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: providerHeaders(uploadUrl, file.type),
        body: file, // binary
      });
      if (!put.ok) throw new Error(`Storage upload failed: ${put.status}`);

      return files.get(fileId); // GetFile confirms + returns the download url — no UploadFile step
    },
  });
}
```

## Component sketch

```tsx
import { useUploadFile } from "./hooks";

export function FileUpload() {
  const upload = useUploadFile();
  return (
    <div className="space-y-2">
      <input type="file" onChange={(e) => e.target.files?.[0] && upload.mutate(e.target.files[0])} />
      {upload.isPending && <p className="text-muted-foreground text-sm">Uploading…</p>}
      {upload.data?.url && (
        <a className="text-sm underline" href={upload.data.url} target="_blank" rel="noreferrer">
          {upload.data.name}
        </a>
      )}
    </div>
  );
}
```

To attach the file to a record, keep `upload.data.fileId` and set it on a schema field via **[blocks-data-gateway-crud](../../blocks-data-gateway-crud/references/react.md)** (e.g. `insertProduct({ ..., ImageFileId: fileId })`).
