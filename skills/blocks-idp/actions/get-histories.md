# Action: get-histories

## Purpose

Get the audit history/activity log for the current user.

---

## Endpoint

```
GET $API_BASE_URL/idp/v1/Iam/GetHistories
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Iam/GetHistories" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

---

## Request Body

None.

---

## On Success (200)

Returns list of historical events (logins, password changes, role updates, etc.).

---

## On Failure

* 401 — run refresh-token then retry
