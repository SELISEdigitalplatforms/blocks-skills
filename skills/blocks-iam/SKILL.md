---
name: blocks-iam
description: "Application identity & access on SELISE Blocks (iam/v4 service). Use this skill for any task involving login pages, signup, account activation, password recovery/reset/change, token refresh, logout, MFA (TOTP, backup codes, MFA policy), user management, roles & permissions (RBAC), organizations and org switching, impersonation, sessions, SSO with external identity providers (Google, Azure AD, Okta, Apple), single-button Blocks-hosted OIDC login (authorization-code flow with a cookie session, no password form), OIDC client registration, token introspection/revocation, or machine-to-machine client credentials. Trigger when the user mentions auth, authentication, sign in / sign up, login button, JWT, access token, refresh token, IAM, IDP or blocks-idp (legacy v1 names — routes here now), user roles, RBAC, SSO, OIDC, blocks-oidc, idp/initiate, hosted login, MFA, 2FA, or 'sign in with Google/Microsoft' on SELISE Blocks. Owns /auth/*, /iam/*, /mfa/*, and /oidc* endpoints."
---

# Blocks IAM — Application Identity & Access

The `iam` service is the auth backbone for apps built on SELISE Blocks: embedded
(username/password) login, signup and activation, password lifecycle, MFA, users,
roles, permissions, organizations, impersonation, external-IdP SSO, and Blocks acting
as an OIDC provider for your own apps. If a task touches "who is this user and what
may they do," it belongs here. (The legacy v1 service was called IDP — all of those
routes are dead; everything now lives under `https://api.seliseblocks.com/iam/v4`.)

**Scope boundary:** this skill owns the lowercase REST app-auth surface
(`/auth/*`, `/iam/*`, `/mfa/*`, `/oidc*`). The PascalCase
`/Authentication/*` and `/Iam/*` controllers you may see in `blocks-monitor`
are the platform back-office API — never use them for application auth. Likewise the
PascalCase `/Mfa/*` controller is platform-level and canonical in `blocks-os`;
app MFA is the lowercase `/mfa/*` here.

## Prerequisites

- `blocks-setup` skill: env vars (`BLOCKS_API_URL`, `X_BLOCKS_KEY`,
  `BLOCKS_USERNAME`, `BLOCKS_PASSWORD`) and how to obtain/refresh tokens.
- Every request needs the `x-blocks-key: <X_BLOCKS_KEY>` header; authenticated
  operations also need `Authorization: Bearer <access_token>`.
- Login/refresh bodies carry no `client_id` or project identifier — the
  `x-blocks-key` header carries the project context. Where `client_id` does appear
  in this skill (`/oidc/*`, client credentials, identity-provider configs) it
  identifies an OAuth/OIDC client app, not the project.
- Captcha: when an endpoint accepts `captcha_code`/`captchaCode`, the captcha itself
  is issued/verified by the platform Captcha controller — see `blocks-os`.

## What's where

