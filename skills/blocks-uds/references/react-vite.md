# React SPA (Vite) — UDS Data Management

## Overview

This guide covers integrating UDS data management into a React SPA built with Vite.

## Setup

Install dependencies:
```bash
npm install @tanstack/react-query graphql-request
```

## Environment Variables

```env
# .env
VITE_API_BASE_URL=https://api.example.com
VITE_X_BLOCKS_KEY=your-project-key
VITE_PROJECT_SLUG=your-project-slug
```

## GraphQL Gateway Client

Create `src/lib/uds-gateway.ts`:

```typescript
const API_BASE = import.meta.env.VITE_API_BASE_URL
const PROJECT_SLUG = import.meta.env.VITE_PROJECT_SLUG
const X_BLOCKS_KEY = import.meta.env.VITE_X_BLOCKS_KEY

export async function queryUds<T = any>(
  query: string,
  variables?: Record<string, any>,
  accessToken?: string
): Promise<T> {
  const res = await fetch(`${API_BASE}/uds/v1/${PROJECT_SLUG}/gateway`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-blocks-key': X_BLOCKS_KEY,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (json.errors?.length) throw new Error(json.errors[0].message)
  return json.data
}
```

## React Query Hooks

```typescript
// src/hooks/use-products.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryUds } from '@/lib/uds-gateway'
import { useAuthStore } from '@/lib/use-auth-store'

const GET_PRODUCTS = `
  query GetProducts($page: Int, $pageSize: Int) {
    getProducts(page: $page, pageSize: $pageSize) {
      items { _id name price createdAt }
      totalCount
    }
  }
`

export function useProducts(page = 1, pageSize = 20) {
  const { accessToken } = useAuthStore()
  return useQuery({
    queryKey: ['products', page],
    queryFn: () => queryUds(GET_PRODUCTS, { page, pageSize }, accessToken ?? undefined),
  })
}

const CREATE_PRODUCT = `
  mutation CreateProduct($input: ProductInput!) {
    createProduct(input: $input) { _id name price }
  }
`

export function useCreateProduct() {
  const qc = useQueryClient()
  const { accessToken } = useAuthStore()
  return useMutation({
    mutationFn: (input: { name: string; price: number }) =>
      queryUds(CREATE_PRODUCT, { input }, accessToken ?? undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}
```

## File Upload with Progress

```typescript
// src/lib/file-upload.ts
const API_BASE = import.meta.env.VITE_API_BASE_URL
const X_BLOCKS_KEY = import.meta.env.VITE_X_BLOCKS_KEY

export async function uploadToS3(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  // Step 1: Get pre-signed URL
  const res1 = await fetch(`${API_BASE}/uds/v1/Files/GetPreSignedUrlForUpload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-blocks-key': X_BLOCKS_KEY },
    body: JSON.stringify({ name: file.name, projectKey: X_BLOCKS_KEY }),
  })
  const { uploadUrl, fileId } = await res1.json()

  // Step 2: Upload to S3 with progress
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress((e.loaded / e.total) * 100)
      }
    }
    xhr.onload = () => {
      if (xhr.status === 200) resolve(fileId)
      else reject(new Error('Upload failed'))
    }
    xhr.onerror = () => reject(new Error('Upload failed'))
    xhr.open('PUT', uploadUrl)
    xhr.setRequestHeader('Content-Type', 'application/octet-stream')
    xhr.send(file)
  })
}
```

## Schema Management Service

```typescript
// src/services/schema.service.ts
const API_BASE = import.meta.env.VITE_API_BASE_URL
const X_BLOCKS_KEY = import.meta.env.VITE_X_BLOCKS_KEY

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

export async function reloadConfiguration() {
  const res = await fetch(`${API_BASE}/uds/v1/configurations/reload?projectKey=${X_BLOCKS_KEY}`, {
    method: 'POST',
    headers: { 'x-blocks-key': X_BLOCKS_KEY },
  })
  return res.json()
}
```

## Key Patterns

- Use `useAuthStore` to get the current access token for GraphQL calls
- Always include `x-blocks-key` header on all REST and GraphQL requests
- Use `onProgress` callback with XMLHttpRequest for upload progress UI
- Invalidate React Query cache after create/update/delete mutations
- `projectKey` in REST bodies: use `$X_BLOCKS_KEY` value, NOT `$PROJECT_SLUG`
