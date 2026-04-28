# Action: get-modules

## Purpose

List all translation modules for a project.

---

## Endpoint

```
GET {apiUrl}/uilm/v1/Module/Gets?projectKey={projectKey}
```

---

## curl

```bash
curl --location "{apiUrl}/uilm/v1/Module/Gets?projectKey={projectKey}" \
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
    "itemId": "mod-001",
    "moduleName": "common",
    "createDate": "2024-01-01T00:00:00Z",
    "lastUpdateDate": "2024-01-15T00:00:00Z",
    "tenantId": "tenant-001"
  },
  {
    "itemId": "mod-002",
    "moduleName": "home",
    "createDate": "2024-01-01T00:00:00Z",
    "lastUpdateDate": "2024-01-15T00:00:00Z",
    "tenantId": "tenant-001"
  }
]
```

> The API returns an **array directly**, not wrapped in `{data}`.

---

## On Failure

* 401 — invalid or missing API key — check credentials
