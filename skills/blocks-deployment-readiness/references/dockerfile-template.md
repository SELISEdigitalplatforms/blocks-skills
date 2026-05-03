# Dockerfile Template

Multi-stage Dockerfile template for deploying Vite/React applications to Azure Container Registry (ACR) and Azure Kubernetes Service (AKS).

## Template: Dockerfile

```dockerfile
# Stage 1: Build the application
FROM node:21.7.0-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ARG ci_build

RUN mkdir -p /app/log

RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build:${ci_build}

# Stage 2: Serve with nginx
FROM nginx:stable-alpine

COPY --from=builder /app/build /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf
```

## Template: nginx.conf

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

## Template: .dockerignore

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

## Template: storybook.Dockerfile

```dockerfile
# Stage 1: Build Storybook
FROM node:21.7.0-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ARG ci_build

RUN STORYBOOK_BUILD=true npm run build-storybook

# Stage 2: Serve with nginx
FROM nginx:stable-alpine

COPY --from=builder /app/storybook-static /usr/share/nginx/html

COPY storybook-nginx.conf /etc/nginx/conf.d/default.conf
```

## Template: storybook-nginx.conf

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

## Key Configuration Details

### ci_build Argument

The `ci_build` argument controls which environment to build for:

| ci_build value | package.json script called | Source env file |
|----------------|---------------------------|-----------------|
| `dev` | `npm run build:dev` | `.env.dev` |
| `stg` | `npm run build:stg` | `.env.stg` |
| `prod` | `npm run build:prod` | `.env.prod` |

The `build:{env}` script runs `set-env.cjs` which copies the appropriate `.env.{env}` to `.env` before Vite builds.

### Build Output Directory

The template expects the build output at `/app/build` (from `vite.config.ts` `build.outDir: 'build'`). If your project uses a different output directory (e.g., `dist`), update both the Dockerfile and `nginx.conf` paths:

```dockerfile
COPY --from=builder /app/dist /usr/share/nginx/html
```

### Memory Limit

`NODE_OPTIONS="--max-old-space-size=4096"` allocates 4GB heap for Node.js during build. Adjust if builds fail due to memory constraints.

### Multi-Stage Benefits

1. **Security**: Final image contains only nginx and static files — no Node.js, npm, or source code
2. **Size**: Final image is minimal (~25MB vs ~1GB for full Node image)
3. **Cache**: Package installation is cached in the builder stage, rebuilds are faster

## GitHub Variables Configuration

Ensure `.github/variables/vars.env` includes:

```
DOCKERFILE=Dockerfile
STORYBOOK_DOCKERFILE=storybook.Dockerfile
```

## Usage in GitHub Workflows

The ACR build command in `3_web.yml`:

```bash
az acr build \
  --image ${{ secrets.AZURE_CONTAINER_REGISTRY }}.azurecr.io/${{ inputs.CONTAINER_NAME }}:${{ github.sha }} \
  --registry ${{ secrets.AZURE_CONTAINER_REGISTRY }} -g ${{ secrets.ACR_RESOURCE_GROUP }} \
  --file ${{ env.DOCKERFILE }} \
  --build-arg ci_build=${{ inputs.CI_BUILD }} .
```

The `DOCKERFILE` environment variable comes from `.github/variables/vars.env`.

## Adapting for Different Project Types

### Angular Projects

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

### Next.js Projects (Static Export)

```dockerfile
FROM node:21.7.0-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG ci_build
RUN npm run build:${ci_build}
FROM nginx:stable-alpine
COPY --from=builder /app/out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

Note: Next.js requires `output: 'export'` in `next.config.js` for static hosting.
