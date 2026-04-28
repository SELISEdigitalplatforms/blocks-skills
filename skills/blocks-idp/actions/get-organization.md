# Action: get-organization

## Purpose

Get a specific organization by ID.

---

## Endpoint

```
GET $API_BASE_URL/idp/v1/Iam/GetOrganization
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Iam/GetOrganization?organizationId=ORG_ID" \
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

Returns full organization object.

---

## On Failure

* 401 — run refresh-token then retry
* 404 — organization not found
