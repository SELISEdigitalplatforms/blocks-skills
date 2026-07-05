# React integration — blocks-utilities

Target stack: React 19 + TypeScript + Vite + Tailwind + shadcn/ui + TanStack Query + Zustand (matches `blocks-construct-react`). This guide gives you a typed client slice for the utilities service and hooks for its highest-value endpoints.

Types: copy the generated code block from [contracts.md](../contracts.md) into `src/lib/blocks/utilities.contracts.ts` and import by name. Exact request/response shapes: [endpoints.md](../endpoints.md).

## Environment

```env
VITE_BLOCKS_API_URL=https://api.seliseblocks.com
VITE_X_BLOCKS_KEY=<your project's blocks key>
VITE_PROJECT_SLUG=<projectShortKey>
```

Never put credentials or non-public secrets in `VITE_` vars. Login/refresh and the auth store come from **blocks-setup** — this guide assumes a Zustand store exposing `accessToken`.

## API client slice

```ts
// src/lib/blocks/utilities.client.ts
import { useAuthStore } from "@/stores/auth"; // from blocks-setup integration

const BASE = `${import.meta.env.VITE_BLOCKS_API_URL}/utilities/v4`;
export const PROJECT_KEY = import.meta.env.VITE_PROJECT_SLUG as string;

export class BlocksApiError extends Error {
  constructor(
    public status: number,
    public errors?: Record<string, string>,
    message?: string,
  ) {
    super(message ?? `utilities request failed (${status})`);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "x-blocks-key": import.meta.env.VITE_X_BLOCKS_KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  if (res.status === 401) {
    // Refresh via blocks-setup's flow, then retry once; logout on second 401.
    throw new BlocksApiError(401, undefined, "Unauthorized — refresh token (see blocks-setup)");
  }
  if (!res.ok) throw new BlocksApiError(res.status);
  const body = (await res.json()) as T & { isSuccess?: boolean; errors?: Record<string, string> };
  // HTTP 200 does NOT mean success on this service — check the envelope.
  if (body && body.isSuccess === false) {
    throw new BlocksApiError(res.status, body.errors, "Operation failed (isSuccess=false)");
  }
  return body;
}

export const utilitiesApi = {
  get: <T>(path: string, params?: Record<string, string | number | boolean | undefined>) => {
    const qs = params
      ? "?" +
        new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)]),
        ).toString()
      : "";
    return request<T>(`${path}${qs}`);
  },
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
};
```

## Query hooks

```ts
// src/lib/blocks/utilities.hooks.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { utilitiesApi, PROJECT_KEY } from "./utilities.client";
import type {
  CreateMagicLinkRequest,
  CreateMagicLinkResponse,
  GetMagicLinksResponse,
  RemoveMagicLinksResponse,
  SendMailToAny,
  GetAllTemplatesResponse,
  SequenceNumberQueryResponse,
  LocateIpResponse,
  GetNotificationsResponse,
} from "./utilities.contracts";

// --- Magic links -----------------------------------------------------------

export function useMagicLinks(page = 0, pageSize = 10) {
  return useQuery({
    queryKey: ["magic-links", page, pageSize],
    queryFn: () =>
      utilitiesApi.get<GetMagicLinksResponse>("/api/MagicLink/GetLinks", {
        ProjectKey: PROJECT_KEY,
        PageNumber: page,
        PageSize: pageSize,
      }),
  });
}

export function useCreateMagicLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateMagicLinkRequest) =>
      utilitiesApi.post<CreateMagicLinkResponse>("/api/MagicLink/CreateLink", {
        ...req,
        projectKey: PROJECT_KEY,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["magic-links"] }),
  });
}

export function useRemoveMagicLinks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (linkIds: string[]) =>
      utilitiesApi.post<RemoveMagicLinksResponse>("/api/MagicLink/RemoveLinks", {
        linkIds,
        projectKey: PROJECT_KEY,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["magic-links"] }),
  });
}

// --- Mail ------------------------------------------------------------------

// Response shape undocumented in swagger — typed as the common envelope; verify live.
type SendMailResult = { isSuccess?: boolean; errors?: Record<string, string> };

export function useSendMail() {
  return useMutation({
    mutationFn: (mail: SendMailToAny) =>
      utilitiesApi.post<SendMailResult>("/api/Mail/SendToAny", {
        ...mail,
        projectKey: PROJECT_KEY,
      }),
  });
}

// --- Templates ---------------------------------------------------------------

export function useEmailTemplates(page = 0, pageSize = 20) {
  return useQuery({
    queryKey: ["email-templates", page, pageSize],
    queryFn: () =>
      utilitiesApi.get<GetAllTemplatesResponse>("/api/Template/Gets", {
        ProjectKey: PROJECT_KEY,
        PageNumber: page,
        PageSize: pageSize,
      }),
  });
}

// --- Sequence ----------------------------------------------------------------
// IMPORTANT: /api/Sequence/Next is a GET that CONSUMES a number on every call.
// Model it as a mutation — never useQuery (refetch/remount would burn numbers).

export function useNextSequenceNumber() {
  return useMutation({
    mutationFn: (context: string) =>
      utilitiesApi.get<SequenceNumberQueryResponse>("/api/Sequence/Next", {
        Context: context,
        ProjectKey: PROJECT_KEY,
      }),
  });
}

// --- Geolocation -------------------------------------------------------------

export function useVisitorLocation() {
  return useQuery({
    queryKey: ["visitor-location"],
    queryFn: () =>
      utilitiesApi.get<LocateIpResponse>("/api/Geolocation/Locate", {
        ProjectKey: PROJECT_KEY,
      }),
    staleTime: Infinity, // visitor IP location won't change mid-session
  });
}

// --- Notifications -------------------------------------------------------------

export function useNotifications(unreadOnly = false) {
  return useQuery({
    queryKey: ["notifications", unreadOnly],
    queryFn: () =>
      utilitiesApi.get<GetNotificationsResponse>("/api/Notifier/GetNotifications", {
        IsUnreadOnly: unreadOnly,
        Page: 0,
        PageSize: 20,
      }),
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      utilitiesApi.post("/api/Notifier/MarkNotificationAsRead", { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
```

