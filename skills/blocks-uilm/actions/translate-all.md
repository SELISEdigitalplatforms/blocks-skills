# Action: translate-all

## Purpose

AI-translate all untranslated keys in a module for all configured languages.

---

## Endpoint

```
POST {apiUrl}/uilm/v1/Key/TranslateAll
```

---

## curl

```bash
curl --location "{apiUrl}/uilm/v1/Key/TranslateAll" \
  --header "x-blocks-key: {projectKey}" \
  --header "Content-Type: application/json" \
  --data '{
    "moduleId": "auth",
    "messageCoRelationId": "550e8400-e29b-41d4-a716-446655440000",
    "projectKey": "{projectKey}",
    "defaultLanguage": "en"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| projectKey | string | yes | Use $PROJECT_KEY |
| moduleId | string | yes | Use `moduleId` from `get-modules` — not `moduleName` |
| defaultLanguage | string | yes | Source language code (e.g. "en") |
| messageCoRelationId | string | yes | UUID for tracking this translation job |

> Generate a new UUID for each request. Use `messageCoRelationId` (not `correlationId` or `jobId`).

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

* 400 — no untranslated keys found, or module not found
* 500 — AI service error — retry the request
* 401 — invalid or missing credentials — check `x-blocks-key` header
