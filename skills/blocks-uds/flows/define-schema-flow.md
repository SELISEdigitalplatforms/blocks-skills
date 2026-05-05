# Flow: define-schema-flow

## Trigger

User wants to create a new data schema, define a collection, or set up a data model.

> "create a data schema"
> "define a collection"
> "set up a data model"
> "I need a Product schema with fields"
> "create a users table / collection"

---

## Pre-flight Questions

Before starting, confirm:

1. What is the schema name? (e.g. `Product`, `Order`, `User`)
2. What is the MongoDB collection name? (lowercase, no spaces — e.g. `products`, `orders`, `users`)
3. Is this an Entity (multiple documents, `schemaType: 1`) or a Dto (single config object, `schemaType: 2`)?
4. What fields does the schema need? For each: name, type (`String`, `Number`, `Boolean`, `Date`, `ObjectId`, `Object`, `Array`), isArray?
5. Does a database connection already exist? (If unsure, call `get-data-source`)
6. What security model? `accessLevel: 0` (Public), `accessLevel: 1` (User), or `accessLevel: 2` (Custom/RoleBased)?
7. If `accessLevel: 2` (Custom): which roles need access, and what operations (0=Read, 1=Create, 2=Update, 3=Delete, 4=All)?
8. Are there any validation rules? (e.g. required fields, email format, min/max length, unique)

---

## Flow Steps

### Step 1 — Verify Data Source

```
Action: get-data-source
Input: (no parameters — project identified from auth context)
```

**Branch:**
- If 200 with active connection → data source exists → skip to Step 2
- If 404 → no data source registered → continue to Step 1a

#### Step 1a — Add Data Source (only if not already set up)

```
Action: add-data-source
Input:
  itemId           = "$PROJECT_SLUG-db"
  connectionString = "<mongodb+srv connection string>"
  databaseName     = "<database name>"
  projectKey       = $X_BLOCKS_KEY
```

On success → continue to Step 1b.

#### Step 1b — Reload Configuration (after adding data source)

```
Action: reload-configuration
Input: projectKey = $X_BLOCKS_KEY (query param)
```

On success → continue to Step 2.

---

### Step 2 — Define Schema

```
Action: define-schema
Input:
  collectionName = "<collection-name>"
  schemaName     = "<schemaName>"
  projectKey     = $X_BLOCKS_KEY
  schemaType     = 1  (1=Entity, 2=Dto)
  description    = "<optional description>"
  fields = [
    {
      name: "<field-name>",
      type: "String | Number | Boolean | Date | ObjectId | Object | Array",
      isArray: false,
      isPIIData: false,
      isUniqueData: false,
      description: "<field description>"
    }
  ]
```

> **CRITICAL:** The `projectKey` in the body must be `$X_BLOCKS_KEY`, NOT `$PROJECT_SLUG`. Using `$PROJECT_SLUG` causes `Fields_Are_Required` errors even with all fields provided.

> Default non-editable fields: `ItemId` (String), `CreatedAt` (Date), `UpdatedAt` (Date).

On success → store `data.data.itemId` as `$SCHEMA_ID`. Continue to Step 3.

---

### Step 3 — Save Schema Fields

> **DESTRUCTIVE WARNING:** `save-schema-fields` REPLACES all fields on the schema. Provide the complete field list including all existing fields. To remove specific fields, use `deletableFieldNames`.

```
Action: save-schema-fields (POST /schemas/fields)
Input:
  schemaDefinitionItemId = $SCHEMA_ID
  deletableFieldNames     = []
  projectKey              = $X_BLOCKS_KEY
  fields = [
    {
      name: "<field-name>",
      type: "<type>",
      isArray: false,
      isPIIData: false,
      isUniqueData: false,
      description: "<description>"
    }
  ]
```

On success → continue to Step 4.

---

### Step 4 — Add Validation Rules (optional)

If the user specified validation rules, call `create-validation` for each field.

```
Action: create-validation
Input:
  projectKey  = $X_BLOCKS_KEY
  schemaId    = $SCHEMA_ID
  fieldName   = "<field-name>"
  validations = [
    {
      type: <integer>,    (0=Required, 1=Email, 2=Min, 3=Max, 4=MinLength, 5=MaxLength, 6=Regex, 7=Unique)
      value: null,
      secondaryValue: null,
      errorMessage: "<error message>",
      isActive: true
    }
  ]
```

Repeat for each field requiring validation. Then continue to Step 5.

If no validation rules needed → skip to Step 5.

---

### Step 5 — Configure Security

```
Action: change-security
Input:
  projectKey  = $X_BLOCKS_KEY
  schemaId    = $SCHEMA_ID
  accessLevel = 0 | 1 | 2  (0=Public, 1=User, 2=Custom)
  operation   = 0
  policyType  = 0
  fieldNames  = []
```

**Branch:**
- If accessLevel is `0` (Public) or `1` (User) → skip to Step 7
- If accessLevel is `2` (Custom) → continue to Step 6

---

### Step 6 — Create Access Policies (only if accessLevel=2/Custom)

> **WARNING:** Without policies, ALL access is denied including cloudadmin.

For each role/operation combination:

```
Action: create-access-policy
Input:
  policyName        = "<policy-name>"
  policyDescription = "<optional description>"
  policyType       = 0  (0=RoleBased, 1=ClaimBased)
  operation        = 0 | 1 | 2 | 3 | 4  (0=Read, 1=Create, 2=Update, 3=Delete, 4=All)
  schemaName       = "<schemaName>"
  schemaId         = $SCHEMA_ID
  fieldNames       = []
  projectKey       = $X_BLOCKS_KEY
  ruleGroup = {
    logicalOperator: 1,  (1=Or)
    rules: [
      {
        leftSource: 1,       (1=Context — user role)
        leftOperand: "role",
        operator: 0,        (0=Equals)
        rightSource: 0,      (0=Static)
        rightOperand: "<role-slug>",
        staticValue: null,
        description: "<role-slug> role"
      }
    ],
    nestedGroups: []
  }
  priority      = 1
  isAllowPolicy = true
```

Repeat for each distinct policy. Then continue to Step 7.

---

### Step 7 — Reload Configuration

```
Action: reload-configuration
Input: projectKey = $X_BLOCKS_KEY (query param)
```

On success → schema is live and accessible through GraphQL at `POST /uds/v1/$PROJECT_SLUG/gateway`.

---

## Error Handling

| Step | Error | Cause | Action |
|------|-------|-------|--------|
| Step 1b | 500 on reload | DB connection failed | Check connectionString in add-data-source |
| Step 2 | 400 Fields_Are_Required | projectKey uses $PROJECT_SLUG | Use $X_BLOCKS_KEY in body |
| Step 2 | 400 Fields_Are_Required | Empty fields array | Include at least one field |
| Step 2 | 400 duplicate | collectionName already exists | Choose a different collection name |
| Step 3 | 400 | Invalid field type | Use only: String, Number, Boolean, Date, ObjectId, Object, Array |
| Step 4 | 400 invalid type | Wrong ValidationType integer | Use 0=Required, 1=Email, 2=Min, 3=Max, 4=MinLength, 5=MaxLength, 6=Regex, 7=Unique |
| Step 5 | 400 schema not found | Wrong schemaId | Verify schemaId from define-schema response |
| Step 6 | 400 duplicate | policyName already exists | Use unique policy names per schema |
| Step 7 | 500 MongoDB unreachable | Connection string invalid | Verify connectionString and database name |
| Any | 401 | Expired token | Run get-token from blocks-idp |
| Any | 403 | Missing cloudadmin role | Add cloudadmin role in Cloud Portal → People |
