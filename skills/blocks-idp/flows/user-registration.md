# Flow: user-registration

## Trigger

User wants to build a self-registration or account activation flow.

> "build a signup page"
> "add user registration"
> "implement account activation"
> "build onboarding for new users"

---

## Pre-flight Questions

Before starting, confirm:

1. Is this **self-registration** (user signs up themselves) or **admin-created** (admin creates user, user activates)? *(determines which steps are included)*
2. Is CAPTCHA required on the activation form?
3. Is email uniqueness check needed before showing the form?
4. Where should the user be redirected after successful activation?

---

## Flow Steps

### Self-Registration Path

#### Step 1 — Check Email Availability (optional but recommended)

Before or during form input, call `check-email-available` to give early feedback.

```
Action: check-email-available
Input:  email (query param)
Output: true (available) | false (taken)
```

If `false` → show "This email is already registered" inline. Do not proceed.

---

#### Step 2 — Submit Signup (email only)

Collect email address. On submit, call `create-user` with minimal fields.
The backend sends an activation email automatically.

```
Action: create-user
Input:
  email             = user's email
  userCreationType  = "SelfService"
  allowedLogInType  = ["Email"]
  projectKey        = X_BLOCKS_KEY
```

```
On success → show "Check your email" confirmation page
On 400     → duplicate email or invalid format, show inline error
```

---

#### Step 3 — User Clicks Activation Link

User receives email with activation link containing a `code` parameter.
App extracts `code` from URL on the `/activate` route.

---

#### Step 4 — Validate Activation Code

Before showing the password form, validate the code is still valid.

```
Action: validate-activation-code
Input:
  code       = code from URL
  projectKey = X_BLOCKS_KEY
```

```
On success → show set-password form (Step 5)
On 400     → code invalid or expired → redirect to /activate-failed
```

---

#### Step 5 — Set Password and Activate

Collect new password. If CAPTCHA is enabled, show CAPTCHA widget first.

```
Action: activate-user
Input:
  code             = code from URL
  password         = user's chosen password
  projectKey       = X_BLOCKS_KEY
  captchaCode      = captcha token (if enabled)
  preventPostEvent = false
```

Password constraints: min 8 chars, must include uppercase, lowercase, number, special character.

```
On success → redirect to /success confirmation page
On 400     → invalid code or weak password, show inline error
```

---

#### Step 6 — Resend Activation (if needed)

If the activation email expires or was not received, allow resend.

```
Action: resend-activation
Input:
  email      = user's email
  projectKey = X_BLOCKS_KEY
```

---

### Admin-Created Path

Admin creates user via `create-user` in the backend. The rest of the flow from Step 3 onwards is identical — user receives activation email and sets their password.

```
Action: create-user
Input:
  email            = user's email
  firstName        = optional
  lastName         = optional
  userCreationType = "AdminCreated"
  allowedLogInType = ["Email"]
  mfaEnabled       = true/false based on pre-flight answer
  projectKey       = X_BLOCKS_KEY
  organizationId   = org ID if applicable
```

---

## CAPTCHA Integration

CAPTCHA is shown on the activation/set-password page.
Load CAPTCHA widget on page mount. Pass the token to `activate-user` as `captchaCode`.

Supported types (from env): `reCaptcha`, `hCaptcha`

If captcha fails or token is missing on submission → show "Please complete the CAPTCHA" error.

---

## Error Handling

| Error | Cause | Action |
|-------|-------|--------|
| `check-email-available` returns false | Email taken | Show inline "already registered" message |
| `create-user` 400 | Duplicate email or invalid field | Show field-level error |
| `validate-activation-code` 400 | Code expired/invalid | Redirect to /activate-failed page |
| `activate-user` 400 | Weak password or bad code | Show inline error with password requirements |
| `resend-activation` 400 | User already activated | Show "Account already active, please login" |

---

## Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# IDP API Configuration
NEXT_PUBLIC_API_BASE_URL=https://api.blocks.cloud
NEXT_PUBLIC_X_BLOCKS_KEY=your-project-key-here

# OIDC Client Configuration
NEXT_PUBLIC_OIDC_CLIENT_ID=your-client-id-here
NEXT_PUBLIC_OIDC_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

---

## Frontend Output

All hooks use React Query. See `flows/auth-setup.md` first for the project scaffold.

### Add to `src/lib/auth.service.ts`

```
Add to auth.service.ts:
  - checkEmailAvailable(email): GET /idp/v1/Iam/CheckEmailAvailable?Email={email}&ProjectKey={key}
  - validateActivationCode(code): POST /idp/v1/Iam/ValidateActivationCode body { activationCode, projectKey }
  - activateUser(payload): POST /idp/v1/Iam/ActivateUser body { code, password, projectKey, ... }
  - resendActivation(email): POST /idp/v1/Iam/ResendActivation body { userId, projectKey }
  - recoverUser(email, captchaCode): POST /idp/v1/Iam/RecoveryUser body { email, projectKey, captchaCode }
  - resetPassword(code, newPassword, captchaCode): POST /idp/v1/Iam/ResetPassword body { code, password, projectKey, captchaCode }
```

### Add to `src/lib/auth-hooks.ts`

```
Add to auth-hooks.ts:
  - useCheckEmail → useQuery (public, no token)
  - useValidateActivationCode → useMutation
  - useActivateUser → useMutation
  - useResendActivation → useMutation
  - useRecoverUser → useMutation (password recovery)
  - useResetPassword → useMutation
```

### Signup Page

```
Create: src/pages/auth/signup-page.tsx
Key patterns:
  - useCheckEmail(email) → show "email taken" inline as user types
  - useMutation for createUser
  - Redirect to /activate?code={...} after success
```

```tsx
// src/pages/auth/signup-page.tsx
"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createUser } from "@/lib/auth.service";
import { checkEmailAvailable } from "@/lib/auth.service";
import { X_BLOCKS_KEY } from "@/lib/auth.service";

export function SignupPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  useQuery({
    queryKey: ["email-check", email],
    queryFn: () => checkEmailAvailable(email),
    enabled: email.includes("@"),
    onSuccess: (data) => {
      if (!data) setEmailError("This email is already registered");
      else setEmailError("");
    },
  });

  const signupMutation = useMutation({
    mutationFn: () =>
      createUser(null as any, {
        email,
        userCreationType: 5, // SelfService
        allowedLogInType: [0], // Email
        projectKey: X_BLOCKS_KEY,
      }),
    onSuccess: () => {
      window.location.href = "/email-sent";
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); signupMutation.mutate(); }}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      {emailError && <p className="error">{emailError}</p>}
      <button type="submit" disabled={signupMutation.isPending || !!emailError}>
        {signupMutation.isPending ? "Creating account..." : "Sign Up"}
      </button>
    </form>
  );
}
```

### Reference

- `flows/auth-setup.md` — Must be completed first
- `contracts.md` — CreateUserRequest, ActivateUserRequest, ResetPasswordRequest schemas
- `flows/password-recovery.md` — Forgot password flow
