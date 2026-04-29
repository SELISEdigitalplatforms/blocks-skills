# Action: Get JWKS

## Purpose

Retrieves the JSON Web Key Set (JWKS) used for validating JWT tokens issued by the identity provider.

## Endpoint

`GET /idp/v1/.well-known/jwks.json`

## curl

```bash
curl -X GET "https://api.blocks.local/idp/v1/.well-known/jwks.json?projectKey=your-project-key"
```

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| projectKey | string | Yes | Project identifier for the key configuration |

## On Success (200)

Returns the JSON Web Key Set:

```json
{
  "keys": [
    {
      "kid": "key-id-1",
      "kty": "RSA",
      "alg": "RS256",
      "use": "sig",
      "n": "base64url-encoded-modulus",
      "e": "base64url-encoded-exponent"
    }
  ]
}
```

## On Failure

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Missing projectKey |
| 404 | Not Found - Project key configuration not found |
| 500 | Internal Server Error |

**Note:** This is a public endpoint. No Authorization header is required. Use the `kid` from the token header to find the matching key for signature verification.
