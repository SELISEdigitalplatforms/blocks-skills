# Environment Variables Reference

Complete reference for all environment variables required for SELISE Blocks deployment.

## Deployment Path and Env Files

**Path 1 — Traditional CI/CD (GitHub Actions → ACR → AKS):**
- `.env.dev`, `.env.stg`, `.env.prod` — all with **real** credentials from `@seliseblocks/cli`
- Credentials are baked into the container at build time

**Path 2 — Cloud Portal Direct (future):**
- `.env.dev`, `.env.stg` — with **real** credentials from `@seliseblocks/cli`
- `.env.prod` — **omit or use placeholder** `<get from cloud portal>` — portal injects real credentials at runtime
- Never include real production credentials in the source code

---

## Framework Env Prefix

Each framework has its own convention for browser-exposed environment variables.

| Framework | Prefix | Example |
|-----------|--------|---------|
| Vite / React SPA | `VITE_` | `VITE_API_BASE_URL`, `VITE_X_BLOCKS_KEY` |
| Next.js | `NEXT_PUBLIC_` | `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_X_BLOCKS_KEY` |
| Angular | None | `API_BASE_URL`, `X_BLOCKS_KEY` (Angular `environment.ts` files) |

> **Next.js:** Unlike Vite, Next.js uses `NEXT_PUBLIC_` to expose variables to the browser. Using `VITE_*` in a Next.js project will result in `undefined` values at runtime.

> **Angular:** Angular uses its own environment file system (`src/environments/environment.ts`). Do not use a prefix — the Angular CLI handles environment substitution at build time.

---

## Required Variables

These variables must be present in each `.env.{env}` file.

### *_API_BASE_URL

**Purpose:** API endpoint URL for the environment.

| Environment | Value |
|-------------|-------|
| Dev | `https://dev-api.seliseblocks.com` |
| Staging | `https://stg-api.seliseblocks.com` |
| Production | `https://api.seliseblocks.com` |

**Example:**
```bash
# Vite
VITE_API_BASE_URL=https://api.seliseblocks.com

# Next.js
NEXT_PUBLIC_API_BASE_URL=https://api.seliseblocks.com
```

---

### *_X_BLOCKS_KEY

**Purpose:** Blocks project key for authentication with the Blocks platform.

**Security:** This is a sensitive credential. NEVER hardcode the real value in templates. Use placeholder comments.

**How to get:**
1. Go to the Blocks Cloud Portal: `cloud.seliseblocks.com`
2. Navigate to your project → Settings → Project Key
3. Copy the key

**Template (replace value via CLI):**
```bash
# Vite
VITE_X_BLOCKS_KEY=<get from blocks CLI: blocks config show --key>

# Next.js
NEXT_PUBLIC_X_BLOCKS_KEY=<get from blocks CLI: blocks config show --key>
```

---

### *_PROJECT_SLUG

**Purpose:** Project identifier/slug used by the Blocks platform.

**Format:** Alphanumeric string (e.g., `ddoxpd`, `prjrjk-dzhwx`)

**Template:**
```bash
# Vite
VITE_PROJECT_SLUG=<your-project-slug>

# Next.js
NEXT_PUBLIC_PROJECT_SLUG=<your-project-slug>
```

---

### *_BLOCKS_OIDC_CLIENT_ID

**Purpose:** OIDC client ID for authentication with the Blocks identity provider.

**Format:** UUID (e.g., `4354ad04-07b9-4e27-8b93-f53b472e1803`)

**How to get:** From Blocks Cloud Portal → Project → Identity Settings

**Template:**
```bash
# Vite
VITE_BLOCKS_OIDC_CLIENT_ID=<get from blocks CLI or cloud portal>

# Next.js
NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID=<get from blocks CLI or cloud portal>
```

---

## Optional Variables

These variables enhance functionality but are not required for deployment.

### *_CAPTCHA_SITE_KEY

**Purpose:** CAPTCHA site key for bot protection (reCaptcha or hCaptcha).

**Template:**
```bash
# Vite
VITE_CAPTCHA_SITE_KEY=***REMOVED***

# Next.js
NEXT_PUBLIC_CAPTCHA_SITE_KEY=***REMOVED***
```

---

### *_CAPTCHA_TYPE

**Purpose:** Type of CAPTCHA to use.

**Values:** `reCaptcha` or `hCaptcha`

**Template:**
```bash
# Vite
VITE_CAPTCHA_TYPE=reCaptcha

# Next.js
NEXT_PUBLIC_CAPTCHA_TYPE=reCaptcha
```

---

### *_BLOCKS_OIDC_REDIRECT_URI

**Purpose:** Redirect URI for OIDC authentication flow. Must match the domain where the app is hosted.

**Patterns per environment:**

