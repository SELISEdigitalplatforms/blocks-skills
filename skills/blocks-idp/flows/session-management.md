# Flow: session-management

## Trigger

User wants to build session visibility or logout functionality.

> "build logout"
> "show active sessions"
> "let users manage their sessions"
> "add logout from all devices"

---

## Pre-flight Questions

Before starting, confirm:

1. Is this a single-session logout or all-sessions logout (or both)?
2. Should the user see a list of their active sessions?
3. Where should the user be redirected after logout?

---

## Flow Steps

### Logout Current Session

Invalidate the current session by passing the refresh token to the logout endpoint.

```
Action: logout
Input:
  refreshToken = current REFRESH_TOKEN (from app state)
  ACCESS_TOKEN = required in Authorization header
```

```
On success (or 401) → clear ACCESS_TOKEN and REFRESH_TOKEN from app state
                    → clear any persisted auth storage (e.g. localStorage)
                    → redirect to /login
```

> Always clear tokens regardless of the response — even if the token was already expired, local state must be cleared.

---

### Logout All Sessions

Invalidate all active sessions for the user across all devices.

```
Action: logout-all
Input: ACCESS_TOKEN only (no body)
```

```
On success (or 401) → clear ACCESS_TOKEN and REFRESH_TOKEN from app state
                    → redirect to /login
```

Use this after:
- Password reset (security requirement)
- Suspicious activity detected
- "Sign out everywhere" button

---

### View Active Sessions

Fetch and display the user's active sessions.

```
Action: get-sessions
Input: ACCESS_TOKEN (no body or query params needed)
```

Display per session:
- Device / browser info
- IP address
- Last active timestamp
- Location (if available)

Provide a "Logout this device" button per row that calls the `logout` action for that session.

---

## Token Cleanup Checklist

On any logout path, always:
- [ ] Clear `ACCESS_TOKEN` from app state
- [ ] Clear `REFRESH_TOKEN` from app state
- [ ] Clear `auth-storage` from localStorage/sessionStorage
- [ ] Redirect to `/login`
- [ ] Do NOT call any further authenticated API calls after logout

---

## Error Handling

| Error | Cause | Action |
|-------|-------|--------|
| `logout` 401 | Token already expired | Still clear tokens and redirect — logout is complete |
| `logout-all` 401 | Token already expired | Still clear tokens and redirect |
| `get-sessions` 401 | Token expired | Run refresh-token then retry |

---

## Frontend Output

All hooks use React Query. See `flows/auth-setup.md` first for the project scaffold.

### Sessions Page

```
Create: src/pages/sessions/sessions-page.tsx
Key patterns:
  - useGetSessions(token, { page, pageSize }) → useQuery from auth-hooks.ts
  - Display per session: device, IP, last active, location
  - useLogout(token, clearTokens) → invalidate sessions query on success
  - useLogoutAll(token, clearTokens) → clear all tokens and redirect to /login
```

```tsx
// src/pages/sessions/sessions-page.tsx
"use client";

import { useAuth } from "@/contexts/auth-context";
import { useGetSessions, useLogout } from "@/lib/auth-hooks";

export function SessionsPage() {
  const { getAccessToken, clearTokens } = useAuth();
  const token = getAccessToken();

  const { data, isLoading } = useGetSessions(token, { pageSize: 20 });
  const logoutMutation = useLogout(token, clearTokens);

  const handleLogoutThisDevice = (sessionRefreshToken: string) => {
    logoutMutation.mutate(sessionRefreshToken);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Active Sessions</h2>
      <button
        onClick={() => {
          /* call logout-all */
        }}
      >
        Sign out of all devices
      </button>
      <ul>
        {data?.data?.map((session) => (
          <li key={session.itemId}>
            <span>{session.deviceInfo}</span>
            <span>{session.lastActive}</span>
            <button
              onClick={() => handleLogoutThisDevice(session.refreshToken)}
              disabled={logoutMutation.isPending}
            >
              Sign out
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Logout Button (Header)

```tsx
// src/components/header/logout-button.tsx
"use client";

import { useAuth } from "@/contexts/auth-context";

export function LogoutButton() {
  const { logout } = useAuth();
  return (
    <button onClick={logout}>
      Sign Out
    </button>
  );
}
```

### Hooks Used

| Hook | Type | Purpose |
|------|------|---------|
| `useGetSessions` | `useQuery` | Active sessions list |
| `useLogout` | `useMutation` | Logout current or specific session |

The `useLogout` hook from `auth-hooks.ts` calls the `logout` service function, clears the token store, and redirects to `/login`.

### Reference

- `flows/auth-setup.md` — Must be completed first
- `references/react-vite.md` — Full auth implementation with token refresh interceptor
- `references/nextjs-app-router.md` — Server Actions + middleware pattern
