---
name: blocks-iam
description: "Application identity & access on SELISE Blocks (iam/v4 service). Use this skill for any task involving login pages, signup, account activation, password recovery/reset/change, token refresh, logout, MFA (TOTP, backup codes, MFA policy), user management, roles & permissions (RBAC), organizations and org switching, impersonation, sessions, SSO with external identity providers (Google, Azure AD, Okta, Apple), OIDC client registration, token introspection/revocation, or machine-to-machine client credentials. Trigger when the user mentions auth, authentication, sign in / sign up, JWT, access token, refresh token, IAM, IDP or blocks-idp (legacy v1 names — routes here now), user roles, RBAC, SSO, OIDC, MFA, 2FA, or 'sign in with Google/Microsoft' on SELISE Blocks. Owns /api/auth/*, /api/iam/*, /api/mfa/*, and /api/oidc* endpoints."
---

# Blocks IAM — Application Identity & Access

The `iam` service is the auth backbone for apps built on SELISE Blocks: embedded
(username/password) login, signup and activation, password lifecycle, MFA, users,
roles, permissions, organizations, impersonation, external-IdP SSO, and Blocks acting
as an OIDC provider for your own apps. If a task touches "who is this user and what
may they do," it belongs here. (The legacy v1 service was called IDP — all of those
routes are dead; everything now lives under `https://api.seliseblocks.com/iam/v4`.)

**Scope boundary:** this skill owns the lowercase REST app-auth surface
(`/api/auth/*`, `/api/iam/*`, `/api/mfa/*`, `/api/oidc*`). The PascalCase
`/api/Authentication/*` and `/api/Iam/*` controllers you may see in `blocks-monitor`
are the platform back-office API — never use them for application auth. Likewise the
PascalCase `/api/Mfa/*` controller is platform-level and canonical in `blocks-os`;
app MFA is the lowercase `/api/mfa/*` here.

## Prerequisites

- `blocks-setup` skill: env vars (`BLOCKS_API_URL`, `X_BLOCKS_KEY`,
  `BLOCKS_USERNAME`, `BLOCKS_PASSWORD`) and how to obtain/refresh tokens.
- Every request needs the `x-blocks-key: <X_BLOCKS_KEY>` header; authenticated
  operations also need `Authorization: Bearer <access_token>`.
- Login/refresh bodies carry no `client_id` or project identifier — the
  `x-blocks-key` header carries the project context. Where `client_id` does appear
  in this skill (`/api/oidc/*`, client credentials, identity-provider configs) it
  identifies an OAuth/OIDC client app, not the project.
- Captcha: when an endpoint accepts `captcha_code`/`captchaCode`, the captcha itself
  is issued/verified by the platform Captcha controller — see `blocks-os`.

## What's where

