# React Native Reference

React Native (Expo) integration with the Blocks UDS API. Uses React Query for data fetching and AsyncStorage for caching.

## Directory Structure

```
src/
├── lib/
│   ├── uds.types.ts             # Schema, Field, Policy interfaces
│   ├── uds.service.ts           # REST calls: schemas, file uploads, access policies
│   └── graphql.service.ts        # GraphQL gateway client
├── hooks/
│   └── use-uds.ts               # React Query hooks for UDS data access
└── App.tsx
```

## Types Layer

```typescript
// src/lib/uds.types.ts

export interface SchemaDefinition {
  itemId: string;
  schemaName: string;
  collectionName: string;
  schemaType: number;     // 1=Entity, 2=Dto
  accessLevel: number;    // 0=Public, 1=User, 2=Custom
  projectKey: string;
  fields: SchemaField[];
}

export interface SchemaField {
  name: string;
  type: string;
  isArray: boolean;
  isPIIData?: boolean;
  isUniqueData?: boolean;
  description?: string;
}

export interface ValidationRule {
  itemId: string;
  schemaId: string;
  fieldName: string;
  validationType: number;  // 0-11
  errorMessage: string;
  isActive: boolean;
}

export interface AccessPolicy {
  itemId: string;
  policyName: string;
  operation: number;      // 0=Read, 1=Create, 2=Update, 3=Delete, 4=All
  schemaId: string;
  roleSlug: string;
}
```

> [!IMPORTANT]
> Use integer enums: `schemaType`, `accessLevel`, `operation`, `validationType` — not strings. `projectKey` in bodies: use the actual key string, NOT the project slug.

## REST Service

```typescript
// src/lib/uds.service.ts
const API_BASE = process.env.EXPO_PUBLIC_BLOCKS_API_URL!;
const PROJECT_KEY = process.env.EXPO_PUBLIC_BLOCKS_PROJECT_KEY!;

const headers = {
  'Content-Type': 'application/json',
  'x-blocks-key': PROJECT_KEY,
};

export async function defineSchema(data: {
  schemaName: string;
  collectionName: string;
  fields: SchemaField[];
  schemaType?: number;
}) {
  const res = await fetch(`${API_BASE}/uds/v1/schemas/define`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...data, schemaType: data.schemaType ?? 1, projectKey: PROJECT_KEY }),
  });
  return res.json();
}

export async function reloadConfiguration() {
  const res = await fetch(
    `${API_BASE}/uds/v1/configurations/reload?projectKey=${PROJECT_KEY}`,
    { method: 'POST', headers }
  );
  return res.json();
}

export async function createAccessPolicy(data: {
  policyName: string;
  operation: number;
  schemaId: string;
  roleSlug: string;
}) {
  const res = await fetch(`${API_BASE}/uds/v1/data-access/policy/create`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ...data,
      projectKey: PROJECT_KEY,
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
          rightOperand: data.roleSlug,
          description: `${data.roleSlug} role`,
        }],
        nestedGroups: [],
      },
    }),
  });
  return res.json();
}

export async function getPreSignedUploadUrl(fileName: string): Promise<{ uploadUrl: string; fileId: string }> {
  const res = await fetch(`${API_BASE}/uds/v1/Files/GetPreSignedUrlForUpload`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: fileName, projectKey: PROJECT_KEY }),
  });
  return res.json();
}

export async function deleteFile(fileId: string) {
  const res = await fetch(`${API_BASE}/uds/v1/Files/DeleteFile`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ fileId, projectKey: PROJECT_KEY }),
  });
  return res.json();
}
```

## GraphQL Service

