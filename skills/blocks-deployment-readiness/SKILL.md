---
name: blocks-deployment-readiness
description: "Prepare a SELISE Blocks project for deployment. Use when users want to make their project deployment-ready, check if their app is ready to deploy, set up deployment for their project, generate deployment configuration files, verify their build scripts pass, or ask how to deploy to Blocks cloud. Also triggers when developers mention 'blocks-deployment-readiness', 'deployment readiness', 'prepare for deployment', 'deployment-ready', 'make my project deploy-ready', 'check deployment readiness', 'set up dockerfile', 'github workflows deployment', 'blocks cloud deployment', 'my build is failing', or need Dockerfile, nginx config, env files, CI/CD pipeline setup, or build verification for SELISE Blocks. This skill focuses on CODEBASE PREPARATION — generating Dockerfile, nginx.conf, .env files, GitHub workflows, and verifying that build scripts actually pass. For CloudBuild API operations (trigger-build, get-build, create-webhook), use the blocks-deployment skill instead."
user-invocable: true
blocks-version: "1.1.0"
---

# blocks-deployment-readiness

Prepares a SELISE Blocks project for deployment by checking and generating required configuration files. This skill handles **codebase preparation only** — it does NOT call CloudBuild APIs or manage running deployments. For triggering/managing builds via API, use the `blocks-deployment` skill.

---

## How to Answer "How do I use blocks-deployment-readiness?"

When a developer asks **"how to use blocks-deployment-readiness"**, **"what does blocks-deployment-readiness do"**, or **"how do I get started"**:

1. **Ask for their project path** — where is their codebase located?
2. **Ask what they want to do** — check readiness, generate missing files, or both?
3. **Point to the human overview** — direct them to `README.md` for a quick overview
4. **Point to the AI guide** — direct them to `SKILL.md` for the full execution guide
5. **Give a one-liner summary** — "blocks-deployment-readiness checks your project for deployment readiness and generates missing files like Dockerfile, GitHub workflows, and env file templates"

**Do NOT** generate a custom summary. The skill already has this information in `README.md` and `SKILL.md`. Link to those files instead of reproducing their content.

---

## When to Use

Example prompts that should route here:
- "Check if my project is ready to deploy"
- "Make my project deployment-ready"
- "Prepare for deployment"
- "Set up deployment for my project"
- "Generate a Dockerfile for my blocks app"
- "How do I deploy to blocks cloud"
- "My project isn't deploying"
- "My build is failing"
- "Verify my build scripts work"
- "Add missing GitHub workflows"
- "Generate env file templates"
- "Set up CI/CD for my React app"
- "blocks-deployment-readiness"

**For CloudBuild API operations**, use `blocks-deployment` instead:
- "Trigger a build on main"
- "Check build status"
- "Create a webhook"

---

## Execution Context

Before executing any action or flow from this skill, read `../core/runtime/execution-context.md` for the required supporting files, load order, and cross-domain orchestration rules.

At minimum, this skill requires:
- `checks/` — 6 readiness check actions (5 in parallel, 1 sequential)
- `flows/make-deployment-ready.md` — for multi-step preparation workflows
- `references/` — for templates (Dockerfile, workflows, env variables)

At build/test time, this skill also uses:
- `evals/evals.json` — test cases for verifying skill behavior

---

## Core Principle: No Credentials in AI

**NEVER ask users to share credentials (API keys, x-blocks-key, passwords) with AI.** All sensitive configuration must be set up by the user via CLI or MCP tools. AI generates templates and guides, but credentials stay with the user.

---

## Separation from blocks-deployment

| Task | Use |
|------|-----|
| Prepare code for deployment (Dockerfile, workflows, env files) | `blocks-deployment-readiness` |
| Trigger a build via API | `blocks-deployment` |
| Check if project is deployment-ready | `blocks-deployment-readiness` |
| Monitor build status | `blocks-deployment` |
| Set up auto-deploy webhook | `blocks-deployment` |

