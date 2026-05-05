# Action: get-build

## Purpose

Retrieve details of a single build by its ID. Use this to check build status, view commit info, and determine if a build succeeded or failed.

---

## Endpoint

```
GET $API_BASE_URL/cloudbuild/v1/Build?buildId={id}&ProjectKey=$PROJECT_SLUG
```

---

## curl

```bash
curl --location "$API_BASE_URL/cloudbuild/v1/Build?buildId=build-id-here&ProjectKey=$PROJECT_SLUG" \
  --header "x-blocks-key: $PROJECT_SLUG" \
  --header "Content-Type: application/json"
```

---

## Query Parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| buildId | string | yes | ID of the build to retrieve |
| ProjectKey | string | yes | Use `$PROJECT_SLUG` (PascalCase) |

> Note: `ProjectKey` is PascalCase — this is the convention used in the cloudbuild/v1 swagger.

---

## On Success (200)

```json
{
  "isSuccess": true,
  "errors": null,
  "message": "string",
  "statusCode": 200,
  "data": {
    "build": {
      "buildId": "string",
      "branch": "main",
      "status": "Succeeded",
      "startTime": "2024-01-01T00:00:00Z",
      "endTime": "2024-01-01T00:05:00Z",
      "commitHash": "abc123def",
      "commitMessage": "fix: resolve login issue"
    }
  }
}
```

**Build status values:** `Queued`, `InProgress`, `Succeeded`, `Failed`, `Cancelled`

---

## On Failure

| HTTP Status | Cause | Action |
|-------------|-------|--------|
| 200 with `isSuccess: false` | Build not found | Verify `buildId` from `get-builds` response |
| 401 | Missing or invalid `x-blocks-key` | Verify project key |
| 403 | Account lacks permission | Verify `cloudadmin` role |
| 404 | Wrong `API_BASE_URL` | Check environment URL |

---

## Polling

Poll every 10 seconds while status is `Queued` or `InProgress`. Stop polling at terminal states: `Succeeded`, `Failed`, `Cancelled`.
