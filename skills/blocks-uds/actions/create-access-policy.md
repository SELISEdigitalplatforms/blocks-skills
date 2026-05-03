# Action: create-access-policy

## Purpose

Creates a data access policy defining which roles can perform which operations on a schema. Used with accessLevel 2 (Custom) security.

---

## Endpoint

```
POST $API_BASE_URL/uds/v1/data-access/policy/create
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/data-access/policy/create" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "policyName": "admin-full-access",
    "policyDescription": "Full access for admins",
    "policyType": 0,
    "operation": 4,
    "schemaName": "$SCHEMA_NAME",
    "schemaId": "$SCHEMA_ID",
    "fieldNames": [],
    "projectKey": "$X_BLOCKS_KEY",
    "ruleGroup": {
      "logicalOperator": 1,
      "rules": [
        {
          "leftSource": 1,
          "leftOperand": "role",
          "operator": 0,
          "rightSource": 0,
          "rightOperand": "admin",
          "staticValue": null,
          "description": "Admin role"
        }
      ],
      "nestedGroups": []
    },
    "priority": 1,
    "isAllowPolicy": true
  }'
```

---

## Request Body / Query Parameters

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| policyName | string | yes | Unique name per schema |
| policyDescription | string | no | Description of policy purpose |
| policyType | integer | yes | 0=RoleBased, 1=ClaimBased |
| operation | integer | yes | 0=Read, 1=Create, 2=Update, 3=Delete, 4=All |
| schemaName | string | yes | Schema display name |
| schemaId | string | no | Schema ID (alternative to schemaName) |
| fieldNames | array | no | Apply to specific fields (empty = all) |
| projectKey | string | yes | Use $X_BLOCKS_KEY |
| ruleGroup | object | no | PolicyRuleGroup structure |
| priority | integer | no | Lower = higher priority. Default: 0 |
| isAllowPolicy | boolean | yes | true=allow, false=deny |

---

## ruleGroup Sub-structure

| Field | Type | Notes |
|-------|------|-------|
| logicalOperator | integer | 0=And, 1=Or |
| rules | array | PolicyRule[] |
| nestedGroups | array | Nested PolicyRuleGroup[] |

### PolicyRule

| Field | Type | Notes |
|-------|------|-------|
| leftSource | integer | 0=Static, 1=Context, 2=Field |
| leftOperand | string | Field to evaluate (e.g. "role") |
| operator | integer | 0=Equals, 1=NotEquals, 2=Contains, 3=In, ... |
| rightSource | integer | 0=Static, 1=Context, 2=Field |
| rightOperand | string | Comparison value |
| staticValue | any | Value if rightSource=0 |
| description | string | Human-readable description |

---

## On Success (200)

```json
{
  "isSuccess": true,
  "message": "Access policy created successfully",
  "httpStatusCode": 200,
  "data": {
    "acknowledged": true,
    "itemId": "policy-id-abc123",
    "totalImpactedData": 0,
    "message": "string"
  },
  "errors": []
}
```

Store `data.data.itemId` to update or delete later.

---

## On Failure

| Status | Cause | Action |
|--------|-------|--------|
| 400 | Duplicate policyName, missing fields, invalid operation | Check request body completeness |
| 401 | Invalid token | Verify ACCESS_TOKEN is valid and not expired |
| 403 | Missing cloudadmin role | Ensure user has cloudadmin permissions |
