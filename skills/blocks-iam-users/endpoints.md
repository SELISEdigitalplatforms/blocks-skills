# Users — endpoint contracts

Verified against the live IAM swagger + responses. Base `https://api.seliseblocks.com/iam/v4`; paths under `/iam/v4/iam/...`. Admin/script calls use `x-blocks-key: <PTENANT>` + `Authorization: Bearer <PTOK>` from `get-into-project`. Browser/runtime calls use `x-blocks-key: <PTENANT>` + hosted SSO cookies (`credentials: "include"`), especially `/iam/me`. Envelope: `{ data, errors, totalCount? }` unless noted.

**`userPassType`** (member names from platform source) — `0` None (no password credential set), `1` Password (bcrypt-hashed) — **recommended: use `1`** unless the user explicitly asks for another, `2` Pin (short numeric PIN, for kiosk / mobile unlock flows).

**`userCreationType`** (member names from platform source) — `0` None (unset / legacy records), `1` Portal (created by an admin through the management portal), `2` Api (created programmatically through a public/partner API), `3` Service (created by a trusted internal service or background job), `4` Social (created via a social identity provider — Google, GitHub, …), `5` ThirdParty (created through a third-party integration / partner connector). **Recommended: `2` (Api)**; use `1` (Portal) when the creation is an admin-portal-style action.

Still unnamed int enums (verify names in portal): `verifiedType 0|1|2|3`, `userMfaType 0|1|2|3|4`, `allowedLogInType 0|1|2|3`.

## Create — `POST /iam/users/create`
```json
{
  "email": "ada@example.com",
  "userName": "ada",
  "password": "",
  "firstName": "Ada",
  "lastName": "Lovelace",
  "phoneNumber": "",
  "salutation": "",
  "language": "en-US",
  "mailPurpose": "",
  "userPassType": 1,
  "userCreationType": 2,
  "verifiedType": 0,
  "userMfaType": 1,
  "mfaEnabled": false,
  "allowedLogInType": [0],
  "roles": ["order-editor"],
  "permissions": [],
  "organizationId": "default",
  "profileImageUrl": "",
  "profileImageId": "",
  "platform": "",
  "tags": [],
  "attributes": {}
}
```
- `roles` by **slug**, `permissions` by **name** (as defined in blocks-iam-access-control).
- **`userPassType: 1` (Password)** and **`userCreationType: 2` (Api)** are the recommended defaults (see the enum note above). Stick with `userPassType: 1` unless the user explicitly wants a PIN; use `userCreationType: 1` (Portal) instead of `2` when modelling an admin-portal creation.
- **Invite-and-activate:** create with an empty `password` (keep `userPassType: 1`), then have the user complete **blocks-iam-account** activate to set their password. Activation uses `x-blocks-key: <PTENANT>` and no bearer token. To set a password immediately, provide `password` in this call.
- `mailPurpose` optional (empty ok). `attributes` is a free-form object for custom fields.

## Update — `POST /iam/users/{id}`
```json
{
  "itemId": "<user id>",
  "salutation": "", "firstName": "Ada", "lastName": "Lovelace",
  "phoneNumber": "", "tags": [],
  "profileImageUrl": "", "profileImageId": "",
  "userMfaType": 1, "mfaEnabled": false,
  "roles": ["order-editor"], "permissions": []
}
```
Id in both path and body (`itemId`). Edits profile + MFA + can carry roles/permissions, but for pure access changes prefer `roles-and-permissions` below.

## Get by id — `GET /iam/users/{id}?organizationId=<org>`
→ `{ data: { …user… }, errors }`. `organizationId` query is optional (needed to disambiguate in multi-org). The user object is loosely typed in swagger — inspect a live response; expect the same fields as `/iam/me` plus admin fields.

## List / search — `POST /iam/users`
```json
{
  "page": 0,
  "pageSize": 20,
  "sort": { "property": "email", "isDescending": false },
  "filter": {
    "email": "", "name": "",
    "userIds": [],
    "status": { "active": true, "inactive": false },
    "mfa": { "enabled": false, "disabled": false },
    "joinedOn": null,
    "lastLogin": null,
    "org_id": ""
  }
}
```
→ `{ totalCount, data: [ <user> ] }`. All filters optional.

## Current user — `GET /iam/me`
→ `{ data: { itemId, language, salutation, firstName, lastName, email, phoneNumber, roles[], permissions[], active, status, isVerified, profileImageUrl, mfaEnabled, isMfaVerified, userMfaType, externalIdentities[], attributes, logInCount, lastLoggedInTime }, errors }`. The current session user's identity — use `roles`/`permissions` to gate UI. In the browser this is cookie-based and needs no JS-held bearer token.

## Edit self — `PATCH /iam/me`
Same body as user update (`itemId`, `firstName`, `lastName`, `phoneNumber`, `profileImage*`, `userMfaType`, `mfaEnabled`, `roles`, `permissions`, `tags`). Edits the caller's own profile.

## Activity timeline — `GET /iam/users/timeline`
The swagger lists this as `GET`, but it **requires a request body** and the server also accepts it over **POST** (verified — POST reaches the same handler, not a 405). Because browser `fetch` can't send a body on a GET, **call it as POST from a frontend**; server-side tooling may use GET+body.

The body **must include `ItemId`** — the id of the user whose timeline you want — plus paging/filter:
```json
{ "ItemId": "<target user id>", "page": 0, "pageSize": 20, "sort": { "property": "createdDate", "isDescending": true }, "filter": { "event": "" } }
```
→ array of entries `{ itemId, createdDate, lastUpdatedDate, createdBy, lastUpdatedBy, tags[], currentData: { salutation, firstName, lastName, email, userName, phoneNumber, roles, permissions, active, isVerified, verifiedType, profileImage*, platform, userCreationType, provisioningSource, … } }` — each a point-in-time snapshot; filter by `event`.

**Verify the `ItemId` you pass:** a plausible user id returned `{ "errors": { "ItemId": "Not found" } }` in testing, so the timeline subject id may be org-scoped or a different identifier than the plain user id — confirm the correct value/`organizationId` against your project before wiring it in.

## Assign roles/permissions to a user — `POST /iam/users/roles-and-permissions`
```json
{ "userId": "<user id>", "roles": ["order-editor", "viewer"], "permissions": ["orders::invoice::read"] }
```
The dedicated call for changing a user's access. `roles` by slug, `permissions` by name. Re-fetch the user (or `/iam/me` for self) to confirm.

## Deactivate — `POST /iam/users/deactivate`
```json
{ "userId": "<user id>" }
```
Deactivates (disables) the user. Reactivation / full lifecycle is managed via update/create flows and the portal.
