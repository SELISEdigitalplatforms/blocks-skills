# Action: get-repo-details

## Purpose

Get details for a specific repository configured in CloudBuild, including hosting provider, region, and machine configuration.

---

## Endpoint

```
GET $API_BASE_URL/cloudbuild/v1/Build/repo-details?ProjectKey=$PROJECT_SLUG&RepoId={id}
```

---

## curl

```bash
curl --location "$API_BASE_URL/cloudbuild/v1/Build/repo-details?ProjectKey=$PROJECT_SLUG&RepoId=repo-id-here" \
  --header "x-blocks-key: $PROJECT_SLUG" \
  --header "Content-Type: application/json"
```

---

## Query Parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| ProjectKey | string | yes | Use `$PROJECT_SLUG` (PascalCase) |
| RepoId | string | yes | Repository ID (from `get-repos`) |

---

## On Success (200)

```json
{
  "isSuccess": true,
  "errors": null,
  "message": "string",
  "statusCode": 200,
  "data": {
    "repo": {
      "repoId": "string",
      "repoUrl": "string",
      "hostingProvider": { "id": "string", "name": "string" },
      "region": { "id": "string", "name": "string" },
      "machineConfig": { "id": "string", "ram": "string", "cpu": "string" },
      "customDomain": "string",
      "deploymentType": "string"
    }
  }
}
```

---

## On Failure

| HTTP Status | Cause | Action |
|-------------|-------|--------|
| 401 | Missing or invalid `x-blocks-key` | Verify project key |
| 403 | Account lacks permission | Verify `cloudadmin` role |
| 404 | Repo not found | Verify `RepoId` from `get-repos` |
