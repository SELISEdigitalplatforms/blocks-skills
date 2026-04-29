# Action: get-user

## Purpose

Get a specific user by ID.

---

## Endpoint

```
GET $API_BASE_URL/idp/v1/Iam/GetUser
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Iam/GetUser?userId=USER_ID" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

---

## Query Parameters

| Param | Type | Required |
|-------|------|----------|
| userId | string | yes |

---

## On Success (200)

Returns full user object including roles, permissions, and profile data.

### Sample Response

```json
{
  "data": {
    "userId": "string",
    "email": "user@example.com",
    "userName": "string",
    "firstName": "string",
    "lastName": "string",
    "phoneNumber": "string",
    "status": "Active",
    "mfaEnabled": false,
    "userMfaType": "OTP",
    "allowedLogInType": ["Email"],
    "roles": ["string"],
    "tags": ["string"],
    "createdDate": "2024-01-01T00:00:00Z"
  },
  "errors": {},
  "isSuccess": true
}
```

---

## On Failure

* 401 — run refresh-token then retry
* 404 — user not found
