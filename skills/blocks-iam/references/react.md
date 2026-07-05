# React integration — blocks-iam

Target stack: React 19 + TypeScript + Vite + Tailwind + shadcn/ui + TanStack Query +
Zustand (matches `blocks-construct-react`). This wires the iam/v4 service into a
React app: env, a typed fetch client with auto-refresh, an auth store, query/mutation
hooks, and a login form sketch.

Copy the types you need from [contracts.md](../contracts.md) into
`src/features/auth/types.ts` (they are generated from swagger — don't hand-edit
field names). Exact endpoint shapes: [endpoints.md](../endpoints.md).

## Environment

```bash
# .env — client-safe values only (VITE_ vars ship in the bundle)
VITE_BLOCKS_API_URL=https://api.seliseblocks.com
VITE_X_BLOCKS_KEY=<your x-blocks-key>
# Only for the hosted OIDC login button (see that section):
VITE_OIDC_CLIENT_ID=<your OIDC client id from POST /api/oidc-clients>
```

`VITE_BLOCKS_API_URL` + `VITE_X_BLOCKS_KEY` are the core client-side vars —
login/refresh take no `client_id` or project identifier; the `x-blocks-key` header
carries the project context. `VITE_OIDC_CLIENT_ID` is only needed for the hosted-OIDC
button below. Never put `BLOCKS_USERNAME` / `BLOCKS_PASSWORD`, an OIDC **client
secret**, or any non-public secret into a `VITE_` var. See `blocks-setup` for the full
env convention.

> **Choosing an auth pattern.** For a single **Login button** with no password UI, use
> the **Hosted OIDC login** section directly below — the recommended default; it needs
> no token store and no login form. The password-based store/client/hooks that follow
> are only for apps that specifically implement embedded username/password login
> ([flows/embedded-login.md](../flows/embedded-login.md)). Don't mix both in one app.

## Hosted OIDC login (recommended): one button, cookie session

Setup (register the OIDC client + `blocks-oidc` identity provider) is one-time and
server-side — see [flows/oidc-login.md](../flows/oidc-login.md). The frontend is just a
button that navigates to `GET /iam/v4/idp/initiate`; Blocks hosts the login, runs the
authorization-code flow, and returns a **secure HTTP-only session cookie**. No tokens
touch your JS, so there is no token store and no refresh logic here — the browser sends
the cookie automatically once you opt in with `credentials: 'include'`.

```ts
// src/features/auth/oidc.ts
const BASE = `${import.meta.env.VITE_BLOCKS_API_URL}/iam/v4`;
const KEY = import.meta.env.VITE_X_BLOCKS_KEY;
const CLIENT_ID = import.meta.env.VITE_OIDC_CLIENT_ID;

/** Full-page redirect URL for the Login button. A top-level navigation can't send
 *  headers, so x-blocks-key rides as a query param (per the platform integration doc —
 *  not in the swagger param table; verify live). clientId/redirectUri are documented. */
export function initiateLoginUrl(redirectUri = window.location.origin) {
  const q = new URLSearchParams({
    'x-blocks-key': KEY,
    clientId: CLIENT_ID,
    redirectUri,
  });
  return `${BASE}/api/idp/initiate?${q}`;
}

/** Cookie-based fetch — attaches the session cookie instead of a Bearer token. */
async function sessionFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include', // send the Blocks session cookie
    headers: { 'x-blocks-key': KEY, ...init.headers },
  });
  if (!res.ok) throw new Error(`iam ${init.method ?? 'GET'} ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

// GET /api/oidc/session — typed in contracts.md (sessionId, accounts[], timestamps).
// 401/404 => no session (show the Login button).
export const getSession = () => sessionFetch<{
  sessionId?: string | null;
  accounts?: { userId?: string | null; displayName?: string | null }[];
}>('/api/oidc/session');

// GET /api/auth/me — OIDC UserInfo claims (shape undocumented; keep it loose).
export const getMe = () => sessionFetch<Record<string, unknown>>('/api/auth/me');

// POST /api/oidc/session/revoke — logout (clears the session cookie).
export const revokeSession = () =>
  sessionFetch<unknown>('/api/oidc/session/revoke', { method: 'POST' });
```

```tsx
// src/features/auth/LoginButton.tsx — the entire app-facing login UI
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { initiateLoginUrl, getSession, revokeSession } from './oidc';

