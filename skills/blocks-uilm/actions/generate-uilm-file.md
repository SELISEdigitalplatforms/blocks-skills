# Action: generate-uilm-file

## Purpose

Regenerate the compiled translation file for a specific module. Must be called before `get-uilm-file` if the file hasn't been generated yet.

---

## Endpoint

```
POST {apiUrl}/uilm/v1/Key/GenerateUilmFile
```

---

## curl

```bash
curl --location "{apiUrl}/uilm/v1/Key/GenerateUilmFile" \
  --header "x-blocks-key: {projectKey}" \
  --header "Content-Type: application/json" \
  --data '{
    "projectKey": "{projectKey}",
    "moduleId": "common",
    "guid": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| projectKey | string | yes | Use $PROJECT_KEY |
| moduleId | string | yes | Use `moduleId` from `get-modules` — not `moduleName` |
| guid | string | no | UUID for tracking. Server generates one if omitted |

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

* 400 — invalid module ID
* 401 — invalid or missing credentials — check `x-blocks-key` header
