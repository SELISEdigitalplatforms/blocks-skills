# Action: get-github-user

## Purpose

Get the authenticated GitHub user associated with the project.

---

## Endpoint

```
GET $API_BASE_URL/cloudbuild/v1/Github/user?ProjectKey=$PROJECT_SLUG
```

---

## curl

```bash
curl --location "$API_BASE_URL/cloudbuild/v1/Github/user?ProjectKey=$PROJECT_SLUG" \
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
    "login": "string",
    "avatarUrl": "string",
    "htmlUrl": "string"
  }
}
```

---

## On Failure

| HTTP Status | Cause | Action |
|-------------|-------|--------|
| 401 | Missing or invalid `x-blocks-key` | Verify project key |
| 403 | GitHub not connected | Connect GitHub account in Cloud Portal |
