# Action: save-signup-settings

## Purpose

Create or update sign-up settings for a project.

## Endpoint

`POST /idp/v1/Iam/SaveSignUpSetting`

## curl

```bash
curl -X POST "{{BASE_URL}}/idp/v1/Iam/SaveSignUpSetting" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "x-blocks-key: $X_BLOCKS_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "isEmailPasswordSignUpEnabled": true,
    "isSSoSignUpEnabled": false,
    "projectKey": "string",
    "itemId": "string"
  }'
```

## Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| isEmailPasswordSignUpEnabled | boolean | Yes | Enable email/password sign-up |
| isSSoSignUpEnabled | boolean | Yes | Enable SSO sign-up |
| projectKey | string | Yes | Project identifier |
| itemId | string | No | Include to update existing setting; omit to create new |

## On Success

**200 OK**

```json
{
  "isSuccess": true,
  "errors": {},
  "itemId": "string"
}
```

| Field | Type | Description |
|-------|------|-------------|
| isSuccess | boolean | Operation success status |
| errors | object | Error details if any |
| itemId | string | Created or updated setting identifier |

## On Failure

| Status | Description |
|--------|-------------|
| 400 Bad Request | Invalid request body |
| 401 Unauthorized | Missing or invalid authentication |
| 403 Forbidden | Insufficient permissions |
| 500 Internal Server Error | Server error |
