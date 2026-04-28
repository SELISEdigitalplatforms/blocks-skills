# Action: get-roles

## Purpose

List roles with pagination, sorting, and filtering.

---

## Endpoint

```
POST $API_BASE_URL/idp/v1/Iam/GetRoles
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Iam/GetRoles" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "page": 1,
    "pageSize": 20,
    "sort": {
      "property": "name",
      "isDescending": false
    },
    "filter": {
      "search": ""
    },
    "projectKey": "'$X_BLOCKS_KEY'"
  }'
```

---

## Request Body

| Field | Type | Required |
|-------|------|----------|
| page | integer | yes |
| pageSize | integer | yes |
| sort.property | string | no |
| sort.isDescending | boolean | no |
| filter.search | string | no |
| projectKey | string | yes |

---

## Pagination

* `page` starts at 1
* `pageSize` max is 100, default is 20
* Results ordered by `sort.field` — common values: `name`, `createdDate`

---

## On Success (200)

Returns paginated list of roles.

---

## On Failure

* 401 — run refresh-token then retry
