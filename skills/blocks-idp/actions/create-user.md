# Action: create-user

## Purpose

Create a new user in SELISE Blocks.

---

## Endpoint

```
POST $API_BASE_URL/idp/v1/Iam/Create
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Iam/Create" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "email": "user@example.com",
    "userName": "username",
    "password": "string",
    "firstName": "string",
    "lastName": "string",
    "phoneNumber": "string",
    "language": "en",
    "userPassType": "Plain",
    "mfaEnabled": false,
    "allowedLogInType": ["Email"],
    "projectKey": "'$X_BLOCKS_KEY'",
    "organizationId": "default"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| email | string | yes | Must be unique |
| userName | string | no | Defaults to email if omitted |
| password | string | yes | Plain text or hashed per userPassType |
| firstName | string | no | |
| lastName | string | no | |
| phoneNumber | string | no | |
| language | string | no | e.g. "en" |
| userPassType | string | no | Plain \| Hashed |
| mfaEnabled | boolean | no | Default false |
| allowedLogInType | array | no | Email, UserName, Phone, SocialLogin |
| OrganizationMembership | array | no | OrganizationMembership objects |
| tags | array | no | String tags |
| projectKey | string | yes | Use $X_BLOCKS_KEY |
| organizationId | string | no | Default: "default" |

---

## On Success (200)

User created. Returns user details.

### Sample Response

```json
{
  "errors": [],
  "isSuccess": true
}
```

---

## Constraints

* `email` — must be a valid email format and unique per project
* `password` — minimum 8 characters, must include uppercase, lowercase, number, and special character
* `userPassType` — if `Hashed`, password must be pre-hashed before sending

---

## On Failure

* 400 — validation error (duplicate email, weak password, invalid field)
* 401 — run refresh-token then retry
