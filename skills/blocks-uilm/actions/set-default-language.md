# Action: set-default-language

## Purpose

Set the default language for a project. The default language is used as the fallback when a translation key is missing.

---

## Endpoint

```
POST {apiUrl}/uilm/v1/Language/SetDefault
```

---

## curl

```bash
curl --location "{apiUrl}/uilm/v1/Language/SetDefault" \
  --header "x-blocks-key: {projectKey}" \
  --header "Content-Type: application/json" \
  --data '{
    "languageName": "English",
    "projectKey": "{projectKey}"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| languageName | string | yes | The `languageName` from `get-languages` |
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

* 400 — language not found
* 401 — invalid or missing credentials — check `x-blocks-key` header
