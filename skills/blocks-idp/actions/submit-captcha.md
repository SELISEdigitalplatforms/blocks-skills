# Action: submit-captcha

## Authentication

Not required. This action is public.

---

## Purpose

Submit a CAPTCHA response for validation. Use this as an alternative to verify-captcha when submitting the user's answer as a POST request body instead of a GET query param.

---

## Endpoint

```
POST $API_BASE_URL/idp/v1/Captcha/Submit
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Captcha/Submit" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "verificationCode": "USER_CAPTCHA_CODE",
    "configurationName": "default"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| verificationCode | string | yes | Code entered by the user |
| configurationName | string | yes | Must match the one used in create-captcha |

---

## On Success (200)

CAPTCHA validated. Proceed with the protected action.

---

## On Failure

* 400 — invalid or expired verification code
