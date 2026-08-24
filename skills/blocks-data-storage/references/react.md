# React integration

Use `@seliseblocks/client` as the transport and TanStack Query for server state. Do not reproduce storage routes, token refresh, or Blocks headers in feature components.

## Shared client

```ts
// src/lib/blocks-client.ts
import { createBlocksClient } from "@seliseblocks/client";

export const blocksClient = createBlocksClient({
  apiUrl: import.meta.env.VITE_BLOCKS_API_URL,
  xBlocksKey: import.meta.env.VITE_BLOCKS_PROJECT_KEY,
});
```

`xBlocksKey` is the runtime project tenant key. The SDK sends it with session cookies to Blocks APIs and deliberately omits both from external pre-signed URL uploads. For an intentionally Bearer-based runtime, supply the caller-owned `accessToken` callback; the SDK does not store or refresh tokens.

## Upload hook

```ts
// src/features/storage/use-upload-file.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { blocksClient } from "@/lib/blocks-client";

type PresignResult = {
  uploadUrl?: string;
  fileId?: string;
  isSuccess?: boolean;
  errors?: Record<string, string>;
};

function readPresign(value: unknown): Required<Pick<PresignResult, "uploadUrl" | "fileId">> {
  if (!value || typeof value !== "object") throw new Error("Upload was not prepared");
  const result = value as PresignResult;
  if (result.isSuccess === false || !result.uploadUrl || !result.fileId) {
    throw new Error(Object.values(result.errors ?? {})[0] ?? "Upload was not prepared");
  }
  return { uploadUrl: result.uploadUrl, fileId: result.fileId };
}

export function useUploadFile(parentDirectoryId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const prepared = readPresign(
        await blocksClient.data.files.presignedUploadUrl({
          name: file.name,
          contentType: file.type,
          accessModifier: "Private",
          configurationName: "Default",
          moduleName: 8,
          parentDirectoryId,
          tags: "",
          metaData: "{}",
        }),
      );

      await blocksClient.data.files.uploadToUrl({
        url: prepared.uploadUrl,
        body: file,
        contentType: file.type || "application/octet-stream",
      });

      return blocksClient.data.files.get(prepared.fileId, {
        configurationName: "Default",
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["storage", "objects", parentDirectoryId] });
    },
  });
}
```

The pre-sign operation creates metadata before the provider PUT. If the PUT fails, show a retry state and treat the file object as potentially incomplete. Never attach `Authorization`, cookies, or `x-blocks-key` to `uploadUrl` yourself.

`uploadToUrl` currently supplies Azure's `x-ms-blob-type` header by default. If the selected storage configuration is not Azure and its signed policy rejects that header, perform a plain provider PUT with only that provider's prescribed headers. It still must not carry Blocks credentials.

## Object browser hook

```ts
// src/features/storage/use-storage-objects.ts
import { useInfiniteQuery } from "@tanstack/react-query";
import type { BlocksStorageObjectsResponse } from "@seliseblocks/client";
import { blocksClient } from "@/lib/blocks-client";

export function useStorageObjects(parentDirectoryId?: string) {
  return useInfiniteQuery({
    queryKey: ["storage", "objects", parentDirectoryId],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      blocksClient.data.objects.list({
        parentDirectoryId,
        cursor: pageParam,
        limit: 50,
      }),
    getNextPageParam: (page: BlocksStorageObjectsResponse) =>
      page.hasMore ? page.nextCursor : undefined,
  });
}
```

Render files and directories from the same list using `item.type`. Gate buttons with the returned flags:

```tsx
{item.permissions.canDownload && item.type === "file" && (
  <button onClick={() => downloadFile(item.itemId)}>Download</button>
)}
{item.permissions.canEdit && <button onClick={() => openRename(item)}>Rename</button>}
{item.permissions.canDelete && <button onClick={() => moveToTrash(item)}>Delete</button>}
{item.permissions.canManage && <button onClick={() => openSharing(item)}>Share</button>}
```

Still handle 403 and 404 responses because access can change after rendering; protected reads may deliberately use 404 for inaccessible objects.

## Common mutations

```ts
const createDirectory = useMutation({
  mutationFn: (name: string) =>
    blocksClient.data.directories.create({ name, parentDirectoryId, moduleName: 8 }),
  onSuccess: invalidateDirectory,
});

const deleteFile = useMutation({
  mutationFn: (fileId: string) =>
    blocksClient.data.files.delete({ fileId, permanent: false }),
  onSuccess: invalidateDirectory,
});

const restore = useMutation({
  mutationFn: (resourceId: string) => blocksClient.data.objects.restore({ resourceId }),
  onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: ["storage"] });
  },
});

const share = useMutation({
  mutationFn: ({ resourceId, userId }: { resourceId: string; userId: string }) =>
    blocksClient.data.objects.share({
      resourceId,
      resourceType: "File",
      principalType: "User",
      principalId: userId,
      permission: "Download",
    }),
});
```

Make permanent deletion a distinct confirmed action. Always pass `permanent` because the backend's omitted-value default is destructive.

## Download

```ts
type FileResult = { url?: string; name?: string };

async function downloadFile(fileId: string) {
  const value = await blocksClient.data.files.get(fileId, {
    configurationName: "Default",
  });
  const file = value as FileResult;
  if (!file.url) throw new Error("Download URL is unavailable");
  window.open(file.url, "_blank", "noopener,noreferrer");
}
```

Private download URLs may expire. Resolve them when needed instead of persisting the URL. Persist `fileId` when associating a file with another record.

## Query keys

Use a stable hierarchy so mutations can invalidate narrowly:

- `["storage", "objects", parentDirectoryId]`
- `["storage", "search", query, directoryId]`
- `["storage", "trash"]`
- `["storage", "shared"]`
- `["storage", "file", fileId, version]`
- `["storage", "access", resourceId]`

Cursor responses may contain fewer visible items than the requested limit even when `hasMore` is true. Drive the next-page affordance from `hasMore` and `nextCursor`, not item count.
