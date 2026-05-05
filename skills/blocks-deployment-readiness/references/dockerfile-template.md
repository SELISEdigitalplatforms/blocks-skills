# Dockerfile Template

Multi-stage Dockerfile templates for deploying Blocks projects to Azure Container Registry (ACR) and Azure Kubernetes Service (AKS).

---

## Primary: Next.js Standalone

Use this template for Next.js projects with `output: 'standalone'` in `next.config.ts`.

### Template: Dockerfile (Next.js)

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

### Template: nginx.conf (Next.js reverse proxy)

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

### Template: start.sh (Next.js)

```sh
#!/bin/sh
set -e

node server.js &

sleep 2

nginx -g 'daemon off;'
```

### Template: next.config.ts

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

### Template: package.json build scripts (Next.js)

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "build:dev": "NEXT_ENV=development next build",
    "build:stg": "NEXT_ENV=staging next build",
    "build:prod": "NEXT_ENV=production next build",
    "start": "next start"
  }
}
```

---

## Fallback: Vite/Angular Static Files

Use this template for Vite or Angular projects without Next.js standalone.

### Template: Dockerfile (Vite/Angular)

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

### Template: nginx.conf (Vite/Angular static)

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

### Angular Projects

Angular projects use the same nginx-static pattern as Vite, with a different build output path.

```dockerfile
FROM node:21-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ARG ci_build

RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build:${ci_build}

FROM nginx:stable-alpine

COPY --from=builder /app/dist/${ANGULAR_PROJECT:-myapp} /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf
```

> **Build argument:** Pass `--build-arg ANGULAR_PROJECT=myapp` (or whatever the project name is) when building. The `:-myapp` default handles the most common case where the project name is `myapp`.

**How to determine `ANGULAR_PROJECT`:**

Extract from `angular.json` using `jq`:

```bash
ANGULAR_PROJECT=$(jq -r '.projects[] | select(.root == "") | .architect.build.options.outputPath' angular.json)
echo "$ANGULAR_PROJECT"   # e.g., "myapp" → dist/myapp
```

Or read `angular.json` manually. The root-level project (the one with `"root": ""`) determines the output:

```json
{
  "projects": {
    "myapp": {              // <-- this is the project name
      "root": "",
      "architect": {
        "build": {
          "options": {
            "outputPath": "dist/myapp"   // → /app/dist/${ANGULAR_PROJECT}
          }
        }
      }
    }
  }
}
```

If the project has multiple sub-projects, use the one with `"root": ""` (the root-level project). For ACR builds:

```bash
az acr build \
  --build-arg ci_build=dev \
  --build-arg ANGULAR_PROJECT=myapp \
  --file Dockerfile .
```

### Flutter Web Projects

Flutter web builds produce static files in `build/web/`. Use the nginx-static pattern:

**Recommended: Use a pre-built Flutter image (fast CI builds)**

```dockerfile
FROM ghcr.io/nicknisi/dart:latest AS builder

WORKDIR /app

RUN flutter precache

COPY pubspec.yaml ./
RUN flutter pub get

COPY . .

RUN flutter config --enable-web && \
    flutter build web --release

FROM nginx:stable-alpine

COPY --from=builder /app/build/web /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf
```

**Fallback: Install Flutter SDK at build time (adds ~2min per build)**

```dockerfile
FROM node:21-alpine AS builder

WORKDIR /app

RUN apk add --no-cache curl git unzip

COPY . .

RUN curl -fsSL https://dl.google.com/flutter/flutter_installer.sh | bash && \
    export PATH="$PATH:/root/flutter/bin" && \
    flutter config --enable-web && \
    flutter pub get && \
    flutter build web --release

FROM nginx:stable-alpine

COPY --from=builder /app/build/web /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf
```

> Use the pre-built image in production CI pipelines. The curl|bash approach is acceptable for local development or one-off builds where installing Flutter SDK is tolerable.

### .NET Blazor WebAssembly Projects

Blazor WebAssembly deploys as static files. Use the nginx-static pattern:

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS builder

WORKDIR /app

COPY . .

RUN dotnet publish -c Release -o /app/publish

FROM nginx:stable-alpine

COPY --from=builder /app/publish/wwwroot /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf
```

For Blazor Server (interactive SSR), use a dotnet runtime image instead of nginx:

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

