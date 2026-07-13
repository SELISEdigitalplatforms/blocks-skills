# Ensure a blocks-oidc identity provider (client + provider)

End state: the project has an active `blocks-oidc` identity provider, so the app can do authorization-code SSO. Preconditions: an impersonated project token from **[get-into-project.md](get-into-project.md)** — you have the `hdr` array (`x-blocks-key: $ACCOUNT_TENANT` + Bearer `$PTOK`), `$PTENANT` (project tenant id for `projectKey`), and `$ACCOUNT_TENANT`. All calls target `https://api.seliseblocks.com/iam/v4`.

> **Config header guard:** IAM configuration uses **`x-blocks-key: $ACCOUNT_TENANT`** (root tenant) + **`Authorization: Bearer $PTOK`**. Put **`projectKey: $PTENANT`** in bodies. Never send `$PTENANT` as `x-blocks-key` on these admin calls. Run `assert_config_scope` before identity-provider and OIDC-client calls.

The logic is a short decision tree: **provider exists? → done. else client exists? → create provider from it. else → create client, then provider.**

## Step 1 — Is a blocks-oidc provider already there?

```bash
curl -s "$BLOCKS_API_URL/iam/v4/auth/identity-providers" "${hdr[@]}"
```
Response: `{ data: [ { provider, providerType, clientId, clientSecret, ... } ] }`.

- If any entry has **`providerType: "blocks-oidc"`** (and `isActive: true`) → **SSO is already configured; stop here** and go implement it ([blocks-iam-sso-oidc-implementation](../../blocks-iam-sso-oidc-implementation/SKILL.md)).
- The default `blocks-idp` entry (`providerType: "oidc"`) does **not** count — keep going.

## Step 2 — Is there an OIDC client to reuse?

```bash
curl -s "$BLOCKS_API_URL/iam/v4/oidc-clients" "${hdr[@]}"
```
Response: `{ oIDCClientCredentials: [ { clientId, clientSecret, redirectUris, allowedScopes, ... } ] }`.

- A usable client exists (its `redirectUris` include your app's callback) → keep its `clientId`, `clientSecret`, `redirectUris` and skip to **step 4**.
- Otherwise → **step 3** to create one.

## Step 3 — Create the OIDC client

The app's callback URL should match the **applicationDomain** from `Project/Gets`: `projects[].applications[].domain` on the target project/environment (often `https://dfsgso.slsblx.com` — use the full URL for `redirectUris`; ask the user if multiple `applications` exist). See [blocks-frontend-local-https](../../blocks-frontend-local-https/flows/setup-local-https.md) for domain resolution.

```bash
curl -s -X POST "$BLOCKS_API_URL/iam/v4/oidc-clients" "${hdr[@]}" -H "Content-Type: application/json" --data-raw '{
  "audience": "",
  "redirectUris": ["https://your.application-domain.com/callback"],
  "scope": "openid",
  "isAutoRedirect": true,
  "isActive": true,
  "requirePkce": true,
  "allowedResponseTypes": ["code"],
  "allowedServiceAccessResources": [
    "blocks-iam","blocks-monitor","blocks-data","blocks-utilities",
    "blocks-agent","blocks-os","blocks-localization","blocks-release"
  ],
  "itemId": "",
  "projectKey": "'"$PTENANT"'",
  "clientBrandColor": "#124091",
  "clientDisplayName": "My App SSO Client"
}'
```
- **`projectKey` = `$PTENANT`** (the project tenant id) — **not** `ACCOUNT_TENANT`.
- `redirectUris` must be your app's real callback URL(s); they have to match at every later step and at runtime.
- `allowedServiceAccessResources` = the Blocks services the SSO'd session may reach — trim to what the app needs.
- Keep `clientId` and `clientSecret` from the response for step 4.

## Step 4 — Create the blocks-oidc identity provider

Build `wellKnownUrl` from **`$PTENANT`** — the same project tenant id you impersonated into (`targeted_tenant_id`), **not** the root/account tenant (`$ACCOUNT_TENANT`):

```
https://iam.seliseblocks.com/$PTENANT/.well-known/openid-configuration
```

Use `$PTENANT` exactly as returned from `Project/Gets` (it may include a leading environment letter, e.g. `D87e3f79b6730453f91425c16c38d6375`). Do **not** strip or transform it into a `T<hex>` form.

Confirm it resolves first:
```bash
curl -s "https://iam.seliseblocks.com/$PTENANT/.well-known/openid-configuration" \
  -H "x-blocks-key: $ACCOUNT_TENANT" | head -c 120   # expect OIDC discovery JSON
```

Then create the provider:
```bash
curl -s -X POST "$BLOCKS_API_URL/iam/v4/auth/identity-providers" "${hdr[@]}" -H "Content-Type: application/json" --data-raw '{
  "displayName": "Sign in with SSO",
  "providerType": "blocks-oidc",
  "provider": "my-app-sso",
  "clientId": "<clientId from step 2/3>",
  "clientSecret": "<clientSecret from step 2/3>",
  "audience": "",
  "wellKnownUrl": "https://iam.seliseblocks.com/'"$PTENANT"'/.well-known/openid-configuration",
  "tokenEndpointAuthMethod": "client_secret_basic",
  "scope": "openid",
  "redirectUris": ["https://your.application-domain.com/callback"],
  "isActive": true,
  "requirePkce": false,
  "initialRoles": ["user"],
  "initialPermissions": []
}'
```
- `provider` is any stable string identifier for this provider; `displayName` is what the login button/screen shows.
- `requirePkce: false` on the **provider** record (the OIDC client carries `requirePkce: true`; the runtime `initiate` still issues a PKCE challenge).
- `initialRoles` / `initialPermissions` are granted to users who first sign in through this provider.

## Verify

- `GET /iam/v4/auth/identity-providers` → an entry with `providerType: "blocks-oidc"`, `isActive: true`, your `clientId` and `redirectUris`.
- Smoke-test the runtime entry point (no session needed) — pass `x-blocks-key` as **both** a query param and a header using **`$PTENANT`** (the public project key for runtime, not the root tenant): `GET /iam/v4/idp/initiate?x-blocks-key=<PTENANT>&clientId=<clientId>&redirectUri=<callback>` with header `x-blocks-key: <PTENANT>` should return `{ "redirect_uri": "https://iam.seliseblocks.com/api/oidc/authorize?...&code_challenge=..." }`. That URL is what the app redirects the browser to — continue in **[blocks-iam-sso-oidc-implementation](../../blocks-iam-sso-oidc-implementation/SKILL.md)**.

Error paths: 401 / `session_expired` → renew with `POST /iam/v4/auth-token` then re-impersonate ([get-into-project.md](get-into-project.md)). 400 → usually a `redirectUris` mismatch or missing `projectKey`.
