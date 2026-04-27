# Action: get-generation-history

## Purpose

View the history of compiled UILM file generations.

---

## Endpoint

```
GET {apiUrl}/uilm/v1/Key/GetLanguageFileGenerationHistory?projectKey={projectKey}&pageNumber={page}&pageSize={size}
```

---

## curl

```bash
curl --location "{apiUrl}/uilm/v1/Key/GetLanguageFileGenerationHistory?projectKey={projectKey}&pageNumber=1&pageSize=10" \
  --header "x-blocks-key: {projectKey}"
```

---

## Query Parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| ProjectKey | string | yes | Use $PROJECT_KEY |
| PageNumber | integer | yes | Page number (1-indexed) |
| PageSize | integer | yes | Items per page |

---

## On Success (200)

> Response schema not fully documented in Swagger. Expect a paginated response with generation history entries.

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
