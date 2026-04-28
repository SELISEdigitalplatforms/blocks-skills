# Action: get-user-timeline

## Purpose

Retrieve a paginated and filterable list of user timeline events.

## Endpoint

`GET /idp/v1/Iam/GetUserTimelines`

> **Note:** Despite being a GET endpoint, this endpoint requires a POST body for pagination and filtering.

## curl

```bash
curl -X GET "{{BASE_URL}}/idp/v1/Iam/GetUserTimelines" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "x-blocks-key: $X_BLOCKS_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "page": 1,
    "pageSize": 20,
    "sort": { "property": "string", "isDescending": false },
    "filter": { "event": "string" }
  }'
```

> **Important:** Even though this is a GET endpoint, a request body is required for pagination and filtering.

## Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| page | integer | Yes | Page number (1-indexed) |
| pageSize | integer | Yes | Number of items per page |
| sort | object | No | Sort configuration |
| sort.property | string | No | Property to sort by |
| sort.isDescending | boolean | No | Sort direction |
| filter | object | No | Filter configuration |
| filter.event | string | No | Filter by event type |

## On Success

**200 OK** — Returns an array of UserTimeline objects:

```json
[
  {
    "itemId": "string",
    "createdDate": "2024-01-01T00:00:00Z",
    "lastUpdatedDate": "2024-01-01T00:00:00Z",
    "createdBy": "string",
    "language": "string",
    "lastUpdatedBy": "string",
    "organizationIds": ["string"],
    "tags": ["string"],
    "currentData": {},
    "event": "string"
  }
]
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
| currentData | object | User schema data |
| event | string | Timeline event type |

## On Failure

| Status | Description |
|--------|-------------|
| 400 Bad Request | Invalid request body |
| 401 Unauthorized | Missing or invalid authentication |
| 403 Forbidden | Insufficient permissions |
| 500 Internal Server Error | Server error |
