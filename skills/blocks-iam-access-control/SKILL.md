---
name: blocks-iam-access-control
description: "Manage RBAC — permissions and roles — on a SELISE Blocks project via the IAM API (`https://api.seliseblocks.com/iam/v4/iam`): create/update/list/get permissions, create/update/list/get roles, and assign or remove permissions on a role. Use whenever the user wants to define or edit permissions, create roles, build a role hierarchy, list/inspect roles or permissions, or grant/revoke permissions to a role on Blocks — 'create a permission', 'add a role', 'give the editor role these permissions', 'list all roles', 'what permissions does this role have'. Works for both admin/config tooling and frontend admin screens. Assigning roles/permissions to a USER lives in blocks-iam-users; SSO/OIDC is separate (blocks-iam-sso-oidc-*)."
---

# Blocks IAM — Access Control (Permissions & Roles)

Define the RBAC model for a project: **permissions** (atomic capabilities, grouped by resource) and **roles** (named bundles of permissions, optionally in a parent/child hierarchy). Assigning these to individual users is **[blocks-iam-users](../blocks-iam-users/SKILL.md)**.

Base: `https://api.seliseblocks.com/iam/v4` — management endpoints live under **`/iam/v4/iam/...`** (the `/iam` segment repeats; auth actions are under `/iam/v4/auth/...`). The swagger's `/api` prefix is **not** part of the served URL.

## Auth

Every call carries:
```
x-blocks-key: <project key>          # the project's tenant id
Authorization: Bearer <access_token>  # admin/impersonated token for config tooling, or the logged-in user's token in a frontend (subject to their permissions)
```
These are project-scoped admin operations — for config tooling use a project-scoped (impersonated) token; a frontend can call them if the signed-in user holds the needed permission. 401 → wrong `x-blocks-key` or token.

## Endpoints → [endpoints.md](endpoints.md)

| Action | Endpoint |
|---|---|
| Create permission | `POST /iam/v4/iam/permissions/create` |
| Update permission | `POST /iam/v4/iam/permissions/{id}` |
| Get permission by id | `GET /iam/v4/iam/permissions/{id}` |
| List/search permissions | `POST /iam/v4/iam/permissions` (body = page/filter) |
| Create role | `POST /iam/v4/iam/roles/create` |
| Update role | `POST /iam/v4/iam/roles/update` |
| Get role by id | `GET /iam/v4/iam/roles/{id}` |
| List/search roles | `POST /iam/v4/iam/roles` (body = page/filter) |
| Add/remove permissions on a role | `POST /iam/v4/iam/roles/assign-permissions` |

Full request/response fields, enums, and examples are in [endpoints.md](endpoints.md). Frontend hooks: [references/react.md](references/react.md).

## Key concepts (verified live)

- **List endpoints are POST**, not GET — permissions and roles are searched by posting `{ page, pageSize, sort:{property,isDescending}, filter:{…} }` and return `{ totalCount, data:[…] }`. (Contrast with organizations, whose list is a GET with query params.)
- **Permission** — `{ itemId, name, type, description, resource, resourceGroup, isBuiltIn, isArchived, permissionSeverity, dependentPermissions[], roles[] }`. `name` is the stable identifier (e.g. `idp::authentication::logout`); `roles[]` lists the role slugs that hold it. `type` (0–3) and `permissionSeverity` (0–4) are **unnamed int enums** in the swagger — confirm meanings in the portal before hardcoding.
- **Role** — `{ itemId, name, slug, parentRoleSlug, ancestorRoleSlugs[], canCreateOwn, description, count, createdFromDefault }`. **`slug` is the role's stable key** — hierarchy is by `parentRoleSlug`, and permission assignment targets a role by `slug` (not `itemId`). `count` is how many permissions/members it has.
- **assign-permissions is additive/subtractive** — `{ slug, addPermissions[], removePermissions[] }` adds and removes in one call; it does not replace the whole set. Identify permissions by their `name`.
- **Envelope** — `{ data, errors, totalCount? }`. Mutations return the created/updated id or a success indicator; re-fetch (get-by-id / list) for the full object.

## Gotchas

- **Update uses POST + `itemId` in the body** (permissions also take the id in the path). There are no PUT/PATCH verbs here.
- **Roles are keyed by `slug`** for hierarchy and permission assignment — don't pass a role `itemId` where a `slug` is expected.
- **Built-in permissions/roles** (`isBuiltIn` / `createdFromDefault`) exist out of the box — list first and reuse rather than duplicating them.
- **`propagateToOtherOrg`** on create/update controls whether the permission/role fans out to other organizations in a multi-org setup — default it off unless you mean it.
- Bonus reads: `GET /iam/v4/iam/permissions/by-severity` (grouped) and `GET /iam/v4/iam/roles/assignable` (roles the caller may assign).
