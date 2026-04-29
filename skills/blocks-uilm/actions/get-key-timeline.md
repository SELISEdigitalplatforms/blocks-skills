# Action: get-key-timeline

## Purpose

Get the edit history (timeline) for a translation key, including all previous values and operation snapshots.

---

## Endpoint

```
GET {apiUrl}/uilm/v1/Key/GetTimeline?entityId={itemId}&pageNumber={page}&pageSize={size}&projectKey={projectKey}
```

---

## curl

```bash
curl --location "{apiUrl}/uilm/v1/Key/GetTimeline?entityId=key-001&pageNumber=1&pageSize=20&projectKey={projectKey}" \
  --header "x-blocks-key: {projectKey}"
```

---

## Query Parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| PageSize | integer | yes | Items per page |
| PageNumber | integer | yes | Page number (1-indexed) |
| EntityId | string | yes | Use `itemId` from `get-keys` — not `keyId` |
| UserId | string | no | Filter by user ID |
| CreateDateRange.StartDate | date-time | no | ISO date-time |
| CreateDateRange.EndDate | date-time | no | ISO date-time |
| SortProperty | string | no | Field to sort by |
| IsDescending | boolean | no | Sort direction |
| ProjectKey | string | yes | Use $PROJECT_KEY |

---

## On Success (200)

```json
{
  "totalCount": 2,
  "timelines": [
    {
      "itemId": "tl-003",
      "entityId": "key-001",
      "createDate": "2024-01-15T10:30:00Z",
      "lastUpdateDate": "2024-01-15T10:30:00Z",
      "currentData": {
        "itemId": "key-001",
        "keyName": "LOGIN_TITLE",
        "moduleId": "auth",
        "value": "Welcome Back",
        "resources": [
          { "value": "Welcome Back", "culture": "en", "characterLength": 11 },
          { "value": "Willkommen zurück", "culture": "de", "characterLength": 16 }
        ],
        "isPartiallyTranslated": false
      },
      "previousData": {
        "itemId": "key-001",
        "keyName": "LOGIN_TITLE",
        "moduleId": "auth",
        "value": "Welcome",
        "resources": [
          { "value": "Welcome", "culture": "en", "characterLength": 7 }
        ],
        "isPartiallyTranslated": false
      },
      "logFrom": "string",
      "userId": "user-001",
      "rollbackFrom": "string",
      "userName": "user@example.com",
      "operationId": "op-001"
    }
  ]
}
```

> Response uses `timelines[]` (not `data[]`). Each entry contains full `currentData` and `previousData` snapshots as `BlocksLanguageKey` objects. Uses `entityId` (the key's `itemId`) to identify the key.

---

## On Failure

* 404 — key not found
* 401 — invalid or missing credentials — check `x-blocks-key` header
