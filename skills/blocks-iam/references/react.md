# React integration — blocks-iam

Target stack: React 19 + TypeScript + Vite + Tailwind + shadcn/ui + TanStack Query +
Zustand (matches `blocks-construct-react`). This wires the iam/v4 service into a
React app: env, a typed fetch client, an auth store, query/mutation hooks, and the
LoginButton sketch.

Copy the types you need from [contracts.md](../contracts.md) into
`src/features/auth/types.ts` (they are generated from swagger — don't hand-edit
field names). Exact endpoint shapes: [endpoints.md](../endpoints.md).

## Environment

```bash
# .env — client-safe values only (VITE_ vars ship in the bundle)
VITE_BLOCKS_API_URL=https://api.seliseblocks.com
VITE_X_BLOCKS_KEY=<your x-blocks-key>
# Only for the hosted OIDC login button (see that section):
VITE_OIDC_CLIENT_ID=<your OIDC client id from POST /oidc-clients>
# Optional: override the redirect URI sent to /idp/initiate. If unset, the SPA
# falls back to `${window.location.origin}/auth/callback`.
VITE_OIDC_REDIRECT_URI=https://app.example.com/auth/callback
```

`VITE_BLOCKS_API_URL` + `VITE_X_BLOCKS_KEY` are the core client-side vars —
login/refresh take no `client_id` or project identifier; the `x-blocks-key` header
carries the project context. `VITE_OIDC_CLIENT_ID` and `VITE_OIDC_REDIRECT_URI` are
only needed for the hosted-OIDC button below. Never put `BLOCKS_USERNAME` /
`BLOCKS_PASSWORD`, an OIDC **client secret**, or any non-public secret into a `VITE_`
var. See `blocks-setup` for the full env convention.

> **Choosing an auth pattern.** For a single **Login button** with no password UI, use
> the **Hosted OIDC login** section directly below — the recommended default; it needs
> no token store and no login form. The password-based store/client/hooks that follow
> are only for apps that specifically implement embedded username/password login
> ([flows/embedded-login.md](../flows/embedded-login.md)). Don't mix both in one app.

## Hosted OIDC login (recommended): one button, cookie session

Setup (register the OIDC client + `blocks-oidc` identity provider) is one-time and
server-side — see [flows/oidc-login.md](../flows/oidc-login.md).

The frontend is just a button that **fires an HTTP API call to `/idp/initiate`**,
reads the redirect URL from the response, and navigates the browser there. Blocks
runs the authorization-code flow, and the callback sets a **secure HTTP-only
session cookie**. No tokens touch your JS, so there is no token store and no refresh
logic here — the browser sends the cookie automatically once you opt in with
`credentials: 'include'`.

### Start the login — fetch + redirect

