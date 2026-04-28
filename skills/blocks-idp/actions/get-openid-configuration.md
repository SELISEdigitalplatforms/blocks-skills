# Action: Get OpenID Configuration

## Purpose

Retrieves the OIDC discovery document containing endpoint URLs, supported algorithms, and other configuration details for the identity provider.

## Endpoint

`GET /idp/v1/.well-known/openid-configuration`

## curl

```bash
curl -X GET "https://api.blocks.local/idp/v1/.well-known/openid-configuration?projectKey=your-project-key"
```

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| projectKey | string | Yes | Project identifier for the identity configuration |

## On Success (200)

Returns the OIDC discovery document:

```json
{
  "issuer": "https://auth.blocks.local",
  "authorization_endpoint": "https://api.blocks.local/idp/v1/Authentication/Authorize",
  "token_endpoint": "https://api.blocks.local/idp/v1/Authentication/Token",
  "userinfo_endpoint": "https://api.blocks.local/idp/v1/Authentication/UserInfo",
  "jwks_uri": "https://api.blocks.local/idp/v1/.well-known/jwks.json",
  "response_types_supported": ["code", "token"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256"],
  "scopes_supported": ["openid", "profile", "email"],
  "token_endpoint_auth_methods_supported": ["client_secret_basic", "client_secret_post"],
  "claims_supported": ["sub", "name", "email", "email_verified"]
}
```

## On Failure

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Missing projectKey |
| 404 | Not Found - Project configuration not found |
| 500 | Internal Server Error |

**Note:** This is a public endpoint. No Authorization header is required, but including `x-blocks-key` header is recommended for better request tracking.
