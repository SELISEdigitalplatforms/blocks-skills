# SELISE Blocks Skills

Claude Code skills for building full-stack applications on the **SELISE Blocks v4 platform** (`https://api.seliseblocks.com/<service>/v4`). Each skill teaches Claude one Blocks service: what the endpoints are (generated verbatim from the live swagger), how to chain them into working flows, and how to integrate them in a React frontend.

Describe what you want to build; Claude picks the skill, follows a flow, and writes code grounded in the real API contracts — no invented routes, no invented fields.

> v4 renamed every service. Old v1 names map as: **idp → iam**, **uds → data**, **uilm → localization**, **lmt → monitor**, **deployment → release**, **workflow → logic**. All `/…/v1/` routes are dead.

## Skills

| Skill | Covers | Flows |
|-------|--------|-------|
| `blocks-setup` | Bootstrap: OS portal prerequisites, `.env` conventions, local HTTPS for dev (openssl + Vite — required for Secure auth cookies), obtaining/refreshing tokens (login, refresh, me, logout), entering a project context via tenant impersonation, troubleshooting, and the canonical React auth foundation (fetch wrapper + Zustand store + 401-refresh-retry) all other skills build on. | bootstrap-project, local-https-setup, project-impersonation, activate-first-user, token-lifecycle |
| `blocks-iam` | Application identity & access (`iam/v4`): embedded login, signup/activation, password lifecycle, MFA, users/roles/permissions/organizations, impersonation, external-IdP SSO, OIDC provider & client management, machine-to-machine credentials. | embedded-login, signup-activation, password-recovery, org-switch-impersonation, sso-identity-providers, machine-to-machine |
| `blocks-data` | Data platform (`data/v4`): schema definitions and fields, data access policies and security levels, field validations with AI regex assistant, data sources, configuration reload, Files/DMS uploads, schema exchange between projects, mock-data cleanup. | define-schema, configure-access, add-validations, upload-files, schema-exchange, manage-mock-data |
| `blocks-localization` | Languages, translation keys, glossaries, AI/machine translation, UILM language-file generation and import/export, change timeline with rollback, webhook config (`localization/v4`). | language-setup, key-management, ai-translation, language-files-and-webhook, timeline-and-rollback |
| `blocks-logic` | Workflows (create/version/publish/execute via webhooks and StepExecute, execution history), GitHub deployment authorization, logic file storage via pre-signed URLs, mail (SMTP) configuration CRUD (`logic/v4`). | create-and-run-workflow, version-publish-restore, authorize-github-deployment, upload-and-manage-files, manage-mail-configurations |
| `blocks-monitor` | Observability (logs + live tail, traces/analytics, uptime monitors, heartbeat health checks) and platform back-office admin (PascalCase `/api/Authentication` + `/api/Iam`, domain config) on `monitor/v4`. Back-office ≠ app auth — app auth lives in `blocks-iam`. | query-logs-and-live-tail, inspect-traces, uptime-monitor, heartbeat-health-check, backoffice-account-org-admin |
| `blocks-os` | Platform OS service (`os/v4`) — canonical home of the shared platform controllers: captcha, platform MFA OTP/TOTP, notification/storage/secrets config, projects/people/team access, subscriptions, service registry, migration, ApiEndpointConfig enforcement, OIDC discovery. | captcha-lifecycle, platform-mfa-otp, notification-config, storage-config, secrets-management, project-team-management |
| `blocks-release` | CI/CD (`release/v4`): GitHub authorization and webhooks, per-repo hosting settings, build triggering/monitoring/reports, custom deployment domains, SonarQube/DependencyTrack analytics. | connect-github, configure-and-run-build, build-reports-and-analytics, custom-domains |
| `blocks-utilities` | Utilities service (`utilities/v4`): magic links, PDF generation/merge/stamp, transactional mail sending, email templates, sequence numbers, IP geolocation, notifications. | magic-links, generate-pdfs, merge-stamp-pdfs, send-templated-mail, sequence-numbers |

**Pending:** `blocks-agent` and `blocks-studio` — their v4 swagger specs are not published yet. They will be added the same way (see `CONTRIBUTING.md`).

## Skill layout

Every skill follows the same consolidated structure:

```
skills/blocks-<svc>/
├── SKILL.md            ← routing: what's where, key concepts, flow index, gotchas
├── endpoints.md        ← every endpoint with exact params and shapes — GENERATED from swagger
├── contracts.md        ← TypeScript types for all schemas — GENERATED from swagger
├── flows/              ← step-by-step multi-endpoint procedures (3–6 per skill)
│   └── <kebab-name>.md
└── references/
    └── react.md        ← typed API client + TanStack Query hooks for this service
```

`endpoints.md` and `contracts.md` are ground truth: generated from the live v4 swagger, never hand-edited. Routes served by several services (shared platform controllers) are documented in full in exactly one canonical skill; other skills carry a pointer table. `blocks-setup` is the exception — it has no swagger of its own and points to `blocks-iam` for auth endpoint shapes.

Where swagger leaves a response schema undocumented, the skills say so ("inspect the live response") instead of fabricating JSON, and integer enums without member names are flagged as unverified.

## Regenerating the API docs

```bash
python3 tools/generate-api-docs.py              # all services
python3 tools/generate-api-docs.py iam data     # specific services
```

Swagger specs are cached in `.swagger-cache/` (gitignored); delete a service's JSON there to force a fresh download from `https://api.seliseblocks.com/<svc>/v4/swagger/v1/swagger.json`.

## Prerequisites

Complete the OS portal setup first — the `blocks-setup` skill walks through it (project, environment, Blocks Key, developer account) and establishes the env var conventions used everywhere:

| Variable | Meaning |
|----------|---------|
| `BLOCKS_API_URL` | `https://api.seliseblocks.com` |
| `X_BLOCKS_KEY` | project Blocks Key — sent as `x-blocks-key` header on every request; also the value for any `projectKey` field an API asks for |
| `BLOCKS_USERNAME` / `BLOCKS_PASSWORD` | developer account credentials |
| `PROJECT_TENANT_ID` | project's tenant id from `GET /os/v4/api/Project/Gets` — only needed for tenant impersonation |

Login sends no project identifier — the `x-blocks-key` header carries the project context.
(Deprecated names from older setups: `PROJECT_SLUG`/`VITE_PROJECT_SLUG`, `VITE_PROJECT_KEY`,
`BLOCKS_CLOUD_CLIENT_ID` — don't use them in new code.)
Every request needs `x-blocks-key`; authenticated operations add `Authorization: Bearer <access_token>`.
Two platform behaviors worth knowing up front: browser apps must run over **HTTPS even in local dev**
(Secure auth cookies — see blocks-setup's local-https-setup flow), and working inside a project means
**impersonating into its tenant** (blocks-setup's project-impersonation flow).

## Frontend stack

`references/react.md` in each skill targets the [blocks-construct-react](https://github.com/SELISEdigitalplatforms/blocks-construct-react) stack: **React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui + TanStack Query + Zustand**.

## Example prompts

```
Set up my Blocks project env and log in                      → blocks-setup
Build a login page with email/password and MFA support       → blocks-iam
Create a schema for blog posts with title, body, and tags    → blocks-data
Set up English and German as project languages               → blocks-localization
Trigger a build for my repo and show me the build report     → blocks-release
Add an uptime monitor for my API and alert on downtime       → blocks-monitor
Generate a PDF invoice from a template and email it          → blocks-utilities
```

## License

MIT — see `LICENSE`.
