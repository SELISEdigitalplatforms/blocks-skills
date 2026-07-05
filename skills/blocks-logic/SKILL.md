---
name: blocks-logic
description: "Use this skill for any task involving business logic, workflows, or automation on SELISE Blocks — creating, updating, versioning, publishing, duplicating, or deleting workflows (node/edge graphs), triggering runs via workflow webhooks, executing a single node (StepExecute), and inspecting workflow executions on the logic/v4 service. Also covers GitHub deployment authorization for logic deployments (connect GitHub, list repos and branches), logic file storage via pre-signed upload URLs (GetPreSignedUrlForUpload, GetFile, DeleteFile), and mail (SMTP) configuration CRUD (/api/Mail Save/Get/Gets/Delete/Duplicate — sending mail is blocks-utilities). Trigger when the user mentions Blocks Logic, workflow engine, workflow versions or executions, webhook triggers, GitHub repo/branch authorization for deployments, or mail server configuration on SELISE Blocks."
---

# Blocks Logic

The `logic` service is the SELISE Blocks workflow engine. It stores workflows as node/edge
graphs, snapshots them into versions, publishes them, and runs them — triggered by inbound
webhooks or node-by-node with StepExecute. The same service hosts the GitHub authorization
used by logic deployments, a pre-signed-URL file storage API for logic assets, and the
CRUD for project mail (SMTP) configurations. Base URL: `https://api.seliseblocks.com/logic/v4`.

## Prerequisites

- Complete the `blocks-setup` skill first: env vars (`BLOCKS_API_URL`, `X_BLOCKS_KEY`,
  `PROJECT_SLUG`, `BLOCKS_USERNAME`, `BLOCKS_PASSWORD`) and a Bearer access token.
- Every request needs the `x-blocks-key` header; authenticated operations also need
  `Authorization: Bearer <access_token>`.
- `projectKey` in request bodies and query strings is your project's short key / slug —
  the same value as `client_id` at login (`PROJECT_SLUG`).
- GitHub deployment flows additionally require a GitHub account with access to the target
  repos, authorized once via OAuth (see the deployment flow).

## What's where

