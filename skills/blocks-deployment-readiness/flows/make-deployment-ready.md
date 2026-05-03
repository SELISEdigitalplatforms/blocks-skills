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

All credential setup must go through the `@seliseblocks/cli`. AI generates templates and guides, but credentials stay with the user.

---

## Step 1: Detect Project Type

Examine the project root to identify the framework:

```
package.json + vite.config.ts → Vite/React project
package.json + angular.json → Angular project
package.json + next.config.js → Next.js project
*.csproj → .NET/Blazor project
pubspec.yaml → Flutter project
```

Note the project name from `package.json` or repository name.

---

## Step 2: Run Readiness Checks (Parallel)

Run all 5 checks simultaneously to assess current state:

1. **Env files check** — `checks/check-env-files.md`
   - Look for `.env.dev`, `.env.stg`, `.env.prod`
   - Verify required variables are present in each file

2. **Build config check** — `checks/check-build-config.md`
   - Verify `package.json` has `build:dev`, `build:stg`, `build:prod` scripts
   - Verify `vite.config.ts` (or equivalent) exists
   - Check for `set-env.cjs`

3. **Dockerfile check** — `checks/check-dockerfile.md`
   - Verify `Dockerfile` exists with multi-stage build
   - Verify `nginx.conf` exists

4. **GitHub workflows check** — `checks/check-github-workflows.md`
   - Verify `.github/workflows/dev.yml`, `stg.yml`, `main.yml`
   - Verify reusable workflows: `3_web.yml`, `3_stg_web.yml`, etc.
   - Check `.github/variables/vars.env` exists

5. **Hosting config check** — `checks/check-hosting-config.md`
   - Verify domain/OIDC redirect URI configuration
   - Verify nginx SPA fallback
   - Verify build output directory

---

## Step 3: Report Readiness Status

Present a structured deployment readiness report to the user:

```
# Deployment Readiness Report: <project-name>

## Status Summary
✅ Deployment Ready — all components present

## Component Checks
✅ Env files (.env.dev, .env.stg, .env.prod) — Present
✅ Build scripts (build:dev, build:stg, build:prod) — Present
✅ Dockerfile — Present, multi-stage build
✅ nginx.conf — Present with SPA fallback
✅ GitHub workflows (dev, stg, main) — Present
✅ set-env.cjs — Present
⚠️  OIDC redirect URIs — Need per-environment configuration
```

Or if incomplete:

```
# Deployment Readiness Report: <project-name>

## Status Summary
❌ Not Ready — 3 components missing

## Component Checks
✅ Env files — Present
✅ Build scripts — Present
❌ Dockerfile — Missing
❌ GitHub workflows — Missing
✅ nginx.conf — Present
✅ set-env.cjs — Present

## Missing Components
1. Dockerfile — needed for ACR container build
2. GitHub workflows — needed for CI/CD automation
```

---

## Step 4: Fix Missing Components (If Requested)

For each missing component, offer to generate from templates.

### Missing Env Files

```
To set up environment files, use the Blocks CLI (recommended):

1. npm install -g @seliseblocks/cli
2. blocks login
3. blocks init --env

Or I can generate templates from references/env-variables.md
```

Generate templates with placeholder comments — NEVER real credentials.

### Missing Dockerfile

Generate from `references/dockerfile-template.md`. Adapt the path to match the project.

### Missing GitHub Workflows

Generate from `references/github-workflows.md`. Create all required workflow files.

### Missing set-env.cjs

Generate from the canonical example in `references/canonical-example.md`.

---

## Step 5: Guide Credential Setup (CRITICAL)

**This step is required before deployment can succeed.**

Present clear guidance (never ask for credentials directly):

```
To deploy, you need to authenticate with Azure and SELISE Blocks.

### Step 1: Install and login to CLI
npm install -g @seliseblocks/cli
blocks login

### Step 2: Configure project credentials
blocks config set --project-slug <your-project-slug>

### Step 3: Set up GitHub Secrets
Go to your GitHub repo → Settings → Secrets and add:
- AZURE_AKS_BLOCKS_CREDENTIALS — Azure service principal credentials
- AZURE_BLOCKS_CONTAINER_REGISTRY — Your ACR name
- AKS_BLOCKS_DEV_CLUSTER — Your dev cluster name
- (see references/github-workflows.md for full list)

### Step 4: Verify CLI connection
blocks status

### Step 5: Get credentials from Cloud Portal
Visit cloud.seliseblocks.com → your project → Settings
Copy x-blocks-key and enter via: blocks config set --key <key>
```

---

## Step 6: Trigger Deployment

When all checks pass and credentials are configured:

```
Your project is deployment-ready!

## To deploy:
1. Push your code to the target branch:
   - dev branch → deploys to dev environment
   - stg branch → deploys to staging
   - main branch → deploys to production

2. GitHub Actions will automatically:
   - Build the Docker image
   - Push to Azure Container Registry
   - Deploy to Azure Kubernetes Service

3. Or trigger manually via CLI:
   blocks deploy --env production

## Monitor deployment:
- GitHub Actions tab → view workflow runs
- Azure portal → AKS cluster → workloads
```

---

## Step 7: Verify Deployment

After deployment, help the user verify the deployment succeeded:

1. Check GitHub Actions run completed successfully
2. Verify the app is accessible at the expected URL
3. Check browser console for environment variable loading
4. Verify OIDC login works with the configured redirect URI

## Troubleshooting

If deployment fails, check `checks/check-*.md` for the specific component that failed and regenerate from templates.
