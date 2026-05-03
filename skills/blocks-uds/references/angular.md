# Angular Reference

Angular integration with the Blocks UDS API. Uses Angular `HttpClient` for REST and GraphQL calls, and Angular signals for reactive state management.

## Directory Structure

```
src/app/
├── services/
│   └── uds.service.ts          # REST calls (schemas, file uploads, access policies)
│   └── graphql.service.ts      # GraphQL gateway queries/mutations
├── models/
│   └── uds.types.ts            # Interfaces matching contracts.md
└── components/
    └── schema-manager/         # Schema CRUD components
```

## Types Layer

Match exact field names from `contracts.md`:

```typescript
// src/app/models/uds.types.ts

export interface SchemaDefinition {
  itemId: string;
  schemaName: string;
  collectionName: string;
  schemaType: number;        // 1=Entity, 2=Dto
  accessLevel: number;        // 0=Public, 1=User, 2=Custom
  projectKey: string;
  fields: SchemaField[];
}

export interface SchemaField {
  name: string;
  type: string;
  isArray: boolean;
  isPIIData: boolean;
  isUniqueData: boolean;
  description: string;
}

export interface AccessPolicy {
  itemId: string;
  policyName: string;
  operation: number;          // 0=Read, 1=Create, 2=Update, 3=Delete, 4=All
  schemaId: string;
  roleSlug: string;
}

export interface ValidationRule {
  itemId: string;
  schemaId: string;
  fieldName: string;
  validationType: number;    // 0-11 (see contracts.md)
  errorMessage: string;
  isActive: boolean;
}
```

> [!IMPORTANT]
> Use integer enums: `schemaType`, `accessLevel`, `operation`, `validationType` — not strings. `projectKey` in bodies: use `$X_BLOCKS_KEY` value, NOT `$PROJECT_SLUG`.

## Environment Config

```typescript
// environment.ts
export const environment = {
  blocksApiUrl: 'https://api.example.com',
  blocksProjectKey: 'your_project_key',
};
```

## REST Service

```typescript
// src/app/services/uds.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UdsService {
  private http = inject(HttpClient);
  private baseUrl = 'https://api.example.com/uds/v1';
  private projectKey = environment.blocksProjectKey;

  private headers = new HttpHeaders({
    'x-blocks-key': this.projectKey,
    'Content-Type': 'application/json',
  });

  defineSchema(data: {
    schemaName: string;
    collectionName: string;
    fields: SchemaField[];
    schemaType?: number;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/schemas/define`, {
      ...data,
      schemaType: data.schemaType ?? 1,
      projectKey: this.projectKey,
    }, { headers: this.headers });
  }

  saveSchemaFields(schemaId: string, fields: SchemaField[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/schemas/${schemaId}/fields`, {
      fields,
      projectKey: this.projectKey,
    }, { headers: this.headers });
  }

  reloadConfiguration(): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/configurations/reload?projectKey=${this.projectKey}`,
      null,
      { headers: this.headers }
    );
  }

  createAccessPolicy(body: {
    policyName: string;
    operation: number;
    schemaId: string;
    roleSlug: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/data-access/policy/create`, {
      ...body,
      projectKey: this.projectKey,
      policyType: 0,
      isAllowPolicy: true,
      priority: 1,
      ruleGroup: {
        logicalOperator: 1,
        rules: [{
          leftSource: 1,
          leftOperand: 'role',
          operator: 0,
          rightSource: 0,
          rightOperand: body.roleSlug,
          description: `${body.roleSlug} role`,
        }],
        nestedGroups: [],
      },
    }, { headers: this.headers });
  }

  getPreSignedUploadUrl(fileName: string): Observable<{ uploadUrl: string; fileId: string }> {
    return this.http.post<{ uploadUrl: string; fileId: string }>(
      `${this.baseUrl}/Files/GetPreSignedUrlForUpload`,
      { name: fileName, projectKey: this.projectKey },
      { headers: this.headers }
    );
  }
}
```

## GraphQL Service

```typescript
// src/app/services/graphql.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class GraphQLService {
  private http = inject(HttpClient);
  private gatewayUrl = `${environment.blocksApiUrl}/uds/v1/${environment.projectSlug}/gateway`;

  async query<T>(gql: string, variables?: Record<string, any>): Promise<T> {
    const res = await this.http.post<{ data: T; errors?: any[] }>(
      this.gatewayUrl,
      { query: gql, variables },
      { headers: this.getHeaders() }
    ).toPromise();
    if (res!.errors?.length) throw new Error(res!.errors[0].message);
    return res!.data;
  }

  async mutate<T>(gql: string, input: any): Promise<T> {
    return this.query<T>(gql, { input });
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'x-blocks-key': environment.blocksProjectKey,
    };
  }
}
```

## Usage Example

```typescript
// src/app/components/product-list.component.ts
@Injectable({ providedIn: 'root' })
export class ProductListComponent {
  private graphql = inject(GraphQLService);
  products: any[] = [];

  async loadProducts() {
    const data = await this.graphql.query<{ getProducts: { items: any[] } }>(`
      query GetProducts($skip: Int, $take: Int) {
        getProducts(skip: $skip, take: $take) {
          items { _id name price }
          totalCount
        }
      }
    `, { skip: 0, take: 20 });
    this.products = data.getProducts.items;
  }
}
```

## File Upload

```typescript
// src/app/services/file-upload.service.ts
async uploadToS3(file: File): Promise<string> {
  const { uploadUrl, fileId } = await this.uds.getPreSignedUploadUrl(file.name).toPromise()!;

  await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  return fileId;
}
```

## Key Patterns

- Inject services via `inject()` or `@inject()` decorator
- Always use `_xBlocksKey` / `projectKey` value in REST request bodies
- Call `reloadConfiguration()` after any schema, data source, or field change
- GraphQL queries use PascalCase schema names: `getProducts`, `createProduct`
- Access policies use integer enums: `operation`, `policyType`, `logicalOperator`
- `schemaType: 1` for Entity schemas

## TODO Checklist

- [ ] Add `provideHttpClient()` to `app.config.ts`
- [ ] Create `src/app/models/uds.types.ts` with exact field names
- [ ] Create `src/app/services/uds.service.ts` with REST endpoints
- [ ] Create `src/app/services/graphql.service.ts` for data CRUD
- [ ] Implement file upload with pre-signed URL pattern
- [ ] Call `reloadConfiguration()` after schema changes
- [ ] Test GraphQL queries via gateway endpoint
