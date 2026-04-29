# Action: verify-otp

## Purpose

Verify a user-submitted OTP or TOTP code for MFA. Called after generate-otp or after token endpoint returns MFA challenge.

---

## Endpoint

```
POST $API_BASE_URL/idp/v1/Mfa/VerifyOTP
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Mfa/VerifyOTP" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "verificationCode": "123456",
    "mfaId": "MFA_ID_FROM_TOKEN_RESPONSE",
    "authType": 1,
    "projectKey": "'$X_BLOCKS_KEY'",
    "isFromTokenCall": true
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| verificationCode | string | yes | The OTP code entered by user (6 digits). NOT "otp" — use "verificationCode" |
| mfaId | string | yes | The mfaId from the token response when MFA challenge was returned |
| authType | integer | yes | `1` = OTP (email/SMS), `2` = TOTP (authenticator app) |
| projectKey | string | yes | Use $X_BLOCKS_KEY |
| isFromTokenCall | boolean | no | Set to `true` when verifying from token endpoint MFA flow |

---

## On Success (200)

```json
{
  "isSuccess": true,
  "errors": {},
  "isValid": true,
  "userId": "USER_ID"
}
```

If `isFromTokenCall` was `true`, use the `userId` to complete the login session.

---

## On Failure

* 400 — invalid or expired OTP / TOTP code
* 401 — run refresh-token then retry
