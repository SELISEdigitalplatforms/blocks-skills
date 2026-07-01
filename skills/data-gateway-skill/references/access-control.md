# Access Control Reference — Data Gateway (UDS)

---

## Decision Guide

```
Should unauthenticated users (no token) be able to do this?
  YES → Public (accessLevel: 2)
  NO ↓

Is any valid logged-in user allowed, regardless of role?
  YES → User (accessLevel: 1)
  NO ↓

Does access depend on role, record ownership, or other token claims?
  → Custom (accessLevel: 3) + create a policy rule
```

---

## Access Levels

| Int | Name      | Meaning                                                          |
| --- | --------- | ---------------------------------------------------------------- |
| 0   | Inherited | Takes access from parent schema (for field-level overrides only) |
| 1   | User      | Requires valid Bearer token — any logged-in user passes          |
| 2   | Public    | No auth required                                                 |
| 3   | Custom    | Policy rules evaluated per request — must also create a policy   |

---

## Policy Types

| String | Name                  | Use when                                                        |
| ------ | --------------------- | --------------------------------------------------------------- |
| "RLS"  | Row-Level Security    | Restricting which **records** a user can read/write/edit/delete |
| "CLS"  | Column-Level Security | Restricting which **fields** a user can see or write            |

---

## Operations (integer values)

| Int | Meaning                   |
| --- | ------------------------- |
| 0   | READ — GraphQL queries    |
| 1   | WRITE — create mutations  |
| 2   | EDIT — update mutations   |
| 3   | DELETE — delete mutations |

## PolicyType (integer values)

| Int | Meaning                                                    |
| --- | ---------------------------------------------------------- |
| 0   | Schema-level — whole schema                                |
| 1   | Field-level — specific fields only (populate `fieldNames`) |

---

## `fieldNames` Rules — CRITICAL

`fieldNames` must **always have at least one item** — never send an empty array.

| policyType       | What to put in fieldNames                               |
| ---------------- | ------------------------------------------------------- |
| 0 (Schema-level) | The **schema name** as a single item e.g. `["Product"]` |
| 1 (Field-level)  | The **field name(s)** to override e.g. `["costPrice"]`  |

For policy/rule creation: always put the **schema name** as the single item.

---

## Setting Access — Typical Full Schema Setup

Call `POST /uds/v1/data-access/security/change` once per operation:

**Example: Public read, User write/edit, Admin-only delete (schema = "Product")**

```
Call 1: operation=0, policyType=0, fieldNames=["Product"], accessLevel=2  (READ → Public)
Call 2: operation=1, policyType=0, fieldNames=["Product"], accessLevel=1  (WRITE → User)
Call 3: operation=2, policyType=0, fieldNames=["Product"], accessLevel=1  (EDIT → User)
Call 4: operation=3, policyType=0, fieldNames=["Product"], accessLevel=3  (DELETE → Custom)
```

After Call 4, create an admin-only policy via `POST /uds/v1/data-access/policy/create`.

---

## Field-Level Override

Only configure field-level when a field needs DIFFERENT access than the schema default.
Use `policyType: 1`. Call once per field if each needs a different level.

```json
{
  "projectKey": "<projectKey>",
  "schemaId": "<schema-id>",
  "operation": 0,
  "policyType": 1,
  "fieldNames": ["costPrice"],
  "accessLevel": 1
}
```

To reset a field back to inheriting from schema: `accessLevel: 0`.

Common scenarios:
| Scenario | Schema accessLevel | Field override |
|----------|-------------------|----------------|
| Hide cost from public | 2 (Public) | `["costPrice"]` READ → 1 (User) |
| Show avatar publicly on private profile | 1 (User) | `["avatarUrl"]` READ → 2 (Public) |
| Admin-only internal notes | 1 (User) | `["internalNotes"]` READ → 3 (Custom) |

---

## Custom Policy Examples

### Role contains "admin" (static value check)

```json
{
  "policyName": "admin can delete",
  "policyDescription": "Generated from Rule Builder",
  "policyType": 0,
  "operation": 3,
  "schemaName": "Product",
  "schemaId": "<schema-id>",
  "fieldNames": [],
  "isAllowPolicy": true,
  "priority": 1,
  "projectKey": "<projectKey>",
  "ruleGroup": {
    "logicalOperator": 0,
    "rules": [
      {
        "leftSource": 0,
        "leftOperand": "roles",
        "operator": 6,
        "rightSource": 2,
        "rightOperand": "",
        "staticValue": "admin"
      }
    ],
    "nestedGroups": []
  }
}
```

