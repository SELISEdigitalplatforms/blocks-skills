# OIDC-only app login: one button, Blocks-hosted authorization-code flow

Use this when an app's **only** sign-in path is a single **Login** button — no
username/password form, no signup/activation screens in your UI. Clicking the button
sends the browser to Blocks IAM, which hosts credential entry, runs the OAuth 2.0
authorization-code flow (with PKCE), and returns a **secure HTTP-only session cookie**
to your app. Your frontend never handles passwords or raw tokens.

This is the hosted variant of "Blocks as the OIDC provider" driven by the `/api/idp/*`
routes and a self-referential `blocks-oidc` identity provider. For the lower-level
`authorize`/`token` code flow (your own OIDC client library), see
[sso-identity-providers.md](sso-identity-providers.md) Part B instead.

Preconditions:

- Setup (Part 1) needs an **admin Bearer token** + `x-blocks-key` (see `blocks-setup`).
- Runtime (Part 2) is browser-only and **must run over HTTPS even in local dev** — the
  session is a `Secure` cookie, so plain `http://localhost` silently drops it
  (`blocks-setup` → local-https-setup). The cookie is bound to the project's
  `cookieDomain`.
- Endpoints: [OidcClients](../endpoints.md#oidcclients),
  [Authentication](../endpoints.md#authentication) (`/api/auth/identity-providers*`),
  [Idp](../endpoints.md#idp), [IdpSession](../endpoints.md#idpsession).

---

## Part 1 — One-time setup (admin)

### 1. Register your app as an OIDC client — `POST /api/oidc-clients`

Upsert the client. Fields below are all in the swagger request schema
([OidcClients](../endpoints.md#oidcclients)):

```json
{
  "redirectUris": ["https://app.example.com"],
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
- `redirectUris` must list every origin the platform may return to (your app URL).
- The integration doc also sends `audience` and `projectKey` on this body; **neither is
  in the swagger request schema** — omit them unless your project rejects the request
  without them (then add and verify live).
- Response schema is **not documented in swagger** — inspect the live response.

### 2. Read back the client id + secret — `GET /api/oidc-clients`

Capture the generated **`clientId`** and **`clientSecret`** for the client you just
created (the integration doc returns them under `oIDCClientCredentials[]`; response
shape is undocumented — pin it from the live response). Store the secret securely — it
is server-side only and later single-client GETs exclude it.

### 3. Register a self-referential identity provider — `POST /api/auth/identity-providers`

This tells `/api/idp/initiate` to delegate to Blocks' own OIDC endpoints. Required
schema fields: `provider`, `providerType`, `clientId`, `clientSecret`,
`tokenEndpointAuthMethod`.

```json
{
  "provider": "sample-idp",
  "providerType": "blocks-oidc",
  "displayName": "Sign in",
  "clientId": "<clientId from step 2>",
  "clientSecret": "<clientSecret from step 2>",
  "wellKnownUrl": "https://iam.seliseblocks.com/<X_BLOCKS_KEY>/.well-known/openid-configuration",
  "tokenEndpointAuthMethod": "client_secret_basic",
  "scope": "openid",
  "redirectUris": ["https://app.example.com"],
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
- The `audience` field from the integration doc is **not** in the swagger schema — omit
  it. Response is undocumented — inspect live.

### 4. Confirm the provider — `GET /api/auth/identity-providers`

The provider should list back with resolved `authorizationUrl`, `tokenUrl`,
`userInfoUrl`, and `jwksUri` (response undocumented — inspect live). Keep the
`provider` name and the `clientId` — they drive the initiate call.

---

## Part 2 — Frontend implementation (the Login button)

### 5. Start the flow — full-page redirect to `GET /api/idp/initiate`

The button is a **top-level navigation** (`window.location.href = …`), not an
XHR/`fetch` — a redirect cannot carry headers, so the Blocks Key travels as a query
param here:

```
https://api.seliseblocks.com/iam/v4/idp/initiate?x-blocks-key=<X_BLOCKS_KEY>&clientId=<oidc-client-id>&redirectUri=https://app.example.com
```

- Swagger documents `clientId`, `redirectUri`, and `forwardedTo` for
  `GET /api/idp/initiate` ([Idp](../endpoints.md#idp)). The **`x-blocks-key` query
  param** comes from the platform integration doc (needed because a redirect can't send
  the header) — not in the swagger param table; verify it against your project.
- `clientId` is the OIDC client id from step 2. `redirectUri` is where Blocks returns
  the browser after authentication — it must be one of the client's `redirectUris`.

### 6. Blocks IAM authenticates and sets the session cookie

Blocks hosts the credential UI, authenticates the user, and runs the authorization-code
(PKCE) flow. The platform's `GET /api/idp/callback?code=…&state=…` receives the code,
exchanges it for tokens, **creates the session and sets a secure HTTP-only cookie**,
then redirects the browser back to your `redirectUri`. Your app does not implement the
callback exchange — it just lands back on your page, now carrying the session cookie.
(Both `/api/idp/initiate` and `/api/idp/callback` responses are undocumented in
swagger — inspect live if you need their bodies.)

### 7. Read the session (cookie-based, no bearer token)

Because auth is a cookie, send credentials with your requests instead of an
`Authorization` header:

- `GET /api/oidc/session` — returns `{ sessionId, accounts[], createdAt, … }` (typed in
  [IdpSession](../endpoints.md#idpsession)); `401`/`404` `ProblemDetails` when there is
  no session → show the Login button.
- `GET /api/auth/me` — OIDC UserInfo claims for the signed-in user (shape undocumented).

Call these with `credentials: "include"` so the browser attaches the cookie.

### 8. Log out — `POST /api/oidc/session/revoke`

Revokes the hosted session (all accounts in it) and clears the cookie. For multi-account
session management (`add`/`select`/list/remove accounts) see
[IdpSession](../endpoints.md#idpsession).

---

## Verify

- **Setup:** `GET /api/oidc-clients` shows your client with `isActive: true`,
  `useTokensCookie: true`, and your `redirectUris`; `GET /api/auth/identity-providers`
  shows the `blocks-oidc` provider with a resolved `authorizationUrl`/`tokenUrl`.
- **Login:** click the button once → land back on `redirectUri` →
  `GET /api/oidc/session` (with credentials) returns a session whose `accounts[]`
  includes your user, and `GET /api/auth/me` returns claims.
- **Cookie missing after redirect?** You are almost certainly on plain `http` in local
  dev, or the `cookieDomain` doesn't match — see `blocks-setup` (local-https-setup and
  the cookie-domain note).
