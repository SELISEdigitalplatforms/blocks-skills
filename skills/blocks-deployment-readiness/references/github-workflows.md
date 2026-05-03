# GitHub Workflows Reference

GitHub Actions workflow templates for deploying to Azure Container Registry (ACR) and Azure Kubernetes Service (AKS).

## Workflow Overview

```
GitHub Actions → Azure Container Registry (ACR) → Azure Kubernetes Service (AKS)
```

## Required Files

### Environment Workflows (triggers)

| File | Branch Trigger | Environment |
|------|---------------|-------------|
| `dev.yml` | Push to `dev` | Development |
| `stg.yml` | Push to `stg` | Staging |
| `main.yml` | Push to `main` + PR | Production |

### Reusable Workflows (called via workflow_call)

| File | Purpose |
|------|---------|
| `1_test.yml` | Run tests and linting |
| `2_sonar.yml` | SonarQube analysis + Dependency-Track |
| `3_web.yml` | Build Docker image, push to ACR, deploy to AKS |
| `3_stg_web.yml` | Staging-specific web deploy |
| `4_storybook.yml` | Storybook build/deploy (optional) |

### Supporting Files

| File | Purpose |
|------|---------|
| `.github/variables/vars.env` | Repository-level variables |
| `.github/actions/setvars/` | Custom action to load vars.env |

---

## dev.yml Template

```yaml
name: Build (dev)

on:
  push:
    branches:
      - dev

env:
  RUN_UNIT_TEST: 'false'

jobs:
  initialization:
    permissions:
      contents: read
      id-token: write
    runs-on: ubuntu-22.04
    steps:
      - name: Initialize pipeline
        run: echo 'initializing pipeline with ubuntu-22.04'

  sonarqube-job:
    permissions:
      contents: read
      id-token: write
    uses: ./.github/workflows/2_sonar.yml
    secrets:
      SELISE_GITHUB_PAT: ${{ secrets.SELISE_GITHUB_PAT }}
      SONAR_TOKEN: ${{ secrets.SONAR_TOKEN_GLOBAL }}
      DEPENDENCY_TRACK_API_KEY: ${{ secrets.DEPENDENCY_TRACK_API_KEY }}
    needs: [initialization]

  cd-job:
    permissions:
      contents: read
      id-token: write
    if: ${{ github.event_name == 'push' }}
    uses: ./.github/workflows/3_web.yml
    with:
      CONTAINER_NAME: 'dev-$SERVICE_NAME-webclient'
      NAMESPACE: 'dev-$REPO_NAME'
      SERVICE_NAME: $SERVICE_NAME
      CI_BUILD: 'dev'
    secrets:
      SELISE_GITHUB_PAT: ${{ secrets.SELISE_GITHUB_PAT }}
      AZURE_CREDENTIALS: ${{ secrets.AZURE_AKS_BLOCKS_CREDENTIALS }}
      AZURE_CONTAINER_REGISTRY: ${{ secrets.AZURE_BLOCKS_CONTAINER_REGISTRY }}
      ClUSTER_RESOURCE_GROUP: ${{ secrets.ClUSTER_AKS_BLOCKS_RESOURCE_GROUP }}
      CLUSTER_NAME: ${{ secrets.AKS_BLOCKS_DEV_CLUSTER }}
      ACR_RESOURCE_GROUP: ${{ secrets.ClUSTER_AKS_BLOCKS_RESOURCE_GROUP }}
    needs: [sonarqube-job]
```

---

## stg.yml Template

