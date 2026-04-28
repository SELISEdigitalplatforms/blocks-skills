# Action: translate-key

## Purpose

AI-translate a specific key for a target language.

---

## Endpoint

```
POST {apiUrl}/uilm/v1/Key/TranslateKey
```

---

## curl

```bash
curl --location "{apiUrl}/uilm/v1/Key/TranslateKey" \
  --header "x-blocks-key: {projectKey}" \
  --header "Content-Type: application/json" \
  --data '{
    "keyId": "key-001",
    "messageCoRelationId": "550e8400-e29b-41d4-a716-446655440000",
    "projectKey": "{projectKey}",
    "defaultLanguage": "en"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| keyId | string | yes | `itemId` from `get-keys` |
| messageCoRelationId | string | yes | UUID for tracking — **required** |
| projectKey | string | yes | Use $PROJECT_KEY |
| defaultLanguage | string | yes | Source language code (e.g. "en") |

> All fields are required. `messageCoRelationId` must be a valid UUID. Generate one with `crypto.randomUUID()` or equivalent.

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
* 404 — key not found
* 500 — AI service error — retry the request
* 401 — invalid or missing credentials — check `x-blocks-key` header
