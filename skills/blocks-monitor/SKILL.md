---
name: blocks-monitor
description: "Observability and platform back-office for SELISE Blocks (monitor service, api.seliseblocks.com/monitor/v4). Use this skill for any task involving logs, traces, uptime monitors, health checks, incidents, or OS-portal-grade administration — including querying and filtering service logs, live log tailing (/Log/Live), inspecting distributed traces and spans, creating and managing uptime monitors (incidents, response time, downtime), heartbeat health checks with ping URLs, cookie-domain configuration (/Domain/Configure), and back-office account/organization/role/permission administration via the PascalCase /Authentication and /Iam controllers. Trigger on: monitor service, log viewer, live tail, trace id, span, uptime, health ping, downtime report, incident list, SSO/OIDC client-credential admin. App sign-in/sign-up is blocks-iam, NOT this skill."
---

# Blocks Monitor — Observability & Platform Back-Office

The `monitor` service is SELISE Blocks' observability plane plus the platform's back-office
administration API. It serves four observability domains — **logs** (query, filter, live tail),
**traces** (per-request spans and service analytics), **uptime monitors** (active HTTP probes with
incidents/downtime/response-time history), and **health checks** (heartbeat-style configs with a
ping URL) — and two admin domains: **domain configuration** (auth cookie domain per project) and the
PascalCase **`/Authentication/*` and `/Iam/*` back-office controllers** used by OS portal
for account, organization, role, permission, SSO/OIDC-credential, and session administration.

> **Warning — this is NOT your app's auth path.** The PascalCase `/Authentication/*` and
> `/Iam/*` controllers here are platform back-office APIs (what OS portal itself uses).
> Application login, signup, token refresh, MFA, and profile flows belong to the **blocks-iam**
> skill (lowercase `/auth/*`, `/iam/*`, `/mfa/*` on `https://api.seliseblocks.com/iam/v4`).
> Only use the controllers in this skill for admin tooling operating on behalf of a project owner.

**Base URL:** `https://api.seliseblocks.com/monitor/v4`

## Prerequisites

- Environment + token bootstrap: see **blocks-setup** (`BLOCKS_API_URL`, `X_BLOCKS_KEY`,
  `BLOCKS_USERNAME`, `BLOCKS_PASSWORD`; login via `POST /iam/v4/auth/login`).
- Every request needs `x-blocks-key: <X_BLOCKS_KEY>`; authenticated operations also need
  `Authorization: Bearer <access_token>`.
- Back-office `/Iam/*` and `/Authentication/*` calls require a token with admin-level
  privileges on the project (a plain end-user token will be rejected or return empty data).
- `projectKey` in request bodies/queries = your Blocks Key (the same value as `X_BLOCKS_KEY` /
  the `x-blocks-key` header).

## What's where

