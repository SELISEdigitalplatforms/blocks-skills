# Manage the storage object tree

Directories and files share one permission-aware tree. Use `data.objects` for discovery, trash, sharing, and access; use `data.directories` and `data.files` for mutations specific to each resource type.

## Browse and search

```ts
const page = await blocksClient.data.objects.list({
  parentDirectoryId,
  type: "file", // optional: "file" | "directory"
  limit: 50,
  cursor,
});

const matches = await blocksClient.data.objects.search({
  query: "invoice",
  directoryId: parentDirectoryId, // optional search scope
  limit: 50,
  cursor,
});
```

The response has `items`, `nextCursor`, `hasMore`, and `totalChildCount`. Treat `cursor` as opaque. The general limit range is 1–200 and defaults to 50. Permission filtering can make a page shorter than the requested limit while `hasMore` is still true.

Each item is discriminated by lowercase `type: "directory" | "file"` and includes a `permissions` object. Use those flags for UI affordances, then handle authorization failures because access may change between render and mutation.

Raw routes:

- `GET /data/v4/objects/get-objects`
- `GET /data/v4/objects/search-objects`
- `GET /data/v4/objects/get-shared-objects`
- `GET /data/v4/objects/get-trash`

`get-shared-objects` excludes objects owned by the caller and includes direct or inherited Allow grants for their user, roles, or organization.

## Directories

```ts
const created = await blocksClient.data.directories.create({
  name: "Invoices",
  parentDirectoryId,
  description: "Approved invoices",
  allowedFileExtensions: ["pdf", "png"],
  configurationName: "Default",
  moduleName: 8,
});

await blocksClient.data.directories.update({
  directoryId,
  name: "Paid invoices",
  description: "Paid and archived",
});

await blocksClient.data.directories.move({
  directoryId,
  targetDirectoryId,
});

await blocksClient.data.directories.delete({
  directoryId,
  permanent: false,
});
```

Directory names are trimmed, 1–255 characters, and cannot be `.`, `..`, or contain `/` or `\\`. Descriptions are at most 2,000 characters. A directory's extension allow-list is enforced when uploading, copying, or moving files into it.

Default directories cannot be renamed, moved, or deleted. Root-directory creation is an owner-only internal operation, not a normal application action.

A directory must be empty before permanent deletion. Soft deletion may archive a populated subtree according to the service's trash behavior.

## File mutations and versions

```ts
await blocksClient.data.files.rename({ fileId, name: "invoice-final.pdf" });
await blocksClient.data.files.move({ fileId, targetDirectoryId });
await blocksClient.data.files.copy({
  fileId,
  targetDirectoryId,
  copyAccessPolicies: false,
});

const versions = await blocksClient.data.files.versions({
  fileId,
  limit: 25,
  cursor,
});
```

File names need an allowed extension and must be unique within the destination directory. A copy requires View on the source and Edit on the target. A move requires Delete on the source and Edit on the target. Version-page limits are 1–100, default 25.

## Trash, restore, and permanent deletion

Soft deletion preserves the original parent for restore:

```ts
await blocksClient.data.files.delete({ fileId, permanent: false });
await blocksClient.data.directories.delete({ directoryId, permanent: false });

const trash = await blocksClient.data.objects.trash({ limit: 50, cursor });
await blocksClient.data.objects.restore({ resourceId });
await blocksClient.data.objects.deleteFromTrash({ resourceId });
```

The backend delete DTO defaults `permanent` to `true`. Always send it explicitly. Prefer `false` in interactive workflows. Purging from trash is destructive and should require confirmation.

CLI equivalents include:

```bash
blocks data files list --parent-id '<id>'
blocks data files search invoice
blocks data files trash
blocks data files restore '<resourceId>'
blocks data files purge '<resourceId>'
blocks data files directory-create Invoices --parent-id '<id>'
blocks data files directory-delete '<id>'       # soft delete by default
blocks data files delete '<fileId>'              # soft delete by default
```

Run each command with `--help` before scripting it, especially destructive operations.

## Permissions and inheritance

Permissions are ordered. Higher levels include the capabilities below them:

`View` → `Download` → `Edit` → `Delete` → `Manage` → `Owner`

Policy values must use these exact JSON strings:

- resource type: `Directory` or `File`
- principal type: `User`, `Role`, `Everyone`, or `Organization`
- effect: `Allow` or `Deny`
- permission: one of the ordered values above

Grant a policy:

```ts
await blocksClient.data.objects.grantAccess({
  resourceId,
  resourceType: "Directory",
  principalType: "Role",
  principalId: roleId,
  permission: "Edit",
  effect: "Allow",
  expiresAt: "2026-12-31T23:59:59Z", // optional
});
```

List and inspect effective access:

```ts
const direct = await blocksClient.data.objects.accessPolicies(resourceId);
const effective = await blocksClient.data.objects.resolveAccess(resourceId);
```

`get-access-policies` currently returns direct entries. Its request model exposes `includeInherited`, but the controller does not apply that value; use `resolveAccess` for inherited/effective permissions.

Update or revoke a policy using its item id:

```ts
await blocksClient.data.objects.updateAccess({
  policyItemId,
  resourceId,
  resourceType: "Directory",
  principalType: "Role",
  principalId: roleId,
  permission: "Download",
  effect: "Allow",
});

await blocksClient.data.objects.revokeAccess({ policyItemId, resourceId });
```

Policy changes require Manage. A Deny entry targeting the owner is rejected.

Children inherit ancestor access while `inheritsParentAccess` is true. Turning inheritance off requires a direct Allow on that resource so it does not become inaccessible:

```ts
await blocksClient.data.objects.toggleInheritance({
  resourceId,
  inheritsParentAccess: false,
});
```

## Share shortcut

`share` creates the appropriate access grant through a simpler intent-level operation:

```ts
await blocksClient.data.objects.share({
  resourceId,
  resourceType: "File",
  principalType: "User",
  principalId: userId,
  permission: "Download",
});
```

Use `Everyone` or `Organization` only when the product explicitly calls for that audience. Omit `principalId` for `Everyone`; `Organization`, like `User` and `Role`, requires the target principal id.

## Authorization failures

Object checks are in addition to endpoint authorization. Hidden reads may return 404 instead of 403 to avoid disclosing that an id exists. Treat both as a possible stale-access condition, invalidate the relevant query, and avoid exposing internal authorization details to end users.