| I need to… | Go to |
|---|---|
| Create, update, duplicate, or delete a workflow | [endpoints.md#workflow](endpoints.md#workflow) · [flows/create-and-run-workflow.md](flows/create-and-run-workflow.md) |
| Trigger a workflow run (webhook) or run one node | [flows/create-and-run-workflow.md](flows/create-and-run-workflow.md) |
| List runs / inspect one execution | [flows/create-and-run-workflow.md](flows/create-and-run-workflow.md) |
| Snapshot, publish, restore, or unpublish versions | [flows/version-publish-restore.md](flows/version-publish-restore.md) |
| Connect GitHub, pick a repo and branch for deployment | [flows/authorize-github-deployment.md](flows/authorize-github-deployment.md) · [endpoints.md#deployment](endpoints.md#deployment) |
| Build/release the deployed logic (CI pipeline) | `blocks-release` skill |
| Upload, fetch, or delete logic files | [flows/upload-and-manage-files.md](flows/upload-and-manage-files.md) · [endpoints.md#storage](endpoints.md#storage) |
| Configure a storage provider (storage *configurations*) | `blocks-os` skill (`/api/Storage/Save|Get|Gets|Delete` config CRUD) |
| Create/edit mail (SMTP) configurations | [flows/manage-mail-configurations.md](flows/manage-mail-configurations.md) · [endpoints.md#mail](endpoints.md#mail) |
| Actually send an email, list mail templates | `blocks-utilities` skill (`/api/Mail/Send`, `/api/Template/Gets`) |
| Get/refresh a token, set env vars | `blocks-setup` skill |
| Uptime monitors, health checks, logs | `blocks-monitor` skill |

## Key concepts

- **Workflow** — a directed graph of **nodes** (id, name, category, type, version,
  position `{x, y}`, parameters, settings) connected by **edges**
  (source/target + sourceHandle/targetHandle). Stored per `projectKey`; has a draft state
  and an `isPublished` flag. The catalog of node categories/types is not published in the
  swagger — build one workflow in the Cloud Portal designer and read it back with
  `GET /api/Workflow/Get` to learn the shapes your project uses.
- **Version** — a named snapshot of a workflow (`CreateVersion`), listable
  (`GetVersions`), readable (`GetWorkflowByVersion`), publishable (`PublishVersion` /
  `PublishNewVersion`), and restorable into the draft (`Restore`).
- **Execution** — one run of a workflow. `GetExecutions` lists runs for a workflow;
  `GetExecution` returns one run by `ExecutionId`. There is **no generic
  `/api/Workflow/Execute` endpoint in v4** — runs start from triggers (webhooks) or
  per-node via `StepExecute`.
- **Webhook trigger** — `POST /api/Workflow/Webhook/{projectKey}/{workflowId}/{webhookId}`
  starts a published workflow; `POST /api/Workflow/webhook-test/{...}` is the test
  variant (note the different casing — both routes are exact).
- **StepExecute** — runs a single node (`nodeId`), optionally reusing upstream outputs
  from a previous run via `sourceExecutionId`. The debugging primitive.
- **Deployment authorization** — a stored GitHub OAuth connection used by logic
  deployments: check with `IsAuthorized`/`GetUser`, browse `GetRepos`/`GetReposList`/
  `GetBranches`, revoke with `RemoveAuthorization`/`DeleteAuthorization`. The build and
  release pipeline itself lives in `blocks-release`.
- **Logic file storage** — `GetPreSignedUrlForUpload` returns an `uploadUrl` + `fileId`;
  you PUT the bytes to the pre-signed URL directly, then read metadata/download URLs via
  `GetFile`/`GetFiles`.
- **Mail configuration** — SMTP server settings (host, port, SSL, sender, credentials)
  saved per project. CRUD is canonical here; *sending* mail is `blocks-utilities`.

## Flows

| Flow | Use when |
|---|---|
| [flows/create-and-run-workflow.md](flows/create-and-run-workflow.md) | Build a workflow from scratch, publish it, trigger a run, inspect executions |
| [flows/version-publish-restore.md](flows/version-publish-restore.md) | Snapshot versions, publish/unpublish, roll back to an earlier version |
| [flows/authorize-github-deployment.md](flows/authorize-github-deployment.md) | Connect GitHub and pick a repo/branch for a logic deployment |
| [flows/upload-and-manage-files.md](flows/upload-and-manage-files.md) | Upload a file via pre-signed URL, fetch its download URL, delete it |
| [flows/manage-mail-configurations.md](flows/manage-mail-configurations.md) | Create, list, duplicate, or delete a project's SMTP mail configurations |

## Conventions & gotchas

- **Headers**: `x-blocks-key: <X_BLOCKS_KEY>` on every request;
  `Authorization: Bearer <access_token>` for authenticated operations. 401 → refresh the
  token per `blocks-setup`.
- **Undocumented responses**: almost every `Workflow` endpoint returns
  `200 OK` with **no response schema in swagger** — inspect the live response before
  relying on its shape. Only the fields shown in `endpoints.md` are guaranteed.
- **Deployment envelope**: all `/api/Deployment/*` endpoints return
  `DeploymentDriverBaseApiResponse` (`isSuccess`, `errors`, `message`, `statusCode`,
  `error`, `reason`) with the payload in `data: unknown` — the inner shape is untyped in
  swagger; inspect live.
- **Casing is mixed and exact**: controllers are PascalCase (`/api/Workflow/Create`);
  GET/DELETE query params are PascalCase (`WorkflowId`, `ProjectKey`, `ConfigurationId`);
  JSON bodies are camelCase (`projectKey`, `workflowId`). The two webhook routes differ
  only by casing: `Webhook/...` (production) vs `webhook-test/...`.
- **Verb quirks**: most Workflow mutations are POST, but `Update` is PUT and `Delete` is
  DELETE with query params (`Id`, `ProjectKey`). Listing is `POST /api/Workflow/GetAll`
  with body pagination (`pageSize`, `pageNumber`), while `GET /api/Deployment/GetRepos`
  paginates via query (`PageNumber`, `PageSize`).
- **Int enums are unverified**: `provider` (0|1), `smtpClient` (0|1|2), `accessModifier`
  (0–3), `moduleName` (1–11), `statusCode` (HTTP codes). Member names are not in the
  swagger — treat meanings as unverified until observed live (see contracts.md).
- **Two different `/api/Storage/*` route families** exist on this base URL: the logic
  file APIs documented here (`GetPreSignedUrlForUpload`, `GetFile`, `GetFiles`,
  `DeleteFile`) and the platform storage *configuration* CRUD (`Save`, `Get`, `Gets`,
  `Delete`) which is canonical in `blocks-os`. Don't mix them up.
- **Mail split**: `/api/Mail/Save|Get|Gets|Delete|Duplicate` (SMTP configurations) are
  canonical here; `/api/Mail/Send` and template management are `blocks-utilities`.
  `Gets` returns a different, richer shape (`MailServerConfiguration[]`, with `itemId`,
  `smtpClient`, `isDefault`) than `Get` (`MailConfiguration`).
- Old v1 routes (`/lmt/`, `/deployment/v1/`, etc.) are dead — everything is
  `https://api.seliseblocks.com/logic/v4/...` now.

## Files

- [endpoints.md](endpoints.md) — every endpoint with exact params and shapes (generated from swagger)
- [contracts.md](contracts.md) — TypeScript types (generated)
- [flows/](flows/) — step-by-step multi-endpoint procedures
- [references/react.md](references/react.md) — React 19 integration guide
