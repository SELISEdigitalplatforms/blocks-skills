# Action: Login

## Purpose

Validates user credentials against the identity provider. Use `get-token` action for complete login with token retrieval. This action is for pre-OIDC login validation.

## Endpoint

`POST /idp/v1/Authentication/Login`

## curl

```bash
curl -X POST "https://api.blocks.local/idp/v1/Authentication/Login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "$USERNAME",
    "password": "$PASSWORD",
    "clientId": "$OIDC_CLIENT_ID",
    "redirectUri": "https://your-app.com/callback",
    "scope": "openid profile email",
    "state": "random-state-value",
    "nonce": "random-nonce-value"
  }'
```

## Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| username | string | Yes | User's email or username |
| password | string | Yes | User's password |
| clientId | string | Yes | OAuth client identifier |
| redirectUri | string | Yes | URI to redirect after successful login |
| scope | string | No | OAuth scopes (e.g., "openid profile email") |
| state | string | No | Random string for CSRF protection |
| nonce | string | No | Random string for replay attack prevention |

## On Success (200)

Returns OK status. For complete authentication with access token, use the `get-token` action instead.

## On Failure

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid or missing required fields |
| 401 | Unauthorized - Invalid credentials |
| 403 | Forbidden - Account locked or disabled |
| 500 | Internal Server Error |
