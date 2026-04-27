# Action: get-keys

## Purpose

Get translation keys with filtering and pagination.

---

## Endpoint

```
POST {apiUrl}/uilm/v1/Key/Gets
```

---

## curl

```bash
curl --location "{apiUrl}/uilm/v1/Key/Gets" \
  --header "x-blocks-key: {projectKey}" \
  --header "Content-Type: application/json" \
  --data '{
    "projectKey": "{projectKey}",
    "moduleIds": ["common", "auth"],
    "pageNumber": 1,
    "pageSize": 20,
    "keySearchText": "",
    "isPartiallyTranslated": false
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| projectKey | string | yes | Use $PROJECT_KEY |
| moduleIds | array | yes | Array of module IDs — use `moduleId` from `get-modules`, not `moduleName` |
| pageNumber | integer | yes | Page number (1-indexed) |
| pageSize | integer | yes | Items per page |
| keySearchText | string | no | Text search on key names |
| searchKey | string | no | Additional key filter |
| isPartiallyTranslated | boolean | no | Filter by partial translation status |
| sortProperty | string | no | Sort field name |
| isDescending | boolean | no | Sort direction |
| createDateRange | object | no | `{startDate, endDate}` as ISO date-time |
| lastUpdateDateRange | object | no | `{startDate, endDate}` as ISO date-time |
| resourceSearchFilters | array | no | `[{culture, searchText}]` for filtering by language value |
| projectKey | string | yes | |

---

## On Success (200)

```json
{
  "totalCount": 0,
  "keys": [
    {
      "itemId": "key-001",
      "keyName": "LOGIN_TITLE",
      "moduleId": "auth",
      "resources": [
        { "value": "Welcome Back", "culture": "en", "characterLength": 11 },
        { "value": "Willkommen zurück", "culture": "de", "characterLength": 16 }
      ],
      "routes": ["auth/login"],
      "glossaryIds": [],
      "isPartiallyTranslated": false,
      "isNewKey": false,
      "context": "string",
      "shouldPublish": true,
      "projectKey": "proj-001",
      "lastUpdateDate": "2024-01-01T00:00:00Z",
      "createDate": "2024-01-01T00:00:00Z"
    }
  ]
}
```

> Response uses `keys[]` (not `data[]`). Use `itemId` (not `keyId`). Each key uses `resources[]` with `culture` (language code) and `value`.

---

## On Failure

* 400 — invalid filter parameters
* 401 — invalid or missing credentials — check `x-blocks-key` header
