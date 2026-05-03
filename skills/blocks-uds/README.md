# blocks-uds

Data schema definitions, GraphQL data access, file storage (S3/DMS), data access policies, field validations, and database connections for SELISE Blocks — via the UDS v1 API.

---

## What this skill does

This skill handles every data management operation in SELISE Blocks:

| Category | Coverage |
|----------|---------|
| **Schema definitions** | Create, read, update, delete schemas with field definitions |
| **GraphQL data access** | Query, create, update, delete records via auto-generated GraphQL API |
| **Data access policies** | Role-based access control (RBAC) on schemas with PolicyRuleGroups |
| **Field validations** | Server-side validation rules (Required, Email, Min, Max, Regex, Unique, etc.) |
| **File storage** | S3 pre-signed URLs, DMS folder management, local storage upload |
| **Database connections** | MongoDB data source management |
| **Schema exchange** | Export/import schema definitions as JSON |
| **Mock data** | Get and delete test data during development |

---

## Quick Start

```
Build a data schema for a products collection with name, price, and category fields
```

```
Query all orders via GraphQL with pagination
```

```
Upload a profile image to S3 and store the URL
```

```
Set up role-based access policies on the invoices schema
```

---

## Skill Structure

```
skills/blocks-uds/
├── SKILL.md                     ← Intent map + Field Names + Common Pitfalls + Verification Checklist
├── contracts.md                 ← All TypeScript types, request/response schemas, enums
├── flows/                       ← Multi-step workflows (run these, not individual actions)
│   ├── define-schema-flow.md   ← Create schema → fields → validation → security → reload
│   ├── query-data-flow.md      ← Query and mutate data via GraphQL gateway
│   ├── migrate-schema-flow.md  ← Add/update/remove fields on existing schemas
│   ├── setup-data-source-flow.md ← Connect MongoDB and reload configuration
│   ├── upload-file-flow.md     ← S3 pre-signed URL, DMS upload, local storage
│   └── configure-access-policy-flow.md ← Set security type and create access policies
├── actions/                     ← 50 single-API operations with curl, schemas, errors
│   ├── define-schema.md
│   ├── get-schema.md
│   ├── save-schema-fields.md
│   ├── change-security.md
│   ├── create-access-policy.md
│   ├── create-validation.md
│   ├── get-presigned-upload-url.md
│   ├── create-folder.md
│   └── ... (42 more)
 └── references/                  ← Framework-specific implementation guides
     ├── nextjs-app-router.md
     ├── react-vite.md
     ├── angular.md
     ├── flutter.md
     ├── react-native.md
     ├── blazor-dotnet.md
     └── bridge-strategies.md
```

---

## How It Works

### 1. Pick the right flow

Flows are multi-step sequences. Always use a flow instead of chaining actions manually.

```
User request: "define a products schema"
     │
     ▼
flows/define-schema-flow.md
     │
     ├── get-data-source → (skip if exists)
     ├── add-data-source → reload-configuration
     ├── define-schema → store SCHEMA_ID
     ├── save-schema-fields
     ├── create-validation (optional)
     ├── change-security
     ├── create-access-policy (if Custom)
     └── reload-configuration → GraphQL live
```

### 2. Data access is GraphQL

All data CRUD goes through the GraphQL gateway — NOT REST actions:

```
POST $API_BASE_URL/uds/v1/$PROJECT_SLUG/gateway
```

REST actions in this skill are for **schema/data-source/validation/management only**.

### 3. Types live in contracts.md

All TypeScript types matching exact Swagger field names are in `contracts.md`.

---

## Key UDS Conventions

| Wrong | Correct | Why |
|-------|---------|-----|
| `$PROJECT_SLUG` in body | `$X_BLOCKS_KEY` in body | API expects blocks key identifier |
| `accessLevel: "Custom"` | `accessLevel: 2` | Integer enum, not string |
| `operation: "Read"` | `operation: 0` | Integer enum, not string |
| `type: "Email"` | `type: 1` | ValidationType is integer 0-11 |
| `data.uploadUrl` | `uploadUrl` (top-level) | Pre-signed URL response is direct |
| `ConnectionString` | `dbConnectionString` | DataSource response field name |
| POST `?fileId=...` | POST body `DeleteFileRequest` | delete-file uses JSON body |
| `ParentDirectoryId` in create-folder | Full CreateFolderRequest | Has 13 fields including `parentId`, `artifactName` |

---

## Environment Variables

```bash
# UDS API
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
NEXT_PUBLIC_X_BLOCKS_KEY=your-project-key

# Credentials (server-side only — never in frontend)
ACCESS_TOKEN=your-idp-access-token
REFRESH_TOKEN=your-idp-refresh-token
```

---

## GraphQL Endpoint

```
POST $API_BASE_URL/uds/v1/$PROJECT_SLUG/gateway
Authorization: Bearer $ACCESS_TOKEN
x-blocks-key: $X_BLOCKS_KEY
Content-Type: application/json
```

Query naming: `get{SchemaName}s` (list), `get{SchemaName}` (single), `create{SchemaName}` (insert), `update{SchemaName}` (update), `delete{SchemaName}` (delete).

---

## Verification Checklist

After implementing data management features:

- [ ] `projectKey` in body uses `$X_BLOCKS_KEY`, not `$PROJECT_SLUG`
- [ ] `schemaType: 1` uses integer, not string
- [ ] `save-schema-fields` provides complete field list (not partial)
- [ ] `reload-configuration` called after any schema/data-source change
- [ ] `accessLevel: 2` (Custom) has at least one access policy created
- [ ] `validationType` uses integer (0-11), not string
- [ ] Pre-signed URL response uses `uploadUrl` at top level, not `data.uploadUrl`
- [ ] `delete-file` uses POST body, not query params
- [ ] `update-data-source` includes `isActive` field
- [ ] GraphQL queries use `get{SchemaName}s` naming convention

Full checklist: `SKILL.md` → Verification Checklist section.

---

## Framework Support

| Framework | Reference |
|-----------|-----------|
| Next.js 14+ App Router | `references/nextjs-app-router.md` |
| React SPA (Vite) | `references/react-vite.md` |
| Blazor .NET | `references/blazor-dotnet.md` |
| Bridge from legacy | `references/bridge-strategies.md` |

---

## Version

**1.0.0** — Full rename from data-management to blocks-uds:
- 50 action files rewritten in blocks-idp convention
- All Swagger schemas and enums documented
- 6 flow files with Pre-flight Audit + Flow Steps + Error Handling
- Field name corrections from Swagger review
- 4 framework reference files
- GraphQL gateway endpoint documented

Changelog: `meta.json`
