# Back-office account & organization lookup (`/Iam/*`)

> **Read this first.** The PascalCase `/Iam/*` and `/Authentication/*` controllers on the
> monitor service are the **platform back-office API** — what SELISE OS portal itself uses for
> project administration. They are NOT your application's auth or user-profile API. For app login,
> signup, password reset, MFA, and profile screens, use the **blocks-iam** skill (lowercase
> `/auth/*`, `/iam/*` on `https://api.seliseblocks.com/iam/v4`). Only build against these
> controllers for internal admin tooling, and only with a token that has admin-level privileges on
> the project — expect rejections or empty data otherwise.

Use for: finding a user account, checking their roles/permissions/sessions/login history, and
listing or managing organizations for a project.

Preconditions: `x-blocks-key` + **admin-privileged** Bearer token (blocks-setup). `projectKey` =
your Blocks Key (the same value as `X_BLOCKS_KEY` / the `x-blocks-key` header). GET query params
on this controller are PascalCase (`ProjectKey`, `Id`, `ItemId`, `Page`, `Filter.UserId`) — copy
casing exactly.

Base URL: `https://api.seliseblocks.com/monitor/v4`

## Steps

1. `POST /Iam/GetUsers` — search accounts. See [endpoints.md#iam](../endpoints.md#iam)
   (`GetUsersRequest` in contracts.md). Response is documented:
   `{ data: GetUser[], errors, totalCount }`.

   ```json
   {
     "projectKey": "<X_BLOCKS_KEY>",
     "page": 0,
     "pageSize": 20,
     "sort": { "property": "lastLoggedInTime", "isDescending": true },
     "filter": {
       "email": "jane@example.com",
       "name": null,
       "userIds": [],
       "status": { "active": true, "inactive": false },
       "mfa": { "enabled": false, "disabled": false },
       "organizationId": null
     }
   }
   ```

   Keep `data[].itemId` — it is the user id (`Id`) for the follow-up calls. Useful fields already
   in this response: `active`, `isVarified` (typo is in the API — keep it), `mfaEnabled`,
   `memberships[] { organizationId, roles, permissions }`, `lastLoggedInTime`, `logInCount`.

2. Drill into one user (all documented responses):
   - `GET /Iam/GetUser?Id=<userId>&ProjectKey=<X_BLOCKS_KEY>` — full record incl.
     `lastLoggedInDeviceInfo`.
   - `GET /Iam/GetUserRoles?Id=<userId>&ProjectKey=<X_BLOCKS_KEY>` — roles
     (`{ data: [{ itemId, name, slug, description }], totalCount }`).
   - `GET /Iam/GetUserPermissions?Id=<userId>&ProjectKey=<X_BLOCKS_KEY>` — effective
     permissions.

3. Sessions and audit trail (both return `{ data: unknown[], totalCount }` — item shape untyped in
   swagger, inspect live):
   - `GET /Iam/GetSessions?ProjectKey=<X_BLOCKS_KEY>&Filter.UserId=<userId>&Page=1&PageSize=20`
   - `GET /Iam/GetHistories?ProjectKey=<X_BLOCKS_KEY>&Filter.UserId=<userId>&Page=1&PageSize=20`

4. Organizations:
   - `GET /Iam/GetOrganizations?ProjectKey=<X_BLOCKS_KEY>&Page=1&PageSize=20&Filter.Name=<search>`
     — documented response `{ organizations: [{ itemId, name, isEnable, ... }], totalCount }`.
   - `GET /Iam/GetOrganization?ProjectKey=<X_BLOCKS_KEY>&ItemId=<orgId>` — one org.
   - `GET /Iam/GetOrganizationConfig?ProjectKey=<X_BLOCKS_KEY>` — org-creation policy
     (`allowCreationFromCloud`, `isMultiOrgEnabled`, default `roles`).

5. Mutations — use deliberately; these change real accounts. Responses are mostly undocumented in
   swagger unless noted:
   - `POST /Iam/SaveOrganization` — `{ projectKey, name, itemId?, isEnable }`; pass `itemId`
     to rename/disable an existing org (documented `BaseResponse`).
   - `POST /Iam/SaveRolesAndPermissions` — `{ userId, memberships: [{ organizationId, roles,
     permissions }], projectKey }` — replaces the user's org/role assignments.
   - `POST /Iam/Deactivate` — `{ userId, projectKey }` — deactivates the account.
   - `POST /Iam/Update` — profile/MFA/roles fields keyed by `itemId`.
   - Role & permission catalogs: `POST /Iam/GetRoles`, `POST /Iam/CreateRole`,
     `POST /Iam/UpdateRole`, `POST /Iam/SetRoles` (add/remove permissions on a role slug),
     `POST /Iam/GetPermissions`, `POST /Iam/CreatePermission`.

Related but separate: the `/Authentication/*` controller manages token lifetimes
(`POST /Authentication/Update`), OIDC clients, SSO credentials, and machine-to-machine client
credentials (`SaveClientCredential` / `GetClientCredentials`) — same back-office warning applies;
shapes are in [endpoints.md#authentication](../endpoints.md#authentication).

Gotchas: `GET /Iam/GetUserTimelines` declares a JSON request body on a GET — many clients
can't send it; verify live before using. `GET /Iam/IsEmailAvaiable` (typo verbatim) checks
email availability. Integer enums (`userMfaType`, `userCreationType`, `permissionSeverity`, …)
have no member names in swagger — do not guess meanings.

## Verify

- Step 1 finds the account and `totalCount` matches expectations.
- After any mutation, re-fetch with the corresponding GET (`GetUser`, `GetUserRoles`,
  `GetOrganization`) and confirm the change; mutation envelopes with documented shapes return
  `isSuccess: true` with an empty `errors` map.
