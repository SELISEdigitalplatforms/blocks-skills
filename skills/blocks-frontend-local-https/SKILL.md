---
name: blocks-frontend-local-https
description: "Run a frontend React app locally over HTTPS on its real project domain, using a locally-generated SSL certificate — required so SELISE Blocks SSO/OIDC login works, because the auth callback sets a Secure, domain-scoped session cookie that the browser rejects on plain http://localhost. The skill: discovers the project's domain (from /os/v4/Project/Gets applicationDomain/cookieDomain) or asks the user, adds a hosts entry mapping that domain to 127.0.0.1, generates a self-signed local cert for it with openssl (and trusts it), configures the dev server (Vite/CRA/Next) to serve https on that domain + port, and runs it at https://your.domain.com:PORT. Use whenever the user needs to run/test a Blocks app locally over HTTPS, fix 'SSO cookie not set / session lost on localhost', set up a local dev cert, serve a custom domain locally, or make the OIDC redirect work in local dev. A real/owned domain name is required to issue the cert — you cannot make one without a domain."
---

# Blocks Frontend — Local HTTPS on the Project Domain

Blocks SSO/OIDC ([blocks-iam-sso-oidc-implementation](../blocks-iam-sso-oidc-implementation/SKILL.md)) finishes by having `/iam/v4/idp/callback` set a **Secure, domain-scoped session cookie**. Browsers refuse to store that cookie on `http://localhost`, and they scope it to the project's **cookie domain** — so to test login locally the app must run on **HTTPS at the project's real domain**, not `localhost`. This skill makes that work: generate a trusted local cert for the domain, point the domain at your machine, and serve the dev server over HTTPS on it.

Pure local tooling — the only Blocks API call is the optional `Project/Gets` lookup to discover the domain.

## The domain is the crux

You need a **domain name** to issue the certificate against and to run on — `localhost` won't do, because the cookie is scoped to the project's domain. Get it in this order:

1. **From the project config** — `GET /os/v4/Project/Gets` returns each project's `applicationDomain`, `cookieDomain`, and `customDomain` (see the shared [get-into-project flow](../blocks-iam-sso-oidc-configuration/flows/get-into-project.md) for how to list projects). Use the domain the cookie is scoped to — usually `applicationDomain` (e.g. `myapp.seliseblocks.com`); if `cookieDomain` is a parent (e.g. `.seliseblocks.com`), any subdomain under it works.
2. **Ask the user** if the project config doesn't have one set. It must be the domain registered as the app's origin / OIDC `redirectUri`, or login still fails.

You are not taking the real domain over the internet — you map it to `127.0.0.1` in your **hosts file**, so `https://myapp.seliseblocks.com:5173` resolves to your local dev server while every other machine still reaches the real site.

## Steps → [flows/setup-local-https.md](flows/setup-local-https.md)

1. Determine the domain (Project/Gets or ask).
2. Add a hosts entry: `127.0.0.1  <domain>`.
3. Generate a self-signed cert for `<domain>` with **openssl**, and trust it so the browser stops warning.
4. Configure the dev server to serve HTTPS on `<domain>:<port>` with that cert — [references/vite-config.md](references/vite-config.md).
5. Run → open `https://<domain>:<port>`.
6. Use that exact origin as the OIDC `redirectUri` everywhere.

## Tool: openssl

Use **openssl** (preinstalled on macOS/Linux, and in Git Bash on Windows) to issue a self-signed certificate for the domain. It's self-signed, so the browser shows a one-time "not private" warning until you either click through it (fine for local dev) or trust the cert in the OS store to make the warning disappear — both covered in [flows/setup-local-https.md](flows/setup-local-https.md) step 3. Include the exact domain in the cert's `subjectAltName`, or the browser rejects it even over HTTPS.

## Gotchas

- **Domain must match the cookie/redirect config.** A cert for the wrong domain runs HTTPS fine but SSO still fails — the cookie won't be scoped to where you're browsing. Match `cookieDomain` / the registered `redirectUri`.
- **Hosts entry is required** — without `127.0.0.1 <domain>`, the browser resolves the real public IP instead of your dev server.
- **The domain must be in the cert's `subjectAltName` (SAN)** — a matching `CN` alone isn't enough for modern browsers.
- **Port is part of the origin**, not the cookie domain — `https://myapp.seliseblocks.com:5173` shares the cookie domain `myapp.seliseblocks.com`, so Secure cookies set for that domain apply. Register the port-bearing origin as the `redirectUri`.
- **Certs are per-machine, never committed** — add the cert directory to `.gitignore`.
- **Restart the browser after trusting the cert** so the new trust is picked up.
