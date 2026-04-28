# Action: SaveOIDCClient

## Purpose

Creates or updates an OIDC client credential. Omit `itemId` to create a new client; include `itemId` to update an existing client.

## Endpoint

```
POST /idp/v1/Authentication/SaveOIDCClient
```

## curl

```bash
curl -X POST 'https://api.blocks.example.com/idp/v1/Authentication/SaveOIDCClient' \
  -H 'Authorization: Bearer $ACCESS_TOKEN' \
  -H 'x-blocks-key: $X_BLOCKS_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "projectKey": "my-project",
    "redirectUri": "https://app.example.com/callback",
    "scope": "openid profile email",
    "audience": "https://api.example.com",
    "isAutoRedirect": true,
    "clientLogoUrl": "https://app.example.com/logo.png",
    "clientDisplayName": "My Application",
    "clientBrandColor": "#0066CC"
  }'
```

## Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `projectKey` | string | Yes | The project key |
| `redirectUri` | string | Yes | OAuth redirect URI |
| `scope` | string | Yes | OAuth scopes |
| `audience` | string | Yes | Target API audience |
| `isAutoRedirect` | boolean | No | Auto-redirect after login (default: false) |
| `itemId` | string | No | Client ID (omit to create, include to update) |
| `clientLogoUrl` | string | No | Logo URL for the client |
| `clientDisplayName` | string | No | Display name for the client |
| `clientBrandColor` | string | No | Brand color hex code |

## On Success (200)

```json
{
  "isSuccess": true,
  "errors": {},
  "itemId": "client-uuid-string"
}
```

## On Failure

```json
{
  "isSuccess": false,
  "errors": {
    "redirectUri": "Invalid redirect URI format"
  }
}
```
