# Canonical Example: Deployment-Ready Project

This document serves as the canonical example for all deployment-ready Blocks projects. Every template, check, and guide in this skill is derived from the patterns documented here.

---

## Project Structure

```
blocks-react-construct/
├── Dockerfile                    # Multi-stage container build
├── nginx.conf                   # Web server configuration
├── set-env.cjs                  # Environment file switcher
├── vite.config.ts               # Build tool configuration
├── package.json                 # Scripts, dependencies, build commands
├── index.html                   # SPA entry point
├── .env.dev                     # Development env vars
├── .env.stg                     # Staging env vars
├── .env.prod                    # Production env vars
├── .github/
│   ├── workflows/
│   │   ├── dev.yml              # Dev deployment pipeline
│   │   ├── stg.yml              # Staging deployment pipeline
│   │   ├── main.yml             # Production deployment pipeline
│   │   ├── 1_test.yml           # Test runner (reusable)
│   │   ├── 2_sonar.yml          # SonarQube analysis (reusable)
│   │   ├── 3_web.yml            # ACR build + AKS deploy (reusable)
│   │   ├── 3_stg_web.yml       # Staging web deploy (reusable)
│   │   └── 4_storybook.yml      # Storybook build/deploy (optional)
│   ├── variables/
│   │   └── vars.env             # Repository-level variables
│   └── actions/
│       └── setvars/             # Custom action for loading vars.env
└── src/                         # Application source
```

---

## Dockerfile

The canonical Dockerfile uses a two-stage build:

**Stage 1 — Builder:**
- Base: `node:21.7.0-alpine`
- Installs dependencies
- Accepts `ci_build` arg (dev/stg/prod)
- Runs `npm run build:${ci_build}` which internally calls `set-env.cjs`
- Output: `/app/build/`

**Stage 2 — Runtime:**
- Base: `nginx:stable-alpine`
- Copies build output from Stage 1
- Copies `nginx.conf` to nginx config dir

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

**Key points:**
- `ci_build` maps to `build:dev`, `build:stg`, `build:prod` scripts
- Memory limit of 4GB prevents OOM during large builds
- Multi-stage keeps final image minimal (~25MB)

---

## nginx.conf

The canonical nginx configuration:

```nginx
server {
  root /usr/share/nginx/html/;
  server_tokens off;
  client_max_body_size 200m;
  gzip             on;
  gzip_comp_level  6;
  gzip_min_length  1000;
  gzip_proxied     expired no-cache no-store private auth;
  gzip_types       text/plain application/x-javascript text/xml text/css application/xml text/javascript application/javascript application/json application/font-woff application/font-woff2 application/vnd.ms-fontobject application/x-font-ttf font/opentype;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

**Key points:**
- `try_files $uri $uri/ /index.html` — SPA fallback for client-side routing
- Gzip compression for all text-based assets
- 200MB max body size for file uploads

---

## set-env.cjs

Environment file switcher that copies `.env.{env}` to `.env` before build:

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

**Key points:**
- Uses `BUILD_ENV` env var (set by `build:dev`, `build:stg`, `build:prod`)
- Exits with error if target env file missing
- Synchronous copy before Vite build starts

---

## package.json Build Scripts

```json
{
  "scripts": {
    "build:dev": "BUILD_ENV=dev npm run set-env && vite build",
    "build:stg": "BUILD_ENV=stg npm run set-env && vite build",
    "build:prod": "BUILD_ENV=prod npm run set-env && vite build",
    "set-env": "node set-env.cjs"
  }
}
```

**Key points:**
- `BUILD_ENV` passed to `set-env.cjs` which selects `.env.dev`, `.env.stg`, or `.env.prod`
- `set-env` script runs before `vite build`
- Chain: `build:dev` → `set-env` → `vite build`

---

## vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  envPrefix: 'VITE_',
  build: {
    outDir: 'build',
    sourcemap: false,
  },
  server: {
    host: true,
    allowedHosts: true,
  },
});
```

**Key points:**
- `envPrefix: 'VITE_'` — exposes only `VITE_*` variables to client
- `outDir: 'build'` — matches Dockerfile COPY path
- `allowedHosts: true` — required for multi-tenant deployment

---

## Environment Files

### .env.dev
```bash
# Development environment
VITE_API_BASE_URL=https://dev-api.seliseblocks.com
VITE_X_BLOCKS_KEY=<get via: blocks config show --key>
VITE_PROJECT_SLUG=<your-dev-project-slug>
VITE_BLOCKS_OIDC_CLIENT_ID=<get via: blocks config show --oidc>
VITE_BLOCKS_OIDC_REDIRECT_URI=https://dev-construct.seliseblocks.com/oidc
GENERATE_SOURCEMAP=false
VITE_CAPTCHA_SITE_KEY=<get from cloud portal>
VITE_CAPTCHA_TYPE=reCaptcha
```

### .env.stg
```bash
# Staging environment
VITE_API_BASE_URL=https://stg-api.seliseblocks.com
VITE_X_BLOCKS_KEY=<get via: blocks config show --key>
VITE_PROJECT_SLUG=<your-stg-project-slug>
VITE_BLOCKS_OIDC_CLIENT_ID=<get via: blocks config show --oidc>
VITE_BLOCKS_OIDC_REDIRECT_URI=https://stg-construct.seliseblocks.com/oidc
GENERATE_SOURCEMAP=false
```

