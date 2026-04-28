# Flow: login-flow

## Trigger

User wants to build a login page or authentication entry point.

> "build a login page"
> "add sign in to my app"
> "implement authentication"

---

## Pre-flight Questions

Before starting, confirm:

1. Which login methods are enabled? (email/password, social login, OIDC — can be multiple)
2. Is MFA required? If yes — email OTP, authenticator app (TOTP), or both?
3. Where should the user be redirected after successful login?
4. Is there a "remember me" requirement?

---

## Flow Steps

### Step 1 — Get Login Options

Call `get-login-options` to fetch which login methods are configured for the project.
Use the response to conditionally render the correct login UI.

```
Action: get-login-options
Input:  x-blocks-key only (public endpoint)
Output: list of enabled login providers
```

Branch based on response:
- Email/password enabled → continue to Step 2
- Social login enabled → render SSO buttons alongside (see SSO Branch)
- OIDC only → skip to OIDC Branch

---

### Step 2 — Email/Password Login

Render email + password form. On submit, call `get-token` with `grant_type=password`.

```
Action: get-token
Grant type: password
Input:
  grant_type = "password"
  username   = user's email
  password   = user's password
  client_id  = BLOCKS_OIDC_CLIENT_ID
```

**Response branches:**

#### Branch A — No MFA (enable_mfa: false)
```
Response fields: access_token, refresh_token, expires_in
→ Store access_token and refresh_token in app state
→ Redirect to home / protected route
```

#### Branch B — MFA required (enable_mfa: true)
```
Response fields: enable_mfa, mfaType, mfaId, message
→ Do NOT store tokens yet
→ Redirect to /verify-mfa?mfaType=...&mfaId=...
→ Continue to Step 3
```

> `mfaType` in this response is `"email"` or `"authenticator"` — these are OAuth token response strings, NOT the `UserMfaType` enum (`OTP`, `TOTP`) used in `generate-otp`.

---

### Step 3 — MFA Verification (only if Branch B)

Render OTP input. Auto-submit when the correct number of digits is entered.

| MFA type | Digits | Source |
|----------|--------|--------|
| email | 5 | Sent to user's email |
| authenticator | 6 | From TOTP app |

Call `get-token` again with `grant_type=mfa_code`.

```
Action: get-token
Grant type: mfa_code
Input:
  grant_type = "mfa_code"
  mfa_id     = mfaId from Step 2 response
  mfa_type   = mfaType from Step 2 response
  client_id  = BLOCKS_OIDC_CLIENT_ID
```

```
On success:
  → Store access_token and refresh_token
  → Redirect to home / protected route

On failure:
  → Show error, allow retry
  → Do not redirect
```

---

### SSO Branch (social login)

Fetch available providers from `get-login-options` response.
For each provider, render a button that calls `get-social-login-endpoint` (POST) then redirects to the returned URL.

On return from provider, the app receives an authorization code in the URL.
Exchange it via `get-token` with `grant_type=authorization_code`.

```
Action: get-token
Grant type: authorization_code
Input:
  grant_type   = "authorization_code"
  code         = code from URL param
  redirect_uri = BLOCKS_OIDC_REDIRECT_URI
  client_id    = BLOCKS_OIDC_CLIENT_ID
```

Check response for `enable_mfa` — if true, continue to Step 3.

---

### OIDC Branch

Build the authorization URL and redirect:

```
{API_BASE_URL}/idp/v1/Authentication/Authorize
  ?X-Blocks-Key={X_BLOCKS_KEY}
  &client_id={BLOCKS_OIDC_CLIENT_ID}
  &redirect_uri={BLOCKS_OIDC_REDIRECT_URI}
  &response_type=code
  &scope=openid
```

On callback, detect `code` and `state` params in URL.
Exchange code via `get-token` with `grant_type=authorization_code` (same as SSO Branch).

---

## Token Storage

After successful login (any path), store in app state:
- `access_token` → used as `Authorization: Bearer` header on all requests
- `refresh_token` → used to renew access token on 401
- Never store tokens in frontend environment variables or hardcode them

---

## Token Refresh (automatic)

On any API call returning 401:
1. Call `refresh-token` action with current `refresh_token`
2. Store new `access_token` and `refresh_token`
3. Retry the original failed request
4. If refresh also returns 401 → session expired, redirect to login

---

## Error Handling

| Error | Cause | Action |
|-------|-------|--------|
| 400 | Wrong client_id or malformed request | Check BLOCKS_OIDC_CLIENT_ID |
| 401 | Wrong email/password | Show "Invalid credentials" |
| 403 | Account missing cloudadmin role | Not applicable for end users — check admin config |
| 404 | Wrong API_BASE_URL | Check environment URL |
| enable_mfa: true | MFA required | Redirect to MFA step |

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

