# Action: get-permission

## Purpose

Get a specific permission by ID.

---

## Endpoint

```
GET $API_BASE_URL/idp/v1/Iam/GetPermission
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Iam/GetPermission?permissionId=PERMISSION_ID" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

---

## Query Parameters

| Param | Type | Required |
|-------|------|----------|
| permissionId | string | yes |

---

## On Success (200)

Returns full permission object.

---

## On Failure

* 401 — run refresh-token then retry
* 404 — permission not found
