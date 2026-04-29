# Action: disable-user-mfa

## Purpose

Disable MFA for a specific user.

---

## Endpoint

```
POST $API_BASE_URL/idp/v1/Mfa/DisableUserMfa
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Mfa/DisableUserMfa" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "userId": "USER_ID",
    "projectKey": "'$X_BLOCKS_KEY'"
  }'
```

---

## Request Body

| Field | Type | Required |
|-------|------|----------|
| userId | string | yes |
| projectKey | string | yes |

---

## On Success (200)

MFA disabled for user.

---

## On Failure

* 401 — run refresh-token then retry
