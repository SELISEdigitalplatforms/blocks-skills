# React auth foundation for SELISE Blocks

The canonical client-side auth layer for Blocks apps: typed fetch wrapper, Zustand auth store, and
TanStack Query integration. Stack: React 19 + TypeScript + Vite + Tailwind + shadcn/ui + TanStack
Query + Zustand (matches `blocks-construct-react`). **Every other blocks-* skill's React guide
builds on the files defined here** — create them once under `src/lib/blocks/` and import.

Endpoint ground truth: `../../blocks-iam/endpoints.md#authentication`. Login/refresh/me response
shapes are not documented in swagger — the interfaces below use the conventional snake_case token
fields; verify them against your environment's live responses once and adjust.

## Environment

```bash
# .env.local (Vite) — client-safe values only
VITE_BLOCKS_API_URL=https://api.seliseblocks.com
VITE_X_BLOCKS_KEY=<Blocks Key>       # client-visible by design
VITE_PROJECT_SLUG=<project short key>
```

Never expose `BLOCKS_USERNAME` / `BLOCKS_PASSWORD` or admin secrets via `VITE_`.

**Serve dev over HTTPS.** Blocks sets Secure auth cookies — a plain `http://localhost` dev server
breaks auth in confusing ways. One-time mkcert + Vite setup:
[../flows/local-https-setup.md](../flows/local-https-setup.md) (adds `server.https` with a
locally-trusted cert to `vite.config.ts`).

```ts
// src/lib/blocks/env.ts
export const BLOCKS_API_URL = import.meta.env.VITE_BLOCKS_API_URL as string;
export const X_BLOCKS_KEY = import.meta.env.VITE_X_BLOCKS_KEY as string;
export const PROJECT_SLUG = import.meta.env.VITE_PROJECT_SLUG as string;

if (!BLOCKS_API_URL || !X_BLOCKS_KEY || !PROJECT_SLUG) {
  throw new Error("Missing VITE_BLOCKS_* env vars — see blocks-setup skill");
}
```

## Auth store (Zustand)

Access token lives in JS memory only; the refresh token is the single persisted credential.

```ts
// src/lib/blocks/auth-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  accessToken: string | null;   // memory only — not persisted
  refreshToken: string | null;  // persisted so sessions survive reloads
  setTokens: (access: string, refresh: string) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      clear: () => set({ accessToken: null, refreshToken: null }),
    }),
    {
      name: "blocks-auth",
      partialize: (s) => ({ refreshToken: s.refreshToken }), // never persist the access token
    },
  ),
);
```

## Fetch wrapper with 401-refresh-retry

One function all service slices call. Injects `x-blocks-key` + `Bearer`, single-flights the
refresh so concurrent 401s trigger exactly one `POST /api/auth/refresh`, retries once.

```ts
// src/lib/blocks/api.ts
import { BLOCKS_API_URL, X_BLOCKS_KEY, PROJECT_SLUG } from "./env";
import { useAuthStore } from "./auth-store";

export type BlocksService =
  | "os" | "iam" | "localization" | "logic"
  | "data" | "release" | "monitor" | "utilities";

export class BlocksApiError extends Error {
  constructor(public status: number, public body: unknown) {
    super(`Blocks API error ${status}`);
  }
}

let refreshInFlight: Promise<boolean> | null = null;

/** POST /iam/v4/api/auth/refresh — body is snake_case by design. */
async function refreshTokens(): Promise<boolean> {
  const { refreshToken, setTokens, clear } = useAuthStore.getState();
  if (!refreshToken) return false;
  const res = await fetch(`${BLOCKS_API_URL}/iam/v4/api/auth/refresh`, {
    method: "POST",
    headers: { "x-blocks-key": X_BLOCKS_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken, client_id: PROJECT_SLUG }),
  });
  if (!res.ok) {
    clear(); // refresh token dead — force full re-login
    return false;
  }
  // Response shape not documented in swagger — verify these field names against your
  // environment's live response and adjust.
  const data = await res.json();
  setTokens(data.access_token, data.refresh_token ?? refreshToken); // handle rotation
  return true;
}

export async function blocksFetch<T>(
  service: BlocksService,
  path: string, // e.g. "/api/auth/me"
  init: RequestInit = {},
  retried = false,
): Promise<T> {
  const { accessToken } = useAuthStore.getState();
  const res = await fetch(`${BLOCKS_API_URL}/${service}/v4${path}`, {
    ...init,
    headers: {
      "x-blocks-key": X_BLOCKS_KEY,
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init.headers,
    },
  });

  if (res.status === 401 && !retried) {
    refreshInFlight ??= refreshTokens().finally(() => (refreshInFlight = null));
    const ok = await refreshInFlight;
    if (ok) return blocksFetch<T>(service, path, init, true); // retry exactly once
    throw new BlocksApiError(401, "session expired — re-login required");
  }
  if (!res.ok) throw new BlocksApiError(res.status, await res.json().catch(() => null));
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}
```