All hooks use React Query (`useMutation`, `useQuery`). Service calls go through `auth.service.ts`. See `flows/auth-setup.md` for the complete project scaffold first.

### Auth Service

The `auth.service.ts` already has `getToken`, `getLoginOptions`, `getUserInfo`, and `logout` from the auth-setup flow. Add these for social login and OIDC:

```
Update: src/lib/auth.service.ts
Add:
  - getSocialLoginEndpoint(provider, redirectUri): GET /idp/v1/Authentication/GetSocialLogInEndPoint
  - getOidcAuthorizeUrl(params): builds /idp/v1/Authentication/Authorize URL with all query params
```

### Login Page Component

```
Create: src/pages/auth/login-page.tsx
Key patterns:
  - useAuth() from auth-context → exposes login, isAuthenticated, isLoading, error
  - Check isAuthenticated on mount → if true, redirect to /dashboard
  - useLoginOptions() to get available login methods
  - Conditionally render email/password form vs social login buttons vs OIDC button
  - Show error message from auth.error state
```

```tsx
// src/pages/auth/login-page.tsx
"use client";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { useLoginOptions } from "@/lib/auth-hooks";

export function LoginPage() {
  const { isAuthenticated, isLoading, login, error } = useAuth();
  const { data: loginOptions } = useLoginOptions();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const username = (form.elements.namedItem("username") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    await login(username, password);
  };

  const emailEnabled = loginOptions?.loginOptions?.some((o) => o.type === "Email");
  const socialEnabled = loginOptions?.loginOptions?.some((o) => o.type === "SocialLogin");

  return (
    <div>
      {emailEnabled && (
        <form onSubmit={handleSubmit}>
          <input name="username" type="email" placeholder="Email" required />
          <input name="password" type="password" placeholder="Password" required />
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
          {error && <p className="error">{error}</p>}
        </form>
      )}
      {socialEnabled && (
        <SocialLoginButtons
          providers={loginOptions?.loginOptions?.find((o) => o.type === "SocialLogin")?.providers ?? []}
        />
      )}
    </div>
  );
}
```

### MFA Verification Page

```
Create: src/pages/auth/mfa-verify-page.tsx
Key patterns:
  - Read mfaId and mfaType from URL params or auth context
  - useAuth().verifyMfa(code) to submit the OTP
  - Auto-submit when correct number of digits entered (5 for email OTP, 6 for TOTP)
  - Show success or error state
```

```tsx
// src/pages/auth/mfa-verify-page.tsx
"use client";

import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";

export function MfaVerifyPage() {
  const [code, setCode] = useState("");
  const { mfaType, mfaId, verifyMfa, isLoading, error } = useAuth();

  const digitCount = mfaType === "authenticator" ? 6 : 5;
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, digitCount);
    setCode(val);
    if (val.length === digitCount) {
      verifyMfa(val);
    }
  };

  return (
    <div>
      <p>Enter the {digitCount}-digit code{mfaType === "authenticator" ? " from your authenticator app" : " sent to your email"}</p>
      <input
        type="text"
        inputMode="numeric"
        maxLength={digitCount}
        value={code}
        onChange={handleChange}
        placeholder={String("0").repeat(digitCount)}
        autoFocus
      />
      {error && <p className="error">{error}</p>}
      {isLoading && <p>Verifying...</p>}
    </div>
  );
}
```

### Route Setup

```
Update: src/App.tsx (or your router)
Add:
  - /login → LoginPage
  - /verify-mfa → MfaVerifyPage (or handled inline in LoginPage based on mfaRequired)
  - Protected routes wrapped in ProtectedRoute
```

```tsx
// src/App.tsx
import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/protected-route";
import { LoginPage } from "@/pages/auth/login-page";
import { MfaVerifyPage } from "@/pages/auth/mfa-verify-page";
import { DashboardPage } from "@/pages/dashboard";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify-mfa" element={<MfaVerifyPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
```

### Social Login

For social login, use `useMutation` with `getSocialLoginEndpoint`:

```tsx
// In a social login button handler
const socialLoginMutation = useMutation({
  mutationFn: (provider: string) =>
    getSocialLoginEndpoint(provider, import.meta.env.VITE_OIDC_REDIRECT_URI),
  onSuccess: (data) => {
    window.location.href = data.url;
  },
});
```

### Reference

- `flows/auth-setup.md` — Must be completed first for the project scaffold (types, service, hooks, context)
- `references/react-vite.md` — Full SPA implementation with PKCE, OIDC, token refresh interceptor
- `references/nextjs-app-router.md` — Server Actions + middleware auth pattern
