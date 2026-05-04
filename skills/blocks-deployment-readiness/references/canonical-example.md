# Canonical Example: Deployment-Ready Project

This document serves as the canonical example for all deployment-ready Blocks projects. Every template, check, and guide in this skill is derived from the patterns documented here.

---

## Project Structure

```
blocks-website-next/
├── Dockerfile                    # Multi-stage container build (node builder + node+nginx runner)
├── nginx.conf                   # Reverse proxy configuration
├── start.sh                     # Startup orchestrator (Next.js + nginx)
├── next.config.ts               # Next.js config with standalone output
├── package.json                 # Scripts, dependencies, build commands
├── .env.dev                     # Development env vars
├── .env.stg                     # Staging env vars
├── .env.prod                    # Production env vars
└── src/                         # Application source
```

---

## Primary Pattern: Next.js Standalone

The canonical pattern uses Next.js in standalone mode with nginx as a reverse proxy.

### Dockerfile

**Stage 1 — Builder:**
- Base: `node:21-alpine`
- Installs dependencies
- Accepts `ci_build` arg (`dev`/`prod`)
- Copies `.env.${ci_build}` → `.env.local`
- Sets `NEXT_ENV` env var
- Runs `npm run build:${ci_build}`
- Output: `.next/standalone/` + `.next/static/` + `public/`

**Stage 2 — Runner:**
- Base: `node:21-alpine`
- Installs nginx
- Copies Next.js standalone build from Stage 1
- Copies `nginx.conf` to `/etc/nginx/http.d/default.conf`
- Runs `start.sh`

```dockerfile
FROM node:21-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG ci_build

RUN mkdir -p /app/log

COPY .env.${ci_build} .env.local

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_ENV=${ci_build}
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build:${ci_build}

# ── Runner ─────────────────────────────────────────────────────────────────────
FROM node:21-alpine AS runner

WORKDIR /app

RUN apk add --no-cache nginx

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir -p .next && chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

COPY nginx.conf /etc/nginx/http.d/default.conf

COPY start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 80

CMD ["./start.sh"]
```

**Key points:**
- `ci_build` maps to `build:dev`, `build:stg`, or `build:prod` scripts
- `NEXT_ENV` set to `development`, `staging`, or `production` (values: `development`/`staging`/`production`, not `dev`/`stg`/`prod`)
- `COPY .env.${ci_build} .env.local` — Next.js reads `.env.local` by convention. Each build target loads its corresponding `.env.dev`, `.env.stg`, or `.env.prod` file
- Memory limit of 4GB prevents OOM during large builds

---

## nginx.conf (Reverse Proxy)

The canonical nginx configuration proxies to the Next.js server running on port 3000:

```nginx
server {
  server_tokens off;
  client_max_body_size 200m;
  gzip             on;
  gzip_comp_level  6;
  gzip_min_length  1000;
  gzip_proxied     expired no-cache no-store private auth;
  gzip_types       text/plain application/x-javascript text/xml text/css application/xml text/javascript application/javascript application/json application/font-woff application/font-woff2 application/vnd.ms-fontobject application/x-font-ttf font/opentype;

  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

**Key points:**
- Proxies to `localhost:3000` where Next.js runs (not static file serving)
- WebSocket support via `Upgrade` headers
- No `try_files` — Next.js handles all routing
- 200MB max body size for file uploads

---

## start.sh

The startup script launches Next.js in the background, waits briefly, then starts nginx in the foreground:

```sh
#!/bin/sh
set -e

# Start Next.js standalone server in the background (port 3000)
node server.js &

# Wait briefly to give Next.js a moment to start before nginx begins proxying
sleep 2

# Start nginx in foreground (keeps the container alive)
nginx -g 'daemon off;'
```

**Key points:**
- Next.js runs in background, nginx in foreground
- Container stays alive because nginx runs in foreground

---

## next.config.ts

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
```

**Key points:**
- `output: 'standalone'` — produces a self-contained build in `.next/standalone/`
- No `output: 'export'` — this is not a static export
- `server.js` in `.next/standalone/` is the entry point
- `images.remotePatterns` — add all external image hostnames the app uses (CDNs, cloud storage, etc.). Without this, Next.js Image component will block external images at runtime. Common patterns to add:
  - `images.unsplash.com` — Unsplash photo CDN
  - `*.amazonaws.com` — S3 / CloudFront
  - `*.googleusercontent.com` — Google Cloud Storage
  - `*.akamai.net` — Akamai CDN

**Key points:**
- `output: 'standalone'` — produces a self-contained build in `.next/standalone/`
- No `output: 'export'` — this is not a static export
- `server.js` in `.next/standalone/` is the entry point

---