## Auth API slice

```ts
// src/lib/blocks/auth-api.ts
import { blocksFetch } from "./api";
import { PROJECT_SLUG } from "./env";
import { useAuthStore } from "./auth-store";

// Request shape verbatim from blocks-iam endpoints.md (snake_case is intentional).
export interface LoginRequest {
  client_id: string;
  username: string;
  password: string;
  captcha_code?: string;
  mfa_id?: string;
  mfa_code?: string;
  mfa_type?: 0 | 1 | 2 | 3 | 4; // int enum, member names not documented in swagger
}

// Login/me responses are NOT documented in swagger — verify against your live environment.
export interface LoginResponse {
  access_token?: string;
  refresh_token?: string;
  [key: string]: unknown; // MFA challenge / captcha-demand fields appear here — inspect live
}

export async function login(creds: Omit<LoginRequest, "client_id">): Promise<LoginResponse> {
  const data = await blocksFetch<LoginResponse>("iam", "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ client_id: PROJECT_SLUG, ...creds }),
  });
  if (data.access_token && data.refresh_token) {
    useAuthStore.getState().setTokens(data.access_token, data.refresh_token);
  }
  return data; // caller checks for MFA challenge if tokens are absent
}

/** GET /api/auth/me — OIDC UserInfo claims (sub, email, name, + custom Blocks claims). */
export interface Me {
  sub?: string;
  email?: string;
  name?: string;
  [claim: string]: unknown; // shape not documented in swagger
}

export const getMe = () => blocksFetch<Me>("iam", "/api/auth/me");

/** POST /api/auth/logout — NOTE: camelCase refreshToken here, per swagger. */
export async function logout(): Promise<void> {
  const { refreshToken, clear } = useAuthStore.getState();
  try {
    await blocksFetch("iam", "/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  } finally {
    clear(); // drop local state even if the server call fails
  }
}
```

## TanStack Query hooks

```ts
// src/lib/blocks/auth-hooks.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { login, logout, getMe } from "./auth-api";
import { useAuthStore } from "./auth-store";

export function useMe() {
  const hasSession = useAuthStore((s) => !!s.accessToken || !!s.refreshToken);
  return useQuery({ queryKey: ["blocks", "me"], queryFn: getMe, enabled: hasSession, retry: false });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: login,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blocks", "me"] }),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: logout, onSuccess: () => qc.clear() });
}
```

## Usage sketch

```tsx
// src/components/auth-gate.tsx
import { useMe, useLogin } from "@/lib/blocks/auth-hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const me = useMe();
  if (me.isLoading) return <div className="p-8 text-muted-foreground">Checking session…</div>;
  if (me.data?.sub) return <>{children}</>;
  return <LoginForm />;
}

function LoginForm() {
  const loginMut = useLogin();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  return (
    <form
      className="mx-auto mt-24 flex w-80 flex-col gap-3"
      onSubmit={(e) => { e.preventDefault(); loginMut.mutate({ username, password }); }}
    >
      <Input placeholder="Email" value={username} onChange={(e) => setUsername(e.target.value)} />
      <Input type="password" placeholder="Password" value={password}
             onChange={(e) => setPassword(e.target.value)} />
      <Button type="submit" disabled={loginMut.isPending}>Sign in</Button>
      {loginMut.isError && <p className="text-sm text-destructive">Login failed — check credentials.</p>}
      {/* If the login response contains an MFA challenge instead of tokens, render a code
          input and call login() again with mfa_id / mfa_code / mfa_type from the challenge —
          see flows/bootstrap-project.md branches. */}
    </form>
  );
}
```

## Notes for other skills

- Import `blocksFetch` and pass your service name: `blocksFetch("data", "/api/…")`,
  `blocksFetch("utilities", "/api/Mail/Send", { method: "POST", … })`, etc.
- 401 handling, refresh single-flighting, and token storage are already solved here — service
  slices should contain zero auth logic.
- Error/refresh semantics and the storage rationale: [../flows/token-lifecycle.md](../flows/token-lifecycle.md).