export function LoginButton() {
  const session = useQuery({
    queryKey: ['oidc', 'session'],
    queryFn: getSession,
    retry: false, // a 401 here just means "not signed in"
  });

  if (session.isPending) return null;

  // Signed in: the cookie resolved a session.
  if (session.data?.sessionId) {
    const name = session.data.accounts?.[0]?.displayName ?? 'account';
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm">Signed in as {name}</span>
        <Button
          variant="outline"
          onClick={async () => {
            await revokeSession();
            window.location.reload();
          }}
        >
          Log out
        </Button>
      </div>
    );
  }

  // Signed out: one button kicks off the Blocks-hosted flow.
  return (
    <Button onClick={() => (window.location.href = initiateLoginUrl())}>
      Log in
    </Button>
  );
}
```

After the redirect back to your `redirectUri`, the cookie is set and
`['oidc','session']` resolves to a session on the next render — no callback code to
write (the platform handles `/api/idp/callback`). Requires HTTPS in local dev, or the
`Secure` cookie is dropped (`blocks-setup` → local-https-setup).

---

The remainder of this guide covers **embedded username/password** login — use it only
if your app implements that instead of (not alongside) the hosted button above.

## Auth store (Zustand)

```ts
// src/features/auth/store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// POST /api/auth/login publishes no response schema in swagger.
// Log the live response ONCE in your project and pin the exact field names
// you observe here. Snake_case (matching the request) is the expected style,
// but it is unverified — hence the loose index signature.
export interface TokenSet {
  access_token?: string;
  refresh_token?: string;
  [key: string]: unknown;
}

interface AuthState {
  tokens: TokenSet | null;
  setTokens: (t: TokenSet | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      tokens: null,
      setTokens: (tokens) => set({ tokens }),
      clear: () => set({ tokens: null }),
    }),
    { name: 'blocks-auth' },
  ),
);
```

## Typed client with 401 → refresh → retry

```ts
// src/features/auth/client.ts
import { useAuthStore } from './store';
import type { RefreshRequest } from './types'; // from contracts.md

const BASE = `${import.meta.env.VITE_BLOCKS_API_URL}/iam/v4`;
const KEY = import.meta.env.VITE_X_BLOCKS_KEY;

async function rawFetch(path: string, init: RequestInit = {}) {
  const { tokens } = useAuthStore.getState();
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'x-blocks-key': KEY,
      'Content-Type': 'application/json',
      ...(tokens?.access_token
        ? { Authorization: `Bearer ${tokens.access_token}` }
        : {}),
      ...init.headers,
    },
  });
}

