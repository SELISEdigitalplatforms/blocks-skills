# Action: export-uilm

## Purpose

Export translation modules as a downloadable file (ZIP or JSON archive).

---

## Endpoint

```
POST {apiUrl}/uilm/v1/Key/UilmExport
```

---

## curl

```bash
curl --location "{apiUrl}/uilm/v1/Key/UilmExport" \
  --header "x-blocks-key: {projectKey}" \
  --header "Content-Type: application/json" \
  --data '{
    "projectKey": "{projectKey}",
    "appIds": ["common", "auth"],
    "languages": ["en", "de"],
    "outputType": 0,
    "messageCoRelationId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| projectKey | string | yes | Use $PROJECT_KEY |
| appIds | array | yes | Array of module IDs — uses `appIds[]` (not `moduleIds[]`) |
| languages | array | no | Filter by language codes (e.g. `["en", "de"]`) |
| outputType | integer | no | 0=Default, 1-5 for specific formats. Defaults to 0 |
| messageCoRelationId | string | no | UUID for tracking |
| referenceFileId | string | no | Reference file for comparison export |
| callerTenantId | string | no | Tenant context |
| startDate | date-time | no | Filter by creation date range |
| endDate | date-time | no | Filter by creation date range |

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

* 400 — invalid appIds or empty request
* 401 — invalid or missing credentials — check `x-blocks-key` header
