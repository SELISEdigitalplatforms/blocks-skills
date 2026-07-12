---
name: blocks-iam-sso-oidc-configuration
description: "Configure SSO / OIDC login for a SELISE Blocks project via the IAM admin API (`https://api.seliseblocks.com/iam/v4`): ensure a `blocks-oidc` identity provider exists, creating the OIDC client (`/oidc-clients`) and the identity provider (`/auth/identity-providers`) if they don't. Use whenever the user wants to SET UP / enable / configure single sign-on, OIDC, or an identity provider for their Blocks app — 'enable SSO for my project', 'configure OIDC login', 'register an OIDC client', 'add a blocks-oidc identity provider', 'set up authorization-code login on Blocks'. This is the admin/portal side and requires impersonating into the project first; once configured, wire the login into the app with blocks-iam-sso-oidc-implementation."
---

# Blocks IAM — SSO / OIDC Configuration

Set up authorization-code SSO for a Blocks project. The goal is a **`blocks-oidc` identity provider** registered on the project; getting there may require first creating an **OIDC client**. Once this exists, the frontend login is wired with **[blocks-iam-sso-oidc-implementation](../blocks-iam-sso-oidc-implementation/SKILL.md)**.

Admin base: `https://api.seliseblocks.com/iam/v4`.

## Auth & keys — start here

Configuration happens **inside a project/tenant**, so you first obtain an impersonated, project-scoped token via the shared initial steps — **[flows/get-into-project.md](flows/get-into-project.md)** (login → list projects → impersonate). It yields:

- **`ACCOUNT_TENANT`** — root/account tenant id (login token's `tenant_id` claim). Used as **`x-blocks-key`** on every IAM configuration call after impersonation.
- **`PTENANT`** — the target project's tenant id → **`projectKey`** in bodies. Also used in **`wellKnownUrl`** when creating the identity provider (see below). **Not** `x-blocks-key` on configuration calls.
- **`PTOK`** — the impersonated access token valid for the project → `Authorization: Bearer`.

Every call here carries `x-blocks-key: <ACCOUNT_TENANT>` + `Authorization: Bearer <PTOK>`, with `projectKey: <PTENANT>` in bodies. **Strict rule:** `x-blocks-key` is the root tenant; `PTENANT` scopes the project via `projectKey` and `wellKnownUrl` only.

> ⚠️ **Do not swap the keys.** SSO/OIDC admin calls use **`x-blocks-key: ACCOUNT_TENANT`** + impersonated **`PTOK`**. Never send `PTENANT` as `x-blocks-key` on identity-provider or oidc-client calls. On `PTOK` expiry, renew with `POST /iam/v4/auth-token` then re-impersonate (get-into-project).

## Flow

| Step | Endpoint | Go to |
|---|---|---|
| 0. Get into the project | (login → impersonate) | [flows/get-into-project.md](flows/get-into-project.md) |
| 1–4. Ensure a blocks-oidc identity provider | `/auth/identity-providers`, `/oidc-clients` | [flows/configure-oidc.md](flows/configure-oidc.md) |
| Then: wire login into the app | — | **[blocks-iam-sso-oidc-implementation](../blocks-iam-sso-oidc-implementation/SKILL.md)** |

## Key concepts (verified live)

- **Identity provider** — what SSO login uses. `GET /iam/v4/auth/identity-providers` → `{ data: [{ provider, providerType, clientId, clientSecret, issuer, authorizationUrl, tokenUrl, ... }] }`. A project ships with a default `blocks-idp` of `providerType: "oidc"`; that is **not** the SSO provider you're creating. You want an entry with **`providerType: "blocks-oidc"`** — if none exists, create one.
- **OIDC client** — the client credentials the provider wraps. `GET /iam/v4/oidc-clients` → `{ oIDCClientCredentials: [{ clientId, clientSecret, redirectUris, allowedScopes, allowedServiceAccessResources, allowedResponseTypes, clientName, ... }] }`. Create with `POST /iam/v4/oidc-clients` (body's `projectKey` = **`PTENANT`**, not root).
- **well-known URL** — the identity-provider create needs `wellKnownUrl`. Format: **`https://iam.seliseblocks.com/<PTENANT>/.well-known/openid-configuration`** — use `$PTENANT` exactly (the project tenant id you impersonated into, same as `targeted_tenant_id`), **not** the root tenant (`ACCOUNT_TENANT`). Send it as returned from `Project/Gets` (may include a leading env letter, e.g. `D87e3f79…`). Fetch it once to confirm it returns an OIDC discovery document before saving.
- **redirectUri** — must be your app's callback (e.g. `https://your-app.com/login/callback`) and match on the client, the provider, and the runtime `initiate` call. Mismatches are the most common failure.

## Gotchas

- **Impersonate first.** These are project-scoped admin calls; without the impersonated token you get 401.
- **`projectKey` on the OIDC client = project tenant id (`PTENANT`), not `ACCOUNT_TENANT`.** The prep note calls this out explicitly.
- **`requirePkce`**: the OIDC client sets `requirePkce: true` (the runtime `initiate` returns a PKCE `code_challenge`); the identity-provider record uses `requirePkce: false`. Keep this split unless you have a reason to change it.
- **Idempotency**: always run step 1 (and step 2) first — don't create a duplicate client/provider if a usable one already exists.
