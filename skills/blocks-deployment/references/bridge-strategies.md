# Bridge Strategies: Migrating to CloudBuild

This guide covers migrating from existing CI/CD tools to SELISE Blocks CloudBuild. CloudBuild replaces external CI/CD providers — your existing build configs become templates, and CloudBuild handles the pipeline execution.

---

## Migration Overview

CloudBuild is the **build + deploy** layer. Your current CI/CD tool likely handles:

| What your CI/CD does | CloudBuild equivalent |
|---------------------|----------------------|
| Trigger on push to branch | GitHub webhook (`create-github-webhook`) |
| Run build commands (`npm run build`) | CloudBuild container executes your Dockerfile |
| Run tests | CloudBuild container executes test command |
| Deploy artifact | `POST /Build/run-build` auto-deploys on success |
| Environment variables / secrets | Set in Cloud Portal, accessed via env vars |
| Build status in PR | CloudBuild webhook back to GitHub |
| Multiple environments (staging/prod) | Multiple repos or `deploymentType` field |

---

## Migrating from GitHub Actions

### Before

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      - run: npm run test
```

### After

1. **Set up the repo in CloudBuild:**
   ```
   Action: get-github-repos
   → find the repo, note the repoId

   Action: update-repo-settings
   → configure hosting provider, region, machine config

   Action: create-github-webhook
   → CloudBuild now receives push events automatically
   ```

2. **CloudBuild executes your existing build commands** in its container. No `.github/workflows/` needed for CloudBuild — the pipeline is defined in CloudBuild's infrastructure.

3. **Trigger a build manually** to verify:
   ```
   Action: trigger-build
   repoId = from step 1
   projectKey = $PROJECT_SLUG
   ```

4. **Remove** `.github/workflows/deploy.yml` or keep it if you have other CI tasks not handled by CloudBuild.

### Preserving Secrets

GitHub Actions secrets → CloudBuild environment variables:

```bash
# GitHub Actions
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}

# CloudBuild
# Set in Cloud Portal → Project Settings → Environment Variables
# Accessed in build container as $DATABASE_URL
```

### Keeping Some GitHub Actions

If CloudBuild handles deployment but you still need CI checks (linting, type checking):

```yaml
# .github/workflows/ci.yml
name: CI Checks
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
```

CloudBuild then handles the **build + deploy** part separately.

---

## Migrating from GitLab CI

### Before

```yaml
# .gitlab-ci.yml
stages:
  - build
  - deploy
build:
  stage: build
  script:
    - npm ci
    - npm run build
    - npm run test
deploy:
  stage: deploy
  script:
    - npm run deploy:prod
```

### After

1. **Disconnect GitLab CI** — remove `.gitlab-ci.yml`
2. **Connect GitHub repo** to CloudBuild via `setup-repository-flow`
3. CloudBuild handles both build and deploy stages

### Migrating Variables

GitLab CI variables → CloudBuild environment variables:

| GitLab | CloudBuild |
|--------|-----------|
| Settings → CI/CD → Variables | Cloud Portal → Project Settings → Environment Variables |
| `DATABASE_URL` | `$DATABASE_URL` in build container |
| Protected variables | Handled via Cloud Portal access control |

---

## Migrating from Jenkins

### Before

```groovy
// Jenkinsfile
pipeline {
  agent any
  stages {
    stage('Build') {
      steps {
        sh 'npm ci'
        sh 'npm run build'
      }
    }
    stage('Deploy') {
      steps {
        sh 'npm run deploy:prod'
      }
    }
  }
}
```

### After

1. **Remove Jenkins pipeline** — Jenkinsfile is no longer needed
2. **Connect repo** via CloudBuild webhook
3. **Define build steps** in CloudBuild's Dockerfile or container config:
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build
   ```
4. CloudBuild deploys automatically on `run-build` success

### Preserving Jenkins Credentials

| Jenkins | CloudBuild |
|---------|-----------|
| Credential IDs | Stored in Cloud Portal → Project Settings |
| `withCredentials` | Environment variables injected at runtime |
| Secret text | `$SECRET_NAME` in build container env |

---

## Migrating from GCP Cloud Build

If you already use GCP Cloud Build with `cloudbuild.yaml`:

### Before

```yaml
# cloudbuild.yaml
steps:
  - name: 'node:20'
    entrypoint: 'npm'
    args: ['ci']
  - name: 'node:20'
    entrypoint: 'npm'
    args: ['run', 'build']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/app', '.']
images:
  - 'gcr.io/$PROJECT_ID/app'
```

### After

1. **Keep the Dockerfile** — CloudBuild can use your existing container definitions
2. **Migrate build steps** to CloudBuild's container infrastructure
3. **Remove `cloudbuild.yaml`** from the repo — CloudBuild uses its own pipeline definition
4. **Set up GitHub webhook** so CloudBuild triggers on push

### Container Registry vs CloudBuild

| GCP Cloud Build | SELISE Blocks CloudBuild |
|----------------|------------------------|
| `gcr.io/$PROJECT_ID/app` | CloudBuild manages artifact storage |
| `cloudbuild.yaml` | CloudBuild pipeline definition (Cloud Portal) |
| GCP service account | CloudBuild access via `x-blocks-key` |
| `cloud builds submit` | `trigger-build` action |

---

## Migrating from Azure DevOps Pipelines

### Before

```yaml
# azure-pipelines.yml
trigger:
  - main
pool:
  vmImage: 'ubuntu-latest'
steps:
  - task: UseNode@1
  - script: npm ci
  - script: npm run build
  - script: npm run test
```

### After

1. **Disable Azure Pipelines** trigger on the repo
2. **Connect via GitHub webhook** to CloudBuild
3. CloudBuild handles the build + deploy pipeline

### Azure Pipeline Variables

| Azure DevOps | CloudBuild |
|--------------|-----------|
| Pipeline variables | Environment variables in Cloud Portal |
| Variable groups | Stored in Cloud Portal → Project Settings |
| Service connections | Handled by CloudBuild infrastructure |

---

## Multi-Environment Strategy

If you had separate pipelines per environment:

### Before (GitHub Actions)

```yaml
# .github/workflows/deploy-staging.yml — triggers on develop
# .github/workflows/deploy-prod.yml — triggers on main
```

### After

Use a single webhook with `deploymentType` or multiple repos:

```bash
# Staging — use manual build (verify before deploy)
POST /Build/manual
{ "repoId": "...", "projectKey": "my-project" }

# Production — auto-deploy on main branch
POST /Build/run-build
{ "repoId": "...", "projectKey": "my-project" }
```

Or use separate repos per environment, each with its own webhook configured for specific branches.

---

## Build Status in PRs

### Before

GitHub Actions shows status checks directly in PRs.

### After

CloudBuild can send status back to GitHub via webhook. Verify in GitHub:

1. Go to repository **Settings** → **Webhooks**
2. Confirm the CloudBuild webhook has `push` and `pull_request` events
3. CloudBuild will update PR status when builds complete

---

## Post-Migration Checklist

- [ ] GitHub Actions/GitLab CI/Jenkins pipeline removed or disabled
- [ ] Repo connected to CloudBuild (`get-repos` returns the repo)
- [ ] GitHub webhook created and verified (`create-github-webhook`)
- [ ] Hosting provider, region, and machine config set (`update-repo-settings`)
- [ ] Secrets migrated to Cloud Portal environment variables
- [ ] Build triggered manually and verified (`trigger-build` → `get-build`)
- [ ] Build status appearing in PRs
- [ ] Old CI/CD workflow files removed from repo
- [ ] Team notified of new deployment URL / flow
