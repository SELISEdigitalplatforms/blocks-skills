# Flow: configure-access-policy-flow

## Trigger

User wants to set up data access control, restrict schema access, or add role-based access control (RBAC) to their data.

> "set up data access control"
> "restrict schema access"
> "add RBAC to data"
> "only admins should be able to delete products"
> "make the user schema private"
> "configure who can read and write my schemas"

---

## Pre-flight Questions

Before starting, confirm:

1. Which schema should access control be applied to? (schema name and ID from `get-schemas`)
2. What security type? `accessLevel: 0` (Public/open), `accessLevel: 1` (User/authenticated only), or `accessLevel: 2` (Custom/fine-grained by role)?
3. If `accessLevel: 2` (Custom):
   - Which roles need access? (provide role slugs — e.g. `admin`, `editor`, `viewer`)
   - For each role: which operations? (`0`=Read, `1`=Create, `2`=Update, `3`=Delete, `4`=All)
4. Are there existing access policies on this schema that should be reviewed first? (Call `get-access-policies`)

---

## Flow Steps

### Step 1 — Review Existing Policies (optional but recommended)

Before changing anything, check what policies currently exist.

```
Action: get-access-policies
Input:
  schemaName = "<schemaName>"
  projectKey = $X_BLOCKS_KEY
```

**Branch:**
- If response has existing policies → review with user. Confirm whether to keep, update, or replace.
- If empty → no existing policies → proceed to Step 2.

---

### Step 2 — Set Security Type

```
Action: change-security
Input:
  projectKey  = $X_BLOCKS_KEY
  schemaId    = $SCHEMA_ID
  accessLevel = 0 | 1 | 2  (0=Public, 1=User, 2=Custom)
  operation  = 0
  policyType = 0
  fieldNames = []
```

**Branch:**
- If accessLevel is `0` (Public) → access is open → flow complete (no policies needed)
- If accessLevel is `1` (User) → authenticated users only → flow complete (no policies needed)
- If accessLevel is `2` (Custom) → continue to Step 3

---

### Step 3 — Create Access Policies (only for accessLevel=2/Custom)

For each distinct role group and operation set, create a policy.

**Admin — full access:**
```
Action: create-access-policy
Input:
  policyName        = "admin-full-access"
  policyDescription = "Full access for admins"
  policyType       = 0  (0=RoleBased)
  operation        = 4  (4=All operations)
  schemaName        = "<schemaName>"
  schemaId          = $SCHEMA_ID
  fieldNames        = []
  projectKey        = $X_BLOCKS_KEY
  ruleGroup = {
    logicalOperator: 1,  (1=Or)
    rules: [
      {
        leftSource: 1,       (1=Context — user role)
        leftOperand: "role",
        operator: 0,        (0=Equals)
        rightSource: 0,    (0=Static)
        rightOperand: "admin",
        staticValue: null,
        description: "Admin role"
      }
    ],
    nestedGroups: []
  }
  priority      = 1
  isAllowPolicy = true
```

**Viewer — read only:**
```
Action: create-access-policy
Input:
  policyName        = "viewer-read-only"
  policyDescription = "Read-only for viewers"
  policyType       = 0
  operation        = 0  (0=Read)
  schemaName        = "<schemaName>"
  schemaId          = $SCHEMA_ID
  fieldNames        = []
  projectKey        = $X_BLOCKS_KEY
  ruleGroup = {
    logicalOperator: 1,
    rules: [
      {
        leftSource: 1,
        leftOperand: "role",
        operator: 0,
        rightSource: 0,
        rightOperand: "viewer",
        staticValue: null,
        description: "Viewer role"
      }
    ],
    nestedGroups: []
  }
  priority      = 2
  isAllowPolicy = true
```

Repeat for each distinct role/operation combination.

---

### Step 4 — Verify Policies

```
Action: get-access-policies
Input:
  schemaName = "<schemaName>"
  projectKey = $X_BLOCKS_KEY
```

Review the response:
- Confirm `priority` and `isAllowPolicy` match what was requested
- If any policy is wrong → call `update-access-policy` with the policy's `itemId`
- If a policy should be removed → call `delete-access-policy` with the policy's `itemId`

---

## Important Notes

### Custom without policies = no access

If you set `accessLevel` to `2` (Custom) but create no policies, ALL roles (including `cloudadmin`) will be denied access through the data API. Always create at least one policy immediately after setting Custom.

### Role slugs must match IDP roles

The `rightOperand` values in `ruleGroup.rules` must exactly match the role slugs defined in the Identity & Access (blocks-idp) skill. Use `get-roles` from blocks-idp to list available roles.

### Security changes take effect immediately

Unlike schema field changes, security and policy changes do NOT require `reload-configuration`. They are applied immediately.

---

## Error Handling

| Step | Error | Cause | Action |
|------|-------|-------|--------|
| Step 1 | 404 schema not found | Wrong schemaName | Verify schemaName from get-schemas |
| Step 2 | 400 invalid accessLevel | Non-integer value | Use 0, 1, or 2 (integer) |
| Step 2 | 400 schema not found | Wrong schemaId | Use schemaId from define-schema |
| Step 3 | 400 duplicate policyName | Name already exists for this schema | Use unique policy names |
| Step 4 | policies missing | create-access-policy silently failed | Re-run create-access-policy |
| Any | 401 | Expired token | Run get-token from blocks-idp |
| Any | 403 | Missing cloudadmin role | Add cloudadmin role in Cloud Portal → People |
