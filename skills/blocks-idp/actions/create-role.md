# Action: create-role

## Purpose

Create a new role in the system.

---

## Endpoint

```
POST $API_BASE_URL/idp/v1/Iam/CreateRole
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Iam/CreateRole" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "name": "role-name",
    "description": "Role description",
    "slug": "role-slug",
    "projectKey": "'$X_BLOCKS_KEY'"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes | Human-readable role name |
| description | string | no | |
| slug | string | yes | Unique identifier, kebab-case |
| projectKey | string | yes | Use $X_BLOCKS_KEY |

---

## On Success (200)

Role created. Returns role ID.

---

## On Failure

* 400 — duplicate slug or invalid fields
* 401 — run refresh-token then retry
