# Action: reset-password

## Purpose

Reset a user's password using the recovery code from email.

---

## Authentication

Not required. This action is public.

---

## Endpoint

```
POST $API_BASE_URL/idp/v1/Iam/ResetPassword
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Iam/ResetPassword" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "code": "recovery_code",
    "newPassword": "new_password",
    "projectKey": "'$X_BLOCKS_KEY'"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| code | string | yes | Recovery code from email |
| newPassword | string | yes | New password to set |
| projectKey | string | yes | Use $X_BLOCKS_KEY |

---

## On Success (200)

Password reset. User can login with new password.

---

## Constraints

* `newPassword` — minimum 8 characters, must include uppercase, lowercase, number, and special character

---

## On Failure

* 400 — invalid or expired recovery code, or new password does not meet strength requirements
