# Log a user in (embedded login), keep the session alive, log out

Use for password-based ("embedded") login in your own UI — the standard auth flow for
Blocks apps. Covers the captcha and MFA branches, token refresh, fetching the current
user, logout, and post-login TOTP enrollment.

Preconditions: env vars from `blocks-setup` (`X_BLOCKS_KEY`, `PROJECT_SLUG` = the
`client_id`). No token needed to start — login is the endpoint that issues one.
All requests: `x-blocks-key` header + `Content-Type: application/json`.

## Steps

1. *(Optional)* `GET /api/auth/login-options` — public discovery endpoint; returns the
   identity providers and login methods enabled for the tenant (response shape not
   documented in swagger — inspect the live response). Use it to decide whether to
   render only the password form or also SSO buttons
   (see [sso-identity-providers.md](sso-identity-providers.md)).

2. `POST /api/auth/login` — the credential exchange
   (endpoints.md → [Authentication](../endpoints.md#authentication)):

   ```json
   { "client_id": "<PROJECT_SLUG>", "username": "user@example.com", "password": "***" }
   ```

   Fields are **snake_case** — do not camelCase them. On success the platform issues
   access and refresh tokens. The response shape is not documented in swagger —
   inspect the live response once and pin the token field names you observe.

   **Branch — captcha required.** Tenants can require a captcha after failed
   attempts or always. Obtain/verify the captcha via the platform Captcha controller
   (canonical in the `blocks-os` skill), then retry login with the extra field
   `"captcha_code": "<code>"`.

   **Branch — MFA challenge.** If the account has MFA enabled, the first login call
   does not return tokens; it returns an MFA challenge (shape undocumented — expect
   an identifier to echo back). Prompt the user for their one-time code, then call
   `POST /api/auth/login` again with the same credentials plus:

   ```json
   { "mfa_id": "<from the challenge response>", "mfa_code": "123456", "mfa_type": 1 }
   ```

   `mfa_type` is a numeric enum `0|1|2|3|4` whose member names are not published in
   swagger — mirror back the value the challenge indicated rather than hardcoding.
   If the user lost their device, a backup code can be consumed via
   `POST /api/mfa/backup-codes/use` with `{ "userId", "code" }` (response undocumented).

   **Branch — account locked.** Repeated failures lock the account for
   `accountLockDurationInMinutes` (tenant setting, `GET/POST /api/auth/config`).

3. `GET /api/auth/me` — with `Authorization: Bearer <access_token>`. Returns OIDC
   UserInfo claims (sub, email, name, …) for the current token — the fastest way to
   confirm login worked and read the user's identity. Response shape undocumented —
   inspect live.

4. *(Optional)* `GET /api/iam/me` — the IAM profile document, enveloped as
   `{ data, errors }` where `data` is an open key/value map. Use this (and
   `PATCH /api/iam/me` for self-service profile edits: `firstName`, `lastName`,
   `phoneNumber`, `profileImageUrl`, …) when you need profile data rather than
   token claims.

5. Keep the session alive: `POST /api/auth/refresh` before the access token expires:

   ```json
   { "refresh_token": "<refresh_token>", "client_id": "<PROJECT_SLUG>" }
   ```

   Response undocumented — expect a fresh token pair; verify live. Token lifetimes
   (`accessTokenValidForNumberMinutes`, `refreshTokenValidForNumberMinutes`, …) are
   readable/settable via `GET/POST /api/auth/config` (admin). On a 401 anywhere in
   your app: refresh once, retry, and force re-login if the refresh also fails
   (pattern detailed in `blocks-setup`).

6. Log out:
   - Current session: `POST /api/auth/logout` with `{ "refreshToken": "<refresh_token>" }`.
     **Note the camelCase `refreshToken` here** — unlike refresh's `refresh_token`.
   - All devices: `POST /api/auth/logout-all` with `{ "useBackchannel": true }`
     (revokes every refresh token for the user; optionally triggers backchannel
     logout notifications).

## Post-login: enroll TOTP MFA (optional hardening)

All under endpoints.md → [Mfa](../endpoints.md#mfa); responses undocumented — inspect live.

1. `POST /api/mfa/totp/setup` — starts enrollment (expect a secret / otpauth URI for
   the QR code — verify live).
2. `POST /api/mfa/totp/verify-setup` with `{ "code": "123456" }` — confirms the
   authenticator app is synced.
3. `POST /api/mfa/backup-codes/generate` then `GET /api/mfa/backup-codes` — issue and
   show recovery codes once.
4. `GET /api/mfa/status` — confirm enrollment; `PUT /api/mfa/preferred-method` with
   `{ "mfaType": <0-4> }` to pick the default method.

Tenant-wide enforcement (require MFA for roles, allow opt-out, backup-code count)
is `PUT /api/mfa/policy`. An admin can clear a locked-out user's MFA with
`POST /api/mfa/admin/reset` `{ "userId", "reason" }`.

## Verify

- `GET /api/auth/me` returns 200 with the expected user claims.
- `POST /api/auth/refresh` returns a new token pair, and the new access token works
  against `GET /api/auth/me`.
- After logout, the revoked refresh token is rejected by `POST /api/auth/refresh`.
- Admin view: the login appears in `GET /api/iam/sessions?Filter.UserId=<id>` and
  `GET /api/iam/history?Filter.UserId=<id>`.
