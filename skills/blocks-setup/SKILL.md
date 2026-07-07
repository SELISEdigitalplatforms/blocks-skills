---
name: blocks-setup
description: "Use this skill for any task involving getting started with SELISE Blocks — creating a project in the OS portal, copying the Blocks Key, setting up environments, writing .env files, serving local dev over HTTPS (openssl/SSL certificates), obtaining an access token via login, entering a project context via tenant impersonation, refreshing tokens, calling /auth/me, logging out, or debugging 401/403/blocks-key/cookie errors. Trigger when the user mentions setup, bootstrap, onboarding, environment variables, BLOCKS_API_URL, X_BLOCKS_KEY, x-blocks-key, blocks key, tenant id, impersonate, https, ssl, certificate, openssl, cookie domain, login, access token, refresh token, bearer token, authentication headers, or 'how do I connect to Blocks'. Every other blocks-* skill points here for prerequisites; this is the first skill to read when starting a SELISE Blocks app."
---

# SELISE Blocks — Project Setup & Authentication Bootstrap

This is the bootstrap skill for the SELISE Blocks platform (v4 API). It covers everything you need
before any other skill is usable: OS portal prerequisites, environment variable conventions,
obtaining and refreshing access tokens, and the auth headers every request needs. All other
`blocks-*` skills assume the setup described here is done.

> **URL pattern (read first — applies to every service in this workspace).**
> Every endpoint is `https://api.seliseblocks.com/{service-name}/v4/{endpoint}`.
> Do **NOT** prefix `{endpoint}` with `/api/`. Example: `POST {iam-base}/auth/login` hits
> `https://api.seliseblocks.com/iam/v4/auth/login` — never `…/iam/v4/api/auth/login`. The swagger
> sources carry an `/api/` `basePath` that the gateway strips; the live URL does **not** include
> that segment. Every endpoint reference in every `blocks-*` skill follows this convention.

## Guided setup — how to drive it

**Don't assume the environment is ready — check it, and guide the user step by step.** When any
Blocks work starts (this skill or any other), run this gate first:

1. **Check `.env`.** Does it exist? Which of the required vars (below) are set? Never print the
   values of keys or passwords back to the user — report only *which names* are missing or look
   wrong (empty, placeholder text like `<...>`, wrong URL).
2. **If something is missing, stop and tell the user exactly what to do**, e.g.:
   *"I need your Blocks Key. Go to the OS portal (https://os.seliseblocks.com) → your project →
   the environment you're using → copy the Blocks Key, and paste it into `.env` as
   `X_BLOCKS_KEY=...`. Tell me when it's there."* Portal navigation changes — if a screen isn't
   where described, ask the user what they see and adapt.
3. **Validate before proceeding**: `BLOCKS_API_URL` must be `https://api.seliseblocks.com`; the
   Blocks Key must be non-empty and not a placeholder; credentials present for flows that log in.
4. **Prove it works** with the smoke test (login + `GET /auth/me` —
   [flows/bootstrap-project.md](flows/bootstrap-project.md) steps 3–4) before building anything
   on top. On failure, use the troubleshooting table below and tell the user the *one* thing to
   fix, then re-test.
5. **Browser app?** Confirm the dev server runs over HTTPS before debugging any cookie/session
   issue ([flows/local-https-setup.md](flows/local-https-setup.md)).

Never skip the gate because code "looks configured" — a wrong-environment Blocks Key produces
confusing failures that cost far more time than the check.

## Prerequisites

