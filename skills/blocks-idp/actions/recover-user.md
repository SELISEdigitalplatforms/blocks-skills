# Action: recover-user

## Purpose

Initiate password recovery — sends a reset link to the user's email.

---

## Authentication

Not required. This action is public.

---

## Endpoint

```
POST $API_BASE_URL/idp/v1/Iam/Recover
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Iam/Recover" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "email": "user@example.com",
    "projectKey": "'$X_BLOCKS_KEY'"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| email | string | yes | User's registered email |
| projectKey | string | yes | Use $X_BLOCKS_KEY |

---

## On Success (200)

Recovery email sent. User receives a link with a reset code.

---

## On Failure

* 404 — email not found