```yaml
name: Build (stg)

on:
  push:
    branches:
      - stg

env:
  RUN_UNIT_TEST: 'false'

jobs:
  initialization:
    permissions:
      contents: read
      id-token: write
    runs-on: ubuntu-22.04
    steps:
      - name: Initialize pipeline
        run: echo 'initializing pipeline'

  cd-job:
    if: ${{ github.event_name == 'push' }}
    permissions:
      contents: read
      id-token: write
    uses: ./.github/workflows/3_stg_web.yml
    with:
      CONTAINER_NAME: 'stg-$SERVICE_NAME-webclient'
      NAMESPACE: 'stg-$REPO_NAME'
      SERVICE_NAME: $SERVICE_NAME
      CLUSTER_VALUES: 'aks-blocks-stg'
      CI_BUILD: 'stg'
    secrets:
      SELISE_GITHUB_PAT: ${{ secrets.SELISE_GITHUB_PAT }}
      AZURE_CREDENTIALS: ${{ secrets.AZURE_AKS_BLOCKS_CREDENTIALS }}
      AZURE_CONTAINER_REGISTRY: ${{ secrets.AZURE_BLOCKS_CONTAINER_REGISTRY }}
      ClUSTER_RESOURCE_GROUP: ${{ secrets.ClUSTER_AKS_BLOCKS_RESOURCE_GROUP }}
      CLUSTER_NAME: ${{ secrets.AKS_BLOCKS_DEV_CLUSTER }}
      ACR_RESOURCE_GROUP: ${{ secrets.ClUSTER_AKS_BLOCKS_RESOURCE_GROUP }}
```

---

## main.yml Template

```yaml
name: Build (main)

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main
    types:
      - opened

env:
  RUN_SONARQUBE: 'false'

jobs:
  initialization:
    permissions:
      contents: read
      id-token: write
    runs-on: ubuntu-latest
    steps:
      - name: Initialize pipeline
        run: echo 'initializing pipeline'

  cd-job:
    if: ${{ github.event_name == 'push' }}
    permissions:
      contents: read
      id-token: write
    uses: ./.github/workflows/3_web.yml
    with:
      CONTAINER_NAME: 'prod-$SERVICE_NAME-webclient'
      NAMESPACE: 'prod-$REPO_NAME'
      SERVICE_NAME: $SERVICE_NAME
      CI_BUILD: 'prod'
    secrets:
      SELISE_GITHUB_PAT: ${{ secrets.SELISE_GITHUB_PAT }}
      AZURE_CREDENTIALS: ${{ secrets.AZURE_AKS_BLOCKS_CONSTRUCT_CREDENTIALS }}
      AZURE_CONTAINER_REGISTRY: ${{ secrets.AZURE_BLOCKS_PROD_CONTAINER_REGISTRY }}
      ClUSTER_RESOURCE_GROUP: ${{ secrets.CLUSTER_AKS_BLOCKS_PROD_RESOURCE_GROUP }}
      CLUSTER_NAME: ${{ secrets.AKS_BLOCKS_PROD_CLUSTER }}
      ACR_RESOURCE_GROUP: ${{ secrets.CLUSTER_AKS_BLOCKS_PROD_RESOURCE_GROUP }}
```

---

## 3_web.yml Template (Reusable — Dev/Prod)