```typescript
// src/lib/graphql.service.ts
const API_BASE = process.env.EXPO_PUBLIC_BLOCKS_API_URL!;
const PROJECT_SLUG = process.env.EXPO_PUBLIC_PROJECT_SLUG!;
const PROJECT_KEY = process.env.EXPO_PUBLIC_BLOCKS_PROJECT_KEY!;

export async function queryUds<T = any>(
  gql: string,
  variables?: Record<string, any>
): Promise<T> {
  const res = await fetch(`${API_BASE}/uds/v1/${PROJECT_SLUG}/gateway`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-blocks-key': PROJECT_KEY,
    },
    body: JSON.stringify({ query: gql, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}
```

## React Query Hooks

```typescript
// src/hooks/use-uds.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryUds } from '@/lib/graphql.service';

const GET_PRODUCTS = `
  query GetProducts($skip: Int, $take: Int) {
    getProducts(skip: $skip, take: $take) {
      items { _id name price }
      totalCount
    }
  }
`;

export function useProducts(skip = 0, take = 20) {
  return useQuery({
    queryKey: ['products', skip, take],
    queryFn: () => queryUds<{ getProducts: { items: any[]; totalCount: number } }>(
      GET_PRODUCTS,
      { skip, take }
    ),
    staleTime: 5 * 60 * 1000,
  });
}

const CREATE_PRODUCT = `
  mutation CreateProduct($input: ProductInput!) {
    createProduct(input: $input) { _id name price }
  }
`;

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; price: number }) =>
      queryUds(CREATE_PRODUCT, { input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}
```

## App Integration

```typescript
// App.tsx
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductListScreen } from './screens/product-list-screen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <ProductListScreen />
    </QueryClientProvider>
  );
}
```

## Offline Caching with AsyncStorage

```typescript
// src/lib/cache.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@uds_cache:';

export async function getCached<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
  if (!raw) return null;
  const { data, timestamp, ttl } = JSON.parse(raw);
  if (Date.now() - timestamp > ttl) return null;
  return data as T;
}

export async function setCache<T>(key: string, data: T, ttl = 5 * 60 * 1000) {
  await AsyncStorage.setItem(
    CACHE_PREFIX + key,
    JSON.stringify({ data, timestamp: Date.now(), ttl })
  );
}
```

## Environment Variables

```env
# .env
EXPO_PUBLIC_BLOCKS_API_URL=https://api.example.com
EXPO_PUBLIC_BLOCKS_PROJECT_KEY=your_project_key
EXPO_PUBLIC_PROJECT_SLUG=your_project_slug
```

## Package Dependencies

```bash
npx expo install @tanstack/react-query @react-native-async-storage/async-storage
```

## Key Patterns

- All REST calls use `x-blocks-key` header with the actual key string
- `projectKey` in request bodies: use the actual key value, NOT the slug
- Call `reloadConfiguration()` after any schema, field, or data source change
- GraphQL queries: `get{SchemaName}s` for lists, `get{SchemaName}` for single record
- Mutations: `create{SchemaName}`, `update{SchemaName}`, `delete{SchemaName}`
- Access policies use integer enums: `operation`, `policyType`, `logicalOperator`
- File uploads: get pre-signed URL first, then PUT to S3
- File deletes: POST with JSON body `{fileId, projectKey}`, not query params

## TODO Checklist

- [ ] Add `@tanstack/react-query` and `AsyncStorage` to dependencies
- [ ] Create `src/lib/uds.types.ts` with exact field names
- [ ] Create `src/lib/uds.service.ts` with REST endpoints
- [ ] Create `src/lib/graphql.service.ts` for data CRUD
- [ ] Create `src/hooks/use-uds.ts` with React Query hooks
- [ ] Implement offline caching with `AsyncStorage`
- [ ] Create `.env` with `EXPO_PUBLIC_BLOCKS_API_URL`, `EXPO_PUBLIC_BLOCKS_PROJECT_KEY`, `EXPO_PUBLIC_PROJECT_SLUG`
- [ ] Wrap root in `QueryClientProvider`
- [ ] Call `reloadConfiguration()` after schema changes
- [ ] Test GraphQL queries via gateway endpoint
