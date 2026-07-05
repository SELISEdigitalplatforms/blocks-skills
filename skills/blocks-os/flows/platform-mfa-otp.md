# Enable platform MFA and run an OTP verify cycle

Configure MFA for a project and drive the platform OTP engine: generate a one-time code for a user, resend if needed, and verify it. Includes the TOTP (authenticator-app) setup branch.

Scope note: this is the **platform** MFA controller (PascalCase `/Mfa/*`). The login-time MFA handshake inside applications — where `POST /iam/v4/auth/login` returns an MFA requirement and you pass `mfa_id`/`mfa_code`/`mfa_type` back — is owned by **blocks-iam** (lowercase `/mfa/*`). Use this flow when configuring MFA for a project or building a custom verification step (e.g. step-up confirmation for a sensitive action, migration verification).

Preconditions: `x-blocks-key` + bearer token; the target user's `userId` (from blocks-iam, e.g. `GET /iam/v4/auth/me`); `projectKey` of the project (projectKey = your Blocks Key — the same value as `x-blocks-key`).

## Steps

1. **`GET /Mfa/Get`** — read the project's current MFA configuration ([endpoints.md#mfa](../endpoints.md#mfa)). Response: `{ enableMfa, userMfaType, mfaTemplate }`. `userMfaType` is an array of `0 | 1 | 2` — the member names are not published in swagger; observe your project's values before assuming meanings.
2. **`POST /Mfa/Save`** — enable/adjust MFA: `{ enableMfa: true, userMfaType: [...], mfaTemplate: { templateName, templateId }, projectKey }`. `mfaTemplate` points at the message template used to deliver codes (templates are managed in blocks-utilities / OS portal). Response is `BaseResponse` — check `isSuccess`.
3. **`POST /Mfa/GenerateOTP`** — start a cycle: `{ userId, projectKey, mfaType, sendPhoneNumberAsEmailDomain }`. `mfaType` is `0–4` (int enum, unverified meanings). Response: `{ mfaId, isSuccess, errors }`. Keep `mfaId` — it identifies this OTP cycle. The code itself is delivered to the user out-of-band (per template/channel), never returned by the API.
4. **(Optional) `POST /Mfa/ResendOtp`** — `{ mfaId, sendPhoneNumberAsEmailDomain }` if the code didn't arrive. Returns a `mfaId` again — use the returned value for subsequent calls.
5. **`POST /Mfa/VerifyOTP`** — `{ verificationCode: "<user input>", mfaId, authType, projectKey, isFromTokenCall }`. `authType` uses the same `0–4` union as `mfaType`. Response: `{ isValid, userId, isSuccess, errors }`. Treat the cycle as passed only when `isSuccess && isValid`.

### TOTP (authenticator app) branch

- **`GET /Mfa/SetUpTotp?ProjectKey=<key>&UserId=<id>`** — returns `{ qrImageUrl, qrCode, isSuccess, errors }`. Show the QR (image URL or raw code for manual entry) to the user; they scan it into their authenticator app. Verify the first generated code via `POST /Mfa/VerifyOTP` (step 5) to complete enrollment.

### Reset / disable branch

- **`POST /Mfa/DisableUserMfa`** — `{ userId, projectKey }` clears MFA for one user (e.g. lost device). Returns `BaseResponse`.
- To turn MFA off project-wide, `POST /Mfa/Save` with `enableMfa: false`.

### Enforcement branch

- To require MFA on specific platform endpoints: find configs via `POST /ApiEndpointConfig/GetList`, then set `isMfaRequired: true` via `POST /ApiEndpointConfig/Update` or `/BulkUpdate` ([endpoints.md#apiendpointconfig](../endpoints.md#apiendpointconfig)). Responses undocumented in swagger — verify live.

Error paths: `isSuccess: false` → read `errors`; wrong/expired code → `isValid: false` (regenerate via step 3 or resend via step 4); 401 → refresh token (blocks-setup).

## Verify

- `GET /Mfa/Get` reflects the saved configuration (`enableMfa: true`, expected `userMfaType`).
- A full Generate → deliver → VerifyOTP cycle returns `isValid: true` with the expected `userId`.
- For TOTP: a code from the enrolled authenticator app passes VerifyOTP.
