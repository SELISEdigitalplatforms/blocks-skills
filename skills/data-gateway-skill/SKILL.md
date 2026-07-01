---
name: data-gateway
description: >
  Use this skill for ANY task involving the Data Gateway (UDS) application — including
  setting up or checking data sources, creating/updating/deleting schemas and their fields,
  configuring access control policies (public/loggedInUser/custom) at schema or field level,
  adding regex validation rules, checking gateway health, triggering deployment pipelines,
  and doing CRUD operations (including bulk insert, update, and delete) via the GraphQL gateway endpoint.
  Trigger whenever the user mentions "Data Gateway", "UDS", schema creation, entity setup, GraphQL access,
  access policies, publishing schemas, field validation, projectShortKey, x-blocks-key, bulk delete, clean up data,
  remove old records, or anything related to configuring or consuming a Data Gateway instance.
---

# Data Gateway (UDS) Skill

Data Gateway is a platform service (UDS = Unified Data Service) that lets users define
schemas with typed properties, configure validation and access control, then exposes a
GraphQL CRUD gateway for each project.

Base URL: `https://api.seliseblocks.com`

---

## Authentication — REQUIRED ON EVERY REQUEST

### Key Values & .env Variables

| Key | .env variable | Format | Example |
|-----|--------------|--------|---------|
| `x-blocks-key` | `VITE_X_BLOCKS_KEY` | 35-char alphanumeric | `***REMOVED***` |
| `projectKey` | `VITE_X_BLOCKS_KEY` | 35-char alphanumeric | `***REMOVED***` |
| `projectShortKey` | `VITE_PROJECT_SLUG` | Short lowercase string | `dbahjq` |

- `x-blocks-key` and `projectKey` are long 35-character alphanumeric strings — similar format, different values
- `projectShortKey` is a short slug (6–8 chars) — read from `VITE_PROJECT_SLUG` in `.env`
- `projectShortKey` also comes from the data source GET response (`data.projectShortKey`) — both should match

### Step 1 — Get a Bearer Token (system/config operations)

Use the IDP token endpoint with `client_credentials` grant. All credentials come from `.env`.

```
POST https://api.seliseblocks.com/idp/v1/Authentication/Token
x-blocks-key: <VITE_BLOCKS_KEY>
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
client_id=<VITE_CLIENT_ID>
client_secret=<VITE_CLIENT_SECRET>
```

Response:
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

Store `access_token` and use it as the Bearer token in all subsequent requests.
Tokens expire — re-fetch when a 401 is returned.

`.env` keys:
```
VITE_BLOCKS_KEY=***REMOVED***
VITE_PROJECT_KEY=***REMOVED***
VITE_PROJECT_SLUG=dbahjq
VITE_CLIENT_ID=my_client_id
VITE_CLIENT_SECRET=my_client_secret
```

### Step 2 — Include Both Headers on Every Request

```
x-blocks-key: <VITE_BLOCKS_KEY>
Authorization: Bearer <access_token from Step 1>
```

---

## Two Distinct Parts

### Part 1 — Configure (admin/setup side)
Used to define schemas, fields, validation, access policies, and data sources.
→ See `references/configure-apis.md` for full request/response contracts.

### Part 2 — Consume (application/runtime side)
Used to perform GraphQL CRUD operations on published schemas.
→ See `references/consume-graphql.md` for query/mutation patterns and introspection.

---

## Configuration Flow

Always start with a Bearer token, then follow the four phases in order.

