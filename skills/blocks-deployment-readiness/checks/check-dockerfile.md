# check-dockerfile

Verifies that a project has a valid Dockerfile for building a container image to deploy to Azure Container Registry (ACR) and Azure Kubernetes Service (AKS).

## When to Run

Part of the deployment-readiness check suite. Run alongside other check actions in parallel.

## How to Check

### Step 1: Look for Dockerfile

Check for the existence of `Dockerfile` in the project root. Also check for `storybook.Dockerfile` if the project uses Storybook.

### Step 2: Detect Pattern

First determine which deployment pattern the project uses:

**Check for Next.js standalone pattern:**
- `next.config.ts` has `output: 'standalone'` → **Next.js standalone (PRIMARY)**
- `vite.config.ts` present → **Vite static (FALLBACK)**
- `angular.json` present → **Angular static (FALLBACK)**
- `pubspec.yaml` present → **Flutter web (FALLBACK)**
- `*.csproj` with Blazor → **Blazor WASM (static) or Blazor Server (dotnet runtime)**

### Step 3: Verify Next.js Standalone Pattern (Primary)

For Next.js standalone projects, the Dockerfile should have:

**Stage 1 — Builder:**
```dockerfile
FROM node:21-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG ci_build
COPY .env.${ci_build} .env.local
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_ENV=${ci_build}
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build:${ci_build}
```

**Stage 2 — Runner:**
```dockerfile
FROM node:21-alpine AS runner
WORKDIR /app
RUN apk add --no-cache nginx
ENV NODE_ENV=production ENV PORT=3000
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY nginx.conf /etc/nginx/http.d/default.conf
COPY start.sh ./start.sh
RUN chmod +x ./start.sh
EXPOSE 80
CMD ["./start.sh"]
```

Key indicators:
- Stage 2 uses `node:21-alpine` not `nginx:stable-alpine`
- nginx installed via `apk add --no-cache nginx`
- `.next/standalone/` copied from builder
- `nginx.conf` copied to `/etc/nginx/http.d/default.conf`
- `start.sh` used as entry point

### Step 4: Verify Vite/Angular Static Pattern (Fallback)

For Vite or Angular projects, the Dockerfile should have:

**Stage 1 — Builder:**
```dockerfile
FROM node:21-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG ci_build
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build:${ci_build}
```

**Stage 2 — Runtime:**
```dockerfile
FROM nginx:stable-alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

Key indicators:
- Stage 2 uses `nginx:stable-alpine`
- Static files copied to `/usr/share/nginx/html`

### Step 5: Verify nginx.conf

For Next.js: verify `nginx.conf` proxies to `localhost:3000`:
```nginx
location / {
  proxy_pass http://localhost:3000;
  ...
}
```

For Vite/Angular: verify `nginx.conf` serves static files with SPA fallback:
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

### Step 6: Verify .dockerignore

Check for a `.dockerignore` file to exclude unnecessary files from the build context (node_modules, .git, coverage, etc.).

## Output Format

```
Dockerfile check:
✅ Dockerfile — Present, Next.js standalone pattern detected
✅ nginx.conf — Present with reverse proxy configuration
✅ start.sh — Present and executable
⚠️  .dockerignore — Missing (recommended to speed up builds)
```

## If Missing

If the Dockerfile is missing:

1. Generate a Dockerfile from the template at `references/dockerfile-template.md`
2. Detect the correct pattern first (Next.js standalone vs Vite static)
3. Generate an `nginx.conf` from the reference project
4. Generate a `start.sh` for Next.js projects
5. Optionally generate a `.dockerignore` file

## Reference

See `references/dockerfile-template.md` for the full Dockerfile template and `references/canonical-example.md` for the canonical example.

---

## Verification Checklist

After checking Dockerfile, verify your report includes:

### Next.js Standalone Pattern
- [ ] Dockerfile exists in project root
- [ ] Two-stage build present (node builder → node+nginx runner)
- [ ] Stage 1: `FROM node:21-alpine AS builder`
- [ ] Stage 1: `ARG ci_build` defined
- [ ] Stage 1: `COPY .env.${ci_build} .env.local` present
- [ ] Stage 1: `ENV NEXT_ENV=${ci_build}` present
- [ ] Stage 1: `RUN npm run build:${ci_build}` (with ${} syntax)
- [ ] Stage 1: `NODE_OPTIONS` with `--max-old-space-size=4096`
- [ ] Stage 2: `FROM node:21-alpine AS runner`
- [ ] Stage 2: `apk add --no-cache nginx` present
- [ ] Stage 2: Copies `.next/standalone/`, `.next/static/`, `public/`
- [ ] Stage 2: Copies `nginx.conf` to `/etc/nginx/http.d/default.conf`
- [ ] Stage 2: Copies and executes `start.sh`
- [ ] nginx.conf proxies to `http://localhost:3000`

### Vite/Angular Static Pattern (Fallback)
- [ ] Dockerfile exists in project root
- [ ] Two-stage build present (node builder → nginx static)
- [ ] Stage 2: `FROM nginx:stable-alpine`
- [ ] Stage 2: Copies static files to `/usr/share/nginx/html`
- [ ] nginx.conf has `try_files $uri $uri/ /index.html`

### General
- [ ] .dockerignore exists (recommended)
- [ ] storybook.Dockerfile checked if project uses Storybook
- [ ] Flutter: build/web output path verified
- [ ] Blazor WASM: wwwroot output path verified
- [ ] Blazor Server: dotnet runtime image used (not nginx)
- [ ] Structured output format used (✅ present, ⚠️ missing, ❌ broken)
