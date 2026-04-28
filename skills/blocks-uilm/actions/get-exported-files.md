# Action: get-exported-files

## Purpose

List previously exported UILM files with download URLs.

---

## Endpoint

```
GET {apiUrl}/uilm/v1/Key/GetUilmExportedFiles?projectKey={projectKey}&pageNumber={page}&pageSize={size}
```

---

## curl

```bash
curl --location "{apiUrl}/uilm/v1/Key/GetUilmExportedFiles?projectKey={projectKey}&pageNumber=1&pageSize=10" \
  --header "x-blocks-key: {projectKey}"
```

---

## Query Parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| ProjectKey | string | yes | Use $PROJECT_KEY |
| PageNumber | integer | yes | Page number (1-indexed) |
| PageSize | integer | yes | Items per page |
| SearchText | string | no | Filter by filename |
| CreateDateRange.StartDate | date-time | no | Filter by creation date |
| CreateDateRange.EndDate | date-time | no | Filter by creation date |

---

## On Success (200)

> Response schema not fully documented in Swagger. Expect a paginated response with file entries.

```json
// TODO: CONFIRM_ACTUAL_RESPONSE
{
  "success": true,
  "errorMessage": null,
  "validationErrors": []
}
```

---

## On Failure

* 401 — invalid or missing credentials — check `x-blocks-key` header
