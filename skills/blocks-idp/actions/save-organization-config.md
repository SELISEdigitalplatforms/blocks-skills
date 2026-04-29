# Action: save-organization-config

## Purpose

Save configuration settings for a specific organization.

---

## Endpoint

```
POST $API_BASE_URL/idp/v1/Iam/SaveOrganizationConfig
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Iam/SaveOrganizationConfig" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "organizationId": "ORG_ID",
    "projectKey": "'$X_BLOCKS_KEY'"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| organizationId | string | yes | Target organization ID |
| projectKey | string | yes | Use $X_BLOCKS_KEY |

---

## On Success (200)

Organization configuration saved.

---

## On Failure

* 401 — run refresh-token then retry
* 404 — organization not found
