# Hosting Providers Configuration

## Overview

CloudBuild supports multiple hosting providers (AWS, Azure, GCP, etc.) with configurable regions and machine specifications. Use `get-hosting-config` to retrieve available options.

## Getting Hosting Configuration

```
GET /cloudbuild/v1/VcsRepository/HostingConfiguration
```

Response:

```json
{
  "isSuccess": true,
  "data": {
    "hostingProviders": [
      {
        "id": "aws-1",
        "name": "AWS",
        "status": "active",
        "region": [
          {
            "id": "us-east-1",
            "name": "US East (N. Virginia)",
            "status": "active",
            "machineSpecs": [
              { "id": "small", "cpu": "2 vCPU", "ram": "8 GB", "bandwidth": "1 Gbps", "status": "active" },
              { "id": "medium", "cpu": "4 vCPU", "ram": "16 GB", "bandwidth": "2 Gbps", "status": "active" },
              { "id": "large", "cpu": "8 vCPU", "ram": "32 GB", "bandwidth": "5 Gbps", "status": "active" }
            ]
          },
          {
            "id": "eu-west-1",
            "name": "Europe (Ireland)",
            "status": "active",
            "machineSpecs": [
              { "id": "small", "cpu": "2 vCPU", "ram": "8 GB", "bandwidth": "1 Gbps", "status": "active" }
            ]
          }
        ]
      },
      {
        "id": "azure-1",
        "name": "Azure",
        "status": "active",
        "region": [
          {
            "id": "eastus",
            "name": "East US",
            "status": "active",
            "machineSpecs": [
              { "id": "small", "cpu": "2 vCPU", "ram": "8 GB", "bandwidth": "1 Gbps", "status": "active" }
            ]
          }
        ]
      }
    ]
  }
}
```

## Using Hosting Config in Build Trigger

Pass the selected IDs when triggering a build:

```json
{
  "repoId": "repo-id-here",
  "projectKey": "TEST_KEY",
  "hostingProviderId": "aws-1",
  "regionId": "us-east-1",
  "machineConfigId": "medium"
}
```

## Cascading Selection Pattern

Hosting configuration requires three cascading selections:

1. **Select Provider** → filters available regions
2. **Select Region** → filters available machine specs
3. **Select Machine** → use the IDs in `update-repo-settings`

```tsx
const { data } = useGetHostingConfig();

const providers = data?.data?.hostingProviders ?? [];
const regions = providers.find(p => p.id === selectedProviderId)?.region ?? [];
const machines = regions.find(r => r.id === selectedRegionId)?.machineSpecs ?? [];

// Display as three dropdowns: Provider → Region → Machine
```

## Updating Repo Settings with Hosting Config

```bash
curl --location "$API_BASE_URL/cloudbuild/v1/Build/repo-settings-update" \
  --header "x-blocks-key: $PROJECT_SLUG" \
  --header "Content-Type: application/json" \
  --data '{
    "projectKey": "TEST_KEY",
    "repoId": "repo-id-here",
    "hostingProviderId": "aws-1",
    "regionId": "us-east-1",
    "machineConfigId": "medium"
  }'
```

## Common Hosting Provider IDs

| Provider | ID | Typical Regions |
|----------|----|----------------|
| AWS | `aws-1` | `us-east-1`, `eu-west-1`, `ap-southeast-1` |
| Azure | `azure-1` | `eastus`, `westus2`, `northeurope` |
| GCP | `gcp-1` | `us-central1`, `europe-west1`, `asia-east1` |

> Note: IDs are illustrative — use `get-hosting-config` to get actual IDs for your project.

## Machine Configuration Tiers

| Tier | CPU | RAM | Use Case |
|------|-----|-----|----------|
| `small` | 2 vCPU | 8 GB | Development, small SPAs |
| `medium` | 4 vCPU | 16 GB | Production, medium apps |
| `large` | 8 vCPU | 32 GB | High-traffic, enterprise |

## Custom Domain

When configuring a custom domain:

```json
{
  "repoId": "repo-id-here",
  "projectKey": "TEST_KEY",
  "customDomain": "app.example.com"
}
```

The domain must be configured in DNS to point to the Blocks deployment. CNAME records should be set to the Blocks-provided endpoint.