```
── PRE-STEP: Authentication ─────────────────────────────────────────────────

  POST https://api.seliseblocks.com/idp/v1/Authentication/Token
  → client_credentials grant using CLIENT_ID + CLIENT_SECRET + BLOCKS_KEY from .env
  → save access_token — re-fetch on 401


── PHASE 1: Data Gateway Instance ───────────────────────────────────────────

  Step 1a — Check data source
    GET /uds/v1/data-sources/get?projectKey=...
    → if data is null: no data source configured → go to Step 1b
    → if data exists: save projectShortKey → go to Step 1c

  Step 1b — Add data source (only if not configured)
    POST /uds/v1/data-sources/add
    → Ask user: own MongoDB connection string, or Blocks-provided ("default")?
    → Save projectShortKey from response

  Step 1c — Ping the gateway instance
    GET /uds/v1/{projectShortKey}/ping
    → 200 OK: instance is alive → proceed to Phase 2
    → Error/timeout: instance is down → go to Step 1d

  Step 1d — Start the instance (only if ping failed)
    GET /uds/v1/deployment/pipeline?projectKey=...
    → Wait a few seconds, then retry ping before proceeding


── PHASE 2: Schema & Fields ─────────────────────────────────────────────────

  Step 2a — Check if schema already exists
    GET /uds/v1/schemas?ProjectKey=...
    → Schema not found: create it → Step 2b
    → Schema exists: check if fields need changes → Step 2c

  Step 2b — Create schema (only if it does not exist)
    POST /uds/v1/schemas/define
    → schemaType: 1=Entity (supports CRUD), 2=Child (nested object only, no CRUD)
    → collectionName must be "sb_" + lowercase schema name (Entity only)
    → field type is a string: "String", "Int", "Long", "Float", "Boolean", "DateTime"
    → Every field must have isPIIData evaluated — see PII Detection in configure-apis.md
    → Save itemId from response

  Step 2c — Add or update fields (if schema exists or needs new fields)
    POST /uds/v1/schemas/fields
    → Safe to call repeatedly — additive/upsert, will not overwrite existing data
    → field type is a string value (not an integer)
    → Every field must have isPIIData evaluated — NEVER skip this, even if unsure ask the user

  ⚠️ RELOAD REQUIRED after any schema or field change → see Phase 4


── PHASE 3: Validation & Access (OPTIONAL — only if user requests) ──────────

  ⚠️ DO NOT perform Phase 3 steps unless the user explicitly asks to:
      - Set or change access control, OR
      - Add or update validation on a field
  If the user only asks to create/update a schema or add fields → skip Phase 3 entirely,
  go straight to Phase 4 reload.

  Steps 3a and 3b are independent — do only the one(s) the user requests.

  Step 3a — Add regex validation to a field (only if user requests validation)
    POST /uds/v1/data-validations
    → Only "Regex" validationType is supported
    → Validation is enforced on every create and update mutation
    → Check existing: GET /uds/v1/data-validations/by-schema-and-field?...
    → Update existing: PUT /uds/v1/data-validations

  Step 3b — Set access control (only if user requests access change)
    POST /uds/v1/data-access/security/change  (call once per operation)
    → Configure READ, WRITE, EDIT, DELETE independently
    → accessLevel: 0=Inherited, 1=User, 2=Public, 3=Custom
    → policyType: 0=schema-level, 1=field-level
    → fieldNames: always at least one item
        schema-level → ["SchemaName"]
        field-level  → ["fieldName"]

  Step 3c — Define policy rules (only if accessLevel = 3 / Custom)
    POST /uds/v1/data-access/policy/create
    → Only needed when Step 3b sets accessLevel to Custom
    → Rules use leftSource/operator/rightSource as integers
    → Use nestedGroups + logicalOperator:1 (OR) for multiple role checks

  Field/property level access:
    → By default every field inherits the schema access policy
    → Override individually using policyType:1 + fieldNames:["fieldName"]
    → Set accessLevel:0 (Inherited) to reset a field back to schema default


── PHASE 4: Reload (MANDATORY after any change) ─────────────────────────────

  POST /uds/v1/{projectShortKey}/configurations/reload?projectKey=<projectKey>

  ⚠️ This step is MANDATORY after ANY of the following:
      - Schema created or updated
      - Fields added or updated
      - Validation added, updated, or deleted
      - Access level changed
      - Policy/rule created or updated

  Without a reload, changes are NOT reflected in the GraphQL gateway.


── CONSUME: GraphQL Gateway (after configuration is complete) ────────────────

  POST /uds/v1/{projectShortKey}/gateway
  → Only Entity schemas (schemaType:1) support CRUD operations
  → Child schemas (schemaType:2) are embedded objects — no direct gateway operations
  → See references/consume-graphql.md for query/mutation patterns
```

---

## Key Enums

### SchemaType
| Value  | Int | Meaning |
|--------|-----|---------|
| Entity | 1   | Top-level schema — full GraphQL CRUD operations available |
| Child  | 2   | Nested object only — used as a field type inside Entity schemas, no direct CRUD |

