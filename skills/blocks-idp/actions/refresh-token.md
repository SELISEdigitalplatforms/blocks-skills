# Action: refresh-token

## Purpose

Use the refresh token to obtain a new access token when the current one has expired.
Triggered when any API call returns 401.

> **Note:** `client_id` is optional but recommended for OIDC-based refresh flows. Do not include it for `grant_type=password` requests.

---

## Endpoint

```
POST $API_BASE_URL/idp/v1/Authentication/Token
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Authentication/Token" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "grant_type=refresh_token" \
  --data-urlencode "refresh_token=$REFRESH_TOKEN"
```

---

## Fixed vs Dynamic

| Parameter | Value | Type |
|-----------|-------|------|
| x-blocks-key | $X_BLOCKS_KEY | fixed |
| grant_type | refresh_token | fixed |
| refresh_token | $REFRESH_TOKEN | runtime value |

---

## On Success (200)

Update stored values:
* `access_token` → $ACCESS_TOKEN (replace old value)
* `refresh_token` → $REFRESH_TOKEN (replace old value)

Retry the original failed request with the new $ACCESS_TOKEN.

---

## On Failure

* 400 — refresh token expired or invalid — must re-authenticate with get-token