let refreshing: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  const { tokens, setTokens, clear } = useAuthStore.getState();
  if (!tokens?.refresh_token) return false;
  refreshing ??= (async () => {
    const body: RefreshRequest = {
      refresh_token: tokens.refresh_token, // snake_case — do not rename
    };
    const res = await fetch(`${BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'x-blocks-key': KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      clear();
      return false;
    }
    setTokens(await res.json()); // response shape undocumented — pin after inspecting live
    return true;
  })().finally(() => (refreshing = null));
  return refreshing;
}

/** JSON request against iam/v4 with one automatic refresh-and-retry on 401. */
export async function iamFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res = await rawFetch(path, init);
  if (res.status === 401 && (await tryRefresh())) {
    res = await rawFetch(path, init); // retry once with the fresh token
  }
  if (!res.ok) {
    // Blocks may also return 200 with { isSuccess: false, errors } — check both.
    throw new Error(`iam ${init.method ?? 'GET'} ${path} → ${res.status}`);
  }
  return res.json() as Promise<T>;
}
```

Error/refresh conventions (backoff, forcing re-login, sharing the pattern across
services) are detailed in the `blocks-setup` skill — keep this client consistent
with it.

## Hooks (TanStack Query)

```ts
// src/features/auth/hooks.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { iamFetch } from './client';
import { useAuthStore, type TokenSet } from './store';
import type {
  EmbeddedLoginRequest,
  LogoutRequest,
  ChangePasswordRequest,
  SwitchOrganizationRequest,
  GetMyOrganizationsResponse,
  GetUsersRequest,
  GetUsersResponse,
  BaseResponse,
} from './types'; // copied from contracts.md

/** POST /api/auth/login — body is snake_case (username, mfa_id, captcha_code…). */
export function useLogin() {
  const setTokens = useAuthStore((s) => s.setTokens);
  return useMutation({
    mutationFn: (input: EmbeddedLoginRequest) =>
      iamFetch<TokenSet>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: (tokens) => setTokens(tokens),
  });
}

/** GET /api/auth/me — OIDC UserInfo claims (shape undocumented; keep it loose). */
export function useMe() {
  const tokens = useAuthStore((s) => s.tokens);
  return useQuery({
    queryKey: ['iam', 'me'],
    queryFn: () => iamFetch<Record<string, unknown>>('/api/auth/me'),
    enabled: !!tokens?.access_token,
  });
}

/** POST /api/auth/logout — NOTE: field is camelCase refreshToken here. */
export function useLogout() {
  const { tokens, clear } = useAuthStore.getState();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      iamFetch<unknown>('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({
          refreshToken: tokens?.refresh_token,
        } satisfies LogoutRequest),
      }),
    onSettled: () => {
      clear();
      qc.clear();
    },
  });
}

/** GET /api/iam/organizations/my — org picker data. */
export function useMyOrganizations() {
  return useQuery({
    queryKey: ['iam', 'organizations', 'my'],
    queryFn: () =>
      iamFetch<GetMyOrganizationsResponse>('/api/iam/organizations/my'),
  });
}

/** POST /api/auth/switch-org — reissues tokens for the new org context. */
export function useSwitchOrg() {
  const setTokens = useAuthStore((s) => s.setTokens);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (organization_id: string) =>
      iamFetch<TokenSet>('/api/auth/switch-org', {
        method: 'POST',
        body: JSON.stringify({ organization_id } satisfies SwitchOrganizationRequest),
      }),
    onSuccess: (tokens) => {
      setTokens(tokens); // response undocumented — verify it carries the new pair
      qc.invalidateQueries(); // everything org-scoped is now stale
    },
  });
}

/** POST /api/auth/change-password — camelCase body. */
export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordRequest) =>
      iamFetch<unknown>('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  });
}

/** POST /api/iam/users — admin search; POST-style pagination body. */
export function useUsers(request: GetUsersRequest) {
  return useQuery({
    queryKey: ['iam', 'users', request],
    queryFn: () =>
      iamFetch<GetUsersResponse>('/api/iam/users', {
        method: 'POST',
        body: JSON.stringify(request),
      }),
  });
}
```

## Component sketch — login form with MFA branch

```tsx
// src/features/auth/LoginForm.tsx
import { useState } from 'react';
import { useLogin } from './hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function LoginForm() {
  const login = useLogin();
  const [creds, setCreds] = useState({ username: '', password: '' });
  // The login response shape is undocumented in swagger. After inspecting your
  // live API, detect the MFA challenge (an mfa identifier instead of tokens)
  // and stash it here so the second submit includes mfa_id/mfa_code.
  const [mfaId, setMfaId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(
      mfaId ? { ...creds, mfa_id: mfaId, mfa_code: mfaCode } : creds,
      {
        onSuccess: (res) => {
          if (!res.access_token && typeof res.mfa_id === 'string') {
            setMfaId(res.mfa_id); // field name unverified — pin from live response
          }
        },
      },
    );
  };

  return (
    <form onSubmit={submit} className="grid w-80 gap-3">
      {!mfaId ? (
        <>
          <Input
            placeholder="Email"
            value={creds.username}
            onChange={(e) => setCreds({ ...creds, username: e.target.value })}
          />
          <Input
            type="password"
            placeholder="Password"
            value={creds.password}
            onChange={(e) => setCreds({ ...creds, password: e.target.value })}
          />
        </>
      ) : (
        <Input
          placeholder="One-time code"
          value={mfaCode}
          onChange={(e) => setMfaCode(e.target.value)}
        />
      )}
      <Button type="submit" disabled={login.isPending}>
        {mfaId ? 'Verify code' : 'Sign in'}
      </Button>
      {login.isError && (
        <p className="text-sm text-destructive">Login failed — check credentials.</p>
      )}
    </form>
  );
}
```

## Notes

- **Field casing is per-endpoint** — `login`/`refresh`/`switch-org` are snake_case,
  `logout` uses `refreshToken`, `/api/iam/*` bodies are camelCase. Import the types
  from contracts.md and let the compiler enforce it.
- Persisting tokens in `localStorage` (the `persist` middleware above) is the simple
  default for embedded login; the hosted-OIDC button and social flows use HTTP-only
  cookies instead (see `flows/oidc-login.md` and `flows/sso-identity-providers.md`) —
  don't mix a token store and cookie sessions in one app.
- For signup/activation/recovery pages, reuse `iamFetch` without a token — those
  endpoints need only `x-blocks-key` (see `flows/signup-activation.md` and
  `flows/password-recovery.md`).
