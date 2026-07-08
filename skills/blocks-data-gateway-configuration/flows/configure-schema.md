# Configure a schema (create → fields → validation → access → reload)

The admin-side pipeline that the Blocks portal runs. End state: a live schema the gateway exposes as GraphQL CRUD. Do the steps in order; **step 6 (reload) is mandatory** or nothing goes live.

Preconditions: an impersonated project token from **[get-into-project.md](get-into-project.md)** — it defines `$BLOCKS_API_URL`, the `hdr` array (`x-blocks-key: $ROOT` + `Authorization: Bearer $PTOK`), and `$PTENANT` (the project tenant id used as `projectKey`). All calls target `https://api.seliseblocks.com/data/v4` (no `/api`).

## Step 0 — Get into the project

Run [get-into-project.md](get-into-project.md) first. After it you have `hdr` and `$PTENANT` in your shell. If a call later returns 401 / `session_expired`, re-run its step 1 (and re-impersonate if needed).

## Step 1 — Confirm the data source & capture identifiers

```bash
curl -s "$BLOCKS_API_URL/data/v4/configurations" "${hdr[@]}"
```
Keep `data.projectKey`, `data.collectionNamePattern` (default `sb_{SchemaName}s`), `data.isCollectionNameEditable`. If `data` is null, no data source exists yet — `POST /configurations` with `{ connectionString, databaseName, projectKey }` first (use the project's MongoDB, or the Blocks-provided default configured in the OS portal).

## Step 2 — Does the schema already exist?

```bash
curl -s "$BLOCKS_API_URL/data/v4/schemas?ProjectKey=$PTENANT&SchemaName=Product&PageNo=1&PageSize=5" "${hdr[@]}"
```
List params are **PascalCase** (`ProjectKey`, `SchemaName`, `PageNo`, `PageSize`, `Keyword`, `SortBy`, `SortDescending`). Found → keep `data.items[0].id` and skip to step 4 (edit fields). Not found → step 3.

## Step 3 — Create the schema

`POST /schemas/define`:
```json
{
  "schemaName": "Product",
  "collectionName": "sb_Products",
  "projectKey": "<project tenant id>",
  "schemaType": 1,
  "fields": [
    { "name": "Title", "type": "String",  "isArray": false, "isPIIData": false, "isUniqueData": false, "description": "Display name" },
    { "name": "Price", "type": "Float",   "isArray": false, "isPIIData": false, "isUniqueData": false, "description": "Unit price" },
    { "name": "Sku",   "type": "String",  "isArray": false, "isPIIData": false, "isUniqueData": true,  "description": "Stock keeping unit" }
  ]
}
```
Keep `data.itemId` — the schema definition id used by field/validation/access endpoints.
- `schemaType: 1` = entity (collection + GraphQL CRUD). Legacy docs used `2` for nested/child objects — unverified in v4; confirm in the portal if you need nesting.
- Respect `collectionNamePattern` from step 1; if `isCollectionNameEditable` is false, let the platform derive the name.
- Field `name`s become the **PascalCase GraphQL field names** — pick them as you want them to appear in queries.
- Lightweight alternative: `POST /schemas/info` creates a fields-less schema from `{ collectionName, schemaName, projectKey, schemaType }`; add fields in step 4.

## Step 4 — Add / edit fields on an existing schema

`POST /schemas/fields`:
```json
{
  "schemaDefinitionItemId": "<schema itemId>",
  "projectKey": "<project tenant id>",
  "fields": [
    { "name": "Category", "type": "String", "isArray": false, "isPIIData": false, "isUniqueData": false, "description": "" }
  ],
  "deletableFieldNames": []
}
```
Field names to remove go in `deletableFieldNames`. To rewrite the whole definition, use `PUT /schemas/define` (create body + `itemId`).

## Step 5 — Validation and access (optional, per the request)

**Field validation** — write-time rules. `POST /data-validations`:
```json
{
  "projectKey": "<project tenant id>",
  "schemaId": "<schema itemId>",
  "fieldName": "Sku",
  "validations": [
    { "type": 0, "value": "^[A-Z0-9-]{4,}$", "secondaryValue": null, "errorMessage": "Invalid SKU", "isActive": true }
  ]
}
```
- The `validations` array **replaces** the field's rule set — send the full list. Update with `PUT /data-validations` (+`itemId`); delete with `DELETE /data-validations?validationId=<id>&projectKey=<project tenant id>`.
- `type` is an unnamed `0..11` int enum; `0` is regex (legacy). For other types, read back a rule the portal created to learn the value.
- Optional AI helper: `POST /regex/generateregex` with `{ description, exampleText, temperature, additionalContext }` — response shape is undocumented, so inspect it and test the pattern locally before saving.
- Read current rules: `GET /data-validations/by-schema-id?schemaId=<id>&projectKey=<project tenant id>`.

**Access policy** — who can read/write/edit/delete. Only run when asked; a new schema doesn't require it.
1. Set the level per operation (one call each): `POST /data-access/security/change`
   ```json
   { "projectKey":"<project tenant id>", "schemaId":"<id>", "operation":0, "policyType":0, "fieldNames":["Product"], "accessLevel":2 }
   ```
   Legacy enum hints (unverified in v4; the only v4-named buckets are Public/User/Custom in `GET /schemas/aggregation`): `SchemaAccessLevel` 1=User 2=Public 3=Custom; `operation` 0=Read 1=Write 2=Edit 3=Delete; `policyType` 0=schema-level 1=field-level.
2. Only if level is Custom: `POST /data-access/policy/create` with a `ruleGroup` of `rules` comparing token claims (`leftSource:0`), record fields (`rightSource:1`), or static values (`rightSource:2`). Response is undocumented — re-fetch via `GET /data-access/policy/get?schemaName=<name>&projectKey=<project tenant id>` to get the policy `itemId`.

## Step 6 — Reload (mandatory)

```bash
curl -s -X POST "$BLOCKS_API_URL/data/v4/schema-configurations/reload" "${hdr[@]}"
```
Expect `data: true`. Only after this does the gateway expose the schema. Confirm nothing is pending:
```bash
curl -s "$BLOCKS_API_URL/data/v4/schemas/unadapted-change-logs?projectKey=$PTENANT" "${hdr[@]}"
```

## Verify

- `GET /schemas/get-by-id?id=<itemId>&projectKey=<project tenant id>` — full definition, plus the **`querySchema` and `mutationSchemas`** you'll need for the GraphQL side (hand these to the **blocks-data-gateway-crud** skill).
- Then run a gateway introspection or a `get<Collection>` query to confirm the schema is live.

Error paths: 401 → wrong `x-blocks-key` (must be tenant_id) or expired token. 400 returns `ProblemDetails { title, status, detail }` — usually a bad enum value or a collection-name-pattern violation; read `detail`.
