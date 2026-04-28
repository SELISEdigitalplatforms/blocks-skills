# Action: create-captcha

## Purpose

Create a CAPTCHA challenge to present to the user before sensitive operations (registration, password reset).

---

## Authentication

Not required. This action is public.

---

## Endpoint

```
POST $API_BASE_URL/idp/v1/Captcha/Create
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Captcha/Create" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "configurationName": "default"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| configurationName | string | yes | Name of the captcha config to use |

---

## On Success (200)

Returns CAPTCHA challenge data (image or puzzle) and a verification token.
Store the verification token — pass it with the captchaCode when activating/resetting.

---

## On Failure

* 400 — invalid configuration name
