---
name: blocks-uds
description: "Use this skill for defining data schemas, querying/mutating data via GraphQL, uploading files (S3/DMS), managing access policies, setting field validations, migrating schemas, or configuring data sources on SELISE Blocks. Also triggers when developers mention 'blocks-uds', 'how to use blocks-uds', 'data-management skill', 'UDS', 'blocks data', 'blocks graphql', 'blocks schema', 'blocks file upload', 'schema skill', 'data skill', 'MongoDB connection', or need data schema, GraphQL CRUD, file storage, access control, or validation rules on SELISE Blocks."
user-invocable: true
blocks-version: "1.0.0"
---

# Data Management Skill

## Purpose

Handles all data schema definitions, database connections, file storage, data access control, and validation for SELISE Blocks via the UDS v1 API. Data access (CRUD) uses GraphQL gateway; management operations use REST endpoints.

Must run get-token (from `blocks-idp`) before any action in a session.

---

## How to Answer "How do I use blocks-uds?"

When a developer asks **"how to use blocks-uds"**, **"what does blocks-uds do"**, or **"how do I get started with blocks-uds"**:

1. **Ask for their framework** — Next.js, React, Angular, Flutter, Blazor, etc.
2. **Ask what they want to do** — set up a schema, upload files, manage access, etc.
3. **Point to the human overview** — direct them to `README.md` for a quick overview
4. **Point to the AI guide** — direct them to `SKILL.md` for the full execution guide
5. **Give a one-liner summary** — "blocks-uds handles all data management: schemas, GraphQL CRUD, file storage (S3/DMS), access policies, and field validations for SELISE Blocks"

**Do NOT** generate a custom summary. The skill already has this information in `README.md` and `SKILL.md`. Link to those files instead of reproducing their content.

---

## When to Use

Example prompts that should route here:
- "Define a schema for a products collection with name, price, and category fields"
- "Query all orders via GraphQL with pagination and filtering"
- "Upload a profile image to S3 and store the URL in the database"
- "Set up role-based access policies so only admins can read invoices"
- "Add server-side validation so the email field rejects invalid formats"
- "Migrate the Product schema to add a new stock field"
- "Connect my MongoDB database to the Blocks project"
- "Export my schema definitions to a JSON file"
- "Import schema definitions from a previously exported file"

---

## Execution Context

Before executing any action or flow from this skill, read `skills/core/runtime/execution-context.md` for the required supporting files, load order, and cross-domain orchestration rules.

---

## Pre-Flight Audit

Always run this audit before implementing anything. It determines the approach.

### Step 1: Detect Stack

| Indicator | Framework |
|-----------|-----------|
| `package.json` + `app/` dir or `next.config.js` | Next.js App Router |
| `package.json` + `vite.config.ts` | Vite + React SPA |
| `*.csproj` / `Program.cs` | .NET Blazor |
| No framework files | Vanilla HTML/JS |

### Step 2: Detect Existing Auth

Ensure `blocks-idp` has been used for `get-token` first. UDS requires a valid `ACCESS_TOKEN` from IDP.

### Step 3: Detect Environment

Look for `API_BASE_URL` and `X_BLOCKS_KEY` in `.env`. If missing, ask the user.

### Step 4: Detect Existing Resources

Before creating anything new, check what's already there:

| Check | Action | Why |
|-------|--------|-----|
| Existing schemas? | `get-schemas` | Avoid duplicate schemas |
| Database connected? | `get-data-source` | Schema needs a data source |
| Existing access policies? | `get-access-policies` | Understand current security |
| Existing validations? | `get-validations` | Avoid duplicate rules |

### Step 5: Route Decision

| Scenario | Flow to Use |
|----------|-------------|
| First-time schema setup | `flows/define-schema-flow.md` |
| Querying or mutating data | `flows/query-data-flow.md` |
| Modifying existing schema | `flows/migrate-schema-flow.md` |
| Connecting a database | `flows/setup-data-source-flow.md` |
| File upload or DMS management | `flows/upload-file-flow.md` |
| Setting up data access control | `flows/configure-access-policy-flow.md` |

---

## Field Names

> **Critical:** The UDS API uses different conventions. Wrong field names silently fail.

