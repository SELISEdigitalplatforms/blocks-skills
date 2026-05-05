# GitHub Webhook Setup

## Overview

GitHub webhooks enable automatic build triggers when code is pushed to a repository. Use `create-github-webhook` to set up the webhook on CloudBuild's side.

## Webhook Creation

```
POST /cloudbuild/v1/Github/webhook?x-blocks-key=$PROJECT_SLUG
```

> Note: `x-blocks-key` is passed as a **query parameter**, not a header.

```bash
curl --location "$API_BASE_URL/cloudbuild/v1/Github/webhook?x-blocks-key=$PROJECT_SLUG" \
  --header "Content-Type: application/json"
```

Response:

```json
{
  "isSuccess": true,
  "data": {
    "webhookId": "wh-12345",
    "url": "https://api.seliseblocks.com/cloudbuild/github/webhook/abc123",
    "events": ["push"],
    "active": true
  }
}
```

## Webhook Events

CloudBuild listens for the following GitHub webhook events:

| Event | Trigger |
|-------|--------|
| `push` | Any push to any branch |
| `pull_request` | PR opened, closed, or synchronized |
| `release` | Release published |

## Setting Up Webhook on GitHub Side

The `create-github-webhook` action sets up CloudBuild's side. For GitHub to send events:

1. Go to repository **Settings** → **Webhooks** → **Add webhook**
2. Payload URL: the URL returned by `create-github-webhook`
3. Content type: `application/json`
4. Secret: generate a random secret for HMAC verification
5. Events: select `push` (and optionally `pull_request`)

## Verifying Webhook Delivery

Check recent webhook deliveries in GitHub:
1. Go to repository **Settings** → **Webhooks**
2. Click the webhook
3. View "Recent Deliveries" to see ping and event payloads

## Custom Domain with Webhook

If using a custom domain for the deployed app, ensure the webhook is configured to trigger builds for all branches that should deploy:

```json
{
  "webhookId": "wh-12345",
  "events": ["push"],
  "branchFilter": ["main", "develop"]
}
```

> Note: branch filtering depends on CloudBuild configuration. Use `get-repo-details` to verify which branches trigger builds.

## Webhook Security

### HMAC Signature Verification

GitHub signs webhook payloads with HMAC-SHA256. Verify the signature:

```ts
import { createHmac } from 'crypto';

export function verifyGithubSignature(payload: string, signature: string, secret: string): boolean {
  const expected = 'sha256=' + createHmac('sha256', secret).update(payload).digest('hex');
  return expected === signature;
}
```

### Blocking Webhook

If you need a blocking webhook that verifies deployment before returning:

```bash
curl --location "$API_BASE_URL/cloudbuild/v1/Github/webhook?x-blocks-key=$PROJECT_SLUG&blocking=true" \
  --header "Content-Type: application/json"
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Webhook not triggering | Wrong payload URL | Use the URL returned by `create-github-webhook` |
| Webhook disabled | `active: false` | Re-create webhook or check CloudBuild status |
| 409 Conflict | Webhook already exists | Webhook is already configured for this repo |
| Missing events | Wrong event selection | Ensure `push` event is selected in GitHub settings |
| Webhook timeout | Build takes too long | Configure longer timeout in GitHub webhook settings |

## Frontend Webhook Status Component

```tsx
export function WebhookStatus({ webhook }: { webhook: { active: boolean; events: string[]; url: string } }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className={webhook.active ? 'text-green-500' : 'text-red-500'}>
          {webhook.active ? 'Active' : 'Inactive'}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        Events: {webhook.events.join(', ')}
      </p>
      <p className="text-xs text-muted-foreground truncate">
        URL: {webhook.url}
      </p>
    </div>
  );
}
```
