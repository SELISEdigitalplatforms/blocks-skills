# Flow: migrate-schema-flow

## Trigger

User wants to change an existing schema — rename a field, change a field type, add fields, or remove fields — without losing existing data.

> "rename a field in my schema"
> "change a field type from String to Number"
> "add a new field to an existing schema"
> "remove a field from my collection"
> "update my schema without losing data"

---

## Pre-flight Questions

Before starting, confirm:

1. Which schema is being changed? (name and ID — get from `get-schemas`)
2. What is the change? (add field / update field / change type / remove field)
3. Is there existing data in the collection?
4. Is this change breaking? (Type change from String → Number with existing string data causes query errors)

---

## Important Warnings

> **`save-schema-fields` REPLACES all fields.** Provide the complete updated field list in the `fields` array. Missing fields from the array are removed. Use `deletableFieldNames` to remove specific fields.

> **Type changes on fields with existing data are risky.** MongoDB is schema-flexible, but GraphQL enforces the new type. Existing documents with the old type fail to deserialize. Always plan for data migration before changing a field type.

---

## Flow Steps

### Step 1 — Read Current Schema State

Before making any changes, capture the current field definitions.

```
Action: get-schema
Input: id = $SCHEMA_ID, projectKey = $X_BLOCKS_KEY
```

Store the complete `data.fields` array. This is your rollback reference.

---

### Step 2 — Make the Change

#### Branch A — Add a new field (safe, non-breaking)

```
Action: save-schema-fields (POST /schemas/fields)
Input:
  schemaDefinitionItemId = $SCHEMA_ID
  deletableFieldNames  = []
  projectKey          = $X_BLOCKS_KEY
  fields = [
    {
      name: "<new-field-name>",
      type: "<type>",
      isArray: false,
      isPIIData: false,
      isUniqueData: false,
      description: "<description>"
    }
  ]
```

Safe on live schemas with existing data. Existing documents return `null` for the new field until populated.

---

#### Branch B — Update a field (description, constraints — not type)

Include the field in the complete field list:

```
Action: save-schema-fields (POST /schemas/fields)
Input:
  schemaDefinitionItemId = $SCHEMA_ID
  deletableFieldNames  = []
  projectKey          = $X_BLOCKS_KEY
  fields = [
    {
      name: "<existing-field>",
      type: "<same type>",
      isArray: false,
      isPIIData: false,
      isUniqueData: false,
      description: "<updated description>"
    }
  ]
```

> Do NOT change `type` on fields with existing data in a different type.

---

#### Branch C — Remove a field

Include `deletableFieldNames`:

```
Action: save-schema-fields (POST /schemas/fields)
Input:
  schemaDefinitionItemId = $SCHEMA_ID
  deletableFieldNames  = ["<field-to-remove>"]
  projectKey          = $X_BLOCKS_KEY
  fields = [
    { name: "<field-1>", ... },
    { name: "<field-2>", ... }
  ]
```

> There is no hard-delete-field API. The field remains in MongoDB but is removed from the GraphQL schema.

---

#### Branch D — Change a field type (breaking — requires data migration)

**Phase 1 — Add a new field with the target type:**

```
Action: save-schema-fields (POST /schemas/fields)
Input:
  schemaDefinitionItemId = $SCHEMA_ID
  deletableFieldNames  = []
  projectKey          = $X_BLOCKS_KEY
  fields = [
    { name: "<new-field>", type: "<target-type>", ... }
  ]
```

**Phase 2 — Migrate data via GraphQL:**

1. Call `reload-configuration`
2. Query all documents using the old field
3. For each document, run `update{SchemaName}(id: "...", input: { <new-field>: <transformed-value> })`
4. Once all migrated, use `deletableFieldNames` to remove the old field

---

### Step 3 — Check for Unadapted Changes

```
Action: get-unadapted-changes
Input: projectKey = $X_BLOCKS_KEY
```

If `data.totalImpactedData > 0` → continue to Step 4.

---

### Step 4 — Reload Configuration

```
Action: reload-configuration
Input: projectKey = $X_BLOCKS_KEY (query param)
```

Takes 2–5 seconds. Re-establish any active GraphQL connections after reload.

---

### Step 5 — Verify Change

```
Action: get-schema
Input: id = $SCHEMA_ID, projectKey = $X_BLOCKS_KEY
```

Confirm the new field appears. Run a test GraphQL query.

---

## Error Handling

| Step | Error | Cause | Action |
|------|-------|-------|--------|
| Step 2 | Fields wiped after save | Partial field list used | Restore from Step 1 snapshot + use `deletableFieldNames` |
| Step 2 | GraphQL type error after type change | Existing docs have old type | Run data migration (Branch D Phase 2) |
| Step 3 | Unadapted changes exist | reload not called after last change | Call reload-configuration |
| Step 4 | 500 on reload | DB unreachable or schema conflict | Check connection string; check for naming collisions |
| Any | 401 | Expired token | Run get-token from blocks-idp |
| Any | 403 | Missing cloudadmin role | Add cloudadmin role in Cloud Portal → People |
