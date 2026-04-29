# Action: get-users

## Purpose

List users with pagination, sorting, and filtering.

---

## Endpoint

```
POST $API_BASE_URL/idp/v1/Iam/GetUsers
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Iam/GetUsers" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "page": 1,
    "pageSize": 20,
    "sort": {
      "property": "createdDate",
      "isDescending": true
    },
    "filter": {
      "name": "",
      "email": ""
    },
    "projectKey": "'$X_BLOCKS_KEY'"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| page | integer | yes | Starts at 1 |
| pageSize | integer | yes | Number of results per page |
| sort.property | string | no | Field to sort by (e.g. `createdDate`, `email`, `firstName`) |
| sort.isDescending | boolean | no | `true` for descending, `false` for ascending |
| filter.name | string | no | Filter by name |
| filter.email | string | no | Filter by email |
| filter.userIds | array | no | Filter by specific user IDs |
| filter.status | string | no | Filter by status (Active, Inactive) |
| filter.organizationId | string | no | Filter by organization |
| filter.joinedOn | date-time | no | Filter by join date (ISO 8601) |
| filter.lastLogin | date-time | no | Filter by last login date (ISO 8601) |
| projectKey | string | yes | Use $X_BLOCKS_KEY |

---

## Pagination

* `page` starts at 1
* `pageSize` max is 100, default is 20
* Results ordered by `sort.field` — common values: `createdDate`, `email`, `firstName`

---

## On Success (200)

Returns paginated list of users with total count.

### Sample Response

```json
{
  "data": [
    {
      "userId": "string",
      "email": "user@example.com",
      "userName": "string",
      "firstName": "string",
      "lastName": "string",
      "phoneNumber": "string",
      "status": "Active",
      "mfaEnabled": false,
      "createdDate": "2024-01-01T00:00:00Z"
    }
  ],
  "totalCount": 100,
  "errors": [],
  "isSuccess": true
}
```

---

## On Failure

* 401 — run refresh-token then retry
