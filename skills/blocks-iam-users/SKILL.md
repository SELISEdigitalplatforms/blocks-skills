---
name: blocks-iam-users
description: "Manage users on a SELISE Blocks project via the IAM API (`https://api.seliseblocks.com/iam/v4/iam`): create a user, update a user, get a user by id, list/search users, read the current signed-in user (`/iam/me`), read a user's activity timeline, and assign roles/permissions to a user. Use whenever the user wants to create/invite a user, edit a user profile, list or search users, fetch the logged-in user's own profile/permissions, show a user audit timeline, or grant a user roles/permissions on Blocks — 'add a user', 'update this user', 'who am I / get my profile', 'list users', 'give this user the admin role', 'show the user's activity log'. Works for admin tooling and frontend. Defining the roles/permissions themselves is blocks-iam-access-control; SSO login is blocks-iam-sso-oidc-*."
---

# Blocks IAM — Users

Create and manage user accounts, read the current user, inspect a user's timeline, and grant users roles/permissions. The roles/permissions being granted are defined in **[blocks-iam-access-control](../blocks-iam-access-control/SKILL.md)**; brand-new users typically activate via **[blocks-iam-account](../blocks-iam-account/SKILL.md)**.

Base: `https://api.seliseblocks.com/iam/v4` — management endpoints under **`/iam/v4/iam/...`** (the `/iam` segment repeats). No `/api/` prefix.

## Auth

**Admin/script calls** (create/update/list/assign):
```
x-blocks-key: <ACCOUNT_TENANT>   # root tenant id — never PTENANT here
Authorization: Bearer <PTOK>     # impersonated token from get-into-project
```

**Browser/runtime** (`/iam/me`):
```
x-blocks-key: <PTENANT>
credentials: include             # hosted SSO cookie
```

Run [flows/get-into-project.md](flows/get-into-project.md) before admin user-management calls. On 401/`session_expired`, renew with `POST /iam/v4/auth-token` then re-impersonate.

## Endpoints → [endpoints.md](endpoints.md)

| Action | Endpoint |
|---|---|
| Create user | `POST /iam/v4/iam/users/create` |
| Update user | `POST /iam/v4/iam/users/{id}` |
| Get user by id | `GET /iam/v4/iam/users/{id}` (optional `?organizationId=`) |
| List/search users | `POST /iam/v4/iam/users` (body = page/filter) |
| Current user ("me") | `GET /iam/v4/iam/me` · edit self `PATCH /iam/v4/iam/me` |
| User activity timeline | `GET /iam/v4/iam/users/timeline` (page/filter body) |
| Assign roles/permissions to a user | `POST /iam/v4/iam/users/roles-and-permissions` |
| Deactivate a user | `POST /iam/v4/iam/users/deactivate` |

Full fields, enums, and examples: [endpoints.md](endpoints.md). Frontend hooks: [references/react.md](references/react.md).

## Key concepts (verified live)

- **`/iam/me`** → `{ data: { itemId, firstName, lastName, email, phoneNumber, roles[], permissions[], active, status, isVerified, mfaEnabled, userMfaType, attributes, logInCount, lastLoggedInTime, … } }`. This is the effective identity of the caller **and the app's "am I logged in?" check** — it returns the profile only when there's a valid session, so call it **on page load, right after login, and after the SSO callback sets the cookie**. A 200 with the profile = logged in; a 401 = logged out (route to login). It works off the **session cookie**, so the frontend sends `credentials: "include"` and needs no JS-held token. Use `roles`/`permissions` to gate UI. `PATCH /iam/me` edits the caller's own profile (same body shape as user update).
- **List is POST** — `POST /iam/v4/iam/users` with `{ page, pageSize, sort, filter:{ email, name, userIds[], status:{active,inactive}, mfa:{enabled,disabled}, joinedOn, lastLogin, org_id } }` → `{ totalCount, data:[…] }`.
- **Create is rich** — key fields `{ email, userName, password?, firstName, lastName, phoneNumber, roles[], permissions[], organizationId, userPassType, userCreationType, verifiedType, userMfaType, mfaEnabled, mailPurpose, attributes }`. **`userPassType`** is the credential type — `0` None, `1` Password, `2` Pin; **use `1` (Password)** unless the user explicitly asks otherwise. **`userCreationType`** is the creation source — `0` None, `1` Portal, `2` Api, `3` Service, `4` Social, `5` ThirdParty; **default to `2` (Api)**, or `1` (Portal) for admin-portal-style creation (full member names in endpoints.md). To invite-and-activate, create without a password (keep `userPassType: 1`) and let them run **[blocks-iam-account](../blocks-iam-account/SKILL.md)** activate with `x-blocks-key: PTENANT` and no bearer token.
- **Update vs assign** — `POST /iam/v4/iam/users/{id}` edits profile fields (and can carry `roles`/`permissions`); `POST /iam/v4/iam/users/roles-and-permissions` (`{ userId, roles[], permissions[] }`) is the dedicated grant call. Prefer the latter for changing access.
- **Timeline** — `GET /iam/v4/iam/users/timeline` returns audit entries with `currentData` snapshots (profile/roles/permissions state over time), filterable by `event`.
- **`userPassType` / `userCreationType` member names are known** (from platform source, in endpoints.md): `userPassType` `0` None / `1` Password / `2` Pin (use `1`); `userCreationType` `0` None / `1` Portal / `2` Api / `3` Service / `4` Social / `5` ThirdParty (use `2`, or `1` for portal-style). The remaining enums are still unnamed ints — confirm in the portal before hardcoding: `verifiedType 0–3`, `userMfaType 0–4`, `allowedLogInType 0–3`.

## Gotchas

- **`x-blocks-key` = `ACCOUNT_TENANT` on admin/script calls; `PTENANT` on browser/runtime calls** (e.g. `/iam/me`, activate). Wrong admin key (especially `PTENANT` as header) → 401.
- **Update/get/deactivate are POST** (except get-by-id and me, which are GET; me-edit is PATCH). No PUT.
- **Roles/permissions on a user** reference roles by **slug** and permissions by **name** (as defined in blocks-iam-access-control) — not their itemIds.
- **Timeline is a `GET` that requires a JSON body** (`ItemId` + paging) — many HTTP clients silently drop bodies on GET. Use `curl -X GET --data-raw '...'` or a client that supports it; an empty-body 400 means the body was dropped, not that the route is wrong.
- **`organizationId`** matters in multi-org projects — creating/getting a user may need the target org; get-by-id accepts `?organizationId=`.
- The user list `data[]` is returned as loosely-typed objects in the swagger — treat fields defensively and confirm against a live response for your project.
