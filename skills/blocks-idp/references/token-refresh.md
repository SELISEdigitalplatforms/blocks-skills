# Token Refresh Reference

Automatic access token refresh strategy for SPAs. Covers when to refresh, how to prevent race conditions, token storage options, and implementation patterns for common frameworks.

See `actions/refresh-token.md` for the refresh token endpoint contract. See `actions/get-token.md` for the token endpoint contract. See `actions/logout.md` for logout endpoint behavior during refresh failure.

---

## Why Token Refresh Matters

Access tokens have a short lifetime (typically minutes). Refresh tokens have a longer lifetime (hours to days). When the access token expires, the client must use the refresh token to obtain a new one without forcing the user to log in again.

| Token | Lifetime | Purpose |
|-------|----------|---------|
| Access token | Minutes (e.g., 8,000 seconds) | Authorize API requests |
| Refresh token | Hours to days | Obtain new access tokens |

If the client does not refresh proactively, API calls return 401 and the user is suddenly logged out. A good refresh strategy prevents this.

---

## When to Trigger Refresh

There are two complementary strategies:

### Proactive Refresh — Before Expiry

Check the token expiry before every request. Refresh if the token is within the buffer window (e.g., 30 seconds of expiry).

```typescript
function isTokenExpiringSoon(expiresAt: number, bufferMs = 30_000): boolean {
  return Date.now() >= expiresAt - bufferMs
}

async function getValidAccessToken(): Promise<string> {
  const { accessToken, expiresAt } = tokenStorage.get()

  if (accessToken && !isTokenExpiringSoon(expiresAt)) {
    return accessToken
  }

  // Token is missing or expiring soon — refresh
  const tokens = await refreshAccessToken(tokenStorage.get().refreshToken)
  tokenStorage.set({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresIn: tokens.expires_in,
  })

  return tokens.access_token
}
```

### Reactive Refresh — On 401

If an API call returns 401, refresh the token and retry the original request. This catches edge cases where the proactive check failed (e.g., clock skew, token invalidated server-side).

```typescript
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        await ensureValidToken()
        const { accessToken } = tokenStorage.get()
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return axiosClient(originalRequest)
      } catch {
        tokenStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)
```

Use both strategies together. Proactive refresh prevents 401s in normal operation. Reactive refresh handles edge cases.

---

## Single Refresh Promise Pattern

The most common bug in token refresh implementations is concurrent refresh race conditions.

Without the pattern:
```
Request A fails with 401 → triggers refresh (call 1)
Request B fails with 401 → triggers refresh (call 2) before call 1 completes
Both refresh calls may invalidate each other's refresh tokens
Request A retries with new token — succeeds
Request B retries with old token — fails with 401
User is logged out unexpectedly
```

With the single promise pattern:
```
Request A fails with 401 → triggers refresh, sets refreshPromise
Request B fails with 401 → sees refreshPromise exists, awaits it
Refresh completes, both requests retry with the new token
Both succeed
```

```typescript
// src/lib/token-refresh.ts
let refreshPromise: Promise<void> | null = null

async function ensureValidToken(): Promise<string> {
  const { accessToken, expiresAt, refreshToken } = tokenStorage.get()

  if (!refreshToken) {
    throw new Error('No refresh token available')
  }

  // Proactive: refresh if expiring soon
  if (!accessToken || Date.now() >= expiresAt - 30_000) {
    if (!refreshPromise) {
      refreshPromise = doRefresh()
        .finally(() => {
          refreshPromise = null
        })
    }
    await refreshPromise
  }

  const { accessToken: token } = tokenStorage.get()
  if (!token) throw new Error('Token unavailable after refresh')
  return token
}

async function doRefresh(): Promise<void> {
  const { refreshToken } = tokenStorage.get()
  if (!refreshToken) return

  const tokens = await refreshAccessToken(refreshToken)
  tokenStorage.set({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresIn: tokens.expires_in,
  })
}
```

The `refreshPromise` singleton ensures only one refresh runs at a time. All concurrent refresh attempts share the same promise.

See the React Vite reference (`references/react-vite.md`) for the complete Axios interceptor implementation using this pattern.

---

## Token Storage Strategies

### sessionStorage (Recommended for SPAs)

Tokens survive page refresh but are cleared when the tab is closed. Good balance between persistence and security.

```typescript
// src/lib/storage.ts
const ACCESS_TOKEN_KEY = 'blocks_access_token'
const REFRESH_TOKEN_KEY = 'blocks_refresh_token'
const EXPIRES_AT_KEY = 'blocks_expires_at'

export const tokenStorage = {
  get() {
    return {
      accessToken: sessionStorage.getItem(ACCESS_TOKEN_KEY),
      refreshToken: sessionStorage.getItem(REFRESH_TOKEN_KEY),
      expiresAt: Number(sessionStorage.getItem(EXPIRES_AT_KEY)),
    }
  },

  set(data: { accessToken: string; refreshToken: string; expiresIn: number }) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken)
    sessionStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken)
    sessionStorage.setItem(EXPIRES_AT_KEY, String(Date.now() + data.expiresIn * 1000))
  },

  clear() {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY)
    sessionStorage.removeItem(REFRESH_TOKEN_KEY)
    sessionStorage.removeItem(EXPIRES_AT_KEY)
  },
}
```