---

## Quick Start: Make a Project Deployment-Ready

See `flows/make-deployment-ready.md` for the full flow. High-level steps:

1. **Ask deployment method** — Traditional CI/CD (GitHub Actions) or Cloud Portal Direct? (see Deployment Method section)
2. **Detect project type** — see below
3. **Run readiness checks** (parallel) — env files, build config, Dockerfile, workflows (Path 1) or hosting config (Path 2)
4. **Report status** — show what's present vs missing
5. **Fix missing components** — generate from templates in `references/`
6. **Run build execution check** — `check-build-passes` verifies `npm run build:dev/stg/prod` all pass
7. **Guide credential setup** — direct user to `@seliseblocks/cli`, NOT to share keys with AI
8. **Trigger deployment** — push to GitHub branch (Path 1) or connect repo to cloud portal (Path 2)

### Project Type Detection

| Indicator | Framework | Dockerfile output path | Build command |
|-----------|-----------|----------------------|---------------|
| `package.json` + `vite.config.ts` | Vite / React SPA | `/app/build` | `vite build` |
| `package.json` + `angular.json` | Angular | `/app/dist/<name>` | `ng build` |
| `package.json` + `next.config.js` | Next.js | `/app/out` | `next build` (needs `output: 'export'`) |
| `*.csproj` / `Program.cs` | .NET Blazor | (handled by dotnet publish) | `dotnet publish` |

---

## Deployment Method

Before generating any configuration, **ask the user which deployment method they want**. This determines which files and credentials are needed.

### Path 1: Traditional CI/CD (GitHub Actions → ACR → AKS)

The project builds Docker containers via GitHub Actions. Credentials must be baked into the build at container build time.

**Use when:** You want full control over the build pipeline, or your organization requires it.

**Files needed:**
- `.env.dev`, `.env.stg`, `.env.prod` — all with **real** credentials (from `@seliseblocks/cli`)
- `Dockerfile` — multi-stage build
- `nginx.conf` — web server config
- `.github/workflows/dev.yml`, `stg.yml`, `main.yml` — CI/CD pipelines
- `set-env.cjs` — environment switcher
- `vite.config.ts` — build tool config

**Credentials:** All three env files must contain real values (API keys, OIDC client IDs). These are embedded at build time. The `blocks init --env` command populates them.

### Path 2: Cloud Portal Direct (Future — blocks cloud portal)

The project source is connected to the Blocks Cloud Portal, which handles the build and deployment. Credentials are injected by the portal at runtime — they do **not** need to be in the source code.

**Use when:** You want the simplest path — just push code and the portal deploys it. *(This feature is coming soon.)*

**Files needed:**
- `.env.dev`, `.env.stg` — with real credentials (for local dev/staging)
- `.env.prod` — **NOT required** (use placeholder `<get from cloud portal>` or omit entirely)
- `Dockerfile` — standard multi-stage build
- `nginx.conf` — web server config
- **No GitHub workflows needed** (portal handles CI/CD)
- `vite.config.ts` — build tool config

**Credentials:** Only dev/stg need real values. Production credentials are managed by the portal. Do NOT include real prod credentials in the codebase.

### Quick Decision Guide

| Question | Path 1: Traditional CI/CD | Path 2: Cloud Portal Direct |
|----------|------------------------|------------------------------|
| Who triggers builds? | GitHub Actions (push to branch) | Blocks Cloud Portal |
| Prod credentials in source? | Yes — in `.env.prod` | No — injected by portal |
| `.env.prod` needed? | Yes — with real values | No — omit or use placeholder |
| GitHub workflows needed? | Yes — dev.yml, stg.yml, main.yml | No — portal handles CI/CD |
| Use `@seliseblocks/cli`? | Yes — `blocks init --env` | Yes — for dev/stg credentials only |
| When to use | Full pipeline control required | Simplest path, portal-managed |

