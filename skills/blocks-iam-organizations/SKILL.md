---
name: blocks-iam-organizations
description: "Manage organizations (tenancy/workspaces) on a SELISE Blocks project via the IAM API (`https://api.seliseblocks.com/iam/v4/iam`): create an organization, update it (branding/theme/locale/addresses), get one by id, list/search organizations, read the current user's organizations (`/organizations/my`), and read or set the project's org-creation config (`/organizations/config`, incl. multi-org enablement). Use whenever the user wants to create or edit an organization, list orgs, fetch 'my organizations', configure whether/where orgs can be created, or turn multi-org on/off on Blocks. Primarily a frontend/implementation concern — most often reading the signed-in user's organizations and rendering an org switcher; the create/update/config operations are the rarer admin/config path. Users/roles within an org are blocks-iam-users / blocks-iam-access-control; SSO is blocks-iam-sso-oidc-*."
---

# Blocks IAM — Organizations

Create and manage organizations (the workspace/tenancy unit inside a project), read the caller's organizations, and control the project-level org-creation policy (including multi-org).

Base: `https://api.seliseblocks.com/iam/v4` — endpoints under **`/iam/v4/iam/organizations...`** (the `/iam` segment repeats). No `/api/` prefix.

## Auth

**Default case — a frontend, as the signed-in user.** Most usage is a running app reading the current user's orgs (`/organizations/my`, the org switcher) or an org's details. Here the caller is the logged-in user, whose session is the **SSO cookie** — no impersonation, no admin token to obtain:
```
x-blocks-key: <project key>   # project tenant id — public, shippable
# browser: credentials: "include" so the SSO session cookie identifies the user
```
`GET /organizations/my` takes **no user id** — it derives the user from that cookie, so call it only once logged in (after the SSO callback; verify with `GET /iam/me`). A 401 means "not logged in", not "no orgs".

**Rare case — admin/config tooling, acting *on* a project.** Creating/updating orgs and reading/setting the project org-creation config (`/organizations/config`, multi-org) are admin operations. From a script that runs the initial steps: **`x-blocks-key: <ACCOUNT_TENANT>`** (root tenant) + `Authorization: Bearer <PTOK>` (see `flows/get-into-project.md`); from an admin **screen**, the signed-in admin's session uses `x-blocks-key: <PTENANT>` + `credentials: "include"`. On script 401, renew with `POST /iam/v4/auth-token` then re-impersonate.

## Endpoints → [endpoints.md](endpoints.md)

| Action | Endpoint |
|---|---|
| Create organization | `POST /iam/v4/iam/organizations/create` |
| Update organization | `POST /iam/v4/iam/organizations/{id}` |
| Get organization by id | `GET /iam/v4/iam/organizations/{id}` |
| List/search organizations | `GET /iam/v4/iam/organizations` (query params) |
| My organizations | `GET /iam/v4/iam/organizations/my` |
| Get org-creation config | `GET /iam/v4/iam/organizations/config` |
| Set org-creation config | `POST /iam/v4/iam/organizations/config` |

Full fields + examples: [endpoints.md](endpoints.md). Frontend hooks: [references/react.md](references/react.md).

## Key concepts (verified live)

- **"My organizations" = the logged-in user's own orgs.** `GET /organizations/my` → `{ isSuccess, errors, organizations: [{ itemId, name, createdDate }] }`, the lightweight list the caller belongs to (org switcher / "pick your workspace"). There's no user id in the request — the user is taken from the call's credentials, so in a frontend send the SSO session cookie (`credentials: "include"`) and call it only once logged in (after the SSO callback; verify with `GET /iam/me` — **[blocks-iam-users](../blocks-iam-users/SKILL.md)**). A 401 means "not logged in", not "no orgs". Persist the picked org and re-fetch the full record with get-by-id when you need branding/addresses. Frontend hook + switcher: [references/react.md](references/react.md).
- **Different envelope from the rest of IAM.** Organization endpoints return `{ isSuccess, errors, … }` with the payload under a **named** key — `itemId` (create), `organization` (get-by-id), `organizations` (list / my) — **not** the `{ data }` envelope used by users/roles/permissions. Branch your parsing accordingly.
- **List is a GET with query params**, not a POST body — `?Page=&PageSize=&Sort.Property=&Sort.IsDescending=&Filter.Name=&Filter.ShortCode=&Filter.IsEnabled=&…` → `{ isSuccess, organizations:[…] }`. (Contrast users/roles/permissions, whose lists are POST.)
- **Config is flat** — `GET /organizations/config` → `{ allowOrgCreationFromCloud, allowOrgCreationFromConstruct, allowOrgCreationFromSignup, allowOrgCreationFromPortal, isMultiOrgEnabled, consentForMultiOrgEnable, itemId }` (no envelope). `POST` the same fields to set it. This is the project-wide policy for **where** new orgs may be created and whether multi-org is on.
- **Create vs update surface** — create takes the essentials (`name`, `description`, default roles/permissions for members, contact info, `addresses[]`, `createdFrom`); update additionally exposes branding/localization (`theme`, `logoUrl/logoId`, `industry`, `timeZone`, `currency`, `dateFormat`, `timeFormat`, `locale`, `isEnable`).
- **`defaultRoleForMembers` / `defaultPermissionsForMembers`** seed what a new member of the org gets — roles by **slug**, permissions by **name** (defined in blocks-iam-access-control).
- **`createdFrom`** is an unnamed int enum (`1|2|3`) — verify meaning in the portal.

## Gotchas

- **`x-blocks-key` = project key.** Wrong key → 401.
- **Update is POST to `/{id}`** (not PUT); the user's shorthand "update = /organizations/create" is a mistake — create and update are different endpoints.
- **Read the right response key** — `organization` (singular) for get-by-id, `organizations` (array) for list/my, `itemId` for create. Don't assume `data`.
- **Multi-org must be enabled** (`isMultiOrgEnabled` via config) for more than one org to be meaningful; `consentForMultiOrgEnable` may gate turning it on.
- The list `Filter.*` surface is large (every org field is filterable); pass only what you need.
