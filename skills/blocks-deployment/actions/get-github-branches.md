# Action: get-github-branches

## Purpose

List branches for a GitHub repository.

---

## Endpoint

```
GET $API_BASE_URL/cloudbuild/v1/Github/branches?repo={owner/repo}&ProjectKey=$PROJECT_SLUG
```

---

## curl

```bash
curl --location "$API_BASE_URL/cloudbuild/v1/Github/branches?repo=owner/repo-name&ProjectKey=$PROJECT_SLUG" \
  --header "x-blocks-key: $PROJECT_SLUG" \
  --header "Content-Type: application/json"
```

---

## Query Parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| repo | string | yes | Repository name with owner (e.g. `myorg/myrepo`) |
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
    "branches": [
      {
        "name": "main",
        "sha": "abc123def",
        "protected": true
      },
      {
        "name": "develop",
        "sha": "def456ghi",
        "protected": false
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
| 404 | Repository not found | Verify `repo` parameter format |
