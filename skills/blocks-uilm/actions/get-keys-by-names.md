# Action: get-keys-by-names

## Purpose

Get multiple keys by their names in a single request without pagination or filtering.

---

## Endpoint

```
POST {apiUrl}/uilm/v1/Key/GetsByKeyNames
```

---

## curl

```bash
curl --location "{apiUrl}/uilm/v1/Key/GetsByKeyNames" \
  --header "x-blocks-key: {projectKey}" \
  --header "Content-Type: application/json" \
  --data '{
    "projectKey": "{projectKey}",
    "moduleId": "common",
    "keyNames": ["NAV_HOME", "NAV_ABOUT", "BTN_SUBMIT"]
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| projectKey | string | yes | Use $PROJECT_KEY |
| moduleId | string | yes | Use `moduleId` from `get-modules` — not `moduleName` |
| keyNames | array | yes | Array of key name strings |

---

## On Success (200)

```json
{
  "keys": [
    {
      "itemId": "key-001",
      "keyName": "NAV_HOME",
      "moduleId": "common",
      "resources": [
        { "value": "Home", "culture": "en", "characterLength": 4 }
      ],
      "routes": [],
      "glossaryIds": [],
      "isPartiallyTranslated": false,
      "context": null
    }
  ],
  "errorMessage": null
}
```

> Response uses `keys[]`. Uses `moduleId` and `resources[]` (not `translations[]`).

---

## On Failure

* 400 — missing required fields
* 401 — invalid or missing credentials — check `x-blocks-key` header
