# Action: create-permission

## Purpose

Create a new permission definition.

---

## Endpoint

```
POST $API_BASE_URL/idp/v1/Iam/CreatePermission
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Iam/CreatePermission" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "name": "permission-name",
    "description": "string",
    "resource": "resource-name",
    "resourceGroup": "resource-group",
    "type": "string",
    "tags": [],
    "dependentPermissions": [],
    "isBuiltIn": false,
    "projectKey": "'$X_BLOCKS_KEY'"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes | |
| description | string | no | |
| resource | string | yes | Resource this permission applies to |
| resourceGroup | string | yes | Group this resource belongs to |
| type | string | no | |
| tags | array | no | |
| dependentPermissions | array | no | Permission names this depends on |
| isBuiltIn | boolean | no | Default false |
| projectKey | string | yes | Use $X_BLOCKS_KEY |

---

## On Success (200)

Permission created.

---

## On Failure

* 400 — duplicate permission name
* 401 — run refresh-token then retry
