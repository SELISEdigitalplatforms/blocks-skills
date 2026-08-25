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
blocks skill list
blocks skill show blocks-bootstrap
blocks skill add <skill-name>     # vendor a skill into your project
```

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

### Platform operations

| Skill | Covers |
|---|---|
| `blocks-release-deployment` | Triggering and inspecting Release builds and deployments. |
| `blocks-secrets` | Saving, rotating, and reading named secret values such as captcha config or third-party API keys. |

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
Rotate our captcha provider key                           → blocks-secrets
Deploy the current branch and check the build             → blocks-release-deployment
```

## Safety

- Mutating CLI commands are run `--dry-run` first, then `--yes` — destructive and cloud-mutating operations get explicit confirmation.
- Local CLI storage files (config, tokens, secrets) are never read or printed directly; all state is inspected through `blocks` commands.
- `blocks secrets get` returns raw unredacted values. Treat that output as sensitive.

## Contributing

Skills are hand-authored and grounded in verified behavior — every command, flag, and response shape is confirmed against the real platform before it's documented. Anything that can't be verified is labeled as such rather than smoothed over. See [CONTRIBUTING.md](./CONTRIBUTING.md), and [AGENTS.md](./AGENTS.md) for the conventions agents follow.

## Repository state

The skills listed above are the current, CLI/SDK-based generation and live in [`SELISEdigitalplatforms/blocks-cli`](https://github.com/SELISEdigitalplatforms/blocks-cli/tree/main/blocks-skills), where they're published for `blocks skill list` / `show` / `add`.

An earlier generation in this repository drove the platform API directly over HTTP with manual impersonation. That approach is superseded — the current skills route everything through the CLI and SDK.

To vendor these skills into another repository, see [BOOTSTRAP.md](./BOOTSTRAP.md).

## License

MIT — see [LICENSE](./LICENSE).
