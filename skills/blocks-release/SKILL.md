---
name: blocks-release
description: "Use this skill for any CI/CD task on SELISE Blocks — triggering and monitoring builds, deploying code, connecting a GitHub account or repository, listing repos and branches, creating GitHub webhooks for auto-deploy, configuring hosting (provider, region, machine config), assigning custom deployment domains, reading build reports, and wiring SonarQube or DependencyTrack analysis. Trigger when the user mentions build, deploy, deployment, release, CI/CD, pipeline, auto-deploy, GitHub integration, GitHub authorization, webhook, hosting settings, machine config, region, custom domain, build reports, SonarQube, or DependencyTrack in a SELISE Blocks context — including the old names 'deployment service' and 'CloudBuild' (v1 aliases only; every v1 route is dead, use the v4 release routes documented here)."
---

# Blocks Release (CI/CD)

The release service is SELISE Blocks' CI/CD backend (formerly the "deployment service" / CloudBuild — those are recognition aliases only; all v1 routes are gone). It links a GitHub account to your project, lists repos and branches, registers push webhooks for auto-deploy, stores per-repo hosting settings (provider → region → machine config), triggers builds, serves build reports, and hooks builds into SonarQube and DependencyTrack. Reach for it whenever a task is about getting code built and deployed on Blocks infrastructure.

Base URL: `https://api.seliseblocks.com/release/v4`

## Prerequisites

- `blocks-setup` skill: env vars (`BLOCKS_API_URL`, `X_BLOCKS_KEY`, `BLOCKS_USERNAME`, `BLOCKS_PASSWORD`) and how to obtain/refresh a Bearer token.
- Every request needs the `x-blocks-key` header; authenticated operations also need `Authorization: Bearer <access_token>`. One exception: `POST /Github/webhook` takes `x-blocks-key` as a **query parameter** (it is the receiver GitHub calls, and GitHub cannot set custom headers).
- A GitHub account must be authorized before any `/Github/*` or build-trigger call works — see `flows/connect-github.md`.

## What's where

| I need to… | Go to |
|---|---|
| Check whether GitHub is authorized | `GET /Auth/IsAuthorized` — endpoints.md#auth |
| Authorize / disconnect GitHub | flows/connect-github.md |
| See the linked GitHub account | `GET /Github/user` — endpoints.md#github |
| List GitHub repos / branches | endpoints.md#github (`/repos`, `/branches`) |
| Set up a push webhook for auto-deploy | flows/connect-github.md |
| See hosting options (providers, regions, machine specs) | `GET /Build/settings` — endpoints.md#build |
| List repos known to the release service | `GET /Build/repos-list` — endpoints.md#build |
| Configure a repo's hosting / deployment settings | flows/configure-and-run-build.md |
| Trigger a build and watch it | flows/configure-and-run-build.md |
| Check one build's status | `GET /Build?buildId=…` — endpoints.md#build |
| Read build reports | flows/build-reports-and-analytics.md |
| Wire SonarQube / DependencyTrack | flows/build-reports-and-analytics.md |
| Put my app on a custom domain | flows/custom-domains.md |
| Log a user into my app (tokens, MFA) | **blocks-iam** skill — the `/Auth/*` controller *here* is GitHub authorization, not app login |
| Verify/manage DNS domains platform-wide | **blocks-monitor** skill (Domain controller) |
| Project creation, storage, secrets | **blocks-os** skill |

## Key concepts

- **GitHub authorization** — an OAuth link between your Blocks project and a GitHub account, managed by this service's `Auth` controller (`IsAuthorized`, `AccessToken`, `DeleteAuthorization`, `RemoveAuthorization`). Distinct from application auth (blocks-iam).
- **Repo** — a GitHub repository visible to the service. GitHub-side identity comes from `/Github/repos`; once registered for builds it appears in `/Build/repos-list` and is addressed by `repoId`.
- **Build** — one CI run for a repo, addressed by `buildId` (returned by `POST /Build/manual`). Status via `GET /Build`, artifacts via `GET /Build/reports`.
- **Deploy settings** — the hosting hierarchy `HostingProvider → Region → MachineConfig` (see contracts.md). Selected per repo via ids: `hostingProviderId`, `regionId`, `machineConfigId`.
- **Webhook** — a GitHub push hook registered by `GET /Github/CreateWebhook`; GitHub then calls `POST /Github/webhook` on every push, which triggers auto-deploy.
- **Analytics tools** — SonarQube (code quality) and DependencyTrack (dependency vulnerabilities), attached to builds via the `AnalyticsTool` controller.
- **DeploymentHubBroadcast** — a platform-internal fan-out endpoint (`X-Internal-Secret` header) that pushes deployment events to connected clients. Not for application code; documented for completeness.

## Flows

| Flow | Use when |
|---|---|
| flows/connect-github.md | Authorizing GitHub, browsing repos/branches, registering the auto-deploy webhook, disconnecting |
| flows/configure-and-run-build.md | Setting hosting options on a repo, triggering a build, polling status |
| flows/build-reports-and-analytics.md | Reading build reports; wiring SonarQube / DependencyTrack |
| flows/custom-domains.md | Pointing a deployed app at a custom domain |

## Conventions & gotchas

- **Sparse response documentation.** Only two endpoints in this service document a response schema: `POST /Build/manual` (`BuildResponse`, carries `buildId`) and `POST /Build/repo-update` (`BaseApiResponse`). Every other endpoint returns "200 OK, no schema" in swagger — inspect the live response before writing code that depends on its shape, and say so in generated code comments.
- **Envelope.** Where documented, responses use `{ isSuccess, errors, data, message, statusCode }` — `errors` is a **dictionary** (`{ field: message }`), not an array. `statusCode` is an integer enum mirroring HTTP status numbers; member names are not published (contracts.md `HttpStatusCode`).
- **Query-param casing is inconsistent per endpoint.** `RepoId` (repo-details, CreateWebhook) vs `repoId` (GithubBranchExists) vs `repo` (branches, clone) vs `buildId` (Build, reports, AnalyticsTool) vs `Search`/`PageNumber`/`PageSize` (repos). Copy the exact casing from endpoints.md; do not normalize.
- **Mutating GETs.** `GET /Github/CreateWebhook` and `GET /Github/clone` perform actions despite being GETs. Don't call them speculatively or in prefetch/retry loops.
- **`manual` vs `run-build`.** Both accept the same `RepoBuildRequest` body; the swagger does not document how they differ. Prefer `POST /Build/manual` for programmatic triggering (it is the one with a documented response including `buildId`); test `run-build` against your project before relying on it.
- **Two disconnect endpoints.** `DELETE /Auth/DeleteAuthorization` and `POST /Auth/RemoveAuthorization` both exist; the difference is not documented. See flows/connect-github.md.
- **Webhook receiver ≠ webhook creator.** You call `CreateWebhook`; GitHub calls `POST /Github/webhook?x-blocks-key=…`. You normally never call the latter yourself.
- **OAuth initiation is not in the swagger.** Only the code exchange (`GET /Auth/AccessToken?code=…`) is exposed. Start the GitHub consent flow from OS portal.
- All request bodies are camelCase JSON (`repoId`, `projectKey`, `hostingProviderId`) — this service does **not** use the snake_case style of the iam login payloads. `projectKey` = your Blocks Key (`X_BLOCKS_KEY`).

## Files

- endpoints.md — every endpoint with exact params and shapes (generated from swagger)
- contracts.md — TypeScript types (generated)
- flows/ — step-by-step multi-endpoint procedures
- references/react.md — React 19 integration guide