### In-Memory Only

Tokens live in a JavaScript variable. Lost on page close, page reload from new tab, or browser refresh in some cases. Most secure against XSS but worst for user experience.

```typescript
// src/lib/in-memory-auth.ts
let accessToken: string | null = null
let refreshToken: string | null = null
let expiresAt: number = 0

export const authStore = {
  get() {
    return { accessToken, refreshToken, expiresAt }
  },
  set(data: { accessToken: string; refreshToken: string; expiresIn: number }) {
    accessToken = data.accessToken
    refreshToken = data.refreshToken
    expiresAt = Date.now() + data.expires_in * 1000
  },
  clear() {
    accessToken = null
    refreshToken = null
    expiresAt = 0
  },
}
```

### httpOnly Cookie (Most Secure)

The backend sets the cookie on the token response. The browser sends it automatically with every request. JavaScript cannot read or write it, making it immune to XSS token theft.

The backend must configure this. On the client side, the cookie is sent automatically by the browser:

```typescript
function getAccessTokenFromCookie(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)blocks_session=([^;]+)/)
  if (!match) return null
  try {
    const session = JSON.parse(decodeURIComponent(match[1]))
    return session.accessToken
  } catch {
    return null
  }
}
```

Choose based on your security requirements and infrastructure:

| Strategy | XSS Risk | Tab Persistence | Backend Required |
|----------|----------|-----------------|------------------|
| sessionStorage | Vulnerable | Yes | No |
| In-memory | Immune | No | No |
| httpOnly cookie | Immune | Yes | Yes |

---

## Refresh Token Rotation

Each refresh token can only be used once. The refresh response contains a new refresh token. Always store the new refresh token immediately.

```typescript
async function refreshAccessToken(refreshToken: string) {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  const res = await fetch(`${API_BASE}/idp/v1/Authentication/Token`, {
    method: 'POST',
    headers: {
      'x-blocks-key': X_BLOCKS_KEY,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!res.ok) {
    if (res.status === 400) {
      // Refresh token expired or revoked
      tokenStorage.clear()
      window.location.href = '/login'
      throw new Error('Session expired')
    }
    throw new Error(`Refresh failed: ${res.status}`)
  }

  const data = await res.json()

  tokenStorage.set({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  })

  return data
}
```

See `actions/refresh-token.md` for the full endpoint contract.

---

## Logout on Refresh Failure

When the refresh token is expired, revoked, or otherwise invalid, the user's session cannot be restored. Log the user out and redirect to login.

```typescript
async function ensureValidToken(): Promise<string> {
  const { accessToken, expiresAt, refreshToken } = tokenStorage.get()

  if (!refreshToken) {
    window.location.href = '/login'
    throw new Error('No refresh token')
  }

  if (accessToken && Date.now() < expiresAt - 30_000) {
    return accessToken
  }

  try {
    if (!refreshPromise) {
      refreshPromise = doRefresh()
        .catch((err) => {
          tokenStorage.clear()
          window.location.href = '/login'
          throw err
        })
        .finally(() => {
          refreshPromise = null
        })
    }
    await refreshPromise

    const { accessToken: token } = tokenStorage.get()
    if (!token) throw new Error('Token unavailable')
    return token
  } catch (err) {
    tokenStorage.clear()
    window.location.href = '/login'
    throw err
  }
}
```

Always call the logout endpoint when clearing the session to invalidate the refresh token server-side:

```typescript
async function logout(): Promise<void> {
  const { accessToken, refreshToken } = tokenStorage.get()
  tokenStorage.clear()

  if (refreshToken && accessToken) {
    await fetch(`${API_BASE}/idp/v1/Authentication/Logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'x-blocks-key': X_BLOCKS_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => {
      // Ignore — we already cleared local storage
    })
  }
}
```

See `actions/logout.md` for the logout endpoint contract.

---

## Axios Interceptor Implementation

The complete implementation combining proactive refresh, reactive 401 handling, and the single promise pattern:

```typescript
// src/lib/api/axios-client.ts
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { tokenStorage } from '@/lib/token-storage'

const X_BLOCKS_KEY = import.meta.env.VITE_X_BLOCKS_KEY
const API_BASE = import.meta.env.VITE_API_BASE_URL

let refreshPromise: Promise<void> | null = null

