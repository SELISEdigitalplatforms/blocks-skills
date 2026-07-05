# blocks-data — API Endpoints

> Generated from `https://api.seliseblocks.com/data/v4/swagger/v1/swagger.json` — do not edit by hand.
> Regenerate with `python3 tools/generate-api-docs.py data`.

**Base URL:** `https://api.seliseblocks.com/data/v4`

**Authentication** (see `blocks-setup` skill for obtaining tokens):
- `x-blocks-key: <X_BLOCKS_KEY>` header — required on every request
- `Authorization: Bearer <access_token>` — required for authenticated operations

**61 endpoints** across 11 controllers.

> ⚠️ **Deprecated routes still present in swagger** — obsoleted by the platform team; use the replacement instead:
> - `POST /api/configurations/reload` → `POST /api/schema-configurations/reload`
> - `GET /api/data-manage/mock-data` → `GET /api/mock-data` (swagger currently documents it as `GET /api/mock-data/mock-data` — verify which path responds)
> - `POST /api/data-manage/mock-data` → `DELETE /api/mock-data`
> - `GET /api/data-manage/{projectKey}/mock-data` → `GET /api/mock-data`
> - `POST /api/data-sources/add` → `POST /api/configurations`
> - `GET /api/data-sources/get` → `GET /api/configurations`
> - `PUT /api/data-sources/update` → `PUT /api/configurations`
> - `GET /api/data-sources/{projectKey}/get` → `GET /api/configurations`

## Contents

