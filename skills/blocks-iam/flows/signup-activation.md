# Sign up a user, activate the account, first login

Use for self-service registration in your app. Key design fact (visible in the
schemas): `POST /api/auth/signup` takes **no password** — the user receives an
activation email and sets their password in the activation step.

Preconditions: `X_BLOCKS_KEY`; signup itself is unauthenticated. Signup must be
enabled for the tenant (step 1). Admin-created accounts are covered at the end.
All bodies on this page are **camelCase** (unlike the token flows).

## Steps

1. *(Admin, once)* Check/enable signup: `GET /api/iam/signup-settings` (response
   is an untyped `object` in swagger — inspect live). To change it,
   `POST /api/iam/signup-settings`:

   ```json
   {
     "isEmailPasswordSignUpEnabled": true,
     "isSSoSignUpEnabled": false,
     "defaultRolesForNewUserOnSignUp": ["user"],
     "defaultPermissionsForNewUserOnSignUp": []
   }
   ```

   Returns `{ isSuccess, errors, itemId }`. Activation email link targets come from
   `POST /api/auth/config` (`accountActivationPath`, `accountActionBaseUrl`,
   `activationUrlLifetimeInMinutes`).

2. *(Optional UX)* `GET /api/iam/email/available?Email=user@example.com` — check for
   an existing account before submitting (response undocumented — inspect live).

3. `POST /api/auth/signup` (endpoints.md → [Authentication](../endpoints.md#authentication)):

   ```json
   {
     "email": "user@example.com",
     "firstName": "Ada",
     "lastName": "Lovelace",
     "phoneNumber": "+41790000000",
     "captchaCode": "<if tenant requires captcha — see blocks-os>"
   }
   ```

   Optional extras: `createOrganizationDuringSignup: true` with `organizationName` /
   `organizationDescription` (creates the user's org at signup, if org creation from
   signup is allowed in `POST /api/iam/organizations/config`); `attributes` for
   custom metadata; `isSsoSignup` + `provider` + `externalUserId` are for SSO-driven
   signup (see [sso-identity-providers.md](sso-identity-providers.md)). `mailPurpose`
   selects which mail template variant is sent. Response undocumented — inspect live.

4. The platform emails an activation link containing a `code`. In the page your app
   serves at the activation path:
   - *(Optional)* `POST /api/auth/validate-activation` with
     `{ "activationCode": "<code>" }` — 200 = valid, 400 = invalid/expired. Do this
     before rendering the set-password form so expired links fail fast.
   - `POST /api/auth/activate`:

     ```json
     { "code": "<code>", "password": "<new password>", "captchaCode": "<if required>" }
     ```

     `firstName`/`lastName` can be supplied here too if you kept signup minimal.
     200 = account active; 400 = invalid or expired code. Password must satisfy the
     tenant's `passwordStrengthCheckerRegex` (see `GET /api/auth/config`).

5. **Branch — email never arrived.** `POST /api/auth/resend-activation` with
   `{ "userId": "<id>", "mailPurpose": "signup" }` (400 if the user is unknown or
   already active). Getting the `userId` requires an admin lookup:
   `POST /api/iam/users` with `{ "filter": { "email": "user@example.com" } }`.

6. First login: `POST /api/auth/login` with snake_case
   `{ "client_id", "username", "password" }` — continue in
   [embedded-login.md](embedded-login.md).

## Alternative: admin-created users

For invite-style onboarding, skip signup and call `POST /api/iam/users/create`
(Bearer + admin role) — endpoints.md → [Iam](../endpoints.md#iam). Useful fields:
`email`, `firstName`, `lastName`, `roles`, `permissions`, `organizationId`,
`password` (or leave unset and let the user set it via the activation/recovery
mail — `userPassType` and `userCreationType` are numeric enums with unpublished
member names; verify values against live behavior). Then manage membership with
`POST /api/iam/users/org-update` and `POST /api/iam/users/roles-and-permissions`.

## Verify

- `POST /api/auth/login` with the new credentials succeeds and `GET /api/auth/me`
  returns the expected claims.
- Admin: `POST /api/iam/users` filtered by email shows the account with
  `active: true` / expected `verifiedType` (numeric enum — observe live).
- `GET /api/iam/email/available?Email=<same email>` now reports it as taken.
