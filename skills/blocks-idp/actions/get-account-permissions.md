# Action: get-account-permissions

## Purpose

Get all permissions assigned to the currently authenticated account (directly or via roles).

---

## Endpoint

```
GET $API_BASE_URL/idp/v1/Iam/GetAccountPermissions
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Iam/GetAccountPermissions" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

---

## Request Body

None.

---

## On Success (200)

Returns list of effective permissions for the current account.

---

## On Failure

* 401 — run refresh-token then retry
