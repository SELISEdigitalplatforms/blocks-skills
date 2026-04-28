# Action: delete-key

## Purpose

Delete a translation key from a module.

---

## Endpoint

```
DELETE {apiUrl}/uilm/v1/Key/Delete?ItemId={itemId}&ProjectKey={projectKey}
```

---

## curl

```bash
curl --location --request DELETE "{apiUrl}/uilm/v1/Key/Delete?ItemId=key-001&ProjectKey={projectKey}" \
  --header "x-blocks-key: {projectKey}"
```

---

## Query Parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| ItemId | string | yes | Use `itemId` from `get-keys` — not `keyId` |
| ProjectKey | string | yes | Use $PROJECT_KEY |

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

* 404 — key not found
* 401 — invalid or missing credentials — check `x-blocks-key` header
