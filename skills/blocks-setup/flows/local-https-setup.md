# Serve local development over HTTPS (openssl + Vite)

SELISE Blocks expects browser apps to run on **HTTPS origins even in local development** — auth
cookies are set as Secure cookies, and several flows (login redirects, cookie-domain matching)
misbehave or silently fail on plain `http://localhost`. `openssl` (already installed on macOS and
Linux, and available in Git Bash on Windows) is all you need: generate a self-signed certificate
once per project and point Vite at it.

No Blocks API calls in this flow; it is pure local tooling.

## Steps

### 1. Generate a self-signed certificate (once per project)

```bash
cd <your-app>
mkdir -p .cert

openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 365 \
  -keyout .cert/dev-key.pem -out .cert/dev-cert.pem \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:::1"
```

Add `.cert/` to `.gitignore` — certs are per-machine, never committed.

**Optional — named local domain.** If your project's cookie configuration requires a real domain
(rather than `localhost`), add a hosts entry and include the name in the cert's SAN list:

```bash
# /etc/hosts (or C:\Windows\System32\drivers\etc\hosts)
127.0.0.1  myapp.dev.local

openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 365 \
  -keyout .cert/dev-key.pem -out .cert/dev-cert.pem \
  -subj "/CN=myapp.dev.local" \
  -addext "subjectAltName=DNS:myapp.dev.local,DNS:localhost,IP:127.0.0.1"
```

Whether a named domain is needed — and what it must match — depends on your project's cookie
domain settings (see [project-impersonation.md](project-impersonation.md) step 2 for reading
`cookieDomain` / `applicationDomain` from `GET /os/v4/api/Project/Gets`, and the `blocks-monitor`
skill for `POST /api/Domain/Configure`). **Verify against your project.**

### 2. Point Vite at the cert

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

### 3. Trust the certificate (or accept the warning)

A self-signed cert triggers a one-time browser warning ("Your connection is not private"). Either
click through it (Advanced → Proceed — fine for local dev), or trust the cert system-wide to make
the warning disappear:

```bash
# macOS — add to the System keychain as trusted
sudo security add-trusted-cert -d -r trustRoot \
  -k /Library/Keychains/System.keychain .cert/dev-cert.pem

# Windows (elevated prompt) — add to Trusted Root Certification Authorities
certutil -addstore -f Root .cert\dev-cert.pem

# Linux (Debian/Ubuntu system store; browsers may keep their own store)
sudo cp .cert/dev-cert.pem /usr/local/share/ca-certificates/blocks-dev.crt && sudo update-ca-certificates
```

Restart the browser after trusting. Guide the user: ask which OS they're on, give them the one
command for it, and have them confirm the padlock shows before moving on.

### 4. Run and use the HTTPS origin everywhere

```bash
npm run dev   # now serves https://localhost:5173
```

Use the `https://` origin consistently — in the browser, in any OAuth/redirect URLs you register,
and in portal settings that ask for your app's origin (verify in the OS portal UI).

## Verify

- Opening `https://localhost:5173` loads the app over HTTPS (padlock if trusted; a click-through
  warning otherwise is acceptable for local dev).
- Log in through the app: the Blocks auth calls succeed and any cookies the platform sets are
  visible under DevTools → Application → Cookies for your https origin.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Browser still warns after trusting | The cert on disk isn't the one you trusted (regenerated since?) — re-run the trust command; restart the browser; confirm the hostname you're using is in the cert's SAN list |
| `openssl: unknown option -addext` | OpenSSL < 1.1.1 (common with macOS LibreSSL). Use `brew install openssl` and its binary, or generate with a config file that sets `subjectAltName` |
| Auth cookies never appear / session lost on reload | You're on plain http, or the cookie domain doesn't match your origin — use this flow's https origin; check project `cookieDomain` (see project-impersonation step 2) |
| Cert expired after a year | Re-run step 1 (`-days 365`) and re-trust |
| CI / containers | Self-signed local certs don't belong there — this flow is for local dev only; deployed environments get real certs (see `blocks-release` custom-domains flow) |