## Usage sketch: magic-link invite panel

```tsx
// src/features/invites/MagicLinkPanel.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useCreateMagicLink, useMagicLinks, useRemoveMagicLinks } from "@/lib/blocks/utilities.hooks";

export function MagicLinkPanel() {
  const [targetUrl, setTargetUrl] = useState("");
  const links = useMagicLinks();
  const create = useCreateMagicLink();
  const remove = useRemoveMagicLinks();

  const handleCreate = () =>
    create.mutate(
      {
        type: 0, // 0 = Redirect, 1 = Action
        uri: targetUrl,
        name: `Invite ${new Date().toISOString().slice(0, 10)}`,
        usageLimit: 1, // single-use
        expiryLifeSpan: 7 * 24 * 60 * 60 * 1000, // 7 days, in ms
      },
      {
        onSuccess: (res) => {
          navigator.clipboard.writeText(res.shortUri ?? "");
          toast.success(`Link copied: ${res.shortUri}`);
        },
        onError: () => toast.error("Could not create link"),
      },
    );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder="https://app.example.com/onboarding" value={targetUrl}
               onChange={(e) => setTargetUrl(e.target.value)} />
        <Button onClick={handleCreate} disabled={!targetUrl || create.isPending}>
          Create single-use link
        </Button>
      </div>
      <ul className="divide-y">
        {links.data?.data?.map((l) => (
          <li key={l.itemId} className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">{l.name}</p>
              <p className="text-xs text-muted-foreground">
                {l.shortUri} — {l.status} — used {l.usageCount}/{l.usageLimit || "∞"}
              </p>
            </div>
            <Button variant="ghost" size="sm" disabled={l.status !== "Active"}
                    onClick={() => l.itemId && remove.mutate([l.itemId])}>
              Revoke
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Notes

- **401 handling / token refresh:** wire the client's 401 branch into the refresh flow from **blocks-setup** (`POST /iam/v4/api/auth/refresh`). Retry once after refresh; log out on repeat failure.
- **Never retry sequence draws blindly:** a retried `/api/Sequence/Next` after an ambiguous failure may consume two numbers. Set `retry: false` on that mutation.
- **Undocumented responses:** `Mail/Send*`, `Template/Save|Clone|Delete`, and mailbox reads have no swagger response schema — keep their result types minimal (envelope only) until you've inspected live responses.
- **PDF generation from the browser:** the Create endpoints are async and return no bytes — pair them with Storage uploads/downloads from the **blocks-os** skill; see [flows/generate-pdfs.md](../flows/generate-pdfs.md).
