# Action: trigger-build

## Purpose

Trigger a build with auto-deploy for a specific repository. The build is queued and processed asynchronously — poll `get-build` to monitor status.

Use `POST /Build/run-build` for builds that auto-deploy on success. Use `manual-build` for build-only (no deploy).

---

## Endpoint

```
POST $API_BASE_URL/cloudbuild/v1/Build/run-build
```

---

## curl

```bash
curl --location "$API_BASE_URL/cloudbuild/v1/Build/run-build" \
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

> `repoId` is correct — NOT `repositoryId`. The field name was corrected from the old `TriggerBuildRequest`.

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

Build has been queued. Use `get-build` with the returned `buildId` to monitor progress.

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
| 200 with `isSuccess: false` | Validation error on one or more fields | Inspect `errors` dictionary and correct the request |
| 401 | Missing or invalid `x-blocks-key` | Verify project key in Cloud Portal |
| 403 | Account lacks permission | Verify `cloudadmin` role in Cloud Portal |
| 404 | Wrong `API_BASE_URL` | Check environment URL in Cloud Portal |
