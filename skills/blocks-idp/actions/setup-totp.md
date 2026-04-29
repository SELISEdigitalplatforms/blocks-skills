# Action: setup-totp

## Purpose

Setup a TOTP authenticator app (Google Authenticator, Microsoft Authenticator) for the current user. Returns a QR code or secret to scan.

---

## Endpoint

```
GET $API_BASE_URL/idp/v1/Mfa/SetUpTotp
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Mfa/SetUpTotp?userId=USER_ID" \
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

Returns TOTP setup data including QR code URI and secret key for the authenticator app.

---

## On Failure

* 401 — run refresh-token then retry