> **Important:** If the user says "deploy via cloud portal" or "blocks cloud deployment" without mentioning GitHub workflows, assume **Path 2**. Do NOT generate `.env.prod` with real credentials in Path 2 — the portal handles production credentials.

---

## Project Structure for Deployment Readiness

A deployment-ready project has:

| Component | File(s) | Required (Path 1) | Required (Path 2) |
|-----------|---------|:-----------------:|:-----------------:|
| Environment configs | `.env.dev`, `.env.stg` | ✅ Yes | ✅ Yes (with real values) |
| Production env config | `.env.prod` | ✅ Yes (real values) | ❌ No (portal injects) |
| Build scripts | `package.json` with `build:dev`, `build:stg`, `build:prod` | ✅ Yes | ✅ Yes (dev/stg only) |
| Container definition | `Dockerfile` | ✅ Yes | ✅ Yes |
| Web server config | `nginx.conf` | ✅ Yes | ✅ Yes |
| CI/CD pipelines | `.github/workflows/dev.yml`, `stg.yml`, `main.yml` | ✅ Yes | ❌ No |
| Environment switcher | `set-env.cjs` | ✅ Yes | ✅ Yes |
| Build tool config | `vite.config.ts` (or equivalent) | ✅ Yes | ✅ Yes |

---

## Check Actions

Run these in parallel to assess readiness:

- `checks/check-env-files.md` — Verify .env files exist with required variables
- `checks/check-build-config.md` — Verify package.json, vite.config, build scripts
- `checks/check-dockerfile.md` — Verify Dockerfile exists and is valid
- `checks/check-github-workflows.md` — Verify .github/workflows/ for CI/CD
- `checks/check-hosting-config.md` — Verify domain/hosting configuration

After all parallel checks pass, run sequentially:

- `checks/check-build-passes.md` — Verify `npm run build:dev`, `build:stg`, and `build:prod` all execute successfully. **Do not skip this check** — passing build scripts are not the same as passing builds.

---

## Reference Templates

Templates live in `references/`. All templates are derived from `canonical-example.md` — the single source of truth for this skill.

| Template | File | Purpose |
|----------|------|---------|
| Canonical example | `references/canonical-example.md` | Full project with all files — source of truth |
| Env variables | `references/env-variables.md` | Per-env variable definitions |
| GitHub workflows | `references/github-workflows.md` | dev.yml, stg.yml, main.yml + reusable workflows |
| Dockerfile | `references/dockerfile-template.md` | Two-stage build: node builder → nginx runtime |

### Canonical Dockerfile Pattern

