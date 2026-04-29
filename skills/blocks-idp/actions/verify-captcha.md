# Action: verify-captcha

## Purpose

Verify a user's CAPTCHA response before proceeding with a protected action.

---

## Endpoint

```
GET $API_BASE_URL/idp/v1/Captcha/Verify
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Captcha/Verify?VerificationCode=USER_CAPTCHA_CODE" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

---

## Query Parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| VerificationCode | string | yes | Code entered by the user |

> **Note:** The Swagger spec only documents `VerificationCode` for this endpoint. `ConfigurationName` is not listed as a query param in the API spec.

---

## On Success (200)

Returns `{ "isValid": true }`. Proceed with the protected action.

---

## On Failure

* 200 with `{ "isValid": false }` — wrong answer, show new CAPTCHA
