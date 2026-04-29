# Action: get-signup-settings

## Purpose

Retrieve sign-up settings for a project.

## Endpoint

`GET /idp/v1/Iam/GetSignUpSetting`

## curl

```bash
curl -X GET "{{BASE_URL}}/idp/v1/Iam/GetSignUpSetting?ItemId={{ITEM_ID}}&ProjectKey={{PROJECT_KEY}}" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "x-blocks-key: $X_BLOCKS_KEY"
```

## Query Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| ItemId | string | Yes | The setting item identifier |
| ProjectKey | string | Yes | The project key |

## On Success

**200 OK** — Returns a SignUpSetting object:

```json
{
  "itemId": "string",
  "createdDate": "2024-01-01T00:00:00Z",
  "lastUpdatedDate": "2024-01-01T00:00:00Z",
  "createdBy": "string",
  "language": "string",
  "lastUpdatedBy": "string",
  "organizationIds": ["string"],
  "tags": ["string"],
  "isEmailPasswordSignUpEnabled": true,
  "isSSoSignUpEnabled": false
}
```

| Field | Type | Description |
|-------|------|-------------|
| itemId | string | Unique identifier |
| createdDate | datetime | Creation timestamp |
| lastUpdatedDate | datetime | Last update timestamp |
| createdBy | string | Creator identifier |
| language | string | Language code |
| lastUpdatedBy | string | Last updater identifier |
| organizationIds | string[] | Associated organization IDs |
| tags | string[] | Tags for categorization |
| isEmailPasswordSignUpEnabled | boolean | Email/password sign-up enabled |
| isSSoSignUpEnabled | boolean | SSO sign-up enabled |

## On Failure

| Status | Description |
|--------|-------------|
| 400 Bad Request | Missing required query parameters |
| 401 Unauthorized | Missing or invalid authentication |
| 403 Forbidden | Insufficient permissions |
| 404 Not Found | Sign-up setting not found |
| 500 Internal Server Error | Server error |
