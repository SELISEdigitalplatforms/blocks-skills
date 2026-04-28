# Action: resend-otp

## Purpose

Resend an OTP to the user if the previous one expired or was not received. Use the same mfaId from the original generate-otp response.

---

## Endpoint

```
POST $API_BASE_URL/idp/v1/Mfa/ResendOtp
```

> **Note:** The endpoint is `/Mfa/ResendOtp` (lowercase 't' in "Otp') — this is the swagger spelling. Do not use `/Mfa/ResendOTP`.

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Mfa/ResendOtp" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "mfaId": "MFA_ID_FROM_GENERATE_RESPONSE",
    "sendPhoneNumberAsEmailDomain": "example.com"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| mfaId | string | yes | Use the same mfaId from the original generate-otp or token MFA response |
| sendPhoneNumberAsEmailDomain | string | no | If sending OTP via SMS-to-email gateway, provide the domain (e.g., "txt.att.net") |

---

## On Success (200)

```json
{
  "isSuccess": true,
  "errors": {},
  "mfaId": "MFA_ID"
}
```

New OTP generated and sent. The same `mfaId` is returned.

---

## On Failure

* 429 — rate limited, too many resend attempts
* 401 — run refresh-token then retry
