# Action: save-webhook

## Purpose

Configure a webhook to receive notifications for localization events.

---

## Endpoint

```
POST {apiUrl}/uilm/v1/Config/SaveWebHook
```

---

## curl

```bash
curl --location "{apiUrl}/uilm/v1/Config/SaveWebHook" \
  --header "x-blocks-key: {projectKey}" \
  --header "Content-Type: application/json" \
  --data '{
    "url": "https://my-app.example.com/webhooks/localization",
    "contentType": "application/json",
    "blocksWebhookSecret": {
      "secret": "my-webhook-secret",
      "headerKey": "x-webhook-signature"
    },
    "isDisabled": false,
    "projectKey": "{projectKey}"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| url | string | yes | HTTPS endpoint to receive webhook events |
| contentType | string | yes | Content-Type for the webhook payload (e.g. `"application/json"`) |
| blocksWebhookSecret | object | yes | Nested object with `secret` and `headerKey` |
| blocksWebhookSecret.secret | string | yes | Secret value for HMAC signature verification |
| blocksWebhookSecret.headerKey | string | yes | Header name where signature will be sent |
| isDisabled | boolean | no | Disable the webhook without deleting it |
| projectKey | string | yes | Use $PROJECT_KEY |
| itemId | string | no | Omit to create, include to update |

---

## On Success (200)

```json
{
  "success": true,
  "errorMessage": null,
  "validationErrors": []
}
```

---

## On Failure

* 400 — invalid URL or configuration
* 401 — invalid or missing credentials — check `x-blocks-key` header
