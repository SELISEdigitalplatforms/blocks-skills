# Action: deactivate-user

## Purpose

Deactivate a user account, preventing login.

---

## Endpoint

```
POST $API_BASE_URL/idp/v1/Iam/Deactivate
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Iam/Deactivate" \
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

User deactivated. Login will be denied until reactivated.

---

## On Failure

* 401 — run refresh-token then retry
* 404 — user not found
