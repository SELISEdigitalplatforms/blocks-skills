# Action: get-organization-config

## Purpose

Get the configuration settings for a specific organization.

---

## Endpoint

```
GET $API_BASE_URL/idp/v1/Iam/GetOrganizationConfig
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Iam/GetOrganizationConfig?organizationId=ORG_ID" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

---

## Query Parameters

| Param | Type | Required |
|-------|------|----------|
| organizationId | string | yes |

---

## On Success (200)

Returns the configuration object for the specified organization.

---

## On Failure

* 401 — run refresh-token then retry
* 404 — organization not found
