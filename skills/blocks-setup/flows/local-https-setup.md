# Serve local development over HTTPS (mkcert + Vite)

SELISE Blocks expects browser apps to run on **HTTPS origins even in local development** — auth
cookies are set as Secure cookies, and several flows (login redirects, cookie-domain matching)
misbehave or silently fail on plain `http://localhost`. Developers often don't have a local SSL
setup, so create one once per machine with `mkcert` (a locally-trusted CA — no browser warnings,
no self-signed-cert clicking).

Run once per machine (CA install) + once per project (cert files). No Blocks API calls in this
flow; it is pure local tooling.

## Steps

### 1. Install mkcert and the local CA (once per machine)

```bash
# macOS
brew install mkcert
# Windows
choco install mkcert     # or: scoop bucket add extras && scoop install mkcert
# Linux
sudo apt install libnss3-tools && brew install mkcert   # or grab the release binary

mkcert -install   # creates and trusts a local CA (system + browser trust stores)
```

Restart the browser after `mkcert -install` so it picks up the new CA.

### 2. Generate a cert for your dev origin (once per project)

```bash
cd <your-app>
mkdir -p .cert
mkcert -key-file .cert/dev-key.pem -cert-file .cert/dev-cert.pem localhost 127.0.0.1 ::1
```

Add `.cert/` to `.gitignore` — certs are per-machine, never committed.

**Optional — named local domain.** If your project's cookie configuration requires a real domain
(rather than `localhost`), add a hosts entry and include the name in the cert:

```bash
# /etc/hosts (or C:\Windows\System32\drivers\etc\hosts)
127.0.0.1  myapp.dev.local

mkcert -key-file .cert/dev-key.pem -cert-file .cert/dev-cert.pem myapp.dev.local localhost 127.0.0.1
```

Whether a named domain is needed — and what it must match — depends on your project's cookie
domain settings (see [project-impersonation.md](project-impersonation.md) step 2 for reading
`cookieDomain` / `applicationDomain` from `GET /os/v4/api/Project/Gets`, and the `blocks-monitor`
skill for `POST /api/Domain/Configure`). **Verify against your project.**

### 3. Point Vite at the cert

```ts
// vite.config.ts
import { defineConfig } from "vite";
import fs from "node:fs";

export default defineConfig({
  server: {
    https: {
      key: fs.readFileSync(".cert/dev-key.pem"),
      cert: fs.readFileSync(".cert/dev-cert.pem"),
    },
    // host: "myapp.dev.local",   // only if you use the named-domain variant
  },
});
```

(Alternative: `vite-plugin-mkcert` automates steps 2–3, at the cost of a dev dependency.)

### 4. Run and use the HTTPS origin everywhere

```bash
npm run dev   # now serves https://localhost:5173
```

Use the `https://` origin consistently — in the browser, in any OAuth/redirect URLs you register,
and in portal settings that ask for your app's origin (verify in portal UI).

## Verify

- Opening `https://localhost:5173` shows the padlock with **no certificate warning** (if it warns,
  `mkcert -install` didn't take — rerun it and restart the browser).
- Log in through the app: the Blocks auth calls succeed and any cookies the platform sets are
  visible under DevTools → Application → Cookies for your https origin.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Browser warns about the cert | Rerun `mkcert -install`, restart browser; confirm the cert covers the exact hostname you're using |
| Auth cookies never appear / session lost on reload | You're on plain http, or the cookie domain doesn't match your origin — use this flow's https origin; check project `cookieDomain` (see project-impersonation step 2) |
| Works in Chrome, fails in Firefox | Firefox has its own trust store — `mkcert -install` handles it, but only if `libnss3-tools`/`certutil` was present; reinstall and rerun |
| CI / containers | mkcert's CA doesn't exist there — this flow is for local dev only; deployed environments get real certs (see `blocks-release` custom-domains flow) |