**Key rule:** CRUD operations (query/create/update/delete) are only possible on Entity schemas.
Child schemas are embedded objects — they have no collection and no gateway operations of their own.

**Collection name rule:** always `sb_` + lowercase schema name (Entity only).
Examples: `Product` → `sb_product`, `TournamentTeam` → `sb_tournamentteam`

### ScalarType (field types) — always use string values
| String value | Use for |
|--------------|---------|
| `"String"`   | Text fields |
| `"Int"`      | Whole numbers |
| `"Long"`     | Large whole numbers |
| `"Float"`    | Decimal / price fields |
| `"Boolean"`  | true/false |
| `"DateTime"` | Date and time |

To use a Child schema as a nested field type, use the Child schema name as the string value (e.g. `"Address"`).

### SchemaAccessLevel
| Value     | Int | Meaning |
|-----------|-----|---------|
| Inherited | 0   | Inherits from parent schema (use for field-level overrides to reset to schema default) |
| User      | 1   | Valid Bearer token required (logged-in users only) |
| Public    | 2   | No auth required — anyone can access |
| Custom    | 3   | Rule-based policy evaluated per request |

### PolicyOperation (integer)
| Int | Meaning |
|-----|---------|
| 0   | READ — GraphQL queries |
| 1   | WRITE — create mutations |
| 2   | EDIT — update mutations |
| 3   | DELETE — delete mutations |

### PolicyType (integer)
| Int | Meaning |
|-----|---------|
| 0   | Schema-level — applies to the whole schema |
| 1   | Field-level — applies to specific fields (`fieldNames` must be populated) |

### ConditionSource — leftSource / rightSource (integer)
| Int | Meaning |
|-----|---------|
| 0   | AUTH — JWT token claim (e.g. `userId`, `roles`, `email`, `tenantId`) |
| 1   | SCHEMA_FIELD — a field value from the record being accessed |
| 2   | STATIC_VALUE — hardcoded literal; put value in `staticValue`, set `rightOperand: ""` |

### PolicyLogicalOperator (integer)
| Int | Meaning |
|-----|---------|
| 0   | AND — all rules must pass |
| 1   | OR — any rule must pass |

### PolicyOperator — operator (integer)
| Int | Meaning |
|-----|---------|
| 0   | EQUAL |
| 1   | NOT_EQUAL |
| 2   | GREATER_THAN |
| 3   | GREATER_THAN_OR_EQUAL |
| 4   | LESS_THAN |
| 5   | LESS_THAN_OR_EQUAL |
| 6   | CONTAIN |
| 7   | NOT_CONTAIN |
| 8   | IN |
| 9   | NOT_IN |
| 10  | START_WITH |
| 11  | END_WITH |
| 12  | IS_NULL |
| 13  | IS_NOT_NULL |
| 14  | REGEX |

### ValidationType (for field validation rules)
Only `"Regex"` is supported. No other validation types are available.
Regex is checked on every create and update mutation. See `references/regex-patterns.md` for common patterns.

---

## Response Envelope

All responses wrap data in this envelope:
```json
{
  "isSuccess": true,
  "message": "...",
  "httpStatusCode": 200,
  "data": { ... },
  "errors": []
}
```

ActionResponse (for create/update/delete):
```json
{
  "data": {
    "acknowledged": true,
    "itemId": "<created-or-affected-id>",
    "totalImpactedData": 1,
    "message": null
  }
}
```

---

## Error Handling

| HTTP | Meaning | Common cause |
|------|---------|--------------|
| 400  | Bad Request | Missing required fields, invalid enum value |
| 401  | Unauthorized | Missing/invalid `Authorization` or `x-blocks-key` header |
| 404  | Not Found | Schema/validation ID not found |
| 500  | Server Error | Gateway not running; try ping → pipeline |

---

## Reference Files

| File | When to read |
|------|-------------|
| `references/configure-apis.md` | Exact request bodies for all configure-side APIs |
| `references/consume-graphql.md` | GraphQL gateway usage, query/mutation patterns, introspection |
| `references/regex-patterns.md` | Regex library for field validation |
| `references/access-control.md` | Access control decision guide and custom policy rule syntax |
