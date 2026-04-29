# Flow: webhook-setup

Configures a webhook to receive real-time notifications when translation keys or modules change in UILM. The webhook enables the app to react to localization changes without polling.

## Trigger

> "set up a webhook for translation changes"
> "configure webhooks for localization events"
> "get notified when translations are updated"
> "add a webhook for key changes"

---

## Pre-flight Questions

Before configuring, confirm:
1. What HTTPS URL should receive the webhook events? (must be publicly accessible)
2. Do you want HMAC signature verification? If yes, provide the secret value and header name
3. Should the webhook be enabled immediately or created disabled?

---

## Flow Steps

### Step 1 — Validate URL

The webhook URL must:
- Use HTTPS (HTTP is not supported for webhooks)
- Be publicly reachable from the UILM backend
- Be prepared to receive `POST` requests with a JSON body

### Step 2 — Configure Webhook

Call the `save-webhook` action:

```
Action: save-webhook
Input:
  url                     = https://my-app.example.com/webhooks/localization
  contentType             = application/json
  blocksWebhookSecret     = { secret: "my-secret-xyz", headerKey: "x-webhook-sig" }
  isDisabled              = false
  projectKey              = $PROJECT_KEY
```

For **HMAC signature verification**, provide the `blocksWebhookSecret` object:
- `secret` — the shared secret used to sign payloads
- `headerKey` — the HTTP header name where the signature will be sent (e.g., `x-webhook-sig`)

To **create without HMAC**, omit `blocksWebhookSecret`.

To create the webhook **disabled** (for testing), set `isDisabled: true`.

### Step 3 — Verify

On success (200), the webhook is registered. Test it by:
1. Making a small change to a translation key in UILM
2. Confirming a `POST` request arrives at the webhook URL

---

## Request Body Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| url | string | yes | HTTPS endpoint to receive webhook events |
| contentType | string | yes | `"application/json"` for JSON payloads |
| blocksWebhookSecret | object | no | Nested `{ secret, headerKey }` for HMAC verification |
| blocksWebhookSecret.secret | string | yes (if HMAC) | Shared secret for HMAC-SHA256 signing |
| blocksWebhookSecret.headerKey | string | yes (if HMAC) | Header name for the signature (e.g., `x-webhook-sig`) |
| isDisabled | boolean | no | Create disabled (default: `false`) |
| projectKey | string | yes | Use `$PROJECT_KEY` |
| itemId | string | no | Omit to **create**; include to **update** an existing webhook |

### Example: Create with HMAC

```bash
curl --location "https://api.seliseblocks.com/uilm/v1/Config/SaveWebHook" \
  --header "x-blocks-key: TEST_KEY_123" \
  --header "Content-Type: application/json" \
  --data '{
    "url": "https://my-app.example.com/webhooks/localization",
    "contentType": "application/json",
    "blocksWebhookSecret": {
      "secret": "my-secret-xyz",
      "headerKey": "x-webhook-sig"
    },
    "isDisabled": false,
    "projectKey": "TEST_KEY_123"
  }'
```

### Example: Create without HMAC

```bash
curl --location "https://api.seliseblocks.com/uilm/v1/Config/SaveWebHook" \
  --header "x-blocks-key: TEST_KEY_123" \
  --header "Content-Type: application/json" \
  --data '{
    "url": "https://my-app.example.com/webhooks/localization",
    "contentType": "application/json",
    "isDisabled": false,
    "projectKey": "TEST_KEY_123"
  }'
```

---

## Verifying HMAC Signatures

If HMAC is configured, verify incoming requests:

```typescript
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  headerKey: string
): boolean {
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(expectedSig),
    Buffer.from(signature)
  );
}
```

---

## Error Handling

| Error | Cause | Action |
|-------|-------|--------|
| 400 | Invalid URL (not HTTPS) | Use an HTTPS URL |
| 400 | Missing required fields | Ensure url, contentType, projectKey are provided |
| 401 | Invalid credentials | Check `x-blocks-key` header |
| 500 | UILM backend error | Retry or check backend health |

---

## Frontend Output

| File | Purpose |
|------|---------|
| `modules/localization/components/webhook-settings/webhook-settings.tsx` | Webhook URL input, HMAC secret configuration, enable/disable toggle |
| `modules/localization/hooks/use-webhook.ts` | `useSaveWebhook` hook wrapping the save-webhook action |
| `modules/localization/services/webhook.service.ts` | `saveWebhook()` function calling the UILM Config/SaveWebHook endpoint |
