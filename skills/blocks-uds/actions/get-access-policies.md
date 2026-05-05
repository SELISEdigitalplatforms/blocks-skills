# Action: get-access-policies

## Purpose

Retrieves all access policies for a specific schema.

---

## Endpoint

```
GET $API_BASE_URL/uds/v1/data-access/policy/get?schemaName=$SCHEMA_NAME&projectKey=$X_BLOCKS_KEY
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/data-access/policy/get?schemaName=$SCHEMA_NAME&projectKey=$X_BLOCKS_KEY" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

---

## Request Body / Query Parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| schemaName | string | yes | Schema display name |
| projectKey | string | yes | Use $X_BLOCKS_KEY |

---

## On Success (200)

```json
{
  "isSuccess": true,
  "message": "string",
  "httpStatusCode": 200,
  "data": [
    {
      "itemId": "policy-id-1",
      "policyName": "admin-full-access",
      "policyType": 0,
      "operation": 4,
      "schemaName": "Product",
      "schemaId": "schema-id",
      "ruleGroup": { "logicalOperator": 1, "rules": [], "nestedGroups": [] },
      "priority": 1,
      "isAllowPolicy": true
    }
  ],
  "errors": []
}
```

---

## On Failure

| Status | Cause | Action |
|--------|-------|--------|
| 401 | Invalid token | Verify ACCESS_TOKEN is valid and not expired |
| 403 | Missing cloudadmin role | Ensure user has cloudadmin permissions |
