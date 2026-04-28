# Action: rollback-key

## Purpose

Revert a key to a previous state from its edit timeline.

---

## Endpoint

```
POST {apiUrl}/uilm/v1/Key/RollBack
```

---

## curl

```bash
curl --location "{apiUrl}/uilm/v1/Key/RollBack" \
  --header "x-blocks-key: {projectKey}" \
  --header "Content-Type: application/json" \
  --data '{
    "itemId": "key-001",
    "projectKey": "{projectKey}"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| itemId | string | yes | `itemId` of the key to rollback |
| projectKey | string | yes | Use $PROJECT_KEY |

> The Swagger only defines `itemId` and `projectKey`. The rollback target is determined by prior timeline state — use `get-key-timeline` to inspect which state to restore.

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
* 400 — invalid itemId
* 401 — invalid or missing credentials — check `x-blocks-key` header
