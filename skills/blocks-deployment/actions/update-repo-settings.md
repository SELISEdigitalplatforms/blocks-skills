# Action: update-repo-settings

## Purpose

Update build settings for a repository — hosting provider, region, machine configuration, custom domain, and deployment type.

---

## Endpoint

```
POST $API_BASE_URL/cloudbuild/v1/Build/repo-settings-update
```

---

## curl

```bash
curl --location "$API_BASE_URL/cloudbuild/v1/Build/repo-settings-update" \
  --header "x-blocks-key: $PROJECT_SLUG" \
  --header "Content-Type: application/json" \
  --data '{
    "projectKey": "'"$PROJECT_SLUG"'",
    "repoId": "repo-id-here",
    "hostingProviderId": "hosting-provider-id",
    "regionId": "region-id",
    "machineConfigId": "machine-config-id",
    "deploymentType": "auto",
    "customDomain": "app.example.com"
  }'
```

---

## Request Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| projectKey | string | yes | Use `$PROJECT_SLUG` |
| repoId | string | yes | Repository ID |
| hostingProviderId | string | no | From `get-hosting-config` |
| regionId | string | no | From `get-hosting-config` |
| machineConfigId | string | no | From `get-hosting-config` |
| deploymentType | string | no | e.g. `auto`, `manual` |
| customDomain | string | no | Custom domain for deployed app |

---

## On Success (200)

```json
{
  "isSuccess": true,
  "errors": null,
  "message": "string",
  "statusCode": 200,
  "data": {}
}
```

---

## On Failure

```json
{
  "isSuccess": false,
  "errors": {
    "repoId": "Repository not found"
  },
  "message": "string",
  "statusCode": 400,
  "data": null
}
```

| HTTP Status | Cause | Action |
|-------------|-------|--------|
| 200 with `isSuccess: false` | Validation error | Inspect `errors` dictionary |
| 401 | Missing or invalid `x-blocks-key` | Verify project key |
| 403 | Account lacks permission | Verify `cloudadmin` role |
