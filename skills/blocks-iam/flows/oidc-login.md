# OIDC-only app login: one button, Blocks-hosted authorization-code flow

Use this when an app's **only** sign-in path is a single **Login** button — no
username/password form, no signup/activation screens in your UI. Clicking the button
issues an HTTP API call to Blocks IAM, which returns the URL of a Blocks-hosted login
page. The SPA navigates the browser there; Blocks hosts credential entry, runs the
OAuth 2.0 authorization-code flow (with PKCE), and returns a **secure HTTP-only
session cookie** to your app. Your frontend never handles passwords or raw tokens.

This is the hosted variant of "Blocks as the OIDC provider" driven by the `/idp/*`
routes and a self-referential `blocks-oidc` identity provider. For the lower-level
`authorize`/`token` code flow (your own OIDC client library), see
[sso-identity-providers.md](sso-identity-providers.md) Part B instead.

Preconditions:

- Setup (Part 1) needs an **admin Bearer token** + `x-blocks-key` (see `blocks-setup`).
  For an agent, sign in via the agent-only endpoint first if you don't yet know which
  project to work in — see `blocks-setup` SKILL → *Agent-only login — enumerating
  projects*.
- Runtime (Part 2) is browser-only and **must run over HTTPS even in local dev** — the
  session is a `Secure` cookie, so plain `http://localhost` silently drops it
  (`blocks-setup` → local-https-setup). The cookie is bound to the project's
  `cookieDomain`.
