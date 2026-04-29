# Action: get-resource-groups

## Purpose

List all resource groups available in the project.

---

## Endpoint

```
GET $API_BASE_URL/idp/v1/Iam/GetResourceGroups
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Iam/GetResourceGroups" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

---

## Request Body

None.

---

## On Success (200)

Returns array of resource group objects. Use these when creating permissions.

---

## On Failure

* 401 — run refresh-token then retry