```ts
// src/features/auth/oidc.ts
const BASE = `${import.meta.env.VITE_BLOCKS_API_URL}/iam/v4`;
const KEY = import.meta.env.VITE_X_BLOCKS_KEY;
const CLIENT_ID = import.meta.env.VITE_OIDC_CLIENT_ID ?? '';

// Optional override; otherwise `${window.location.origin}/auth/callback`.
const REDIRECT_URI =
  import.meta.env.VITE_OIDC_REDIRECT_URI ?? `${window.location.origin}/auth/callback`;

/** Build the initiate URL — kept around for debugging and link previews. */
export function initiateLoginUrl(redirectUri: string = REDIRECT_URI) {
  const q = new URLSearchParams({
    'x-blocks-key': KEY,
    clientId: CLIENT_ID,
    redirectUri,
  });
  return `${BASE}/idp/initiate?${q}`;
}

/**
 * Kick off the OIDC Authorization Code flow.
 *
 *   1. fetch('/iam/v4/idp/initiate?x-blocks-key=…&clientId=…&redirectUri=…')
 *   2. Read the redirect target from the response — either:
 *        a) 30x with a Location header, or
 *        b) 2xx with a JSON body containing the `redirect_uri` field (the only
 *           valid name on the live iam/v4 endpoint).
 *   3. window.location.href = <that URL>  — browser navigates to Blocks IAM.
 *
 * Note: older docs and sample code reference `redirectUrl`, `authorizationUrl`,
 * `url`, etc. as if they were valid field names. They are not — the live `iam/v4`
 * only ever returns `redirect_uri` (snake_case). The lookup below tries those
 * legacy names as a defensive fallback so the SPA keeps working against older
 * dev sandboxes, but `redirect_uri` is the authoritative field.
 */
export async function startLogin(opts: { redirectUri?: string } = {}): Promise<void> {
  const params = new URLSearchParams({
    'x-blocks-key': KEY,
    clientId: CLIENT_ID,
    redirectUri: opts.redirectUri ?? REDIRECT_URI,
  });
  const initiateUrl = `${BASE}/idp/initiate?${params}`;

  const res = await fetch(initiateUrl, {
    method: 'GET',
    credentials: 'include',
    redirect: 'manual', // we'll handle the redirect target ourselves
    headers: { 'x-blocks-key': KEY, Accept: 'application/json' },
  });

  // Case A: 30x with Location header
  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get('Location') ?? res.headers.get('location');
    if (!location) throw new Error(`idp/initiate: redirect with no Location header (${res.status})`);
    window.location.href = location;
    return;
  }

  if (!res.ok) {
    let detail = `idp/initiate failed: ${res.status} ${res.statusText}`;
    try {
      const body = await res.text();
      if (body) detail += ` — ${body.slice(0, 300)}`;
    } catch {}
    throw new Error(detail);
  }

  // Case B: 2xx JSON body — `redirect_uri` is the only valid field name.
  const body = (await res.json()) as Record<string, unknown>;
  const redirectUrl =
    (body.redirect_uri as string | undefined) ??
    (body.redirectUrl as string | undefined) ??
    (body.url as string | undefined) ??
    (body.authorizationUrl as string | undefined);

  if (!redirectUrl) {
    throw new Error("idp/initiate response did not contain `redirect_uri`");
  }
  window.location.href = redirectUrl;
}

  if (!res.ok) {
    let detail = `idp/initiate failed: ${res.status} ${res.statusText}`;
    try {
      const body = await res.text();
      if (body) detail += ` — ${body.slice(0, 300)}`;
    } catch {}
    throw new Error(detail);
  }

  // Case B: 2xx with a body
  const contentType = res.headers.get('content-type') ?? '';
  let redirectUrl: string | undefined;

  if (contentType.includes('application/json')) {
    const body = (await res.json()) as Record<string, unknown>;
    redirectUrl =
      (body.redirect_uri as string | undefined) ??
      (body.redirectUrl as string | undefined) ??
      (body.url as string | undefined) ??
      (body.authorizationUrl as string | undefined) ??
      (body.authorization_url as string | undefined) ??
      (body.authorizeUrl as string | undefined) ??
      (body.authorize_url as string | undefined);
  } else {
    const text = (await res.text()).trim();
    if (text.startsWith('http://') || text.startsWith('https://')) {
      redirectUrl = text;
    }
  }

  if (!redirectUrl) throw new Error('idp/initiate response did not contain a redirect URL');
  window.location.href = redirectUrl;
}

/** Cookie-based fetch — attaches the session cookie instead of a Bearer token. */
async function sessionFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include', // send the Blocks session cookie
    headers: { 'x-blocks-key': KEY, Accept: 'application/json', ...init.headers },
  });
  if (!res.ok) {
    if (res.status === 401 || res.status === 404) {
      // No session — callers usually handle this as "signed out".
      throw new Object.assign(new Error('no session'), { status: res.status });
    }
    throw new Error(`iam ${init.method ?? 'GET'} ${path} → ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// GET /oidc/session — typed in contracts.md (sessionId, accounts[], timestamps).
// 401/404 => no session (show the Login button).
export const getSession = () =>
  sessionFetch<{
    sessionId?: string | null;
    accounts?: { userId?: string | null; displayName?: string | null }[];
  }>('/oidc/session');

// GET /auth/me — OIDC UserInfo claims (shape undocumented; keep it loose).
export const getMe = () => sessionFetch<Record<string, unknown>>('/auth/me');

// POST /oidc/session/revoke — logout (clears the session cookie).
export const revokeSession = () =>
  sessionFetch<unknown>('/oidc/session/revoke', { method: 'POST' });
```

### LoginButton component

```tsx
// src/features/auth/LoginButton.tsx — the entire app-facing login UI
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LogIn, Loader2, LogOut, UserCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { startLogin, getSession, getMe, revokeSession } from './oidc';
import { useToast } from '@/components/ui/toast';

export function LoginButton() {
  const session = useQuery({
    queryKey: ['oidc', 'session'],
    queryFn: getSession,
    retry: false, // a 401 here just means "not signed in"
  });

  const isSignedIn = Boolean(session.data?.sessionId);

  if (!isSignedIn) {
    return <SignInTrigger />;
  }

  return <AccountMenu session={session.data} />;
}

