---
name: blocks-os
description: "Use this skill for any task involving the SELISE Blocks platform OS service (os/v4) — captcha configuration and challenge verification, platform MFA OTP/TOTP (PascalCase /api/Mfa/*), notification configurations, storage backend configurations, project secrets (key-value), project and tenant-group management, team invitations (People), subscriptions/quotas, managed service registry, data migration between projects, per-endpoint captcha/MFA enforcement (ApiEndpointConfig), and OIDC discovery/JWKS. Trigger when the user mentions Blocks OS, platform service, Cloud Portal API, captcha, OTP, TOTP, MFA setup, secrets, storage config, notification config, project create/invite/transfer ownership, tenant group, subscription limits, or JWKS on SELISE Blocks. App-level login/auth/MFA flows belong to blocks-iam; this skill covers the platform controllers."
---

# Blocks OS — Platform Service

The OS service (`https://api.seliseblocks.com/os/v4`) is the platform backbone of SELISE Blocks: it hosts the shared platform controllers that every project relies on — captcha, platform MFA, notifications, storage backends, secrets, projects and team access, subscriptions, service registry, migration, per-endpoint security enforcement, and OIDC discovery. Reach for it when you are configuring the platform side of a project or running platform-level verification cycles (captcha challenges, OTP codes). For application login, tokens, roles, and the login-time MFA handshake, use **blocks-iam** instead.

These controllers are framework-level: the same routes are also served by the `logic/v4` and `monitor/v4` base URLs. This skill is their canonical documentation home — default to the `os/v4` base URL unless you specifically need another service's instance.

## Prerequisites

- **blocks-setup** skill: env vars (`BLOCKS_API_URL`, `X_BLOCKS_KEY`, `PROJECT_SLUG`, credentials) and obtaining/refreshing a bearer token.
- Every request needs `x-blocks-key: <X_BLOCKS_KEY>`; configuration/admin endpoints additionally need `Authorization: Bearer <access_token>`.
- Most config endpoints take a `projectKey` (the project short key / slug — the same value used as `client_id` in blocks-iam login).

## What's where

