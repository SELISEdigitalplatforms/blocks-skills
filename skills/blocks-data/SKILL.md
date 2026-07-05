---
name: blocks-data
description: "Use this skill for any task involving the SELISE Blocks data platform (formerly UDS / Data Gateway — recognition aliases only) — defining or updating schemas and fields, reloading schema configurations, configuring data access policies and schema security levels, adding field validation rules, generating regex patterns with the AI regex assistant, managing data sources and database connections, uploading/downloading files via DMS (pre-signed URLs, folders, file info), exporting and importing schemas between projects, and inspecting or deleting mock data. Trigger when the user mentions UDS, Data Gateway, data service, schemas, collections, entity or child schemas, fields, access policies, field validation, regex validation, GraphQL gateway, projectShortKey, data source, file upload, DMS, schema exchange, or mock data on SELISE Blocks."
---

# Blocks Data Platform

The data service (`https://api.seliseblocks.com/data/v4`) is where a Blocks project's data model lives: schema definitions and their fields, per-schema/per-field access control, field validation rules, the database connection (data source), a document management system (Files/DMS), schema export/import between projects, and mock-data housekeeping. Configuration done here feeds the project's GraphQL runtime gateway. Reach for this skill whenever the task touches "what data exists, who can touch it, and how it's validated" — or file storage via DMS.

## Prerequisites

