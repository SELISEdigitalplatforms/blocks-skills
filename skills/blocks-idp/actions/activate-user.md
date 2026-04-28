# Action: activate-user

## Purpose

Activate a user account using an activation code.

---

## Authentication

Not required. This action is public.

---

## Endpoint

```
POST $API_BASE_URL/idp/v1/Iam/Activate
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Iam/Activate" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "code": "activation_code",
    "password": "new_password",
    "projectKey": "'$X_BLOCKS_KEY'",
    "mailPurpose": "string",
    "captchaCode": "string",
    "preventPostEvent": false
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| code | string | yes | Activation code from email |
| password | string | yes | New password to set |
| projectKey | string | yes | Use $X_BLOCKS_KEY |
| mailPurpose | string | no | |
| captchaCode | string | no | Required if captcha enabled |
| preventPostEvent | boolean | no | Default false |

---

## On Success (200)

User account activated. User can now login.

---

## Constraints

* `password` — minimum 8 characters, must include uppercase, lowercase, number, and special character

---

## On Failure

* 400 — invalid or expired activation code, or password does not meet strength requirements
