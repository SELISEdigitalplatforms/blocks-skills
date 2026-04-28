# Action: get-account-roles

## Purpose

Get all roles assigned to the currently authenticated account.

---

## Endpoint

```
GET $API_BASE_URL/idp/v1/Iam/GetAccountRoles
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Iam/GetAccountRoles" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

---

## Request Body

None.

---

## On Success (200)

Returns list of roles assigned to the current account.

---

## On Failure

* 401 — run refresh-token then retry
