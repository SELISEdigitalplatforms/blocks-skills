# Set up SSO: external identity providers + Blocks as OIDC provider

Two directions — pick the part you need:

- **Part A (inbound SSO):** let users sign in to *your app* with Google / Azure AD /
  Okta / Apple, via identity providers registered in Blocks.
- **Part B (Blocks as provider):** register *your app* as an OIDC client of Blocks
  and run the standard authorize/token code flow.

Preconditions: admin Bearer token + `x-blocks-key` for all CRUD; you also need the
provider-side app registration (client id/secret, allowed redirect URIs) done in the
provider's console.

## Part A — External identity providers (inbound SSO)

Endpoints: endpoints.md → [Authentication](../endpoints.md#authentication)
(`/api/auth/identity-providers*`, `/api/auth/social/*`, `/api/auth/login-options`).

1. `POST /api/auth/identity-providers` — register the provider. Schema-required
   fields: `provider`, `providerType`, `clientId`, `clientSecret`,
   `tokenEndpointAuthMethod`. Typical config:

   ```json
   {
     "provider": "google",
     "providerType": "social",
     "protocol": "oidc",
     "displayName": "Sign in with Google",
     "isActive": true,
     "clientId": "<from provider console>",
     "clientSecret": "<from provider console>",
     "wellKnownUrl": "https://accounts.google.com/.well-known/openid-configuration",
     "redirectUris": ["https://app.example.com/auth/callback"],
     "scope": "openid email profile",
     "responseType": "code",
     "requirePkce": true,
     "tokenEndpointAuthMethod": "client_secret_post",
     "initialRoles": ["user"]
   }
   ```

   Either give `wellKnownUrl` (endpoints discovered) or spell out
   `issuer`/`authorizationUrl`/`tokenUrl`/`userInfoUrl`/`jwksUri` manually. The exact
   accepted values for `provider`/`providerType`/`protocol`/`tokenEndpointAuthMethod`
   are not enumerated in swagger — mirror what the Cloud Portal produces or verify
   live. `initialRoles`/`initialPermissions` are granted to just-in-time-provisioned
   users. Apple needs the extra `teamId`, `keyId`, `privateKey`, `appleAudience`
   fields. The platform validates the config and tests the JWKS endpoint on save
   (response undocumented — inspect live).

2. Manage: `GET /api/auth/identity-providers` (list), `GET /{id}` (single — secrets
   are never returned), `PUT /{id}` (update; send the full config again),
   `PATCH /api/auth/identity-providers/{id}/status` with `{ "isActive": false }` to
   disable without deleting (preferred over deletion; no DELETE route exists in v4).

3. `GET /api/auth/login-options` — public, unauthenticated. Confirm the provider now
   appears with its metadata (response undocumented — inspect live). Drive your login
   screen's SSO buttons from this endpoint instead of hardcoding.

4. Runtime login round trip (your UI, API pattern):
   1. `GET /api/auth/social/initiate?clientId=<PROJECT_SLUG>&redirectUri=<your callback>` —
      generates PKCE + state and returns the provider authorization URL (response
      undocumented — inspect live). Redirect the browser there.
   2. Provider authenticates the user and redirects back to your app with
      `code` + `state`.
   3. `POST /api/auth/social/callback` with snake_case body
      `{ "client_id", "code", "state", "provider" }` — exchanges the code, validates
      the JWT, creates/updates the user, and sets a secure HTTP-only token cookie.
      If the account has MFA, resubmit with `mfa_id`/`mfa_code`/`mfa_type` like
      embedded login ([embedded-login.md](embedded-login.md)).

   Alternative hosted pattern: `GET /api/idp/initiate?clientId=&redirectUri=` with the
   platform handling the return at `GET /api/idp/callback` (endpoints.md →
   [Idp](../endpoints.md#idp)); UI hints via `GET /api/idp/oidc-ui-config`.

5. SSO signups: allow them via `POST /api/iam/signup-settings`
   (`isSSoSignUpEnabled: true`, plus default roles). The signup body's `isSsoSignup`,
   `provider`, `externalUserId` fields support explicit SSO-driven registration.

## Part B — Blocks as the OIDC provider (your app as client)

Endpoints: endpoints.md → [OidcClients](../endpoints.md#oidcclients),
[Authorization](../endpoints.md#authorization), [Discovery](../endpoints.md#discovery),
[IdpSession](../endpoints.md#idpsession).

1. `POST /api/oidc-clients` — upsert your app's client registration: `redirectUris`,
   `postLogoutRedirectUris`, `allowedScopes`, `allowedResponseTypes`,
   `requirePkce: true`, `requireConsent`, `clientDisplayName`, optional
   `requireMfa` + `allowedMfaMethods` (numeric enum values). Returns the generated
   client secret per the endpoint description (schema undocumented — capture it from
   the live response; later GETs exclude it). List/read/delete via
   `GET /api/oidc-clients`, `GET|DELETE /api/oidc-clients/{clientId}` (delete revokes
   all issued tokens, irreversible).

2. Discovery for your client library:
   `GET /{tenant_id}/.well-known/openid-configuration` — returns
   `authorization_endpoint`, `token_endpoint`, `jwks_uri`, etc. Validate tokens
   against `GET /{tenant_id}/.well-known/jwks.json`.

3. Code flow: send the browser to `GET /api/oidc/authorize` with the standard query
   params (`client_id`, `response_type=code`, `redirect_uri`, `scope`, `state`,
   `nonce`, `code_challenge`, `code_challenge_method`, optional `prompt`,
   `tenant_id`); receive the code on your redirect URI; exchange at
   `POST /api/oidc/token` (supports authorization_code and refresh_token grants; the
   request body is not documented in swagger — standard RFC 6749 form-encoded params
   are the expected shape, but verify against your project). For headless/API-based
   flows, `POST /api/oidc/login` authenticates credentials and issues the
   authorization code in one call (snake_case body incl. `code_challenge`, plus
   `mfa_id`/`mfa_code`/`captcha_code` branches).

4. Session management (hosted login, multi-account): `GET /api/oidc/session`,
   `GET /api/oidc/session/accounts`, `POST /api/oidc/session/account/add`,
   `POST /api/oidc/session/account/select`, `DELETE /api/oidc/session/accounts/{userId}`,
   and `POST /api/oidc/session/revoke` (logout of all accounts in the session).
   These return typed shapes and RFC 7807 `ProblemDetails` on 4xx — see
   endpoints.md → [IdpSession](../endpoints.md#idpsession).

## Verify

- Part A: `GET /api/auth/login-options` lists the provider; complete one social
  login round trip and confirm `GET /api/auth/me` returns claims; the new user shows
  `externalIdentities` (admin: `GET /api/iam/users/{id}`) and got `initialRoles`.
- Part B: `.well-known/openid-configuration` resolves for your `tenant_id`;
  authorize → token round trip yields tokens that pass
  `POST /api/oidc/introspect` (see [machine-to-machine.md](machine-to-machine.md)).
