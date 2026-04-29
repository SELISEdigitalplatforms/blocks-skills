# Action: get-permissions-grouped

## Purpose

Retrieve permissions grouped by severity level.

## Endpoint

`GET /idp/v1/Iam/GetPermissionsGroupBySeverity`

## curl

```bash
curl -X GET "{{BASE_URL}}/idp/v1/Iam/GetPermissionsGroupBySeverity?ProjectKey={{PROJECT_KEY}}" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "x-blocks-key: $X_BLOCKS_KEY"
```

## Query Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| ProjectKey | string | Yes | The project key to filter permissions |

## On Success

**200 OK** — Returns an array of severity counts:

```json
[
  { "severityLevel": "string", "count": 0 }
]
```

| Field | Type | Description |
|-------|------|-------------|
| severityLevel | string | Severity level name |
| count | integer | Number of permissions at this level |

## On Failure

| Status | Description |
|--------|-------------|
| 400 Bad Request | Missing required query parameter |
| 401 Unauthorized | Missing or invalid authentication |
| 403 Forbidden | Insufficient permissions |
| 500 Internal Server Error | Server error |
