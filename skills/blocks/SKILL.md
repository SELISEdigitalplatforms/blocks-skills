---
name: blocks
description: "Start here for any SELISE Blocks work. Routes a plain-language request — sign-in and projects, SSO, users, roles, MFA, data schemas and records, file storage, translations, mail, notifications, workflows, functions, proxies, secrets, deployments — to the right Blocks skill, and carries the rules every Blocks skill follows: the blocks CLI and @seliseblocks/client SDK only, never raw HTTP to the platform API; --dry-run before --yes; never read the CLI's credential files; when to report a finding. Use whenever work touches SELISE Blocks, the blocks CLI, or @seliseblocks/client."
---

<!-- GENERATED from the distributable region of AGENTS.md by scripts/generate-router.mjs.
     Edit AGENTS.md, then run npm run generate:router. -->

# SELISE Blocks

Plugin version: `1.0.0`. This skill routes; the skill it routes to owns the flow. Don't duplicate a skill's steps from memory.

## Routing is your job, not the user's

**Never expect the user to name a skill.** There is no `/skill` invocation, no slash command, no menu. Users describe what they want in plain language — "let users upload a profile picture", "why does login redirect back to the login page", "add German translations" — and **you** map that to the right skill and execute it.

- Do **not** ask "which skill should I use?" or list skills for the user to pick from. Reading the request and choosing is your work.
- Do **not** wait to be told. Once the request matches a row in the routing table, load that skill and proceed.
- If the request genuinely spans several skills, pick the one that owns the *first* concrete step, run it, then move to the next. Sequence them yourself.
- If nothing matches, check the installed skills (see **Loading a skill**) before concluding no skill applies — the table below can lag the installed set. The published catalog is [`skills/`](https://github.com/SELISEdigitalplatforms/blocks-skills/tree/main/skills) in the blocks-skills repo.
- Ask the user only about things the routing table cannot settle: a destructive confirmation, a missing credential, or an ambiguous *goal* — never about which skill to run.

The routing table exists so you can decide unaided. Treat a request that names no skill as the normal case, because it is.

## Workflow

1. Understand the objective.
2. If login/project/app state is unknown, probe (below) and start with **`blocks-bootstrap`**.
3. Match the request against the **Skill routing table** yourself, then load the skill by reading its vendored `SKILL.md` (see **Loading a skill** below).
4. Inspect the existing implementation before changing it.
5. Make the smallest correct change, then verify it.

## Prerequisites

The `blocks` CLI is required for terminal/admin work:

```bash
npm install -g @seliseblocks/cli-os@latest
blocks --version
```

**Do not install it automatically.** If `blocks --version` fails, ask first. The SDK for app code is `npm install @seliseblocks/client@latest`.

Read-only probe when state is unknown:

```bash
blocks --version
blocks auth status --json
blocks doctor --json
```

If `blocks` is missing, stop the probe and ask before installing. Don't claim bootstrap is runnable until the CLI exists.

**Never guess a command or a flag — ask the CLI.** `blocks help <command>` prints one command's exact positionals, flags, scope, and whether it mutates; `blocks help <family>` lists a family; `blocks --help --json` lists every command. Read that before running anything unfamiliar, and prefer it over any command spelling you remember, including one from this file. Set `BLOCKS_STRICT_FLAGS=1` in scripted runs so an unrecognized flag hard-fails instead of being warned and ignored.

## Loading a skill

**Skills are files, not a CLI command.** They reach an agent one of two ways, and a given repo uses one, not both — with both, the agent sees every skill twice:

- **Plugin** (Claude Code, Cursor). The `selise-blocks` plugin installs every skill, and the agent lists and loads them by name like any other plugin skill.
- **Vendored** (every other agent, or any repo set up with `BOOTSTRAP.md`). Skills live on disk as `.agents/skills/<name>/SKILL.md`, the cross-agent location most coding agents read natively. An agent that only reads its own directory (Claude Code reads `.claude/skills/`, Qwen Code reads `.qwen/skills/`) finds the same set through a pointer stub there whose body sends you to the `.agents` copy. Read the `.agents` copy directly.

There is no `blocks skill list`/`show`/`add` command, and the CLI package does not bundle the skill tree. Don't reach for those commands, and don't treat their absence as a broken install.

If a skill named in the routing table isn't installed, the fix is to update the plugin, or re-run the vendoring runbook (`BOOTSTRAP.md` in the blocks-skills repo) — not to fetch the file ad hoc or write a replacement from memory. The published catalog is [`skills/`](https://github.com/SELISEdigitalplatforms/blocks-skills/tree/main/skills) in the blocks-skills repo; read from there only to confirm a name, never as a substitute for installing.

## Hard rules

- **Never raw `fetch`/`curl` against `api.seliseblocks.com`.** Use the `blocks` CLI or the `@seliseblocks/client` SDK. Every skill states which surface it uses. Bypassing them with raw HTTP is the failure mode these skills exist to prevent. The one sanctioned raw `curl` is the anonymous report endpoint at `seliseblocks.com/api/reports` (see **Report what you find**), which is not the platform API.
- **Never send a report to Blocks unless reporting is `opt-in` or the user asked for that report**, and never put anything identifying or secret in one. The rules are in **Report what you find** below.
- **`--dry-run` before `--yes`** on every mutating CLI command. Get human confirmation before destructive or cloud-mutating operations.
- **Never read the CLI's local storage files** (config/token/secret files on disk) or print anything inside them — client ids, root tenant id, account names, tokens. Interact only through `blocks` commands. To repair broken state use `blocks login`, `blocks auth remove <account>`, `blocks projects list --json`, `blocks use <tenantId>`.
- **`blocks projects create` accepts the Blocks terms on the user's behalf** (`isAcceptBlocksTerms`, `isUseBlocksExclusively`). Never run it without explicit consent to that, and never to "try something" — it provisions real cloud tenancy. Run `--dry-run --json` first, then `--yes` only after approval. It creates exactly one app in the `dev` environment; further environments are portal-only.
- **Never expose secrets or credentials.** `blocks secrets get` and friends exist for operating the store, not for printing values into a conversation or a file the user did not ask for. Never work around a missing capability with raw HTTP.
- **Don't attribute work to an AI tool** anywhere in this repo — no assistant names in docs, comments, or commit messages.

## Report what you find

When something in Blocks does not behave as documented, cannot do what you need, or took real effort to figure out, it is worth a report to the Blocks team: a bug, a quirk, a limitation, a learning, or a suggestion. Reports are anonymous, need no account, and go to `https://seliseblocks.com/api/reports` — a website endpoint, not the platform API, so the raw-HTTP rule above does not apply to it.

**Whether you may send one on your own is the user's choice, recorded once at bootstrap** in `.agents/skills/.blocks-reporting`. Read that file before deciding:

| `reporting=` | What you do |
|---|---|
| `opt-in` | File a report whenever you hit something worth reporting, without asking each time. Tell the user what you sent and the id that came back. |
| `opt-out`, or the file is missing | Never send anything on your own initiative. You may still say that something looks worth reporting and offer to file it. |

A plugin install has no such file until the user asks for one, so it starts as opt-out. Turning reporting on writes `.agents/skills/.blocks-reporting` in the repo the same way.

Two things hold regardless of the setting:

- **The user can ask for a one-off report at any time** ("report this to Blocks", "send them this finding"). File it, following the steps below.
- **The user can change the setting at any time** ("turn Blocks reporting on", "stop sending reports"). Rewrite the file with the new value — the only accepted values are `reporting=opt-in` and `reporting=opt-out` — and confirm what it now says. Nothing else needs to change; the file is the whole preference.

### Filing a report

1. Read `https://seliseblocks.com/api/reports` once per session; it explains every field and what the answers mean.
2. In a temp directory (`mktemp -d`), not the repo, write `blocks-report.md` starting from `https://seliseblocks.com/api/reports/template`. Fill in `cli` (`blocks --version`), `sdk` (the installed `@seliseblocks/client` version, if used), `agent` (the harness, never a person), `model`, and `platform`. For `skills`, use `name@<version>`. Skills carry no version of their own: when vendored, use the first seven characters of `commit` (`skills_commit` in an older stamp) from `.agents/skills/.blocks-skills-source`; when installed as a plugin, use `plugin-<version>` with the plugin version stated in the `blocks` skill. Set `security: true` when the finding is a security risk. Say what was run, what came back, what was expected, and how to reproduce it.
3. Read the file back for anything listed under **What never goes in a report**, then validate and send:

   ```bash
   curl -fsS -X POST https://seliseblocks.com/api/reports/validate -H "Content-Type: text/markdown" --data-binary @blocks-report.md
   curl -fsS -X POST https://seliseblocks.com/api/reports -H "Content-Type: text/markdown" --data-binary @blocks-report.md
   ```

   Fix anything `validate` returns as an error before sending. A `201` means it is recorded; tell the user the `id` from the answer. On `429` wait for `Retry-After`; on `503` keep the file and retry later rather than dropping the report.

### What never goes in a report

Nothing that identifies a person or grants access: no names, emails, tokens, secrets, cookies, or paths under a home directory. Trim logs to the relevant lines and read them for leaks before sending — the endpoint strips some of this as a safety net, but you are the guard, not it. Tenant ids and project keys are public and fine. Keep the user's application code and business data out unless a minimal excerpt is needed to reproduce the finding, and strip anything identifying from that excerpt too.

## Skill routing table

Surface: **CLI** = terminal/admin, project-scoped · **SDK** = `@seliseblocks/client` in app code · **Both** = each surface covers part of the job.

### Start here

| Skill | Use when | Surface |
|---|---|---|
| `blocks-bootstrap` | New user, or `not_logged_in` / `project_not_selected`. Detects state via `blocks auth status --json` / `doctor --json`, closes install/login/project gaps, resolves the app OIDC client, scaffolds with `blocks new web`, and runs `blocks init` inside the app dir only when the work needs project-local Blocks files. **Run before any other skill when state is unknown.** | CLI |

### Data

| Skill | Use when | Surface |
|---|---|---|
| `blocks-data-gateway-configuration` | Defining, editing, securing, validating, or reloading the **data model** — schema fields, access policies, validation rules. `data config/schema/rules/validation/reload`, or the composed `data sync`. | CLI |
| `blocks-data-gateway-crud` | Reading or writing **actual records** through a Data schema from app code. `data.collection(name)` for per-item CRUD, `data.graphql()` for joins/custom shapes. | SDK |
| `blocks-data-storage` | File and document features: upload/download, directory trees, paginated browse/search, versions, rename/move/copy, trash/restore, sharing, ACLs, inheritance. | Both |
| `blocks-storage-configuration` | Choosing/rotating which **provider** backs the file tree (Azure Blob, S3-compatible, local/SFTP) — hosts, credentials, region/endpoint, strategy. Not file operations. | CLI |

### IAM

| Skill | Use when | Surface |
|---|---|---|
| `blocks-iam-account` | The signed-in user's **own** account: activation, forgot/reset/change password, logout(-all), profile bootstrap (`iam.me`/`updateMe`), signup, login-options discovery. | SDK |
| `blocks-iam-users` | Managing **other** users: invite, edit, activate/deactivate, list/search, grant/revoke roles and org access. | Both |
| `blocks-iam-access-control` | RBAC. Two facets: read-only feature-gating by the current user's roles/permissions (common, safe), and creating/editing role & permission definitions (sensitive, human-confirmed only). | Both |
| `blocks-iam-organizations` | Multi-tenant workspaces: org switcher, switching active org context (SDK-only), public signup policy, and — human-confirmed — creating/editing orgs and signup config. | Both |
| `blocks-iam-mfa` | Self-service MFA for the signed-in user (TOTP enroll/verify, OTP, method switch, disable, backup codes) plus tenant-wide MFA **policy** admin. Not admin-forcing MFA onto another user. | Both |
| `blocks-iam-sso-oidc-configuration` | **Enabling** SSO: register an OIDC client and identity provider. Portal remains a valid alternative, especially for federated providers (Google/Azure/Okta). Not `blocks login` — that's the CLI's own login. | CLI |
| `blocks-iam-sso-oidc-implementation` | Extending or debugging the hosted login flow the scaffold already ships: `redirectToProvider` → `/login/callback` → session, `AuthProvider`, `RequireAuth` guards, token refresh, redirect loops, sessions that don't stick. | SDK |
| `blocks-captcha` | Login CAPTCHA for the project: register a reCAPTCHA or hCaptcha site key and secret, enable/disable, list and inspect configs via `captcha list/get/save/enable/disable/delete`. Not the frontend widget itself. | CLI |

### Localization

| Skill | Use when | Surface |
|---|---|---|
| `blocks-localization-configuration` | **Authoring** translations: local i18n JSON dictionaries, validate/push/pull, languages and modules, glossary terms, AI translation suggestions. | CLI |
| `blocks-localization-implementation` | **Consuming** translations at runtime: language/module discovery, loading dictionaries, `t()` lookup, a language switcher that reloads and re-renders. | SDK |

### Messaging

| Skill | Use when | Surface |
|---|---|---|
| `blocks-mail` | Transactional email — `mail.send()`/`sendToAny()` from app code, or administering SMTP/inbound config, templates, and mailbox history. | Both |
| `blocks-notifier` | **Sending** real-time/offline notifications and managing a user's own notification inbox (notify, list, unread, mark-read). | Both |
| `blocks-notification` | **Configuring** tenant notification *channels* — a different backing service from `notifier`, and not for sending. No SDK path exists. | CLI |

### Backend logic

| Skill | Use when | Surface |
|---|---|---|
| `blocks-workflow` | Event-driven backend logic without a separate backend: react to Data Gateway inserts/updates/deletes, expose a webhook, run on a schedule, call external APIs. Authors the workflow graph as JSON and loads it with `logic workflow import/export/save/publish/unpublish`. No SDK path. | CLI |
| `blocks-functions` | **Custom backend code**: a Node handler the platform runs on demand. Write `index.js`, then `logic function save/test/deploy` (plus runs, logs, replay); call it from app code with `blocksClient.logic.functions.call()/invoke()` or from a workflow `function` step. Triggers (methods, Public vs Token, sync vs async), variables and `{{secret.<id>}}` references. | Both |
| `blocks-proxy` | **Calling a third-party API without exposing its URL or keys**: configure a proxy with `logic proxy *` (routes, `{{$VAR.name}}` secret headers, access, timeout/retry/breaker, rate limit, OpenAPI import, versions, request logs), then call it with `blocksClient.logic.proxy.request()`. | Both |

### Platform operations

| Skill | Use when | Surface |
|---|---|---|
| `blocks-release-deployment` | Triggering and inspecting Release builds/deploys: `release deploy`, `release status`, `builds get/list`. Triggers a configured pipeline only — no artifact upload. | CLI |
| `blocks-secrets` | The project secret store: create named secrets from a value, file or dotenv, rotate, lock/unlock, delete/restore, access checks and audit via `secrets *`. Values are never echoed back. | CLI |

### Local development

| Skill | Use when | Surface |
|---|---|---|
| `blocks-frontend-local-https` | Running a scaffolded app over HTTPS on its real project domain — required for hosted login, since plain HTTP and `localhost` never receive the session cookie. Covers `npm run cert`, trusting the cert, the hosts entry, and "SSO cookie not set" / Vite "Blocked request" errors. | Scaffold |

### Routing notes

- **Own account vs. other users vs. role definitions** — `blocks-iam-account` / `blocks-iam-users` / `blocks-iam-access-control`. Pick by whose record changes.
- **Configuration vs. implementation** — most areas split in two: a CLI skill that defines the thing and an SDK skill that consumes it at runtime. "Create a schema" is configuration; "fetch products" is implementation.
- **`notifier` sends, `notification` configures.** Different services.
- **Inline call vs. workflow** — a single call the app makes itself ("send this email", "save this record") belongs to that service's skill. Reach for `blocks-workflow` only when the logic must run server-side on an event, webhook, or schedule.
- **Proxy vs. function vs. workflow** — forwarding to one third-party API with a hidden key is `blocks-proxy`; code you write (validation, computation, several calls, a webhook handler) is `blocks-functions`; a multi-step graph started by a data event or schedule is `blocks-workflow`, which can call both as steps.
- **`blocks-data-storage` operates on files; `blocks-storage-configuration` chooses the provider underneath.**
- Dependencies: schema work must be reloaded before CRUD sees it; SSO implementation needs a registered OIDC client and HTTPS on the real domain to test.
