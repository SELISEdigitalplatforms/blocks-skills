# Bridge Strategies: Migrating from Legacy UDS

## Overview

This guide covers common patterns when migrating from legacy UDS integrations to the new blocks-uds skill conventions.

## Key Breaking Changes

### 1. `projectKey` in Body

Legacy implementations often passed `$PROJECT_SLUG` in request bodies. The correct value is `$X_BLOCKS_KEY`.

```typescript
// Legacy (WRONG)
const body = { projectKey: '$PROJECT_SLUG', ... }

// Correct
const body = { projectKey: '$X_BLOCKS_KEY', ... }
```

### 2. Pre-signed URL Response Shape

Legacy implementations expected `data.uploadUrl`. The correct response is direct:

```typescript
// Legacy (WRONG)
const { uploadUrl, fileId } = response.data

// Correct
const { uploadUrl, fileId } = response  // Direct, not wrapped in data
```

### 3. Schema Type Values

Legacy used string values. Now uses integers:

```typescript
// Legacy (WRONG)
{ schemaType: "Entity" }
{ schemaType: "Collection" }

// Correct
{ schemaType: 1 }  // Entity
{ schemaType: 2 }  // Dto
```

### 4. Access Level Values

```typescript
// Legacy (WRONG)
{ accessLevel: "Public" }
{ accessLevel: "Custom" }

// Correct
{ accessLevel: 0 }  // Public
{ accessLevel: 1 }  // User
{ accessLevel: 2 }  // Custom
```

### 5. File Delete Method

```typescript
// Legacy (WRONG)
fetch(`/api/files/delete?fileId=${fileId}`)

// Correct
fetch('/uds/v1/Files/DeleteFile', {
  method: 'POST',
  body: JSON.stringify({ fileId, projectKey: '$X_BLOCKS_KEY' })
})
```

### 6. GraphQL Endpoint Path

```typescript
// Legacy (WRONG)
POST /uds/v1/graphql
POST /uds/graphql

// Correct
POST /uds/v1/$PROJECT_SLUG/gateway
```

### 7. Validation Type Values

```typescript
// Legacy (WRONG)
{ type: "Required" }
{ type: "Email" }
{ type: "Unique" }

// Correct
{ type: 0 }  // Required
{ type: 1 }  // Email
{ type: 7 }  // Unique
```

## Migration Checklist

- [ ] Replace all `$PROJECT_SLUG` with `$X_BLOCKS_KEY` in REST request bodies
- [ ] Update pre-signed URL response parsing: `response.uploadUrl` instead of `response.data.uploadUrl`
- [ ] Update schema type: `"Entity"` → `1`, `"Dto"` → `2`
- [ ] Update access level: `"Public"` → `0`, `"User"` → `1`, `"Custom"` → `2`
- [ ] Update file delete: query params → POST body
- [ ] Update GraphQL endpoint: `/graphql` → `/uds/v1/$PROJECT_SLUG/gateway`
- [ ] Update validation types: string → integer (0-11)
- [ ] Add `x-blocks-key` header to all requests
- [ ] Add `Authorization: Bearer` header for authenticated requests
- [ ] Add `reload-configuration` call after schema/data-source changes

## Compatibility Layer Pattern

If migrating gradually, use a compatibility layer:

```typescript
// src/lib/uds-compat.ts
function compatBody(body: Record<string, any>) {
  return {
    ...body,
    projectKey: body.projectKey === process.env.PROJECT_SLUG
      ? process.env.X_BLOCKS_KEY
      : body.projectKey
  }
}

function compatUrlResponse(response: any) {
  // Handle both direct and wrapped responses
  return {
    uploadUrl: response.uploadUrl ?? response.data?.uploadUrl,
    fileId: response.fileId ?? response.data?.fileId,
    isSuccess: response.isSuccess ?? response.data?.isSuccess
  }
}
```

## Step-by-Step Migration Plan

### Phase 1: Endpoint Updates
1. Update GraphQL endpoint URL
2. Add `x-blocks-key` header everywhere
3. Verify all REST calls use correct base URL

### Phase 2: Request Body Updates
1. Replace `$PROJECT_SLUG` with `$X_BLOCKS_KEY` in bodies
2. Update integer enums (schemaType, accessLevel, validationType)
3. Update file delete to use POST body

### Phase 3: Response Handling
1. Update pre-signed URL response parsing
2. Update all response field name references

### Phase 4: Testing
1. Test all GraphQL CRUD operations
2. Test file upload/download flows
3. Test access policy enforcement
4. Verify validation rules fire correctly

## Common Errors

| Legacy Error | Cause | Fix |
|-------------|-------|-----|
| `Fields_Are_Required` even with fields | Wrong `projectKey` value | Use `$X_BLOCKS_KEY` |
| `data.uploadUrl` undefined | Response shape changed | Use top-level `uploadUrl` |
| GraphQL `Cannot query field` | Wrong endpoint or no reload | Use `/uds/v1/$PROJECT_SLUG/gateway` + reload |
| File delete 404 | Method changed from GET to POST | Use POST with body |
| All access denied on Custom | No policies created | Create at least one policy |
