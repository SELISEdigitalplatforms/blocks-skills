# Flow: password-recovery

## Trigger

User wants to build a forgot password or password reset feature.

> "build forgot password"
> "add password reset"
> "implement password recovery"

---

## Pre-flight Questions

Before starting, confirm:

1. Is CAPTCHA required on the forgot password form?
2. Where should the user be redirected after successful password reset?
3. Should the user be logged out of all sessions after resetting?

---

## Flow Steps

### Step 1 — Forgot Password Form

Collect user's email address. If CAPTCHA is enabled, show CAPTCHA widget when the email field has input.

```
Action: recover-user
Input:
  email      = user's registered email
  projectKey = X_BLOCKS_KEY
  captchaCode = captcha token (if enabled)
```

```
On success → show /sent-email confirmation page
On 404     → email not found, show "If this email is registered, you will receive a link"
             (do not confirm or deny email existence for security)
```

> Security note: Always show the same success message regardless of whether the email exists. This prevents email enumeration attacks.

---

### Step 2 — Email Sent Confirmation

Show a static confirmation page:
> "If your email is registered, you will receive a password reset link shortly."

Provide a "Resend" option that calls Step 1 again.

---

### Step 3 — User Clicks Reset Link

User receives email with a link containing a `code` parameter.
App extracts `code` from URL on the `/resetpassword` route.

---

### Step 4 — Reset Password Form

Collect new password. Show password strength indicator.

```
Action: reset-password
Input:
  code        = code from URL
  newPassword = user's new password
  projectKey  = X_BLOCKS_KEY
```

Password constraints: min 8 chars, must include uppercase, lowercase, number, special character.

```
On success → continue to Step 5
On 400     → code expired/invalid or weak password, show inline error
```

---

### Step 5 — Redirect to Login

After a successful password reset, redirect the user to `/login`.

```
→ Redirect to /login
→ Show toast: "Password reset successful. Please log in."
```

> Session invalidation on password reset is handled by the backend automatically — do NOT call `logout-all` from this flow. The user is unauthenticated during reset so calling `logout-all` would fail with 401. The backend invalidates active sessions when the password changes.

---

## CAPTCHA Integration

CAPTCHA on forgot password is triggered conditionally:
- Show CAPTCHA widget after the user starts typing in the email field
- Required before form submission if enabled
- Pass token as `captchaCode` to `recover-user`

---

## Error Handling

| Error | Cause | Action |
|-------|-------|--------|
| `recover-user` 404 | Email not registered | Show generic success message (do not reveal) |
| `reset-password` 400 (invalid code) | Link expired or already used | Show "This link has expired. Please request a new one." with link to /forgot-password |
| `reset-password` 400 (weak password) | Doesn't meet strength requirements | Show password requirements inline |

---

## Frontend Output

All hooks use React Query. See `flows/auth-setup.md` first for the project scaffold.

### Forgot Password Page

```
Create: src/pages/auth/forgot-password-page.tsx
Key patterns:
  - useMutation for recoverUser (public endpoint, no token)
  - Show generic success message even on 404 (prevent email enumeration)
  - Optional CAPTCHA: useQuery for captcha challenge, pass token to recoverUser
```

```tsx
// src/pages/auth/forgot-password-page.tsx
"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { recoverUser } from "@/lib/auth.service";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const forgotMutation = useMutation({
    mutationFn: () => recoverUser(email, ""),
    onSuccess: () => setSubmitted(true),
    onError: () => setSubmitted(true), // Show same message on 404
  });

  if (submitted) {
    return (
      <div>
        <p>If this email is registered, you will receive a password reset link shortly.</p>
        <button onClick={() => setSubmitted(false)}>Resend</button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        forgotMutation.mutate();
      }}
    >
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
      />
      <button type="submit" disabled={forgotMutation.isPending}>
        {forgotMutation.isPending ? "Sending..." : "Send Reset Link"}
      </button>
    </form>
  );
}
```

### Reset Password Page

```
Create: src/pages/auth/reset-password-page.tsx
Key patterns:
  - Read `code` from URL searchParams (e.g. /reset-password?code=abc123)
  - useMutation for resetPassword
  - Password strength validation (min 8 chars, uppercase, lowercase, number, special)
  - Redirect to /login on success
```

```tsx
// src/pages/auth/reset-password-page.tsx
"use client";

import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { resetPassword } from "@/lib/auth.service";

export function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const resetMutation = useMutation({
    mutationFn: () => resetPassword(code, password, ""),
    onSuccess: () => {
      window.location.href = "/login?reset=success";
    },
    onError: (err: any) => {
      if (err.status === 400) {
        setError("This link has expired. Please request a new one.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    },
  });

  const isStrong = password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);

  return (
    <form onSubmit={(e) => { e.preventDefault(); resetMutation.mutate(); }}>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="New password"
        required
      />
      {!isStrong && password && (
        <p className="hint">Password must be at least 8 characters with uppercase, lowercase, number, and special character.</p>
      )}
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={resetMutation.isPending || !isStrong}>
        {resetMutation.isPending ? "Resetting..." : "Reset Password"}
      </button>
    </form>
  );
}
```

### Route Setup

```tsx
// src/App.tsx (additions)
<Route path="/forgot-password" element={<ForgotPasswordPage />} />
<Route path="/reset-password" element={<ResetPasswordPage />} />
```

### Hooks Used

| Hook | Type | Source | Purpose |
|------|------|--------|---------|
| `useRecoverUser` | `useMutation` | Add to `auth-hooks.ts` | Send recovery email |
| `useResetPassword` | `useMutation` | Add to `auth-hooks.ts` | Reset password with code |

Add to `src/lib/auth-hooks.ts`:

```typescript
export function useRecoverUser(onSuccess?: () => void, onError?: (err: any) => void) {
  return useMutation({
    mutationFn: ({ email, captchaCode }: { email: string; captchaCode?: string }) =>
      recoverUser(email, captchaCode ?? ""),
    onSuccess,
    onError,
  });
}

export function useResetPassword(onSuccess?: () => void, onError?: (err: any) => void) {
  return useMutation({
    mutationFn: ({ code, newPassword, captchaCode }: { code: string; newPassword: string; captchaCode?: string }) =>
      resetPassword(code, newPassword, captchaCode ?? ""),
    onSuccess,
    onError,
  });
}
```

### Reference

- `flows/auth-setup.md` — Must be completed first
- `contracts.md` — RecoveryUserRequest, ResetPasswordRequest schemas
- `flows/login-flow.md` — Login after password reset
