# Action: save-language

## Purpose

Create or update a language for a project. Omit `itemId` to create; include `itemId` to update.

---

## Endpoint

```
POST {apiUrl}/uilm/v1/Language/Save
```

---

## curl

```bash
curl --location "{apiUrl}/uilm/v1/Language/Save" \
  --header "x-blocks-key: {projectKey}" \
  --header "Content-Type: application/json" \
  --data '{
    "languageName": "English",
    "languageCode": "en",
    "isDefault": true,
    "isRTL": false,
    "projectKey": "{projectKey}"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| itemId | string | no | Omit to create, include to update |
| languageName | string | yes | Display name (e.g. "English") |
| languageCode | string | yes | ISO 639-1 language code (e.g. "en") |
| isDefault | boolean | no | Set as default language |
| isRTL | boolean | no | Right-to-left language (e.g. Arabic, Hebrew) |
| projectKey | string | yes | Use $PROJECT_KEY |

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

* 400 — missing required fields or language code already exists
* 401 — invalid or missing API key — check credentials
