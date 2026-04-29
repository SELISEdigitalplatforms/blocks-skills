# Action: get-user-codes

## Purpose

List all user codes for the current user.

---

## Endpoint

```
GET $API_BASE_URL/idp/v1/Authentication/GetUserCodes
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Authentication/GetUserCodes" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

---

## Request Body

None.

---

## On Success (200)

Returns array of user code objects.

---

## On Failure

* 401 — run refresh-token then retry
