# Action: update-role

## Purpose

Update an existing role's details.

---

## Endpoint

```
POST $API_BASE_URL/idp/v1/Iam/UpdateRole
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Iam/UpdateRole" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "roleId": "ROLE_ID",
    "name": "updated-name",
    "description": "Updated description",
    "projectKey": "'$X_BLOCKS_KEY'"
  }'
```

---

## Request Body

| Field | Type | Required |
|-------|------|----------|
| roleId | string | yes |
| name | string | no |
| description | string | no |
| projectKey | string | yes |

---

## On Success (200)

Role updated.

---

## On Failure

* 401 — run refresh-token then retry
* 404 — role not found
