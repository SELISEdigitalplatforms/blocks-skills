# Action: get-user-info

## Purpose

Get the profile and claims of the currently authenticated user.

---

## Endpoint

```
GET $API_BASE_URL/idp/v1/Authentication/GetUserInfo
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Authentication/GetUserInfo" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

---

## Request Body

None.

---

## On Success (200)

Returns authenticated user's profile, roles, and claims derived from the JWT.

---

## On Failure

* 401 — token expired, run refresh-token then retry
