# Set up local HTTPS on the project domain

End state: the React app runs at `https://<project-domain>:<port>` locally with a trusted cert, so Blocks SSO cookies are set and login works. Do the steps in order.

## Step 1 — Determine the domain (do this before generating the cert)

The cert and the dev server must use the domain the SSO cookie is scoped to, so you **must** have a concrete domain before Step 3 — never invent or guess one. Resolve it from **`GET /os/v4/Project/Gets`** first (see [get-into-project](get-into-project.md) for login/bootstrap headers).

### How `Project/Gets` exposes the domain

The response is an array of tenant-groups; each has a **`projects`** array. For each project entry:
- **`environment`** — use this to know which environment the user is working in (`Development`, `Staging`, `Production`, …).
- **`applications`** — array of app records; each has a **`domain`** property. **That `domain` is the applicationDomain** — often a full URL like `https://dfsgso.slsblx.com`.

There is no flat `applicationDomain` field on the project object itself.

### Resolution order

1. **Pick the project** — match the name the user gave, or list `name` + `environment` and ask.
2. **Pick the environment** — if only one project (or one distinct `environment`) applies, use it automatically; if several environments exist, **ask the user** which one they are working on.
3. **Pick the application domain** — from the chosen project's `applications[]`:
   - **One entry** → take its `domain`.
   - **Multiple entries** → list the `domain` values (e.g. `https://dfsgso.slsblx.com`, `https://other.slsblx.com`) and **ask the user which to pick** unless context makes one obvious.
4. **Normalize for local dev** — strip the scheme (and any trailing slash) so hosts/cert/dev-server use the hostname only: `https://dfsgso.slsblx.com` → `dfsgso.slsblx.com`.

```bash
bootstrap_hdr=(-H "x-blocks-key: $ACCOUNT_TENANT" -H "Authorization: Bearer $TOK")
# Example: first project, first application — replace with the user's project/environment/app choice
RAW=$(curl -s "$BLOCKS_API_URL/os/v4/Project/Gets?page=0&pageSize=100" "${bootstrap_hdr[@]}" \
  | python3 -c "
import sys, json
groups = json.load(sys.stdin)
projects = [p for g in groups for p in (g.get('projects') or [])]
p = projects[0]  # TODO: filter by user project + environment
apps = p.get('applications') or []
print(apps[0]['domain'] if apps else '')
")
DOMAIN=$(python3 -c "from urllib.parse import urlparse; u='$RAW'.strip(); print(urlparse(u if '://' in u else '//'+u).hostname or u.replace('https://','').replace('http://','').strip('/'))")
echo "applicationDomain (raw): $RAW"
echo "DOMAIN (hostname for cert/hosts): $DOMAIN"
```

5. **If the lookup returns nothing** (no `applications`, empty `domain`, or you can't reach the project list), **ask the user** for the domain their app is served on and registered as the OIDC `redirectUri`. Do not proceed to the cert step without a domain.

```bash
DOMAIN=dfsgso.slsblx.com   # hostname from applications[].domain, or supplied by the user
PORT=5173                   # your dev server port
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

**Precondition:** `$DOMAIN` is already resolved from Step 1 (`applications[].domain` on the chosen project/environment, hostname normalized, or the user's answer). If it's empty, go back to Step 1 — don't issue a cert for a guessed domain.

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