```dockerfile
FROM node:21.7.0-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG ci_build
RUN mkdir -p /app/log
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build:${ci_build}

FROM nginx:stable-alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

Key: `npm run build:${ci_build}` (shell expansion, not plain `$ci_build`). The `ci_build` arg maps to `build:dev`, `build:stg`, `build:prod` scripts.

### Canonical nginx.conf Pattern

```nginx
server {
  root /usr/share/nginx/html/;
  server_tokens off;
  client_max_body_size 200m;
  gzip on;
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

Key: `try_files` SPA fallback — without it, direct navigation to non-root routes returns 404.

### Canonical GitHub Workflow Pipeline

```
Push to dev/stg/main branch
        │
        ├── dev.yml / stg.yml / main.yml
        │         │
        │         ├── 1_test.yml ──► Run tests
        │         │
        │         ├── 2_sonar.yml ──► SonarQube analysis
        │         │
        │         └── 3_web.yml ──► az acr build → helm upgrade --namespace dev/stg/prod-<repo>
        │                              │
        │                              └── Image: <registry>.azurecr.io/dev-<repo>-webclient:<sha>
        │
        ▼
Azure Container Registry (ACR)
        │
        ▼
Azure Kubernetes Service (AKS)
        │
        └── Namespace: dev/stg/prod-<repo>
        └── Ingress: dev/stg/prod-<repo>.seliseblocks.com
```

### Canonical vars.env

```
SERVICE_NAME=<repo>
REPO_NAME=<repo>
SOLUTION_NAME=<repo>
DOCKERFILE=Dockerfile
SONARQUBE_HOST=https://code.selise.biz
AUTHOR=<github-org>
```

> All file contents (Dockerfile, nginx.conf, set-env.cjs, workflows, env files) are fully documented in `references/canonical-example.md`. This table gives the canonical patterns at a glance.

---

## Required Environment Variables

> `VITE_BLOCKS_OIDC_REDIRECT_URI` is listed here because it appears in the env file templates but was missing from the required env vars table. Always include it — OIDC login fails silently without it.

> **Path 2 (Cloud Portal Direct):** Only `.env.dev` and `.env.stg` need real values. Do NOT put real credentials in `.env.prod` — the portal injects them at runtime. Use `<get from cloud portal>` as a placeholder.

### Framework Env Prefix

Vite and Next.js use different prefixes for browser-exposed variables:

| Framework | Prefix | Example |
|-----------|--------|---------|
| Vite / React SPA | `VITE_` | `VITE_API_BASE_URL`, `VITE_X_BLOCKS_KEY` |
| Next.js | `NEXT_PUBLIC_` | `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_X_BLOCKS_KEY` |
| Angular | None (no browser prefix) | `API_BASE_URL`, `X_BLOCKS_KEY` (injected at build) |

> **Angular note:** Angular apps do not expose env vars to the browser at runtime. Use Angular environment files (`src/environments/environment.ts`) instead. These are swapped at build time by the Angular CLI.

### Per-Framework Variable Names

**Vite / React SPA:**

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | Yes | API endpoint (dev/stg/prod) |
| `VITE_X_BLOCKS_KEY` | Yes | Blocks project key |
| `VITE_PROJECT_SLUG` | Yes | Project identifier |
| `VITE_BLOCKS_OIDC_CLIENT_ID` | Yes | OIDC client for auth |
| `VITE_BLOCKS_OIDC_REDIRECT_URI` | Yes | OIDC redirect URI (must match deployed domain) |
| `VITE_CAPTCHA_SITE_KEY` | No | CAPTCHA key (optional) |
| `VITE_CAPTCHA_TYPE` | No | reCaptcha or hCaptcha |

**Next.js (use `NEXT_PUBLIC_` prefix):**

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | API endpoint |
| `NEXT_PUBLIC_X_BLOCKS_KEY` | Yes | Blocks project key |
| `NEXT_PUBLIC_PROJECT_SLUG` | Yes | Project identifier |
| `NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID` | Yes | OIDC client for auth |
| `NEXT_PUBLIC_BLOCKS_OIDC_REDIRECT_URI` | Yes | OIDC redirect URI |
| `NEXT_PUBLIC_CAPTCHA_SITE_KEY` | No | CAPTCHA key |
| `NEXT_PUBLIC_CAPTCHA_TYPE` | No | reCaptcha or hCaptcha |

### Per-Environment Values

| Variable | dev | stg | prod |
|----------|-----|-----|------|
| `VITE_API_BASE_URL` | `https://dev-api.seliseblocks.com` | `https://stg-api.seliseblocks.com` | `https://api.seliseblocks.com` |
| `VITE_BLOCKS_OIDC_REDIRECT_URI` | `https://dev-{slug}.seliseblocks.com/oidc` | `https://stg-{slug}.seliseblocks.com/oidc` | `https://{slug}.seliseblocks.com/oidc` |
| `NEXT_PUBLIC_API_BASE_URL` | `https://dev-api.seliseblocks.com` | `https://stg-api.seliseblocks.com` | `https://api.seliseblocks.com` |
| `NEXT_PUBLIC_BLOCKS_OIDC_REDIRECT_URI` | `https://dev-{slug}.seliseblocks.com/oidc` | `https://stg-{slug}.seliseblocks.com/oidc` | `https://{slug}.seliseblocks.com/oidc` |

### set-env.cjs

The environment switcher script referenced throughout this skill:

```javascript
const fs = require('fs');
const path = require('path');

const env = process.env.BUILD_ENV || 'dev';
const envFile = `.env.${env}`;
const targetFile = path.join(__dirname, '.env');

if (!fs.existsSync(envFile)) {
  console.error(`❌ Error: ${envFile} does not exist.`);
  process.exit(1);
}

fs.copyFileSync(envFile, targetFile);
console.log(`✅ Successfully set environment: ${envFile} → .env`);
```

**Build scripts** use `BUILD_ENV` to select the correct file:

```json
{
  "scripts": {
    "build:dev": "BUILD_ENV=dev node set-env.cjs && vite build",
    "build:stg": "BUILD_ENV=stg node set-env.cjs && vite build",
    "build:prod": "BUILD_ENV=prod node set-env.cjs && vite build"
  }
}
```

**`vite.config.ts`** must expose `VITE_` prefix and match the Dockerfile output path:

```typescript
export default defineConfig({
  envPrefix: 'VITE_',
  build: {
    outDir: 'build',   // Vite: /app/build, Angular: /app/dist/<name>, Next.js: /app/out
  },
});
```

---

## Deployment Target

> **This skill targets Azure only.** The deployment pipeline is: GitHub Actions → Azure Container Registry (ACR) → Azure Kubernetes Service (AKS) via Helm. AWS and GCP are not supported by this skill's templates. If a user asks about AWS/GCP, acknowledge the limitation and note it as a future enhancement.

---

## CLI Commands for User Credential Setup

```
npm install -g @seliseblocks/cli
blocks login
blocks status
blocks deploy --env dev
blocks init --env
```

---

## Common Pitfalls

> [!WARNING]
>
> - **Never ask users to share credentials with AI** — Use `@seliseblocks/cli` for credential setup. Never generate files with real API keys or passwords.
>
> - **Generate templates, not real values** — When creating env files, use placeholder comments like `# VITE_X_BLOCKS_KEY = <get from blocks CLI>`. Never embed actual credentials.
>
> - **Don't assume all env vars are present** — Check each env file individually. `.env.dev`, `.env.stg`, and `.env.prod` may have different variable coverage.
>
> - **Path 2 (Cloud Portal Direct): skip real prod credentials** — Do NOT generate `.env.prod` with real credentials. The portal injects them at runtime. Use placeholder values or omit the file entirely.
>
> - **Use correct env prefix per framework** — Vite apps use `VITE_*`, Next.js uses `NEXT_PUBLIC_*`. Using the wrong prefix means the variable is `undefined` at runtime.
>
> - **Verify build script names match CI workflow** — The `ci_build` arg in the Dockerfile maps to `build:dev`, `build:stg`, `build:prod` scripts in package.json. Mismatched names cause ACR build failures.
>
> - **Include set-env.cjs when generating build scripts** — The build scripts should call `node set-env.cjs` to copy the correct `.env.{env}` file before building.
>
> - **Generate all workflow files together** — dev.yml, stg.yml, main.yml, and the reusable workflows (3_web.yml, etc.) should be generated as a set. Incomplete workflow sets cause CI failures.
>
> - **Don't trigger deployment for the user** — This skill prepares code only. Triggering builds is handled by `blocks-deployment` via GitHub webhooks or API calls.

---

## Verification Checklist

After preparing a project for deployment, verify all items:

### Readiness Assessment
- [ ] All 5 parallel check actions run (env files, build config, Dockerfile, workflows, hosting config)
- [ ] Build execution check (`check-build-passes`) run sequentially after parallel checks pass
- [ ] Each check produces structured output with ✅/⚠️/❌ indicators
- [ ] Missing components identified and offered for generation
- [ ] Failed builds identified and remediation offered before proceeding
- [ ] Deployment Readiness Report shown to user with summary status

### Dockerfile Generation
- [ ] Two-stage build: `FROM node:*-alpine AS builder` → `FROM nginx:stable-alpine`
- [ ] `ARG ci_build` defined and `npm run build:${ci_build}` called (note `${}` syntax)
- [ ] `NODE_OPTIONS="--max-old-space-size=4096"` for memory management
- [ ] Output path matches project: `/app/build` (Vite) or `/app/dist/<name>` (Angular)
- [ ] `nginx.conf` copied to `/etc/nginx/conf.d/default.conf`
- [ ] `.dockerignore` generated (recommended)

### nginx.conf Configuration
- [ ] `try_files $uri $uri/ /index.html;` SPA fallback present
- [ ] `root /usr/share/nginx/html/;` correct
- [ ] `gzip on;` enabled
- [ ] `server_tokens off;` for security

### Env Files
- [ ] `.env.dev` and `.env.stg` generated with real credentials (from `@seliseblocks/cli`)
- [ ] `.env.prod` handled correctly per deployment path:
    - Path 1 (CI/CD): `.env.prod` generated with real credentials
    - Path 2 (Cloud Portal): `.env.prod` omitted or uses placeholder `<get from cloud portal>` — no real values
- [ ] Correct env prefix used per framework:
    - Vite: `VITE_*` (e.g., `VITE_API_BASE_URL`)
    - Next.js: `NEXT_PUBLIC_*` (e.g., `NEXT_PUBLIC_API_BASE_URL`)
    - Angular: No prefix, use `src/environments/`
- [ ] Required vars present in dev/stg: `*_API_BASE_URL`, `*_X_BLOCKS_KEY`, `*_PROJECT_SLUG`, `*_BLOCKS_OIDC_CLIENT_ID`, `*_BLOCKS_OIDC_REDIRECT_URI`
- [ ] `*_API_BASE_URL` values correct per environment (dev/stg/prod endpoints)
- [ ] Placeholder comments used: `<get from blocks CLI>`, `<get from cloud portal>`, `<placeholder>`
- [ ] No real credentials embedded in Path 2 `.env.prod`

### Build Scripts (package.json)
- [ ] `build:dev`, `build:stg`, `build:prod` scripts present
- [ ] Each script calls `set-env.cjs` first: `BUILD_ENV=dev node set-env.cjs && vite build`
- [ ] `vite.config.ts` has `envPrefix: 'VITE_'`
- [ ] `vite.config.ts` `build.outDir` matches Dockerfile COPY path

### set-env.cjs
- [ ] Reads `BUILD_ENV` from environment variable (defaults to `'dev'`)
- [ ] Copies `.env.{env}` to `.env` using `fs.copyFileSync`
- [ ] Exits with error if target env file missing (`process.exit(1)`)
- [ ] Prints success message

### GitHub Workflows
- [ ] `dev.yml` triggers on push to `dev` branch
- [ ] `stg.yml` triggers on push to `stg` branch
- [ ] `main.yml` triggers on push to `main` branch
- [ ] `3_web.yml` called via `workflow_call`
- [ ] `.github/variables/vars.env` has `SERVICE_NAME`, `REPO_NAME`, `DOCKERFILE`
- [ ] Container names include environment prefix: `dev-`, `stg-`, `prod-`
- [ ] All workflow files generated as a complete set
- [ ] Secrets referenced as `${{ secrets.SECRET_NAME }}`
- [ ] No real credential values in workflow YAML

### Credential Safety
- [ ] User directed to `@seliseblocks/cli` for credential setup
- [ ] No real API keys, passwords, or tokens generated
- [ ] GitHub secrets pattern used throughout
- [ ] CLI commands provided: `npm install -g @seliseblocks/cli`, `blocks login`, `blocks init --env`

### Angular/Next.js Adaptation
- [ ] Angular: Dockerfile uses `/app/dist/<project-name>` for output, `ng build` command, no browser prefix needed (use Angular environment files)
- [ ] Next.js: Uses `NEXT_PUBLIC_*` prefix for all browser-exposed env vars (not `VITE_*`)
- [ ] Next.js static export: `next.config.js` has `output: 'export'`, Dockerfile uses `/app/out` for output
- [ ] Build scripts use Angular CLI (`ng build`) or Next.js commands as appropriate
- [ ] nginx.conf SPA fallback (`try_files $uri $uri/ /index.html`) applies to all framework types
- [ ] `outDir` matches Dockerfile COPY path (`build`, `dist/<name>`, or `out`)

### Reference Usage
- [ ] `references/canonical-example.md` used as source of truth
- [ ] Dockerfile matches canonical example structure
- [ ] nginx.conf matches canonical example configuration
- [ ] set-env.cjs matches canonical example logic
- [ ] All check action files include inline verification checklists

---

## Intent Mapping

Use this table to route user requests. Check `flows/` first — if a flow covers the request, use it. For check-only requests, go directly to the check action.

| User wants to... | Use |
|------------------|-----|
| Make a project deployment-ready end-to-end | `flows/make-deployment-ready.md` |
| Check if a project is deployment-ready | All 6 check actions (5 parallel + 1 sequential build check) |
| Verify env files have required variables | `checks/check-env-files.md` |
| Verify build scripts and tooling | `checks/check-build-config.md` |
| Verify build scripts actually work | `checks/check-build-passes.md` |
| Verify Dockerfile exists and is valid | `checks/check-dockerfile.md` |
| Verify GitHub workflows for CI/CD | `checks/check-github-workflows.md` |
| Verify domain/hosting configuration | `checks/check-hosting-config.md` |
| Generate Dockerfile template | `references/dockerfile-template.md` |
| Generate GitHub workflow templates | `references/github-workflows.md` |
| Generate env file templates | `references/env-variables.md` |
| See canonical project structure | `references/canonical-example.md` |

---

## Action Index

### Checks

| Check | File | Description |
|-------|------|-------------|
| check-env-files | `checks/check-env-files.md` | Verify .env files exist with required variables |
| check-build-config | `checks/check-build-config.md` | Verify package.json, vite.config, build scripts |
| check-build-passes | `checks/check-build-passes.md` | Verify `npm run build:dev/stg/prod` all execute successfully |
| check-dockerfile | `checks/check-dockerfile.md` | Verify Dockerfile exists and is valid |
| check-github-workflows | `checks/check-github-workflows.md` | Verify .github/workflows/ for CI/CD |
| check-hosting-config | `checks/check-hosting-config.md` | Verify domain/hosting configuration |

---

## Troubleshooting

### Build Failures

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| ACR build fails | `ci_build` arg doesn't match script name | Use `npm run build:${ci_build}` (note `${}` syntax, not `$ci_build`) |
| ACR build fails | Missing `set-env.cjs` in build scripts | Add `BUILD_ENV=dev node set-env.cjs && vite build` |
| ACR build fails | Wrong output path | Verify `/app/build` for Vite, `/app/dist/<name>` for Angular |
| ACR build fails | Memory limit exceeded | Add `NODE_OPTIONS="--max-old-space-size=4096"` |
| ACR build fails | `.dockerignore` not excluding node_modules | Add `node_modules` to `.dockerignore` |

### Environment Variable Issues

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| Env vars not loaded | `set-env.cjs` not called | Verify build scripts call `node set-env.cjs` before `vite build` |
| Env vars not loaded | Wrong `BUILD_ENV` value | Check `BUILD_ENV=dev` (not `development` or `dev environment`) |
| Env vars not loaded | Target `.env.{env}` file missing | Verify `.env.dev`, `.env.stg` exist (`.env.prod` optional in Path 2) |
| `VITE_*` vars undefined at runtime | Missing `envPrefix: 'VITE_'` in vite.config.ts | Add `envPrefix: 'VITE_'` to Vite config |
| `NEXT_PUBLIC_*` vars undefined in Next.js | Using wrong prefix | Replace `VITE_*` with `NEXT_PUBLIC_*` for browser-exposed vars |
| `VITE_*` used in Next.js project | Wrong prefix for framework | Use `NEXT_PUBLIC_*` for Next.js — `VITE_*` is ignored |
| Wrong API endpoint | `VITE_API_BASE_URL` not per-env | Check each `.env.{env}` has correct endpoint URL |
| Prod app shows wrong API | `.env.prod` used in Path 2 deployment | Remove real credentials from `.env.prod` — portal injects them |
| Missing OIDC redirect | `VITE_BLOCKS_OIDC_REDIRECT_URI` absent | Add it — OIDC login fails silently without it |

### nginx/SSR Issues

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| 404 on non-root routes | Missing SPA fallback | Add `try_files $uri $uri/ /index.html;` |
| 404 on direct navigation | nginx.conf not in container | Verify `COPY nginx.conf /etc/nginx/conf.d/default.conf` in Dockerfile |
| File upload too large | Default nginx body size | Add `client_max_body_size 200m;` to nginx.conf |
| Slow page loads | Gzip not enabled | Add `gzip on;` to nginx.conf |

### GitHub Workflow Issues

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| Workflow can't find Dockerfile | `DOCKERFILE` var not set | Add `DOCKERFILE=Dockerfile` to `.github/variables/vars.env` |
| Workflow fails on ACR build | Missing Azure secrets | Add `AZURE_CREDENTIALS`, `AZURE_CONTAINER_REGISTRY` to GitHub Secrets |
| Workflow fails on AKS deploy | Missing Helm values | Verify `l0-yml-infrastructure-helm` submodule is fetched |
| Deployment not triggering | Wrong branch name | Push to `dev`, `stg`, or `main` branch |
| Image tag not found | ACR image not pushed | Verify `az acr build` succeeded before `helm upgrade` |
| Permission denied on ACR | Azure login failed | Verify `azure/login@v2` step runs before ACR build |

### AKS/Kubernetes Issues

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| Pods not starting | Image pull failure | Verify ACR image path: `<registry>.azurecr.io/<container>:<tag>` |
| Pods not starting | Helm values mismatch | Check `<cluster>/<service>-webclient.values.yaml` exists |
| Service unreachable | Wrong namespace | Verify namespace format: `dev/stg/prod-<REPO_NAME>` |
| OIDC login fails | Wrong redirect URI | Check `VITE_BLOCKS_OIDC_REDIRECT_URI` matches domain |

### Credential/Security Issues

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| Deployment requires credentials | User entered values manually | Direct user to `@seliseblocks/cli`: `blocks login && blocks init --env` |
| API key exposed in file | Real credentials in template (Path 2) | Regenerate `.env.prod` with `<get from cloud portal>` — portal injects at runtime |
| GitHub workflow fails | Secrets not configured | Go to GitHub repo → Settings → Secrets → Actions |
| Prod credentials in source | `.env.prod` has real values in Path 2 | Remove `.env.prod` or use placeholder — portal manages production |
| Real credentials in GitHub | `.env.prod` committed to repo | Remove from source, re-generate with placeholder |

### Angular/Next.js Issues

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| Build output not found | Wrong dist path | Change `/app/build` to `/app/dist/<project-name>` in Dockerfile |
| Angular build fails | Missing Angular CLI | Dockerfile builder stage needs `npm install` before build |
| Next.js static export fails | No `output: 'export'` config | Add `output: 'export'` to `next.config.js` |
| Next.js routes 404 | Static export mode | Ensure all routes use client-side navigation (Next.js Link) | |
