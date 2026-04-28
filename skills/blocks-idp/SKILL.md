---
name: blocks-idp
description: "Use this skill for any request involving login, MFA setup, user creation, role/permission management, organization switching, SSO/OIDC configuration, session handling, password recovery, CAPTCHA, or access control on SELISE Blocks. Maps natural language intents to the correct flow or action and enforces security best practices."
user-invocable: false
blocks-version: "1.0.0"
---

# Identity & Access Skill

## Purpose

Handles all authentication, user management, role/permission management, MFA, and organization operations for SELISE Blocks via the IDP v1 API.

Must run get-token before any other action in a session.

---

## When to Use

Example prompts that should route here:
- "Set up authentication for my Next.js app"
- "Build a login page with email/password and Google SSO"
- "Set up MFA with TOTP for admin users"
- "Create an admin role with full permissions"
- "Show me active user sessions with logout button"
- "Build a forgot password flow"
- "Configure an OIDC client for my application"
- "Set up SSO with Okta/Azure AD"
- "Create machine-to-machine credentials for my API"
- "Build a signup page with email and social login options"
- "Add TOTP authenticator app enrollment to the MFA setup"
- "Configure which signup methods are allowed (email-password vs SSO)"
- "Build a user profile page with organization membership display"
- "Onboard a new user with roles and organization"

---

## Execution Context

Before executing any action or flow from this skill, read `../core/execution-context.md` for the required supporting files, load order, and cross-domain orchestration rules.