WORKDIR /app

COPY --from=builder /app/publish .

ENV ASPNETCORE_URLS=http://+

EXPOSE 80

CMD ["dotnet", "MyApp.dll"]
```

Note: Blazor Server requires SignalR WebSocket support. Ensure the hosting platform has WebSocket enabled.

### Template: .dockerignore

```gitignore
node_modules
npm-debug.log
.git
.gitignore
.env
.env.*
!.env.example
coverage
*.md
.DS_Store
.vscode
.idea
```

---

## Template: storybook.Dockerfile

```dockerfile
FROM node:21-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN STORYBOOK_BUILD=true npm run build-storybook

FROM nginx:stable-alpine

COPY --from=builder /app/storybook-static /usr/share/nginx/html

COPY storybook-nginx.conf /etc/nginx/conf.d/default.conf
```

### Template: storybook-nginx.conf

```nginx
server {
  root /usr/share/nginx/html/;
  server_tokens off;
  gzip on;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  error_page 404 /index.html;
}
```

---

## Key Configuration Details

### Pattern Detection

| Indicator | Pattern to use |
|-----------|---------------|
| `next.config.ts` with `output: 'standalone'` | Next.js standalone (primary) |
| `vite.config.ts` | Vite static (fallback) |
| `angular.json` | Angular static (fallback) |
| `pubspec.yaml` + web target | Flutter web (fallback) |
| `*.csproj` + Blazor WASM | Blazor WebAssembly static (fallback) |
| `*.csproj` + Blazor Server | Blazor Server (dotnet runtime) |

### ci_build Argument (Next.js)

| ci_build value | Script called | NEXT_ENV set | Source env file |
|----------------|--------------|--------------|-----------------|
| `dev` | `npm run build:dev` | `development` | `.env.dev` → `.env.local` |
| `stg` | `npm run build:stg` | `staging` | `.env.stg` → `.env.local` |
| `prod` | `npm run build:prod` | `production` | `.env.prod` → `.env.local` |

Note: The `ci_build` arg is passed at build time (e.g., `--build-arg ci_build=stg`). This determines which build script runs and which env file is loaded.

### ci_build Argument (Vite/Angular)

| ci_build value | Script called | Source env file |
|----------------|--------------|-----------------|
| `dev` | `npm run build:dev` | `.env.dev` |
| `stg` | `npm run build:stg` | `.env.stg` |
| `prod` | `npm run build:prod` | `.env.prod` |

### Build Output Directory

| Framework | Output directory | Dockerfile COPY path |
|-----------|-----------------|---------------------|
| Next.js standalone | `.next/standalone/` | Copy whole `.next/standalone/` directory |
| Vite | `build/` | `/app/build` |
| Angular | `dist/<name>/` | `/app/dist/<name>` |

### Memory Limit

`NODE_OPTIONS="--max-old-space-size=4096"` allocates 4GB heap for Node.js during build. Adjust if builds fail due to memory constraints.

### Multi-Stage Benefits (Vite/Angular)

1. **Security**: Final image contains only nginx and static files — no Node.js, npm, or source code
2. **Size**: Final image is minimal (~25MB vs ~1GB for full Node image)
3. **Cache**: Package installation is cached in the builder stage, rebuilds are faster

### Next.js Standalone Benefits

1. **No static file serving**: Next.js handles SSR and API routes natively
2. **Reverse proxy**: nginx forwards all requests to Next.js on port 3000
3. **Efficient**: Only the standalone build is included, not the full Next.js source
4. **Container stays alive**: `start.sh` runs Next.js in background, nginx in foreground

---

## Usage in GitHub Workflows

The ACR build command:

```bash
az acr build \
  --image ${{ secrets.AZURE_CONTAINER_REGISTRY }}.azurecr.io/${{ inputs.CONTAINER_NAME }}:${{ github.sha }} \
  --registry ${{ secrets.AZURE_CONTAINER_REGISTRY }} -g ${{ secrets.ACR_RESOURCE_GROUP }} \
  --file Dockerfile \
  --build-arg ci_build=${{ inputs.CI_BUILD }} .
```

### DOCKERFILE Variable

Ensure `.github/variables/vars.env` includes:

```
DOCKERFILE=Dockerfile
STORYBOOK_DOCKERFILE=storybook.Dockerfile
```
