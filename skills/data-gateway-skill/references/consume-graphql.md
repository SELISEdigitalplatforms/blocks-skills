# Consume (GraphQL Gateway) Reference — Data Gateway (UDS)

After schemas are configured and published, the GraphQL gateway is the runtime interface
for all CRUD operations.

---

## Gateway Endpoint

```
POST /uds/v1/{projectShortKey}/gateway
Content-Type: application/json
x-blocks-key: <blocks-key>
Authorization: Bearer <token>     ← required if any operation is loggedInUser or custom
```

Body:

```json
{
  "query": "...",
  "variables": {}
}
```

`projectShortKey` comes from `GET /uds/v1/data-sources/get` → `data.projectShortKey`

---

## Introspection

Use introspection to discover available types and operations for a project:

```graphql
query {
  __schema {
    queryType {
      fields {
        name
        description
        args {
          name
          type {
            name
            kind
          }
        }
      }
    }
    mutationType {
      fields {
        name
        description
        args {
          name
          type {
            name
            kind
          }
        }
      }
    }
    types {
      name
      kind
      fields {
        name
        type {
          name
          kind
        }
      }
    }
  }
}
```

Or fetch a specific type:

```graphql
query {
  __type(name: "Product") {
    name
    fields {
      name
      type {
        name
        kind
        ofType {
          name
          kind
        }
      }
    }
  }
}
```

---

## Auto-Generated Operations

For each published Entity schema (e.g. schema named `Test`), Data Gateway auto-generates:

| Operation     | GraphQL name                     | Type     |
| ------------- | -------------------------------- | -------- |
| List / filter | `getTests(where, order, paging)` | Query    |
| Create        | `insertTest(input)`              | Mutation |
| Create many   | `insertManyTest(input)`          | Mutation |
| Update        | `updateTest(where, input)`       | Mutation |
| Update many   | `updateManyTest(where, input)`   | Mutation |
| Delete        | `deleteTest(where, input)`       | Mutation |
| Delete many   | `deleteManyTest(where, input)`   | Mutation |

**Naming convention** (schema name `Test` as example):

- Query: `get` + PascalCase schema name + `s` → `getTests`
- Insert: `insert` + PascalCase schema name → `insertTest`
- Insert many: `insertMany` + PascalCase schema name → `insertManyTest`
- Update: `update` + PascalCase schema name → `updateTest`
- Update many: `updateMany` + PascalCase schema name → `updateManyTest`
- Delete: `delete` + PascalCase schema name → `deleteTest`
- Delete many: `deleteMany` + PascalCase schema name → `deleteManyTest`

**System fields automatically present on every record:**
| Field | Meaning |
|-------|---------|
| `ItemId` | Unique record identifier |
| `CreatedDate` | Timestamp when record was created |
| `LastUpdatedDate` | Timestamp of last update |
| `CreatedBy` | userId of the creator (from token) |
| `LastUpdatedBy` | userId of last updater (from token) |
| `Language` | Language/locale of the record |
| `OrganizationIds` | Organisation IDs associated with the record |
| `Tags` | Tags array |

**Only Entity schemas (schemaType: 1) have gateway operations.**
Child schemas (schemaType: 2) are embedded objects — no gateway operations.

---

## Query — List / Filter

Operation name: `get` + SchemaName + `s` (e.g. `getTests`)

```graphql
query {
  getTests(where: {}, order: [], paging: { pageNo: 1, pageSize: 10 }) {
    items {
      ItemId
      CreatedDate
      LastUpdatedDate
      CreatedBy
      LastUpdatedBy
      Language
      OrganizationIds
      Tags
      testField
    }
    totalCount
    pageNo
    pageSize
    totalPages
    hasNextPage
    hasPreviousPage
  }
}
```

**Response pagination fields:**
`totalCount`, `pageNo`, `pageSize`, `totalPages`, `hasNextPage`, `hasPreviousPage`

**`where`** — pass `{}` for no filter, or add field conditions:

```graphql
where: {
  testField: { contains: "sample" }
  CreatedDate: { gte: "2024-01-01" }
}
```

Common `where` operators:
| Operator | Meaning |
|----------|---------|
| `eq` | Equals |
| `neq` | Not equals |
| `contains` | String contains |
| `startsWith` | String starts with |
| `endsWith` | String ends with |
| `gt` | Greater than |
| `gte` | Greater than or equal |
| `lt` | Less than |
| `lte` | Less than or equal |
| `in` | Value in list |
| `isNull` | Field is null |

**`order`** — pass `[]` for no sort, or sort by field:

```graphql
order: [{ field: "CreatedDate", direction: DESC }]
```

**`paging`** — pageNo starts at 1:

```graphql
paging: { pageNo: 1, pageSize: 20 }
```

---

