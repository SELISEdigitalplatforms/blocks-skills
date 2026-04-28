# Action: delete-language

## Purpose

Delete a language from a project.

---

## Endpoint

```
DELETE {apiUrl}/uilm/v1/Language/Delete?LanguageName={name}&ProjectKey={projectKey}
```

---

## curl

```bash
curl --location --request DELETE "{apiUrl}/uilm/v1/Language/Delete?LanguageName=English&ProjectKey={projectKey}" \
  --header "x-blocks-key: {projectKey}"
```

---

## Query Parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| LanguageName | string | yes | The `languageName` from `get-languages` — **not** `itemId` |
| ProjectKey | string | yes | Use $PROJECT_KEY |

> Uses `LanguageName` (query param, PascalCase) — **not** `itemId`. This differs from most other delete endpoints.

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

* 400 — language not found or in use
* 401 — invalid or missing credentials — check `x-blocks-key` header
