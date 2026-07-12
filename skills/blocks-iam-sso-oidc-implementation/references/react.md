# Frontend integration — Blocks SSO login (React 19 / Vite / React Router)

Wires the hosted authorization-code flow ([../flows/login-flow.md](../flows/login-flow.md)) into a React app: a login button that calls `initiate` then redirects, and a callback route that finalizes the session.

## Env

```bash
# The API host must be SAME-SITE with your app domain or the Blocks session cookies won't be
# stored/sent (the SSO callback sets Secure, domain-scoped cookies). Keep this default only if the
# app runs on *.seliseblocks.com. Otherwise use https://blocksapi.<your-registrable-domain>:
#   app abc.slsblx.com  → VITE_BLOCKS_API_URL=https://blocksapi.slsblx.com
#   app xyz.blx10.com   → VITE_BLOCKS_API_URL=https://blocksapi.blx10.com
# When wiring a new app on a custom domain, ASK THE USER which base URL to use (they may keep the default).
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

// Refresh the short-lived access token using the refresh token. Blocks rotates both
// tokens and sets them as cookies on success — call this when a request 401s, then retry.
// NOTE: the body is form-urlencoded (NOT JSON), and you must have the current refresh_token
// to send. If your session is purely HttpOnly-cookie-based, confirm how your project exposes
// the refresh token to the client before wiring this in.
export async function refreshSession(refreshToken: string) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: CLIENT_ID,
    refresh_token: refreshToken,
  });
  const res = await fetch(`${API}/iam/v4/oidc/token`, {
    method: "POST",
    credentials: "include", // so the rotated access_token/refresh_token cookies are set on your domain
    headers: {
      "x-blocks-key": PROJECT_KEY, // required on every Blocks call
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) throw new Error(`token refresh failed: ${res.status}`);
  // Expected OIDC token shape: { access_token, refresh_token, expires_in, token_type } — verify per project.
  return (await res.json()) as { access_token: string; refresh_token: string; expires_in?: number; token_type?: string };
}
```

The other Blocks feature clients (e.g. **blocks-iam-users**, **blocks-iam-organizations**) retry once on a 401 by calling `useAuthStore.getState().refreshSession()`. That store method is exactly this call — have your auth store hold the current refresh token, invoke `refreshSession(refreshToken)`, and persist the rotated `refresh_token` it returns so the next refresh uses the newest one.

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
- **Refresh** is `POST /iam/v4/oidc/token` with a **form-encoded** body (`grant_type=refresh_token`, `client_id`, `refresh_token`) + `x-blocks-key`; it rotates both tokens and re-sets the cookies. Wire it as the 401-retry path and always persist the newest `refresh_token`.
- Keep `VITE_BLOCKS_REDIRECT_URI` exactly equal to a registered `redirectUri` and to your router's callback path.
- Provider not configured → `startLogin` throws on `initiate`. Set it up via **[blocks-iam-sso-oidc-configuration](../../blocks-iam-sso-oidc-configuration/SKILL.md)**.