```yaml
name: Web-Build and push at ACR

on:
  workflow_call:
    inputs:
      CI_BUILD:
        required: true
        type: string
      VERSION:
        required: false
        type: string
      CONTAINER_NAME:
        required: true
        type: string
      NAMESPACE:
        required: true
        type: string
      SERVICE_NAME:
        required: true
        type: string

    secrets:
      SELISE_GITHUB_PAT:
        required: true
      AZURE_CREDENTIALS:
        required: true
      AZURE_CONTAINER_REGISTRY:
        required: true
      ClUSTER_RESOURCE_GROUP:
        required: true
      CLUSTER_NAME:
        required: true
      ACR_RESOURCE_GROUP:
        required: true

env:
  SERVICE_TYPE: "webclient"

jobs:
  integrateWeb:
    permissions:
      contents: read
      id-token: write
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: "true"
          token: ${{ secrets.SELISE_GITHUB_PAT }}

      - name: Update submodule
        run: git submodule update --init

      - name: Set Environment Variables
        uses: ./.github/actions/setvars
        with:
          varFilePath: ./.github/variables/vars.env

      - name: Azure login
        uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Build and push image to ACR
        run: |
          az acr build \
          --image ${{ secrets.AZURE_CONTAINER_REGISTRY }}.azurecr.io/${{ inputs.CONTAINER_NAME }}:${{ github.sha }} \
          --registry ${{ secrets.AZURE_CONTAINER_REGISTRY }} -g ${{ secrets.ACR_RESOURCE_GROUP }} \
          --file ${{ env.DOCKERFILE }} \
          --build-arg ci_build=${{ inputs.CI_BUILD }} .

  deployWebToK8s:
    needs: [integrateWeb]
    permissions:
      contents: read
      id-token: write
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: "true"
          token: ${{ secrets.SELISE_GITHUB_PAT }}

      - name: Update submodule
        run: git submodule update --init

      - name: Set Environment Variables
        uses: ./.github/actions/setvars
        with:
          varFilePath: ./.github/variables/vars.env

      - name: Azure login
        uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Pull helm repo
        uses: actions/checkout@v4
        with:
          repository: SELISEdigitalplatforms/l0-yml-infrastructure-helm
          token: ${{ secrets.SELISE_GITHUB_PAT }}

      - name: Get K8s context
        uses: azure/aks-set-context@v4
        with:
          resource-group: ${{ secrets.ClUSTER_RESOURCE_GROUP }}
          cluster-name: ${{ secrets.CLUSTER_NAME }}

      - name: Add kubelogin
        uses: azure/use-kubelogin@v1
        with:
          kubelogin-version: 'v0.0.24'

      - name: Convert kubeconfig to use AAD
        run: kubelogin convert-kubeconfig -l azurecli

      - name: Setup Helm Installer
        uses: Azure/setup-helm@v4.3.0
        with:
          token: ${{ secrets.SELISE_GITHUB_PAT }}

      - name: Deploy To Kubernetes
        run: |
          helm upgrade \
          --install ${{inputs.CONTAINER_NAME}} ./new-templates/ecap3-${{env.SERVICE_TYPE}}/ \
          --namespace=${{inputs.NAMESPACE}} \
          --values ./${{ secrets.CLUSTER_NAME }}/${{inputs.SERVICE_NAME}}-webclient.values.yaml \
          --set image.repository=${{ secrets.AZURE_CONTAINER_REGISTRY }}.azurecr.io/${{ inputs.CONTAINER_NAME }} \
          --set image.tag=${{ github.sha }} \
          --set fullnameOverride=${{inputs.CONTAINER_NAME}} \
          --set ingress.hosts[0].paths[0].path="/"
```

---

## .github/variables/vars.env Template

```
SONARQUBE_HOST=https://code.selise.biz
AUTHOR=<github-org>
REPO_NAME=<repo-name>
SOLUTION_NAME=<app-name>
SERVICE_NAME=<app-name>
DOCKERFILE=Dockerfile
STORYBOOK_DOCKERFILE=storybook.Dockerfile
```

---

## Required GitHub Secrets

These must be configured in **GitHub repo → Settings → Secrets and Variables → Actions**:

### Dev/Staging Secrets

| Secret Name | Description |
|------------|-------------|
| `AZURE_AKS_BLOCKS_CREDENTIALS` | Azure service principal JSON |
| `AZURE_BLOCKS_CONTAINER_REGISTRY` | ACR name (without .azurecr.io) |
| `ClUSTER_AKS_BLOCKS_RESOURCE_GROUP` | Azure resource group name |
| `AKS_BLOCKS_DEV_CLUSTER` | Dev AKS cluster name |
| `SELISE_GITHUB_PAT` | GitHub PAT for submodule access |
| `SONAR_TOKEN_GLOBAL` | SonarQube token |
| `DEPENDENCY_TRACK_API_KEY` | Dependency-Track API key |

### Production Secrets

| Secret Name | Description |
|------------|-------------|
| `AZURE_AKS_BLOCKS_CONSTRUCT_CREDENTIALS` | Azure SP for prod |
| `AZURE_BLOCKS_PROD_CONTAINER_REGISTRY` | Production ACR name |
| `CLUSTER_AKS_BLOCKS_PROD_RESOURCE_GROUP` | Prod resource group |
| `AKS_BLOCKS_PROD_CLUSTER` | Production AKS cluster name |

---

## .github/actions/setvars Template

Create `.github/actions/setvars/action.yml`:

```yaml
name: 'Set Environment Variables'
description: 'Load environment variables from a .env file'
inputs:
  varFilePath:
    description: 'Path to the .env file'
    required: true
runs:
  using: "composite"
  steps:
    - run: |
        while IFS='=' read -r key value; do
          if [[ ! "$key" =~ ^# && -n "$key" ]]; then
            echo "$key=$value" >> $GITHUB_ENV
          fi
        done < "${{ inputs.varFilePath }}"
      shell: bash
```
