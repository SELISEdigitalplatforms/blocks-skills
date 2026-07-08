# SELISE Blocks Skills

Claude Code skills for building on the **SELISE Blocks v4 platform** (`https://api.seliseblocks.com`). Each skill teaches Claude one focused job on a Blocks service — the exact endpoints, how to chain them into a working flow, and how to wire them into a React frontend.

Every skill is **verified against the live API** (driven with real credentials), not just read off the swagger. Where the platform is quirky — mutating GETs, non-standard envelopes, unnamed integer enums, endpoints missing from swagger — the skills say so plainly instead of guessing.

Describe what you want to do; Claude picks the skill, follows its flow, and writes code grounded in the real API contracts — no invented routes, no invented fields.

> v4 renamed the v1 services. Old names appear only as recognition aliases: **idp → iam**, **uds/data-gateway → data**, **uilm → localization**. All `/…/v1/` routes are dead.

## The core split: configuration vs. implementation

Blocks work divides into two modes, and the skills are organized around the difference:

- **Configuration** — acting *on* a project as an admin: defining schemas, wiring SSO, seeding roles, editing org settings. This happens **inside a project/tenant**, so it requires the shared **initial steps** first: log in → list projects (`/os/v4/Project/Gets`) → **impersonate** into the target tenant to get a project-scoped token. Configuration calls then use **`x-blocks-key: <project-tenant-id>`** + the impersonated (or login) token + `projectKey: <project-tenant-id>`. (Root tenant is the `x-blocks-key` only for `Project/Gets` and `impersonate`; an in-project call keyed with root 401/403s.)
- **Implementation** — the frontend app acting *as the signed-in user*: running GraphQL CRUD, uploading files, logging in via SSO, reading `/iam/me`. This needs **no initial steps** — the app uses the public **project key** (the project's tenant id, `x-blocks-key`) plus the end user's own session token.

The initial steps are documented once, as `flows/get-into-project.md`, inside each **configuration** skill. Implementation skills never reference them.

## Skills

### Data (`data/v4`)

| Skill | Mode | Covers |
|-------|------|--------|
| `blocks-data-gateway-configuration` | Configuration | Create/edit schemas & fields, field validation (incl. AI regex), access policies, **reload**; plus mock-data cleanup and schema-exchange between projects. Embeds the initial-steps flow. |
| `blocks-data-gateway-crud` | Implementation | GraphQL CRUD against the runtime gateway (`POST /data/v4/gateway`): `get<Collection>` queries, `insert/update/delete<Schema>` mutations, and typed React hooks. |
| `blocks-data-storage` | Implementation | Files / DMS: pre-signed-URL upload pipeline, download, folders, tags/versions, delete. |

### IAM — SSO / OIDC (`iam/v4`)

| Skill | Mode | Covers |
|-------|------|--------|
| `blocks-iam-sso-oidc-configuration` | Configuration | Ensure a `blocks-oidc` identity provider exists — create the OIDC client and identity provider. Embeds the initial-steps flow. |
| `blocks-iam-sso-oidc-implementation` | Implementation | The hosted authorization-code login flow in the frontend: `/idp/initiate` → redirect → `/idp/callback` (sets the session cookie). |

### Localization (`localization/v4`)

| Skill | Mode | Covers |
|-------|------|--------|
| `blocks-localization-configuration` | Configuration | Author translations: manage languages, feature modules, and translation keys (per-language values), then **generate** the runtime language files. Embeds the initial-steps flow. |
| `blocks-localization-implementation` | Implementation | Frontend i18n: load languages/modules, fetch generated translation files (`/Key/GetUilmFile`), render by key, and a live language switcher. |

### IAM — management (`iam/v4`) — usable for configuration **and** implementation

| Skill | Covers |
|-------|--------|
| `blocks-iam-account` | Account/session actions: activate a new user (`/auth/activate`) and logout (`/auth/logout`). |
| `blocks-iam-access-control` | RBAC: create/update/list/get permissions and roles; add/remove permissions on a role. |
| `blocks-iam-users` | Users CRUD, current user (`/iam/me`), activity timeline, and assigning roles/permissions to a user. |
| `blocks-iam-organizations` | Organizations CRUD, "my organizations", and the project org-creation / multi-org config. |

These four run as **configuration** (admin tooling, with an impersonated project token via the initial steps) or as **implementation** (a frontend admin screen, with the signed-in user's token) — same endpoints, different token source.

### Local development

| Skill | Mode | Covers |
|-------|------|--------|
| `blocks-frontend-local-https` | Implementation (dev tooling) | Run a React app locally over HTTPS on its real project domain (openssl cert + hosts entry + Vite/CRA/Next config) — required for SSO session cookies to be set. |

### Meta

| Skill | Covers |
|-------|--------|
| `skill-creator` | Tooling for creating, editing, evaluating, and optimizing skills in this repo. |

## Skill layout

Skills are focused and hand-authored; not every skill needs every file.

```
skills/blocks-<name>/
├── SKILL.md            ← routing: auth model, endpoint map, key concepts, gotchas
├── flows/              ← step-by-step procedures
│   ├── get-into-project.md   ← the shared "initial steps" (configuration skills only)
│   └── <kebab-name>.md
├── endpoints.md        ← exact request/response contracts (management skills)
└── references/
    └── react.md        ← typed client + TanStack Query hooks (React 19 stack)
```

`SKILL.md` frontmatter carries the trigger-rich `description` that routes requests to the skill. Configuration skills carry `flows/get-into-project.md`; implementation skills do not.

## Auth & keys (verified live)

- **`x-blocks-key` on every request.** Every Blocks API call carries the `x-blocks-key` header — **`auth-login` is the only exception** (it takes just username/password). Even pre-authorized calls (the storage pre-signed PUT) include it. The value is the tenant id of the project that owns the service (see below).
- **Login:** `POST https://api.seliseblocks.com/iam/v4/auth-login` (note the dash) with `{ "username", "password" }` → `access_token` (~5 min) + `refresh_token`. The token's **`tenant_id` claim is the project/root tenant id.**
- **Configuration** needs a project-scoped token via impersonation: `POST https://iam.seliseblocks.com/api/auth/impersonate` with `{ targeted_tenant_id, refresh_token }`. Then **`x-blocks-key: <project-tenant-id>`**, `Authorization: Bearer <impersonated (or login) token>`, `projectKey: <project-tenant-id>`. Root tenant is the `x-blocks-key` only for `Project/Gets` + `impersonate`; each service call must use the tenant that owns that service (verified: data/IAM and localization can live in different project tenants).
- **Implementation** needs only the **project key** (the project's tenant id — public, shippable as `x-blocks-key`) and the end user's session token. In a frontend that's `VITE_BLOCKS_PROJECT_KEY = <project tenant id>`.
- **URL prefix:** the served base is `https://api.seliseblocks.com/<svc>/v4`; the swagger's `/api/...` prefix is **not** part of the served path (`/data/v4/...`, `/iam/v4/iam/...`).

`.env` for admin tooling (never commit): `BLOCKS_API_URL`, `X_BLOCKS_KEY` (account key for login), `BLOCKS_USERNAME`, `BLOCKS_PASSWORD`.

## Frontend stack

`references/react.md` in each skill targets the [blocks-construct-react](https://github.com/SELISEdigitalplatforms/blocks-construct-react) stack: **React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui + TanStack Query + Zustand**. Client-safe values go in `VITE_`-prefixed env vars; tokens come from the auth store at runtime.

## Example prompts

```
Create a Product schema with title/price and reload it              → blocks-data-gateway-configuration
Wire create/read/update/delete for Product into my React app        → blocks-data-gateway-crud
Upload a PDF and get a download link                                → blocks-data-storage
Enable SSO / register an OIDC client for my project                 → blocks-iam-sso-oidc-configuration
Add a login button and handle the OIDC callback                     → blocks-iam-sso-oidc-implementation
Run my app locally over HTTPS on its real domain for SSO            → blocks-frontend-local-https
Create a role and grant it these permissions                        → blocks-iam-access-control
Invite a user and set their roles                                   → blocks-iam-users
Enable multi-org and list my organizations                          → blocks-iam-organizations
Activate a new account with the emailed code                        → blocks-iam-account
Add German + Bengali translations for my login screen               → blocks-localization-configuration
Add a language switcher and translate the UI                        → blocks-localization-implementation
```

## Regenerating endpoint docs (optional)

`tools/generate-api-docs.py` can pull a service's swagger to bootstrap `endpoints.md`. It's a starting point only — the committed skills are hand-authored and **corrected against live API behavior**, which swagger alone doesn't capture (served paths, real response shapes, undocumented endpoints like the GraphQL gateway).

```bash
python3 tools/generate-api-docs.py iam data
```

## License

MIT — see `LICENSE`.