function SignInTrigger() {
  const [starting, setStarting] = useState(false);
  const { toast } = useToast();
  return (
    <Button
      size="sm"
      className="gap-2"
      disabled={starting}
      onClick={async () => {
        setStarting(true);
        try {
          await startLogin();
          // Browser is navigating — leave the spinner up.
        } catch (err: unknown) {
          toast({
            title: 'Sign in failed',
            description: err instanceof Error ? err.message : String(err),
            variant: 'destructive',
          });
          setStarting(false);
        }
      }}
    >
      {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
      Sign in
    </Button>
  );
}

function AccountMenu({ session }: { session: { accounts?: { displayName?: string | null }[] } }) {
  const me = useQuery({
    queryKey: ['oidc', 'me'],
    queryFn: getMe,
    enabled: Boolean(session.sessionId),
    retry: false,
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserCircle2 className="h-4 w-4" />
          <span className="hidden sm:inline">
            {(me.data?.name as string | undefined) ?? session.accounts?.[0]?.displayName ?? 'account'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          {(me.data?.email as string | undefined) ?? 'Signed in'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => revokeSession().then(() => window.location.reload())}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

After the redirect back to your `redirectUri`, the cookie is set and
`['oidc','session']` resolves to a session on the next render — no callback code to
write (the platform handles `/idp/callback`). Requires HTTPS in local dev, or the
`Secure` cookie is dropped (`blocks-setup` → local-https-setup).

> **Why fetch instead of `window.location.href = initiateLoginUrl()`?** A fetch lets
> the SPA observe the response (set a spinner, surface errors, parse the redirect
> target), and keeps the browser address bar pointing at your app until the user is
> actually being redirected to Blocks IAM. Direct navigation works too if you'd rather
> skip the indirection — the platform returns the same redirect URL via 30x Location
> header if you set `redirect: 'follow'` (the fetch default).

---

The remainder of this guide covers **embedded username/password** login — use it only
if your app implements that instead of (not alongside) the hosted button above.

## Auth store (Zustand)

```ts
// src/features/auth/store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// POST /auth/login publishes no response schema in swagger.
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
    const res = await fetch(`${BASE}/auth/refresh`, {
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

/** POST /auth/login — body is snake_case (username, mfa_id, captcha_code…). */
export function useLogin() {
  const setTokens = useAuthStore((s) => s.setTokens);
  return useMutation({
    mutationFn: (input: EmbeddedLoginRequest) =>
      iamFetch<TokenSet>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: (tokens) => setTokens(tokens),
  });
}

/** GET /auth/me — OIDC UserInfo claims (shape undocumented; keep it loose). */
export function useMe() {
  const tokens = useAuthStore((s) => s.tokens);
  return useQuery({
    queryKey: ['iam', 'me'],
    queryFn: () => iamFetch<Record<string, unknown>>('/auth/me'),
    enabled: !!tokens?.access_token,
  });
}

/** POST /auth/logout — NOTE: field is camelCase refreshToken here. */
export function useLogout() {
  const { tokens, clear } = useAuthStore.getState();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      iamFetch<unknown>('/auth/logout', {
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

/** GET /iam/organizations/my — org picker data. */
export function useMyOrganizations() {
  return useQuery({
    queryKey: ['iam', 'organizations', 'my'],
    queryFn: () =>
      iamFetch<GetMyOrganizationsResponse>('/iam/organizations/my'),
  });
}

/** POST /auth/switch-org — reissues tokens for the new org context. */
export function useSwitchOrg() {
  const setTokens = useAuthStore((s) => s.setTokens);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (organization_id: string) =>
      iamFetch<TokenSet>('/auth/switch-org', {
        method: 'POST',
        body: JSON.stringify({ organization_id } satisfies SwitchOrganizationRequest),
      }),
    onSuccess: (tokens) => {
      setTokens(tokens); // response undocumented — verify it carries the new pair
      qc.invalidateQueries(); // everything org-scoped is now stale
    },
  });
}

/** POST /auth/change-password — camelCase body. */
export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordRequest) =>
      iamFetch<unknown>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  });
}

/** POST /iam/users — admin search; POST-style pagination body. */
export function useUsers(request: GetUsersRequest) {
  return useQuery({
    queryKey: ['iam', 'users', request],
    queryFn: () =>
      iamFetch<GetUsersResponse>('/iam/users', {
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
  `logout` uses `refreshToken`, `/iam/*` bodies are camelCase. Import the types
  from contracts.md and let the compiler enforce it.
- Persisting tokens in `localStorage` (the `persist` middleware above) is the simple
  default for embedded login; the hosted-OIDC button and social flows use HTTP-only
  cookies instead (see `flows/oidc-login.md` and `flows/sso-identity-providers.md`) —
  don't mix a token store and cookie sessions in one app.
- For signup/activation/recovery pages, reuse `iamFetch` without a token — those
  endpoints need only `x-blocks-key` (see `flows/signup-activation.md` and
  `flows/password-recovery.md`).