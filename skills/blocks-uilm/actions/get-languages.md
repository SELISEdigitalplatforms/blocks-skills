# Action: get-languages

## Purpose

List all languages configured for a project.

---

## Endpoint

```
GET {apiUrl}/uilm/v1/Language/Gets?projectKey={projectKey}
```

---

## curl

```bash
curl --location "{apiUrl}/uilm/v1/Language/Gets?projectKey={projectKey}" \
  --header "x-blocks-key: {projectKey}"
```

---

## Query Parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| projectKey | string | yes | Use $PROJECT_KEY |

---

## On Success (200)

```json
// TODO: REPLACE_WITH_ACTUAL_API_TYPES
[
  {
    "itemId": "lang-001",
    "languageName": "English",
    "languageCode": "en",
    "isDefault": true,
    "isRTL": false,
    "projectKey": "proj-001"
  },
  {
    "itemId": "lang-002",
    "languageName": "German",
    "languageCode": "de",
    "isDefault": false,
    "isRTL": false,
    "projectKey": "proj-001"
  }
]
```

> The API returns an **array directly**, not wrapped in `{data}` or `{success: true, data: [...]}`.

---

## On Failure

* 401 — invalid or missing API key — check credentials
