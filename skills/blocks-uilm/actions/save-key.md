# Action: save-key

## Purpose

Create or update a single translation key. Omit `itemId` to create; include `itemId` to update.

---

## Endpoint

```
POST {apiUrl}/uilm/v1/Key/Save
```

---

## curl

```bash
curl --location "{apiUrl}/uilm/v1/Key/Save" \
  --header "x-blocks-key: {projectKey}" \
  --header "Content-Type: application/json" \
  --data '{
    "keyName": "LOGIN_TITLE",
    "moduleId": "auth",
    "projectKey": "{projectKey}",
    "resources": [
      { "value": "Welcome Back", "culture": "en", "characterLength": 11 },
      { "value": "Willkommen zurück", "culture": "de", "characterLength": 16 }
    ]
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| itemId | string | no | Omit to create, include to update |
| keyName | string | yes | Use `SCREAMING_SNAKE_CASE` naming |
| moduleId | string | yes | Use `moduleId` from `get-modules` — not `moduleName` |
| projectKey | string | yes | Use $PROJECT_KEY |
| resources | array | no | Array of `{value, culture, characterLength}` — not `{languageCode, value}` |
| isNewKey | boolean | no | Set `true` for newly created keys |
| shouldPublish | boolean | no | Whether to publish after saving |
| context | string | no | Context description for translators |

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

* 400 — missing required fields or key name already exists in this module
* 401 — invalid or missing credentials — check `x-blocks-key` header
