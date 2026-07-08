---
name: blocks-data-gateway-configuration
description: "Configure the data model of a SELISE Blocks project through the data service REST admin API (`https://api.seliseblocks.com/data/v4`): create and edit schemas/collections, add or remove properties/fields, add field validation rules (incl. the AI regex assistant), set schema/field access levels and data-access policies, and RELOAD so changes go live in the runtime gateway. Also covers mock/sample data inventory + deletion and schema-exchange (export/import a data model between projects). Use whenever the user wants to define, edit, secure, validate, reload, copy, or reset the DATA MODEL of a Blocks project — 'add a field to my schema', 'make this collection public', 'validate the email field', 'reload the schema', 'clone my schemas to staging', 'wipe the demo data'. This is the admin/portal side; for running GraphQL create/read/update/delete against the resulting schemas use blocks-data-gateway-crud, and for file/DMS storage use blocks-data-storage."
---

# Blocks Data — Gateway Configuration

The data service (`https://api.seliseblocks.com/data/v4`) is the admin surface where a Blocks project's data model lives. You use it to shape schemas and fields, attach validation and access rules, then **reload** so the runtime GraphQL gateway reflects them. It also handles mock-data cleanup and copying a data model between projects.

This is the **configuration** half. Once a schema is live here, the **[blocks-data-gateway-crud](../blocks-data-gateway-crud/SKILL.md)** skill runs GraphQL CRUD against it. File storage (DMS) is **[blocks-data-storage](../blocks-data-storage/SKILL.md)**.

## Auth & keys — start here (the #1 thing people get wrong)

Configuration happens **inside a project/tenant**, so you first obtain an impersonated, project-scoped token. This is the shared "initial steps" every Blocks config skill runs — **[flows/get-into-project.md](flows/get-into-project.md)** (login → list projects → impersonate). It gives you three values:

- **`ROOT`** — root tenant id (the login token's `tenant_id` claim) → the **`x-blocks-key` header**.
- **`PTENANT`** — the target project's tenant id (from `Project/Gets`, or user-provided) → the **`projectKey`** in request bodies. *In a single-project account `ROOT` == `PTENANT`.*
- **`PTOK`** — the impersonated access token → `Authorization: Bearer`.

Every configuration call therefore carries:
```
x-blocks-key: <ROOT>
Authorization: Bearer <PTOK>
```
…and puts `projectKey: <PTENANT>` in the body. 401 / `session_expired` → the token expired (re-run login) or you sent the wrong `x-blocks-key`.

## URL convention

REST base: `https://api.seliseblocks.com/data/v4` — **no `/api/` prefix.** The swagger advertises `/api/...` but that path serves the portal SPA, not the API. Use `/data/v4/schemas/define`, not `/data/v4/api/schemas/define`.

## What's where

| I need to… | Go to |
|---|---|
| Get an impersonated project token (do this first) | [flows/get-into-project.md](flows/get-into-project.md) |
| Create a schema, add/edit fields, add validation, set access, reload | [flows/configure-schema.md](flows/configure-schema.md) |
| Inventory or delete mock/sample data | [flows/manage-mock-data.md](flows/manage-mock-data.md) |
| Copy a data model from one project to another | [flows/schema-exchange.md](flows/schema-exchange.md) |
| Configure schema admin from a React app | [references/react.md](references/react.md) |
| Run GraphQL CRUD against the live schemas | **[blocks-data-gateway-crud](../blocks-data-gateway-crud/SKILL.md)** |
| Store/serve files (DMS) | **[blocks-data-storage](../blocks-data-storage/SKILL.md)** |

## The config → runtime bridge

Every entity schema (`schemaType: 1`) carries two fields in `GET /schemas` that name its generated GraphQL surface, so the CRUD skill never has to guess:

- `querySchema` (e.g. `"Products"`) → read query is `get<querySchema>` → `getProducts`.
- `mutationSchemas` (e.g. `["insertProduct","updateProduct","deleteProduct"]`) → the exact mutation names (plus `insertMany…`/`updateMany…`/`deleteMany…`).

Hand these to blocks-data-gateway-crud after a reload.

## Key concepts (verified live)

- **Schema** — one collection: `{ schemaName, collectionName, schemaType, fields[] }`. `schemaType: 1` = entity (gets a collection + GraphQL CRUD). `collectionName` follows the project's `collectionNamePattern` (default `sb_{SchemaName}s`, from `GET /configurations`).
- **Field** — `{ name, type, isArray, isPIIData, isUniqueData, description }`. `type` is a **string** scalar name (`"String"`, `"Int"`, `"Long"`, `"Float"`, `"Boolean"`, `"DateTime"`, or a nested schema name). Set `isPIIData: true` deliberately for personal data. Field `name`s become the PascalCase GraphQL field names.
- **Reload** — `POST /schema-configurations/reload`. Schema/field/validation/access edits are **staged** until this succeeds (`data: true`); the gateway does not see them before. Every config flow ends here. Check pending edits with `GET /schemas/unadapted-change-logs`.
- **Access & policies** — each schema (and optionally field) has read/write/edit/delete access levels; Custom levels are driven by rule-based data-access policies. See [configure-schema.md](flows/configure-schema.md) step 5.
- **Mock data** — seeded sample records; the API inventories and deletes them (generation is portal-only). See [manage-mock-data.md](flows/manage-mock-data.md).
- **Schema exchange** — async export/import of a whole data model between projects, correlated by `messageCoRelationId`, result delivered via notification (**blocks-os** skill). See [schema-exchange.md](flows/schema-exchange.md).

## Gotchas

- **Reload or it didn't happen.** New/edited schemas are invisible to the gateway (and to blocks-data-gateway-crud) until reload succeeds.
- **`x-blocks-key` = tenant_id, everywhere.** Reusing the account key on data calls → 401.
- **List params are PascalCase** — `ProjectKey`, `SchemaName`, `PageNo`, `PageSize`, `Keyword`, `SortBy`, `SortDescending`.
- **Unnamed int enums.** `schemaType`, `SchemaAccessLevel`, validation `type`, policy enums, `exportOption` are numeric in the swagger with no member names. The mappings in the flows are from legacy docs — verify against the portal UI before scripting bulk changes.
