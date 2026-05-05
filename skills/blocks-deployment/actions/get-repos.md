# Action: get-repos

## Purpose

List repositories configured in CloudBuild for the project. Use this to find the `repoId` needed for `trigger-build`.

---

## Endpoint

```
GET $API_BASE_URL/cloudbuild/v1/Build/repos?ProjectKey=$PROJECT_SLUG
```

---

## curl

```bash
curl --location "$API_BASE_URL/cloudbuild/v1/Build/repos?ProjectKey=$PROJECT_SLUG" \
  --header "x-blocks-key: $PROJECT_SLUG" \
  --header "Content-Type: application/json"
```

---

## Query Parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| ProjectKey | string | yes | Use `$PROJECT_SLUG` (PascalCase) |

---

## On Success (200)

```json
{
  "isSuccess": true,
  "errors": null,
  "message": "string",
  "statusCode": 200,
  "data": {
    "repos": [
      {
        "repoId": "string",
        "repoUrl": "string",
        "customDeploymentDomain": "string",
        "branch": "main"
      }
    ]
  }
}
```

---

## On Failure

| HTTP Status | Cause | Action |
|-------------|-------|--------|
| 401 | Missing or invalid `x-blocks-key` | Verify project key |
| 403 | Account lacks permission | Verify `cloudadmin` role |
| 404 | Wrong `API_BASE_URL` | Check environment URL |
