# Action: create-github-webhook

## Purpose

Create a GitHub webhook for a repository to trigger auto-deploys on push events.

---

## Endpoint

```
POST $API_BASE_URL/cloudbuild/v1/Github/webhook?x-blocks-key=$PROJECT_SLUG
```

> Note: `x-blocks-key` is passed as a **query parameter** on this endpoint, not as a header.

---

## curl

```bash
curl --location "$API_BASE_URL/cloudbuild/v1/Github/webhook?x-blocks-key=$PROJECT_SLUG" \
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
  "data": {
    "webhookId": "string",
    "url": "string",
    "events": ["push"],
    "active": true
  }
}
```

---

## On Failure

| HTTP Status | Cause | Action |
|-------------|-------|--------|
| 401 | Missing or invalid `x-blocks-key` | Verify project key (as query param) |
| 403 | GitHub not connected | Connect GitHub account in Cloud Portal |
| 409 | Webhook already exists | Webhook already configured for this repo |
