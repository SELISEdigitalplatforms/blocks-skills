# Action: get-key

## Purpose

Get a single translation key by its item ID.

---

## Endpoint

```
GET {apiUrl}/uilm/v1/Key/Get?itemId={itemId}&projectKey={projectKey}
```

---

## curl

```bash
curl --location "{apiUrl}/uilm/v1/Key/Get?itemId=key-001&projectKey={projectKey}" \
  --header "x-blocks-key: {projectKey}"
```

---

## Query Parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| ItemId | string | yes | Use `itemId` from `get-keys` — not `keyId` |
| ProjectKey | string | yes | Use $PROJECT_KEY |

---

## On Success (200)

```json
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
  "context": "Login page heading"
}
```

> Uses `itemId` (not `keyId`). Uses `resources[]` (not `translations[]`).

---

## On Failure

* 404 — key not found
* 401 — invalid or missing credentials — check `x-blocks-key` header