## package.json Build Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "build:dev": "NEXT_ENV=development next build",
    "build:stg": "NEXT_ENV=staging next build",
    "build:prod": "NEXT_ENV=production next build",
    "start": "next start",
    "lint": "eslint"
  }
}
```

**Key points:**
- Three build scripts: `build:dev`, `build:stg`, and `build:prod` — one per environment
- `NEXT_ENV` set to `development`, `staging`, or `production` (not `dev`/`stg`/`prod`)
- `ci_build` arg in Dockerfile maps to the correct script and env file: `dev` → `.env.dev`, `stg` → `.env.stg`, `prod` → `.env.prod`
- No `set-env.cjs` — env switching done via Dockerfile `COPY .env.${ci_build} .env.local`

---

## Environment Files

### .env.dev
```bash
# Development Environment
NEXT_PUBLIC_BLOCKS_API_URL=https://api.seliseblocks.com
NEXT_PUBLIC_X_BLOCKS_KEY=<your-project-key>
```

### .env.stg
```bash
# Staging Environment
NEXT_PUBLIC_BLOCKS_API_URL=https://api.seliseblocks.com
NEXT_PUBLIC_X_BLOCKS_KEY=<your-project-key>
```

### .env.prod
```bash
# Production Environment
NEXT_PUBLIC_BLOCKS_API_URL=https://api.seliseblocks.com
NEXT_PUBLIC_X_BLOCKS_KEY=<your-project-key>
```

**Key points:**
- Only `NEXT_PUBLIC_*` variables (Next.js convention)
- Minimal set — only what's actually used by the app
- Use placeholder `<your-project-key>` — never embed real credentials in templates
- All three env files (`.env.dev`, `.env.stg`, `.env.prod`) should always exist. For Path 2, `.env.prod` uses placeholder values — the portal injects real credentials at runtime
- Each env file maps to its corresponding `build:dev`, `build:stg`, `build:prod` script via the `ci_build` Dockerfile argument

---

## Fallback Pattern: Static File Serving (Vite / Angular / Flutter / Blazor WASM)

For Vite or Angular projects that don't use Next.js standalone, fall back to the nginx-static pattern.

### Dockerfile (Vite/Angular)
```dockerfile
FROM node:21-alpine AS builder
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

### nginx.conf (Static, for Vite/Angular)
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

### package.json (Vite)
```json
{
  "scripts": {
    "build:dev": "vite build",
    "build:stg": "vite build",
    "build:prod": "vite build"
  }
}
```

**Key points for Vite/Angular:**
- nginx serves static files from `/usr/share/nginx/html/`
- `try_files $uri $uri/ /index.html` — SPA fallback required
- Build output: `/app/build` (Vite), `/app/dist/<name>` (Angular), `/app/build/web` (Flutter), `/app/publish/wwwroot` (Blazor WASM)

**Flutter Web:** Builds to `build/web/`, deploys as static files with nginx.

**Blazor WebAssembly:** Builds to `publish/wwwroot/`, deploys as static files with nginx.

**Blazor Server:** Uses dotnet runtime image, no nginx needed — the app runs as a dotnet process on port 80.

---

## Checklist for Checking Against This Reference

### Next.js Standalone Pattern
- [ ] Dockerfile has two stages (node builder → node+nginx runner)
- [ ] Dockerfile accepts `ci_build` ARG
- [ ] Dockerfile copies `.env.${ci_build}` → `.env.local`
- [ ] Dockerfile sets `ENV NEXT_ENV=${ci_build}`
- [ ] `npm run build:${ci_build}` called in Dockerfile
- [ ] Stage 2 installs nginx (`apk add --no-cache nginx`)
- [ ] Stage 2 copies `.next/standalone/`, `.next/static/`, `public/`
- [ ] nginx.conf proxies to `http://localhost:3000`
- [ ] nginx.conf copied to `/etc/nginx/http.d/default.conf`
- [ ] `start.sh` exists and launches `node server.js` + `nginx`
- [ ] `next.config.ts` has `output: 'standalone'`
- [ ] package.json has `build:dev`, `build:stg`, and `build:prod` scripts
- [ ] Build scripts use `NEXT_ENV=development/staging/production` (not `BUILD_ENV=dev/stg/prod`)
- [ ] `.env.dev`, `.env.stg`, and `.env.prod` always exist (prod uses placeholders for Path 2)
- [ ] No real credentials — use placeholder `<your-project-key>`
- [ ] No `set-env.cjs` in Next.js projects

### Vite/Angular Fallback Pattern
- [ ] Dockerfile has two stages (node builder → nginx static)
- [ ] nginx.conf serves static files with SPA fallback
- [ ] Build output path matches Dockerfile COPY path

### Flutter Web Pattern
- [ ] Dockerfile builder installs Flutter SDK or uses Flutter pre-installed iGmage
- [ ] Build output at `/app/build/web` copied to nginx html root
- [ ] nginx.conf serves static files with SPA fallback

### Blazor WebAssembly Pattern
- [ ] Dockerfile uses .NET SDK for build, nginx:alpine for serving
- [ ] Build output at `/app/publish/wwwroot` copied to nginx html root

### Blazor Server Pattern
- [ ] Dockerfile uses dotnet runtime image, not nginx
- [ ] `EXPOSE 80` and `CMD ["dotnet", "MyApp.dll"]`
- [ ] `build:dev`, `build:stg`, `build:prod` scripts present

### Env Files (all frameworks)
- [ ] Correct prefix used per framework:
  - Next.js: `NEXT_PUBLIC_*`
  - Vite: `VITE_*`
  - Angular: No prefix (use `environment.ts`)
- [ ] Placeholder values used — no real credentials in templates
- [ ] `.env.dev` and `.env.prod` exist (or `.env.dev` only for Cloud Portal)