### .env.prod
```bash
# Production environment
VITE_API_BASE_URL=https://api.seliseblocks.com
VITE_X_BLOCKS_KEY=<get via: blocks config show --key>
VITE_PROJECT_SLUG=<your-prod-project-slug>
VITE_BLOCKS_OIDC_CLIENT_ID=<get via: blocks config show --oidc>
VITE_BLOCKS_OIDC_REDIRECT_URI=https://construct.seliseblocks.com/oidc
GENERATE_SOURCEMAP=false
```

---

## GitHub Variables (.github/variables/vars.env)

```
SONARQUBE_HOST=https://code.selise.biz
AUTHOR=<github-org>
REPO_NAME=blocks-react-construct
SOLUTION_NAME=construct
SERVICE_NAME=construct
DOCKERFILE=Dockerfile
STORYBOOK_DOCKERFILE=storybook.Dockerfile
```

---

## GitHub Workflows Summary

### dev.yml — Dev Deployment
- Trigger: Push to `dev` branch
- Runs: `2_sonar.yml` → `3_web.yml`
- Container: `dev-construct-webclient`
- Namespace: `dev-blocks-react-construct`

### stg.yml — Staging Deployment
- Trigger: Push to `stg` branch
- Runs: `3_stg_web.yml`
- Container: `stg-construct-webclient`
- Namespace: `stg-blocks-react-construct`

### main.yml — Production Deployment
- Trigger: Push to `main` branch, PR to `main`
- Runs: `3_web.yml` (no sonar on push)
- Container: `prod-construct-webclient`
- Namespace: `prod-blocks-react-construct`

---

## Deployment Pipeline Flow

```
Push to branch
     │
     ▼
GitHub Actions (dev.yml / stg.yml / main.yml)
     │
     ├──► 1_test.yml ───► Run tests & lint
     │
     ├──► 2_sonar.yml ──► SonarQube analysis
     │
     └──► 3_web.yml ────► Build Docker image
             │                │
             │                ├── ACR build (az acr build)
             │                │
             │                └── Deploy to AKS (helm upgrade)
             │                      │
             │                      └── Helm chart: ecap3-webclient
             │                      └── Values: <cluster>/construct-webclient.values.yaml
             │
             ▼
     Azure Container Registry (ACR)
             │
             └── Image: <registry>.azurecr.io/<container>:<sha>
             │
             ▼
     Azure Kubernetes Service (AKS)
             │
             └── Namespace: dev/stg/prod-blocks-react-construct
             │
             └── Pod: dev/stg/prod-construct-webclient
             │
             └── Service: dev/stg/prod-construct-webclient
             │
             └── Ingress: dev/stg/prod-construct.seliseblocks.com
```

---

## Angular Adaptation

When adapting for Angular projects:

1. **Dockerfile:** Change build output path from `/app/build` to `/app/dist/<project-name>`
2. **nginx.conf:** Same SPA fallback required
3. **package.json scripts:** Same pattern with `BUILD_ENV` and `set-env.cjs`
4. **set-env.cjs:** Same logic — no changes needed

```dockerfile
FROM node:21.7.0-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG ci_build
RUN npm run build:${ci_build}
FROM nginx:stable-alpine
COPY --from=builder /app/dist/<project-name> /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

---

## Key Files for Reference

The canonical files are sourced from the `blocks-react-construct` sample project. These files are the authoritative reference when templates in this skill conflict.

| What you need | Description |
|---------------|-------------|
| Dockerfile | Multi-stage build: node:alpine builder → nginx:alpine runtime |
| nginx.conf | SPA fallback, gzip, security headers |
| set-env.cjs | Environment file switcher (BUILD_ENV → .env.{env}) |
| package.json scripts | build:dev, build:stg, build:prod with set-env call |
| vite.config.ts | envPrefix: 'VITE_', outDir: 'build' |
| GitHub workflows | dev.yml, stg.yml, main.yml + reusable workflows |
| vars.env | SERVICE_NAME, REPO_NAME, DOCKERFILE variables |

---

## Checklist for Checking Against This Reference

- [ ] Dockerfile has two stages (node builder → nginx runtime)
- [ ] Dockerfile accepts `ci_build` ARG
- [ ] `npm run build:${ci_build}` is called in Dockerfile
- [ ] nginx.conf has `try_files $uri $uri/ /index.html`
- [ ] set-env.cjs copies `.env.{env}` to `.env`
- [ ] package.json has `build:dev`, `build:stg`, `build:prod` scripts
- [ ] Scripts call `set-env` before `vite build`
- [ ] vite.config.ts has `envPrefix: 'VITE_'`
- [ ] vite.config.ts `build.outDir` matches Dockerfile COPY path
- [ ] `.env.dev`, `.env.stg`, `.env.prod` all exist
- [ ] No real credentials in env files — use placeholder comments
- [ ] `.github/variables/vars.env` exists with SERVICE_NAME, REPO_NAME, DOCKERFILE
- [ ] GitHub workflows exist for dev, stg, and main branches
