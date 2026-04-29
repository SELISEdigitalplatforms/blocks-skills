# Action: update-permission

## Purpose

Update an existing permission's definition.

---

## Endpoint

```
POST $API_BASE_URL/idp/v1/Iam/UpdatePermission
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Iam/UpdatePermission" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "permissionId": "PERMISSION_ID",
    "name": "updated-name",
    "description": "updated description",
    "projectKey": "'$X_BLOCKS_KEY'"
  }'
```

---

## Request Body

| Field | Type | Required |
|-------|------|----------|
| permissionId | string | yes |
| name | string | no |
| description | string | no |
| projectKey | string | yes |

---

## On Success (200)

Permission updated.

---

## On Failure

* 401 — run refresh-token then retry
* 404 — permission not found
