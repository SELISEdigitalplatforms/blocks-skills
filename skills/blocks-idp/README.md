# blocks-idp

Authentication, user management, MFA, RBAC, SSO/OIDC, session handling, and organization operations for SELISE Blocks — via the IDP v1 API.

---

## What this skill does

This skill handles every identity and access operation in SELISE Blocks:

| Category | Coverage |
|----------|---------|
| **Authentication** | Email/password login, social login, OIDC/OAuth2, MFA (email OTP + TOTP authenticator) |
| **User management** | Create, update, activate, deactivate, search, list with pagination and filters |
| **Roles & permissions** | Full RBAC — create roles, create permissions, assign roles to users, resource groups |
| **Organizations** | Create orgs, configure multi-org settings, toggle signup methods (email vs SSO) |
| **Sessions** | View active sessions, single-device logout, logout all devices, audit history |
| **MFA** | Generate/verify OTP, TOTP QR setup, resend OTP, disable MFA per user |
| **SSO / OIDC** | OIDC client management, SSO credential setup (Okta, Azure AD, Google), authorize URL construction, JWKS discovery |
| **Client credentials** | Machine-to-machine OAuth2 for backend services and CLI tools |
| **CAPTCHA** | Create challenge, submit answer, verify response (reCaptcha, hCaptcha) |

---

## Quick Start

```
claude
```

Then try:

```
Build a login page with email/password and MFA support
```

```
Onboard a new admin user with roles and organization
```

```
Set up OIDC login with Okta
```

---

## Skill Structure

```
skills/blocks-idp/
├── SKILL.md                     ← Intent map + decision guides + verification checklist
├── contracts.md                 ← All TypeScript types, request/response schemas, enums
├── flows/                       ← Multi-step workflows (run these, not individual actions)
│   ├── auth-setup.md           ← Project scaffold: service, React Query hooks, auth context
│   ├── login-flow.md           ← Email/password + social + OIDC + MFA branching
│   ├── user-registration.md    ← Self-signup or admin-created with activation
│   ├── password-recovery.md    ← Forgot password → reset password
│   ├── mfa-setup.md            ← Email OTP + TOTP enrollment
│   ├── user-onboarding.md      ← Admin creates user + assigns roles + org
│   ├── session-management.md   ← View sessions, single/all logout
│   ├── role-permission-setup.md ← Create roles, permissions, assign to users
│   ├── oidc-sso-setup.md       ← OIDC client, SSO credential, authorize URL
│   └── client-credentials.md   ← Machine-to-machine OAuth2
├── actions/                    ← 78 single-API operations with curl, schemas, errors
│   ├── get-token.md
│   ├── get-users.md
│   ├── create-user.md
│   ├── setup-totp.md
│   └── ... (74 more)
└── references/                 ← Framework-specific implementation guides
    ├── nextjs-app-router.md    ← Server actions, middleware, session cookies
    ├── react-vite.md           ← AuthContext, Axios interceptor, PKCE, token refresh
    ├── react-native.md         ← Secure storage, biometric auth, deep linking
    ├── angular.md              ← HttpClient interceptor, route guards
    ├── flutter.md              ← Dio interceptor, secure storage, biometric
    ├── blazor-dotnet.md        ← MudBlazor + Tailwind variants
    ├── oidc-sso-setup.md       ← Client config, authorize endpoint, discovery
    ├── client-credentials.md   ← Service-to-service auth
    ├── consent-flow.md         ← UserAcknowledgement pattern
    └── token-refresh.md        ← Auto-refresh, 401 handling, race conditions
```

---

## How It Works

### 1. Pick the right flow

Flows are multi-step sequences. Always use a flow instead of chaining actions manually — flows handle branching, error paths, and the correct order of operations.

```
User request: "build a login page with MFA"
     │
     ▼
flows/login-flow.md
     │
     ├── get-login-options → decide UI
     ├── get-token (password grant)
     ├── If enable_mfa: true → get-token (mfa_code grant)
     └── Store tokens → redirect
```

### 2. Each action has exact curl + schemas

Every action file contains:
- Exact endpoint path and HTTP method
- `curl` example with all headers
- Request body schema (validated against Swagger)
- Response schema (success + error cases)
- HTTP status code meanings
- Field name conventions specific to IDP

```bash
# Example: get-token
curl --location "$API_BASE_URL/idp/v1/Authentication/Token" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "grant_type=password" \
  --data-urlencode "username=$USERNAME" \
  --data-urlencode "password=$PASSWORD"
```

### 3. Types live in contracts.md

All TypeScript types are in `contracts.md` — matching exact field names from the Swagger spec:

```typescript
interface CreateUserRequest {
  itemId: string;           // NOT id
  language: string;          // NOT languageName
  email: string;
  firstName: string;
  lastName: string;
  mfaEnabled: boolean;
  OrganizationMembership: OrganizationMembership[];
  projectKey: string;
}
```

---

## Key IDP Conventions

The IDP API uses conventions that differ from standard REST APIs. Wrong field names silently return empty results.

| Wrong | Correct | Why |
|-------|---------|-----|
| `success` | `isSuccess` | All response envelopes use `isSuccess` |
| `id` | `itemId` | User, org, credential, permission, role all use `itemId` |
| `languageName` | `language` | User fields use `language`, not `languageName` |
| `otp` | `verificationCode` | VerifyOtpRequest body field |
| `/ResendOTP` | `/ResendOtp` | Swagger typo — preserve it |
| JSON body | `application/x-www-form-urlencoded` | Token endpoint only |

See `SKILL.md` for the full Field Names table and Common Pitfalls section.

---

## Grant Types

The `/idp/v1/Authentication/Token` endpoint behaves differently per grant:

| grant_type | client_id | Use case |
|------------|-----------|---------|
| `password` | No | End-user email/password login |
| `authorization_code` | Yes | OIDC/social login after redirect |
| `mfa_code` | Yes | MFA verification during login |
| `refresh_token` | Optional | Auto-refresh of expired session |
| `client_credentials` | Yes | Machine-to-machine (backend services) |

See the **Grant Type Decision Guide** in `SKILL.md` for the complete decision tree.

---

## MFA Types

| Type | Code length | Setup | Offline |
|------|------------|-------|---------|
| Email OTP | 5 digits | None — just enter email | No |
| TOTP (authenticator app) | 6 digits | Scan QR code | Yes |

**Login MFA**: use `grant_type=mfa_code` on the token endpoint — NOT `verify-otp`.
**Standalone MFA** (settings page): use `generate-otp` → `verify-otp`.

See the **MFA Type Decision Guide** in `SKILL.md`.

---

## Frontend Code Patterns

All flows generate React code using TanStack Query for data fetching. The `auth-setup.md` flow creates the full scaffold:

```
src/lib/auth.types.ts          ← All TypeScript types
src/lib/auth.service.ts        ← Raw API calls
src/lib/auth-hooks.ts          ← useMutation + useQuery hooks
src/lib/use-auth-store.ts      ← Token state management
src/lib/query-client.ts        ← QueryClient + refresh singleton
src/contexts/auth-context.tsx   ← AuthProvider + useAuth hook
src/components/protected-route.tsx ← Route guard
```

---

## Environment Variables

```bash
# IDP API
NEXT_PUBLIC_API_BASE_URL=https://api.seliseblocks.com
NEXT_PUBLIC_X_BLOCKS_KEY=your-project-key
NEXT_PUBLIC_OIDC_CLIENT_ID=your-client-id
NEXT_PUBLIC_OIDC_REDIRECT_URI=http://localhost:3000/api/auth/callback

# Credentials (for direct API operations — never embed in frontend)
USERNAME=your-cloudadmin-email
PASSWORD=your-cloudadmin-password
```

---

## Verification Checklist

After implementing auth features, confirm each item in `SKILL.md`:

- [ ] Token stored securely (httpOnly cookie, secure storage, or memory)
- [ ] Token endpoint uses `Content-Type: application/x-www-form-urlencoded`
- [ ] All responses check `isSuccess` (not `success`)
- [ ] `refreshPromise` singleton prevents concurrent token refresh calls
- [ ] Auth guard redirects unauthenticated users to login
- [ ] MFA branching works for both OTP email and TOTP authenticator
- [ ] OIDC authorize URL includes all required query params
- [ ] `client_secret` for `client_credentials` is server-side only — never in frontend

Full checklist: `SKILL.md` → Verification Checklist section.

---

## Framework Support

| Framework | Reference |
|-----------|-----------|
| Next.js 14+ App Router | `references/nextjs-app-router.md` |
| React SPA (Vite) | `references/react-vite.md` |
| React Native | `references/react-native.md` |
| Angular | `references/angular.md` |
| Flutter | `references/flutter.md` |
| Blazor .NET | `references/blazor-dotnet.md` |

---

## Version

**1.0.0** — Full standardization against IDP v1 Swagger spec:
- All responses use `isSuccess` envelope
- 78 actions documented with exact schemas
- 9 multi-step flows
- 10 framework references
- Field name conventions and common pitfalls

Changelog: `meta.json`
