# Action: change-password

## Purpose

Change the password for the currently authenticated user.

---

## Endpoint

```
POST $API_BASE_URL/idp/v1/Iam/ChangePassword
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Iam/ChangePassword" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "oldPassword": "current_password",
    "newPassword": "new_password",
    "projectKey": "'$X_BLOCKS_KEY'"
  }'
```

---

## Request Body

| Field | Type | Required |
|-------|------|----------|
| oldPassword | string | yes |
| newPassword | string | yes |
| projectKey | string | yes |

---

## On Success (200)

Password changed. Existing tokens remain valid unless revoked.

---

## Constraints

* `newPassword` — minimum 8 characters, must include uppercase, lowercase, number, and special character

---

## On Failure

* 400 — old password incorrect or new password does not meet strength requirements
* 401 — run refresh-token then retry
