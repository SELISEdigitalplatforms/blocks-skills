# Recover, reset, or change a password

Two distinct paths:

- **Recovery** (user forgot the password, unauthenticated): `recover` → email → `reset-password`.
- **Change** (user knows the password, authenticated): `change-password`.

All bodies are **camelCase**. Endpoints: endpoints.md → [Authentication](../endpoints.md#authentication).

## Path A — Forgot password (recovery + reset)

1. `POST /api/auth/recover` — unauthenticated; `x-blocks-key` only:

   ```json
   { "email": "user@example.com", "captchaCode": "<if tenant requires captcha — blocks-os>" }
   ```

   Sends a recovery link to the registered address. `mailPurpose` optionally selects
   a mail template variant. Response undocumented — inspect live. UX note: treat the
   response as success regardless of whether the email exists (don't leak account
   existence in your UI).

2. The email links to your app's recovery page (tenant setting `recoverAccountPath` /
   `accountActionBaseUrl` in `POST /api/auth/config`; link validity =
   `recoverAccountUrlLifetimeInMinutes`). The link carries a recovery `code`.

3. `POST /api/auth/reset-password` — from your recovery page:

   ```json
   {
     "code": "<recovery code from the link>",
     "password": "<new password>",
     "captchaCode": "<if required>",
     "logoutFromAllDevices": true
   }
   ```

   `logoutFromAllDevices: true` revokes existing sessions — recommended default for
   a compromised-password scenario. The new password must satisfy the tenant's
   `passwordStrengthCheckerRegex`. Response undocumented — inspect live; expect 4xx
   for an invalid/expired code.

4. Log in with the new password (`POST /api/auth/login` — see
   [embedded-login.md](embedded-login.md)).

## Path B — Authenticated password change

1. `POST /api/auth/change-password` — Bearer token required:

   ```json
   { "oldPassword": "<current>", "newPassword": "<new>" }
   ```

   The current password is re-validated server-side. Response undocumented —
   inspect live.

2. If the tenant's auth config has `logoutOnPasswordChange: true`, expect the
   session to be invalidated — send the user back through login (or refresh and
   verify). Check the setting via `GET /api/auth/config` (admin).

## Related admin knobs (`POST /api/auth/config`)

`recoverAccountPath`, `accountActionBaseUrl`, `recoverAccountUrlLifetimeInMinutes`,
`passwordStrengthCheckerRegex`, `logoutOnPasswordChange`,
`getNumberOfWrongAttemptsToLockTheAccount`, `accountLockDurationInMinutes`.

## Verify

- `POST /api/auth/login` succeeds with the new password and fails with the old one.
- If `logoutFromAllDevices` was set: the pre-reset refresh token is rejected by
  `POST /api/auth/refresh`.
- Admin: the event appears in `GET /api/iam/history?Filter.UserId=<id>`, and the
  user record's `passwordChangedAtUtc` updates (visible via `GET /api/iam/users/{id}`).
