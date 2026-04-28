# Action: logout-all

## Purpose

Logout all active sessions for the current user.

---

## Endpoint

```
POST $API_BASE_URL/idp/v1/Authentication/LogoutAll
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Authentication/LogoutAll" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

---

## Request Body

None.

---

## On Success (200)

All sessions invalidated. Clear $ACCESS_TOKEN and $REFRESH_TOKEN from storage.

---

## On Failure

* 401 — access token already expired, still clear tokens
