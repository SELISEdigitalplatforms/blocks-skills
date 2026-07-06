# Machine-to-machine auth: client credentials, user codes, introspection

Use when a backend service, CLI, cron job, or another API needs to call Blocks
without a human logging in. Also covers token introspection/revocation for
resource servers.

Preconditions: admin Bearer token + `x-blocks-key` to manage credentials. The
consuming service itself only stores the issued credential — never a user's password.

## Steps — service credential lifecycle

Endpoints: endpoints.md → [Authentication](../endpoints.md#authentication)
(`/auth/client-credentials*`).

1. `POST /auth/client-credentials` — create the credential:

   ```json
   {
     "name": "billing-worker",
     "roles": ["api-consumer"],
     "permissionsByOrg": { "<orgId>": ["invoice.read", "invoice.write"] }
   }
   ```

   Returns only `{ isSuccess, errors }` — **the secret is not in the create
   response.**

2. `GET /auth/client-credentials` — list credentials; each item includes
   `itemId`, `name`, `clientSecret`, `roles`, `permissionsByOrg`, `isActive`,
   `audiences`. Capture the new credential's `clientSecret` immediately and store it
   in a secret manager (server-side env var — never in client bundles or `VITE_` vars).

3. Token exchange for the service: **not documented in the v4 swagger.**
   `POST /oidc/token` is the platform's OAuth 2.0 token endpoint, but its
   description lists only authorization_code and refresh_token grants, and no request
   schema is published. Whether M2M credentials use a client_credentials grant there
   (RFC 6749 §4.4, form-encoded `grant_type=client_credentials` + client id/secret)
   must be verified against your project / OS portal docs before you build on it.
   Inspect a working exchange (or ask SELISE support) and pin what you observe.

4. Rotate by creating a replacement credential, migrating the consumer, then
   `POST /auth/client-credentials/delete` with `{ "itemId": "<old credential>" }`
   (returns `{ isSuccess, errors }`).

## Alternative — short-lived user codes

For device-style or delegated short-lived access tied to a user
(endpoints.md → [Authentication](../endpoints.md#authentication)):

1. `POST /auth/user-codes` with
   `{ "clientId": "<client id>", "codeTtlInMinute": 15, "note": "cli-pairing" }`
   → `{ isSuccess, errors }`. `clientId` here identifies the OAuth client app the
   code is issued for (not a project identifier, and not an env var).
2. `GET /auth/user-codes` — items carry `code`, `userId`, `clientId`,
   `expiryDate`, `note`. How a code is redeemed for a token is not documented in the
   v4 swagger — verify the redemption endpoint against your project before relying
   on this mechanism.

## Resource-server side — introspection & revocation

Endpoints: endpoints.md → [TokenManagement](../endpoints.md#tokenmanagement).
None of the three has a documented request/response schema; they reference the RFCs,
so expect standard form-encoded `token` parameters — verify live.

- `POST /oidc/introspect` — RFC 7662 token introspection: authorized clients ask
  whether a token is active and get its claims/metadata. Use in APIs that accept
  Blocks-issued tokens but want server-side validation beyond local JWT checks.
  (For local validation, fetch keys from `GET /{tenant_id}/.well-known/jwks.json` —
  endpoints.md → [Discovery](../endpoints.md#discovery).)
- `POST /oidc/revoke` — RFC 7009 revocation of access/refresh tokens (e.g. on
  credential compromise).
- `GET /oidc/revocation-history` — audit trail of revocations.

## Verify

- `GET /auth/client-credentials` shows the credential with `isActive: true` and
  the expected `roles`/`permissionsByOrg`.
- After deletion, the credential no longer appears in the list.
- A token you revoked via `POST /oidc/revoke` subsequently introspects as
  inactive via `POST /oidc/introspect` (exact response field undocumented —
  RFC 7662 uses `active: false`; confirm live).
