# Flow: mfa-setup

## Trigger

User wants to set up MFA for a user account, or build an MFA enrollment page.

> "add MFA setup"
> "implement two-factor authentication"
> "build authenticator app setup"
> "enable TOTP for users"

---

## Pre-flight Questions

Before starting, confirm:

1. Which MFA type to set up? `email OTP`, `authenticator app (TOTP)`, or both?
2. Is this triggered by the user voluntarily, or forced on first login?
3. After setup, should the user immediately verify with an OTP to confirm enrollment?

---

## MFA Types

| Type | How it works | Actions used |
|------|-------------|--------------|
| Email OTP | Code sent to user's email | `generate-otp` → `verify-otp` |
| TOTP (Authenticator app) | QR code scanned in Google/Microsoft Authenticator | `setup-totp` → user scans QR → `verify-otp` to confirm |

---

## Flow Steps

### Path A — Email OTP Setup

#### Step 1 — Generate OTP

```
Action: generate-otp
Input:
  userId     = target user's ID
  projectKey = X_BLOCKS_KEY
  mfaType    = "OTP"
```

```
On success → OTP sent to user's registered email
           → Show OTP input form
On 400     → MFA not enabled for this user — enable it first via update-user
```

---

#### Step 2 — Verify OTP

Collect the 5-digit code from the user.

```
Action: verify-otp
Input:
  userId     = target user's ID
  otp        = code entered by user
  projectKey = X_BLOCKS_KEY
```

```
On success → MFA confirmed, show success state
On 400     → Invalid or expired OTP, allow retry
           → Offer resend via resend-otp
```

---

#### Step 3 — Resend OTP (if needed)

```
Action: resend-otp
Input:
  userId     = target user's ID
  projectKey = X_BLOCKS_KEY
```

```
On 429 → Rate limited, show "Please wait before requesting another code"
```

---

### Path B — TOTP (Authenticator App) Setup

#### Step 1 — Get TOTP Setup Data

```
Action: setup-totp
Input:  userId (query param)
Output: QR code URI + secret key
```

```
On success → display QR code for user to scan in their authenticator app
           → display secret key as text fallback
```

---

#### Step 2 — Confirm Enrollment

After scanning, user enters the 6-digit code shown in their authenticator app.

```
Action: verify-otp
Input:
  userId     = target user's ID
  otp        = 6-digit TOTP code
  projectKey = X_BLOCKS_KEY
```

```
On success → TOTP enrollment confirmed, show success state
On 400     → Wrong code (time drift or wrong scan) — ask user to try again
```

---

## Disabling MFA

To remove MFA from a user account:

```
Action: disable-user-mfa
Input:
  userId     = target user's ID
  projectKey = X_BLOCKS_KEY
```

---

## MFA During Login (reference)

MFA verification during login uses `get-token` with `grant_type=mfa_code`, not `verify-otp`.
See `flows/login-flow.md` Step 3 for the login-time MFA flow.

`verify-otp` is used for **standalone MFA verification** outside the login token flow.

---

## Error Handling

| Error | Cause | Action |
|-------|-------|--------|
| `generate-otp` 400 | MFA not enabled on user | Call update-user to set mfaEnabled=true first |
| `verify-otp` 400 | Wrong or expired code | Show error, allow retry or resend |
| `resend-otp` 429 | Rate limited | Show wait message |
| `setup-totp` 401 | Token expired | Run refresh-token then retry |

---

## Frontend Output

All hooks use React Query. See `flows/auth-setup.md` first for the project scaffold.

### MFA Setup Page

```
Create: src/pages/mfa/mfa-setup-page.tsx
Key patterns:
  - useAuth() → get current user info
  - Show MFA type selector (Email OTP vs TOTP)
  - useMutation for generateOtp, setupTotp
```

```tsx
// src/pages/mfa/mfa-setup-page.tsx
"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { generateOtp, setupTotp } from "@/lib/auth.service";

export function MfaSetupPage() {
  const { getAccessToken, user } = useAuth();
  const token = getAccessToken();
  const [setupData, setSetupData] = useState<{ qrCode: string; secret: string } | null>(null);
  const [step, setStep] = useState<"select" | "verify">("select");

  const otpMutation = useMutation({
    mutationFn: () => generateOtp(user!.itemId, 1), // OTP = 1
    onSuccess: (res) => {
      if (res.isSuccess) {
        setStep("verify");
      }
    },
  });

  const totpMutation = useMutation({
    mutationFn: () => setupTotp(user!.itemId),
    onSuccess: (res) => {
      if (res.isSuccess) {
        setSetupData({ qrCode: res.qrCode, secret: res.qrImageUrl });
        setStep("verify");
      }
    },
  });

  if (step === "verify") {
    return (
      <div>
        {setupData && (
          <div>
            <img src={setupData.qrCode} alt="TOTP QR Code" />
            <p>Secret: {setupData.secret}</p>
          </div>
        )}
        <p>Enter the code from your {setupData ? "authenticator app" : "email"}</p>
        <OtpInput
          length={setupData ? 6 : 5}
          onComplete={(code) => {
            /* verify via useMfaVerify from auth-hooks.ts */
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <h2>Set Up MFA</h2>
      <button onClick={() => otpMutation.mutate()}>
        Set up with Email OTP
      </button>
      <button onClick={() => totpMutation.mutate()}>
        Set up with Authenticator App
      </button>
    </div>
  );
}
```

### OTP Input Component

```
Create: src/components/mfa/otp-input.tsx
Key patterns:
  - Controlled input, digits only
  - Auto-submit when all digits entered
  - Visual feedback per digit (filled/empty)
```

```tsx
// src/components/mfa/otp-input.tsx
"use client";

import { useState } from "react";

interface OtpInputProps {
  length: number;
  onComplete: (code: string) => void;
}

export function OtpInput({ length, onComplete }: OtpInputProps) {
  const [code, setCode] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, length);
    setCode(val);
    if (val.length === length) {
      onComplete(val);
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      maxLength={length}
      value={code}
      onChange={handleChange}
      placeholder={String("0").repeat(length)}
      autoFocus
      style={{ letterSpacing: "1em", fontSize: "1.5em", textAlign: "center" }}
    />
  );
}
```

### Hooks Used

| Hook | Type | Source | Purpose |
|------|------|--------|---------|
| `useGenerateOtp` | `useMutation` | Add to `auth-hooks.ts` | Send email OTP |
| `useVerifyOtp` | `useMutation` | Add to `auth-hooks.ts` | Verify OTP code |
| `useSetupTotp` | `useMutation` | Add to `auth-hooks.ts` | Get TOTP QR code |
| `useMfaVerify` | `useMutation` | `auth-hooks.ts` | MFA code during login |

Add these to `src/lib/auth-hooks.ts`:

```typescript
// Add to src/lib/auth-hooks.ts

export function useGenerateOtp(onSuccess?: () => void) {
  return useMutation({
    mutationFn: ({ userId, mfaType }: { userId: string; mfaType: number }) =>
      generateOtp(userId, mfaType),
    onSuccess,
  });
}

export function useSetupTotp(onSuccess?: (data: any) => void) {
  return useMutation({
    mutationFn: (userId: string) => setupTotp(userId),
    onSuccess,
  });
}
```

### Reference

- `flows/auth-setup.md` — Must be completed first
- `contracts.md` — OtpGenerationRequest, VerifyOtpRequest, SetUpUserTotpResponse schemas
- `flows/login-flow.md` — MFA verification during login
