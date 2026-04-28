# Action: logout

## Purpose

Logout the current user session by invalidating the refresh token.

---

## Endpoint

```
POST $API_BASE_URL/idp/v1/Authentication/Logout
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Authentication/Logout" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "refreshToken": "'$REFRESH_TOKEN'"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| refreshToken | string | yes | Current $REFRESH_TOKEN |

---

## On Success (200)

Session invalidated. Clear $ACCESS_TOKEN and $REFRESH_TOKEN from storage.

---

## On Failure

* 401 — access token already expired, still clear tokens
