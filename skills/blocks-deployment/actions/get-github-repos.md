# Action: get-github-repos

## Purpose

List GitHub repositories accessible to the authenticated user, with optional search and pagination.

---

## Endpoint

```
GET $API_BASE_URL/cloudbuild/v1/Github/repos?ProjectKey=$PROJECT_SLUG&Search={query}&PageNumber=1&PageSize=30
```

---

## curl

```bash
curl --location "$API_BASE_URL/cloudbuild/v1/Github/repos?ProjectKey=$PROJECT_SLUG&Search=frontend&PageNumber=1&PageSize=30" \
  --header "x-blocks-key: $PROJECT_SLUG" \
  --header "Content-Type: application/json"
```

---

## Query Parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| ProjectKey | string | yes | Use `$PROJECT_SLUG` (PascalCase) |
| Search | string | no | Filter repos by name |
| PageNumber | integer | no | Page number (default: 1) |
| PageSize | integer | no | Page size (default: 30) |

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
        "id": "string",
        "name": "string",
        "fullName": "string",
        "htmlUrl": "string",
        "defaultBranch": "main",
        "private": false,
        "language": "TypeScript"
      }
    ],
    "totalCount": 100,
    "pageNumber": 1,
    "pageSize": 30
  }
}
```

---

## On Failure

| HTTP Status | Cause | Action |
|-------------|-------|--------|
| 401 | Missing or invalid `x-blocks-key` | Verify project key |
| 403 | GitHub not connected | Connect GitHub account in Cloud Portal |
