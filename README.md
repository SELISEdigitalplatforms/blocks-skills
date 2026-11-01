# SELISE Blocks Skills

Skills for building on the **SELISE Blocks** platform. Each skill teaches one focused job on a Blocks service — which commands or SDK calls to use, how to chain them into a working flow, and how to wire the result into an app.

Skills are driven entirely through the **`blocks` CLI** and the **`@seliseblocks/client` SDK** — never raw HTTP against the platform API. Every skill states which surface it uses and what it deliberately does *not* cover, so an agent can route a request to exactly one of them.

You do not need to name a skill. Describe what you want in plain language and the agent maps it to the right skill and runs it. See [AGENTS.md](./AGENTS.md) for the routing rules agents follow.

## Getting started

Install the CLI where you'll run terminal operations:

```bash
npm install -g @seliseblocks/cli-os@latest
blocks --version
```

Install the SDK inside your application:

```bash
npm install @seliseblocks/client@latest
```

Check your state and browse what's available:

```bash
blocks auth status --json
blocks doctor --json
blocks --help --json              # every implemented command
blocks help <family> --json       # summaries for one command family
blocks help <command> --json      # exact flags, scope, and mutation metadata
```

## Install the skills

Skills are files, not CLI commands — the CLI does not implement `blocks skill list` / `show` / `add` and does not bundle them. Pick **one** way per repo; with both, your agent sees every skill twice.

| Your agent | Install |
|---|---|
| **Claude Code** | `/plugin install selise-blocks --marketplace SELISEdigitalplatforms/blocks-skills` (Claude Code 2.1.275+), or `/plugin marketplace add SELISEdigitalplatforms/blocks-skills` then `/plugin install selise-blocks@selise-blocks` |
| **Cursor** | Install the `selise-blocks` plugin from this repo. To try a local checkout, symlink it to `~/.cursor/plugins/local/selise-blocks` and run **Developer: Reload Window**. |
| **Anything else** — Codex, Gemini CLI, Copilot, Qwen Code, OpenCode, … — or a repo you want pinned to a reviewed commit | Ask your agent: *Read `https://raw.githubusercontent.com/SELISEdigitalplatforms/blocks-skills/main/BOOTSTRAP.md` and follow it to bootstrap this repo.* See [BOOTSTRAP.md](./BOOTSTRAP.md). |

The plugin adds a `blocks` router skill that carries the routing table and hard rules below; a vendored install gets the same text in its `AGENTS.md` instead.

If login, project selection, or the app scaffold is in an unknown state, start with **`blocks-bootstrap`** — it detects the gaps and closes them before any other skill runs.

## The two surfaces

Most areas of the platform split into a pair of skills, and knowing which half you're in resolves most confusion:

- **CLI** — terminal and admin work, project-scoped: defining schemas, registering an OIDC client, authoring translations, managing users, rotating secrets, triggering deploys. Mutating commands run `--dry-run` first, then `--yes`.
- **SDK** — application code acting as the signed-in user: reading and writing records, uploading files, the login flow, rendering translations, sending mail.

"Create a Product schema" is CLI work. "Fetch products and render them" is SDK work. A few skills cover both halves of their area.

## Skills

### Start here

| Skill | Covers |
|---|---|
| `blocks-bootstrap` | Detect CLI/login/project state, close install and login gaps, resolve the app OIDC client, scaffold with `blocks new web`, and run `blocks init` in the app directory. Run this first whenever state is unknown. |

### Data

| Skill | Covers |
|---|---|
| `blocks-data-gateway-configuration` | The data model: schema authoring and push, data-source config, access policies, field validation rules, and reloading so changes go live. |
| `blocks-data-gateway-crud` | Reading and writing actual records through the runtime Data Gateway — per-item CRUD, GraphQL for joins and custom shapes, and schema/validation metadata. |
| `blocks-data-storage` | File and document management: upload/download, directory trees, paginated browsing and search, versions, rename/move/copy, trash and restore, sharing, access policies, inheritance. |
| `blocks-storage-configuration` | Which provider backs the file tree — Azure Blob, S3-compatible object storage, or local/SFTP — including credentials, region/endpoint, and strategy. |

### IAM

| Skill | Covers |
|---|---|
| `blocks-iam-account` | The signed-in user's own account: activation, forgot/reset/change password, logout, profile bootstrap, signup, and login-options discovery. |
| `blocks-iam-users` | Other users' records: invite, edit, activate/deactivate, list and search, grant or revoke roles and organization access. |
| `blocks-iam-access-control` | Roles and permissions — both read-only feature gating by the current user's access and the sensitive work of defining roles and permissions. |
| `blocks-iam-organizations` | Multi-tenant workspaces: the org switcher, switching active org context, public signup policy, and organization settings. |
| `blocks-iam-mfa` | Self-service MFA for the signed-in user — TOTP, OTP, method switching, backup codes — plus tenant-wide MFA policy. |
| `blocks-iam-sso-oidc-configuration` | Enabling SSO: registering an OIDC client and identity provider so users can sign in through hosted login. |
| `blocks-iam-sso-oidc-implementation` | The hosted login flow in app code: the redirect, the callback, session handling, route guards, and token refresh. |
| `blocks-captcha` | Login captcha configuration: register a reCAPTCHA or hCaptcha site key and secret, switch it on or off, see which configuration is enforced at login, and retire one. |

### Localization