async function refreshTokens(): Promise<void> {
  const { refreshToken } = tokenStorage.get()
  if (!refreshToken) throw new Error('No refresh token')

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  const res = await fetch(`${API_BASE}/idp/v1/Authentication/Token`, {
    method: 'POST',
    headers: {
      'x-blocks-key': X_BLOCKS_KEY,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!res.ok) {
    tokenStorage.clear()
    window.location.href = '/login'
    throw new Error('Token refresh failed')
  }

  const data = await res.json()
  tokenStorage.set({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  })
}

async function ensureValidToken(): Promise<string> {
  const { accessToken, expiresAt, refreshToken } = tokenStorage.get()

  if (accessToken && refreshToken && Date.now() < expiresAt - 30_000) {
    return accessToken
  }

  if (!refreshPromise) {
    refreshPromise = refreshTokens()
      .catch(() => {
        tokenStorage.clear()
        window.location.href = '/login'
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  await refreshPromise
  const { accessToken: token } = tokenStorage.get()
  if (!token) throw new Error('Token unavailable')
  return token
}

export const axiosClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'x-blocks-key': X_BLOCKS_KEY,
    'Content-Type': 'application/json',
  },
})

axiosClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await ensureValidToken()
  config.headers.Authorization = `Bearer ${token}`
  return config
})

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        await ensureValidToken()
        const { accessToken } = tokenStorage.get()
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return axiosClient(originalRequest)
      } catch {
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)
```

See `references/react-vite.md` for the full React context integration with this interceptor.

---

## React Query / SWR Pattern

React Query and SWR handle caching and revalidation automatically. Handle 401 by intercepting the error and refreshing before retrying.

```typescript
// src/lib/query-provider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { tokenStorage } from '@/lib/token-storage'
import { refreshAccessToken } from '@/lib/api/auth'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.status === 401) return false
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: async (error: any) => {
        if (error?.status === 401) {
          try {
            const { refreshToken } = tokenStorage.get()
            if (refreshToken) {
              const tokens = await refreshAccessToken(refreshToken)
              tokenStorage.set({
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiresIn: tokens.expires_in,
              })
              queryClient.invalidateQueries()
            }
          } catch {
            tokenStorage.clear()
            window.location.href = '/login'
          }
        }
      },
    },
  },
})

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

SWR with automatic revalidation:

```typescript
// src/lib/swr-config.ts
import { SWRConfiguration } from 'swr'
import { tokenStorage } from '@/lib/token-storage'
import { refreshAccessToken } from '@/lib/api/auth'

export const swrConfig: SWRConfiguration = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  shouldRetryOnError: false,

  onError: async (error) => {
    if (error.status === 401) {
      try {
        const { refreshToken } = tokenStorage.get()
        if (refreshToken) {
          const tokens = await refreshAccessToken(refreshToken)
          tokenStorage.set({
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresIn: tokens.expires_in,
          })
          return true // SWR will revalidate automatically
        }
      } catch {
        tokenStorage.clear()
        window.location.href = '/login'
      }
    }
    return false
  },
}
```

---

## Silent Refresh — iframe Pattern

Silent refresh uses a hidden iframe to obtain a new access token without a page reload. This was historically used for cross-origin token refresh. Modern browsers block third-party cookies, making this unreliable. Use the proactive request interceptor pattern instead.

For same-origin setups where the identity provider and SPA share a domain, silent refresh can still work:

```typescript
// src/lib/silent-refresh.ts
async function silentRefresh(): Promise<void> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'

    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error('Silent refresh timeout'))
    }, 10_000)

    function cleanup() {
      clearTimeout(timeout)
      iframe.remove()
      window.removeEventListener('message', messageHandler)
    }

    function messageHandler(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      if (event.data?.type === 'silent_refresh_success') {
        cleanup()
        resolve()
      } else if (event.data?.type === 'silent_refresh_error') {
        cleanup()
        reject(new Error('Silent refresh failed'))
      }
    }

    window.addEventListener('message', messageHandler)

    iframe.src = `/silent-refresh.html?state=${generateState()}`
    document.body.appendChild(iframe)
  })
}
```

The `/silent-refresh.html` page performs the token exchange and posts the result back to the parent window.

---

## Tab Visibility API for Background Refresh

Use the Page Visibility API to refresh the token when the user returns to the tab after being away:

```typescript
// src/lib/visibility-refresh.ts
import { tokenStorage } from '@/lib/token-storage'
import { refreshAccessToken } from '@/lib/api/auth'

const BUFFER_MS = 30_000

function needsRefresh(): boolean {
  const { expiresAt } = tokenStorage.get()
  return Date.now() >= expiresAt - BUFFER_MS
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && needsRefresh()) {
    const { refreshToken } = tokenStorage.get()
    if (refreshToken) {
      refreshAccessToken(refreshToken)
        .then((tokens) => {
          tokenStorage.set({
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresIn: tokens.expires_in,
          })
        })
        .catch(() => {
          tokenStorage.clear()
          window.location.href = '/login'
        })
    }
  }
})
```

This ensures the token is fresh when the user returns to the app after a period of inactivity, preventing the first API call from returning 401.

---

## Token Refresh — Checklist

- [ ] Store tokens after every successful authentication and refresh
- [ ] Always replace the old refresh token with the new one from the response
- [ ] Implement the single promise pattern to prevent concurrent refresh race conditions
- [ ] Use a 30-second proactive buffer before the token expiry
- [ ] Handle 401 responses by refreshing and retrying the original request
- [ ] Redirect to login on refresh failure (refresh token expired or revoked)
- [ ] Call the logout endpoint when clearing the session
- [ ] Use the visibility API to refresh on tab return
- [ ] Never store tokens in localStorage (vulnerable to XSS)
- [ ] Consider httpOnly cookies for maximum security in production