- A SELISE Blocks OS portal account (https://os.seliseblocks.com — verify in portal UI, URLs change).
- A project created in the OS portal, with its **Blocks Key** copied.
- A user account in that project that can log in (see [flows/bootstrap-project.md](flows/bootstrap-project.md)).
- For browser apps: **local dev must run over HTTPS** — the platform sets Secure auth cookies, so
  plain `http://localhost` breaks auth. One-time setup: [flows/local-https-setup.md](flows/local-https-setup.md).

## What's where

| I need to… | Go to |
|---|---|
| Create a project / environment / first user | [flows/bootstrap-project.md](flows/bootstrap-project.md) |
| Serve local dev over HTTPS (openssl + Vite) | [flows/local-https-setup.md](flows/local-https-setup.md) |
| Work inside a project (login → tenant impersonation) | [flows/project-impersonation.md](flows/project-impersonation.md) |
| **Agent (Claude/CI) signing into the OS portal to enumerate projects/tenants** | [Agent-only login](#agent-only-login--enumerating-projects) below |
| Activate an account that 401s on login (unactivated user) | [flows/activate-first-user.md](flows/activate-first-user.md) |
| Log in, refresh, store, and revoke tokens | [flows/token-lifecycle.md](flows/token-lifecycle.md) |
| Set the cookie domain for a **deployed** custom domain | `blocks-monitor` (`POST /Domain/Configure`) + `blocks-release` custom-domains flow |
| Set up the React auth foundation (fetch wrapper, auth store) | [references/react.md](references/react.md) |
| Exact login/refresh/logout/me request shapes | `../blocks-iam/endpoints.md#authentication` |
| Users, roles, permissions, MFA management, OIDC | `blocks-iam` skill |
| Captcha challenges (when login demands `captcha_code`) | `blocks-os` skill (Captcha controller) |
| Sending emails, magic links | `blocks-utilities` skill |

## Key concepts

- **Blocks Key** — per-environment API key from the OS portal. Sent as the `x-blocks-key` header
  on **every** request to every service; it is what identifies your project/environment (login
  needs no separate project identifier). Where an API body or query asks for `projectKey` /
  `ProjectKey`, use this **same value** — they are the same key.
- **Access token** — short-lived JWT. Sent as `Authorization: Bearer <access_token>` on
  authenticated operations.
- **Refresh token** — exchanged at `POST /auth/refresh` for new tokens; treat it as an opaque
  string (format and lifetime are not documented in swagger). The only auth credential worth
  persisting client-side.
- **Environment** — a project can have several (dev/stage/prod). Each has its own Blocks Key and
  its own users/data. Tokens from one environment do not work in another.
- **Tenant / project impersonation** — every project is a tenant. To work *inside* a project, a
  session may need to be impersonated into that project's tenant
  (`POST /auth/impersonate` with `targeted_tenant_id`); the impersonated tokens are
  project-scoped. See [flows/project-impersonation.md](flows/project-impersonation.md).
- **Cookie domain** — auth cookies are bound to a configured domain per project
  (`cookieDomain` in `GET /os/v4/Project/Gets`). Local dev must be HTTPS
  ([flows/local-https-setup.md](flows/local-https-setup.md)); deployed custom domains may need
  `POST /monitor/v4/Domain/Configure` (see `blocks-monitor`), and a few tweaks are commonly
  needed there — verify against your project.

## Agent-only login — enumerating projects

> **STOP — read this before writing any login code.**
>
> This section describes the **agent-only** sign-in endpoint. It exists so an automated agent
> (Claude, CI, a CLI script) can sign in to the OS portal with **its own operator credentials**,
> enumerate every project/tenant that account can access, and then drive the normal
> tenant-impersonation flow against any of them. It is **not** an application auth flow.
>
> **Application code MUST NOT call this endpoint.** End-user auth for a Blocks app goes through
> the standard `POST /iam/v4/auth/login` + OIDC/SSO flow documented in `blocks-iam` (see
> [flows/bootstrap-project.md](flows/bootstrap-project.md) and the `blocks-iam` Authentication
> controller). The agent-only endpoint bypasses tenant context and accepts credentials in a
> non-standard format; wiring it into a user-facing app breaks SSO, MFA, and the security model.

### When to use it

Use the agent-only login when **the agent itself** needs to:

- discover which projects/tenants the operator's account can access (no Blocks Key is known up
  front — the agent doesn't yet have a project context), and then
- for each project, call `GET /os/v4/Project/Gets` to get its `tenantId`, `organizationId`,
  `applicationDomain`, `cookieDomain`, etc., and proceed with `POST /auth/impersonate` per
  [flows/project-impersonation.md](flows/project-impersonation.md).

Typical callers: a `kilo` (or similar) agent bootstrapping a workspace, a CI job that releases
across many projects, a one-off admin script.

### Endpoint

```
POST https://api.seliseblocks.com/iam/v4/auth-login
Content-Type: application/json
```

> The URL follows the standard `{base}/{service}/v4/{path}` pattern, with the normal
> `/api/` segment stripped (see the URL pattern note at the top of this file). At this stage
> there is no project context yet — that is the point — so the request typically does **not**
> carry the `x-blocks-key` header. Verify against the live response.

Body — note the **PascalCase** keys (this is the one place in Blocks that breaks the snake_case
auth-payload rule):

```json
{
  "Username": "<operator account email>",
  "Password": "<operator account password>"
}
```

Example:

```bash
curl -s -X POST "$BLOCKS_API_URL/iam/v4/auth-login" \
  -H "Content-Type: application/json" \
  -d '{ "Username": "'"$BLOCKS_USERNAME"'", "Password": "'"$BLOCKS_PASSWORD"'" }'
```

Response shape is not in the Blocks swagger — inspect the live payload. It returns the
enumerated projects/tenants the user can access (plus a session token for the next steps). Use
the returned project list (or a follow-up call) to obtain each project's `tenantId`, then
continue with `POST /iam/v4/auth/impersonate` per
[flows/project-impersonation.md](flows/project-impersonation.md).

### Hard rules

1. **Agent only.** Never call this from browser/React code, never from a server-rendered user
   app, never as a substitute for OIDC/SSO login. Applications use `POST /iam/v4/auth/login`
   (and OIDC for SSO) — see `blocks-iam`.
2. **Operator credentials only.** Use a dedicated agent/operator account in the OS portal; do
   not reuse an end-user's password.
3. **No `x-blocks-key` header.** The endpoint is pre-project-context — that is the whole reason
   the agent uses it before knowing which project to work in. The standard
   `Authorization: Bearer …` is also not sent on this call.
4. **The credentials never leave the agent's own runtime.** Treat the response as secret; do not
   log it; do not put it in `VITE_*` env vars; do not commit it.
5. After enumerating projects, drop straight into the standard
   [flows/project-impersonation.md](flows/project-impersonation.md) flow — from this point on,
   everything is normal Blocks v4 (`api.seliseblocks.com/iam/v4/...`, `x-blocks-key` per
   project, `POST /auth/impersonate` with `targeted_tenant_id`).

## Environment variable conventions

All blocks-* skills reference these names. Server-side / CLI (`.env`, never committed):

```bash
BLOCKS_API_URL=https://api.seliseblocks.com
X_BLOCKS_KEY=<Blocks Key from the OS portal>
BLOCKS_USERNAME=<login email of your dev/service user>
BLOCKS_PASSWORD=<its password>
# Only when using tenant impersonation (see flows/project-impersonation.md):
PROJECT_TENANT_ID=<tenantId from GET /os/v4/Project/Gets — cached after first discovery>
```

React/Vite apps expose only client-safe values with the `VITE_` prefix:

```bash
VITE_BLOCKS_API_URL=https://api.seliseblocks.com
VITE_X_BLOCKS_KEY=<Blocks Key>        # sent from the browser by design
```

Rules: anything prefixed `VITE_` is compiled into the client bundle and is public. The Blocks Key
is client-visible by design (a browser app cannot call the API without it). **Never** prefix
`BLOCKS_USERNAME`, `BLOCKS_PASSWORD`, or any admin/service secret with `VITE_`.

Deprecated names you may see in older projects — do not introduce them in new code:
`PROJECT_SLUG` / `VITE_PROJECT_SLUG` (login no longer takes a project identifier) and
`VITE_PROJECT_KEY` (same value as `VITE_X_BLOCKS_KEY`; keep only the latter).

## Flows

| Flow | Use when |
|---|---|
| [bootstrap-project](flows/bootstrap-project.md) | New project: portal setup → .env → first login → smoke test |
| [local-https-setup](flows/local-https-setup.md) | One-time openssl + Vite HTTPS setup so Secure auth cookies work in local dev |
| [project-impersonation](flows/project-impersonation.md) | Login → discover `tenantId` → impersonate into the project — required to work inside a project |
| [activate-first-user](flows/activate-first-user.md) | Login 401s because the account never completed activation — validate/activate/resend the code |
| [token-lifecycle](flows/token-lifecycle.md) | Login, refresh, storage strategy, logout — the day-to-day token loop |

## Conventions & gotchas

- **Two headers, always**: `x-blocks-key: <key>` on every request; `Authorization: Bearer <token>`
  additionally on authenticated operations. Base URL pattern:
  `https://api.seliseblocks.com/<service>/v4` (services: os, iam, localization, logic, data,
  release, monitor, utilities).
- **Login sends no project identifier.** The body is just `{ username, password }` (plus
  `captcha_code` / `mfa_id` / `mfa_code` / `mfa_type` on branch paths) — the `x-blocks-key`
  header carries the project context. The swagger also lists an optional `client_id` field;
  leave it out. (Note: OIDC **client** operations in `blocks-iam` — `/oidc/token`,
  client-credentials — have their own `client_id` meaning an OAuth client; that one stays.)
- **Auth payloads are snake_case** — `username`, `password`, `captcha_code`, `mfa_id`,
  `mfa_code`, `refresh_token`. This is intentional; do not camelCase them.
- **Exception**: `POST /auth/logout` takes camelCase `{ "refreshToken": "..." }` — verbatim
  from swagger. Login/refresh snake_case, logout camelCase. Copy shapes from
  `../blocks-iam/endpoints.md#authentication`, don't guess.
- **Login/refresh/me responses are not documented in swagger.** Expect token fields on login and
  refresh, and OIDC claims (`sub`, `email`, `name`, …) on `/auth/me`, but inspect the live
  response before wiring code to exact field names.
- `mfa_type` is an integer enum `0 | 1 | 2 | 3 | 4` with no member names in swagger. When login
  returns an MFA challenge, echo back the values the challenge gives you — don't hardcode meanings.
- **Impersonation payload is snake_case** like the rest of auth: `targeted_tenant_id`,
  `organization_id`, `refresh_token`, `impersonation_id` — plus `impersontingUserId` (typo verbatim
  from swagger, and camelCase; copy it exactly if you need it).
- **HTTPS is not optional for browser apps** — Secure cookies + cookie-domain matching mean plain
  http local dev fails in confusing ways. Do [flows/local-https-setup.md](flows/local-https-setup.md)
  once and forget about it.
- Old v1 routes (`/idp/v1/...`, `/uds/v1/...`) are dead. If you see them in older code or docs,
  they map to `/iam/v4/...` and friends — use this repo's endpoints.md files as ground truth.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| 401 on login | Wrong username/password, or user not activated | Check credentials; run [flows/activate-first-user.md](flows/activate-first-user.md) |
| 401 on any other call | Missing/expired `Authorization` header | Send `Bearer <access_token>`; refresh if expired (token-lifecycle flow) |
| 401 right after a period of inactivity | Access token expired | `POST /auth/refresh` with the stored `refresh_token` |
| 403 | Token valid but user lacks role/permission | Grant role via blocks-iam (`/iam/users/roles-and-permissions`) or use an account with the needed role |
| 404 on an endpoint you copied from old docs | v1 route — the platform renamed everything for v4 | Use the v4 path from the relevant skill's endpoints.md |
| Rejected before auth / "blocks key" error / unrecognized-project response | Missing or wrong `x-blocks-key`, or key from a different environment | Re-copy the Blocks Key for the *same* environment you're logging into (verify in OS portal) |
| Login succeeds but tokens don't work on another service | Environment mismatch | All calls must use the same environment's Blocks Key |
| Login returns a captcha demand | Too many failed attempts or project policy | Solve via blocks-os Captcha controller, retry login with `captcha_code` |
| Auth works via curl but the browser app never gets a session / cookies missing | Local dev on plain http — Secure cookies dropped | Serve dev over HTTPS: [flows/local-https-setup.md](flows/local-https-setup.md) |
| Login works but project APIs return errors/empty data | Session not impersonated into the project tenant | Run [flows/project-impersonation.md](flows/project-impersonation.md) and use the impersonated token |
| Cookies/session broken on a deployed custom domain | `cookieDomain` not configured for that domain | `POST /monitor/v4/Domain/Configure` (`blocks-monitor`); expect a few tweaks — verify against your project |

## Files

- flows/ — step-by-step procedures (bootstrap-project, local-https-setup, project-impersonation,
  activate-first-user, token-lifecycle)
- references/react.md — the canonical React auth foundation (fetch wrapper, Zustand auth store,
  401-refresh-retry). Other skills' React guides build on this file.
- This skill has no swagger of its own; every auth endpoint it references is documented verbatim
  in `../blocks-iam/endpoints.md` (Authentication section).
