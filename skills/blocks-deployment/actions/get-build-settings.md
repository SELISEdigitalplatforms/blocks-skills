# Action: get-build-settings

## Purpose

Get build settings for the project.

---

## Endpoint

```
GET $API_BASE_URL/cloudbuild/v1/Build/settings
```

---

## curl

```bash
curl --location "$API_BASE_URL/cloudbuild/v1/Build/settings" \
  --header "x-blocks-key: $PROJECT_SLUG" \
  --header "Content-Type: application/json"
```

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
| 403 | Account lacks permission | Verify `cloudadmin` role |
