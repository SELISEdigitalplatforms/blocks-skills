# Frontend integration — Blocks SSO login (React 19 / Vite / React Router)

Wires the hosted authorization-code flow ([../flows/login-flow.md](../flows/login-flow.md)) into a React app: a login button that calls `initiate` then redirects, and a callback route that finalizes the session.

## Env

```bash
VITE_BLOCKS_API_URL=https://api.seliseblocks.com
VITE_BLOCKS_PROJECT_KEY=<project tenant id>          # x-blocks-key (public, ship it)
VITE_BLOCKS_OIDC_CLIENT_ID=<oidc clientId>           # from blocks-iam-sso-oidc-configuration
VITE_BLOCKS_REDIRECT_URI=https://your-app.com/login/callback
```

`VITE_BLOCKS_PROJECT_KEY` is the project tenant id (public). `VITE_BLOCKS_OIDC_CLIENT_ID` and `VITE_BLOCKS_REDIRECT_URI` come from the configured OIDC client — the `redirectUri` must be one of its registered `redirectUris` (add `http://localhost:<port>/login/callback` there for local dev).

## Auth helper

```ts
// src/features/auth/sso.ts
const API = import.meta.env.VITE_BLOCKS_API_URL;
const PROJECT_KEY = import.meta.env.VITE_BLOCKS_PROJECT_KEY as string;
const CLIENT_ID = import.meta.env.VITE_BLOCKS_OIDC_CLIENT_ID as string;
const REDIRECT_URI = import.meta.env.VITE_BLOCKS_REDIRECT_URI as string;

// Step 1: fetch the authorize URL (do NOT redirect here). Step 2: navigate to it.
export async function startLogin() {
  const url =
    `${API}/iam/v4/idp/initiate` +
    `?x-blocks-key=${encodeURIComponent(PROJECT_KEY)}` +
    `&clientId=${encodeURIComponent(CLIENT_ID)}` +
    `&redirectUri=${encodeURIComponent(REDIRECT_URI)}`;

  // x-blocks-key must be sent in BOTH the query string (above) and the request header.
  const res = await fetch(url, { headers: { "x-blocks-key": PROJECT_KEY } }); // GET; initiate is a data call
  if (!res.ok) throw new Error(`initiate failed: ${res.status}`);
  const { redirect_uri } = (await res.json()) as { redirect_uri: string };
  if (!redirect_uri) throw new Error("initiate returned no redirect_uri");

  window.location.assign(redirect_uri); // Step 2: hand off to Blocks-hosted login
}

// Step 4: run on the callback route. The callback sets the session cookie.
export async function finishLogin(search: string) {
  const params = new URLSearchParams(search);
  const code = params.get("code");
  const state = params.get("state");
  if (!code || !state) throw new Error("missing code/state on callback");

  const res = await fetch(
    `${API}/iam/v4/idp/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
    { credentials: "include", headers: { "x-blocks-key": PROJECT_KEY } }, // cookie set on your domain; x-blocks-key required on every Blocks call
  );
  if (!res.ok) throw new Error(`callback failed: ${res.status}`);
}
```

## Login button (anywhere in the app)

```tsx
// src/features/auth/login-button.tsx
import { startLogin } from "./sso";

export function LoginButton() {
  return (
    <button
      className="rounded bg-primary px-4 py-2 text-primary-foreground"
      onClick={() => startLogin().catch((e) => console.error(e))}
    >
      Sign in
    </button>
  );
}
```

## Callback route

```tsx
// src/features/auth/callback-page.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { finishLogin } from "./sso";

export function CallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false); // guard against React 18/19 double-effect

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    finishLogin(window.location.search)
      .then(() => navigate("/", { replace: true })) // post-login landing
      .catch((e) => setError(String(e)));
  }, [navigate]);

  return error ? <p className="text-destructive">Login failed: {error}</p> : <p>Signing you in…</p>;
}
```

Mount it at the callback path:
```tsx
// router
{ path: "/login/callback", element: <CallbackPage /> }
```

## Notes

- The session is an HttpOnly cookie set by `/idp/callback`. Runtime API calls to Blocks services should be sent with `credentials: "include"` (or per your gateway setup) so the cookie rides along; you usually won't read the access token in JS.
- Keep `VITE_BLOCKS_REDIRECT_URI` exactly equal to a registered `redirectUri` and to your router's callback path.
- Provider not configured → `startLogin` throws on `initiate`. Set it up via **[blocks-iam-sso-oidc-configuration](../../blocks-iam-sso-oidc-configuration/SKILL.md)**.
