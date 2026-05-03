# Action: get-builds

## Purpose

Retrieve a list of builds for the project. There is no paginated build list endpoint in the cloudbuild/v1 swagger — implement client-side pagination by collecting builds across pages from `GET /Build`.

> Note: The swagger does not define a paginated build list endpoint. If a full list is needed, aggregate results client-side or use `get-build-reports` for specific reports.

---

## Endpoint

```
GET $API_BASE_URL/cloudbuild/v1/Build?ProjectKey=$PROJECT_SLUG
```

---

## curl

```bash
curl --location "$API_BASE_URL/cloudbuild/v1/Build?ProjectKey=$PROJECT_SLUG" \
  --header "x-blocks-key: $PROJECT_SLUG" \
  --header "Content-Type: application/json"
```

---

## Query Parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| ProjectKey | string | yes | Use `$PROJECT_SLUG` (PascalCase) |

> Without a `buildId`, this returns the most recent build(s). For a paginated list, use `get-build-reports` or aggregate multiple calls.

---

## On Success (200)

```json
{
  "isSuccess": true,
  "errors": null,
  "message": "string",
  "statusCode": 200,
  "data": {
    "builds": [
      {
        "buildId": "string",
        "branch": "main",
        "status": "Succeeded",
        "startTime": "2024-01-01T00:00:00Z",
        "endTime": "2024-01-01T00:05:00Z",
        "commitHash": "abc123def",
        "commitMessage": "fix: resolve login issue"
      }
    ]
  }
}
```

**Build status values:** `Queued`, `InProgress`, `Succeeded`, `Failed`, `Cancelled`

---

## On Failure

| HTTP Status | Cause | Action |
|-------------|-------|--------|
| 401 | Missing or invalid `x-blocks-key` | Verify project key |
| 403 | Account lacks permission | Verify `cloudadmin` role |
| 404 | Wrong `API_BASE_URL` or project not found | Check environment URL |
