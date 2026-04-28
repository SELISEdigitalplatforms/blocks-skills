# Action: save-keys

## Purpose

Batch create or update multiple translation keys at once.

---

## Endpoint

```
POST {apiUrl}/uilm/v1/Key/SaveKeys
```

---

## curl

```bash
curl --location "{apiUrl}/uilm/v1/Key/SaveKeys" \
  --header "x-blocks-key: {projectKey}" \
  --header "Content-Type: application/json" \
  --data '{
    "projectKey": "{projectKey}",
    "moduleId": "auth",
    "keys": [
      {
        "keyName": "LOGIN_TITLE",
        "resources": [
          { "value": "Welcome Back", "culture": "en", "characterLength": 11 },
          { "value": "Willkommen zurück", "culture": "de", "characterLength": 16 }
        ]
      },
      {
        "keyName": "LOGIN_SUBMIT",
        "resources": [
          { "value": "Sign In", "culture": "en", "characterLength": 6 },
          { "value": "Anmelden", "culture": "de", "characterLength": 8 }
        ]
      }
    ]
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| projectKey | string | yes | Use $PROJECT_KEY |
| moduleId | string | yes | Use `moduleId` from `get-modules` — not `moduleName` |
| keys | array | yes | Array of key objects |

Each key object:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| itemId | string | no | Omit to create, include to update |
| keyName | string | yes | `SCREAMING_SNAKE_CASE` naming |
| resources | array | no | Array of `{value, culture, characterLength}` — not `{languageCode, value}` |

---

## On Success (200)

```json
{
  "success": true,
  "errorMessage": null,
  "validationErrors": []
}
```

---

## On Failure

* 400 — missing required fields
* 401 — invalid or missing credentials — check `x-blocks-key` header
