# Action: get-user-permissions

## Purpose

Get all permissions assigned to a specific user (directly or via roles).

---

## Endpoint

```
GET $API_BASE_URL/idp/v1/Iam/GetUserPermissions
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Iam/GetUserPermissions?userId=USER_ID" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

---

## Query Parameters

| Param | Type | Required |
|-------|------|----------|
| userId | string | yes |

---

## On Success (200)

Returns list of permission objects.

---

## On Failure

* 401 — run refresh-token then retry
