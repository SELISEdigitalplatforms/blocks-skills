# check-dockerfile

Verifies that a project has a valid Dockerfile for building a container image to deploy to Azure Container Registry (ACR) and Azure Kubernetes Service (AKS).

## When to Run

Part of the deployment-readiness check suite. Run alongside other check actions in parallel.

## How to Check

### Step 1: Look for Dockerfile

Check for the existence of `Dockerfile` in the project root. Also check for `storybook.Dockerfile` if the project uses Storybook.

### Step 2: Verify Multi-Stage Build Structure

The Dockerfile should use a multi-stage build pattern:

**Stage 1 — Builder:**
```dockerfile
FROM node:<version>-alpine AS builder
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

This pattern is used by `blocks-react-construct`. The build stage compiles the app and the runtime stage serves it via nginx.

### Step 3: Verify nginx.conf Presence

The Dockerfile references `nginx.conf` — ensure it exists in the project root and contains a SPA fallback configuration:

```nginx
server {
  root /usr/share/nginx/html/;
  server_tokens off;
  client_max_body_size 200m;
  gzip on;
  gzip_comp_level 6;
  gzip_min_length 1000;
  gzip_proxied expired no-cache no-store private auth;
  gzip_types text/plain application/x-javascript text/xml text/css application/xml text/javascript application/javascript application/json application/font-woff application/font-woff2 application/vnd.ms-fontobject application/x-font-ttf font/opentype;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

### Step 4: Verify ci_build Argument

The Dockerfile must accept a `ci_build` build argument that corresponds to the environment name (`dev`, `stg`, `prod`). The build script in `package.json` passes this as `npm run build:${ci_build}`.

### Step 5: Verify .dockerignore

Check for a `.dockerignore` file to exclude unnecessary files from the build context (node_modules, .git, coverage, etc.).

## Output Format

```
Dockerfile check:
✅ Dockerfile — Present, multi-stage build detected
✅ nginx.conf — Referenced and exists
✅ ci_build ARG — Accepts build environment
⚠️  .dockerignore — Missing (recommended to speed up builds)
⚠️  storybook.Dockerfile — Missing (if using Storybook)
```

## If Missing

If the Dockerfile is missing:

1. Generate a Dockerfile from the template at `references/dockerfile-template.md`
2. Generate an `nginx.conf` from the reference project
3. Optionally generate a `.dockerignore` file
4. Ensure the Dockerfile path matches what the GitHub workflows reference (via `DOCKERFILE` variable in `.github/variables/vars.env`)

## Reference

See `references/dockerfile-template.md` for the full Dockerfile template and `references/canonical-example.md` for the canonical example.

---

## Verification Checklist

After checking Dockerfile, verify your report includes:

- [ ] Dockerfile exists in project root
- [ ] Two-stage build present (node builder → nginx runtime)
- [ ] Stage 1: FROM node:21.7.0-alpine AS builder
- [ ] Stage 1: ARG ci_build defined
- [ ] Stage 1: RUN npm run build:${ci_build} (with ${} syntax)
- [ ] Stage 1: NODE_OPTIONS with --max-old-space-size=4096
- [ ] Stage 2: FROM nginx:stable-alpine
- [ ] Stage 2: COPY --from=builder /app/build /usr/share/nginx/html
- [ ] Stage 2: COPY nginx.conf /etc/nginx/conf.d/default.conf
- [ ] nginx.conf exists and has try_files $uri $uri/ /index.html
- [ ] .dockerignore exists (recommended)
- [ ] storybook.Dockerfile checked if project uses Storybook
- [ ] For Angular: dist path adjusted to /app/dist/<project-name>
- [ ] For Next.js static export: out path adjusted to /app/out
- [ ] DOCKERFILE variable set in .github/variables/vars.env
- [ ] Structured output format used (✅ present, ⚠️ missing, ❌ broken)
