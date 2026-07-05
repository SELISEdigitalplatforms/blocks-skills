# Configure schema security and access policies

Use when the user asks to change who can read/write/edit/delete a schema or specific fields — e.g. "make Product public-readable", "only the record owner can edit". Preconditions: Bearer token, your Blocks Key (**`projectKey` = your Blocks Key**, the `X_BLOCKS_KEY` value), and an existing schema (see [define-schema.md](define-schema.md)). Don't run this flow unsolicited — schema creation alone doesn't need it.

Enum caveat: every enum below is an unnamed int enum in the v4 swagger. The mappings shown are from legacy v1 documentation and are **unverified in v4** — the only v4-corroborated names are the **Public / User / Custom** buckets in `GET /api/schemas/aggregation`. Verify a mapping once against the OS portal before scripting bulk changes.

| Enum (contracts.md) | v4 values | Legacy mapping (unverified) |
|---|---|---|
| `SchemaAccessLevel` | `0\|1\|2\|3` | 0=Inherited, 1=User (logged-in), 2=Public, 3=Custom |
| `PolicyOperation` | `0\|1\|2\|3\|4` | 0=Read, 1=Write, 2=Edit, 3=Delete — value 4 is new in v4, meaning unknown |
| `PolicyType` | `0\|1` | 0=schema-level, 1=field-level |
| `PolicyLogicalOperator` | `0\|1` | 0=AND, 1=OR |
| `ConditionSource` | `0\|1\|2` | 0=auth/JWT claim, 1=schema field, 2=static value |
| `PolicyOperator` | `0..14` | 0=eq, 1=neq, 2=gt, 3=gte, 4=lt, 5=lte, 6=contains, 7=not-contains, 8=in, 9=not-in, 10=starts-with, 11=ends-with, 12=is-null, 13=is-not-null, 14=regex |

## Steps

1. `GET /api/schemas?ProjectKey=$X_BLOCKS_KEY&SchemaName=<name>` — get the schema. Keep `data.items[0].id` (schemaId), `schemaName`, and the current `readAccessLevel` / `writeAccessLevel` / `editAccessLevel` / `deleteAccessLevel` ([endpoints.md#schema](../endpoints.md#schema)).

2. `POST /api/data-access/security/change` — set the access level, **one call per operation** (read, write, edit, delete are configured independently).
   ```json
   {
     "projectKey": "$X_BLOCKS_KEY",
     "schemaId": "<schemaId>",
     "operation": 0,
     "policyType": 0,
     "fieldNames": ["Product"],
     "accessLevel": 2
   }
   ```
   - Schema-level: `policyType: 0` with `fieldNames: ["<SchemaName>"]`. Field-level override: `policyType: 1` with `fieldNames: ["<fieldName>"]` (legacy convention — unverified in v4; if the call succeeds but nothing changes, compare with what the OS portal sends).
   - Response is the standard envelope with `ActionResponse` in `data`.

3. Only if the access level is Custom: `POST /api/data-access/policy/create` — define the rule-based policy ([endpoints.md#dataaccess](../endpoints.md#dataaccess)).
   ```json
   {
     "policyName": "OwnerCanEdit",
     "policyDescription": "Only the creator may edit",
     "policyType": 0,
     "operation": 2,
     "schemaName": "Product",
     "schemaId": "<schemaId>",
     "fieldNames": ["Product"],
     "projectKey": "$X_BLOCKS_KEY",
     "priority": 1,
     "isAllowPolicy": true,
     "ruleGroup": {
       "logicalOperator": 0,
       "rules": [
         {
           "leftSource": 0, "leftOperand": "userId",
           "operator": 0,
           "rightSource": 1, "rightOperand": "CreatedBy",
           "staticValue": null,
           "description": "token.userId == record.CreatedBy"
         }
       ],
       "nestedGroups": []
     }
   }
   ```
   - For a static comparison, set `rightSource: 2` and put the literal in `staticValue`.
   - Combine role checks with `nestedGroups` and `logicalOperator: 1` (OR, per legacy mapping).
   - **Response 200 has no schema in swagger** — inspect the live response; expect at minimum a success indicator, and re-fetch policies (step 4) to get the policy's `itemId`.

4. `GET /api/data-access/policy/get?schemaName=<name>&projectKey=$X_BLOCKS_KEY` — list policies for the schema. **Response not documented in swagger** — the `DataAccessPolicy` type in contracts.md is the best available shape guide (`itemId`, `policyName`, `ruleGroup`, `priority`, `isAllowPolicy`, …); verify live.
   - Update: `POST /api/data-access/policy/update` with `{ itemId, policyName?, policyDescription?, fieldNames?, projectKey, ruleGroup?, priority?, isAllowPolicy? }`.
   - Delete: `DELETE /api/data-access/policy/delete?itemId=<policyItemId>&projectKey=$X_BLOCKS_KEY`.

5. `POST /api/schema-configurations/reload` — mandatory; access changes are staged until reloaded.

Error paths: 401 → refresh via blocks-setup. 400 `ProblemDetails` on `security/change` usually means a bad enum value or missing `fieldNames`.

## Verify

- `GET /api/schemas/get-by-id?id=<schemaId>&projectKey=$X_BLOCKS_KEY` — check `readAccessLevel`/`writeAccessLevel`/`editAccessLevel`/`deleteAccessLevel`, `readPolicies`/`writePolicies`/`editPolicies`/`deletePolicies`, and the `total*Policies` counters.
- `GET /api/schemas/aggregation?ProjectKey=$X_BLOCKS_KEY` — portfolio view: counts of Public/User/Custom per operation across all schemas.
- Runtime behavior check (gateway URL unverified in v4 — see SKILL.md): a Public read should succeed without a Bearer token; a User-level read should 401 without one.
