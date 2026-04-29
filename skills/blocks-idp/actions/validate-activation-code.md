# Action: validate-activation-code

## Authentication

Not required. This action is public.

---

## Purpose

Validate an activation code before submitting the full activation form. Use this to give early feedback to the user before they set a password.

---

## Endpoint

```
POST $API_BASE_URL/idp/v1/Iam/ValidateActivationCode
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Iam/ValidateActivationCode" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "code": "activation_code",
    "projectKey": "'$X_BLOCKS_KEY'"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| code | string | yes | Activation code from email |
| projectKey | string | yes | Use $X_BLOCKS_KEY |

---

## On Success (200)

Code is valid. Proceed to show the password-setting form and call activate-user.

---

## On Failure

* 400 — invalid or expired activation code