## Mutation — Insert

Operation name: `insert` + SchemaName (e.g. `insertTest`)

```graphql
mutation {
  insertTest(input: { testField: "Sample text" }) {
    acknowledged
    itemId
    totalImpactedData
    message
  }
}
```

- Pass only the user-defined fields in `input` — system fields (ItemId, CreatedDate, CreatedBy etc.) are set automatically
- Regex validation is enforced here — returns 400 if a field fails its pattern
- Response `itemId` is the newly created record's `ItemId`

---

## Mutation — Update

Operation name: `update` + SchemaName (e.g. `updateTest`)

```graphql
mutation {
  updateTest(where: { testField: { eq: "hjjfdfk" } }, input: { testField: "new value" }) {
    acknowledged
    itemId
    totalImpactedData
    message
  }
}
```

- `where` targets which records to update (same operators as query `where`)
- `input` contains only the fields to change
- `totalImpactedData` shows how many records were updated
- Regex validation is enforced on fields in `input`

---

## Mutation — Delete

Operation name: `delete` + SchemaName (e.g. `deleteTest`)

```graphql
mutation {
  deleteTest(where: { ItemId: { eq: "abc123" } }, input: { isHardDelete: false }) {
    acknowledged
    itemId
    totalImpactedData
    message
  }
}
```

- `where` targets which records to delete
- `isHardDelete: false` → soft delete (record marked as deleted, not removed from DB)
- `isHardDelete: true` → hard delete (record permanently removed from DB)
- Pass `where: {}` with caution — deletes ALL records matching no filter

---

## Mutation — Delete Many (Batch)

Operation name: `deleteMany` + SchemaName (e.g. `deleteManyTest`)

```graphql
mutation {
  deleteManyTest(where: {}, input: { isHardDelete: true }) {
    acknowledged
    totalImpactedData
    message
  }
}
```

- Deletes **all** records matching the `where` filter in one call
- `where: {}` matches every record — use with caution
- `isHardDelete: true` permanently removes records from the database
- Response does **not** include `itemId` (multiple records may be affected)
- `totalImpactedData` tells you how many records were deleted

This is the preferred way to bulk-delete runtime/audit data (e.g. old scan results, logs) while preserving configuration schemas.

---

## Mutation — Update Many (Batch)

Operation name: `updateMany` + SchemaName (e.g. `updateManyTest`)

```graphql
mutation {
  updateManyTest(where: { status: { eq: "pending" } }, input: { status: "archived" }) {
    acknowledged
    totalImpactedData
    message
  }
}
```

- Updates all records matching `where` with the fields in `input`
- Response does **not** include `itemId`
- `totalImpactedData` shows how many records were modified

---

## Mutation — Insert Many (Batch)

Operation name: `insertMany` + SchemaName (e.g. `insertManyTest`)

```graphql
mutation {
  insertManyTest(input: [{ testField: "A" }, { testField: "B" }]) {
    acknowledged
    totalImpactedData
    message
  }
}
```

- Creates multiple records in a single call
- `input` is an array of objects
- Response does **not** include `itemId`

---

## Mutation Response Shape

Single-record mutations (`insert`, `update`, `delete`) return:

```json
{
  "acknowledged": true,
  "itemId": "<affected-record-id>",
  "totalImpactedData": 1,
  "message": null
}
```

Batch mutations (`insertMany`, `updateMany`, `deleteMany`) return the same shape **without `itemId`**:

```json
{
  "acknowledged": true,
  "totalImpactedData": 42,
  "message": null
}
```

---

## Authorization Behavior at Runtime

| Schema access level | What happens at gateway                                            |
| ------------------- | ------------------------------------------------------------------ |
| `Public`            | Request passes with no token                                       |
| `LoggedInUser`      | Gateway validates Bearer token; 401 if missing/invalid             |
| `Custom`            | Gateway evaluates policy rules against token claims; 403 if denied |

Field-level access: if a field is restricted and the caller lacks access, that field is
omitted from the response (not an error — it's simply null/absent).

---

## Common Runtime Errors

| Error                           | Cause                              | Fix                                                      |
| ------------------------------- | ---------------------------------- | -------------------------------------------------------- |
| 401 Unauthorized                | Token missing or invalid           | Pass valid `Authorization: Bearer <token>`               |
| 403 Forbidden                   | Custom policy rule denied access   | Check role/claim in token vs policy rules                |
| 400 Validation Error            | Regex validation failed on a field | Check the field value matches the configured pattern     |
| Field returns null unexpectedly | Field-level access restriction     | Verify caller's token has required access for that field |
| Schema not found in gateway     | Changes not reloaded               | Call `POST /uds/v1/configurations/reload`                |
| Gateway timeout                 | Service not running                | Ping, then trigger deployment pipeline                   |