At minimum, this skill requires:
- `contracts.md` — for all API schemas, field names, and endpoint details
- `flows/` — for multi-step workflows (don't execute actions in isolation when a flow exists)
- `references/` — for framework-specific implementation guides

---

## Field Names

**Critical:** The IDP API uses different conventions than most REST APIs. Using wrong field names silently returns empty results or fails silently.

| Wrong (don't use) | Correct (use this) | Context |
|-------------------|-------------------|---------|
| `success` | `isSuccess` | All response envelopes |
| `id` | `itemId` | User, org, credential, permission, role get/save/delete |
| `languageName` | `language` | User fields (`salutation`, `firstName`, `lastName`, `email`, `userName`, `phoneNumber`, etc.) |
| `language` | `languageName` | Language-specific filter on GetOrganizations |
| `filter.userId` | `Filter.UserId` | Query param for GetSessions, GetHistories |
| `filter.property` | `Sort.Property` | Query param for pagination |
| `filter.isDescending` | `Sort.IsDescending` | Query param for pagination |
| `otp` | `verificationCode` | VerifyOtpRequest body |
| `filter.search` | `keySearchText` | (Not used here — GetPermissionsRequest uses `filter.search`) |
| `ResendOTP` | `ResendOtp` | MFA endpoint path |
| `GetHistorysResponse` | `GetHistorysResponse` | Swagger has this typo — preserve it |

---

## Pre-Flight Audit

Before implementing auth, check the project for existing patterns:

1. **Detect stack**: Check for `package.json`, `*.csproj`, `pubspec.yaml`, `angular.json` to determine framework
2. **Detect existing auth**: Search for `auth`, `login`, `token`, `session` in project files
3. **Detect env vars**: Look for existing `.env` with `API_BASE_URL`, `X_BLOCKS_KEY`, `OIDC_CLIENT_ID`
4. **Detect auth provider**: Check if NextAuth, Auth.js, Firebase, Auth0, or similar is already in use

---

## Intent Mapping

Use this table to route user requests. Check `flows/` first — if a flow covers the request, use it. For single-action requests, go directly to the action.

| User wants to... | Use |
|------------------|-----|
| Set up authentication for a new project | `flows/auth-setup.md` |
| Build a login page | `flows/login-flow.md` |
| Build signup / registration | `flows/user-registration.md` |
| Build forgot password / reset password | `flows/password-recovery.md` |
| Set up MFA for a user | `flows/mfa-setup.md` |
| Create a user and assign roles (admin) | `flows/user-onboarding.md` |
| Build session list / logout UI | `flows/session-management.md` |
| Create roles and permissions / RBAC setup | `flows/role-permission-setup.md` |
| Configure OIDC client / SSO provider | `flows/oidc-sso-setup.md` |
| Set up machine-to-machine credentials | `flows/client-credentials.md` |
| Get a specific user by ID | `actions/get-user.md` |
| Search / list users | `actions/get-users.md` |
| Update a user's profile | `actions/update-user.md` |
| Deactivate a user | `actions/deactivate-user.md` |
| Change password (authenticated user) | `actions/change-password.md` |
| Check if email is taken | `actions/check-email-available.md` |
| Validate an activation code | `actions/validate-activation-code.md` |
| Get current user's roles | `actions/get-account-roles.md` |
| Get current user's permissions | `actions/get-account-permissions.md` |
| Get a specific role | `actions/get-role.md` |
| Get a specific permission | `actions/get-permission.md` |
| List resource groups | `actions/get-resource-groups.md` |
| Create / update an organization | `actions/save-organization.md` |
| Get organization config | `actions/get-organization-config.md` |
| View audit history | `actions/get-histories.md` |
| Generate a user code | `actions/generate-user-code.md` |
| List user codes | `actions/get-user-codes.md` |
| Get user activity timeline | `actions/get-user-timeline.md` |
| Configure OIDC client | `actions/save-oidc-client.md` |
| List OIDC clients | `actions/get-oidc-clients.md` |
| Configure SSO credential | `actions/save-sso-credential.md` |
| Enable/disable SSO | `actions/update-sso-status.md` |
| Acknowledge OIDC consent | `actions/acknowledge-user.md` |
| Get signup settings | `actions/get-signup-settings.md` |
| Save signup settings | `actions/save-signup-settings.md` |
| Get permissions grouped by severity | `actions/get-permissions-grouped.md` |
| Get OIDC discovery config | `actions/get-openid-configuration.md` |
| Get OIDC JWKS | `actions/get-jwks.md` |

---

## Common Pitfalls

### Token endpoint uses form data, not JSON

`POST /idp/v1/Authentication/Token` accepts `application/x-www-form-urlencoded`, NOT JSON body. Using JSON will silently fail.

```bash
# CORRECT
curl --location "$API_BASE_URL/idp/v1/Authentication/Token" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "grant_type=password" \
  --data-urlencode "username=$USERNAME" \
  --data-urlencode "password=$PASSWORD"
```

### Always check `isSuccess` not `success`

All IDP responses use `isSuccess` as the boolean flag. Checking `success` will always be falsy even on success.

### `itemId` vs `id` in user/org operations

User, organization, and credential operations use `itemId` for the identifier. Using `id` will silently return null.

### `GetUserTimelines` uses request body, not query params

Despite being a GET endpoint, `GetUserTimelines` requires a POST body with pagination/sort/filter. Do not use query parameters.

### `GetSessions` and `GetHistories` use query params for pagination

These GET endpoints accept `Page`, `PageSize`, `Sort.Property`, `Sort.IsDescending`, `Filter.UserId` as query parameters.

### ResendOTP endpoint is `/ResendOtp` not `/ResendOTP`

The swagger has `ResendOtp` (lowercase 't') — preserve this typo in all endpoint references.

### `language` not `languageName` for user fields

User profile fields use `language` (e.g., `"language": "en"`). `languageName` is only used for language-specific organization filters.

---

## Grant Type Decision Guide

Use this guide to choose the correct `grant_type` for the `/idp/v1/Authentication/Token` endpoint.

### Which grant type to use

| Scenario | grant_type | Requires client_id | Notes |
|----------|-----------|-------------------|-------|
| End-user login (email/password form) | `password` | No | Basic auth |
| End-user login (social/OIDC redirect) | `authorization_code` | Yes | After receiving `code` from redirect |
| MFA verification during login | `mfa_code` | Yes | After `enable_mfa: true` from password grant |
| SPA auto-refresh of session | `refresh_token` | Optional | No user interaction needed |
| Backend service calling IDP APIs | `client_credentials` | Yes | Machine-to-machine, no user context |

### Password grant

The simplest grant for email/password login. The `client_id` parameter is **not used** with this grant.

```
grant_type=password&username=...&password=...
```

After calling, check the response:
- **No MFA**: response contains `access_token` + `refresh_token` — login complete
- **MFA required**: response contains `enable_mfa: true`, `mfaId`, `mfaType` — call `mfa_code` grant next

### Authorization code grant

Used after an OIDC redirect. The `client_id` is required.

```
grant_type=authorization_code&code=...&redirect_uri=...&client_id=...
```

### Client credentials grant

Machine-to-machine authentication. The service acts as its own identity — no user context.

```
grant_type=client_credentials&client_id=...&client_secret=...&scope=...
```

**When to use:**
- Backend services that need to call IDP APIs (e.g., a cron job that creates users)
- CLI tools that manage users programmatically
- Server-to-server integrations where no human user is involved

**When NOT to use:**
- End-user authentication in a SPA or mobile app — the `client_secret` cannot be kept confidential in a public client
- Any scenario where the grant is initiated from frontend code

**Security rules:**
- Store `client_secret` **only on the server** — environment variables, secrets manager (AWS Secrets Manager, HashiCorp Vault, Azure Key Vault)
- Never embed in frontend code, committed files, or public repositories
- Never use `client_credentials` for end-user login flows

### End-user auth vs machine-to-machine — decision

| Question | Use | grant_type |
|----------|-----|-----------|
| Is there a human user logging in? | Yes | `password` or `authorization_code` |
| Is this a server/backend service? | No | `client_credentials` |
| Is the secret exposed to a browser or mobile app? | Yes | `password` or `authorization_code` only — never `client_credentials` |
| Does the service need to act as itself, not on behalf of a user? | Yes | `client_credentials` |

---

## MFA Type Decision Guide

Choose the right MFA type based on your security requirements and user experience needs.

### Comparison

| Factor | Email OTP | TOTP (Authenticator App) |
|--------|----------|--------------------------|
| Setup effort | None — just enter email | User must scan QR code |
| Code delivery | Sent to email | Generated in app (Google Auth, Microsoft Auth, etc.) |
| Code length | 5 digits | 6 digits |
| Offline access | No — requires email access | Yes — works without internet |
| Security level | Lower (email can be compromised) | Higher (device-bound) |
| User friction | Medium | Medium-high on first setup |

### When to use each

| Use case | Recommendation |
|----------|--------------|
| Admin/privileged accounts | TOTP — enforce on first login |
| End-user accounts | Email OTP — lower friction, still effective |
| High-security applications | Both — require one as backup |
| API/service accounts | No MFA — use `client_credentials` instead |

### MFA during login vs standalone

**During login**: Use `get-token` with `grant_type=mfa_code` — not `verify-otp`. The token response already handles MFA verification.

**Standalone (settings page)**: Use `generate-otp` → `verify-otp` for email OTP, or `setup-totp` → `verify-otp` for TOTP enrollment.

---

## Role Hierarchy Design

SELISE Blocks uses flat roles. Permissions are assigned directly to roles, roles are assigned to users.

### Recommended patterns

| Pattern | When to use | Example |
|--------|-------------|---------|
| **Job-function roles** | Most applications | `viewer`, `editor`, `admin` |
| **Resource-scoped roles** | Multi-tenant or granular access | `users-viewer`, `reports-editor`, `settings-admin` |
| **Permission-level roles** | Simple apps with few levels | `read-only`, `read-write`, `full-access` |

### Common mistake: over-granular permissions assigned directly to users

Do **not** assign individual permissions to users directly. Always create a role, assign permissions to the role, then assign the role to the user. This keeps role assignment simple and auditable.

```
✅ CORRECT: User → Role → Permissions
❌ WRONG:   User → Permission A, Permission B, Permission C (hard to audit and manage)
```

### Role assignment replaces existing

`set-roles` replaces all existing role assignments. To add one role without removing others:
1. Call `get-user-roles` to fetch current roles
2. Merge the new role into the array
3. Call `set-roles` with the full merged array

### Built-in vs custom permissions

Some permissions are `isBuiltIn: true` — these cannot be deleted or modified. Custom permissions can be created per application need.

---

## Reference Implementations

| Framework | File | Notes |
|-----------|------|-------|
| Next.js App Router | `references/nextjs-app-router.md` | Server actions, middleware, session cookies |
| React SPA (Vite) | `references/react-vite.md` | Token storage, SPA auth guard, axios interceptor |
| React Native | `references/react-native.md` | Secure storage, biometric, deep linking |
| Angular | `references/angular.md` | HttpClient interceptor, route guards |
| Flutter | `references/flutter.md` | Dio interceptor, secure storage, biometric |
| Blazor .NET | `references/blazor-dotnet.md` | MudBlazor + Tailwind variants |
| OIDC/SSO setup | `references/oidc-sso-setup.md` | Client config, authorize endpoint, discovery |
| Client credentials | `references/client-credentials.md` | Machine-to-machine OAuth2 grant |
| Consent flow | `references/consent-flow.md` | UserAcknowledgement pattern |
| Token refresh | `references/token-refresh.md` | Auto-refresh, 401 handling, race conditions |

---

## Flows

| Flow | File | Description |
|------|------|-------------|
| auth-setup | flows/auth-setup.md | Project scaffold: types, service, React Query hooks, auth context, protected routes |
| login-flow | flows/login-flow.md | Email, social, OIDC login with MFA branching |
| user-registration | flows/user-registration.md | Self-registration or admin-created with activation |
| password-recovery | flows/password-recovery.md | Forgot password → reset password → logout-all |
| mfa-setup | flows/mfa-setup.md | Email OTP or TOTP authenticator enrollment |
| user-onboarding | flows/user-onboarding.md | Admin creates user, assigns roles and org |
| session-management | flows/session-management.md | View sessions, single/all device logout |
| role-permission-setup | flows/role-permission-setup.md | Create roles, permissions, assign to users |
| oidc-sso-setup | flows/oidc-sso-setup.md | OIDC client, SSO credential, authorize endpoint |
| client-credentials | flows/client-credentials.md | Machine-to-machine OAuth2 client credentials grant |

---

## Base Path

All endpoints are prefixed with: `$API_BASE_URL/idp/v1`

---

## Action Index

### Authentication
| Action | File | Description |
|--------|------|-------------|
| get-token | actions/get-token.md | Exchange credentials for access + refresh tokens (form-encoded) |
| refresh-token | actions/refresh-token.md | Renew access token using refresh token (form-encoded) |
| logout | actions/logout.md | Logout current session |
| logout-all | actions/logout-all.md | Logout all active sessions |
| get-user-info | actions/get-user-info.md | Get authenticated user's info |
| get-login-options | actions/get-login-options.md | Get available login methods for the project |
| generate-user-code | actions/generate-user-code.md | Generate a new user code |
| get-user-codes | actions/get-user-codes.md | List all user codes |
| login | actions/login.md | Login with optional OIDC params |
| authorize | actions/authorize.md | OIDC authorize endpoint |
| get-openid-configuration | actions/get-openid-configuration.md | OIDC discovery document |
| get-jwks | actions/get-jwks.md | OIDC JWKS endpoint |
| acknowledge-user | actions/acknowledge-user.md | OIDC consent acknowledgment |
| get-social-login-endpoint | actions/get-social-login-endpoint.md | Get social/OIDC provider authorization URL |
| discover-project-slug | actions/discover-project-slug.md | Discover project slug for the current app |

### OIDC Client Management
| Action | File | Description |
|--------|------|-------------|
| save-oidc-client | actions/save-oidc-client.md | Create or update OIDC client |
| get-oidc-client | actions/get-oidc-client.md | Get single OIDC client |
| get-oidc-clients | actions/get-oidc-clients.md | List all OIDC clients |
| delete-oidc-client | actions/delete-oidc-client.md | Delete an OIDC client |

### Client Credentials (Machine-to-Machine)
| Action | File | Description |
|--------|------|-------------|
| save-client-credential | actions/save-client-credential.md | Create machine-to-machine credential |
| get-client-credentials | actions/get-client-credentials.md | List client credentials |
| delete-client-credential | actions/delete-client-credential.md | Delete a client credential |

### SSO Credentials
| Action | File | Description |
|--------|------|-------------|
| save-sso-credential | actions/save-sso-credential.md | Create or update SSO credential |
| get-sso-credential | actions/get-sso-credential.md | Get single SSO credential |
| get-sso-credentials | actions/get-sso-credentials.md | List all SSO credentials |
| delete-sso-credential | actions/delete-sso-credential.md | Delete SSO credential |
| update-sso-status | actions/update-sso-status.md | Enable or disable SSO |

### Users
| Action | File | Description |
|--------|------|-------------|
| create-user | actions/create-user.md | Create a new user |
| update-user | actions/update-user.md | Update user details |
| get-users | actions/get-users.md | List users with pagination and filters |
| get-user | actions/get-user.md | Get a specific user by ID |
| activate-user | actions/activate-user.md | Activate a user account |
| deactivate-user | actions/deactivate-user.md | Deactivate a user account |
| change-password | actions/change-password.md | Change user password |
| recover-user | actions/recover-user.md | Initiate password recovery |
| reset-password | actions/reset-password.md | Reset password using recovery code |
| resend-activation | actions/resend-activation.md | Resend activation email |
| validate-activation-code | actions/validate-activation-code.md | Validate activation code before setting password |
| check-email-available | actions/check-email-available.md | Check if email is already taken |
| get-account | actions/get-account.md | Get current authenticated account profile |
| get-user-roles | actions/get-user-roles.md | Get roles assigned to a user |
| get-user-permissions | actions/get-user-permissions.md | Get permissions assigned to a user |
| get-account-roles | actions/get-account-roles.md | Get roles of current authenticated account |
| get-account-permissions | actions/get-account-permissions.md | Get permissions of current authenticated account |
| get-sessions | actions/get-sessions.md | Get active sessions for a user |
| get-histories | actions/get-histories.md | Get audit history for a user |
| get-user-timeline | actions/get-user-timeline.md | Get user activity timeline |

### Roles
| Action | File | Description |
|--------|------|-------------|
| create-role | actions/create-role.md | Create a new role |
| update-role | actions/update-role.md | Update an existing role |
| get-roles | actions/get-roles.md | List roles with pagination |
| get-role | actions/get-role.md | Get a specific role |
| set-roles | actions/set-roles.md | Assign roles to a user |

### Permissions
| Action | File | Description |
|--------|------|-------------|
| create-permission | actions/create-permission.md | Create a new permission |
| update-permission | actions/update-permission.md | Update an existing permission |
| get-permissions | actions/get-permissions.md | List permissions with pagination |
| get-permission | actions/get-permission.md | Get a specific permission |
| get-permissions-grouped | actions/get-permissions-grouped.md | List permissions grouped by severity |
| save-roles-and-permissions | actions/save-roles-and-permissions.md | Bulk assign roles and permissions |
| get-resource-groups | actions/get-resource-groups.md | List all resource groups |

### Organizations
| Action | File | Description |
|--------|------|-------------|
| save-organization | actions/save-organization.md | Create or update an organization |
| get-organizations | actions/get-organizations.md | List all organizations |
| get-organization | actions/get-organization.md | Get a specific organization |
| save-organization-config | actions/save-organization-config.md | Save configuration for an organization |
| get-organization-config | actions/get-organization-config.md | Get configuration for an organization |
| save-signup-settings | actions/save-signup-settings.md | Toggle email-password/SSO signup |
| get-signup-settings | actions/get-signup-settings.md | Get signup settings |

### MFA
| Action | File | Description |
|--------|------|-------------|
| generate-otp | actions/generate-otp.md | Generate an OTP for MFA |
| verify-otp | actions/verify-otp.md | Verify an OTP |
| setup-totp | actions/setup-totp.md | Setup TOTP authenticator app |
| disable-user-mfa | actions/disable-user-mfa.md | Disable MFA for a user |
| resend-otp | actions/resend-otp.md | Resend OTP |

### Captcha
| Action | File | Description |
|--------|------|-------------|
| create-captcha | actions/create-captcha.md | Create a CAPTCHA challenge |
| submit-captcha | actions/submit-captcha.md | Submit CAPTCHA answer via POST |
| verify-captcha | actions/verify-captcha.md | Verify a CAPTCHA response via GET |

---

## Verification Checklist

After implementing auth features:

### Auth Setup (all projects)
- [ ] `auth-setup.md` completed — types, service, hooks, context, query-client all created
- [ ] `x-blocks-key` header present on every API request
- [ ] Token endpoint uses `Content-Type: application/x-www-form-urlencoded` (not `application/json`)
- [ ] All responses check `isSuccess` (not `success`)
- [ ] `refreshPromise` singleton pattern prevents multiple simultaneous token refresh calls
- [ ] On refresh failure, user is redirected to `/login`

### Login Flow
- [ ] Login page shows correct UI based on `get-login-options` response
- [ ] Password grant does NOT send `client_id` parameter
- [ ] `enable_mfa: true` response branches to MFA step — tokens are NOT stored yet
- [ ] MFA verify page auto-submits at 5 digits (email OTP) or 6 digits (TOTP)
- [ ] After MFA success, tokens are stored and user is redirected to protected route

### User Onboarding / Registration
- [ ] `create-user` uses `userCreationType: 5` (SelfService) for self-signup, `4` (AdminCreated) for admin-created
- [ ] Email uniqueness checked before form submission via `check-email-available`
- [ ] Activation code extracted from URL on `/activate` route
- [ ] CAPTCHA widget shown on activation page if enabled
- [ ] `activate-user` called with `captchaCode` when CAPTCHA is active
- [ ] `resend-activation` available on the email-sent confirmation page

### Password Recovery
- [ ] Forgot password shows generic success message even when email is not registered (prevents enumeration)
- [ ] `reset-password` redirects to `/login` on success
- [ ] Session invalidation on password reset is handled by backend — no `logout-all` call needed

### MFA Setup
- [ ] Email OTP sends 5-digit code to user's registered email
- [ ] TOTP QR code displayed from `setup-totp` response
- [ ] TOTP secret key shown as text fallback below QR code
- [ ] 6-digit TOTP code verified via `verify-otp`
- [ ] MFA during login uses `mfa_code` grant — NOT `verify-otp`

### Session Management
- [ ] `get-sessions` uses query params for pagination — `Sort.Property`, `Sort.IsDescending`, `Filter.UserId`
- [ ] `logout` clears tokens regardless of API response (handle 401 gracefully)
- [ ] `logout-all` clears tokens and redirects to `/login`
- [ ] Session list shows device/browser info, IP, last active timestamp

### Role & Permission Setup
- [ ] Permissions created before roles
- [ ] Roles created before assignment
- [ ] `set-roles` merges with existing roles — not replaces without fetching first
- [ ] `isBuiltIn: true` permissions are not modified or deleted

### OIDC / SSO
- [ ] `save-oidc-client` returns `itemId` (not `id`) as the client identifier
- [ ] Authorize URL includes `response_type`, `client_id`, `redirect_uri`, `state`, `scope`
- [ ] Authorization code exchanged via `authorization_code` grant (not `password`)
- [ ] `client_secret` for `client_credentials` is never stored in frontend code or committed to repository

### General
- [ ] Auth guard / middleware redirects unauthenticated users to login
- [ ] `ProtectedRoute` shows loading state while checking auth
- [ ] User operations use `itemId` (not `id`)
- [ ] User fields use `language` (not `languageName`)
- [ ] Organization membership shown in user profile display

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Token request returns 400 | Using JSON body instead of form-encoded | Change Content-Type to `application/x-www-form-urlencoded` |
| `isSuccess` always false | Wrong field name checked | Check `isSuccess`, not `success` |
| User list returns empty | Wrong filter field name | Use `itemId` not `id` in filter |
| OTP not sending | Missing `sendPhoneNumberAsEmailDomain` for SMS | Add the field to generate-otp request |
| MFA loop | Wrong `mfaType` sent to verify-otp | Use `UserMfaType` enum (1=OTP, 2=TOTP), not OAuth strings |
| Consent screen loops | `isAcknowledged` not sent to acknowledge-user | Send `isAcknowledged: true` |
| Sessions not paginating | Using body for GET endpoint | `GetSessions` uses query params: `Sort.Property`, `Sort.IsDescending` |
| Timeline empty | POST body used on GET endpoint | `GetUserTimelines` uses POST body for pagination |
| Signup not toggling | Wrong field name | Use `isEmailPasswordSignUpEnabled` and `isSSoSignUpEnabled` |
| JWKS 404 | Missing `projectKey` query param | Add `?projectKey=...` to the request |
