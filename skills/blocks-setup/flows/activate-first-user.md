# Activate the first user account

When the developer account created during [bootstrap-project](bootstrap-project.md) returns 401 on
login despite correct credentials, the usual cause is that it never completed activation. This flow
takes an unactivated account to a working login: validate the code → activate → (resend if needed).

Preconditions: the user exists in the project environment (created in the Cloud Portal or via the
`blocks-iam` user endpoints); `.env` with `BLOCKS_API_URL` and `X_BLOCKS_KEY`. No user token needed —
activation runs before the user can log in.

Exact request shapes: `../../blocks-iam/endpoints.md#authentication`.

**Casing gotcha:** activation bodies are camelCase (`captchaCode`, `activationCode`) — unlike
login's snake_case `captcha_code`. And the code field is named `code` on `activate` but
`activationCode` on `validate-activation`. Both verbatim from swagger; copy, don't normalize.

## Steps

### 1. Get the activation code

The platform emails an activation code when the user is created. If the email never arrived,
jump to the resend branch (step 4).

### 2. (Optional) Check the code — `POST /iam/v4/api/auth/validate-activation`

Checks validity **without** activating — useful before prompting the user for a password.

```bash
curl -s -X POST "$BLOCKS_API_URL/iam/v4/api/auth/validate-activation" \
  -H "x-blocks-key: $X_BLOCKS_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "activationCode": "<code from the email>" }'
```

- 200 — code is valid; proceed to step 3.
- 400 — invalid or expired → resend branch (step 4).

Response bodies are not documented in swagger for either status — inspect the live response.

### 3. Activate — `POST /iam/v4/api/auth/activate`

Consumes the code, sets the password, and marks the account active.

```bash
curl -s -X POST "$BLOCKS_API_URL/iam/v4/api/auth/activate" \
  -H "x-blocks-key: $X_BLOCKS_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "code": "<activation code>", "password": "<new password>" }'
```

Optional request fields (see endpoints.md for the full shape): `firstName`, `lastName`,
`captchaCode` (if the project demands a captcha — solve via the `blocks-os` Captcha controller),
`mailPurpose`, `preventPostEvent`.

- 200 — account activated; the user can log in (response shape not documented in swagger).
- 400 — invalid or expired code → resend branch (step 4).

### 4. Branch — resend — `POST /iam/v4/api/auth/resend-activation`

Generates a new activation code and emails it to the user.

```bash
curl -s -X POST "$BLOCKS_API_URL/iam/v4/api/auth/resend-activation" \
  -H "x-blocks-key: $X_BLOCKS_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "userId": "<the user'\''s id>" }'
```

Get the `userId` from the Cloud Portal user list, or via the `blocks-iam` user query endpoints
(`POST /api/iam/users`). Then repeat steps 2–3 with the code from the **newest** email.

- 400 — user not found **or already activated**. If already activated, the login 401 has a
  different cause (wrong password, wrong environment) — see the troubleshooting table in SKILL.md.

Forgot the password of an already-active account? That is recovery, not activation:
`POST /api/auth/recover` + `POST /api/auth/reset-password` — documented in `blocks-iam`.

## Verify

- `POST /iam/v4/api/auth/login` with the account's credentials returns tokens instead of 401
  (response shape not documented in swagger — inspect the live payload).
- `GET /iam/v4/api/auth/me` with the new access token returns 200 with the user's claims — this is
  the same smoke test as [bootstrap-project](bootstrap-project.md) step 4.
- If login still 401s after a successful activation, re-check credentials and environment
  (Blocks Key and login must target the same environment).
