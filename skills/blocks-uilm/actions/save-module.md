# Action: save-module

## Purpose

Create or update a translation module. Omit `moduleId` to create; include `moduleId` to update.

---

## Endpoint

```
POST {apiUrl}/uilm/v1/Module/Save
```

---

## curl

```bash
curl --location "{apiUrl}/uilm/v1/Module/Save" \
  --header "x-blocks-key: {projectKey}" \
  --header "Content-Type: application/json" \
  --data '{
    "moduleName": "common",
    "projectKey": "{projectKey}"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| moduleId | string | no | Omit to create, include to update |
| moduleName | string | yes | Use `moduleName` (not `name`) |
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

* 400 — missing required fields or module name already exists
* 401 — invalid or missing API key — check credentials
