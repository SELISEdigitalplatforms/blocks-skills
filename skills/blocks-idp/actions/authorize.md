# Action: Authorize

## Purpose

OAuth 2.0 authorization endpoint for initiating the authentication flow. This is a browser redirect endpoint that handles the OIDC authorization code flow.

## Endpoint

`GET /idp/v1/Authentication/Authorize`

## curl

```bash
curl -X GET "https://api.blocks.local/idp/v1/Authentication/Authorize?\
response_type=code&\
client_id=$OIDC_CLIENT_ID&\
state=$STATE&\
redirect_uri=$OIDC_REDIRECT_URI&\
scope=openid%20profile%20email&\
nonce=$NONCE"
```

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| response_type | string | Yes | OAuth response type (typically "code" for authorization code flow) |
| client_id | string | Yes | OAuth client identifier |
| state | string | Yes | Random string for CSRF protection |
| redirect_uri | string | Yes | URI to redirect after successful authorization |
| scope | string | No | OAuth scopes (e.g., "openid profile email") |
| nonce | string | No | Random string for replay attack prevention |

## On Success (200)

Redirects to the specified `redirect_uri` with authorization code and state parameters:

```
{redirect_uri}?code={authorization_code}&state={state}
```

## On Failure

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid or missing required parameters |
| 401 | Unauthorized - Invalid client_id |
| 403 | Forbidden - Invalid redirect_uri or scope |
| 500 | Internal Server Error |

**Note:** This is a browser redirect endpoint designed for user authentication flows. It is not intended for direct API calls.
