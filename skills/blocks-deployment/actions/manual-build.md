# Action: manual-build

## Purpose

Trigger a build without auto-deploy for a specific repository. Use this when you want to build and verify before deploying manually.

Poll `get-build` to monitor status. Unlike `trigger-build`, this does not deploy the artifact on success.

---

## Endpoint

```
POST $API_BASE_URL/cloudbuild/v1/Build/manual
```

---

## curl

```bash
curl --location "$API_BASE_URL/cloudbuild/v1/Build/manual" \
  --header "x-blocks-key: $PROJECT_SLUG" \
  --header "Content-Type: application/json" \
  --data '{
    "repoId": "repo-id-here",
    "projectKey": "'"$PROJECT_SLUG"'",
    "hostingProviderId": "hosting-provider-id",
    "regionId": "region-id",
    "machineConfigId": "machine-config-id"
  }'
```

---

## Request Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| repoId | string | yes | ID of the repository in CloudBuild (from `get-repos`) |
| projectKey | string | yes | Use `$PROJECT_SLUG` |
| hostingProviderId | string | no | Hosting provider ID |
| regionId | string | no | Region ID |
| machineConfigId | string | no | Machine configuration ID |

---

## On Success (200)

```json
{
  "buildId": "string",
  "isSuccess": true,
  "errors": null,
  "message": "string",
  "statusCode": 200,
  "data": {}
}
```

Build has been queued. Use `get-build` with the returned `buildId` to monitor progress. No auto-deploy will occur on success.

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
| 404 | Wrong `API_BASE_URL` | Check environment URL |