| I need to… | Go to |
|---|---|
| Query/filter logs, search by level, traceId, spanId | [endpoints.md#log](endpoints.md#log), flow: `flows/query-logs-and-live-tail.md` |
| Live-tail a service's logs | `GET /Log/Live` — flow: `flows/query-logs-and-live-tail.md` |
| Find traces for a failing request, view spans | [endpoints.md#trace](endpoints.md#trace), flow: `flows/inspect-traces.md` |
| Service / operation analytics over a time window | `POST /Trace/GetServiceAnalytics`, `POST /Trace/GetOperationalAnalytics` |
| Create an uptime monitor, list incidents, downtime, response times | [endpoints.md#monitor](endpoints.md#monitor), flow: `flows/uptime-monitor.md` |
| Heartbeat health check + ping URL | [endpoints.md#health](endpoints.md#health), flow: `flows/heartbeat-health-check.md` |
| Set the auth cookie domain for a project | `POST /Domain/Configure` — [endpoints.md#domain](endpoints.md#domain) |
| Admin lookup of users, orgs, roles, permissions, sessions | [endpoints.md#iam](endpoints.md#iam), flow: `flows/backoffice-account-org-admin.md` |
| Admin management of OIDC/SSO/client credentials, token lifetimes | [endpoints.md#authentication](endpoints.md#authentication) (back-office — read the warning above) |
| App login / signup / refresh / MFA / user profile | **blocks-iam** skill (not here) |
| Captcha, platform MFA, Project, Storage, People, Notification | **blocks-os** skill (shared controllers table at the bottom of endpoints.md) |
| Mail template CRUD (`/Mail/Save|Get|Gets|Delete|Duplicate`) | **blocks-logic** skill |
| Getting a token in the first place | **blocks-setup** skill |

## Key concepts

- **Log** — structured log entries per service, filtered by `startDate`/`endDate`/`level`/`traceId`/
  `spanId` plus free-text `search`. `serviceName` is required on log queries; valid values are not
  published in swagger — use the service names visible in your project's OS portal observability
  view (or discover them via trace analytics) and verify live.
- **Trace / span** — distributed-tracing records. A `traceId` links spans across services and links
  back to logs (log filter accepts `traceId` and `spanId`).
- **Monitor** — an *active* uptime probe the platform runs against a URL: method, interval, timeout,
  expected content, accepted status codes, regions, alert emails. Produces incidents, response-time
  logs, and downtime windows.
- **Health (heartbeat)** — a *passive* check: you configure `intervalInSeconds` +
  `gracePeriodInSeconds`, then your own job/service calls `GET /Health/Ping/{itemId}` on
  schedule. (Interpretation from field names — semantics are not documented in swagger; verify
  alerting behavior live.)
- **Incident** — an outage record attached to a monitor (`GET /Monitor/GetIncidentList`).
- **Back-office Iam/Authentication** — OS-portal-grade administration of users ("accounts"),
  organizations, roles, permissions, sign-up settings, SSO/OIDC/client credentials, sessions, and
  login histories for a project. Distinct from, and higher-privileged than, app auth (blocks-iam).
- **Domain configure** — sets the `cookieDomain` a project's auth cookies are scoped to
  (`POST /Domain/Configure` with `{ projectKey, cookieDomain }`). Needed when hosting the app
  on a deployed custom domain (`blocks-release` custom-domains flow); expect a few follow-up
  tweaks (matching the exact registered domain, re-login after the change) — the request/response
  shapes are documented, but the operational behavior beyond them is **not in swagger, verify
  against your project**. Current per-project
  values are readable from `GET /os/v4/Project/Gets` (`cookieDomain`, `customDomain`,
  `isDomainVerified` — see `blocks-os`). Local-dev HTTPS/cookie setup is `blocks-setup`
  (local-https-setup flow).

## Flows

| Flow | Use when |
|---|---|
| `flows/query-logs-and-live-tail.md` | Debugging: pull recent logs for a service, filter by level/trace, or watch logs live |
| `flows/inspect-traces.md` | A request failed or is slow — find its trace, inspect spans, correlate with logs, pull analytics |
| `flows/uptime-monitor.md` | Create/update/delete an HTTP uptime monitor and read its incidents, response times, downtime |
| `flows/heartbeat-health-check.md` | Register a heartbeat health check and wire a cron/worker to its ping URL |
| `flows/backoffice-account-org-admin.md` | Admin tooling: look up/manage users, orgs, roles, sessions via `/Iam/*` (with the app-auth warning) |

## Conventions & gotchas

- **Response envelopes:** documented responses use `BaseResponse { isSuccess, errors }` for
  mutations and `{ data, errors, totalCount }` for lists. **Most observability endpoints
  (Log/Live, GetLogs, all Trace, all Monitor, all Health) have no response schema in swagger** —
  endpoints.md flags each one; inspect the live response before relying on a shape.
- **Casing is inconsistent — copy it exactly from endpoints.md.** POST JSON bodies are camelCase
  (`projectKey`, `pageSize`). GET query params on Log/Trace/Iam/Authentication are PascalCase
  (`ProjectKey`, `TraceId`, `Name`, `Filter.UserId`, `Sort.Property`), but Monitor/Health GET/DELETE
  queries are camelCase (`monitorId`, `itemId`, `projectKey`, `pageNumber`) — and note the exact
  spelling `monitorSourcetype` (lowercase `t`) on `GET /Monitor/GetMonitorList`.
- **Pagination:** POST list endpoints take `page`/`pageSize` + `sort { property, isDescending }`
  in the body; Iam GET lists take `Page`/`PageSize`/`Sort.Property`/`Sort.IsDescending` in the
  query; Monitor lists take `pageNumber`/`pageSize`.
- `GET /Iam/GetUserTimelines` declares a JSON **request body on a GET** (swagger quirk). Many
  HTTP clients can't send one — if it fails, verify the live behavior before working around it.
- Route/field typos are real — call them verbatim: `GET /Iam/IsEmailAvaiable`, fields
  `isVarified`, `varifiedType`.
- Integer enums (`userMfaType`, `permissionSeverity`, `ssoType`, …) have **no member names in
  swagger** — treat the numeric unions in contracts.md as unverified meanings.
- `successHttpResponseCodes` on monitors is a `string[]` (e.g. `["200", "201"]`), not numbers.
- Old v1 routes (`/lmt/…` and friends) are dead. Only `https://api.seliseblocks.com/monitor/v4/...`.
- This service also serves shared platform controllers (Captcha, Mfa, Project, Storage, Mail
  template CRUD, …) — documented in blocks-os / blocks-logic; see the pointer table at the bottom
  of endpoints.md.

## Files

- `endpoints.md` — every endpoint with exact params and shapes (generated from swagger)
- `contracts.md` — TypeScript types (generated)
- `flows/` — step-by-step multi-endpoint procedures
- `references/react.md` — React 19 integration guide
