---
name: blocks-iam-sso-oidc-configuration
description: "Configure SSO / OIDC login for a SELISE Blocks project via the IAM admin API (`https://api.seliseblocks.com/iam/v4`): ensure a `blocks-oidc` identity provider exists, creating the OIDC client (`/oidc-clients`) and the identity provider (`/auth/identity-providers`) if they don't. Use whenever the user wants to SET UP / enable / configure single sign-on, OIDC, or an identity provider for their Blocks app — 'enable SSO for my project', 'configure OIDC login', 'register an OIDC client', 'add a blocks-oidc identity provider', 'set up authorization-code login on Blocks'. This is the admin/portal side and requires impersonating into the project first; once configured, wire the login into the app with blocks-iam-sso-oidc-implementation."
---

# Blocks IAM — SSO / OIDC Configuration

Set up authorization-code SSO for a Blocks project. The goal is a **`blocks-oidc` identity provider** registered on the project; getting there may require first creating an **OIDC client**. Once this exists, the frontend login is wired with **[blocks-iam-sso-oidc-implementation](../blocks-iam-sso-oidc-implementation/SKILL.md)**.

Admin base: `https://api.seliseblocks.com/iam/v4`.

## Auth & keys — start here

Configuration happens **inside a project/tenant**, so you first obtain an impersonated, project-scoped token via the shared initial steps — **[flows/get-into-project.md](flows/get-into-project.md)** (login → list projects → impersonate). It yields:

- **`ROOT`** — root/account tenant id (login token's `tenant_id` claim). Used as `x-blocks-key` **only** for the account-level `Project/Gets` and `impersonate` calls in get-into-project.
- **`PTENANT`** — the target project's tenant id → the **`x-blocks-key` header** *and* the **`projectKey`** in bodies (the OIDC client is created against the project).
- **`PTOK`** — an access token valid for the project (impersonated; the plain login token also works if your account already has access) → `Authorization: Bearer`.

Every call here carries `x-blocks-key: <PTENANT>` + `Authorization: Bearer <PTOK>`. **Use `PTENANT`, not `ROOT`, as `x-blocks-key`** — an in-project call keyed with the root tenant 401/403s (verified live).

## Flow

| Step | Endpoint | Go to |
|---|---|---|
| 0. Get into the project | (login → impersonate) | [flows/get-into-project.md](flows/get-into-project.md) |
| 1–4. Ensure a blocks-oidc identity provider | `/auth/identity-providers`, `/oidc-clients` | [flows/configure-oidc.md](flows/configure-oidc.md) |
| Then: wire login into the app | — | **[blocks-iam-sso-oidc-implementation](../blocks-iam-sso-oidc-implementation/SKILL.md)** |

## Key concepts (verified live)

- **Identity provider** — what SSO login uses. `GET /iam/v4/auth/identity-providers` → `{ data: [{ provider, providerType, clientId, clientSecret, issuer, authorizationUrl, tokenUrl, ... }] }`. A project ships with a default `blocks-idp` of `providerType: "oidc"`; that is **not** the SSO provider you're creating. You want an entry with **`providerType: "blocks-oidc"`** — if none exists, create one.
- **OIDC client** — the client credentials the provider wraps. `GET /iam/v4/oidc-clients` → `{ oIDCClientCredentials: [{ clientId, clientSecret, redirectUris, allowedScopes, allowedServiceAccessResources, allowedResponseTypes, clientName, ... }] }`. Create with `POST /iam/v4/oidc-clients` (body's `projectKey` = **`PTENANT`**, not root).
- **well-known URL** — the identity-provider create needs `wellKnownUrl`. Format (verified): `https://iam.seliseblocks.com/T<tenantHex>/.well-known/openid-configuration`, where `<tenantHex>` is the project tenant id as 32 hex chars (strip any leading environment letter, e.g. `Dd653…` → `d653…`). Fetch it once to confirm it returns an OIDC discovery document before saving.
- **redirectUri** — must be your app's callback (e.g. `https://your-app.com/login/callback`) and match on the client, the provider, and the runtime `initiate` call. Mismatches are the most common failure.

## Gotchas

- **Impersonate first.** These are project-scoped admin calls; without the impersonated token you get 401.
- **`projectKey` on the OIDC client = project tenant id (`PTENANT`), not `ROOT`.** The prep note calls this out explicitly.
- **`requirePkce`**: the OIDC client sets `requirePkce: true` (the runtime `initiate` returns a PKCE `code_challenge`); the identity-provider record uses `requirePkce: false`. Keep this split unless you have a reason to change it.
- **Idempotency**: always run step 1 (and step 2) first — don't create a duplicate client/provider if a usable one already exists.