- [Configuration](#configuration) (4)
- [DataAccess](#dataaccess) (7)
- [DataManage](#datamanage) (3)
- [DataSource](#datasource) (4)
- [DataValidation](#datavalidation) (11)
- [Files](#files) (11)
- [MockData](#mockdata) (2)
- [RegexAssistant](#regexassistant) (1)
- [Schema](#schema) (15)
- [SchemaConfiguration](#schemaconfiguration) (1)
- [SchemaExchange](#schemaexchange) (2)

## Configuration

### `GET /api/configurations`

Retrieves the data source configuration for the current tenant.

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    dbConnectionString?: string | null
    isCollectionNameEditable?: boolean
    collectionNamePattern?: string | null
    databaseName?: string | null
    projectKey?: string | null
    projectShortKey?: string | null
    itemId?: string | null
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 500:** Internal Server Error — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/configurations`

Creates a new data source configuration. Use this endpoint to add a new database connection for your platform.

**Request body** (`application/json`):

```ts
{
  itemId?: string | null
  connectionString?: string | null
  databaseName?: string | null
  projectKey?: string | null
}
```

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    acknowledged?: boolean
    itemId?: string | null
    totalImpactedData?: number
    message?: string | null
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 400:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

**Response 500:** Internal Server Error — no schema documented in swagger; verify the live response before relying on its shape.

### `PUT /api/configurations`

Updates an existing data source configuration. Use this endpoint to modify the connection string, database name, or other details for an existing data source.

**Request body** (`application/json`):

```ts
{
  itemId?: string | null
  connectionString?: string | null
  databaseName?: string | null
  projectKey?: string | null
  isCollectionNameEditable?: boolean
  collectionNamePattern?: string | null
}
```

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    acknowledged?: boolean
    itemId?: string | null
    totalImpactedData?: number
    message?: string | null
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 400:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

**Response 500:** Internal Server Error — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/configurations/reload`

> ⚠️ **DEPRECATED** — obsoleted by the platform team; use `POST /api/schema-configurations/reload` instead.

Reloads the GraphQL schema configuration and resolves all unadapted changes.  
This endpoint evicts the cached schema executor and marks all pending schema changes as adapted to the server.  
Use this endpoint after making changes to schema definitions or data sources to refresh the schema and clear deployment badges in the UI.

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: boolean
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 500:** Internal Server Error — no schema documented in swagger; verify the live response before relying on its shape.

## DataAccess

### `POST /api/data-access/policy/create`

Creates a data access policy for a specific schema.

**Request body** (`application/json`):

```ts
{
  policyName?: string | null
  policyDescription?: string | null
  policyType?: 0 | 1 (int enum)
  operation?: 0 | 1 | 2 | 3 | 4 (int enum)
  schemaName?: string | null
  schemaId?: string | null
  fieldNames?: string[]
  projectKey?: string | null
  ruleGroup?: {
    logicalOperator?: 0 | 1 (int enum)
    rules?: {
      leftSource?: 0 | 1 | 2 (int enum)
      leftOperand?: string | null
      operator?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 (int enum)
      rightSource?: 0 | 1 | 2 (int enum)
      rightOperand?: string | null
      staticValue?: unknown | null
      description?: string | null
    }[]
    nestedGroups?: PolicyRuleGroup[]
  }
  priority?: number
  isAllowPolicy?: boolean
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `DELETE /api/data-access/policy/delete`

Deletes a data access policy for a specific item.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `itemId` | query | string | no |  |
| `projectKey` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /api/data-access/policy/get`

Gets all data access policies for a specific schema.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `schemaName` | query | string | no |  |
| `projectKey` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/data-access/policy/update`

Updates a data access policy for a specific item.

**Request body** (`application/json`):

```ts
{
  itemId?: string | null
  policyName?: string | null
  policyDescription?: string | null
  fieldNames?: string[]
  projectKey?: string | null
  ruleGroup?: {
    logicalOperator?: 0 | 1 (int enum)
    rules?: {
      leftSource?: 0 | 1 | 2 (int enum)
      leftOperand?: string | null
      operator?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 (int enum)
      rightSource?: 0 | 1 | 2 (int enum)
      rightOperand?: string | null
      staticValue?: unknown | null
      description?: string | null
    }[]
    nestedGroups?: PolicyRuleGroup[]
  }
  priority?: number | null
  isAllowPolicy?: boolean | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `DELETE /api/data-access/policy/{itemId}/delete`

Cloud use only: Deletes a data access policy for a specific item.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `itemId` | path | string | yes |  |
| `projectKey` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /api/data-access/policy/{schemaName}/get`

Cloud use only: Gets all data access policies for a specific schema.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `schemaName` | path | string | yes |  |
| `projectKey` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/data-access/security/change`

Configures the security for a specific schema.

**Request body** (`application/json`):

```ts
{
  projectKey?: string | null
  schemaId?: string | null
  operation?: 0 | 1 | 2 | 3 | 4 (int enum)
  policyType?: 0 | 1 (int enum)
  fieldNames?: string[]
  accessLevel?: 0 | 1 | 2 | 3 (int enum)
}
```

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    acknowledged?: boolean
    itemId?: string | null
    totalImpactedData?: number
    message?: string | null
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 400:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

**Response 500:** Internal Server Error — no schema documented in swagger; verify the live response before relying on its shape.

## DataManage

### `GET /api/data-manage/mock-data`

> ⚠️ **DEPRECATED** — obsoleted by the platform team; use `GET /api/mock-data` (swagger currently documents it as `GET /api/mock-data/mock-data` — verify which path responds) instead.

Gets mock data from the database.

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    items?: {
      collectionName?: string | null
      schemaName?: string | null
      count?: number
    }[]
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 400:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

### `POST /api/data-manage/mock-data`

> ⚠️ **DEPRECATED** — obsoleted by the platform team; use `DELETE /api/mock-data` instead.

Deletes mock data from the database.

**Request body** (`application/json`):

```ts
{
  projectKey?: string | null
  schemaNames?: string[]
}
```

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    acknowledged?: boolean
    itemId?: string | null
    totalImpactedData?: number
    message?: string | null
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 400:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

### `GET /api/data-manage/{projectKey}/mock-data`

> ⚠️ **DEPRECATED** — obsoleted by the platform team; use `GET /api/mock-data` instead.

Cloud use only: Gets mock data from the database.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `projectKey` | path | string | yes |  |

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    items?: {
      collectionName?: string | null
      schemaName?: string | null
      count?: number
    }[]
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 400:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

## DataSource

### `POST /api/data-sources/add`

> ⚠️ **DEPRECATED** — obsoleted by the platform team; use `POST /api/configurations` instead.

Creates a new data source configuration. Use this endpoint to add a new database connection for your platform.

**Request body** (`application/json`):

```ts
{
  itemId?: string | null
  connectionString?: string | null
  databaseName?: string | null
  projectKey?: string | null
}
```

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    acknowledged?: boolean
    itemId?: string | null
    totalImpactedData?: number
    message?: string | null
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 400:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

**Response 500:** Internal Server Error — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /api/data-sources/get`

> ⚠️ **DEPRECATED** — obsoleted by the platform team; use `GET /api/configurations` instead.

Retrieves the data source configuration for a specific project. Use this endpoint to get the database connection details for your platform.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `projectKey` | query | string | no | The unique identifier of the project to retrieve. |

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    dbConnectionString?: string | null
    isCollectionNameEditable?: boolean
    collectionNamePattern?: string | null
    databaseName?: string | null
    projectKey?: string | null
    projectShortKey?: string | null
    itemId?: string | null
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 500:** Internal Server Error — no schema documented in swagger; verify the live response before relying on its shape.

### `PUT /api/data-sources/update`

> ⚠️ **DEPRECATED** — obsoleted by the platform team; use `PUT /api/configurations` instead.

Updates an existing data source configuration. Use this endpoint to modify the connection string, database name, or other details for an existing data source.

**Request body** (`application/json`):

```ts
{
  itemId?: string | null
  connectionString?: string | null
  databaseName?: string | null
  projectKey?: string | null
  isCollectionNameEditable?: boolean
  collectionNamePattern?: string | null
}
```

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    acknowledged?: boolean
    itemId?: string | null
    totalImpactedData?: number
    message?: string | null
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 400:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

**Response 500:** Internal Server Error — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /api/data-sources/{projectKey}/get`

> ⚠️ **DEPRECATED** — obsoleted by the platform team; use `GET /api/configurations` instead.

Cloud use only: Retrieves the data source configuration for a specific project. Use this endpoint to get the database connection details for your platform.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `projectKey` | path | string | yes | The unique identifier for the project whose data source configuration you want to retrieve. |

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    dbConnectionString?: string | null
    isCollectionNameEditable?: boolean
    collectionNamePattern?: string | null
    databaseName?: string | null
    projectKey?: string | null
    projectShortKey?: string | null
    itemId?: string | null
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 500:** Internal Server Error — no schema documented in swagger; verify the live response before relying on its shape.

## DataValidation

### `DELETE /api/data-validations`

Deletes a data validation by its unique ID.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `validationId` | query | string | no | The unique identifier of the data validation to delete. |
| `projectKey` | query | string | no | The project key for context. |

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    acknowledged?: boolean
    itemId?: string | null
    totalImpactedData?: number
    message?: string | null
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 400:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

### `GET /api/data-validations`

Retrieves a paginated list of all data validations. Use this endpoint to view all available validations, optionally filtered by schema ID or field name.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `SchemaId` | query | string | no |  |
| `FieldName` | query | string | no |  |
| `Keyword` | query | string | no |  |
| `ProjectKey` | query | string | no |  |
| `PageNo` | query | integer (int32) | no |  |
| `PageSize` | query | integer (int32) | no |  |
| `SortBy` | query | string | no |  |
| `SortDescending` | query | boolean | no |  |

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    totalCount?: number
    items?: {
      itemId?: string | null
      schemaId?: string | null
      fieldName?: string | null
      validations?: {
        type?: ValidationType
        value?: unknown | null
        secondaryValue?: unknown | null
        errorMessage?: string | null
        isActive?: boolean
      }[]
      createdDate?: string (date-time)
      lastUpdatedDate?: string (date-time)
    }[]
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 500:** Internal Server Error — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/data-validations`

Creates a new data validation. Use this endpoint to define validation rules for a schema field.

**Request body** (`application/json`):

```ts
{
  projectKey?: string | null
  schemaId?: string | null
  fieldName?: string | null
  validations?: {
    type?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 (int enum)
    value?: unknown | null
    secondaryValue?: unknown | null
    errorMessage?: string | null
    isActive?: boolean
  }[]
}
```

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    acknowledged?: boolean
    itemId?: string | null
    totalImpactedData?: number
    message?: string | null
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 400:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

**Response 500:** Internal Server Error — no schema documented in swagger; verify the live response before relying on its shape.

### `PUT /api/data-validations`

Updates an existing data validation. Use this endpoint to modify validation rules for a schema field.

**Request body** (`application/json`):

```ts
{
  projectKey?: string | null
  itemId?: string | null
  schemaId?: string | null
  fieldName?: string | null
  validations?: {
    type?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 (int enum)
    value?: unknown | null
    secondaryValue?: unknown | null
    errorMessage?: string | null
    isActive?: boolean
  }[]
}
```

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    acknowledged?: boolean
    itemId?: string | null
    totalImpactedData?: number
    message?: string | null
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 400:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

**Response 500:** Internal Server Error — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /api/data-validations/by-schema-and-field`

Retrieves validation for a specific field in a schema.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `schemaId` | query | string | no | The schema ID. |
| `fieldName` | query | string | no | The field name. |
| `projectKey` | query | string | no | The project key for context. |

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    itemId?: string | null
    schemaId?: string | null
    fieldName?: string | null
    validations?: {
      type?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 (int enum)
      value?: unknown | null
      secondaryValue?: unknown | null
      errorMessage?: string | null
      isActive?: boolean
    }[]
    createdDate?: string (date-time)
    lastUpdatedDate?: string (date-time)
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

### `GET /api/data-validations/by-schema-id`

Retrieves all validations for a specific schema.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `schemaId` | query | string | no | The schema ID to get validations for. |
| `projectKey` | query | string | no | The project key for context. |

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    itemId?: string | null
    schemaId?: string | null
    fieldName?: string | null
    validations?: {
      type?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 (int enum)
      value?: unknown | null
      secondaryValue?: unknown | null
      errorMessage?: string | null
      isActive?: boolean
    }[]
    createdDate?: string (date-time)
    lastUpdatedDate?: string (date-time)
  }[]
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 500:** Internal Server Error — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /api/data-validations/get-by-id`

Retrieves the details of a specific data validation by its unique ID.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `validationId` | query | string | no | The unique identifier of the data validation to retrieve. |
| `projectKey` | query | string | no | The project key for context. |

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    itemId?: string | null
    schemaId?: string | null
    fieldName?: string | null
    validations?: {
      type?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 (int enum)
      value?: unknown | null
      secondaryValue?: unknown | null
      errorMessage?: string | null
      isActive?: boolean
    }[]
    createdDate?: string (date-time)
    lastUpdatedDate?: string (date-time)
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 404:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

### `GET /api/data-validations/schema/{schemaId}`

Cloud use only: Retrieves all validations for a specific schema.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `schemaId` | path | string | yes | The schema ID to get validations for. |
| `projectKey` | query | string | no | The project key for context. |

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    itemId?: string | null
    schemaId?: string | null
    fieldName?: string | null
    validations?: {
      type?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 (int enum)
      value?: unknown | null
      secondaryValue?: unknown | null
      errorMessage?: string | null
      isActive?: boolean
    }[]
    createdDate?: string (date-time)
    lastUpdatedDate?: string (date-time)
  }[]
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 500:** Internal Server Error — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /api/data-validations/schema/{schemaId}/field/{fieldName}`

Cloud use only: Retrieves validation for a specific field in a schema.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `schemaId` | path | string | yes | The schema ID. |
| `fieldName` | path | string | yes | The field name. |
| `projectKey` | query | string | no | The project key for context. |

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    itemId?: string | null
    schemaId?: string | null
    fieldName?: string | null
    validations?: {
      type?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 (int enum)
      value?: unknown | null
      secondaryValue?: unknown | null
      errorMessage?: string | null
      isActive?: boolean
    }[]
    createdDate?: string (date-time)
    lastUpdatedDate?: string (date-time)
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

### `DELETE /api/data-validations/{id}`

Cloud use only: Deletes a data validation by its unique ID.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | string | yes | The unique identifier of the data validation to delete. |
| `projectKey` | query | string | no | The project key for context. |

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    acknowledged?: boolean
    itemId?: string | null
    totalImpactedData?: number
    message?: string | null
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 400:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

### `GET /api/data-validations/{id}`

Cloud use only: Retrieves the details of a specific data validation by its unique ID.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | string | yes | The unique identifier of the data validation to retrieve. |
| `projectKey` | query | string | no | The project key for context. |

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    itemId?: string | null
    schemaId?: string | null
    fieldName?: string | null
    validations?: {
      type?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 (int enum)
      value?: unknown | null
      secondaryValue?: unknown | null
      errorMessage?: string | null
      isActive?: boolean
    }[]
    createdDate?: string (date-time)
    lastUpdatedDate?: string (date-time)
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 404:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

## Files

### `POST /api/Files/CreateFolder`

**Request body** (`application/json`):

```ts
{
  userId?: string | null
  itemId?: string | null
  artifactName?: string | null
  configurationName?: string | null
  description?: string | null
  parentId?: string | null
  dmsWorkspaceId?: string | null
  dmsWorkspaceName?: string | null
  tags?: string[]
  metaData?: { [key: string]: {
      type?: string | null
      value?: string | null
    } }
  organizationId?: string | null
  fileStorageId?: string | null
  projectKey?: string | null
}
```

**Response 200:**

```ts
{
  result?: unknown | null
  message?: string | null
  httpStatusCode?: 100 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226 | 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308 | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 421 | 422 | 423 | 424 | 426 | 428 | 429 | 431 | 451 | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 (int enum)
}
```

### `POST /api/Files/DeleteFile`

Deletes a file based on the provided request.

**Request body** (`application/json`):

```ts
{
  fileId?: string | null
  configurationName?: string | null
  projectKey?: string | null
  eventQueueName?: string | null
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
}
```

### `POST /api/Files/DeleteFolder`

Deletes a folder based on the provided request.

**Request body** (`application/json`):

```ts
{
  folderId: string | null
  configurationName?: string | null
  projectKey?: string | null
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
}
```

### `POST /api/Files/GetDmsFileAndFolder`

**Request body** (`application/json`):

```ts
{
  parentId?: string | null
  configurationName?: string | null
  projectKey?: string | null
  searchKey?: string | null
  moduleName?: string | null
  skip?: number | null
  take?: number | null
}
```

**Response 200:**

```ts
{
  dmsFileAndFolderInfos?: {
    parentId?: string | null
    type?: number
    name?: string | null
    fileStorageId?: string | null
    extension?: string | null
    sizeInBytes?: string | null
    version?: number
    description?: string | null
    itemId?: string | null
    lastUpdatedDate?: string (date-time)
  }[]
  totalCount?: number
}
```

### `GET /api/Files/GetFile`

Retrieves a file for download based on the provided request.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `FileId` | query | string | no |  |
| `Version` | query | integer (int64) | no |  |
| `ConfigurationName` | query | string | no |  |
| `ProjectKey` | query | string | no |  |

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  url?: string | null
  accessModifier?: 0 | 1 | 2 | 3 (int enum)
  itemId?: string | null
  tags?: string[]
  metaData?: { [key: string]: {
      type?: string | null
      value?: string | null
    } }
  name?: string | null
  parentDirectoryID?: string | null
  systemName?: string | null
  type?: number
  typeString?: string | null
  createDate?: string (date-time)
  createdBy?: string | null
  language?: string | null
  tenantId?: string | null
  sizeInBytes?: number
}
```

### `POST /api/Files/GetFiles`

Retrieves multiple files for download based on the provided request.

**Request body** (`application/json`):

```ts
{
  fileIds?: string[]
  configurationName?: string | null
  projectKey?: string | null
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  url?: string | null
  accessModifier?: 0 | 1 | 2 | 3 (int enum)
  itemId?: string | null
  tags?: string[]
  metaData?: { [key: string]: {
      type?: string | null
      value?: string | null
    } }
  name?: string | null
  parentDirectoryID?: string | null
  systemName?: string | null
  type?: number
  typeString?: string | null
  createDate?: string (date-time)
  createdBy?: string | null
  language?: string | null
  tenantId?: string | null
  sizeInBytes?: number
}[]
```

### `POST /api/Files/GetFilesInfo`

Retrieves multiple files Information.

**Request body** (`application/json`):

```ts
{
  page?: number
  pageSize?: number
  sort?: {
    property?: string | null
    isDescending?: boolean
  }
  filter?: {
    name?: string | null
    tenantId?: string | null
    additionalProperties?: { [key: string]: string }
  }
  projectKey?: string | null
}
```

**Response 200:**

```ts
{
  data?: {
    itemId?: string | null
    url?: string | null
    tenantId?: string | null
    accessModifier?: 0 | 1 | 2 | 3 (int enum)
    metaData?: { [key: string]: {
        type?: string | null
        value?: string | null
      } }
    name?: string | null
    parentDirectoryID?: string | null
    systemName?: string | null
    type?: 0 | 1 (int enum)
    typeString?: string | null
    currentVersion?: number
    additionalProperties?: { [key: string]: string }
  }[]
  errors?: { [key: string]: string }
  totalCount?: number
}
```

### `POST /api/Files/GetPreSignedUrlForUpload`

Generates a pre-signed URL for uploading a file.

**Request body** (`application/json`):

```ts
{
  itemId?: string | null
  metaData?: string | null
  name?: string | null
  parentDirectoryId?: string | null
  tags?: string | null
  accessModifier?: string | null
  configurationName?: string | null
  projectKey?: string | null
  moduleName?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 (int enum)
  additionalProperties?: { [key: string]: string }
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  uploadUrl?: string | null
  fileId?: string | null
}
```

### `POST /api/Files/UploadFile`

**Request body** (`application/json`):

```ts
{
  upload?: {
    userId?: string | null
    itemId?: string | null
    artifactName?: string | null
    configurationName?: string | null
    description?: string | null
    parentId?: string | null
    dmsWorkspaceId?: string | null
    dmsWorkspaceName?: string | null
    tags?: string[]
    metaData?: { [key: string]: {
        type?: string | null
        value?: string | null
      } }
    organizationId?: string | null
    fileStorageId?: string | null
  }[]
  projectKey?: string | null
}
```

**Response 200:**

```ts
{
  result?: unknown | null
  message?: string | null
  httpStatusCode?: 100 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226 | 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308 | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 421 | 422 | 423 | 424 | 426 | 428 | 429 | 431 | 451 | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 (int enum)
}
```

### `POST /api/Files/UploadFileToLocalStorage`

Uploads a file to local storage.

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  fileId?: string | null
  fileVersion?: number
}
```

### `POST /api/Files/updateFileAdditionalInfo`

**Request body** (`application/json`):

```ts
{
  itemId?: string | null
  additionalProperties?: { [key: string]: string }
  projectKey?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

## MockData

### `DELETE /api/mock-data`

Deletes mock data from the database.

**Request body** (`application/json`):

```ts
{
  projectKey?: string | null
  schemaNames?: string[]
}
```

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    acknowledged?: boolean
    itemId?: string | null
    totalImpactedData?: number
    message?: string | null
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 400:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

### `GET /api/mock-data/mock-data`

Gets mock data from the database.

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    items?: {
      collectionName?: string | null
      schemaName?: string | null
      count?: number
    }[]
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 400:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

## RegexAssistant

### `POST /api/regex/generateregex`

Generates a regex pattern based on a text description using AI

**Request body** (`application/json`):

```ts
{
  description?: string | null
  exampleText?: string | null
  temperature?: number
  additionalContext?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

## Schema

### `DELETE /api/schemas`

Deletes a schema definition by its unique ID. This action cannot be undone.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | query | string | no | The unique identifier of the schema definition to delete. |
| `projectKey` | query | string | no | The unique identifier of the project to retrieve. |

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    acknowledged?: boolean
    itemId?: string | null
    totalImpactedData?: number
    message?: string | null
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 400:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

### `GET /api/schemas`

Retrieves a paginated list of all schema definitions. Use this endpoint to view all available schemas, optionally filtered by a keyword.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `Keyword` | query | string | no |  |
| `SchemaName` | query | string | no |  |
| `CollectionName` | query | string | no |  |
| `ProjectKey` | query | string | no |  |
| `SchemaType` | query | string | no |  |
| `PageNo` | query | integer (int32) | no |  |
| `PageSize` | query | integer (int32) | no |  |
| `SortBy` | query | string | no |  |
| `SortDescending` | query | boolean | no |  |

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    totalCount?: number
    items?: {
      id?: string | null
      collectionName?: string | null
      fields?: {
        name?: string | null
        type?: string | null
        isArray?: boolean
        isPIIData?: boolean
        isUniqueData?: boolean
        description?: string | null
        fields?: FieldDefinitionResponse[]
        readAccessLevel?: SchemaAccessLevel
        writeAccessLevel?: SchemaAccessLevel
        editAccessLevel?: SchemaAccessLevel
        deleteAccessLevel?: SchemaAccessLevel
        validationRule?: DataValidation
        totalValidationRules?: number
        totalReadPolicies?: number
        totalWritePolicies?: number
        totalEditPolicies?: number
        totalDeletePolicies?: number
      }[]
      schemaName?: string | null
      schemaType?: 1 | 2 (int enum)
      projectKey?: string | null
      projectShortKey?: string | null
      projectSchemaName?: string | null
      querySchema?: string | null
      mutationSchemas?: string[]
      readAccessLevel?: 0 | 1 | 2 | 3 (int enum)
      writeAccessLevel?: 0 | 1 | 2 | 3 (int enum)
      editAccessLevel?: 0 | 1 | 2 | 3 (int enum)
      deleteAccessLevel?: 0 | 1 | 2 | 3 (int enum)
      readPolicies?: {
        itemId?: string | null
        createdDate?: string (date-time)
        lastUpdatedDate?: string (date-time)
        createdBy?: string | null
        language?: string | null
        lastUpdatedBy?: string | null
        organizationId?: string | null
        tags?: string[]
        deletedDate?: string (date-time) | null
        isDeleted?: boolean
        referencePolicyId?: string | null
        policyName?: string | null
        policyDescription?: string | null
        policyType?: PolicyType
        operation?: PolicyOperation
        schemaName?: string | null
        schemaId?: string | null
        fieldNames?: string[]
        ruleGroup?: PolicyRuleGroup
        priority?: number
        isAllowPolicy?: boolean
      }[]
      writePolicies?: {
        itemId?: string | null
        createdDate?: string (date-time)
        lastUpdatedDate?: string (date-time)
        createdBy?: string | null
        language?: string | null
        lastUpdatedBy?: string | null
        organizationId?: string | null
        tags?: string[]
        deletedDate?: string (date-time) | null
        isDeleted?: boolean
        referencePolicyId?: string | null
        policyName?: string | null
        policyDescription?: string | null
        policyType?: PolicyType
        operation?: PolicyOperation
        schemaName?: string | null
        schemaId?: string | null
        fieldNames?: string[]
        ruleGroup?: PolicyRuleGroup
        priority?: number
        isAllowPolicy?: boolean
      }[]
      editPolicies?: {
        itemId?: string | null
        createdDate?: string (date-time)
        lastUpdatedDate?: string (date-time)
        createdBy?: string | null
        language?: string | null
        lastUpdatedBy?: string | null
        organizationId?: string | null
        tags?: string[]
        deletedDate?: string (date-time) | null
        isDeleted?: boolean
        referencePolicyId?: string | null
        policyName?: string | null
        policyDescription?: string | null
        policyType?: PolicyType
        operation?: PolicyOperation
        schemaName?: string | null
        schemaId?: string | null
        fieldNames?: string[]
        ruleGroup?: PolicyRuleGroup
        priority?: number
        isAllowPolicy?: boolean
      }[]
      deletePolicies?: {
        itemId?: string | null
        createdDate?: string (date-time)
        lastUpdatedDate?: string (date-time)
        createdBy?: string | null
        language?: string | null
        lastUpdatedBy?: string | null
        organizationId?: string | null
        tags?: string[]
        deletedDate?: string (date-time) | null
        isDeleted?: boolean
        referencePolicyId?: string | null
        policyName?: string | null
        policyDescription?: string | null
        policyType?: PolicyType
        operation?: PolicyOperation
        schemaName?: string | null
        schemaId?: string | null
        fieldNames?: string[]
        ruleGroup?: PolicyRuleGroup
        priority?: number
        isAllowPolicy?: boolean
      }[]
      schemaReferences?: string[]
      totalSchemaReferences?: number
      totalReadPolicies?: number
      totalWritePolicies?: number
      totalEditPolicies?: number
      totalDeletePolicies?: number
    }[]
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 500:** Internal Server Error — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /api/schemas/aggregation`

Retrieves a paginated list of schema definitions along with an aggregation summary of access levels (Public, User, Custom) for Read, Write, Edit, and Delete operations.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `Keyword` | query | string | no |  |
| `SchemaName` | query | string | no |  |
| `CollectionName` | query | string | no |  |
| `ProjectKey` | query | string | no |  |
| `SchemaType` | query | string | no |  |
| `PageNo` | query | integer (int32) | no |  |
| `PageSize` | query | integer (int32) | no |  |
| `SortBy` | query | string | no |  |
| `SortDescending` | query | boolean | no |  |

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    schemas?: {
      totalCount?: number
      items?: {
        id?: string | null
        collectionName?: string | null
        fields?: FieldDefinitionResponse[]
        schemaName?: string | null
        schemaType?: SchemaType
        projectKey?: string | null
        projectShortKey?: string | null
        projectSchemaName?: string | null
        querySchema?: string | null
        mutationSchemas?: string[]
        readAccessLevel?: SchemaAccessLevel
        writeAccessLevel?: SchemaAccessLevel
        editAccessLevel?: SchemaAccessLevel
        deleteAccessLevel?: SchemaAccessLevel
        readPolicies?: DataAccessPolicy[]
        writePolicies?: DataAccessPolicy[]
        editPolicies?: DataAccessPolicy[]
        deletePolicies?: DataAccessPolicy[]
        schemaReferences?: string[]
        totalSchemaReferences?: number
        totalReadPolicies?: number
        totalWritePolicies?: number
        totalEditPolicies?: number
        totalDeletePolicies?: number
      }[]
    }
    aggregation?: {
      read?: {
        public?: number
        user?: number
        custom?: number
      }
      write?: {
        public?: number
        user?: number
        custom?: number
      }
      edit?: {
        public?: number
        user?: number
        custom?: number
      }
      delete?: {
        public?: number
        user?: number
        custom?: number
      }
      totalPublicPermission?: number
      totalUserPermission?: number
      totalCustomPermission?: number
    }
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 500:** Internal Server Error — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/schemas/define`

Creates a new schema definition. Use this endpoint to define a new schema, including its name, collection name, fields, and type.

**Request body** (`application/json`):

```ts
{
  collectionName?: string | null
  schemaName?: string | null
  projectKey?: string | null
  schemaType?: 1 | 2 (int enum)
  projectShortKey?: string | null
  fields?: {
    name?: string | null
    type?: string | null
    isArray?: boolean
    isPIIData?: boolean
    isUniqueData?: boolean
    description?: string | null
  }[]
}
```

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    acknowledged?: boolean
    itemId?: string | null
    totalImpactedData?: number
    message?: string | null
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 400:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

**Response 500:** Internal Server Error — no schema documented in swagger; verify the live response before relying on its shape.

### `PUT /api/schemas/define`

Updates an existing schema definition. Use this endpoint to modify the structure or fields of an existing schema.

**Request body** (`application/json`):

```ts
{
  collectionName?: string | null
  schemaName?: string | null
  projectKey?: string | null
  schemaType?: 1 | 2 (int enum)
  projectShortKey?: string | null
  fields?: {
    name?: string | null
    type?: string | null
    isArray?: boolean
    isPIIData?: boolean
    isUniqueData?: boolean
    description?: string | null
  }[]
  itemId?: string | null
}
```

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    acknowledged?: boolean
    itemId?: string | null
    totalImpactedData?: number
    message?: string | null
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 400:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

**Response 500:** Internal Server Error — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/schemas/fields`

Saves field definitions for a schema. Use this endpoint to add or update fields in an existing schema.

**Request body** (`application/json`):

```ts
{
  schemaDefinitionItemId?: string | null
  deletableFieldNames?: string[]
  projectShortKey?: string | null
  fields?: {
    name?: string | null
    type?: string | null
    isArray?: boolean
    isPIIData?: boolean
    isUniqueData?: boolean
    description?: string | null
  }[]
  projectKey?: string | null
}
```

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    acknowledged?: boolean
    itemId?: string | null
    totalImpactedData?: number
    message?: string | null
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 400:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

**Response 500:** Internal Server Error — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /api/schemas/get-by-id`

Retrieves the details of a specific schema definition by its unique ID. Use this endpoint to get the schema definition details, including its fields and type.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | query | string | no | The unique identifier of the schema definition to retrieve. |
| `projectKey` | query | string | no | The unique identifier of the project to retrieve. |

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    id?: string | null
    collectionName?: string | null
    fields?: {
      name?: string | null
      type?: string | null
      isArray?: boolean
      isPIIData?: boolean
      isUniqueData?: boolean
      description?: string | null
      fields?: FieldDefinitionResponse[]
      readAccessLevel?: 0 | 1 | 2 | 3 (int enum)
      writeAccessLevel?: 0 | 1 | 2 | 3 (int enum)
      editAccessLevel?: 0 | 1 | 2 | 3 (int enum)
      deleteAccessLevel?: 0 | 1 | 2 | 3 (int enum)
      validationRule?: {
        itemId?: string | null
        createdDate?: string (date-time)
        lastUpdatedDate?: string (date-time)
        createdBy?: string | null
        language?: string | null
        lastUpdatedBy?: string | null
        organizationId?: string | null
        tags?: string[]
        deletedDate?: string (date-time) | null
        isDeleted?: boolean
        schemaId?: string | null
        fieldName?: string | null
        validations?: ValidationRule[]
      }
      totalValidationRules?: number
      totalReadPolicies?: number
      totalWritePolicies?: number
      totalEditPolicies?: number
      totalDeletePolicies?: number
    }[]
    schemaName?: string | null
    schemaType?: 1 | 2 (int enum)
    projectKey?: string | null
    projectShortKey?: string | null
    projectSchemaName?: string | null
    querySchema?: string | null
    mutationSchemas?: string[]
    readAccessLevel?: 0 | 1 | 2 | 3 (int enum)
    writeAccessLevel?: 0 | 1 | 2 | 3 (int enum)
    editAccessLevel?: 0 | 1 | 2 | 3 (int enum)
    deleteAccessLevel?: 0 | 1 | 2 | 3 (int enum)
    readPolicies?: {
      itemId?: string | null
      createdDate?: string (date-time)
      lastUpdatedDate?: string (date-time)
      createdBy?: string | null
      language?: string | null
      lastUpdatedBy?: string | null
      organizationId?: string | null
      tags?: string[]
      deletedDate?: string (date-time) | null
      isDeleted?: boolean
      referencePolicyId?: string | null
      policyName?: string | null
      policyDescription?: string | null
      policyType?: 0 | 1 (int enum)
      operation?: 0 | 1 | 2 | 3 | 4 (int enum)
      schemaName?: string | null
      schemaId?: string | null
      fieldNames?: string[]
      ruleGroup?: {
        logicalOperator?: PolicyLogicalOperator
        rules?: PolicyRule[]
        nestedGroups?: PolicyRuleGroup[]
      }
      priority?: number
      isAllowPolicy?: boolean
    }[]
    writePolicies?: {
      itemId?: string | null
      createdDate?: string (date-time)
      lastUpdatedDate?: string (date-time)
      createdBy?: string | null
      language?: string | null
      lastUpdatedBy?: string | null
      organizationId?: string | null
      tags?: string[]
      deletedDate?: string (date-time) | null
      isDeleted?: boolean
      referencePolicyId?: string | null
      policyName?: string | null
      policyDescription?: string | null
      policyType?: 0 | 1 (int enum)
      operation?: 0 | 1 | 2 | 3 | 4 (int enum)
      schemaName?: string | null
      schemaId?: string | null
      fieldNames?: string[]
      ruleGroup?: {
        logicalOperator?: PolicyLogicalOperator
        rules?: PolicyRule[]
        nestedGroups?: PolicyRuleGroup[]
      }
      priority?: number
      isAllowPolicy?: boolean
    }[]
    editPolicies?: {
      itemId?: string | null
      createdDate?: string (date-time)
      lastUpdatedDate?: string (date-time)
      createdBy?: string | null
      language?: string | null
      lastUpdatedBy?: string | null
      organizationId?: string | null
      tags?: string[]
      deletedDate?: string (date-time) | null
      isDeleted?: boolean
      referencePolicyId?: string | null
      policyName?: string | null
      policyDescription?: string | null
      policyType?: 0 | 1 (int enum)
      operation?: 0 | 1 | 2 | 3 | 4 (int enum)
      schemaName?: string | null
      schemaId?: string | null
      fieldNames?: string[]
      ruleGroup?: {
        logicalOperator?: PolicyLogicalOperator
        rules?: PolicyRule[]
        nestedGroups?: PolicyRuleGroup[]
      }
      priority?: number
      isAllowPolicy?: boolean
    }[]
    deletePolicies?: {
      itemId?: string | null
      createdDate?: string (date-time)
      lastUpdatedDate?: string (date-time)
      createdBy?: string | null
      language?: string | null
      lastUpdatedBy?: string | null
      organizationId?: string | null
      tags?: string[]
      deletedDate?: string (date-time) | null
      isDeleted?: boolean
      referencePolicyId?: string | null
      policyName?: string | null
      policyDescription?: string | null
      policyType?: 0 | 1 (int enum)
      operation?: 0 | 1 | 2 | 3 | 4 (int enum)
      schemaName?: string | null
      schemaId?: string | null
      fieldNames?: string[]
      ruleGroup?: {
        logicalOperator?: PolicyLogicalOperator
        rules?: PolicyRule[]
        nestedGroups?: PolicyRuleGroup[]
      }
      priority?: number
      isAllowPolicy?: boolean
    }[]
    schemaReferences?: string[]
    totalSchemaReferences?: number
    totalReadPolicies?: number
    totalWritePolicies?: number
    totalEditPolicies?: number
    totalDeletePolicies?: number
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 404:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

### `GET /api/schemas/info`

Retrieves a list of all Entity-type schema collections with basic info.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `projectKey` | query | string | no |  |

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    collections?: {
      name?: string | null
      collectionName?: string | null
      description?: string | null
      type?: string | null
    }[]
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 400:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

**Response 500:** Internal Server Error — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/schemas/info`

Saves field definitions for a schema. Use this endpoint to add or update fields in an existing schema.

**Request body** (`application/json`):

```ts
{
  collectionName?: string | null
  schemaName?: string | null
  projectKey?: string | null
  schemaType?: 1 | 2 (int enum)
}
```

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    acknowledged?: boolean
    itemId?: string | null
    totalImpactedData?: number
    message?: string | null
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 400:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

**Response 500:** Internal Server Error — no schema documented in swagger; verify the live response before relying on its shape.

### `PUT /api/schemas/info`

Updates an existing schema definition. Use this endpoint to modify the structure or fields of an existing schema.

**Request body** (`application/json`):

```ts
{
  collectionName?: string | null
  schemaName?: string | null
  projectKey?: string | null
  schemaType?: 1 | 2 (int enum)
  itemId?: string | null
}
```

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    acknowledged?: boolean
    itemId?: string | null
    totalImpactedData?: number
    message?: string | null
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 400:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

**Response 500:** Internal Server Error — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /api/schemas/info-by-name`

Retrieves the details of a specific Entity-type schema by its collection name, including all fields.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `schemaName` | query | string | no |  |
| `projectKey` | query | string | no |  |

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    name?: string | null
    collectionName?: string | null
    description?: string | null
    type?: string | null
    fields?: {
      name?: string | null
      type?: string | null
      description?: string | null
      fields?: CollectionFieldResponse[]
    }[]
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 400:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

**Response 404:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

### `GET /api/schemas/info/{projectSchemaName}`

Cloud use only: Retrieves the details of a specific Entity-type schema by its collection name, including all fields.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `projectSchemaName` | path | string | yes |  |
| `projectKey` | query | string | no |  |

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    name?: string | null
    collectionName?: string | null
    description?: string | null
    type?: string | null
    fields?: {
      name?: string | null
      type?: string | null
      description?: string | null
      fields?: CollectionFieldResponse[]
    }[]
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 400:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

**Response 404:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

### `GET /api/schemas/unadapted-change-logs`

Gets all unadapted schema change logs.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `projectKey` | query | string | no |  |

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    acknowledged?: boolean
    itemId?: string | null
    totalImpactedData?: number
    message?: string | null
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 400:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

**Response 500:** Internal Server Error — no schema documented in swagger; verify the live response before relying on its shape.

### `DELETE /api/schemas/{id}`

Cloud use only: Deletes a schema definition by its unique ID. This action cannot be undone.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | string | yes | The unique identifier of the schema definition to delete. |
| `projectKey` | query | string | no | The unique identifier of the project to retrieve. |

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    acknowledged?: boolean
    itemId?: string | null
    totalImpactedData?: number
    message?: string | null
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 400:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

### `GET /api/schemas/{id}`

Cloud use only: Retrieves the details of a specific schema definition by its unique ID. Use this endpoint to get the schema definition details, including its fields and type.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | string | yes | The unique identifier of the schema definition to retrieve. |
| `projectKey` | query | string | no | The unique identifier of the project to retrieve. |

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    id?: string | null
    collectionName?: string | null
    fields?: {
      name?: string | null
      type?: string | null
      isArray?: boolean
      isPIIData?: boolean
      isUniqueData?: boolean
      description?: string | null
      fields?: FieldDefinitionResponse[]
      readAccessLevel?: 0 | 1 | 2 | 3 (int enum)
      writeAccessLevel?: 0 | 1 | 2 | 3 (int enum)
      editAccessLevel?: 0 | 1 | 2 | 3 (int enum)
      deleteAccessLevel?: 0 | 1 | 2 | 3 (int enum)
      validationRule?: {
        itemId?: string | null
        createdDate?: string (date-time)
        lastUpdatedDate?: string (date-time)
        createdBy?: string | null
        language?: string | null
        lastUpdatedBy?: string | null
        organizationId?: string | null
        tags?: string[]
        deletedDate?: string (date-time) | null
        isDeleted?: boolean
        schemaId?: string | null
        fieldName?: string | null
        validations?: ValidationRule[]
      }
      totalValidationRules?: number
      totalReadPolicies?: number
      totalWritePolicies?: number
      totalEditPolicies?: number
      totalDeletePolicies?: number
    }[]
    schemaName?: string | null
    schemaType?: 1 | 2 (int enum)
    projectKey?: string | null
    projectShortKey?: string | null
    projectSchemaName?: string | null
    querySchema?: string | null
    mutationSchemas?: string[]
    readAccessLevel?: 0 | 1 | 2 | 3 (int enum)
    writeAccessLevel?: 0 | 1 | 2 | 3 (int enum)
    editAccessLevel?: 0 | 1 | 2 | 3 (int enum)
    deleteAccessLevel?: 0 | 1 | 2 | 3 (int enum)
    readPolicies?: {
      itemId?: string | null
      createdDate?: string (date-time)
      lastUpdatedDate?: string (date-time)
      createdBy?: string | null
      language?: string | null
      lastUpdatedBy?: string | null
      organizationId?: string | null
      tags?: string[]
      deletedDate?: string (date-time) | null
      isDeleted?: boolean
      referencePolicyId?: string | null
      policyName?: string | null
      policyDescription?: string | null
      policyType?: 0 | 1 (int enum)
      operation?: 0 | 1 | 2 | 3 | 4 (int enum)
      schemaName?: string | null
      schemaId?: string | null
      fieldNames?: string[]
      ruleGroup?: {
        logicalOperator?: PolicyLogicalOperator
        rules?: PolicyRule[]
        nestedGroups?: PolicyRuleGroup[]
      }
      priority?: number
      isAllowPolicy?: boolean
    }[]
    writePolicies?: {
      itemId?: string | null
      createdDate?: string (date-time)
      lastUpdatedDate?: string (date-time)
      createdBy?: string | null
      language?: string | null
      lastUpdatedBy?: string | null
      organizationId?: string | null
      tags?: string[]
      deletedDate?: string (date-time) | null
      isDeleted?: boolean
      referencePolicyId?: string | null
      policyName?: string | null
      policyDescription?: string | null
      policyType?: 0 | 1 (int enum)
      operation?: 0 | 1 | 2 | 3 | 4 (int enum)
      schemaName?: string | null
      schemaId?: string | null
      fieldNames?: string[]
      ruleGroup?: {
        logicalOperator?: PolicyLogicalOperator
        rules?: PolicyRule[]
        nestedGroups?: PolicyRuleGroup[]
      }
      priority?: number
      isAllowPolicy?: boolean
    }[]
    editPolicies?: {
      itemId?: string | null
      createdDate?: string (date-time)
      lastUpdatedDate?: string (date-time)
      createdBy?: string | null
      language?: string | null
      lastUpdatedBy?: string | null
      organizationId?: string | null
      tags?: string[]
      deletedDate?: string (date-time) | null
      isDeleted?: boolean
      referencePolicyId?: string | null
      policyName?: string | null
      policyDescription?: string | null
      policyType?: 0 | 1 (int enum)
      operation?: 0 | 1 | 2 | 3 | 4 (int enum)
      schemaName?: string | null
      schemaId?: string | null
      fieldNames?: string[]
      ruleGroup?: {
        logicalOperator?: PolicyLogicalOperator
        rules?: PolicyRule[]
        nestedGroups?: PolicyRuleGroup[]
      }
      priority?: number
      isAllowPolicy?: boolean
    }[]
    deletePolicies?: {
      itemId?: string | null
      createdDate?: string (date-time)
      lastUpdatedDate?: string (date-time)
      createdBy?: string | null
      language?: string | null
      lastUpdatedBy?: string | null
      organizationId?: string | null
      tags?: string[]
      deletedDate?: string (date-time) | null
      isDeleted?: boolean
      referencePolicyId?: string | null
      policyName?: string | null
      policyDescription?: string | null
      policyType?: 0 | 1 (int enum)
      operation?: 0 | 1 | 2 | 3 | 4 (int enum)
      schemaName?: string | null
      schemaId?: string | null
      fieldNames?: string[]
      ruleGroup?: {
        logicalOperator?: PolicyLogicalOperator
        rules?: PolicyRule[]
        nestedGroups?: PolicyRuleGroup[]
      }
      priority?: number
      isAllowPolicy?: boolean
    }[]
    schemaReferences?: string[]
    totalSchemaReferences?: number
    totalReadPolicies?: number
    totalWritePolicies?: number
    totalEditPolicies?: number
    totalDeletePolicies?: number
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 404:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

## SchemaConfiguration

### `POST /api/schema-configurations/reload`

Reloads the GraphQL schema configuration and resolves all unadapted changes.  
This endpoint evicts the cached schema executor and marks all pending schema changes as adapted to the server.  
Use this endpoint after making changes to schema definitions or data sources to refresh the schema and clear deployment badges in the UI.

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: boolean
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 500:** Internal Server Error — no schema documented in swagger; verify the live response before relying on its shape.

## SchemaExchange

### `POST /api/schema-exchange/export`

Initiates an async export of all schema definitions for a project.  
Returns immediately with the fileId. The exported JSON file is delivered via notification using MessageCoRelationId.

**Request body** (`application/json`):

```ts
{
  projectKey: string | null
  messageCoRelationId?: string | null
  exportOption?: 0 | 1 | 2 | 3 (int enum)
}
```

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    acknowledged?: boolean
    itemId?: string | null
    totalImpactedData?: number
    message?: string | null
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 400:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

**Response 500:** Internal Server Error — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/schema-exchange/import`

Initiates an async import of schema definitions from a previously exported file.  
The FileId must reference a file uploaded to blob storage via an export operation.  
Returns immediately with acknowledgement. Import result is delivered via notification using MessageCoRelationId.

**Request body** (`application/json`):

```ts
{
  projectKey: string | null
  fileId: string | null
  messageCoRelationId?: string | null
}
```

**Response 200:**

```ts
{
  isSuccess?: boolean
  message?: string | null
  httpStatusCode?: number
  data?: {
    acknowledged?: boolean
    itemId?: string | null
    totalImpactedData?: number
    message?: string | null
  }
  errors?: {
    propertyName?: string | null
    errorMessage?: string | null
    attemptedValue?: unknown | null
    customState?: unknown | null
    severity?: 0 | 1 | 2 (int enum)
    errorCode?: string | null
    formattedMessagePlaceholderValues?: { [key: string]: unknown | null }
  }[]
}
```

**Response 400:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

**Response 500:** Internal Server Error — no schema documented in swagger; verify the live response before relying on its shape.
