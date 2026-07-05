# Create a project and manage team access

Create a Blocks project (tenant group + environments), inspect it, invite teammates with roles per environment, and handle the invitation/removal/ownership lifecycle.

Preconditions: `x-blocks-key` + bearer token of a platform account (Cloud Portal user). Team operations require the caller to have access to the tenant group; ownership transfer requires being the owner (`GetPeoples` response exposes `isOwner`).

## Steps

1. **`POST /api/Project/Create`** — create the project ([endpoints.md#project](../endpoints.md#project)). Key fields: `name`, `isAcceptBlocksTerms: true`, `isProduction`, optional `tenantGroupId` (omit to start a new group; pass an existing one to add an environment to it), `applicationContexts: [{ environment, domain, cookieDomain }]`. Response: `{ tenantGroupId, isSuccess, errors }` — keep `tenantGroupId`; it's the handle for team and asset operations.
2. **`GET /api/Project/Gets?TenantGroupId=<id>&Page=0&PageSize=20`** — list the group's projects. Each project row carries `itemId`, `tenantId`, `name`, `environment`, `applicationDomain`, `isProduction`, `isDisabled`. Keep each environment's `tenantId` — invitations are keyed by it.
3. **`GET /api/Project/Get`** (no parameters) — read the *current* project resolved from the request context (`x-blocks-key`). Useful to confirm which project a key belongs to (`data.tenantSlug` is the projectKey/`client_id` value used across the platform).
4. **`POST /api/People/Invite`** — invite teammates ([endpoints.md#people](../endpoints.md#people)). Body maps email → environment grants:
   ```json
   {
     "invitations": {
       "dev@example.com": [ { "tenantId": "<tenantId>", "roles": ["admin"] } ]
     },
     "groupId": "<tenantGroupId>"
   }
   ```
   Role strings come from your project's IAM setup (see blocks-iam). Response shape not documented in swagger — inspect the live response.
5. **Invitee accepts: `POST /api/People/ConfirmInvitation`** — body `{ "code": "<code from the invitation email>" }`, called by the invitee's session. Response undocumented in swagger.
6. **`POST /api/People/Gets`** — audit the team. Body: `{ page, pageSize, projectGroupId: "<tenantGroupId>", environmentIds, isInvitationConfirmed }`. Response lists `peoples[]` with `peopleDetails` and per-environment `sharedEnviroments[]` (`isInvitationSent`, `isInvitationConfirmed`, `isCreator`) — note the API's own spelling `sharedEnviroments`/`enviroment`.

Branches:
- **Invitation never arrived** → `POST /api/People/ResendInvitation` `{ email, groupId }` (response undocumented). `peopleDetails.allowResendActivation` from step 6 tells you whether resend is offered.
- **Revoke access** → `POST /api/People/RemoveAccess` `{ email, projectKeys: [...], groupId }` (response undocumented).
- **Hand over the group** → `POST /api/People/TransferOwnerShip` `{ tenantGroupId, transferToUserEmail }` — note the capital S in the route. Response undocumented.
- **Rename the group** → `POST /api/Project/UpdateTenantGroup` `{ tenantGroupId, name }`.
- **Domains** → `POST /api/Project/UpdateProject` `{ projectKey, applicationDomain, customDomain }`.
- **Decommission / undo** → `POST /api/Project/Disable` `{ projectKey }`; `POST /api/Project/Restore` `{ projectId }` (Disable keys by projectKey, Restore by projectId — copy shapes exactly).
- **Public signup with captcha** → `POST /api/People/Signup` `{ email, captchaCode }`; get `captchaCode` via the [captcha lifecycle flow](captcha-lifecycle.md). Response undocumented.

Error paths: `isSuccess: false` → read `errors`; 401 → refresh token (blocks-setup); non-owner calling TransferOwnerShip/RemoveAccess → expect a failure envelope (check `isOwner` via People/Gets first).

## Verify

- `GET /api/Project/Gets?TenantGroupId=<id>` lists the new project with the expected `environment` and `isDisabled: false`.
- `POST /api/People/Gets` shows the invitee with `isInvitationSent: true` immediately, and `isInvitationConfirmed: true` after step 5.
- After RemoveAccess, the person's `sharedEnviroments` no longer include the revoked environments.