### Owner can edit their own records (token userId == record CreatedBy)

```json
{
  "policyName": "owner can edit",
  "policyDescription": "Generated from Rule Builder",
  "policyType": 0,
  "operation": 2,
  "schemaName": "Product",
  "schemaId": "<schema-id>",
  "fieldNames": [],
  "isAllowPolicy": true,
  "priority": 1,
  "projectKey": "<projectKey>",
  "ruleGroup": {
    "logicalOperator": 0,
    "rules": [
      {
        "leftSource": 0,
        "leftOperand": "userId",
        "operator": 0,
        "rightSource": 1,
        "rightOperand": "CreatedBy",
        "staticValue": null
      }
    ],
    "nestedGroups": []
  }
}
```

### Admin OR tournament_manager can write (nested OR groups)

```json
{
  "policyName": "admin or manager can write",
  "policyDescription": "Generated from Rule Builder",
  "policyType": 0,
  "operation": 1,
  "schemaName": "Product",
  "schemaId": "<schema-id>",
  "fieldNames": [],
  "isAllowPolicy": true,
  "priority": 1,
  "projectKey": "<projectKey>",
  "ruleGroup": {
    "logicalOperator": 1,
    "rules": [],
    "nestedGroups": [
      {
        "logicalOperator": 0,
        "rules": [
          {
            "leftSource": 0,
            "leftOperand": "roles",
            "operator": 6,
            "rightSource": 2,
            "rightOperand": "",
            "staticValue": "admin"
          }
        ],
        "nestedGroups": []
      },
      {
        "logicalOperator": 0,
        "rules": [
          {
            "leftSource": 0,
            "leftOperand": "roles",
            "operator": 6,
            "rightSource": 2,
            "rightOperand": "",
            "staticValue": "tournament_manager"
          }
        ],
        "nestedGroups": []
      }
    ]
  }
}
```

### Admin OR owner can edit (role check OR ownership check)

```json
{
  "policyName": "admin or owner can edit",
  "policyDescription": "Generated from Rule Builder",
  "policyType": 0,
  "operation": 2,
  "schemaName": "Product",
  "schemaId": "<schema-id>",
  "fieldNames": [],
  "isAllowPolicy": true,
  "priority": 1,
  "projectKey": "<projectKey>",
  "ruleGroup": {
    "logicalOperator": 1,
    "rules": [],
    "nestedGroups": [
      {
        "logicalOperator": 0,
        "rules": [
          {
            "leftSource": 0,
            "leftOperand": "roles",
            "operator": 6,
            "rightSource": 2,
            "rightOperand": "",
            "staticValue": "admin"
          }
        ],
        "nestedGroups": []
      },
      {
        "logicalOperator": 0,
        "rules": [
          {
            "leftSource": 0,
            "leftOperand": "userId",
            "operator": 0,
            "rightSource": 1,
            "rightOperand": "CreatedBy",
            "staticValue": null
          }
        ],
        "nestedGroups": []
      }
    ]
  }
}
```

---

## Rule Quick Reference

| Goal                   | leftSource | leftOperand | operator    | rightSource      | rightOperand  | staticValue |
| ---------------------- | ---------- | ----------- | ----------- | ---------------- | ------------- | ----------- |
| Role contains "admin"  | 0 (AUTH)   | `"roles"`   | 6 (CONTAIN) | 2 (STATIC)       | `""`          | `"admin"`   |
| userId == record field | 0 (AUTH)   | `"userId"`  | 0 (EQUAL)   | 1 (SCHEMA_FIELD) | `"CreatedBy"` | `null`      |
| email == static        | 0 (AUTH)   | `"email"`   | 0 (EQUAL)   | 2 (STATIC)       | `""`          | `"a@b.com"` |

---

## Priority

Lower `priority` number = evaluated first. First matching policy wins.

---

## isAllowPolicy

- `true` → GRANTS access if rules match
- `false` → DENIES access if rules match (explicit deny — takes precedence over allow policies)
