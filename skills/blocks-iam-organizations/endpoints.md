# Organizations — endpoint contracts

Verified against the live IAM swagger + responses. Base `https://api.seliseblocks.com/iam/v4`; paths under `/iam/v4/iam/organizations...`. Headers: `x-blocks-key: <project key>` + `Authorization: Bearer <token>`.

**Envelope note:** these do **not** use `{ data }`. Responses are `{ isSuccess, errors, <payload-key> }` where the payload key is `itemId` (create), `organization` (get-by-id), or `organizations` (list/my). The config GET is a flat object.

`createdFrom` is an unnamed int enum `1|2|3` (verify in portal).

## Create — `POST /iam/organizations/create`
```json
{
  "name": "Acme Inc",
  "description": "Acme workspace",
  "defaultRoleForMembers": ["user"],
  "defaultPermissionsForMembers": [],
  "email": "ops@acme.com",
  "phoneNumber": "",
  "websiteUrl": "https://acme.com",
  "addresses": [
    { "name": "HQ", "addressLine1": "1 Main St", "addressLine2": "", "city": "Zurich", "state": "", "postalCode": "8000", "country": "CH", "isPrimary": true }
  ],
  "attributes": {},
  "createdFrom": 1
}
```
→ `{ isSuccess, errors, itemId }`. `defaultRoleForMembers` by role **slug**, `defaultPermissionsForMembers` by permission **name**.

## Update — `POST /iam/organizations/{id}`
Superset of create, adding branding/localization:
```json
{
  "name": "Acme Inc",
  "description": "Acme workspace",
  "defaultRoleForMembers": ["user"],
  "defaultPermissionsForMembers": [],
  "email": "ops@acme.com", "phoneNumber": "", "websiteUrl": "https://acme.com",
  "addresses": [ { "name": "HQ", "addressLine1": "1 Main St", "city": "Zurich", "postalCode": "8000", "country": "CH", "isPrimary": true } ],
  "attributes": {},
  "theme": { "name": "default", "primaryColor": "#124091", "secondaryColor": "#0aa", "tertiaryColor": "#eee", "attributes": {} },
  "logoUrl": "", "logoId": "",
  "industry": "Software", "timeZone": "Europe/Zurich", "currency": "CHF",
  "dateFormat": "yyyy-MM-dd", "timeFormat": "HH:mm", "locale": "en-US",
  "isEnable": true
}
```
→ `{ isSuccess, errors }`. Id goes in the path.

## Get by id — `GET /iam/organizations/{id}`
→ `{ isSuccess, errors, organization: { itemId, name, description, parentOrganizationId, shortCode, isEnabled, defaultRoleForMembers[], defaultPermissionsForMembers[], email, phoneNumber, websiteUrl, addresses[], theme, logoUrl, logoId, industry, timeZone, currency, dateFormat, timeFormat, locale, organizationId, tags[], createdDate, lastUpdatedDate, createdBy, lastUpdatedBy } }`.

## List / search — `GET /iam/organizations`
Query params (not a POST body): `Page`, `PageSize`, `Sort.Property`, `Sort.IsDescending`, and `Filter.<Field>` for essentially every org field — `Filter.Name`, `Filter.Description`, `Filter.ShortCode`, `Filter.IsEnabled`, `Filter.Email`, `Filter.Industry`, `Filter.ParentOrganizationId`, `Filter.OrganizationId`, `Filter.Tags`, `Filter.Theme.PrimaryColor`, …
```bash
GET /iam/v4/iam/organizations?Page=0&PageSize=20&Sort.Property=name&Sort.IsDescending=false&Filter.IsEnabled=true
```
→ `{ isSuccess, errors, organizations: [ <organization> ] }`.

## My organizations — `GET /iam/organizations/my`
→ `{ isSuccess, errors, organizations: [ { itemId, name, createdDate } ] }`. The lightweight list of orgs **the caller belongs to** — ideal for an org switcher or a "pick your workspace" screen.

- **Identity source = the caller, not a query param.** There is no user id in the request; the endpoint derives the user from the credentials on the call. In a **frontend** that's the signed-in user's **SSO session cookie**, so the browser fetch must send `credentials: "include"` (plus `x-blocks-key`); in **admin tooling** it's whichever user's token (impersonated / logged-in) you send as `Authorization: Bearer`.
- **Call it after auth is established** — after login / after the SSO callback sets the cookie. No session → 401 (route to login), not an empty array.
- Items are **lightweight** (`itemId`, `name`, `createdDate`). For branding/addresses/theme etc., follow up with `GET /iam/organizations/{itemId}`.
- Frontend example:
```bash
GET /iam/v4/iam/organizations/my
Header: x-blocks-key: <project key>
# browser: credentials: "include" so the session cookie rides along
```
See [references/react.md](references/react.md) for the hook + org switcher (with active-org persistence).

## Get org-creation config — `GET /iam/organizations/config`
→ **flat** (no envelope):
```json
{
  "allowOrgCreationFromCloud": false,
  "allowOrgCreationFromConstruct": false,
  "allowOrgCreationFromSignup": false,
  "allowOrgCreationFromPortal": false,
  "isMultiOrgEnabled": true,
  "consentForMultiOrgEnable": false,
  "itemId": "<config id>"
}
```

## Set org-creation config — `POST /iam/organizations/config`
```json
{
  "allowOrgCreationFromCloud": false,
  "allowOrgCreationFromConstruct": false,
  "allowOrgCreationFromSignup": true,
  "allowOrgCreationFromPortal": true,
  "isMultiOrgEnabled": true,
  "consentForMultiOrgEnable": false
}
```
→ `{ isSuccess, errors }`. Controls **where** new orgs may be created (cloud / construct / signup / portal) and whether **multi-org** is enabled project-wide. Read (GET) first and send the full set of flags.
