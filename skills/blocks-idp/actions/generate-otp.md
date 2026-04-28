# Action: generate-otp

## Purpose

Generate a one-time password (OTP) for MFA verification. Sends OTP via email or SMS based on `mfaType`.

---

## Endpoint

```
POST $API_BASE_URL/idp/v1/Mfa/GenerateOTP
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Mfa/GenerateOTP" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "userId": "USER_ID",
    "projectKey": "'$X_BLOCKS_KEY'",
    "mfaType": 1,
    "sendPhoneNumberAsEmailDomain": "example.com"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| userId | string | yes | The user to send OTP to |
| projectKey | string | yes | Use $X_BLOCKS_KEY |
| mfaType | integer | yes | `1` = OTP (email/SMS), `2` = TOTP (authenticator app — use SetUpTotp instead) |
| sendPhoneNumberAsEmailDomain | string | no | For SMS OTP via email-to-SMS gateway, provide the carrier domain |

---

## On Success (200)

```json
{
  "isSuccess": true,
  "errors": {},
  "mfaId": "abc123"
}
```

Store `mfaId` — it is required for verify-otp and resend-otp.

---

## On Failure

* 400 — MFA not enabled for user
* 401 — run refresh-token then retry
