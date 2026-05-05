# Flow: query-data-flow

## Trigger

User wants to read or write data from a schema that has already been defined.

> "query data from my Product schema"
> "insert a record into my collection"
> "fetch all orders from the database"
> "update a record in the User collection"
> "delete a document from my schema"
> "how do I read data after setting up my schema"

---

## Pre-flight Questions

Before starting, confirm:

1. Has a schema been defined and `reload-configuration` called? (Data is only accessible after reload.)
2. Which schema / collection are you querying? (e.g. `Product`, `Order`)
3. Is this a read (query) or a write (mutation)?
4. Is the schema security `accessLevel: 0` (Public), `accessLevel: 1` (User), or `accessLevel: 2` (Custom)? (Determines auth requirements)

---

## How UDS Data Access Works

After `reload-configuration`, SELISE Blocks exposes a **GraphQL endpoint** reflecting your defined schemas. All CRUD on data goes through this endpoint — NOT REST actions.

```
POST $API_BASE_URL/uds/v1/$PROJECT_SLUG/gateway
```

Headers:
```
Authorization: Bearer $ACCESS_TOKEN
x-blocks-key: $X_BLOCKS_KEY
Content-Type: application/json
```

> **IMPORTANT:** The `$PROJECT_SLUG` is part of the URL **path**. Do NOT pass it as a query parameter. The `x-blocks-key` header is also required on every request.

The GraphQL schema is auto-generated from your schema definitions.

---

## Flow Steps

### Step 1 — Confirm Schema Is Live

```
Action: get-schema
Input: id = $SCHEMA_ID, projectKey = $X_BLOCKS_KEY
```

If schema exists → proceed. If not → run `define-schema-flow` first.

Check for unadapted changes:
```
Action: get-unadapted-changes
Input: projectKey = $X_BLOCKS_KEY
```

If `data.totalImpactedData > 0` → call reload-configuration first.

---

### Step 2 — Query Data (Read)

Use the GraphQL endpoint. Query names: `get{SchemaName}s` for lists, `get{SchemaName}` for single records.

#### List records with pagination

```bash
curl --location "$API_BASE_URL/uds/v1/$PROJECT_SLUG/gateway" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "query": "query { getProducts(page: 1, pageSize: 20) { items { _id name price createdAt } totalCount } }"
  }'
```

#### Get single record by ID

```bash
curl --location "$API_BASE_URL/uds/v1/$PROJECT_SLUG/gateway" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "query": "query { getProduct(id: \"RECORD_ID\") { _id name price description } }"
  }'
```

#### Filter records

```bash
--data '{
  "query": "query { getProducts(filter: { name: \"Widget\" }, sort: { field: \"createdAt\", order: \"DESC\" }) { items { _id name price } totalCount } }"
}'
```

Filter operators: `_eq`, `_ne`, `_gt`, `_gte`, `_lt`, `_lte`, `_in`, `_nin`, `_regex`

---

### Step 3 — Create Data (Mutation)

```bash
curl --location "$API_BASE_URL/uds/v1/$PROJECT_SLUG/gateway" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "query": "mutation { createProduct(input: { name: \"Widget\", price: 9.99 }) { _id name price } }"
  }'
```

---

### Step 4 — Update Data (Mutation)

```bash
curl --location "$API_BASE_URL/uds/v1/$PROJECT_SLUG/gateway" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "query": "mutation { updateProduct(id: \"RECORD_ID\", input: { price: 12.99 }) { _id name price } }"
  }'
```

---

### Step 5 — Delete Data (Mutation)

```bash
curl --location "$API_BASE_URL/uds/v1/$PROJECT_SLUG/gateway" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "query": "mutation { deleteProduct(id: \"RECORD_ID\") { _id } }"
  }'
```

---

## GraphQL Naming Conventions

| Operation | GraphQL name | Example (SchemaName = `Product`) |
|-----------|-------------|----------------------------------|
| List records | `get{Name}s` | `getProducts` |
| Get by ID | `get{Name}` | `getProduct(id: "...")` |
| Create | `create{Name}` | `createProduct(input: {...})` |
| Update | `update{Name}` | `updateProduct(id: "...", input: {...})` |
| Delete | `delete{Name}` | `deleteProduct(id: "...")` |

Every record has an auto-generated `_id` field (MongoDB ObjectId).

---

## Security Behaviour at Query Time

| Schema security | Who can query/mutate |
|----------------|----------------------|
| Public (accessLevel=0) | Anyone — no token required for reads |
| User (accessLevel=1) | Any authenticated user (valid Bearer token) |
| Custom (accessLevel=2) | Only roles listed in access policies for the operation |

For `accessLevel=2`: if the authenticated user's role is not in a policy allowing the operation, the GraphQL query returns a permission error.

---

## Error Handling

| Step | Error | Cause | Action |
|------|-------|-------|--------|
| Step 1 | Schema not found | Schema not defined | Run `define-schema-flow` first |
| Step 1 | Unadapted changes exist | reload not called | Call `reload-configuration` |
| Step 2 | `Cannot query field 'getProducts'` | reload not called | Call `reload-configuration` |
| Step 2 | Null response / empty schema | Schema not defined | Run `define-schema-flow` |
| Step 2 | `errors` array in response | Field doesn't exist or type mismatch | Check field names with `get-schema` |
| Any | 401 Unauthorized | Token expired | Refresh token from blocks-idp |
| Any | 403 Forbidden | Role not in access policy | Add role via `create-access-policy` |
