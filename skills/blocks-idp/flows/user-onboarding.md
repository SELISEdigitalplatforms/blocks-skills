# Flow: user-onboarding

## Trigger

Admin wants to create a user and configure their access — roles, permissions, organization.

> "create a user and assign roles"
> "onboard a new team member"
> "add a user with specific permissions"
> "build user management / admin panel"

---

## Pre-flight Questions

Before starting, confirm:

1. Is this admin-created (admin does it) or self-registration (user does it)? *(if self-registration, use `user-registration` flow)*
2. Which roles should be assigned? *(get existing role list first)*
3. Should the user be assigned to an organization?
4. Is MFA required for this user?
5. Should an activation email be sent? *(always yes unless userPassType=Plain and password is pre-set)*

---

## Flow Steps

### Step 1 — Get Available Roles (pre-fill role selector)

Before showing the create-user form, fetch the list of available roles.

```
Action: get-roles
Input:
  page       = 1
  pageSize   = 100
  projectKey = X_BLOCKS_KEY
```

Use the response to populate a role multi-select in the form.

---

### Step 2 — Get Organizations (if applicable)

If the project uses organizations, fetch the list to populate an org selector.

```
Action: get-organizations
```

---

### Step 3 — Create User

```
Action: create-user
Input:
  email            = user's email (required, must be unique)
  firstName        = optional
  lastName         = optional
  userCreationType = "AdminCreated"
  userPassType     = "Plain" (if setting password) or omit (activation email will be sent)
  password         = only if userPassType is Plain
  mfaEnabled       = true/false based on pre-flight answer
  allowedLogInType = ["Email"] or as configured
  organizationId   = org ID if applicable
  projectKey       = X_BLOCKS_KEY
```

```
On success (isSuccess: true) → continue to Step 4
On 400 (duplicate email)    → show "This email is already registered"
On 401                      → run refresh-token then retry
```

---

### Step 4 — Assign Roles

Assign selected roles to the newly created user.

```
Action: set-roles
Input:
  userId     = ID of the user created in Step 3
  roles      = array of role slugs selected in form
  projectKey = X_BLOCKS_KEY
```

```
On success → roles assigned
On 400     → invalid role slugs — verify roles exist via get-roles
```

> Note: `set-roles` **replaces** all existing roles. If adding to existing roles, first call `get-user-roles` and merge the arrays.

---

### Step 5 — Confirm and Notify

After user is created and roles assigned:
- Show success state in the UI
- The backend automatically sends an activation email to the user
- The user activates their account via the `user-registration` flow (Step 3 onward)

---

## Viewing and Managing Users

### List users
```
Action: get-users
Input:
  page            = 1
  pageSize        = 20
  sort.property   = "createdDate"
  sort.isDescending = true
  filter.name     = search term (optional)
  filter.status   = "Active" | "Inactive" (optional)
  projectKey      = X_BLOCKS_KEY
```

### Get single user
```
Action: get-user
Input: userId (query param)
```

### Update user details
```
Action: update-user
Input: userId + fields to update + projectKey
```

### Deactivate user
```
Action: deactivate-user
Input: userId + projectKey
```

---

## Error Handling

| Error | Cause | Action |
|-------|-------|--------|
| `create-user` 400 | Duplicate email | Show "Email already registered" |
| `create-user` 400 | Weak password | Show password strength requirements |
| `set-roles` 400 | Invalid role slug | Verify against get-roles response |
| `get-roles` 401 | Token expired | Run refresh-token then retry |

---

## Frontend Output

All hooks use React Query (`useMutation`, `useQuery`). See `flows/auth-setup.md` first for the project scaffold.

### User List Page

```
Create: src/pages/users/users-page.tsx
Key patterns:
  - useGetUsers(token, { page, pageSize, filter }) → returns { data, isLoading, totalCount }
  - useDeactivateUser(token, onSuccess) → invalidate users query on success
  - Table with columns: name, email, status, MFA, created date, actions
  - Pagination: prev/next buttons or page selector
  - Search: debounced input → filter by name/email
  - Deactivate button → confirm dialog → useDeactivateUser.mutate(userId)
```

