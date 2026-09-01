# AGENTS.md

Entry point for coding agents. Read this first, match the user's request to a skill in the routing table, load that skill, and follow it. This file is the only source of instructions for this repo — other agent instruction files point here and add nothing of their own.

Skills are the ground truth for CLI/SDK usage. This file routes; the skill owns the flow. Don't duplicate a skill's steps here.

<!-- blocks-skills:distributable:start -->
<!-- Everything between these markers is what BOOTSTRAP.md vendors into consumer repos.
     Keep it free of anything true only of this repo or only of a given checkout. -->

## Routing is your job, not the user's

**Never expect the user to name a skill.** There is no `/skill` invocation, no slash command, no menu. Users describe what they want in plain language — "let users upload a profile picture", "why does login redirect back to the login page", "add German translations" — and **you** map that to the right skill and execute it.

- Do **not** ask "which skill should I use?" or list skills for the user to pick from. Reading the request and choosing is your work.
- Do **not** wait to be told. Once the request matches a row in the routing table, load that skill and proceed.
- If the request genuinely spans several skills, pick the one that owns the *first* concrete step, run it, then move to the next. Sequence them yourself.
- If nothing matches, check the vendored skill directories on disk before concluding no skill applies — the table below can lag the vendored set. The published catalog is [`blocks-cli/blocks-skills/`](https://github.com/SELISEdigitalplatforms/blocks-cli/tree/main/blocks-skills).
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

**Skills are vendored files, not a CLI command.** They live on disk as `.codex/skills/<name>/SKILL.md`, with Claude Code discovering the same set through `.claude/skills/`. Read the vendored copy directly.

There is **no `blocks skill list`/`show`/`add`**, and the package does not bundle the skill tree. Don't reach for those commands, and don't treat their absence as a broken install.

If a skill named in the routing table isn't vendored here, the fix is to re-run the vendoring runbook (`BOOTSTRAP.md` in this repo's source) — not to fetch the file ad hoc or write a replacement from memory. The published catalog is [`blocks-cli/blocks-skills/`](https://github.com/SELISEdigitalplatforms/blocks-cli/tree/main/blocks-skills); read from there only to confirm a name, never as a substitute for vendoring.

## Hard rules

- **Never raw `fetch`/`curl` against `api.seliseblocks.com`.** Use the `blocks` CLI or the `@seliseblocks/client` SDK. Every skill states which surface it uses. Bypassing them with raw HTTP is the failure mode these skills exist to prevent.
- **`--dry-run` before `--yes`** on every mutating CLI command. Get human confirmation before destructive or cloud-mutating operations.
- **Never read the CLI's local storage files** (config/token/secret files on disk) or print anything inside them — client ids, root tenant id, account names, tokens. Interact only through `blocks` commands. To repair broken state use `blocks login`, `blocks auth remove <account>`, `blocks projects list --json`, `blocks use <tenantId>`.
- **`blocks projects create` accepts the Blocks terms on the user's behalf** (`isAcceptBlocksTerms`, `isUseBlocksExclusively`). Never run it without explicit consent to that, and never to "try something" — it provisions real cloud tenancy. Run `--dry-run --json` first, then `--yes` only after approval. It creates exactly one app in the `dev` environment; further environments are portal-only.
- **Never expose secrets or credentials.** The former generic `blocks secrets` commands were removed because their backing API no longer accepts the CLI's authentication mode; do not work around their absence with raw HTTP.
- **Don't attribute work to an AI tool** anywhere in this repo — no assistant names in docs, comments, or commit messages.

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

### Platform operations

| Skill | Use when | Surface |
|---|---|---|
| `blocks-release-deployment` | Triggering and inspecting Release builds/deploys: `release deploy`, `release status`, `builds get/list`. Triggers a configured pipeline only — no artifact upload. | CLI |

### Local development

| Skill | Use when | Surface |
|---|---|---|
| `blocks-frontend-local-https` | Running a scaffolded app over HTTPS on its real project domain — required for hosted login, since plain HTTP and `localhost` never receive the session cookie. Covers `npm run cert`, trusting the cert, the hosts entry, and "SSO cookie not set" / Vite "Blocked request" errors. | Scaffold |

### Routing notes

- **Own account vs. other users vs. role definitions** — `blocks-iam-account` / `blocks-iam-users` / `blocks-iam-access-control`. Pick by whose record changes.
- **Configuration vs. implementation** — most areas split in two: a CLI skill that defines the thing and an SDK skill that consumes it at runtime. "Create a schema" is configuration; "fetch products" is implementation.
- **`notifier` sends, `notification` configures.** Different services.
- **`blocks-data-storage` operates on files; `blocks-storage-configuration` chooses the provider underneath.**
- Dependencies: schema work must be reloaded before CRUD sees it; SSO implementation needs a registered OIDC client and HTTPS on the real domain to test.

<!-- blocks-skills:distributable:end -->

## Where the skills live

The 19 skills in the routing table live in [`SELISEdigitalplatforms/blocks-cli`](https://github.com/SELISEdigitalplatforms/blocks-cli/tree/main/blocks-skills), under `blocks-skills/`. That is the source of truth for skill content and the tree [`BOOTSTRAP.md`](./BOOTSTRAP.md) vendors.

**This repo owns routing, not skills.** Editing a skill's content here is editing the wrong repository — there is no `skills/` directory to edit. What lives here is the routing table and rules above (inside the `blocks-skills:distributable` markers) and the vendoring runbook.

| Change | Repo |
|---|---|
| A skill's `SKILL.md`, flows, or references | `blocks-cli`, under `blocks-skills/` |
| Routing table, hard rules, workflow | this repo, inside the distributable markers |
| The vendoring procedure | this repo, `BOOTSTRAP.md` |

A new skill needs both halves: content in `blocks-cli`, and a routing-table row here. A skill missing from that table is invisible to agents and is never vendored — `BOOTSTRAP.md` treats the table as its manifest.

An older generation of these skills lived in this repo's `skills/` directory and drove `api.seliseblocks.com` over raw HTTP with manual impersonation (`x-blocks-key`/`PTOK`). That generation is **superseded and removed** — the current skills forbid raw HTTP outright.

## Skill authoring conventions

These govern skills authored in `blocks-cli`, and the routing-table row that accompanies them here:

- **`SKILL.md` frontmatter** is `name` + a trigger-rich, third-person `description`. The description is what routes a request — say what the skill does *and* the phrases and contexts that should invoke it, plus what it is **not** (name the sibling skill). Lean slightly pushy; under-triggering is the common failure.
- **Ground every claim in verified behavior.** Drive the real command or SDK call before documenting it. Capture real request/response shapes. If you can't verify something, mark it unverified rather than smoothing it over — never fabricate output or invent flags. Honesty beats completeness.
- **Style:** imperative, concrete, American spelling, tables over prose walls, no marketing language.
- **Name** the sibling skills a skill borders in its description, so misrouting between neighbors is caught. Do **not** link across skill directories — vendoring copies each directory independently, so every relative link must resolve inside the skill's own directory.
- **Scope:** one clear job per skill; split rather than sprawl. One skill per PR where practical.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full contribution bar.
