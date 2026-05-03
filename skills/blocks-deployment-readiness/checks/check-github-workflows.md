# check-github-workflows

Verifies that a project has the required GitHub Actions workflows for CI/CD automation. The pipeline targets Azure Container Registry (ACR) and Azure Kubernetes Service (AKS).

## When to Run

Part of the deployment-readiness check suite. Run alongside other check actions in parallel.

## How to Check

### Step 1: Verify .github/workflows/ Directory

Check that `.github/workflows/` exists and contains the required workflow files.

### Step 2: Verify Environment Workflow Files

Three environment-triggered workflows should exist:

| File | Trigger | Purpose |
|------|---------|---------|
| `dev.yml` | Push to `dev` branch | Build and deploy to dev environment |
| `stg.yml` | Push to `stg` branch | Build and deploy to staging |
| `main.yml` | Push to `main` branch | Build and deploy to production |

### Step 3: Verify Reusable Workflow Files

These reusable workflow files are called by the environment workflows:

| File | Called By | Purpose |
|------|-----------|---------|
| `1_test.yml` | Via workflow_call | Run tests and linting |
| `2_sonar.yml` | Via workflow_call | SonarQube analysis and dependency scanning |
| `3_web.yml` | Via workflow_call | Build Docker image, push to ACR, deploy to AKS |
| `3_stg_web.yml` | Via workflow_call | Staging-specific web build/deploy |
| `4_storybook.yml` | Via workflow_call | Storybook build/deploy (optional) |

### Step 4: Verify Required Secrets

The workflows reference GitHub secrets that must be configured in the repository settings:

**For dev/stg:**
- `AZURE_AKS_BLOCKS_CREDENTIALS` — Azure credentials
- `AZURE_BLOCKS_CONTAINER_REGISTRY` — ACR name
- `ClUSTER_AKS_BLOCKS_RESOURCE_GROUP` — Azure resource group
- `AKS_BLOCKS_DEV_CLUSTER` — AKS cluster name
- `SELISE_GITHUB_PAT` — GitHub personal access token (for submodules)

**For production:**
- `AZURE_AKS_BLOCKS_CONSTRUCT_CREDENTIALS`
- `AZURE_BLOCKS_PROD_CONTAINER_REGISTRY`
- `CLUSTER_AKS_BLOCKS_PROD_RESOURCE_GROUP`
- `AKS_BLOCKS_PROD_CLUSTER`

### Step 5: Verify GitHub Variables

The workflows use variables from `.github/variables/vars.env`:

```
SONARQUBE_HOST=https://code.selise.biz
REPO_NAME=<repo-name>
SERVICE_NAME=<service-name>
DOCKERFILE=Dockerfile
```

Check that this file exists and variables are set correctly.

### Step 6: Verify .github/actions/setvars

The workflows reference `.github/actions/setvars` — ensure this action exists or add it if missing.

## Output Format

```
GitHub workflows check:
✅ .github/workflows/dev.yml — Present (triggers on dev branch)
✅ .github/workflows/stg.yml — Present (triggers on stg branch)
✅ .github/workflows/main.yml — Present (triggers on main branch)
✅ .github/workflows/3_web.yml — Present (reusable, ACR + AKS)
✅ .github/variables/vars.env — Present
❌ Required secrets not configured — See setup instructions below
❌ .github/actions/setvars — Missing
```

## If Missing

If workflows are missing:

1. Generate workflow files from the templates in `references/github-workflows.md`
2. Generate `.github/variables/vars.env` from the reference project
3. Note that secrets must be configured manually in GitHub repo Settings → Secrets and Variables
4. Guide user to add the `.github/actions/setvars` action if missing

## Security Note

Never generate files with real credentials. All secrets must be configured in GitHub repo settings by the user.

## Reference

See `references/github-workflows.md` for all workflow templates and `references/canonical-example.md` for the canonical example.

---

## Verification Checklist

After checking GitHub workflows, verify your report includes:

### Environment Workflows
- [ ] .github/workflows/dev.yml exists and triggers on 'dev' branch
- [ ] .github/workflows/stg.yml exists and triggers on 'stg' branch
- [ ] .github/workflows/main.yml exists and triggers on 'main' branch
- [ ] dev.yml uses 2_sonar.yml → 3_web.yml pattern
- [ ] main.yml uses 3_web.yml pattern (no sonar on push)

### Reusable Workflows
- [ ] .github/workflows/3_web.yml exists (dev/prod ACR + AKS)
- [ ] .github/workflows/3_stg_web.yml exists (staging web deploy)
- [ ] .github/workflows/2_sonar.yml exists (optional but recommended)
- [ ] .github/workflows/1_test.yml exists (optional but recommended)

### Supporting Files
- [ ] .github/variables/vars.env exists
- [ ] vars.env has SERVICE_NAME set correctly
- [ ] vars.env has REPO_NAME set correctly
- [ ] vars.env has DOCKERFILE=Dockerfile
- [ ] .github/actions/setvars/action.yml exists

### Secrets Pattern
- [ ] Workflows reference secrets as ${{ secrets.SECRET_NAME }}
- [ ] No real credential values in workflow YAML
- [ ] Required secrets documented: AZURE_AKS_BLOCKS_CREDENTIALS, AZURE_BLOCKS_CONTAINER_REGISTRY, etc.

### Structured Output
- [ ] Each workflow file checked individually
- [ ] Status indicators used (✅ present, ⚠️ incomplete, ❌ missing)
- [ ] If generating: all workflow files created as a set
- [ ] If generating: SERVICE_NAME/REPO_NAME substituted correctly
