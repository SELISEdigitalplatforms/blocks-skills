# Set up local HTTPS on the project domain

End state: the React app runs at `https://<project-domain>:<port>` locally with a trusted cert, so Blocks SSO cookies are set and login works. Do the steps in order.

## Step 1 — Determine the domain

The cert and the dev server must use the domain the SSO cookie is scoped to.

- **From the project:** list projects with `GET /os/v4/Project/Gets` (see the [get-into-project flow](../../blocks-iam-sso-oidc-configuration/flows/get-into-project.md)). Each project has `applicationDomain`, `cookieDomain`, `customDomain`. Pick the app's origin domain — usually `applicationDomain` (e.g. `myapp.seliseblocks.com`). If `cookieDomain` is a parent like `.seliseblocks.com`, any subdomain under it works (e.g. `dev.myapp.seliseblocks.com`).
- **If the project has none set, ask the user** for the domain their app is (or will be) served on and registered as the OIDC `redirectUri`. A domain is required — you can't issue a local cert without one.

```bash
DOMAIN=myapp.seliseblocks.com   # from Project/Gets or the user
PORT=5173                        # your dev server port
```

## Step 2 — Point the domain at your machine (hosts file)

Map the domain to loopback so the browser reaches your local dev server instead of the public site.

```bash
# macOS / Linux — /etc/hosts    (Windows: C:\Windows\System32\drivers\etc\hosts, as Administrator)
echo "127.0.0.1  $DOMAIN" | sudo tee -a /etc/hosts
```
Tell the user this needs admin/sudo and edits a system file; show them the exact line being added and have them confirm. To undo later, remove that line.

Verify: `ping -c1 $DOMAIN` should resolve to `127.0.0.1`.

## Step 3 — Generate a self-signed certificate with openssl

Issue a cert for `$DOMAIN`. The `subjectAltName` (SAN) **must** contain the exact domain — modern browsers ignore `CN` and reject a cert whose SAN doesn't list the host you're visiting.

```bash
mkdir -p .cert
openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 365 \
  -keyout .cert/dev-key.pem -out .cert/dev-cert.pem \
  -subj "/CN=$DOMAIN" \
  -addext "subjectAltName=DNS:$DOMAIN,DNS:localhost,IP:127.0.0.1"
```

The cert is self-signed, so the browser shows a one-time "Your connection is not private" warning. Either click through it (Advanced → Proceed — acceptable for local dev), or trust it in the OS store to remove the warning, then **restart the browser**:

```bash
# macOS — add to the System keychain as a trusted root
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain .cert/dev-cert.pem
# Windows (elevated prompt) — add to Trusted Root Certification Authorities
certutil -addstore -f Root .cert\dev-cert.pem
# Linux (Debian/Ubuntu system store; browsers may keep their own)
sudo cp .cert/dev-cert.pem /usr/local/share/ca-certificates/blocks-dev.crt && sudo update-ca-certificates
```

Add the cert dir to `.gitignore` — certs are per-machine, never committed:
```bash
echo ".cert/" >> .gitignore
```

> `openssl: unknown option -addext`? That's an old openssl / macOS LibreSSL. `brew install openssl` and use its binary, or supply the SAN via a temporary config file (`-config`) with an `[alt_names]` section.

## Step 4 — Serve HTTPS on the domain + port

Point the dev server at the cert and bind it to the domain. Full configs (Vite, CRA, Next) in [../references/vite-config.md](../references/vite-config.md). Vite in brief:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import fs from "node:fs";

export default defineConfig({
  server: {
    host: "myapp.seliseblocks.com",   // = $DOMAIN
    port: 5173,                        // = $PORT
    https: {
      key: fs.readFileSync(".cert/dev-key.pem"),
      cert: fs.readFileSync(".cert/dev-cert.pem"),
    },
    // allowedHosts: ["myapp.seliseblocks.com"],  // add if Vite blocks the host
  },
});
```

## Step 5 — Run and open the HTTPS origin

```bash
npm run dev
# open https://myapp.seliseblocks.com:5173  (NOT localhost)
```

## Step 6 — Wire the origin into SSO

Use `https://<domain>:<port>` as the app's origin **everywhere**: the OIDC `redirectUri` registered on the client/provider (**[blocks-iam-sso-oidc-configuration](../../blocks-iam-sso-oidc-configuration/SKILL.md)**), the `VITE_BLOCKS_REDIRECT_URI` env, and the router callback path (**[blocks-iam-sso-oidc-implementation](../../blocks-iam-sso-oidc-implementation/SKILL.md)**). All three must match byte-for-byte.

## Verify

- `https://<domain>:<port>` loads the app — with a padlock if you trusted the cert, or an acceptable click-through warning if you didn't.
- Run the SSO login: after `/idp/callback`, check DevTools → Application → Cookies — the Blocks session cookie is present under your domain. On `http://localhost` it would be absent; that's the whole reason for this setup.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Browser still warns after trusting | The trusted cert isn't the one on disk (regenerated since?) — re-run the trust command, restart the browser, and confirm the domain is in the cert's SAN |
| `NET::ERR_CERT_COMMON_NAME_INVALID` | The domain isn't in the cert's `subjectAltName` — regenerate step 3 with the domain in `-addext "subjectAltName=DNS:$DOMAIN,..."` |
| `ERR_CONNECTION_REFUSED` on the domain | Missing/typo'd hosts entry, or dev server not bound to that host — check step 2 and `server.host` |
| Vite "host not allowed" | Add the domain to `server.allowedHosts` |
| Cookie still not set | You're on `http`/`localhost` or the domain ≠ `cookieDomain` — use the https project-domain origin |
| `openssl: unknown option -addext` | LibreSSL/old openssl — `brew install openssl` and use its binary, or pass the SAN via a `-config` file |
