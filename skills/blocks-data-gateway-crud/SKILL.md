---
name: blocks-data-gateway-crud
description: "Implement GraphQL create/read/update/delete against a SELISE Blocks project's runtime data gateway (`POST https://api.seliseblocks.com/data/v4/gateway`). Covers discovering a schema's auto-generated operation names, writing the query (`get<Collection>` with where/paging/order), insert/update/delete mutations (and insertMany/updateMany/deleteMany), the result + ActionResponse shapes, and wiring it all into a frontend (React 19 / TanStack Query hooks). Use whenever the user wants to READ or WRITE actual data/records through a Blocks schema from an app or script — 'fetch products from my Blocks collection', 'insert a record via the gateway', 'write the update mutation', 'CRUD hooks for my schema', 'why does getOrders not exist on Query'. The schema must already be created + reloaded via blocks-data-gateway-configuration; for file storage use blocks-data-storage."
---

# Blocks Data — Gateway CRUD

Once a schema is created **and reloaded** (via **[blocks-data-gateway-configuration](../blocks-data-gateway-configuration/SKILL.md)**), the runtime gateway auto-generates GraphQL query + insert/update/delete operations for it. This skill is how to discover and call them, and how to wire them into an app.

**Gateway:** `POST https://api.seliseblocks.com/data/v4/gateway` — one endpoint for all schemas in the project, standard GraphQL body `{ "query": "...", "variables": { ... } }`.

## Auth & Keys

Gateway CRUD is runtime data access inside a project. The project key is always the target project tenant id (`PTENANT`), never the bootstrap/account tenant.

- **Browser/runtime calls:** send `x-blocks-key: <PTENANT>` and `credentials: "include"` so Blocks uses the signed-in user's hosted SSO cookie/session. This is the normal React app path.
- **Admin/build script calls only:** first run `blocks-data-gateway-configuration/flows/get-into-project.md`; send `x-blocks-key: <PTENANT>` plus `Authorization: Bearer <PTOK>`. This is for setup scripts, smoke tests, and internal tooling only. A deployed frontend must never use `PTOK` or impersonation.

401 → wrong project key, missing/expired session, or expired admin token. Do not use the bootstrap/account tenant as `x-blocks-key` on gateway calls.

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

- **Read** — `get<Collection>(where: <Schema>FilterInput, order: [<Schema>SortInput!], paging: PaginationInput): <Schema>Result`. Result is `{ items[], totalCount, pageNo, pageSize, totalPages, hasNextPage, hasPreviousPage }`; `PaginationInput` is `{ pageNo, pageSize }`. **`order` entries are `{ direction, field }`** — e.g. `[{ direction: DESC, field: "Price" }]` — not a `{ Field: DIRECTION }` map. (The old `input: DynamicQueryInput` arg is **deprecated** — use `where`/`order`/`paging`.)
- **Create** — `insert<Schema>(input: <Schema>InsertInput): ActionResponse`.
- **Update** — `update<Schema>(where: <Schema>FilterInput, input: <Schema>UpdateInput): ActionResponse`. (The `filter: String` arg is **deprecated** — target rows with `where`.)
- **Delete** — `delete<Schema>(where: <Schema>FilterInput, input: <Schema>DeleteInput): ActionResponse`. (The `filter: String` arg is **deprecated** — target rows with `where`.)
- **ActionResponse** — `{ acknowledged, itemId, totalImpactedData, message }`. `itemId` on insert is the new record's `ItemId`; `totalImpactedData` on update/delete is the affected-row count (guard against an empty `where` matching everything).
- **Casing** — insert/update input fields are **PascalCase**, matching the schema field names (`ItemId`, `ItemName`, …). Every record carries system fields `ItemId`, `Language`, `OrganizationId`, `Tags`.

Full query/variable examples are in [flows/graphql-crud.md](flows/graphql-crud.md).

## Gotchas

- **Reload gates everything.** If a `get…`/`insert…` field is missing, the schema hasn't been reloaded — go back to blocks-data-gateway-configuration and `POST /schema-configurations/reload`.
- **`x-blocks-key` = `PTENANT`.** Reusing the bootstrap/account tenant key → 401.
- **Introspect when unsure of inputs.** Right after creating a schema, `{ __type(name:"<Schema>InsertInput"){ inputFields{ name type{ kind name ofType{ name } } } } }` gives the exact fields instead of guessing.
- **The gateway is not in the swagger.** These shapes were captured by live introspection; verify against your project if the platform changes.