| Wrong (don't use) | Correct (use this) | Context |
|-------------------|-------------------|---------|
| `ConnectionString` | `dbConnectionString` | DataSource response |
| `data.uploadUrl` | direct `uploadUrl` | get-presigned-upload-url response |
| `$PROJECT_SLUG` in body | `$X_BLOCKS_KEY` in body | All request bodies |
| `schemaType: "Entity"` | `schemaType: 1` | SchemaType is integer |
| `operation: "Read"` | `operation: 0` | PolicyOperation is integer |
| `accessLevel: "Custom"` | `accessLevel: 2` | SchemaAccessLevel is integer |
| `type: "Required"` | `type: 0` | ValidationType is integer (0-11) |
| `securityType` | `accessLevel` | change-security body |
| `POST ?fileId=...` | POST body `DeleteFileRequest` | delete-file |
| `schemaId` in change-security | `schemaId` (not `schemaName`) | change-security |
| `Name`, `ParentDirectoryId` | Full CreateFolderRequest fields | create-folder has 13 fields |

---

## GraphQL Patterns

All data CRUD goes through the GraphQL gateway. REST actions are for management only.

### Endpoint

```
POST $API_BASE_URL/uds/v1/$PROJECT_SLUG/gateway
Authorization: Bearer $ACCESS_TOKEN
x-blocks-key: $X_BLOCKS_KEY
Content-Type: application/json
```

### Query Naming

| Operation | Query Name |
|-----------|-----------|
| List records | `get{SchemaName}s` (e.g. `getProducts`) |
| Single record | `get{SchemaName}` |
| Create record | `create{SchemaName}` |
| Update record | `update{SchemaName}` |
| Delete record | `delete{SchemaName}` |

### Pagination

Use `skip` and `take` arguments:

```graphql
query {
  getProducts(skip: 0, take: 20) {
    items { id name price }
    totalCount
  }
}
```

### Filtering

```graphql
query {
  getProducts(where: { price: { gte: 100 } }) {
    items { id name price }
  }
}
```

### Sorting

```graphql
query {
  getProducts(orderBy: { price: desc }) {
    items { id name price }
  }
}
```

### Relations

```graphql
query {
  getOrders {
    items {
      id
      customer { name email }
      items { productId quantity }
    }
  }
}
```

### Mutations

```graphql
mutation {
  createProduct(input: { name: "Widget", price: 29.99 }) {
    id
    name
  }
}
```

> **Important:** Always call `reload-configuration` after any schema change. GraphQL won't see new schemas or fields until the config is reloaded.

---

## Intent Mapping

Use this table to route user requests. Check `flows/` first — if a flow covers the request, use it.

| User wants to... | Use |
|-----------------|-----|
| Create a new schema with fields | `flows/define-schema-flow.md` — *"Define a schema for products with name, price, category" |
| Query or read data records | `flows/query-data-flow.md` — *"Query all orders with pagination" |
| Insert or update data records | `flows/query-data-flow.md` — *"Create a new order record" |
| Add a field or change a field type | `flows/migrate-schema-flow.md` — *"Add a stock field to the Product schema" |
| Connect a MongoDB database | `flows/setup-data-source-flow.md` — *"Connect my MongoDB database" |
| Upload a file to S3 | `flows/upload-file-flow.md` — *"Upload a profile image to S3" |
| Store a document in DMS | `flows/upload-file-flow.md` — *"Save this PDF to the document management system" |
| Restrict who can access data | `flows/configure-access-policy-flow.md` — *"Only admins can read invoices" |
| Add validation to a field | `actions/create-validation.md` — *"Validate the email field" |
| Reload GraphQL after changes | `actions/reload-configuration.md` — *"Reload the schema after adding fields" |
| List all schemas | `actions/get-schemas.md` — *"What schemas exist in this project" |
| Get aggregated schema summary | `actions/get-schemas-aggregation.md` — *"Show all schemas with their access levels" |
| Get one schema by ID | `actions/get-schema.md` — *"Get the full definition of the Product schema" |
| List Entity collections | `actions/get-schema-collections.md` — *"What Entity collections exist" |
| Get schema by collection name | `actions/get-schema-by-collection.md` — *"Find the schema for the orders collection" |
| Delete a schema | `actions/delete-schema.md` — *"Delete the LegacyOrders schema" |
| Update schema definition | `actions/update-schema.md` — *"Rename the schema from Product to Article" |
| Update schema definition with fields | `actions/update-schema-definition.md` — *"Update the Product schema and add a new field" |
| Save schema with fields | `actions/save-schema-info.md` — *"Create a new schema with its initial fields" |
| Add or update fields | `actions/save-schema-fields.md` — *"Add a description field to the Product schema" |
| Get pending schema changes | `actions/get-unadapted-changes.md` — *"Show changes that need migration" |
| Get database connection | `actions/get-data-source.md` — *"What database is connected" |
| Add a new database | `actions/add-data-source.md` — *"Connect a new MongoDB database" |
| Update database settings | `actions/update-data-source.md` — *"Update the MongoDB connection string" |
| Set schema security type | `actions/change-security.md` — *"Make the invoices schema private" |
| Create an access policy | `actions/create-access-policy.md` — *"Allow the editor role to read products" |
| Update an access policy | `actions/update-access-policy.md` — *"Update the product access policy" |
| Delete an access policy | `actions/delete-access-policy.md` — *"Remove the old access policy" |
| List access policies | `actions/get-access-policies.md` — *"Show all policies for the invoice schema" |
| List validation rules | `actions/get-validations.md` — *"What validations are set up" |
| Create a validation rule | `actions/create-validation.md` — *"Make the price field required and positive" |
| Update a validation rule | `actions/update-validation.md` — *"Change the email validation to strict mode" |
| Delete a validation rule | `actions/delete-validation.md` — *"Remove validation from the notes field" |
| Get a single validation | `actions/get-validation.md` — *"Show the validation for the email field" |
| Get all validations for a schema | `actions/get-schema-validations.md` — *"List all validations on the Product schema" |
| Get validation for one field | `actions/get-field-validation.md` — *"What validations are on the price field" |
| Download a file | `actions/get-file.md` — *"Download the uploaded invoice PDF" |
| Get file metadata | `actions/get-files-info.md` — *"Get info for multiple uploaded files" |
| Download files | `actions/get-files.md` — *"Download multiple uploaded files as a zip" |
| Get pre-signed upload URL | `actions/get-presigned-upload-url.md` — *"Give me an S3 URL to upload this image" |
| Delete a file | `actions/delete-file.md` — *"Delete the old profile image" |
| Upload to local storage | `actions/upload-to-local-storage.md` — *"Upload directly to local storage" |
| Update file metadata | `actions/update-file-info.md` — *"Rename the uploaded file" |
| List DMS files | `actions/get-dms-files.md` — *"Show files in the contracts folder" |
| Upload to DMS | `actions/upload-to-dms.md` — *"Upload this document to DMS" |
| Create a DMS folder | `actions/create-folder.md` — *"Create a contracts folder in DMS" |
| Delete a DMS folder | `actions/delete-folder.md` — *"Delete the drafts folder" |
| Get test data | `actions/get-mock-data.md` — *"Give me some sample products to test with" |
| Delete test data | `actions/delete-mock-data.md` — *"Clear all mock data" |
| Export schema definitions | `actions/export-schema.md` — *"Export all schemas to a file" |
| Import schema definitions | `actions/import-schema.md` — *"Import schemas from a backup file" |
| Get deployment status | `actions/get-pipeline.md` — *"What's the current deployment pipeline status" |

---

## Reference Implementations

| Stack | Reference | Notes |
|-------|-----------|-------|
| Next.js App Router | `references/nextjs-app-router.md` | Server actions, middleware, GraphQL gateway |
| React SPA (Vite) | `references/react-vite.md` | GraphQL client, TanStack Query hooks |
| Angular | `references/angular.md` | HttpClient service, GraphQL integration |
| Flutter | `references/flutter.md` | Riverpod providers, GraphQL queries |
| React Native | `references/react-native.md` | Expo, AsyncStorage, React Query |
| Blazor .NET | `references/blazor-dotnet.md` | HttpClient service, GraphQL integration |
| Bridge strategies | `references/bridge-strategies.md` | Migration patterns |

---

## Flows

| Flow | File | Description |
|------|------|-------------|
| define-schema | flows/define-schema-flow.md | Schema → fields → validation → security → reload |
| query-data | flows/query-data-flow.md | Query and mutate via GraphQL gateway |
| migrate-schema | flows/migrate-schema-flow.md | Add/rename/change fields safely |
| setup-data-source | flows/setup-data-source-flow.md | Connect MongoDB and reload |
| upload-file | flows/upload-file-flow.md | S3 pre-signed URL, DMS, local storage |
| configure-access-policy | flows/configure-access-policy-flow.md | Security type + role-based policies |

---

## Base Path

All REST endpoints: `$API_BASE_URL/uds/v1`
GraphQL gateway: `$API_BASE_URL/uds/v1/$PROJECT_SLUG/gateway`

---

## Common Pitfalls

> [!WARNING]
>
> - **Don't use `$PROJECT_SLUG` in request bodies** — use `$X_BLOCKS_KEY`. `$PROJECT_SLUG` in body causes `Fields_Are_Required` errors.
> - **Don't send empty `fields` array on `define-schema`** — causes 400. Include at least one field.
> - **`save-schema-fields` replaces all fields** — providing a partial list removes fields not included. Always send the complete list + use `deletableFieldNames` to remove.
> - **Don't use string enums** — `accessLevel`, `operation`, `validationType`, `schemaType` are all integers. `"Custom"` → `2`, `"Read"` → `0`, `"Required"` → `0`.
> - **All data CRUD goes through GraphQL** — not REST. REST is for schema/data-source/validation management only.
> - **Pre-signed URL response is direct** — `{isSuccess, uploadUrl, fileId}` — not `{data: {uploadUrl}}`.
> - **`delete-file` uses POST body** — `POST /Files/DeleteFile` with JSON body `{fileId, ...}`, not query params.
> **`create-folder` has 13 fields** — not just `Name` and `ParentDirectoryId`. See `contracts.md`.
> - **Call `reload-configuration` after any change** — schema, data source, field, or policy changes don't take effect until reload.
> - **`accessLevel: 2` (Custom) with no policies = total lockout** — even admins are locked out. Create at least one policy immediately after setting Custom.
> - **`update-data-source` requires `isActive`** — omitting it may deactivate the connection.

---

## Verification Checklist

After implementing data management features:

### Schema Setup
- [ ] `define-schema` uses `schemaType: 1` (integer), not string
- [ ] `projectKey` in body uses `$X_BLOCKS_KEY`, not `$PROJECT_SLUG`
- [ ] At least one field in `fields` array on `define-schema`
- [ ] `save-schema-fields` includes complete field list (not partial)
- [ ] `reload-configuration` called after any schema change

### Data Access (GraphQL)
- [ ] GraphQL endpoint uses `$PROJECT_SLUG` in URL path
- [ ] GraphQL queries use `get{SchemaName}s` naming convention
- [ ] `get-schemas` confirms schema is live before querying
- [ ] `reload-configuration` called after schema changes

### Security & Access Policies
- [ ] `accessLevel` uses integer (0/1/2), not string
- [ ] `operation` uses integer (0-4), not string
- [ ] Custom security (`accessLevel: 2`) has at least one policy created
- [ ] Role slugs in policies match exactly with IDP roles

### Validations
- [ ] `validationType` uses integer (0-11), not string
- [ ] Each rule has `isActive: true`
- [ ] `errorMessage` provided for each validation

### Files
- [ ] Pre-signed URL uses direct `uploadUrl` field (not `data.uploadUrl`)
- [ ] S3 upload uses PUT with `Content-Type: application/octet-stream`
- [ ] `delete-file` uses POST body, not query params

### DataSource
- [ ] `update-data-source` includes `isActive` field
- [ ] Response field is `dbConnectionString`, not `ConnectionString`
- [ ] `reload-configuration` called after data source changes

---

## Action Index

### Schema
| Action | File | Description |
|--------|------|-------------|
| get-schemas | actions/get-schemas.md | List schemas with pagination |
| get-schema | actions/get-schema.md | Get single schema by ID |
| get-schema-by-id | actions/get-schema-by-id.md | Get schema by ID (cloud path) |
| delete-schema | actions/delete-schema.md | Delete a schema |
| delete-schema-by-id | actions/delete-schema-by-id.md | Delete schema by ID (cloud path) |
| define-schema | actions/define-schema.md | Create a new schema |
| update-schema | actions/update-schema.md | Update schema definition |
| update-schema-info | actions/update-schema-info.md | Update schema metadata |
| update-schema-definition | actions/update-schema-definition.md | Update schema definition with fields |
| save-schema-info | actions/save-schema-info.md | Save schema with fields |
| save-schema-definition | actions/save-schema-definition.md | Save schema with fields (alias) |
| save-schema-fields | actions/save-schema-fields.md | Add/update fields (replaces all) |
| get-schemas-aggregation | actions/get-schemas-aggregation.md | Schemas with access level summary |
| get-schema-info | actions/get-schema-info.md | List Entity-type schema collections |
| get-schema-collections | actions/get-schema-collections.md | List Entity-type collections |
| get-schema-by-collection | actions/get-schema-by-collection.md | Get schema by collection name |
| get-unadapted-changes | actions/get-unadapted-changes.md | Pending schema changes |
| get-schema-unadapted-changes | actions/get-schema-unadapted-changes.md | Pending schema changes (alias) |
| get-schema-unadapted-changes | actions/get-schema-unadapted-changes.md | Pending schema changes (alias) |

### DataSource
| Action | File | Description |
|--------|------|-------------|
| get-data-source | actions/get-data-source.md | Get database connection |
| add-data-source | actions/add-data-source.md | Add new database |
| update-data-source | actions/update-data-source.md | Update database settings |

### DataAccess
| Action | File | Description |
|--------|------|-------------|
| change-security | actions/change-security.md | Set security type (Public/User/Custom) |
| create-access-policy | actions/create-access-policy.md | Create data access policy |
| update-access-policy | actions/update-access-policy.md | Update access policy |
| delete-access-policy | actions/delete-access-policy.md | Remove access policy |
| get-access-policies | actions/get-access-policies.md | List access policies |

### DataValidation
| Action | File | Description |
|--------|------|-------------|
| get-validations | actions/get-validations.md | List validation rules |
| create-validation | actions/create-validation.md | Create validation for a field |
| update-validation | actions/update-validation.md | Update validation rule |
| get-validation | actions/get-validation.md | Get single validation |
| delete-validation | actions/delete-validation.md | Delete validation |
| get-schema-validations | actions/get-schema-validations.md | All validations for a schema |
| get-field-validation | actions/get-field-validation.md | Validations for a specific field |

### Files
| Action | File | Description |
|--------|------|-------------|
| get-file | actions/get-file.md | Download single file |
| get-files | actions/get-files.md | Download multiple files |
| get-files-info | actions/get-files-info.md | Get file metadata |
| get-presigned-upload-url | actions/get-presigned-upload-url.md | Generate S3 pre-signed URL |
| delete-file | actions/delete-file.md | Delete file (POST body) |
| upload-to-local-storage | actions/upload-to-local-storage.md | Upload to local storage |
| update-file-info | actions/update-file-info.md | Update file metadata |
| get-dms-files | actions/get-dms-files.md | List DMS files/folders |
| upload-to-dms | actions/upload-to-dms.md | Upload to DMS |
| create-folder | actions/create-folder.md | Create DMS folder |
| delete-folder | actions/delete-folder.md | Delete DMS folder |

### Configuration
| Action | File | Description |
|--------|------|-------------|
| reload-configuration | actions/reload-configuration.md | Reload GraphQL schema |

### DataManage
| Action | File | Description |
|--------|------|-------------|
| get-mock-data | actions/get-mock-data.md | Get test data |
| delete-mock-data | actions/delete-mock-data.md | Delete test data |

### SchemaExchange
| Action | File | Description |
|--------|------|-------------|
| export-schema | actions/export-schema.md | Export schemas to file |
| import-schema | actions/import-schema.md | Import schemas from file |

### Deployment
| Action | File | Description |
|--------|------|-------------|
| get-pipeline | actions/get-pipeline.md | Get pipeline status |

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `Fields_Are_Required` with all fields provided | `$PROJECT_SLUG` instead of `$X_BLOCKS_KEY` in body | Use `$X_BLOCKS_KEY` value in body |
| All fields removed after save | Partial field list sent | Send complete list + use `deletableFieldNames` |
| GraphQL returns `null` for schema | `reload-configuration` not called | Call `reload-configuration` |
| Cannot query new field | Schema not reloaded | Call `reload-configuration` |
| `accessLevel: 2` locks everyone out | No policy created | Create at least one policy after setting Custom |
| Pre-signed URL upload fails | `data.uploadUrl` used | Response is direct `{uploadUrl}` at top level |
| File delete 400 | Query params used | Use POST body `DeleteFileRequest` |
| Data source deactivated after update | `isActive` not included | Always include `isActive: true` in update |
