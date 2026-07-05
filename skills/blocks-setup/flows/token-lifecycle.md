# Manage the token lifecycle (login → use → refresh → logout)

The day-to-day auth loop every Blocks client runs. Use after [bootstrap-project](bootstrap-project.md)
has produced working credentials. All endpoint shapes: `../../blocks-iam/endpoints.md#authentication`.

Preconditions: `.env` with `BLOCKS_API_URL`, `X_BLOCKS_KEY`, and login credentials.
Every call below also carries `x-blocks-key: $X_BLOCKS_KEY`.

Note: if you use the login → tenant-impersonation model
([project-impersonation](project-impersonation.md)), this same lifecycle applies to whichever
session is active — but whether refresh preserves the impersonated (project-scoped) context is
not documented in swagger; verify against your project, and re-impersonate after a full re-login.

## Steps

### 1. Login — `POST /iam/v4/api/auth/login`

Body (snake_case): `{ username, password }` — no project identifier; the `x-blocks-key` header
carries project context — plus `captcha_code` / `mfa_id` / `mfa_code`
/ `mfa_type` on the branch paths (see bootstrap-project for those branches).

Response 200 is not documented in swagger — inspect the live response. Keep two things:
- the **access token** (short-lived JWT) — goes into `Authorization: Bearer …`
- the **refresh token** — the only thing worth persisting

### 2. Use the access token

Every authenticated call to any service:

```
x-blocks-key: <X_BLOCKS_KEY>
Authorization: Bearer <access_token>
```

Access tokens are JWTs — you can decode the payload locally to read `exp` and refresh proactively
instead of waiting for a 401. Token lifetimes are configured per project via
`POST /iam/v4/api/auth/config` (`accessTokenValidForNumberMinutes`,
`refreshTokenValidForNumberMinutes`, …) — admin operation, documented in blocks-iam.

### 3. Refresh — `POST /iam/v4/api/auth/refresh`

When the access token expires (proactively on `exp`, or reactively on a 401):

```bash
curl -s -X POST "$BLOCKS_API_URL/iam/v4/api/auth/refresh" \
  -H "x-blocks-key: $X_BLOCKS_KEY" \
  -H "Content-Type: application/json" \
  -d "{ \"refresh_token\": \"$REFRESH_TOKEN\" }"
```

Response 200 is not documented in swagger — inspect the live response; expect fresh tokens. If a
new refresh token is returned, **replace** the stored one (assume rotation). If refresh itself
returns 401, the refresh token is expired or revoked — drop all stored tokens and go back to
step 1 (full login).

### 4. Store tokens

| Context | Access token | Refresh token |
|---|---|---|
| Server / CLI script | process memory only | process memory, or OS keychain / secret store for long-lived tools |
| Browser SPA | JS memory only (never localStorage) | persisted (e.g. Zustand `persist`) so sessions survive reloads — see [references/react.md](../references/react.md) |

Never write tokens to logs, git, or `VITE_`-prefixed env vars.

### 5. Logout — `POST /iam/v4/api/auth/logout`

Revokes the refresh token, invalidates the session, clears cookies. **Note the casing**: this body
is camelCase `refreshToken`, unlike login/refresh — verbatim from swagger:

```bash
curl -s -X POST "$BLOCKS_API_URL/iam/v4/api/auth/logout" \
  -H "x-blocks-key: $X_BLOCKS_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{ \"refreshToken\": \"$REFRESH_TOKEN\" }"
```

Then delete both tokens from local storage/state. To revoke **every** session for the user
(all devices): `POST /iam/v4/api/auth/logout-all` with body `{ "useBackchannel": false }`.

## Error paths

- **401 on a business call** → refresh (step 3), retry the call once. Don't loop: if the retry
  401s again, force full re-login.
- **401 on refresh** → refresh token dead; clear state, full login.
- **403** → authenticated but not authorized; a role/permission problem, not a token problem —
  see blocks-iam.
- Concurrent refreshes (e.g. several tabs / parallel requests) can race if tokens rotate:
  single-flight the refresh call (one in-flight promise shared by all callers) —
  [references/react.md](../references/react.md) implements this.

## Verify

- After login or refresh: `GET /iam/v4/api/auth/me` returns 200 with the user's claims.
- After logout: `POST /iam/v4/api/auth/refresh` with the revoked token returns an error (expect
  401 — exact status/shape not documented in swagger), proving revocation took effect.
