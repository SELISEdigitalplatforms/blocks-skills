# Next.js App Router — UDS Data Management

## Overview

This guide covers integrating UDS data management (schemas, GraphQL, file uploads) into a Next.js 14+ App Router application.

## Setup

Install dependencies:
```bash
npm install @tanstack/react-query graphql-request
```

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
NEXT_PUBLIC_X_BLOCKS_KEY=your-project-key
```

## GraphQL Gateway Client

Create `src/lib/uds-gateway.ts`:

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!
const PROJECT_SLUG = process.env.NEXT_PUBLIC_PROJECT_SLUG!
const X_BLOCKS_KEY = process.env.NEXT_PUBLIC_X_BLOCKS_KEY!

export async function queryUds<T = any>(
  query: string,
  variables?: Record<string, any>
): Promise<T> {
  const res = await fetch(`${API_BASE}/uds/v1/${PROJECT_SLUG}/gateway`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-blocks-key': X_BLOCKS_KEY,
      'Authorization': `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  })
  const json = await res.json()
  if (json.errors?.length) throw new Error(json.errors[0].message)
  return json.data
}

function getAccessToken(): string {
  // Get from your auth store (e.g. JWT in cookie, or auth provider)
  return ''
}
```

## Schema CRUD Hooks

```typescript
// src/hooks/use-schemas.ts
'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryUds } from '@/lib/uds-gateway'

const GET_PRODUCTS = `
  query GetProducts($page: Int, $pageSize: Int) {
    getProducts(page: $page, pageSize: $pageSize) {
      items { _id name price createdAt }
      totalCount
    }
  }
`

export function useProducts(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['products', page],
    queryFn: () => queryUds(GET_PRODUCTS, { page, pageSize }),
  })
}

const CREATE_PRODUCT = `
  mutation CreateProduct($input: ProductInput!) {
    createProduct(input: $input) { _id name price }
  }
`

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; price: number }) =>
      queryUds(CREATE_PRODUCT, { input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}
```

## File Upload (S3 Pre-signed URL)

```typescript
// src/lib/file-upload.ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!
const X_BLOCKS_KEY = process.env.NEXT_PUBLIC_X_BLOCKS_KEY!

export async function uploadToS3(file: File) {
  // Step 1: Get pre-signed URL
  const res = await fetch(`${API_BASE}/uds/v1/Files/GetPreSignedUrlForUpload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-blocks-key': X_BLOCKS_KEY },
    body: JSON.stringify({ name: file.name, projectKey: X_BLOCKS_KEY }),
  })
  const { uploadUrl, fileId } = await res.json()

  // Step 2: PUT to S3
  await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: file,
  })

  return fileId
}
```

## Server Actions for Schema Management

```typescript
// src/actions/schema-actions.ts
'use server'
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!
const X_BLOCKS_KEY = process.env.NEXT_PUBLIC_X_BLOCKS_KEY!

export async function defineSchema(data: {
  collectionName: string
  schemaName: string
  fields: Array<{ name: string; type: string; isArray: boolean }>
}) {
  const res = await fetch(`${API_BASE}/uds/v1/schemas/define`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-blocks-key': X_BLOCKS_KEY },
    body: JSON.stringify({ ...data, projectKey: X_BLOCKS_KEY, schemaType: 1 }),
  })
  return res.json()
}
```

## Data Validation

Validation rules are enforced server-side when data is written through GraphQL. If validation fails, the GraphQL response contains an `errors` array:

```typescript
const result = await queryUds(CREATE_PRODUCT, { input: { name: '', price: -1 } })
if ('errors' in result) {
  // Handle validation errors
  console.error(result.errors)
}
```

## Key Patterns

- **Schema names** in GraphQL: PascalCase (e.g. `Product` → `getProducts`)
- **Field names** in GraphQL: match the schema field definitions exactly
- **projectKey** in REST calls: use `$X_BLOCKS_KEY` value, NOT `$PROJECT_SLUG`
- **reload-configuration** after any schema change: required before GraphQL reflects changes
