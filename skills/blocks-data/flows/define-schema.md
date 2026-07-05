# Define a schema, add fields, and reload

Use when creating a new data model (collection) for a project, or when adding/changing fields on an existing one. Preconditions: a Bearer token (blocks-setup) and your Blocks Key — **`projectKey` = your Blocks Key** (the `X_BLOCKS_KEY` value). If you don't have `projectShortKey`, step 1 gives you it.

## Steps

1. `GET /api/data-sources/get?projectKey=$X_BLOCKS_KEY` — confirm a data source exists and capture identifiers.
   Keep `data.projectKey`, `data.projectShortKey`, `data.collectionNamePattern`, `data.isCollectionNameEditable` ([endpoints.md#datasource](../endpoints.md#datasource)).
   - If `data` is null/empty, no data source is configured yet → `POST /api/data-sources/add` with `{ connectionString, databaseName, projectKey }` (ask the user: their own MongoDB connection string, or the Blocks-provided default set up in OS portal).
   - `GET /api/configurations` returns the same configuration for the current tenant without a `projectKey` param.

2. `GET /api/schemas?ProjectKey=$X_BLOCKS_KEY&SchemaName=<name>` — check whether the schema already exists ([endpoints.md#schema](../endpoints.md#schema)).
   - Exists → skip to step 4 to modify fields. Keep `data.items[0].id` (the schema id).
   - Not found → step 3.

3. `POST /api/schemas/define` — create the schema.
   ```json
   {
     "schemaName": "Product",
     "collectionName": "sb_product",
     "projectKey": "$X_BLOCKS_KEY",
     "projectShortKey": "<projectShortKey>",
     "schemaType": 1,
     "fields": [
       { "name": "title", "type": "String", "isArray": false, "isPIIData": false, "isUniqueData": false, "description": "Display name" },
       { "name": "price", "type": "Float",  "isArray": false, "isPIIData": false, "isUniqueData": false, "description": "Unit price" }
     ]
   }
   ```
   Keep `data.itemId` — that is the schema definition id used by the fields, validation, and access endpoints.
   - `schemaType` is a `1 | 2` int enum with unpublished member names. The swagger's own prose calls type-1 collections "Entity-type" (they get a collection and runtime CRUD); legacy docs used 2 for child/nested-object schemas — unverified in v4, confirm in OS portal if it matters.
   - `field.type` is a **string**. Legacy scalar values were `"String"`, `"Int"`, `"Long"`, `"Float"`, `"Boolean"`, `"DateTime"`, and a child schema's name for nesting — unverified in v4; if a type is rejected, check the OS portal schema editor for the accepted list.
   - Respect `collectionNamePattern` from step 1 when choosing `collectionName` (if `isCollectionNameEditable` is false, don't fight it — let the platform derive the name).
   - Evaluate `isPIIData` for every field (names, emails, addresses → true). Ask the user when unsure.
   - Lightweight alternative: `POST /api/schemas/info` creates a schema from `{ collectionName, schemaName, projectKey, schemaType }` only (no fields); `PUT /api/schemas/info` renames/retypes it.

4. `POST /api/schemas/fields` — add or update fields on an existing schema.
   ```json
   {
     "schemaDefinitionItemId": "<schema itemId>",
     "projectKey": "$X_BLOCKS_KEY",
     "projectShortKey": "<projectShortKey>",
     "fields": [
       { "name": "sku", "type": "String", "isArray": false, "isPIIData": false, "isUniqueData": true, "description": "Stock keeping unit" }
     ],
     "deletableFieldNames": []
   }
   ```
   Put field names to remove in `deletableFieldNames`. To rewrite the whole definition instead, use `PUT /api/schemas/define` (same body as create plus `itemId`).

5. `POST /api/schema-configurations/reload` — **mandatory** after any schema or field change. Staged changes are not live until this succeeds (`data: true`). `POST /api/configurations/reload` is documented with identical behavior.

Error paths: 401 → refresh token via blocks-setup. 400 returns `ProblemDetails { type, title, status, detail }` — usually a naming-pattern or enum-value problem; read `detail`.

## Verify

- `GET /api/schemas/get-by-id?id=<schema itemId>&projectKey=$X_BLOCKS_KEY` — full definition with fields, access levels, and policy counts.
- Or `GET /api/schemas/info-by-name?schemaName=<name>&projectKey=$X_BLOCKS_KEY` for the collection view.
- `GET /api/schemas/unadapted-change-logs?projectKey=$X_BLOCKS_KEY` — should show nothing pending after a successful reload.
