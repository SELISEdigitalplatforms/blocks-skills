# GraphQL CRUD against the runtime gateway

Once a schema is created **and reloaded** (via **[blocks-data-gateway-configuration](../../blocks-data-gateway-configuration/flows/configure-schema.md)**), the gateway auto-generates its CRUD. This flow is how to discover and call those operations. Same auth as everywhere: **`x-blocks-key: <project tenant id>`** on every request + `Authorization: Bearer <token>`. For the login+extract snippet that sets `$BLOCKS_API_URL`, `$PTENANT` (the project tenant id) and the `hdr` array, see the configuration skill's [get-into-project.md](../../blocks-data-gateway-configuration/flows/get-into-project.md).

**Gateway:** `POST https://api.seliseblocks.com/data/v4/gateway` — one endpoint, standard GraphQL body `{ "query": "...", "variables": { ... } }`.

## Step 1 — Get the exact operation names (don't hand-derive)

```bash
curl -s "$BLOCKS_API_URL/data/v4/schemas?ProjectKey=$PTENANT&SchemaName=Product&PageNo=1&PageSize=1" "${hdr[@]}"
```
Read from the returned item:
- `querySchema` (e.g. `"Products"`) → the read query field is **`get` + querySchema** → `getProducts`.
- `mutationSchemas` (e.g. `["insertProduct","updateProduct","deleteProduct"]`) → use verbatim. `insertMany…`/`updateMany…`/`deleteMany…` also exist.

Pluralization is generated, not guessable (`datastructure` → `getdatastructures`, `insertdatastructure`) — always take the live values.

If you need the exact input/output fields (e.g. right after creating the schema), introspect:
```graphql
{ __type(name: "ProductInsertInput") { inputFields { name type { kind name ofType { name } } } } }
```

## Operation shapes (verified live)

**Read** — `get<Collection>(input: DynamicQueryInput, where: <Schema>FilterInput, order: [...], paging: PaginationInput): <Schema>Result`

```graphql
query GetProducts($where: ProductFilterInput, $paging: PaginationInput, $order: [ProductSortInput!]) {
  getProducts(where: $where, paging: $paging, order: $order) {
    totalCount
    pageNo
    pageSize
    totalPages
    hasNextPage
    hasPreviousPage
    items {
      ItemId
      Title
      Price
      Sku
    }
  }
}
```
Variables:
```json
{ "where": { "Price": { "gt": 0 } }, "paging": { "pageNo": 1, "pageSize": 20 }, "order": [{ "Title": "ASC" }] }
```
- The result wrapper is always `{ items, totalCount, pageNo, pageSize, totalPages, hasNextPage, hasPreviousPage }`.
- `where` is a generated `<Schema>FilterInput` (per-field operators like `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `contains`, `in`, `and`/`or`). Omit it to fetch all.
- Every record carries system fields — `ItemId` (the id), `Language`, `OrganizationId`, `Tags` — alongside your schema fields.

**Create** — `insert<Schema>(input: <Schema>InsertInput): ActionResponse`
```graphql
mutation InsertProduct($input: ProductInsertInput!) {
  insertProduct(input: $input) { acknowledged itemId totalImpactedData message }
}
```
```json
{ "input": { "Title": "Widget", "Price": 9.99, "Sku": "WID-001" } }
```
`itemId` in the response is the new record's `ItemId`. Input field names are **PascalCase**, matching the schema fields. Omit system fields — the platform assigns them.

**Update** — `update<Schema>(filter: String, where: <Schema>FilterInput, input: <Schema>UpdateInput): ActionResponse`
```graphql
mutation UpdateProduct($where: ProductFilterInput, $input: ProductUpdateInput!) {
  updateProduct(where: $where, input: $input) { acknowledged totalImpactedData message }
}
```
```json
{ "where": { "ItemId": { "eq": "68df...ece" } }, "input": { "Price": 12.5 } }
```
Target by `where` (typed filter) or `filter` (a raw string filter). `totalImpactedData` tells you how many records changed — guard against an empty `where` matching everything.

**Delete** — `delete<Schema>(filter: String, where: <Schema>FilterInput, input: <Schema>DeleteInput): ActionResponse`
```graphql
mutation DeleteProduct($where: ProductFilterInput) {
  deleteProduct(where: $where) { acknowledged totalImpactedData message }
}
```
```json
{ "where": { "ItemId": { "eq": "68df...ece" } } }
```

**Bulk** — `insertMany<Schema>`, `updateMany<Schema>`, `deleteMany<Schema>` mirror the singular forms for batch operations; all return `ActionResponse`.

## Errors

GraphQL errors come back as `{ "errors": [{ "message": "...", "locations": [...] }] }` with HTTP 400 (or 200 for partial). A `Field 'X' does not exist on type 'Query'` error usually means the schema wasn't reloaded, or you derived the name instead of reading `querySchema`/`mutationSchemas`. 401 → wrong `x-blocks-key`/expired token.

## Quick end-to-end smoke test

```bash
curl -s -X POST "$BLOCKS_API_URL/data/v4/gateway" "${hdr[@]}" -H "Content-Type: application/json" \
  --data-raw '{"query":"query($p:PaginationInput){ getProducts(paging:$p){ totalCount items{ ItemId Title } } }","variables":{"p":{"pageNo":1,"pageSize":2}}}'
```
`{"data":{"getProducts":{"totalCount":...}}}` confirms the schema is live and CRUD is wired. For the app integration, see [../references/react.md](../references/react.md).