| I need to… | Go to |
|---|---|
| Configure a captcha provider, create/verify a captcha challenge | [flows/captcha-lifecycle.md](flows/captcha-lifecycle.md), [endpoints.md#captcha](endpoints.md#captcha) |
| Enable platform MFA, generate/verify an OTP, set up TOTP | [flows/platform-mfa-otp.md](flows/platform-mfa-otp.md), [endpoints.md#mfa](endpoints.md#mfa) |
| Configure notifications for a project | [flows/notification-config.md](flows/notification-config.md), [endpoints.md#notification](endpoints.md#notification) |
| Register/read/remove a storage backend | [flows/storage-config.md](flows/storage-config.md), [endpoints.md#storage](endpoints.md#storage) |
| Save and read project secrets | [flows/secrets-management.md](flows/secrets-management.md), [endpoints.md#secrets](endpoints.md#secrets) |
| Create a project, invite teammates, transfer ownership | [flows/project-team-management.md](flows/project-team-management.md), [endpoints.md#project](endpoints.md#project), [endpoints.md#people](endpoints.md#people) |
| Require captcha/MFA on specific API endpoints | [endpoints.md#apiendpointconfig](endpoints.md#apiendpointconfig) |
| Check subscription limits/usage | [endpoints.md#subscription](endpoints.md#subscription) |
| List/register managed services | [endpoints.md#service](endpoints.md#service) |
| Migrate data between projects | [endpoints.md#migration](endpoints.md#migration) |
| Fetch JWKS / OpenID configuration for token validation | [endpoints.md#discovery](endpoints.md#discovery) |
| App login, refresh, roles, login-time MFA (`mfa_id`/`mfa_code`) | **blocks-iam** skill |
| Logs, traces, health | **blocks-monitor** skill (routes listed in [endpoints.md#shared-platform-controllers](endpoints.md#shared-platform-controllers)) |
| Send mail, real-time Notifier, templates | **blocks-utilities** skill |

## Key concepts

- **Project / tenant / tenant group** — a Blocks *project* is one environment (tenant) identified by a `projectKey` (short key/slug, aka `client_id`). Projects belong to a *tenant group* (`tenantGroupId`), which groups the environments (e.g. dev/prod) of one application and is the unit for team access and ownership.
- **Captcha configuration vs. challenge** — a *configuration* stores provider credentials (`captchaKey`/`captchaSecret`, `provider`, `captchaGenerator`) per project; a *challenge* is a one-shot puzzle created from a configuration and solved by an end user, yielding a `verificationCode`.
- **Platform MFA (`/api/Mfa/*`, PascalCase)** — the OTP/TOTP engine: per-project MFA settings plus generate/resend/verify cycles keyed by `mfaId`. Distinct from blocks-iam's lowercase `/api/mfa/*`, which drives the login handshake in applications.
- **Secrets** — named bags of `keyValuePairs` (string→string) per project; server-side config storage, not for client exposure.
- **Storage configuration** — connection details for a storage backend (cloud strategy with `connectionString`/`accessKey`/`secretKey`, or SFTP with `host`/`port`/`userName`/`password`). Configuration only — no file-transfer endpoints in this swagger.
- **Notification configuration** — named delivery settings (`channelToNotify`, `notificationType`, `notifyMethod`, `enablePersistence`) per project.
- **Subscription** — resource limits and usage counters (`limit`, `usage`, `lifetime`, `enableAutoRenew`) per tenant.
- **ApiEndpointConfig** — per-endpoint switches (`isCaptchaRequired`, `isMfaRequired`) that enforce captcha/MFA on platform routes.
- **Discovery** — `/.well-known/jwks.json` and `/.well-known/openid-configuration` per `projectKey`, for validating Blocks-issued JWTs.

## Flows

| Flow | Use when |
|---|---|
| [flows/captcha-lifecycle.md](flows/captcha-lifecycle.md) | Configuring a captcha provider and running Create → render → Submit → Verify; feeding `captcha_code` to blocks-iam login |
| [flows/platform-mfa-otp.md](flows/platform-mfa-otp.md) | Enabling project MFA and running OTP generate/resend/verify or TOTP setup |
| [flows/notification-config.md](flows/notification-config.md) | Creating, listing, updating, deleting notification configurations |
| [flows/storage-config.md](flows/storage-config.md) | Registering or rotating a storage backend (cloud or SFTP) |
| [flows/secrets-management.md](flows/secrets-management.md) | Saving, reading, updating, deleting project secrets |
| [flows/project-team-management.md](flows/project-team-management.md) | Creating projects, inviting/removing teammates, transferring ownership |

## Conventions & gotchas

- **Headers**: `x-blocks-key` on every call; `Authorization: Bearer <token>` for authenticated/admin operations. See blocks-setup.
- **Envelope**: mutations return `BaseResponse { isSuccess, errors }` (errors is a string→string dictionary), often extended with `itemId` (`BaseMutationResponse`). Always check `isSuccess` — HTTP 200 does not mean the operation succeeded.
- **Casing split**: JSON request/response bodies are camelCase; **query parameters on GETs are PascalCase** (`ProjectKey`, `VerificationCode`, `Sort.Property`). Don't camelCase query params.
- **Delete verbs are inconsistent**: `DELETE /api/Notification/Delete` (query params), `POST /api/Storage/Delete` (query params, no body), `POST /api/Secrets/Delete` (JSON body). Copy the exact shape from endpoints.md per controller.
- **Pagination is inconsistent**: POST list endpoints take `page`/`pageSize` in the body; GET lists take `Page`/`PageSize` query params — except `GET /api/Secrets/Gets`, which uses `PageNumber`/`PageSize`.
- **Integer enums are unverified**: `mfaType`, `userMfaType`, `channelToNotify`, `notificationType`, `serviceName` (migration) are numeric unions with no member names in swagger — see contracts.md; observe live values before hard-coding meanings.
- **Undocumented responses**: all ApiEndpointConfig endpoints, both Discovery endpoints, most People endpoints (Invite, Signup, ConfirmInvitation, ResendInvitation, RemoveAccess, TransferOwnerShip), `Migration/DataCleanup`, `Migration/GetMigrationStatus`, `Project/GetTokenValidationParameters`, and `Service/Register` have no response schema in swagger — inspect the live response before relying on a shape.
- **Shared hosting**: these controllers are also served under `logic/v4` and `monitor/v4`. Canonical docs live here; use `os/v4` by default.
- **Not here**: app auth/roles/login MFA → blocks-iam. Log/Trace routes at the bottom of endpoints.md → blocks-monitor. Mail sending and real-time Notifier → blocks-utilities.
- **Spelling quirks in the API**: `TransferOwnerShip` (capital S), `sharedEnviroments`/`enviroment` (missing "n") in People responses. Use them verbatim.

## Files

- [endpoints.md](endpoints.md) — every endpoint with exact params and shapes (generated from swagger)
- [contracts.md](contracts.md) — TypeScript types (generated)
- [flows/](flows/) — step-by-step multi-endpoint procedures
- [references/react.md](references/react.md) — React 19 integration guide
