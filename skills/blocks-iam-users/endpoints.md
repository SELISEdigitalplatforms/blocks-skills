# Users — endpoint contracts

Verified against the live IAM swagger + responses. Base `https://api.seliseblocks.com/iam/v4`; paths under `/iam/v4/iam/...`. Headers: `x-blocks-key: <project key>` + `Authorization: Bearer <token>`. Envelope: `{ data, errors, totalCount? }` unless noted.

Unnamed int enums (verify names in portal): `userPassType 0|1|2`, `userCreationType 0|1|2|3|4|5`, `verifiedType 0|1|2|3`, `userMfaType 0|1|2|3|4`, `allowedLogInType 0|1|2|3`.

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
  "userPassType": 0,
  "userCreationType": 0,
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
- **Invite-and-activate:** create with an empty `password` and the appropriate `userPassType`/`userCreationType`, then have the user complete **blocks-iam-account** activate. To set a password immediately, provide `password`.
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
→ `{ data: { itemId, language, salutation, firstName, lastName, email, phoneNumber, roles[], permissions[], active, status, isVerified, profileImageUrl, mfaEnabled, isMfaVerified, userMfaType, externalIdentities[], attributes, logInCount, lastLoggedInTime }, errors }`. The token holder's own identity — use `roles`/`permissions` to gate UI.

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
