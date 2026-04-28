# Action: get-account

## Purpose

Get the profile and details of the currently authenticated account (the user making the request).

---

## Endpoint

```
GET $API_BASE_URL/idp/v1/Iam/GetAccount
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Iam/GetAccount" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

---

## Request Body

None.

---

## On Success (200)

Returns the full account object for the authenticated user.

---

## On Failure

* 401 — run refresh-token then retry
