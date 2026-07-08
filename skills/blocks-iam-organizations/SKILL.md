---
name: blocks-iam-organizations
description: "Manage organizations (tenancy/workspaces) on a SELISE Blocks project via the IAM API (`https://api.seliseblocks.com/iam/v4/iam`): create an organization, update it (branding/theme/locale/addresses), get one by id, list/search organizations, read the current user's organizations (`/organizations/my`), and read or set the project's org-creation config (`/organizations/config`, incl. multi-org enablement). Use whenever the user wants to create or edit an organization, list orgs, fetch 'my organizations', configure whether/where orgs can be created, or turn multi-org on/off on Blocks — 'create an organization', 'update org branding', 'list organizations', 'get my orgs', 'enable multi-org', 'allow org creation from signup'. Works for admin tooling and frontend. Users/roles within an org are blocks-iam-users / blocks-iam-access-control; SSO is blocks-iam-sso-oidc-*."
---

# Blocks IAM — Organizations

Create and manage organizations (the workspace/tenancy unit inside a project), read the caller's organizations, and control the project-level org-creation policy (including multi-org).

Base: `https://api.seliseblocks.com/iam/v4` — endpoints under **`/iam/v4/iam/organizations...`** (the `/iam` segment repeats). No `/api/` prefix.

## Auth

```
x-blocks-key: <project key>           # project tenant id
Authorization: Bearer <access_token>   # admin/impersonated token in tooling, or the signed-in user's token in a frontend
```
`GET /organizations/my` returns the **caller's** organizations (use the logged-in user's token in a frontend). Create/update/config are admin operations gated by the caller's permissions.

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
