---
name: blocks-data-gateway-crud
description: "Implement GraphQL create/read/update/delete against a SELISE Blocks project's runtime data gateway (`POST https://api.seliseblocks.com/data/v4/gateway`). Covers discovering a schema's auto-generated operation names, writing the query (`get<Collection>` with where/paging/order), insert/update/delete mutations (and insertMany/updateMany/deleteMany), the result + ActionResponse shapes, and wiring it all into a frontend (React 19 / TanStack Query hooks). Use whenever the user wants to READ or WRITE actual data/records through a Blocks schema from an app or script — 'fetch products from my Blocks collection', 'insert a record via the gateway', 'write the update mutation', 'CRUD hooks for my schema', 'why does getOrders not exist on Query'. The schema must already be created + reloaded via blocks-data-gateway-configuration; for file storage use blocks-data-storage."
---

# Blocks Data — Gateway CRUD

Once a schema is created **and reloaded** (via **[blocks-data-gateway-configuration](../blocks-data-gateway-configuration/SKILL.md)**), the runtime gateway auto-generates GraphQL query + insert/update/delete operations for it. This skill is how to discover and call them, and how to wire them into an app.

**Gateway:** `POST https://api.seliseblocks.com/data/v4/gateway` — one endpoint for all schemas in the project, standard GraphQL body `{ "query": "...", "variables": { ... } }`.

## Auth & keys (same model as the whole data service)

- **Login:** `POST https://api.seliseblocks.com/iam/v4/auth-login` with `{ "username", "password" }` → `access_token` (~5 min) + `refresh_token`.
- **The project key = the token's `tenant_id` claim.** Send it as the **`x-blocks-key` header** on every gateway call, alongside `Authorization: Bearer <access_token>`.
  ```
  x-blocks-key: <tenant_id>
  Authorization: Bearer <access_token>
  ```
- It's **not** the account/cloud key used to reach login. 401 → wrong `x-blocks-key` or expired token (refresh via `POST /iam/v4/auth/refresh`).

## What's where

| I need to… | Go to |
|---|---|
| Discover op names + write CRUD queries/mutations by hand | [flows/graphql-crud.md](flows/graphql-crud.md) |
| Wire CRUD into a React 19 / TanStack Query app | [references/react.md](references/react.md) |
| Create/edit/reload the schema first | **[blocks-data-gateway-configuration](../blocks-data-gateway-configuration/SKILL.md)** |
| Store/serve files (DMS) | **[blocks-data-storage](../blocks-data-storage/SKILL.md)** |

## The one rule that saves you: don't hand-derive names

Each schema's exact generated operations come from `GET /schemas` (configuration skill) on the schema item:

- `querySchema` (e.g. `"Products"`) → read query is **`get<querySchema>`** → `getProducts`.
- `mutationSchemas` → the exact mutation names, e.g. `["insertProduct","updateProduct","deleteProduct"]`. `insertMany…`/`updateMany…`/`deleteMany…` also exist.

Pluralization is generated, not guessable (`datastructure` → `getdatastructures`, `insertdatastructure`). A `Field 'getX' does not exist on type 'Query'` error almost always means either the schema wasn't reloaded, or the name was hand-derived instead of read from `querySchema`/`mutationSchemas`.

## Operation shapes (verified live)

- **Read** — `get<Collection>(input: DynamicQueryInput, where: <Schema>FilterInput, order: [<Schema>SortInput!], paging: PaginationInput): <Schema>Result`. Result is `{ items[], totalCount, pageNo, pageSize, totalPages, hasNextPage, hasPreviousPage }`; `PaginationInput` is `{ pageNo, pageSize }`.
- **Create** — `insert<Schema>(input: <Schema>InsertInput): ActionResponse`.
- **Update** — `update<Schema>(filter: String, where: <Schema>FilterInput, input: <Schema>UpdateInput): ActionResponse`.
- **Delete** — `delete<Schema>(filter: String, where: <Schema>FilterInput, input: <Schema>DeleteInput): ActionResponse`.
- **ActionResponse** — `{ acknowledged, itemId, totalImpactedData, message }`. `itemId` on insert is the new record's `ItemId`; `totalImpactedData` on update/delete is the affected-row count (guard against an empty `where` matching everything).
- **Casing** — insert/update input fields are **PascalCase**, matching the schema field names (`ItemId`, `ItemName`, …). Every record carries system fields `ItemId`, `Language`, `OrganizationId`, `Tags`.

Full query/variable examples are in [flows/graphql-crud.md](flows/graphql-crud.md).

## Gotchas

- **Reload gates everything.** If a `get…`/`insert…` field is missing, the schema hasn't been reloaded — go back to blocks-data-gateway-configuration and `POST /schema-configurations/reload`.
- **`x-blocks-key` = tenant_id.** Reusing the account key → 401.
- **Introspect when unsure of inputs.** Right after creating a schema, `{ __type(name:"<Schema>InsertInput"){ inputFields{ name type{ kind name ofType{ name } } } } }` gives the exact fields instead of guessing.
- **The gateway is not in the swagger.** These shapes were captured by live introspection; verify against your project if the platform changes.
