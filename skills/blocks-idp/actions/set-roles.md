# Action: set-roles

## Purpose

Assign one or more roles to a user. Replaces existing role assignments.

---

## Endpoint

```
POST $API_BASE_URL/idp/v1/Iam/SetRoles
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Iam/SetRoles" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "userId": "USER_ID",
    "roles": ["role-slug-1", "role-slug-2"],
    "projectKey": "'$X_BLOCKS_KEY'"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| userId | string | yes | Target user ID |
| roles | array | yes | Array of role slugs to assign |
| projectKey | string | yes | Use $X_BLOCKS_KEY |

---

## On Success (200)

Roles assigned to user.

---

## On Failure

* 400 — invalid role slugs
* 401 — run refresh-token then retry