- Environment and tokens: see the **blocks-setup** skill (`BLOCKS_API_URL`, `X_BLOCKS_KEY`, `BLOCKS_USERNAME`/`BLOCKS_PASSWORD`, login → `access_token`).
- Every request needs `x-blocks-key: <X_BLOCKS_KEY>`; authenticated operations also need `Authorization: Bearer <access_token>`.
- Most endpoints take a `projectKey` — **projectKey = your Blocks Key** (the same value as `X_BLOCKS_KEY`). It is distinct from `projectShortKey` (the short slug used in the GraphQL gateway path), which is runtime-discovered, not an env var — read it from `GET /api/configurations` (`data.projectShortKey`).
- A data source must be configured before schemas behave fully — check with `GET /api/configurations` (see [endpoints.md#configuration](endpoints.md#configuration)). The older `/api/data-sources/*` routes are **deprecated** — see gotchas.

## What's where

| I need to… | Go to |
|---|---|
| Create/update/delete a schema, list schemas, add fields | [endpoints.md#schema](endpoints.md#schema), [flows/define-schema.md](flows/define-schema.md) |
| Apply pending schema changes to the runtime | [endpoints.md#schemaconfiguration](endpoints.md#schemaconfiguration) (reload), any flow's last step |
| Set who can read/write/edit/delete a schema or field | [endpoints.md#dataaccess](endpoints.md#dataaccess), [flows/configure-access.md](flows/configure-access.md) |
| Add validation rules to a field | [endpoints.md#datavalidation](endpoints.md#datavalidation), [flows/add-validations.md](flows/add-validations.md) |
| Generate a regex from a plain-text description | [endpoints.md#regexassistant](endpoints.md#regexassistant) |
| Check or change the database connection | [endpoints.md#configuration](endpoints.md#configuration) (`GET/POST/PUT /api/configurations` — the `#datasource` routes are deprecated) |
| Upload, download, browse, or delete files/folders | [endpoints.md#files](endpoints.md#files), [flows/upload-files.md](flows/upload-files.md) |
| Copy schemas from one project to another | [endpoints.md#schemaexchange](endpoints.md#schemaexchange), [flows/schema-exchange.md](flows/schema-exchange.md) |
| See or delete mock data | [endpoints.md#mockdata](endpoints.md#mockdata), [flows/manage-mock-data.md](flows/manage-mock-data.md) (the `#datamanage` routes are deprecated) |
| Run GraphQL CRUD against my schemas | Runtime gateway — **not in the v4 swagger**; see "Conventions & gotchas" below |
| Log in / refresh tokens | **blocks-setup** / **blocks-iam** skills |
| Receive async notifications (schema export/import results) | **blocks-os** skill (Notification) |

## Key concepts

- **Schema definition** — the data model for one collection: `schemaName`, `collectionName`, `fields[]`, `schemaType` (`1 | 2` int enum; swagger prose calls type-1 collections "Entity-type" — entities get collections and runtime CRUD; the other type is used for nested/child objects. Member names are not published in v4 swagger; treat as unverified). See `SchemaDefinitionResponse` in contracts.md.
- **Field** — `{ name, type, isArray, isPIIData, isUniqueData, description }`. `type` is a **string** (e.g. a scalar type name or another schema's name for nesting). Always decide `isPIIData` deliberately — it flags personal data.
- **Data source** — the MongoDB connection backing the project (`connectionString`, `databaseName`, plus `collectionNamePattern` / `isCollectionNameEditable` returned by `GET /api/configurations`).
- **Access level & policies** — each schema (and optionally each field) has read/write/edit/delete access levels (`SchemaAccessLevel = 0 | 1 | 2 | 3`; the aggregation endpoint's own description names **Public**, **User**, and **Custom** buckets). Custom access is driven by **data access policies**: rule groups (`PolicyRuleGroup`) of `PolicyRule`s comparing token claims, record fields, and static values.
- **Data validation** — per-field rules (`ValidationRule { type, value, secondaryValue, errorMessage, isActive }`) enforced at write time. `ValidationType` is a `0..11` int enum with unpublished member names.
- **Files / DMS** — document management embedded in the data service: pre-signed upload URLs, folders, tags, metadata, versions. Routes are PascalCase (`/api/Files/*`).
- **Schema exchange** — async export of all schema definitions to a JSON file in blob storage, and import of that file into another project. Results arrive via notification correlated by `messageCoRelationId`.
- **Mock data** — sample records seeded per collection. The v4 API lets you inventory counts and delete them; generation is done in the OS portal (no generation endpoint in the v4 swagger).

## Flows

| Flow | Use when |
|---|---|
| [flows/define-schema.md](flows/define-schema.md) | Creating a schema, adding/updating fields, and reloading so changes go live |
| [flows/configure-access.md](flows/configure-access.md) | Setting schema/field security levels and building custom access policies |
| [flows/add-validations.md](flows/add-validations.md) | Adding validation rules to fields, with the AI regex assistant as a helper |
| [flows/upload-files.md](flows/upload-files.md) | Uploading files via pre-signed URL, then listing/downloading/deleting them |
| [flows/schema-exchange.md](flows/schema-exchange.md) | Copying all schema definitions from one project to another |
| [flows/manage-mock-data.md](flows/manage-mock-data.md) | Inventorying and deleting mock/sample data per schema |

## Conventions & gotchas

- **Headers:** `x-blocks-key` on every call; `Authorization: Bearer <token>` for everything here (configuration APIs are admin-side). 401 → refresh via **blocks-setup**.
- **Envelope:** most endpoints return `{ isSuccess, message, httpStatusCode, data, errors }`; mutations put `ActionResponse { acknowledged, itemId, totalImpactedData, message }` in `data`. The **Files/DMS** controller does *not* use this envelope — its responses are flat (`FileResponse`, `GetPreSignedUrlForUploadResponse`, `DmsResponse` with an untyped `result`), and its `errors` is a `Record<string, string>`, not an array.
- **Reload or it didn't happen:** schema/field/policy/validation changes are staged until you call `POST /api/schema-configurations/reload`. (Its older twin `POST /api/configurations/reload` is **deprecated** — don't use it.) Check pending changes with `GET /api/schemas/unadapted-change-logs`.
- **Pagination:** list endpoints (`GET /api/schemas`, `GET /api/data-validations`) use **PascalCase query params** — `PageNo`, `PageSize`, `SortBy`, `SortDescending`, `Keyword`, `ProjectKey`. Files listing (`POST /api/Files/GetFilesInfo`) instead takes a camelCase JSON body (`page`, `pageSize`, `sort`, `filter`).
- **Casing quirks:** `/api/Files/*` routes and `GET /api/Files/GetFile`'s query params (`FileId`, `Version`, `ConfigurationName`, `ProjectKey`) are PascalCase; everything else is lowercase kebab with camelCase bodies.
- **"Cloud use only" twins:** several endpoints exist twice — a query-param version and a path-param version marked "Cloud use only" (used by the OS portal). Prefer the query-param versions from your own tooling.
- **Deprecated route families (still in swagger, obsoleted by the platform team):** `/api/data-sources/*` → `GET/POST/PUT /api/configurations`, `/api/data-manage/*` → `/api/mock-data`, and `POST /api/configurations/reload` → `POST /api/schema-configurations/reload`. endpoints.md marks each one with a ⚠️ banner. Beware the verb change: the old `POST /api/data-manage/mock-data` *deleted* mock data; its replacement is the explicit `DELETE /api/mock-data`. For reading mock data the platform says `GET /api/mock-data`, while swagger documents `GET /api/mock-data/mock-data` — verify which path responds in your project.
- **Undocumented responses:** all `/api/data-access/policy/*` endpoints, `POST /api/regex/generateregex`, and `POST /api/Files/updateFileAdditionalInfo` have **no response schema in swagger** — inspect the live response before relying on a shape.
- **Int enums are unnamed:** `SchemaType`, `SchemaAccessLevel`, `PolicyType`, `PolicyOperation`, `PolicyOperator`, `ConditionSource`, `ValidationType`, `SchemaExportOption`, `ModuleName`, `AccessModifier` are numeric unions in contracts.md with no member names in swagger. Legacy v1 docs mapped some of them (see flow files for hints), but treat every mapping as **unverified in v4** — confirm against live responses or the OS portal UI before hardcoding.
- **GraphQL runtime gateway is not in the swagger.** The v1 pattern was `POST /uds/v1/{projectShortKey}/gateway`; the v4 equivalent is likely `POST https://api.seliseblocks.com/data/v4/{projectShortKey}/gateway` but this is **unverified — verify against your project** before wiring it in. (`projectShortKey` is runtime-discovered — read it from `GET /api/configurations` → `data.projectShortKey`; it is not an env var.) All REST configuration flows in this skill are verified; keep them primary. `SchemaDefinitionResponse.querySchema` / `mutationSchemas` hint at the generated GraphQL operation names per schema.
- **Generic wrappers:** responses are wrapped in generated per-payload envelope interfaces named `…Of…` in contracts.md (e.g. `ServiceResponseOfSchemaDefinitionResponse`, `PaginationResponseOfDataValidationResponse`). In app code a single local `ApiEnvelope<T>` generic mirroring that shape is cleaner — see references/react.md.

## Files

- [endpoints.md](endpoints.md) — every endpoint with exact params and shapes (generated from swagger)
- [contracts.md](contracts.md) — TypeScript types (generated)
- [flows/](flows/) — step-by-step multi-endpoint procedures
- [references/react.md](references/react.md) — React 19 integration guide