| Environment | Pattern | Example |
|-------------|---------|---------|
| Dev | `https://dev-{slug}.seliseblocks.com/oidc` | `https://dev-prjrjk-dzhwx.seliseblocks.com/oidc` |
| Staging | `https://stg-{slug}.seliseblocks.com/oidc` | `https://stg-prjrjk-dzhwx.seliseblocks.com/oidc` |
| Production | `https://{slug}.seliseblocks.com/oidc` | `https://prjrjk-dzhwx.seliseblocks.com/oidc` |

**Template:**
```bash
# Vite
VITE_BLOCKS_OIDC_REDIRECT_URI=https://dev-<slug>.seliseblocks.com/oidc

# Next.js
NEXT_PUBLIC_BLOCKS_OIDC_REDIRECT_URI=https://dev-<slug>.seliseblocks.com/oidc
```

---

### GENERATE_SOURCEMAP

**Purpose:** Whether to generate source maps during build.

**Values:** `true` or `false`

**Recommendation:** Set to `false` in production for security and performance.

**Template:**
```bash
GENERATE_SOURCEMAP=false
```

---

### VITE_PRIMARY_COLOR / VITE_SECONDARY_COLOR

**Purpose:** Theme color customization.

**Format:** Hex or HSL (e.g., `#15969B` or `hsl(174, 69%, 41%)`)

**Template:**
```bash
VITE_PRIMARY_COLOR=#15969B
VITE_SECONDARY_COLOR=#5194B8
```

---

## Template Generation Guidelines

When generating `.env` templates:

1. **NEVER include real credentials** — use placeholder comments
2. **Use correct prefix per framework** — `VITE_*` for Vite, `NEXT_PUBLIC_*` for Next.js
3. **Use consistent variable keys** across all env files
4. **Differentiate values per environment** (dev vs stg vs prod)
5. **Include comments** explaining each variable
6. **Group related variables** together
7. **Set sensible defaults** for optional variables
8. **Path 2 (Cloud Portal):** Omit `.env.prod` or use `<get from cloud portal>` — do not include real production credentials

## Example Template: .env.dev (Vite)

```bash
# Vite environment variables — Development
VITE_API_BASE_URL=https://dev-api.seliseblocks.com

# Blocks project key — Get via: blocks config show --key
VITE_X_BLOCKS_KEY=<set via: blocks config set --key>

VITE_CAPTCHA_SITE_KEY=<get from cloud portal>
VITE_CAPTCHA_TYPE=reCaptcha
VITE_PROJECT_SLUG=<your-dev-project-slug>

# OIDC configuration
VITE_BLOCKS_OIDC_CLIENT_ID=<get from blocks CLI: blocks config show --oidc>
VITE_BLOCKS_OIDC_REDIRECT_URI=https://dev-<slug>.seliseblocks.com/oidc

# Build configuration
GENERATE_SOURCEMAP=false

# Theme colors (optional)
VITE_PRIMARY_COLOR=#15969B
VITE_SECONDARY_COLOR=#5194B8
```

## Example Template: .env.dev (Next.js)

```bash
# Next.js environment variables — Development
NEXT_PUBLIC_API_BASE_URL=https://dev-api.seliseblocks.com

# Blocks project key — Get via: blocks config show --key
NEXT_PUBLIC_X_BLOCKS_KEY=<set via: blocks config set --key>

NEXT_PUBLIC_CAPTCHA_SITE_KEY=<get from cloud portal>
NEXT_PUBLIC_CAPTCHA_TYPE=reCaptcha
NEXT_PUBLIC_PROJECT_SLUG=<your-dev-project-slug>

# OIDC configuration
NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID=<get from blocks CLI: blocks config show --oidc>
NEXT_PUBLIC_BLOCKS_OIDC_REDIRECT_URI=https://dev-<slug>.seliseblocks.com/oidc

# Build configuration
GENERATE_SOURCEMAP=false
```

## Example Template: .env.prod (Path 2 — Cloud Portal Direct)

> **For Cloud Portal Direct deployments, do NOT include real credentials in `.env.prod`.** The portal injects production credentials at runtime.

```bash
# Production environment — Cloud Portal Direct
# Do NOT include real credentials here. The cloud portal injects them at runtime.
NEXT_PUBLIC_API_BASE_URL=https://api.seliseblocks.com
NEXT_PUBLIC_PROJECT_SLUG=<your-project-slug>

# OIDC redirect — must match your deployed domain
NEXT_PUBLIC_BLOCKS_OIDC_REDIRECT_URI=https://<your-slug>.seliseblocks.com/oidc

# Client ID — get from cloud portal (or portal may inject automatically)
NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID=<get from cloud portal>

# Blocks key — portal manages this automatically
NEXT_PUBLIC_X_BLOCKS_KEY=<get from cloud portal>
```

## CLI for Credential Setup

Use `@seliseblocks/cli` instead of manual credential entry:

```bash
npm install -g @seliseblocks/cli
blocks login
blocks init --env
blocks config set --key <your-x-blocks-key>
blocks config set --oidc <your-oidc-client-id>
blocks config show
```

This keeps credentials with the user, not in AI-generated files.
