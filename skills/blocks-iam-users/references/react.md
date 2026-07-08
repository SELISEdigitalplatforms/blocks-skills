# Frontend integration — users & me (React 19 / TanStack Query)

`GET /iam/me` is the one every app uses (render the profile, gate on `roles`/`permissions`); the rest are admin-screen operations. Auth: `x-blocks-key: <project key>` + `Authorization: Bearer <token>`.

## Client

```ts
// src/features/users/api.ts
import { useAuthStore } from "@/stores/auth";

const IAM = `${import.meta.env.VITE_BLOCKS_API_URL}/iam/v4/iam`;
const KEY = import.meta.env.VITE_BLOCKS_PROJECT_KEY as string;

export interface Me {
  itemId: string; firstName: string; lastName: string; email: string; phoneNumber: string;
  roles: string[]; permissions: string[]; active: boolean; status: number; isVerified: boolean;
  mfaEnabled: boolean; userMfaType: number; attributes: Record<string, unknown>; logInCount: number; lastLoggedInTime: string;
}
export interface Paged<T> { totalCount: number; data: T[] }

async function iam<T>(path: string, init: RequestInit = {}, _retried = false): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  const res = await fetch(`${IAM}${path}`, {
    ...init,
    credentials: "include", // send the Blocks session cookie (set by the SSO callback)
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

export const users = {
  me: () => iam<{ data: Me }>(`/me`),
  // Auth-state probe: resolves to the profile if the session is valid, or null if not logged in (401).
  // Relies on the session cookie, so it works on a fresh page load with no JS-held token.
  meOrNull: async (): Promise<Me | null> => {
    try {
      const res = await fetch(`${IAM}/me`, { credentials: "include", headers: { "x-blocks-key": KEY } });
      if (res.status === 401) return null;      // not logged in
      if (!res.ok) throw new Error(`me → ${res.status}`);
      return ((await res.json()) as { data: Me }).data;
    } catch {
      return null;
    }
  },
  patchMe: (body: object) => iam(`/me`, { method: "PATCH", body: JSON.stringify(body) }),
  list: (body: object = {}) => iam<Paged<Record<string, unknown>>>(`/users`, { method: "POST", body: JSON.stringify({ page: 0, pageSize: 20, ...body }) }),
  get: (id: string, organizationId?: string) => iam<{ data: Record<string, unknown> }>(`/users/${id}${organizationId ? `?organizationId=${organizationId}` : ""}`),
  create: (body: object) => iam(`/users/create`, { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: object) => iam(`/users/${id}`, { method: "POST", body: JSON.stringify({ ...body, itemId: id }) }),
  assign: (userId: string, roles: string[], permissions: string[] = []) => iam(`/users/roles-and-permissions`, { method: "POST", body: JSON.stringify({ userId, roles, permissions }) }),
  deactivate: (userId: string) => iam(`/users/deactivate`, { method: "POST", body: JSON.stringify({ userId }) }),
  // Timeline needs a body with ItemId (the target user). Swagger says GET, but a GET can't carry a body
  // in the browser — the server accepts POST, so call it as POST. (Verify the ItemId/org semantics per project.)
  timeline: (targetUserId: string, body: object = {}) =>
    iam(`/users/timeline`, { method: "POST", body: JSON.stringify({ ItemId: targetUserId, page: 0, pageSize: 20, ...body }) }),
};
```

## Hooks

```ts
// src/features/users/hooks.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { users, type Me } from "./api";

// The auth-state source of truth. `/iam/me` succeeds only when there's a valid session
// (the cookie set by the SSO callback), so this doubles as "am I logged in?".
// Call it: on app/page load, right after login, and after the SSO callback sets the cookie.
// null data = logged out → send the user to login. isSuccess+data = logged in.
export const useMe = () =>
  useQuery({
    queryKey: ["iam", "me"],
    queryFn: () => users.meOrNull(), // returns Me | null; null on 401 rather than throwing
    staleTime: 60_000,
    retry: false,                    // a 401 is a real answer (logged out), not a failure to retry
  });

export const useIsLoggedIn = () => {
  const { data, isPending } = useMe();
  return { isLoggedIn: !!data, isChecking: isPending, me: data ?? null };
};

export function useHasPermission() {
  const { data: me } = useMe();
  return (perm: string) => !!me?.permissions?.includes(perm);
}

export const useUsers = (filter: Record<string, unknown> = {}) =>
  useQuery({ queryKey: ["iam", "users", filter], queryFn: () => users.list({ filter }) });

export function useAssignUserAccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roles, permissions }: { userId: string; roles: string[]; permissions?: string[] }) =>
      users.assign(userId, roles, permissions ?? []),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["iam", "users"] }),
  });
}
```

## Gating UI on the current user

```tsx
import { useHasPermission } from "./hooks";

export function AdminButton() {
  const has = useHasPermission();
  if (!has("orders::invoice::write")) return null;
  return <button className="rounded bg-primary px-3 py-1.5 text-primary-foreground">New invoice</button>;
}
```

## Auth bootstrap & route guard (page load)

`/iam/me` is how the app learns whether it's logged in — call it on load; the browser sends the session cookie automatically.

```tsx
// src/features/auth/require-auth.tsx
import { Navigate } from "react-router-dom";
import { useIsLoggedIn } from "@/features/users/hooks";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isChecking } = useIsLoggedIn(); // runs GET /iam/me once, cached
  if (isChecking) return <p className="text-muted-foreground text-sm">Checking session…</p>;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
```

After the SSO callback finishes (cookie set), invalidate the query so the app re-checks and picks up the new session:

```ts
import { useQueryClient } from "@tanstack/react-query";
// in the callback handler, after finishLogin() succeeds:
queryClient.invalidateQueries({ queryKey: ["iam", "me"] });
```

## Notes

- **`/iam/me` is the auth-state source of truth** — it succeeds only with a valid session (the cookie set by the SSO callback), so call it on page load, after login, and after the callback; a 401 means "logged out", not an error to retry. The client sends `credentials: "include"` so the cookie rides along even with no JS-held token. Cache it once (`["iam","me"]`) and drive role/permission gates off `me.permissions` / `me.roles`.
- **Lists are POST**; the timeline is a `GET` that still takes a page/filter body (send it as the request body).
- Assign access with `roles-and-permissions` (roles by slug, permissions by name) rather than stuffing it into a profile update.
- Server-side authorization still applies — UI gating is convenience, not security.
