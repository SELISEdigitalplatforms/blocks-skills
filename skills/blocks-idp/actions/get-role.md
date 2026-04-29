# Action: get-role

## Purpose

Get a specific role by ID.

---

## Endpoint

```
GET $API_BASE_URL/idp/v1/Iam/GetRole
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Iam/GetRole?roleId=ROLE_ID" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

---

## Query Parameters

| Param | Type | Required |
|-------|------|----------|
| roleId | string | yes |

---

## On Success (200)

Returns full role object including assigned permissions.

---

## On Failure

* 401 — run refresh-token then retry
* 404 — role not found