| I need to… | Go to |
|---|---|
| **App auth with a single Login button** (Blocks-hosted OIDC, cookie session, no password form) | [flows/oidc-login.md](flows/oidc-login.md) |
| Build a login page (password, captcha, MFA challenge) | [flows/embedded-login.md](flows/embedded-login.md) |
| Sign up a user, activate the account, first login | [flows/signup-activation.md](flows/signup-activation.md) |
| Forgot / reset / change password | [flows/password-recovery.md](flows/password-recovery.md) |
| Switch organization; impersonate a user | [flows/org-switch-impersonation.md](flows/org-switch-impersonation.md) |
| Add "Sign in with Google/Azure/Okta/Apple"; run Blocks as OIDC provider | [flows/sso-identity-providers.md](flows/sso-identity-providers.md) |
| Machine-to-machine / service credentials; token introspection & revocation | [flows/machine-to-machine.md](flows/machine-to-machine.md) |
| Current user: OIDC claims vs profile | `GET /auth/me`, `GET /iam/me` — endpoints.md [#authentication](endpoints.md#authentication), [#iam](endpoints.md#iam) |
| List/search/create/update/deactivate users | endpoints.md [#iam](endpoints.md#iam) (`/iam/users*`) |
| Roles & permissions (RBAC) CRUD, assign permissions to a role | endpoints.md [#iam](endpoints.md#iam) (`/iam/roles*`, `/iam/permissions*`) |
| Organizations CRUD, org config, my organizations | endpoints.md [#iam](endpoints.md#iam) (`/iam/organizations*`) |
| MFA enrollment, status, backup codes, tenant MFA policy | endpoints.md [#mfa](endpoints.md#mfa) |
| Token lifetimes, lockout, activation/recovery URL settings | `GET/POST /auth/config` — endpoints.md [#authentication](endpoints.md#authentication) |
| OIDC discovery / JWKS for token validation | endpoints.md [#discovery](endpoints.md#discovery) |
| OIDC client apps (redirect URIs, PKCE, consent) | endpoints.md [#oidcclients](endpoints.md#oidcclients) |
| Hosted-IdP session, multi-account SSO session | endpoints.md [#idp](endpoints.md#idp), [#idpsession](endpoints.md#idpsession) |
| Sessions list, login history, user activity timeline | endpoints.md [#iam](endpoints.md#iam) (`/iam/sessions`, `/iam/history`, `/iam/users/timeline`) |
| React integration (client, hooks, auth store) | [references/react.md](references/react.md) |
| Env vars, getting the first token | `blocks-setup` skill |
| Captcha generation/verification | `blocks-os` skill |
| Sending custom mail / templates for auth emails | `blocks-utilities` skill |

## Key concepts

- **Project context** — carried by the `x-blocks-key` header on every call; token
  flows (`login`, `refresh`) take no project identifier in the body. `client_id`
  elsewhere means an OAuth/OIDC client app (`oidc/login`, `oidc/token`, oidc-clients).
- **Access + refresh token** — issued by `POST /auth/login`; lifetimes are
  configurable via `POST /auth/config`. Refresh with `POST /auth/refresh`.
- **User** — the IAM profile (`/iam/users*`, `/iam/me`). Distinct from
  `GET /auth/me`, which returns OIDC UserInfo *claims* for the current token.
- **Organization** — multi-tenant grouping. Tokens carry an org context; change it
  with `POST /auth/switch-org`. Roles/permissions are stored per org
  (`roles?: Record<string, string[]>` on `User`).
- **Role** — identified by `slug`, optionally hierarchical via `parentRoleSlug`.
  Permissions are attached to roles with `POST /iam/roles/assign-permissions`.
- **Permission** — named grant on a `resource` in a `resourceGroup`, with numeric
  `type` and `permissionSeverity` enums (member names not published — see contracts.md).
- **Identity provider** — an *external* OAuth2/OIDC provider (Google, Azure AD, Okta,
  Apple) registered under `/auth/identity-providers` so users can SSO *into* your app.
- **OIDC client** — the reverse direction: an app registered under `/oidc-clients`
  that uses *Blocks* as its OIDC provider (`/oidc/authorize`, `/oidc/token`).
- **Hosted OIDC login** — the simplest app-auth path: a single Login button fires an
  HTTP API call to `/idp/initiate`, the SPA navigates to the redirect URL the response
  contains, Blocks hosts credential entry and the authorization-code flow, and
  `/idp/callback` sets a **secure HTTP-only session cookie** (no password form, no raw
  tokens in the browser). Enabled by a `blocks-oidc` identity provider that points Blocks
  at itself, plus an OIDC client with `useTokensCookie: true`. See
  [flows/oidc-login.md](flows/oidc-login.md). Cookie-based → browser calls send
  `credentials: "include"` and require HTTPS even in local dev (`blocks-setup`).
- **Client credential** — a named machine-to-machine credential (`/auth/client-credentials`)
  with `roles` and `permissionsByOrg`; carries a `clientSecret`.
- **MFA** — per-user methods (TOTP via `/mfa/totp/*`, email via
  `/mfa/email/enable`, backup codes) plus a tenant-wide policy (`PUT /mfa/policy`).
  `mfa_type`/`userMfaType` is a numeric enum `0|1|2|3|4` — meanings unverified in swagger.
- **IDP session** — the hosted-login browser session (`/oidc/session*`) that can
  hold multiple signed-in accounts (multi-account SSO).

## Flows

| Flow | Use when |
|---|---|
| [oidc-login.md](flows/oidc-login.md) | Single Login button → SPA `fetch`es `/idp/initiate` → navigates to returned redirect URL → Blocks-hosted OIDC authorization-code flow → `/idp/callback` sets a cookie session. Setup (OIDC client + `blocks-oidc` identity provider) and frontend (`startLogin()` + cookie-based sessionFetch). No password/signup UI in your app |
| [embedded-login.md](flows/embedded-login.md) | Password login end-to-end: captcha branch, MFA branch, refresh, `/auth/me`, logout; plus TOTP enrollment |
| [signup-activation.md](flows/signup-activation.md) | Self-service signup → activation email → set password → first login (and admin-created users) |
| [password-recovery.md](flows/password-recovery.md) | Forgot-password recovery + reset, and authenticated password change |
| [org-switch-impersonation.md](flows/org-switch-impersonation.md) | Multi-org context switching; admin impersonates a user and reverts |
| [sso-identity-providers.md](flows/sso-identity-providers.md) | Register external IdPs, surface them via login-options, social login round trip; Blocks as OIDC provider |
| [machine-to-machine.md](flows/machine-to-machine.md) | Service-to-service credentials, user codes, token introspection/revocation |

## Conventions & gotchas

- **Headers:** `x-blocks-key` on every call; `Bearer` token on everything except the
  public endpoints (`login`, `login-options`, `signup`, `activate`, `recover`,
  `reset-password`, discovery/JWKS).
- **snake_case vs camelCase — copy field names verbatim from endpoints.md, never
  "normalize" them.** Token-flow bodies are snake_case: `username`,
  `password`, `captcha_code`, `mfa_id`, `mfa_code`, `refresh_token`,
  `organization_id`, `targeted_tenant_id` (login, refresh, switch-org, impersonate,
  impersonation/stop, social/callback, oidc/login). Account-lifecycle and admin
  bodies are camelCase: `captchaCode`, `mailPurpose`, `firstName`, `newPassword`,
  `logoutFromAllDevices`, etc. (signup, activate, recover, reset-password,
  change-password, all `/iam/*`). One trap: **logout** takes `refreshToken`
  (camelCase) while **refresh** takes `refresh_token` (snake_case).
- **Response envelopes:** where documented — `BaseResponse { isSuccess, errors }`,
  mutations add `itemId` (`BaseMutationResponse`), lists use
  `{ data, errors, totalCount }`. The IdpSession endpoints return RFC 7807
  `ProblemDetails` on 4xx.
- **Undocumented responses are common** in the Authentication and Mfa controllers
  (`login`, `me`, `refresh`, all `/mfa/*`, …). endpoints.md flags each one —
  inspect the live response once and pin only the fields you use.
- **Integer enums have no member names in swagger** (`mfa_type`, `userMfaType`,
  `permissionSeverity`, `userCreationType`, …). Treat meanings as unverified;
  observe live values before branching on them.
- **Two pagination styles:** GET endpoints use `Page`, `PageSize`, `Sort.Property`,
  `Sort.IsDescending`, `Filter.*` query params (sessions, history, organizations);
  search endpoints are POST with `{ page, pageSize, sort, filter }` bodies (users,
  roles, permissions).
- `GET /iam/organizations` marks `Filter.Name` as **required** — pass it (empty
  string behavior unverified). `GET /iam/organizations/my` is the cheap
  "orgs I belong to" call.
- `GET /iam/users/timeline` is declared as a GET **with a JSON request body** —
  a swagger oddity; verify whether your HTTP client can send it, otherwise inspect
  live behavior.
- Several GETs declare an opaque optional `request` query string
  (`/auth/client-credentials`, `/auth/config`, `/iam/permissions/by-severity`,
  `/iam/resource-groups`) — safe to omit.
- `POST /auth/impersonate` has a field spelled `impersontingUserId` in the
  swagger (sic). Send it exactly like that.
- App auth vs back-office: PascalCase `Authentication`/`Iam` controllers live in
  `blocks-monitor` (platform back-office); PascalCase `/Mfa/*` lives in
  `blocks-os`. Apps use only the lowercase routes documented here.

## Files

- [endpoints.md](endpoints.md) — every endpoint with exact params and shapes (generated from swagger)
- [contracts.md](contracts.md) — TypeScript types (generated)
- [flows/](flows/) — step-by-step multi-endpoint procedures
- [references/react.md](references/react.md) — React 19 integration guide
