# make-deployment-ready

The complete flow to make a SELISE Blocks project deployment-ready. Follow these steps in order.

## When to Use

When a user asks to prepare their project for deployment, check deployment readiness, or set up deployment infrastructure.

## CRITICAL: Credential Safety Rule

**NEVER ask users to share credentials with AI.** This includes:
- x-blocks-key
- API keys
- Passwords
- Azure credentials
- GitHub tokens

All credential setup must be done by the user directly or via the Blocks Cloud Portal. AI generates templates and guides, but credentials stay with the user.

---

## Step 1: Detect Project Type

Examine the project root to identify the framework:

```
package.json + next.config.ts → Next.js (check for output: 'standalone')
package.json + vite.config.ts → Vite/React project
package.json + angular.json → Angular project
*.csproj → .NET/Blazor project
```

Note the project name from `package.json` or repository name.

---

## Step 2: Run Readiness Checks (Parallel)

Run all 4 checks simultaneously to assess current state:

1. **Env files check** — `checks/check-env-files.md`
   - Look for `.env.dev`, `.env.prod`
   - Verify required variables are present in each file
   - Next.js: check for `NEXT_PUBLIC_BLOCKS_API_URL`, `NEXT_PUBLIC_X_BLOCKS_KEY`
   - Vite: check for `VITE_API_BASE_URL`, `VITE_X_BLOCKS_KEY`, etc.

2. **Build config check** — `checks/check-build-config.md`
   - Verify `package.json` has `build:dev`, `build:prod` scripts
   - Next.js: verify `next.config.ts` has `output: 'standalone'`
   - Vite: verify `vite.config.ts` exists
   - Next.js: check for `start.sh`

3. **Dockerfile check** — `checks/check-dockerfile.md`
   - Detect pattern: Next.js standalone vs Vite static
   - Verify `Dockerfile` exists with correct pattern
   - Verify `nginx.conf` exists with correct pattern
   - Next.js: verify `start.sh` exists and is executable

4. **Hosting config check** — `checks/check-hosting-config.md`
   - Verify OIDC redirect URI configuration
   - Verify nginx configuration
   - Verify build output directory

---

## Step 3: Report Readiness Status

Present a structured deployment readiness report to the user:

```
# Deployment Readiness Report: <project-name>

## Status Summary
✅ Deployment Ready — all components present

## Component Checks
✅ Env files (.env.dev, .env.prod) — Present
✅ Build scripts (build:dev, build:prod) — Present
✅ Dockerfile — Present, Next.js standalone pattern
✅ nginx.conf — Present with reverse proxy
✅ start.sh — Present and executable
⚠️  OIDC redirect URIs — Need per-environment configuration
```

Or if incomplete:

```
# Deployment Readiness Report: <project-name>

## Status Summary
❌ Not Ready — 2 components missing

## Component Checks
✅ Env files — Present
✅ Build scripts — Present
❌ Dockerfile — Missing
✅ nginx.conf — Present
❌ start.sh — Missing (Next.js)

## Missing Components
1. Dockerfile — needed for container build
2. start.sh — needed for Next.js standalone
```

---

## Step 4: Fix Missing Components (If Requested)

For each missing component, offer to generate from templates.

### Missing Env Files

Generate templates with placeholder comments — NEVER real credentials:

```
To set up environment files, I can generate templates with placeholder values.
Fill in the actual credentials via the Blocks Cloud Portal.

Generate templates:
- .env.dev — with NEXT_PUBLIC_* variables
- .env.prod — with placeholder values
```

### Missing Dockerfile

Detect the correct pattern first, then generate from `references/dockerfile-template.md`:
- Next.js: generate Next.js standalone Dockerfile with `start.sh`
- Vite/Angular: generate Vite static Dockerfile

### Missing start.sh (Next.js)

Generate the startup orchestrator:

```sh
#!/bin/sh
set -e
node server.js &
sleep 2
nginx -g 'daemon off;'
```

---

## Step 5: Trigger Deployment

When all checks pass:

```
Your project is deployment-ready!

## To deploy:
1. Push your code to the target branch
2. Contact your infrastructure team to trigger the build pipeline

## Monitor deployment:
- Check with your CI/CD team for deployment status
```

---

## Step 6: Verify Deployment

After deployment, help the user verify the deployment succeeded:

1. Verify the app is accessible at the expected URL
2. Check browser console for environment variable loading
3. Verify OIDC login works with the configured redirect URI

## Troubleshooting

If deployment fails, check `checks/check-*.md` for the specific component that failed and regenerate from templates.
