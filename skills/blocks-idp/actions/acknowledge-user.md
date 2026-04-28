# Action: acknowledge-user

## Purpose

Acknowledge a user in the identity provider.

## Endpoint

`POST /idp/v1/Authentication/UserAcknowledgement`

## curl

```bash
curl -X POST "{{BASE_URL}}/idp/v1/Authentication/UserAcknowledgement" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "x-blocks-key: $X_BLOCKS_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "string",
    "redirectUri": "string",
    "scope": "string",
    "state": "string",
    "nonce": "string",
    "isAcknowledged": true,
    "username": "string"
  }'
```

## Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| clientId | string | Yes | OAuth client identifier |
| redirectUri | string | Yes | Redirect URI for the authentication flow |
| scope | string | Yes | OAuth scope |
| state | string | Yes | State parameter for CSRF protection |
| nonce | string | Yes | Nonce for replay attack prevention |
| isAcknowledged | boolean | Yes | Whether the user has acknowledged |
| username | string | Yes | Username to acknowledge |

## On Success

**200 OK** — No body returned.

## On Failure

| Status | Description |
|--------|-------------|
| 400 Bad Request | Invalid request body |
| 401 Unauthorized | Missing or invalid authentication |
| 403 Forbidden | Insufficient permissions |
| 500 Internal Server Error | Server error |
