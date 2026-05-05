# Action: get-schemas

## Purpose

Retrieves a paginated list of all schema definitions for the project.

---

## Endpoint

```
GET $API_BASE_URL/uds/v1/schemas
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/schemas?ProjectKey=$X_BLOCKS_KEY&PageNo=1&PageSize=20" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

---

## Query Parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| Keyword | string | no | Search by schema name |
| SchemaName | string | no | Filter by schema name |
| CollectionName | string | no | Filter by collection name |
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
    "totalCount": 5,
    "items": [
      {
        "id": "schema-id-1",
        "schemaName": "Product",
        "collectionName": "products",
        "schemaType": 1,
        "projectKey": "my-project"
      }
    ]
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
