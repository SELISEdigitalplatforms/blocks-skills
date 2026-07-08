# Access Control — endpoint contracts

Verified against the live IAM swagger + responses. Base `https://api.seliseblocks.com/iam/v4`; all paths below are under `/iam/v4/iam/...`. Headers on every call: `x-blocks-key: <project key>` + `Authorization: Bearer <token>`. Envelope: `{ data, errors, totalCount? }` unless noted.

Unnamed int enums (no member names in swagger — verify in portal): permission **`type`** `0|1|2|3`, permission **`permissionSeverity`** `0|1|2|3|4`.

## Permissions

### Create — `POST /iam/permissions/create`
```json
{
  "name": "orders::invoice::read",
  "type": 1,
  "description": "Read invoices",
  "resource": "orders-api::invoice::read",
  "resourceGroup": "orders",
  "tags": [],
  "dependentPermissions": [],
  "isBuiltIn": false,
  "permissionSeverity": 0,
  "propagateToOtherOrg": false
}
```
`name` is the stable identifier used elsewhere (e.g. in role assignment and a permission's `roles[]`). Returns the created id in the envelope.

### Update — `POST /iam/permissions/{id}`
Same body as create **plus** `"itemId": "<id>"` and `"isArchived": false`. The id goes in **both** the path and the body.

### Get by id — `GET /iam/permissions/{id}`
→ `{ data: { itemId, name, type, description, resource, resourceGroup, isBuiltIn, isArchived, permissionSeverity, dependentPermissions[], roles[], organizationId, tags[], createdDate, lastUpdatedDate, createdBy, lastUpdatedBy }, errors }`. `roles[]` = the role slugs that currently hold this permission.

### List / search — `POST /iam/permissions`
```json
{
  "page": 0,
  "pageSize": 20,
  "sort": { "property": "name", "isDescending": false },
  "filter": {
    "search": "invoice",
    "type": 1,
    "permissionSeverity": 0,
    "isBuiltIn": "false",
    "tags": [],
    "resources": [],
    "isArchived": false,
    "resourceGroup": "orders"
  },
  "roles": []
}
```
→ `{ totalCount, data: [ <permission> ] }`. All `filter` fields are optional; `roles` narrows to permissions held by those role slugs.

### Grouped by severity (bonus) — `GET /iam/permissions/by-severity`
Read-only convenience listing grouped by `permissionSeverity`.

## Roles

### Create — `POST /iam/roles/create`
```json
{
  "name": "Order Editor",
  "description": "Can edit orders",
  "slug": "order-editor",
  "parentRoleSlug": "user",
  "propagateToOtherOrg": false,
  "canCreateOwn": true
}
```
`slug` is the role's stable key; `parentRoleSlug` places it in the hierarchy (omit/empty for a top-level role).

### Update — `POST /iam/roles/update`
```json
{ "itemId": "<role id>", "name": "Order Editor", "description": "...", "parentRoleSlug": "user", "propagateToOtherOrg": false, "canCreateOwn": true }
```
Note: update is keyed by `itemId`; `slug` is immutable.

### Get by id — `GET /iam/roles/{id}`
→ `{ data: { itemId, name, slug, ancestorRoleSlugs[], parentRoleSlug, canCreateOwn, description, count, createdFromDefault, organizationId, tags[], createdDate, … }, errors }`.

### List / search — `POST /iam/roles`
```json
{ "page": 0, "pageSize": 20, "sort": { "property": "name", "isDescending": false }, "filter": { "search": "admin", "slugs": [] } }
```
→ `{ totalCount, data: [ <role> ] }`. `filter.slugs` narrows to specific role slugs.

### Add/remove permissions on a role — `POST /iam/roles/assign-permissions`
```json
{
  "slug": "order-editor",
  "addPermissions": ["orders::invoice::read", "orders::invoice::write"],
  "removePermissions": ["orders::invoice::delete"]
}
```
Targets the role by **`slug`**. Adds and removes in one call (not a full replace). Identify permissions by their `name`. Re-fetch the role (get-by-id) or the permission list filtered by that role to confirm.

### Assignable roles (bonus) — `GET /iam/roles/assignable`
Roles the current caller is allowed to assign to users — useful to populate an admin dropdown.
