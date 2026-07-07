# Bootstrap a new SELISE Blocks project (guided)

Take a project from nothing to a verified, working API session: OS portal setup → environment
variables → first login → smoke test. Run this once per project/environment; after that, use
[token-lifecycle](token-lifecycle.md) for the day-to-day loop.

**This is a guided flow — drive it interactively.** At each step: check what already exists,
tell the user exactly what to do (one thing at a time), wait for their confirmation, validate,
then move on. Never print secret values back to the user; refer to vars by name only.

Preconditions: a SELISE Blocks OS portal account. No token needed — this flow produces the first one.

> **If you are an automated agent (Claude/CI) that doesn't yet know which project to work
> against**, do **not** start at step 1. The first login for an agent is the agent-only
> `POST https://api.seliseblocks.com/iam/v4/auth-login` endpoint (PascalCase body, no
> `x-blocks-key`), used to enumerate the projects/tenants the operator account can access. Full
> details in [SKILL.md → Agent-only login](../SKILL.md#agent-only-login--enumerating-projects)
> and [project-impersonation.md](project-impersonation.md). The steps below are for end-user /
> application flows and use the standard OIDC/SSO login from `blocks-iam`.

## Steps

### 1. OS portal prerequisites (no API — portal UI, user does this)

The portal UI changes; treat the navigation below as approximate and **verify in portal UI** —
if a screen isn't where described, ask the user what they see and adapt.

Ask the user to do these in the OS portal (https://os.seliseblocks.com), one at a time,
confirming each:

1. **Create a project** (or open the existing one).
2. **Create an environment** (dev/stage/prod as offered). Each environment is isolated: its own
   Blocks Key, its own users, its own data.
3. **Copy the Blocks Key** for that environment — say: *"Copy the Blocks Key for the environment
   you'll develop against and paste it into `.env` as `X_BLOCKS_KEY=` (I won't echo it back)."*
4. **Add a developer account** to the project that can log in (role naming varies — verify in
   portal UI; it needs enough privilege for the APIs you'll call). Make sure the account is
   activated (it can sign in to the portal / has completed any activation email).

The three outputs you need before continuing: environment created, Blocks Key in hand, a working
user account.

### 2. Write the .env — then check it

Have the user create `.env` (or create it for them and tell them exactly which values to fill):

```bash
BLOCKS_API_URL=https://api.seliseblocks.com
X_BLOCKS_KEY=<Blocks Key from step 1.3>
BLOCKS_USERNAME=<developer account email from step 1.4>
BLOCKS_PASSWORD=<its password>
```

Add `.env` to `.gitignore`. For React apps, additionally expose the client-safe subset with the
`VITE_` prefix (see SKILL.md — only `VITE_BLOCKS_API_URL` and `VITE_X_BLOCKS_KEY`; never `VITE_`
the username/password).

**Validate before continuing** (report which names fail, never the values):
- all four vars present, non-empty, no `<placeholder>` text left;
- `BLOCKS_API_URL` is exactly `https://api.seliseblocks.com`;
- no deprecated vars introduced (`PROJECT_SLUG`, `VITE_PROJECT_SLUG`, `VITE_PROJECT_KEY`,
  `BLOCKS_CLOUD_CLIENT_ID` — see SKILL.md).

If anything is missing → send the user back to the exact portal step that produces it, then
re-check.

**Browser app? Set up local HTTPS now.** The platform's auth cookies are Secure cookies — plain
`http://localhost` dev servers fail in confusing ways. One-time setup:
[local-https-setup](local-https-setup.md).

### 3. First login — `POST /iam/v4/auth/login`

Full request shape: `../../blocks-iam/endpoints.md#authentication`. Fields are snake_case by
design. **No project identifier goes in the body** — the `x-blocks-key` header carries the
project context (the swagger's optional `client_id` field stays unused).

```bash
curl -s -X POST "$BLOCKS_API_URL/iam/v4/auth/login" \
  -H "x-blocks-key: $X_BLOCKS_KEY" \
  -H "Content-Type: application/json" \
  -d "{
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
{ "username": "...", "password": "...", "captcha_code": "<solved code>" }
```

**Branch — MFA challenge.** If the user has MFA enabled, the login response returns a challenge
instead of tokens (shape not documented in swagger — inspect it; expect an `mfa_id` and a type).
Complete the second step by calling login again with the challenge fields:

```json
{
  "username": "...", "password": "...",
  "mfa_id": "<from challenge>", "mfa_code": "<code the user entered>", "mfa_type": 0
}
```

`mfa_type` is an integer enum `0 | 1 | 2 | 3 | 4` — member meanings are not named in swagger; echo
back the value the challenge gave you. MFA enrollment/management endpoints (`/mfa/*`) live in
the `blocks-iam` skill.

**Branch — 401.** Wrong credentials or unactivated account. Ask the user to re-check the account
in the portal (step 1.4) or run [activate-first-user](activate-first-user.md)
(`POST /auth/activate`).

### 4. Smoke test — `GET /iam/v4/auth/me`

```bash
curl -s "$BLOCKS_API_URL/iam/v4/auth/me" \
  -H "x-blocks-key: $X_BLOCKS_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

Returns the authenticated user's OIDC claims (`sub`, `email`, `name`, plus custom Blocks claims —
response shape not documented in swagger; inspect the live response). A 200 with your user's
claims proves the whole chain: Blocks Key valid, environment correct, user active, token good.
Tell the user setup is verified — and only then start building.

### 5. Working across projects? Impersonate into the project

If you operate with an account that spans projects, the session must be **impersonated into the
project's tenant** before project APIs behave as expected — see
[project-impersonation](project-impersonation.md) (login → `GET /os/v4/Project/Gets`
for the `tenantId` → `POST /auth/impersonate`). If step 3's login already works against your
project's APIs directly, you can skip this.

## Verify

- `GET /iam/v4/auth/me` returns 200 with claims matching the developer account.
- Optional deeper check: `GET /iam/v4/iam/me` (documented response `{ data, errors }`) returns
  your profile record; requires the same two headers.
- If `me` fails but login succeeded, you almost certainly mixed environments — the Blocks Key and
  the token must come from the same environment. See the troubleshooting table in SKILL.md.
