# Action: save-roles-and-permissions

## Purpose

Bulk assign roles and permissions together in a single operation.

---

## Endpoint

```
POST $API_BASE_URL/idp/v1/Iam/SaveRolesAndPermissions
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Iam/SaveRolesAndPermissions" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "roleId": "ROLE_ID",
    "permissions": ["permission-name-1", "permission-name-2"],
    "projectKey": "'$X_BLOCKS_KEY'"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| roleId | string | yes | Role to assign permissions to |
| permissions | array | yes | Array of permission names |
| projectKey | string | yes | Use $X_BLOCKS_KEY |

---

## On Success (200)

Roles and permissions saved.

---

## On Failure

* 401 — run refresh-token then retry