| I need to… | Go to |
|---|---|
| Build a login page (password, captcha, MFA challenge) | [flows/embedded-login.md](flows/embedded-login.md) |
| Sign up a user, activate the account, first login | [flows/signup-activation.md](flows/signup-activation.md) |
| Forgot / reset / change password | [flows/password-recovery.md](flows/password-recovery.md) |
| Switch organization; impersonate a user | [flows/org-switch-impersonation.md](flows/org-switch-impersonation.md) |
| Add "Sign in with Google/Azure/Okta/Apple"; run Blocks as OIDC provider | [flows/sso-identity-providers.md](flows/sso-identity-providers.md) |
| Machine-to-machine / service credentials; token introspection & revocation | [flows/machine-to-machine.md](flows/machine-to-machine.md) |
| Current user: OIDC claims vs profile | `GET /api/auth/me`, `GET /api/iam/me` — endpoints.md [#authentication](endpoints.md#authentication), [#iam](endpoints.md#iam) |
| List/search/create/update/deactivate users | endpoints.md [#iam](endpoints.md#iam) (`/api/iam/users*`) |
| Roles & permissions (RBAC) CRUD, assign permissions to a role | endpoints.md [#iam](endpoints.md#iam) (`/api/iam/roles*`, `/api/iam/permissions*`) |
| Organizations CRUD, org config, my organizations | endpoints.md [#iam](endpoints.md#iam) (`/api/iam/organizations*`) |
| MFA enrollment, status, backup codes, tenant MFA policy | endpoints.md [#mfa](endpoints.md#mfa) |
| Token lifetimes, lockout, activation/recovery URL settings | `GET/POST /api/auth/config` — endpoints.md [#authentication](endpoints.md#authentication) |
| OIDC discovery / JWKS for token validation | endpoints.md [#discovery](endpoints.md#discovery) |
| OIDC client apps (redirect URIs, PKCE, consent) | endpoints.md [#oidcclients](endpoints.md#oidcclients) |
| Hosted-IdP session, multi-account SSO session | endpoints.md [#idp](endpoints.md#idp), [#idpsession](endpoints.md#idpsession) |
| Sessions list, login history, user activity timeline | endpoints.md [#iam](endpoints.md#iam) (`/api/iam/sessions`, `/api/iam/history`, `/api/iam/users/timeline`) |
| React integration (client, hooks, auth store) | [references/react.md](references/react.md) |
| Env vars, getting the first token | `blocks-setup` skill |
| Captcha generation/verification | `blocks-os` skill |
| Sending custom mail / templates for auth emails | `blocks-utilities` skill |

## Key concepts

- **Project context** — carried by the `x-blocks-key` header on every call; token
  flows (`login`, `refresh`) take no project identifier in the body. `client_id`
  elsewhere means an OAuth/OIDC client app (`oidc/login`, `oidc/token`, oidc-clients).
- **Access + refresh token** — issued by `POST /api/auth/login`; lifetimes are
  configurable via `POST /api/auth/config`. Refresh with `POST /api/auth/refresh`.
- **User** — the IAM profile (`/api/iam/users*`, `/api/iam/me`). Distinct from
  `GET /api/auth/me`, which returns OIDC UserInfo *claims* for the current token.
- **Organization** — multi-tenant grouping. Tokens carry an org context; change it
  with `POST /api/auth/switch-org`. Roles/permissions are stored per org
  (`roles?: Record<string, string[]>` on `User`).
- **Role** — identified by `slug`, optionally hierarchical via `parentRoleSlug`.
  Permissions are attached to roles with `POST /api/iam/roles/assign-permissions`.
- **Permission** — named grant on a `resource` in a `resourceGroup`, with numeric
  `type` and `permissionSeverity` enums (member names not published — see contracts.md).
- **Identity provider** — an *external* OAuth2/OIDC provider (Google, Azure AD, Okta,
  Apple) registered under `/api/auth/identity-providers` so users can SSO *into* your app.
- **OIDC client** — the reverse direction: an app registered under `/api/oidc-clients`
  that uses *Blocks* as its OIDC provider (`/api/oidc/authorize`, `/api/oidc/token`).
- **Client credential** — a named machine-to-machine credential (`/api/auth/client-credentials`)
  with `roles` and `permissionsByOrg`; carries a `clientSecret`.
- **MFA** — per-user methods (TOTP via `/api/mfa/totp/*`, email via
  `/api/mfa/email/enable`, backup codes) plus a tenant-wide policy (`PUT /api/mfa/policy`).
  `mfa_type`/`userMfaType` is a numeric enum `0|1|2|3|4` — meanings unverified in swagger.
- **IDP session** — the hosted-login browser session (`/api/oidc/session*`) that can
  hold multiple signed-in accounts (multi-account SSO).

## Flows

| Flow | Use when |
|---|---|
| [embedded-login.md](flows/embedded-login.md) | Password login end-to-end: captcha branch, MFA branch, refresh, `/api/auth/me`, logout; plus TOTP enrollment |
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
  change-password, all `/api/iam/*`). One trap: **logout** takes `refreshToken`
  (camelCase) while **refresh** takes `refresh_token` (snake_case).
- **Response envelopes:** where documented — `BaseResponse { isSuccess, errors }`,
  mutations add `itemId` (`BaseMutationResponse`), lists use
  `{ data, errors, totalCount }`. The IdpSession endpoints return RFC 7807
  `ProblemDetails` on 4xx.
- **Undocumented responses are common** in the Authentication and Mfa controllers
  (`login`, `me`, `refresh`, all `/api/mfa/*`, …). endpoints.md flags each one —
  inspect the live response once and pin only the fields you use.
- **Integer enums have no member names in swagger** (`mfa_type`, `userMfaType`,
  `permissionSeverity`, `userCreationType`, …). Treat meanings as unverified;
  observe live values before branching on them.
- **Two pagination styles:** GET endpoints use `Page`, `PageSize`, `Sort.Property`,
  `Sort.IsDescending`, `Filter.*` query params (sessions, history, organizations);
  search endpoints are POST with `{ page, pageSize, sort, filter }` bodies (users,
  roles, permissions).
- `GET /api/iam/organizations` marks `Filter.Name` as **required** — pass it (empty
  string behavior unverified). `GET /api/iam/organizations/my` is the cheap
  "orgs I belong to" call.
- `GET /api/iam/users/timeline` is declared as a GET **with a JSON request body** —
  a swagger oddity; verify whether your HTTP client can send it, otherwise inspect
  live behavior.
- Several GETs declare an opaque optional `request` query string
  (`/api/auth/client-credentials`, `/api/auth/config`, `/api/iam/permissions/by-severity`,
  `/api/iam/resource-groups`) — safe to omit.
- `POST /api/auth/impersonate` has a field spelled `impersontingUserId` in the
  swagger (sic). Send it exactly like that.
- App auth vs back-office: PascalCase `Authentication`/`Iam` controllers live in
  `blocks-monitor` (platform back-office); PascalCase `/api/Mfa/*` lives in
  `blocks-os`. Apps use only the lowercase routes documented here.

## Files

- [endpoints.md](endpoints.md) — every endpoint with exact params and shapes (generated from swagger)
- [contracts.md](contracts.md) — TypeScript types (generated)
- [flows/](flows/) — step-by-step multi-endpoint procedures
- [references/react.md](references/react.md) — React 19 integration guide
