# Bootstrap a new SELISE Blocks project

Take a project from nothing to a verified, working API session: Cloud Portal setup → environment
variables → first login → smoke test. Run this once per project/environment; after that, use
[token-lifecycle](token-lifecycle.md) for the day-to-day loop.

Preconditions: a SELISE Cloud Portal account. No token needed — this flow produces the first one.

## Steps

### 1. Cloud Portal prerequisites (no API — portal UI)

The portal UI changes; treat the navigation below as approximate and **verify in portal UI**.

1. **Create a project** in the Cloud Portal (https://cloud.seliseblocks.com). Note the
   **project slug / short key** (e.g. `dbahjq`) — this is your `client_id` for all auth calls.
2. **Create an environment** (dev/stage/prod as offered). Each environment is isolated: its own
   Blocks Key, its own users, its own data.
3. **Copy the Blocks Key** for that environment. This becomes the `x-blocks-key` header value.
4. **Add a developer account** to the project with the **cloudadmin** role (role naming — verify
   in portal UI). This is the user you will log in as from code. Make sure the account is
   activated (it can sign in to the portal / has completed any activation email).

If any of these screens moved, look for equivalents under project settings / environments / team
members — the four outputs you need are: project slug, environment, Blocks Key, working user.

### 2. Write the .env

```bash
BLOCKS_API_URL=https://api.seliseblocks.com
X_BLOCKS_KEY=<Blocks Key from step 1.3>
PROJECT_SLUG=<project slug from step 1.1>
BLOCKS_USERNAME=<developer account email from step 1.4>
BLOCKS_PASSWORD=<its password>
```

Add `.env` to `.gitignore`. For React apps, additionally expose the client-safe subset with the
`VITE_` prefix (see SKILL.md — never `VITE_` the username/password).

**Browser app? Set up local HTTPS now.** The platform's auth cookies are Secure cookies — plain
`http://localhost` dev servers fail in confusing ways. One-time setup:
[local-https-setup](local-https-setup.md).

### 3. First login — `POST /iam/v4/api/auth/login`

Full request shape: `../../blocks-iam/endpoints.md#authentication`. Fields are snake_case by design.

```bash
curl -s -X POST "$BLOCKS_API_URL/iam/v4/api/auth/login" \
  -H "x-blocks-key: $X_BLOCKS_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"client_id\": \"$PROJECT_SLUG\",
    \"username\": \"$BLOCKS_USERNAME\",
    \"password\": \"$BLOCKS_PASSWORD\"
  }"
```

The 200 response shape is not documented in swagger — inspect the live response. Expect an access
token and a refresh token; keep both (verify the exact field names from the live payload before
wiring code to them).

**Branch — captcha demanded.** After failed attempts or by project policy, login can reject until
you supply `captcha_code`. Obtain/solve a captcha via the Captcha controller (canonical in the
`blocks-os` skill), then retry login with the extra field:

```json
{ "client_id": "...", "username": "...", "password": "...", "captcha_code": "<solved code>" }
```

**Branch — MFA challenge.** If the user has MFA enabled, the login response returns a challenge
instead of tokens (shape not documented in swagger — inspect it; expect an `mfa_id` and a type).
Complete the second step by calling login again with the challenge fields:

```json
{
  "client_id": "...", "username": "...", "password": "...",
  "mfa_id": "<from challenge>", "mfa_code": "<code the user entered>", "mfa_type": 0
}
```

`mfa_type` is an integer enum `0 | 1 | 2 | 3 | 4` — member meanings are not named in swagger; echo
back the value the challenge gave you. MFA enrollment/management endpoints (`/api/mfa/*`) live in
the `blocks-iam` skill.

**Branch — 401.** Wrong credentials or unactivated account. Fix in portal (step 1.4) or run
[activate-first-user](activate-first-user.md) (`POST /api/auth/activate`).

### 4. Smoke test — `GET /iam/v4/api/auth/me`

```bash
curl -s "$BLOCKS_API_URL/iam/v4/api/auth/me" \
  -H "x-blocks-key: $X_BLOCKS_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

Returns the authenticated user's OIDC claims (`sub`, `email`, `name`, plus custom Blocks claims —
response shape not documented in swagger; inspect the live response). A 200 with your user's
claims proves the whole chain: Blocks Key valid, environment correct, user active, token good.

### 5. Working across projects? Impersonate into the project

If you operate with a cloud-level account (one login, many projects), the session must be
**impersonated into the project's tenant** before project APIs behave as expected — see
[project-impersonation](project-impersonation.md) (cloud login → `GET /os/v4/api/Project/Gets`
for the `tenantId` → `POST /api/auth/impersonate`). If you logged in directly with the project's
own `client_id` (step 3) and everything works, you can skip this.

## Verify

- `GET /iam/v4/api/auth/me` returns 200 with claims matching the developer account.
- Optional deeper check: `GET /iam/v4/api/iam/me` (documented response `{ data, errors }`) returns
  your profile record; requires the same two headers.
- If `me` fails but login succeeded, you almost certainly mixed environments — the Blocks Key and
  the token must come from the same environment. See the troubleshooting table in SKILL.md.
