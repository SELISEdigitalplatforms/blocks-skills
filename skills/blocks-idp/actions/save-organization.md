# Action: save-organization

## Purpose

Create or update an organization.

---

## Endpoint

```
POST $API_BASE_URL/idp/v1/Iam/SaveOrganization
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Iam/SaveOrganization" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "name": "Organization Name",
    "description": "string",
    "projectKey": "'$X_BLOCKS_KEY'"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| itemId | string | no | Include to update, omit to create |
| name | string | yes | |
| description | string | no | |
| projectKey | string | yes | Use $X_BLOCKS_KEY |

---

## On Success (200)

Organization created or updated.

---

## On Failure

* 401 — run refresh-token then retry
