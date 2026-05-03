# Action: update-access-policy

## Purpose

Updates an existing data access policy. Use the policy's itemId to identify which policy to update.

---

## Endpoint

```
POST $API_BASE_URL/uds/v1/data-access/policy/update
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/data-access/policy/update" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "itemId": "$POLICY_ITEM_ID",
    "policyName": "admin-full-access",
    "policyDescription": "Updated description",
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
| itemId | string | yes | Policy ID from create-access-policy |
| policyName | string | no | Unique name |
| policyDescription | string | no | Description |
| fieldNames | array | no | Specific fields |
| projectKey | string | yes | Use $X_BLOCKS_KEY |
| ruleGroup | object | no | PolicyRuleGroup |
| priority | integer | no | Lower = higher priority |
| isAllowPolicy | boolean | no | true=allow, false=deny |

---

## On Success (200)

```json
{
  "isSuccess": true,
  "message": "Access policy updated successfully",
  "httpStatusCode": 200,
  "data": {
    "acknowledged": true,
    "itemId": "$POLICY_ITEM_ID",
    "totalImpactedData": 0,
    "message": "string"
  },
  "errors": []
}
```

---

## On Failure

| Status | Cause | Action |
|--------|-------|--------|
| 400 | Missing itemId, invalid fields | Ensure itemId is provided and fields are valid |
| 401 | Invalid token | Verify ACCESS_TOKEN is valid and not expired |
| 403 | Missing cloudadmin role | Ensure user has cloudadmin permissions |