- Endpoints: [OidcClients](../endpoints.md#oidcclients),
  [Authentication](../endpoints.md#authentication) (`/auth/identity-providers*`),
  [Idp](../endpoints.md#idp), [IdpSession](../endpoints.md#idpsession).

---

## Part 1 — One-time setup (admin)

The order is **decide → check → create only if missing**. Don't blindly POST; an
existing config from a prior run is cheap to reuse and expensive to duplicate (each
`POST /oidc-clients` upsert may rotate the secret; each `POST /auth/identity-providers`
for the same `provider` name overwrites it).

### 0. Decide & check first — do you already have an OIDC client + identity provider?

You need three values in hand to implement the runtime flow:

1. **`clientId`** — the OIDC client id of your app (registered under
   `GET /oidc-clients`).
2. **`redirectUri`** — the app URL Blocks returns the browser to after authentication
   (must be registered in the client's `redirectUris`).
3. The **`provider`** name of a `blocks-oidc` identity provider pointing at that
   client (registered under `GET /auth/identity-providers`).

**Ask the user first.** Before touching the API, ask the user:

- *"Do you already have an OIDC client registered in this project for this app? If so,
  give me the `clientId` and the redirect URI it was registered with. If not, I'll
  register one and tell you what to put in your frontend."*

If the user supplies the `clientId` and `redirectUri`, jump to step 4 (`GET
/auth/identity-providers`) to confirm a `blocks-oidc` provider for that client exists;
create one (step 3) only if not. Skip step 1 — the client is already registered.

**If the user does not know — fetch and discover.** With the admin Bearer token +
`x-blocks-key`:

```bash
# List existing OIDC clients (secret NOT included in the response)
curl -s "$BLOCKS_API_URL/iam/v4/oidc-clients" \
  -H "x-blocks-key: $X_BLOCKS_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# List existing identity providers (secret NOT included in the response)
curl -s "$BLOCKS_API_URL/iam/v4/auth/identity-providers" \
  -H "x-blocks-key: $X_BLOCKS_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

Both responses are **not documented in swagger** — inspect the live payload before
relying on field names. The standard pattern is an array of clients/providers; pick
the one whose `redirectUris` / `clientDisplayName` matches the app you are wiring up.

- **Match found** → keep its `clientId` and `redirectUris[0]`, jump to Part 2. If a
  matching `blocks-oidc` provider is already in the list with the same `clientId`,
  you are done with Part 1 entirely.
- **No match** → fall through to step 1 (register the OIDC client) and step 3
  (register the identity provider). Do **not** create a duplicate client when one
  exists; pick the existing one and add only what is missing.

> **Why ask before fetching?** Many projects already have a client registered from a
> previous build or by another team member. Calling `POST /oidc-clients` to "create"
> is an **upsert** — re-running it can rotate the `clientSecret` and break apps
> already in production using the old one. The check-first pattern avoids that.

### 1. Register your app as an OIDC client — `POST /oidc-clients`

> **Run this step only if step 0 found no matching client.** Otherwise skip to
> step 3 (or straight to Part 2 if the identity provider is also already in place).

Upsert the client. Fields below are all in the swagger request schema
([OidcClients](../endpoints.md#oidcclients)):

```json
{
  "redirectUris": ["https://app.example.com/auth/callback"],
  "scope": "openid",
  "allowedResponseTypes": ["code"],
  "requirePkce": true,
  "isAutoRedirect": true,
  "isActive": true,
  "useTokensCookie": true,
  "allowedServiceAccessResources": [
    "blocks-iam", "blocks-data", "blocks-utilities", "blocks-os",
    "blocks-monitor", "blocks-release", "blocks-localization"
  ],
  "clientDisplayName": "My App",
  "clientBrandColor": "#124091"
}
```

- **`useTokensCookie: true`** is what makes login cookie-based (the platform sets the
  session cookie instead of returning tokens to the browser) — keep it `true` for this
  flow.
- `redirectUris` must list every origin the platform may return to (your app URL +
  the `/auth/callback` path the SPA lands on). **The redirect URI you use in the
  frontend must be one of these strings exactly** — including scheme, host, port, and
  trailing path.
- Response schema is **not documented in swagger** — inspect the live response. Capture
  the returned `clientId` and `clientSecret` for the next step. Later single-client GETs
  exclude the secret.

### 2. Read back the client id + secret — `GET /oidc-clients`

Capture the generated **`clientId`** and **`clientSecret`** for the client you just
created (the integration doc returns them under `oIDCClientCredentials[]`; response
shape is undocumented — pin it from the live response). Store the secret securely — it
is server-side only.

### 3. Register a self-referential identity provider — `POST /auth/identity-providers`

> **Run this step only if step 0 found no `blocks-oidc` provider for the chosen
> client.** Otherwise skip to Part 2.

This tells `/idp/initiate` to delegate to Blocks' own OIDC endpoints. Required
schema fields: `provider`, `providerType`, `clientId`, `clientSecret`,
`tokenEndpointAuthMethod`.

```json
{
  "provider": "sample-idp",
  "providerType": "blocks-oidc",
  "displayName": "Sign in",
  "clientId": "<clientId from step 1 or step 0>",
  "clientSecret": "<clientSecret from step 1>",
  "wellKnownUrl": "https://iam.seliseblocks.com/<X_BLOCKS_KEY>/.well-known/openid-configuration",
  "tokenEndpointAuthMethod": "client_secret_basic",
  "scope": "openid",
  "redirectUris": ["https://app.example.com/auth/callback"],
  "isActive": true,
  "requirePkce": false,
  "initialRoles": ["user"],
  "initialPermissions": []
}
```

- `providerType: "blocks-oidc"` marks this as Blocks-hosting-itself (distinct from the
  `"social"` external providers in [sso-identity-providers.md](sso-identity-providers.md)).
- `wellKnownUrl` uses the hosted IAM host with your **Blocks Key as the path segment**
  (per the integration doc). The same discovery document is also reachable at
  `GET https://api.seliseblocks.com/iam/v4/{tenant_id}/.well-known/openid-configuration`
  ([Discovery](../endpoints.md#discovery)).
- `initialRoles`/`initialPermissions` are granted to users provisioned just-in-time on
  first login.
- `POST` is **upsert by `provider` name** — re-posting the same `provider` overwrites
  the existing record rather than creating a duplicate. Pick a stable `provider` name
  per app.
- Response is undocumented — inspect live.

### 4. Confirm the provider — `GET /auth/identity-providers`

The provider should list back with resolved `authorizationUrl`, `tokenUrl`,
`userInfoUrl`, and `jwksUri` (response undocumented — inspect live). Keep the
`provider` name and the `clientId` — they drive the initiate call in Part 2.

---

## Part 2 — Frontend implementation (the Login button)

> **Before writing any frontend code, confirm the three values from Part 1 are
> finalized:** `clientId` (the OIDC client id), `redirectUri` (the exact URL registered
> in the client's `redirectUris` array, e.g. `https://app.example.com/auth/callback`),
> and the `provider` name (the `blocks-oidc` identity provider). The frontend reads
> them from a config (env, runtime config endpoint, or a constant). Without these,
> the runtime call below will not resolve.

### 5. Start the flow — HTTP API call to `GET /idp/initiate`

The button fires a `fetch` call from the SPA. The platform returns the URL the browser
should navigate to (Blocks IAM's login page). The SPA then does
`window.location.href = <that URL>`.

> **Why fetch instead of `window.location.href = <initiateUrl>`?** A top-level
> navigation to `/idp/initiate` directly would make the browser address bar show the
> initiate URL and skip the SPA's error handling. The fetch-and-navigate pattern keeps
> the button click observable (spinner, error toast) and lets you react to non-2xx
> responses.

Request:

```
GET https://api.seliseblocks.com/iam/v4/idp/initiate
    ?x-blocks-key=<X_BLOCKS_KEY>
    &clientId=<OIDC clientId>
    &redirectUri=<app origin>/auth/callback
```

- Query params are documented in swagger for `GET /idp/initiate` ([Idp](../endpoints.md#idp)):
  `clientId`, `redirectUri`, `forwardedTo`. The **`x-blocks-key` query param** comes
  from the platform integration doc (needed because a fetch call without browser nav
  can't send the header) — not in the swagger param table; verify it against your
  project.
- `clientId` is the OIDC client id from step 1.
- `redirectUri` is where Blocks returns the browser after authentication — it must be
  one of the client's `redirectUris`.

Response (200):

```json
{
  "redirect_uri": "https://iam.seliseblocks.com/<X_BLOCKS_KEY>/oauth2/authorize?response_type=code&client_id=…&redirect_uri=…&state=…&code_challenge=…&code_challenge_method=S256&scope=openid"
}
```

The single canonical field name is `redirect_uri` (snake_case). Older docs and
sample code reference variants like `redirectUrl`, `url`, `authorizationUrl`,
`authorization_url`, `authorizeUrl`, `authorize_url` — these are **not** what the
live `iam/v4` returns. Treat `redirect_uri` as authoritative.

The platform may instead issue a **30x redirect with a `Location` header** —
handle both shapes.

The SPA extracts the URL from the `redirect_uri` field and does
`window.location.href = redirect_uri` to navigate the browser to Blocks IAM.

### 6. Blocks IAM authenticates and sets the session cookie

Blocks hosts the credential UI, authenticates the user, and runs the authorization-code
(PKCE) flow. The platform's `GET /idp/callback?code=…&state=…` receives the code,
exchanges it for tokens, **creates the session and sets a secure HTTP-only cookie**,
then redirects the browser back to your `redirectUri`. Your app does not implement the
callback exchange — it just lands back on your page, now carrying the session cookie.

### 7. Read the session (cookie-based, no bearer token)

Because auth is a cookie, send credentials with your requests instead of an
`Authorization` header:

- `GET /oidc/session` — returns `{ sessionId, accounts[], createdAt, … }` (typed in
  [IdpSession](../endpoints.md#idpsession)); `401`/`404` `ProblemDetails` when there is
  no session → show the Login button.
- `GET /auth/me` — OIDC UserInfo claims for the signed-in user (shape undocumented).

Call these with `credentials: "include"` so the browser attaches the cookie.

### 8. Log out — `POST /oidc/session/revoke`

Revokes the hosted session (all accounts in it) and clears the cookie. For multi-account
session management (`add`/`select`/list/remove accounts) see
[IdpSession](../endpoints.md#idpsession).

---

## Verify

- **Setup:** `GET /oidc-clients` shows your client with `isActive: true`,
  `useTokensCookie: true`, and your `redirectUris`; `GET /auth/identity-providers`
  shows the `blocks-oidc` provider with a resolved `authorizationUrl`/`tokenUrl`.
- **Login:** click the button once → SPA fetch hits `/idp/initiate` → SPA navigates
  to Blocks IAM → land back on `redirectUri` → `GET /oidc/session` (with credentials)
  returns a session whose `accounts[]` includes your user, and `GET /auth/me` returns
  claims.
- **Toast "OIDC initiate response did not contain a redirect URL"?** Open
  DevTools → Console; the SPA logs the raw response. Confirm whether the field is
  `redirect_uri` (most common) or one of the variants listed above; the SPA accepts
  all of them but you may want to confirm naming with your platform version.
- **Cookie missing after redirect?** You are almost certainly on plain `http` in local
  dev, or the `cookieDomain` doesn't match — see `blocks-setup` (local-https-setup and
  the cookie-domain note).