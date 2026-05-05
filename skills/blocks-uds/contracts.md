# Data Management Contracts

## Common Headers

```
Authorization: Bearer $ACCESS_TOKEN
x-blocks-key: $X_BLOCKS_KEY
Content-Type: application/json
```

> For multipart file uploads, omit `Content-Type` — let the HTTP client set it with the correct boundary.

## Response Envelope: UdsResponse

```json
{
  "isSuccess": true,
  "message": "string",
  "httpStatusCode": 200,
  "data": {},
  "errors": []
}
```

> `data` contains the actual payload. `errors` is an array of `ValidationFailure` objects. `message` is human-readable. Always check `isSuccess`.

## Naming Convention

> All request body fields use **PascalCase** — this API is backed by C#/.NET.
> Do NOT use camelCase in request bodies.

## Critical Field Name Corrections

| Wrong (don't use) | Correct (use this) | Context |
|-------------------|-------------------|---------|
| `ConnectionString` | `dbConnectionString` | DataSourceResponse field |
| `fields` in `save-schema-fields` body | `schemaDefinitionItemId`, `fields` | SaveFieldDefinitionRequest |
| `Name`, `ParentDirectoryId`, `ProjectKey` | Full `CreateFolderRequest` shape | create-folder |
| `accessLevel` as string | `SchemaAccessLevel` integer enum | change-security |
| `operation` as string | `PolicyOperation` integer enum | access policies |
| `type` as string for validation | `ValidationType` integer enum | validations |
| `data.uploadUrl` | direct `uploadUrl` | get-presigned-upload-url response |
| `POST ?fileId=...` | POST body `DeleteFileRequest` | delete-file |

---

## Schema Endpoints

### DefineSchemaRequest (POST /schemas/define)

```json
{
  "collectionName": "string",
  "schemaName": "string",
  "projectKey": "string",
  "schemaType": 1,
  "description": "string",
  "fields": [
    {
      "name": "string",
      "type": "String | Number | Boolean | Date | ObjectId | Object | Array",
      "isArray": false,
      "isPIIData": false,
      "isUniqueData": false,
      "description": "string"
    }
  ]
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| collectionName | string | yes | MongoDB collection name — lowercase, no spaces |
| schemaName | string | yes | Display name for the schema |
| projectKey | string | yes | **Use `$X_BLOCKS_KEY` value, NOT `$PROJECT_SLUG`** |
| schemaType | integer | yes | `1` = Entity (collection), `2` = Dto (single object) |
| description | string | no | Optional description |
| projectShortKey | string | no | Short key for the project |
| fields | array | yes | At least one field required |

### SaveSchemaFieldsRequest (POST /schemas/fields)

```json
{
  "schemaDefinitionItemId": "string",
  "deletableFieldNames": ["string"],
  "projectShortKey": "string",
  "fields": [
    {
      "name": "string",
      "type": "string",
      "isArray": false,
      "isPIIData": false,
      "isUniqueData": false,
      "description": "string"
    }
  ],
  "projectKey": "string"
}
```

> **WARNING:** `save-schema-fields` REPLACES all fields. Provide the complete field list. Use `deletableFieldNames` to remove specific fields.

### UpdateSchemaDefinitionRequest (PUT /schemas/define)

```json
{
  "collectionName": "string",
  "schemaName": "string",
  "projectKey": "string",
  "schemaType": 1,
  "projectShortKey": "string",
  "fields": [{...}],
  "itemId": "string"
}
```

### GetSchemaInfoResponse (GET /schemas/info)

Lists all Entity-type schema collections (display name + collection name).

```
GET /schemas/info?projectKey=...
```

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| projectKey | string | yes | `$X_BLOCKS_KEY` |

```json
{
  "isSuccess": true,
  "data": {
    "collections": [
      { "name": "string", "collectionName": "string", "description": "string", "type": "Entity" }
    ]
  }
}
```

### SaveSchemaInfoRequest (POST /schemas/info)

Creates a new schema with fields. REPLACES all existing fields.

```
POST /schemas/info
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| collectionName | string | yes | MongoDB collection name |
| schemaName | string | yes | Display name |
| projectKey | string | yes | `$X_BLOCKS_KEY` |
| schemaType | integer | no | `1`=Entity, `2`=Dto |
| fields | array | yes | Complete field list |

### UpdateSchemaInfoRequest (PUT /schemas/info)

Updates existing schema metadata. To update fields, use `SaveSchemaFieldsRequest`.

```
PUT /schemas/info
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| collectionName | string | no | Updated collection name |
| schemaName | string | no | Updated display name |
| projectKey | string | yes | `$X_BLOCKS_KEY` |
| schemaType | integer | no | `1`=Entity, `2`=Dto |
| itemId | string | yes | Schema ID |

### GetSchemaByIdResponse (GET /schemas/{id})

Retrieves a schema by its ID.

```
GET /schemas/{id}?projectKey=...
```

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| id | path | yes | Schema ID |
| projectKey | query | yes | `$X_BLOCKS_KEY` |

### DeleteSchemaByIdRequest (DELETE /schemas/{id})

Deletes a schema by its ID.

```
DELETE /schemas/{id}?projectKey=...
```

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| id | path | yes | Schema ID |
| projectKey | query | yes | `$X_BLOCKS_KEY` |

### GetSchemaUnadaptedChangesResponse (GET /schemas/unadapted-changes)

Returns pending schema changes that have not been applied to the GraphQL schema.

```
GET /schemas/unadapted-changes?projectKey=...
```

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| projectKey | string | yes | `$X_BLOCKS_KEY` |

```json
{
  "isSuccess": true,
  "data": [
    {
      "schemaId": "string",
      "schemaName": "string",
      "collectionName": "string",
      "changes": [
        { "fieldName": "string", "changeType": "string", "description": "string" }
      ]
    }
  ]
}
```

### UpdateSchemaDefinitionRequest (PUT /schemas/define)

```json
{
  "collectionName": "string",
  "schemaName": "string",
  "projectKey": "string",
  "schemaType": 1,
  "projectShortKey": "string",
  "fields": [{...}],
  "itemId": "string"
}
```

### GetSchemasParams

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| Keyword | string | no | Search by schema name |
| SchemaName | string | no | Filter by name |
| CollectionName | string | no | Filter by collection |
| ProjectKey | string | yes | `$X_BLOCKS_KEY` |
| SchemaType | integer | no | `1`=Entity, `2`=Dto |
| PageNo | integer | no | Default: 1 |
| PageSize | integer | no | Default: 20 |
| SortBy | string | no | Field to sort by |
| SortDescending | boolean | no | Sort direction |

### SchemaType Enum

| Value | Name | Description |
|-------|------|-------------|
| 1 | Entity | Multi-document MongoDB collection |
| 2 | Dto | Single config object, no backing collection |

---

## DataSource

### CreateDataSourceRequest (POST /data-sources/add)

```json
{
  "itemId": "string",
  "connectionString": "string",
  "databaseName": "string",
  "projectKey": "string"
}
```

### UpdateDataSourceRequest (PUT /data-sources/update)

```json
{
  "itemId": "string",
  "connectionString": "string",
  "databaseName": "string",
  "projectKey": "string",
  "isActive": true
}
```

### DataSourceResponse

```json
{
  "dbConnectionString": "string",
  "databaseName": "string",
  "projectKey": "string",
  "projectShortKey": "string",
  "isActive": true,
  "itemId": "string"
}
```

---

## DataAccess

### ConfigureSchemaSecurityRequest (POST /data-access/security/change)

```json
{
  "projectKey": "string",
  "schemaId": "string",
  "operation": 0,
  "policyType": 0,
  "fieldNames": ["string"],
  "accessLevel": 0
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| projectKey | string | yes | `$X_BLOCKS_KEY` |
| schemaId | string | yes | Schema ID from define-schema |
| operation | integer | no | PolicyOperation enum |
| policyType | integer | no | PolicyType enum |
| fieldNames | array | no | Field-level security |
| accessLevel | integer | yes | SchemaAccessLevel enum |

### SchemaAccessLevel Enum

| Value | Name | Description |
|-------|------|-------------|
| 0 | Public | Open access — anyone can read/write |
| 1 | User | Authenticated users only |
| 2 | Custom | Access controlled by policies |
| 3 | (reserved) | Reserved |

### PolicyOperation Enum

| Value | Name | Description |
|-------|------|-------------|
| 0 | Read | Can query / read documents |
| 1 | Create | Can insert new documents |
| 2 | Update | Can modify existing documents |
| 3 | Delete | Can remove documents |
| 4 | All | Full access |

### PolicyType Enum

| Value | Name | Description |
|-------|------|-------------|
| 0 | RoleBased | Access granted by role |
| 1 | ClaimBased | Access granted by claim |

### CreateDataAccessPolicyRequest (POST /data-access/policy/create)

```json
{
  "policyName": "string",
  "policyDescription": "string",
  "policyType": 0,
  "operation": 0,
  "schemaName": "string",
  "schemaId": "string",
  "fieldNames": ["string"],
  "projectKey": "string",
  "ruleGroup": {
    "logicalOperator": 0,
    "rules": [
      {
        "leftSource": 0,
        "leftOperand": "string",
        "operator": 0,
        "rightSource": 0,
        "rightOperand": "string",
        "staticValue": "any",
        "description": "string"
      }
    ],
    "nestedGroups": [{}]
  },
  "priority": 1,
  "isAllowPolicy": true
}
```

### PolicyLogicalOperator Enum

| Value | Name | Description |
|-------|------|-------------|
| 0 | And | All rules must match |
| 1 | Or | Any rule can match |

### ConditionSource Enum

| Value | Name | Description |
|-------|------|-------------|
| 0 | Static | Use staticValue |
| 1 | Context | E.g. user role from auth context |
| 2 | Field | Compare against a field value |

### PolicyOperator Enum

| Value | Name | Description |
|-------|------|-------------|
| 0 | Equals | Exact match |
| 1 | NotEquals | Not equal |
| 2 | Contains | String contains |
| 3 | In | Value in list |
| 4-14 | (various) | See Swagger for full list |

---

## DataValidation

### CreateDataValidationRequest (POST /data-validations)

```json
{
  "projectKey": "string",
  "schemaId": "string",
  "fieldName": "string",
  "validations": [
    {
      "type": 0,
      "value": null,
      "secondaryValue": null,
      "errorMessage": "string",
      "isActive": true
    }
  ]
}
```

### ValidationType Enum

| Value | Name | Description |
|-------|------|-------------|
| 0 | Required | Field must be present and non-empty |
| 1 | Email | Must be valid email format |
| 2 | Min | Minimum numeric value |
| 3 | Max | Maximum numeric value |
| 4 | MinLength | Minimum string length |
| 5 | MaxLength | Maximum string length |
| 6 | Regex | Must match regex pattern |
| 7 | Unique | Must be unique across collection |
| 8 | Pattern | Additional pattern validation |
| 9 | Custom | Custom validation rule |
| 10 | Range | Value must be within range |
| 11 | (reserved) | Reserved for future use |

---

## Files

### GetPreSignedUrlForUploadRequest (POST /Files/GetPreSignedUrlForUpload)

```json
{
  "itemId": "string",
  "metaData": "string",
  "name": "string",
  "parentDirectoryId": "string",
  "tags": "string",
  "accessModifier": "string",
  "configurationName": "string",
  "projectKey": "string",
  "moduleName": 1,
  "additionalProperties": {}
}
```

### GetPreSignedUrlForUploadResponse

> **NOTE:** This is a DIRECT response, NOT wrapped in `data`.

```json
{
  "errors": {},
  "isSuccess": true,
  "uploadUrl": "https://s3.amazonaws.com/...",
  "fileId": "string"
}
```

### DeleteFileRequest (POST /Files/DeleteFile)

```json
{
  "fileId": "string",
  "configurationName": "string",
  "projectKey": "string",
  "eventQueueName": "string"
}
```

> **NOTE:** This is a POST with JSON body, NOT query parameters.

### CreateFolderRequest (POST /Files/CreateFolder)

```json
{
  "userId": "string",
  "itemId": "string",
  "artifactName": "string",
  "configurationName": "string",
  "description": "string",
  "parentId": "string",
  "dmsWorkspaceId": "string",
  "dmsWorkspaceName": "string",
  "tags": ["string"],
  "metaData": {},
  "organizationId": "string",
  "fileStorageId": "string",
  "projectKey": "string"
}
```

### GetDmsFileAndFolderRequest (POST /Files/GetDmsFileAndFolder)

```json
{
  "parentId": "string",
  "configurationName": "string",
  "projectKey": "string",
  "searchKey": "string",
  "moduleName": "string",
  "skip": 0,
  "take": 20
}
```

### UploadToDmsRequest (POST /Files/UploadFile)

```json
{
  "upload": [
    {
      "userId": "string",
      "itemId": "string",
      "artifactName": "string",
      "configurationName": "string",
      "description": "string",
      "parentId": "string",
      "dmsWorkspaceId": "string",
      "dmsWorkspaceName": "string",
      "tags": ["string"],
      "metaData": [{"type": "string", "value": "string"}],
      "organizationId": "string",
      "fileStorageId": "string"
    }
  ],
  "projectKey": "string"
}
```

### UpdateFileRequest (POST /Files/updateFileAdditionalInfo)

```json
{
  "itemId": "string",
  "additionalProperties": {},
  "projectKey": "string"
}
```

---

## Configuration

### ReloadConfiguration (POST /configurations/reload?projectKey=...)

No request body. The project is identified from the `projectKey` query parameter.

---

## DataManage

### GetMockData (GET /data-manage/mock-data?projectKey=...)

No request body.

### DeleteMockDataRequest (POST /data-manage/mock-data)

```json
{
  "projectKey": "string",
  "schemaNames": ["string"]
}
```

---

## SchemaExchange

### ExportSchemaRequest (POST /schema-exchange/export)

```json
{
  "projectKey": "string",
  "messageCoRelationId": "uuid-string",
  "exportOption": 0
}
```

### SchemaExportOption Enum

| Value | Name | Description |
|-------|------|-------------|
| 0 | Schema | Export schema definitions only |
| 1 | AccessPolicies | Export access policies only |
| 2 | ValidationRules | Export validation rules only |
| 3 | All | Export everything |

### ImportSchemaRequest (POST /schema-exchange/import)

```json
{
  "projectKey": "string",
  "fileId": "string",
  "messageCoRelationId": "uuid-string"
}
```

---

## Deployment

### GetPipeline (GET /deployment/pipeline?projectKey=...)

No request body.

---

## GraphQL Data Access

All data CRUD goes through the GraphQL gateway:

```
POST $API_BASE_URL/uds/v1/$PROJECT_SLUG/gateway
```

Headers:
```
Authorization: Bearer $ACCESS_TOKEN
x-blocks-key: $X_BLOCKS_KEY
Content-Type: application/json
```

> **IMPORTANT:** `$PROJECT_SLUG` is part of the URL **path**, not a query parameter.

### Query naming convention

| Operation | GraphQL name | Example |
|-----------|-------------|---------|
| List | `get{Name}s` | `getProducts` |
| Get by ID | `get{Name}` | `getProduct(id: "...")` |
| Create | `create{Name}` | `createProduct(input: {...})` |
| Update | `update{Name}` | `updateProduct(id: "...", input: {...})` |
| Delete | `delete{Name}` | `deleteProduct(id: "...")` |

### Example: Query list

```bash
curl --location "$API_BASE_URL/uds/v1/$PROJECT_SLUG/gateway" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "query": "query { getProducts(page: 1, pageSize: 20) { items { _id name price } totalCount } }"
  }'
```

### Example: Create

```bash
curl --location "$API_BASE_URL/uds/v1/$PROJECT_SLUG/gateway" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "query": "mutation { createProduct(input: { name: \"Widget\", price: 9.99 }) { _id name price } }"
  }'
```

### GraphQL security behavior

| Schema security | Who can query/mutate |
|----------------|----------------------|
| Public (accessLevel=0) | Anyone — no token required for reads |
| User (accessLevel=1) | Any authenticated user |
| Custom (accessLevel=2) | Only roles in access policies for the operation |

---

## AccessModifier Enum

| Value | Name | Description |
|-------|------|-------------|
| 0 | (reserved) | — |
| 1 | (reserved) | — |
| 2 | Public | Accessible without authentication |
| 3 | Private | Requires authentication |

---

## Severity Enum

| Value | Name | Description |
|-------|------|-------------|
| 0 | Error | Validation error |
| 1 | Warning | Warning message |
| 2 | Info | Informational message |

---

## StructureType Enum

| Value | Name | Description |
|-------|------|-------------|
| 0 | (reserved) | — |
| 1 | (reserved) | — |

---

## ModuleName Enum

| Value | Description |
|-------|-------------|
| 1-11 | Various system modules |
