# Action: get-organizations

## Purpose

List all organizations.

---

## Endpoint

```
GET $API_BASE_URL/idp/v1/Iam/GetOrganizations
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Iam/GetOrganizations" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

---

## Request Body

None.

---

## On Success (200)

Returns list of organization objects.

---

## On Failure

* 401 — run refresh-token then retry
