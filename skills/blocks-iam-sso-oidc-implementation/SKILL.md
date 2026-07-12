---
name: blocks-iam-sso-oidc-implementation
description: "Implement SELISE Blocks SSO / OIDC login in a frontend codebase — the authorization-code flow via `/iam/v4/idp/initiate` → redirect to `iam.seliseblocks.com` → `/iam/v4/idp/callback` (which sets the session cookie). It also covers renewing the browser session via `POST /iam/v4/oidc/token` when the project supports cookie-based refresh or exposes a refresh token to the client. Use whenever the user wants to ADD login/sign-in to a Blocks app, wire up SSO/OIDC on the client, build a login button, handle the OIDC redirect/callback, or keep the session alive after SSO — 'add a login button', 'implement Blocks SSO in React', 'handle the OIDC callback', 'wire up sign-in with Blocks', 'silently renew the Blocks session'. Do NOT implement username/password login directly — Blocks login goes through this hosted authorization-code flow. The project's OIDC provider must already be configured (blocks-iam-sso-oidc-configuration); this skill is the app-side wiring."
---

# Blocks IAM — SSO / OIDC Implementation (frontend)

Wire authorization-code SSO into an app. **Don't implement username/password login yourself** — Blocks login is a hosted authorization-code flow: your app asks IAM for an authorize URL, redirects the browser to the Blocks-hosted login, and handles the callback that sets the session cookie.

Precondition: the project has a configured `blocks-oidc` identity provider + OIDC client — set up with **[blocks-iam-sso-oidc-configuration](../blocks-iam-sso-oidc-configuration/SKILL.md)**. From there you need the **`clientId`**, the **project key** (the project tenant id, used as `x-blocks-key`), and the **`redirectUri`** (your app's callback, matching what was registered).

## The flow (verified live)

1. User clicks **Login**. The app calls, server-agnostic, **without redirecting yet** — pass `x-blocks-key` in **both** the query string and the request header:
   ```
   GET https://api.seliseblocks.com/iam/v4/idp/initiate?x-blocks-key=<PROJECT_KEY>&clientId=<OIDC clientId>&redirectUri=<your callback>
   Header: x-blocks-key: <PROJECT_KEY>
   ```
   Response: `{ "redirect_uri": "https://iam.seliseblocks.com/api/oidc/authorize?...&response_type=code&scope=openid&state=...&nonce=...&code_challenge=...&code_challenge_method=..." }`. Blocks builds the full authorize URL (incl. PKCE) for you.
2. The app **redirects the browser** to that `redirect_uri`. The user authenticates on `iam.seliseblocks.com` (Blocks-hosted).
3. IAM redirects back to your registered `redirectUri` with `?code=...&state=...`.
4. On the callback route, the app calls **`GET /iam/v4/idp/callback?code=...&state=...`** — this **sets the session cookie**. The user is now logged in.

See [flows/login-flow.md](flows/login-flow.md) for the step-by-step and [references/react.md](references/react.md) for React wiring.

## Key points

- **`x-blocks-key` here = the project key** (the project's tenant id, what the portal exposes as `BLOCKS_X_BLOCKS_KEY`) — the same value the app uses to reach any Blocks service at runtime. This is a public identifier, safe to ship in the client.
- **Send `x-blocks-key` in both places on `initiate`** — as the `x-blocks-key` **query parameter** *and* as the `x-blocks-key` **request header**, with the same value. Omitting either can cause the call to fail.
- **`initiate` is a fetch, not a navigation.** Call it, read `redirect_uri` from the JSON, *then* set `window.location`. Don't point the browser at `/idp/initiate` directly.
- **The callback sets a cookie**, so the session lives in an HttpOnly cookie the browser sends automatically — you generally won't hold the access token in JS. Ensure requests are same-site / `credentials: "include"` as your setup requires, and that `cookieDomain` (from the project config) matches your app domain.
- **The API base URL must be same-site with your app domain, or the cookie is never stored.** The callback sets a Secure, domain-scoped cookie; the browser only keeps and re-sends it when your API calls go to a host under the **same registrable domain** as the app. So the default `https://api.seliseblocks.com` works **only** for apps on `*.seliseblocks.com`. On a custom domain, point the frontend at **`https://blocksapi.<your-registrable-domain>`** instead — app `abc.slsblx.com` → `https://blocksapi.slsblx.com`, app `xyz.blx10.com` → `https://blocksapi.blx10.com`. When wiring an app on a custom domain, **ask the user** which base URL to use (they may keep the default). This is the `VITE_BLOCKS_API_URL` value in [references/react.md](references/react.md).
- **Check "am I logged in?" with `GET /iam/v4/iam/me`** (see **[blocks-iam-users](../blocks-iam-users/SKILL.md)**). Because auth is cookie-based, call it **on page load** to determine session state, and again **right after the callback succeeds** to load the freshly signed-in user — a 200 means logged in, a 401 means not. It needs no JS-held token, just `credentials: "include"`.
- **Refresh via `POST /iam/v4/oidc/token`, but do not assume JS can read a refresh token.** The hosted SSO session is normally cookie-based and the refresh token may be HttpOnly. First implement refresh as a cookie/session call: `credentials: "include"`, `x-blocks-key`, `Content-Type: application/x-www-form-urlencoded`, `grant_type=refresh_token`, and `client_id`. Add a `refresh_token` form field only if your project explicitly returns/exposes one to JavaScript. On success Blocks rotates cookies. Use it as the 401-retry path (refresh, then retry once). See [flows/login-flow.md](flows/login-flow.md) step 5.
- **`redirectUri` must match** the value registered on the OIDC client/provider exactly, or IAM rejects the authorize request.
- **`state`/`nonce`/PKCE** are generated by Blocks in step 1 and validated by Blocks — you pass `state` back on the callback; you don't manage the `code_verifier` yourself in this hosted flow.

## Gotchas

- Not configured yet? A missing/inactive `blocks-oidc` provider makes `initiate` fail — configure it first (**[blocks-iam-sso-oidc-configuration](../blocks-iam-sso-oidc-configuration/SKILL.md)**).
- **Local dev needs HTTPS on the project domain, not `localhost`.** The callback sets a Secure, domain-scoped cookie the browser won't store on `http://localhost` — run the app over HTTPS on its real domain with a local cert: **[blocks-frontend-local-https](../blocks-frontend-local-https/SKILL.md)**. The `redirectUri` (e.g. `https://myapp.seliseblocks.com:5173/login/callback`) must be one of the client's registered `redirectUris`; add it during configuration.
- **Logout** for this hosted flow is the cookie/session call `POST /iam/v4/auth/Logout` (body `{}`, `credentials: "include"`) — it revokes and clears the session cookies this flow sets. See **[blocks-iam-account](../blocks-iam-account/SKILL.md)**.
- **Refresh** uses `POST /iam/v4/oidc/token` (form-encoded, `grant_type=refresh_token`) — see the key point above and [flows/login-flow.md](flows/login-flow.md) step 5. This is distinct from direct username/password token refresh; the hosted OIDC flow refreshes at `/oidc/token` and should remain cookie/session oriented unless the project exposes a readable refresh token.
