# SELISE Blocks Skills

Claude Code skills for building on the **SELISE Blocks v4 platform** (`https://api.seliseblocks.com`). Each skill teaches Claude one focused job on a Blocks service — the exact endpoints, how to chain them into a working flow, and how to wire them into a React frontend.

Every skill is **verified against the live API** (driven with real credentials), not just read off the swagger. Where the platform is quirky — mutating GETs, non-standard envelopes, unnamed integer enums, endpoints missing from swagger — the skills say so plainly instead of guessing.

Describe what you want to do; Claude picks the skill, follows its flow, and writes code grounded in the real API contracts — no invented routes, no invented fields.

> v4 renamed the v1 services. Old names appear only as recognition aliases: **idp → iam**, **uds/data-gateway → data**, **uilm → localization**. All `/…/v1/` routes are dead.

## The core split: configuration vs. implementation

Blocks work divides into two modes, and the skills are organized around the difference:

- **Configuration** — acting *on* a project as an admin from a CLI/script: defining schemas, wiring SSO, seeding roles, editing org settings. This happens **inside a project/tenant**, so it requires the shared **initial steps** first: log in → list projects (`/os/v4/Project/Gets`) → **impersonate** into the target tenant to get a project-scoped token (`PTOK`). Configuration calls then use **`x-blocks-key: <PTENANT>`** + `Authorization: Bearer <PTOK>` + `projectKey: <PTENANT>`. (The bootstrap/account tenant is the `x-blocks-key` only for `Project/Gets` and `impersonate`; an in-project call keyed with it 401/403s.)
- **Implementation** — the frontend app acting *as the signed-in user*: running GraphQL CRUD, uploading files, logging in via SSO, reading `/iam/me`. This needs **no initial steps** and **no token in JS** — the app uses the public **project key** (`<PTENANT>`, `x-blocks-key`) plus the hosted **SSO session cookie** (`credentials: "include"`). The browser never holds the access or refresh token, and `PTOK` never ships to the client.

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

These four run as **configuration** (CLI/admin tooling, with an impersonated project token `PTOK` via the initial steps) or as **implementation** (a frontend admin screen, on the signed-in user's SSO cookie) — same endpoints, different credential. `/iam/me` is always the cookie path.

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

There are three tenant ids and three ways a call is authenticated. Keep them straight and everything else follows.

**Three tenant ids:**
- **`ACCOUNT_TENANT`** — the bootstrap/account tenant, from the login token's `tenant_id` claim. Used as `x-blocks-key` **only** to enter a project (`Project/Gets`, `impersonation/status`, `impersonate`). It must never key a real service call — an in-project call keyed with it 401/403s.
- **`PTENANT`** — the target project's tenant id. This is `x-blocks-key` (and `projectKey` in bodies) on **every** real call, from both the CLI and the browser. Public and shippable (`VITE_BLOCKS_PROJECT_KEY`).
- **`PTOK`** — the impersonated, project-scoped access token. **CLI/admin only; never ships to the client.**

**Three authentication contexts:**
- **CLI / configuration** — impersonate first: `POST https://iam.seliseblocks.com/api/auth/impersonate` with `{ targeted_tenant_id, refresh_token }` → `PTOK`. Then `x-blocks-key: <PTENANT>` + `Authorization: Bearer <PTOK>` + `projectKey: <PTENANT>`. Each service call uses the tenant that owns that service (verified: data/IAM and localization can live in different project tenants).
- **Browser / implementation** — the app holds **no token**. Calls carry `x-blocks-key: <PTENANT>` + `credentials: "include"` so Blocks reads the hosted **SSO session cookie** set by `/idp/callback`. Renew with `POST /iam/v4/oidc/token` (`grant_type=refresh_token` + `client_id`, form-encoded, `credentials: "include"`) — this **rotates the cookies**; you send a `refresh_token` form field only if your project intentionally exposes a readable one to JS (usually it's HttpOnly). Wire it as the 401-retry path, then re-check `/iam/me`.
- **Provider-direct** — the storage pre-signed `PUT` goes straight to the storage provider on a pre-authorized URL: **no Bearer token, and no `x-blocks-key`** unless the provider accepts unknown headers (Azure needs only `x-ms-blob-type: BlockBlob` + `Content-Type`).

**Login:** `POST https://api.seliseblocks.com/iam/v4/auth-login` (note the dash) with `{ "username", "password" }` → `access_token` (~5 min) + `refresh_token`; the token's `tenant_id` claim is `ACCOUNT_TENANT`. `auth-login` is the **only** Blocks call that omits `x-blocks-key`.

**URL prefix:** the served base is `https://api.seliseblocks.com/<svc>/v4`; the swagger's `/api/...` prefix is **not** part of the served path (`/data/v4/...`, `/iam/v4/iam/...`).

`.env` for CLI/admin tooling (never commit): `BLOCKS_API_URL`, `BLOCKS_USERNAME`, `BLOCKS_PASSWORD`. `ACCOUNT_TENANT`, `PTENANT`, and `PTOK` are derived by the initial steps at runtime — `PTOK` stays server-side.

## Frontend stack

`references/react.md` in each skill targets the [blocks-construct-react](https://github.com/SELISEdigitalplatforms/blocks-construct-react) stack: **React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui + TanStack Query + Zustand**. Only client-safe values go in `VITE_`-prefixed env vars (the public `VITE_BLOCKS_PROJECT_KEY`, never `PTOK`). Runtime calls are **cookie-based** (`credentials: "include"`) — the auth store holds no token; it just exposes `refreshSession()` (a cookie-renewal call) and drives the 401-retry.

**Frontend API base URL must be same-site with the app domain.** Blocks SSO stores the session in a Secure, domain-scoped cookie, and the browser only keeps/sends it when API calls go to a host under the **same registrable domain** as the app. So `VITE_BLOCKS_API_URL=https://api.seliseblocks.com` (the default) is correct **only** for apps served on `*.seliseblocks.com`. For an app on a custom domain, use **`https://blocksapi.<registrable-domain>`** — e.g. `abc.slsblx.com` → `https://blocksapi.slsblx.com`, `xyz.blx10.com` → `https://blocksapi.blx10.com` — otherwise the cookie is never stored and cookie-based calls (`/iam/me`, `/organizations/my`, logout) fail. When scaffolding a frontend on a custom domain, ask the user which base URL to use (they may keep the default).

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
