# Action: update-user

## Purpose

Update an existing user's details.

---

## Endpoint

```
POST $API_BASE_URL/idp/v1/Iam/Update
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Iam/Update" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "userId": "string",
    "firstName": "string",
    "lastName": "string",
    "phoneNumber": "string",
    "language": "en",
    "profileImageUrl": "string",
    "projectKey": "'$X_BLOCKS_KEY'"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| userId | string | yes | ID of user to update |
| firstName | string | no | |
| lastName | string | no | |
| phoneNumber | string | no | |
| language | string | no | |
| profileImageUrl | string | no | |
| projectKey | string | yes | Use $X_BLOCKS_KEY |

---

## On Success (200)

User updated successfully.

---

## On Failure

* 400 — invalid userId or fields
* 401 — run refresh-token then retry