```tsx
// src/pages/users/users-page.tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useGetUsers, useDeactivateUser } from "@/lib/auth-hooks";

export function UsersPage() {
  const { getAccessToken } = useAuth();
  const token = getAccessToken();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);

  const { data, isLoading } = useGetUsers(token, {
    page,
    pageSize: 20,
    filter: debouncedSearch ? { name: debouncedSearch } : undefined,
  });

  const deactivate = useDeactivateUser(token, () => {
    // toast.success("User deactivated");
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <input
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
            <th>MFA</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data?.data?.map((user) => (
            <tr key={user.itemId}>
              <td>{user.firstName} {user.lastName}</td>
              <td>{user.email}</td>
              <td>{user.active ? "Active" : "Inactive"}</td>
              <td>{user.mfaEnabled ? "Enabled" : "Disabled"}</td>
              <td>
                <button
                  onClick={() => deactivate.mutate(user.itemId)}
                  disabled={deactivate.isPending}
                >
                  Deactivate
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
        <span>Page {page}</span>
        <button onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  );
}
```

### Create User Form

```
Create: src/pages/users/create-user-page.tsx
Key patterns:
  - useGetRoles(token) → populate role multi-select
  - useOrganizations(token) → populate org selector (if applicable)
  - useCreateUser(token, onSuccess) → navigate to user list on success
  - useSetUserRoles(token, onSuccess) → set roles after user creation
  - Show field errors from response.errors
```

```tsx
// src/pages/users/create-user-page.tsx
"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { useGetRoles, useOrganizations, useCreateUser, useSetUserRoles } from "@/lib/auth-hooks";

export function CreateUserPage() {
  const { getAccessToken } = useAuth();
  const token = getAccessToken();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    userCreationType: 4, // AdminCreated
    allowedLogInType: [0], // Email
  });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: rolesData } = useGetRoles(token);
  const { data: orgsData } = useOrganizations(token);

  const createUser = useCreateUser(token, (res) => {
    if (!res.isSuccess) {
      setErrors(res.errors ?? {});
      return;
    }
    if (selectedRoles.length > 0) {
      setUserRoles.mutate({ userId: res.itemId, roles: selectedRoles });
    }
    navigate("/users");
  });

  const setUserRoles = useSetUserRoles(token);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate({
      ...form,
      organizationId: selectedOrg || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {errors.general && <p className="error">{errors.general}</p>}
      <input
        name="email"
        type="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        placeholder="Email"
        required
      />
      <input
        name="firstName"
        value={form.firstName}
        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
        placeholder="First Name"
      />
      <input
        name="lastName"
        value={form.lastName}
        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
        placeholder="Last Name"
      />

      {rolesData?.data && (
        <select
          multiple
          onChange={(e) =>
            setSelectedRoles(Array.from(e.target.selectedOptions, (o) => o.value))
          }
        >
          {rolesData.data.map((role) => (
            <option key={role.itemId} value={role.slug}>
              {role.name}
            </option>
          ))}
        </select>
      )}

      {orgsData?.organizations && (
        <select
          value={selectedOrg}
          onChange={(e) => setSelectedOrg(e.target.value)}
        >
          <option value="">No Organization</option>
          {orgsData.organizations.map((org) => (
            <option key={org.itemId} value={org.itemId}>
              {org.name}
            </option>
          ))}
        </select>
      )}

      <button type="submit" disabled={createUser.isPending}>
        {createUser.isPending ? "Creating..." : "Create User"}
      </button>
    </form>
  );
}
```

### Route Setup

```
Update: src/App.tsx
Add:
  - /users → UsersPage
  - /users/create → CreateUserPage
  - Both protected (inside ProtectedRoute)
```

```tsx
// src/App.tsx (additions)
<Route
  path="/users"
  element={
    <ProtectedRoute>
      <UsersPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/users/create"
  element={
    <ProtectedRoute>
      <CreateUserPage />
    </ProtectedRoute>
  }
/>
```

### Hooks Used

All hooks are from `src/lib/auth-hooks.ts` (created in `flows/auth-setup.md`):

| Hook | Type | Purpose |
|------|------|---------|
| `useGetUsers` | `useQuery` | Paginated user list |
| `useGetUser` | `useQuery` | Single user by ID |
| `useCreateUser` | `useMutation` | Create new user |
| `useUpdateUser` | `useMutation` | Update user details |
| `useDeactivateUser` | `useMutation` | Deactivate user |
| `useGetRoles` | `useQuery` | Role list for selector |
| `useSetUserRoles` | `useMutation` | Assign roles to user |
| `useOrganizations` | `useQuery` | Organization list |

### Reference

- `flows/auth-setup.md` — Must be completed first
- `contracts.md` — CreateUserRequest, UpdateUserRequest, GetUsersRequest schemas
- `references/react-vite.md` — Full auth implementation with axios interceptor