| Skill | Covers |
|---|---|
| `blocks-localization-configuration` | Authoring translations: local dictionaries, validate/push/pull, languages and modules, glossary terms, and translation suggestions. |
| `blocks-localization-implementation` | Consuming translations at runtime: loading dictionaries, key lookup, and a working language switcher. |

### Messaging

| Skill | Covers |
|---|---|
| `blocks-mail` | Transactional email, plus server config, template management, and mailbox history. |
| `blocks-notifier` | Sending real-time and offline notifications, and a user's own notification inbox. |
| `blocks-notification` | Tenant notification-channel configuration — a separate service from `blocks-notifier`, and not for sending. |

### Backend logic

| Skill | Covers |
|---|---|
| `blocks-workflow` | Event-driven backend logic without a separate backend — data triggers, webhooks, schedules — authored as a JSON graph and imported, published, and exported from the terminal. |
| `blocks-functions` | Custom backend code: write a Node handler, save, test and deploy it from the terminal, inspect runs and logs, and call it from the app through the SDK or from a workflow step. |
| `blocks-proxy` | Calling a third-party API without shipping its URL or keys: proxy routes, secret-backed headers, access rules, timeouts/retries, OpenAPI import, and calling it from the app. |

### Platform operations

| Skill | Covers |
|---|---|
| `blocks-release-deployment` | Triggering and inspecting Release builds and deployments. |
| `blocks-secrets` | The project's secret store: create, rotate, lock, soft-delete/restore secrets, set who may read them, and review the audit trail. |

### Local development

| Skill | Covers |
|---|---|
| `blocks-frontend-local-https` | Running a scaffolded app over HTTPS on its real project domain — required for hosted login, since plain HTTP and `localhost` never receive the session cookie. |

## Example requests

No skill name needed — these route on their own:

```
I'm brand new to Blocks, get me set up                    → blocks-bootstrap
Create a Product schema with title and price              → blocks-data-gateway-configuration
Fetch products and render them in a list                  → blocks-data-gateway-crud
Let users attach a PDF to a record                        → blocks-data-storage
Switch our file storage to S3                             → blocks-storage-configuration
Enable single sign-on for my project                      → blocks-iam-sso-oidc-configuration
Login redirects back but the session doesn't stick        → blocks-iam-sso-oidc-implementation
Run my app locally over HTTPS so login works              → blocks-frontend-local-https
Create an editor role and grant it these permissions      → blocks-iam-access-control
Hide this button unless the user can approve invoices     → blocks-iam-access-control
Invite a user and set their roles                         → blocks-iam-users
Add a password reset page                                 → blocks-iam-account
Let users turn on two-factor auth                         → blocks-iam-mfa
Add an organization switcher                              → blocks-iam-organizations
Add German translations for the login screen              → blocks-localization-configuration
Add a language switcher to the app                        → blocks-localization-implementation
Send a welcome email when someone signs up                → blocks-mail
Notify a user when their order ships                      → blocks-notifier
When an order is created, call our fulfilment API         → blocks-workflow
Write a function that prices a cart at checkout           → blocks-functions
Call the weather API from the browser without its key     → blocks-proxy
Deploy the current branch and check the build             → blocks-release-deployment
```

## Safety

- Mutating CLI commands are run `--dry-run` first, then `--yes` — destructive and cloud-mutating operations get explicit confirmation.
- Local CLI storage files (config, tokens, secrets) are never read or printed directly; all state is inspected through `blocks` commands.
- `blocks secrets` commands never print a secret value — `list`, `get`, and `audit` return metadata only, and dry-run output redacts values. `set` and `rotate` take a value only from `--value-file` or `--value-env` (never read the file or variable back yourself) so it never appears in a transcript or shell history.

## Anonymous reporting

Bootstrap asks once whether the agent may send anonymous reports — bugs, quirks, limitations, learnings, suggestions — to the Blocks team at `https://seliseblocks.com/api/reports`. The answer is recorded in the bootstrapped repo and honored: opted in, the agent files reports as it hits things and tells you the id; opted out, it never sends on its own. Either way you can ask for a one-off report or flip the setting at any time by saying so. A report never carries names, emails, tokens, secrets, or home-directory paths. The rules are under **Report what you find** in [AGENTS.md](./AGENTS.md).

## Contributing

Skills are hand-authored and grounded in verified behavior — every command, flag, and response shape is confirmed against the real platform before it's documented. Anything that can't be verified is labeled as such rather than smoothed over. See [CONTRIBUTING.md](./CONTRIBUTING.md), and [AGENTS.md](./AGENTS.md) for the conventions agents follow.

## Repository layout

```
skills/<name>/          # one directory per skill — the source of truth
skills/blocks/          # router skill for plugin installs, generated from AGENTS.md
AGENTS.md               # routing table and hard rules (the region vendored into consumer repos)
BOOTSTRAP.md, bootstrap/ # the vendoring runbook
.claude-plugin/         # Claude Code plugin + marketplace manifests
.cursor-plugin/         # Cursor plugin manifest
scripts/                # lint-skills.mjs, generate-router.mjs
```

Skills lived in [`blocks-cli`](https://github.com/SELISEdigitalplatforms/blocks-cli) under `blocks-skills/` until Nov 2026 and moved here with their history. An earlier generation in this repository drove the platform API directly over HTTP with manual impersonation; that approach is superseded — the current skills route everything through the CLI and SDK.

## License

MIT — see [LICENSE](./LICENSE).
