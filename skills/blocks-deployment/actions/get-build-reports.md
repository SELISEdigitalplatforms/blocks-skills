# Action: get-build-reports

## Purpose

Get build reports for a specific build, including test results, coverage, and other build artifacts.

---

## Endpoint

```
GET $API_BASE_URL/cloudbuild/v1/Build/reports?buildId={id}&ProjectKey=$PROJECT_SLUG
```

---

## curl

```bash
curl --location "$API_BASE_URL/cloudbuild/v1/Build/reports?buildId=build-id-here&ProjectKey=$PROJECT_SLUG" \
  --header "x-blocks-key: $PROJECT_SLUG" \
  --header "Content-Type: application/json"
```

---

## Query Parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| buildId | string | yes | ID of the build |
| type | string | no | Report type filter |
| ProjectKey | string | yes | Use `$PROJECT_SLUG` (PascalCase) |

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

| HTTP Status | Cause | Action |
|-------------|-------|--------|
| 401 | Missing or invalid `x-blocks-key` | Verify project key |
| 404 | Build not found | Verify `buildId` |
