# Action: get-schemas-aggregation

## Purpose

Retrieves schemas with a summary of access level counts (Public, User, Custom) for Read, Write, Edit, and Delete operations.

---

## Endpoint

```
GET $API_BASE_URL/uds/v1/schemas/aggregation
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/schemas/aggregation?ProjectKey=$X_BLOCKS_KEY&PageNo=1&PageSize=20" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

---

## Query Parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| Keyword | string | no | Search by schema name |
| SchemaName | string | no | Filter by name |
| CollectionName | string | no | Filter by collection |
| ProjectKey | string | yes | Use $X_BLOCKS_KEY |
| SchemaType | integer | no | 1=Entity, 2=Dto |
| PageNo | integer | no | Default: 1 |
| PageSize | integer | no | Default: 20 |
| SortBy | string | no | Sort field |
| SortDescending | boolean | no | Sort direction |

---

## On Success (200)

```json
{
  "isSuccess": true,
  "message": "string",
  "httpStatusCode": 200,
  "data": {
    "schemas": {
      "totalCount": 5,
      "items": [{ "id": "schema-id", "schemaName": "Product", "schemaType": 1 }]
    },
    "aggregation": {
      "read": { "public": 2, "user": 1, "custom": 2 },
      "write": { "public": 1, "user": 1, "custom": 3 },
      "edit": { "public": 1, "user": 1, "custom": 3 },
      "delete": { "public": 1, "user": 1, "custom": 3 },
      "totalPublicPermission": 5,
      "totalUserPermission": 4,
      "totalCustomPermission": 11
    }
  },
  "errors": []
}
```

---

## On Failure

| Status | Cause | Action |
|--------|-------|--------|
| 401 | Invalid token | Provide a valid ACCESS_TOKEN |
| 500 | Internal Server Error | Retry or contact support |
