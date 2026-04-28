# React SPA with Vite — Identity & Access Implementation Guide

This guide covers integrating blocks-idp into a React Single Page Application built with Vite. It covers Axios for HTTP with automatic 401 handling, token storage strategies, an AuthContext, and route protection.

---

## Environment Variables

Create a `.env` file at the project root:

```env
VITE_API_BASE_URL=https://api.seliseblocks.com
VITE_X_BLOCKS_KEY=your-project-key
VITE_OIDC_CLIENT_ID=your-client-id
VITE_OIDC_REDIRECT_URI=http://localhost:5173/auth/callback
```

Use the `VITE_` prefix for environment variables in Vite projects. All prefixed variables are embedded at build time. Do not store access tokens or refresh tokens in environment variables.

---

## Token Storage

There are three common strategies, ordered by security level:

### 1. httpOnly Cookie (recommended for production)

The backend sets an httpOnly cookie on the token exchange response. The browser automatically sends it with every request. This is the most secure option because JavaScript can never read the token.

```typescript
// The backend must set the cookie on the token endpoint response.
// Client-side: no manual storage needed. Axios interceptor reads from document.cookie.
function getAccessToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)blocks_session=([^;]+)/)
  return match ? JSON.parse(decodeURIComponent(match[1])).accessToken : null
}
```

### 2. sessionStorage (good balance for SPAs)

Tokens survive page refresh but are cleared when the tab closes. Tokens are accessible to XSS attacks.

```typescript
// src/lib/token-storage.ts
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

### 3. In-Memory Only (least persistent, most secure against XSS)

Tokens are kept in a JavaScript variable. They survive page refresh if the tab is not closed. They are lost on page reload from a new tab or after closing the tab. This is the most secure against XSS but provides a poor user experience.

```typescript
// src/lib/auth-store.ts
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
    expiresAt = Date.now() + data.expiresIn * 1000
  },
  clear() {
    accessToken = null
    refreshToken = null
    expiresAt = 0
  },
}
```

This guide uses `sessionStorage` for the examples. Replace with httpOnly cookies or in-memory if your security requirements differ.

---

## Token API Helpers

```typescript
// src/lib/api/auth.ts
const API_BASE = import.meta.env.VITE_API_BASE_URL
const X_BLOCKS_KEY = import.meta.env.VITE_X_BLOCKS_KEY

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  id_token: string | null
}

export interface MfaRequiredResponse {
  enable_mfa: true
  mfaType: 'email' | 'authenticator'
  mfaId: string
  message: string
}

export type AuthResponse = TokenResponse | MfaRequiredResponse

export const isMfaResponse = (res: AuthResponse): res is MfaRequiredResponse =>
  (res as MfaRequiredResponse).enable_mfa === true

export async function loginWithPassword(
  username: string,
  password: string
): Promise<AuthResponse> {
  const params = new URLSearchParams({
    grant_type: 'password',
    username,
    password,
  })

  const res = await fetch(`${API_BASE}/idp/v1/Authentication/Token`, {
    method: 'POST',
    headers: {
      'x-blocks-key': X_BLOCKS_KEY,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  const data = await res.json()
  if (!res.ok) throw { status: res.status, data }
  return data as AuthResponse
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
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

  const data = await res.json()
  if (!res.ok) throw { status: res.status, data }
  return data as TokenResponse
}

export async function logout(refreshToken: string, accessToken: string): Promise<void> {
  await fetch(`${API_BASE}/idp/v1/Authentication/Logout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'x-blocks-key': X_BLOCKS_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  })
}
```

See `actions/get-token.md` and `actions/refresh-token.md` for the token endpoint contracts. See `actions/logout.md` for the logout contract.

---

## Axios Instance with Interceptors

Use Axios for all HTTP requests. The interceptor automatically handles 401 by refreshing the token and retrying the original request.

```typescript
// src/lib/api/axios-client.ts
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { tokenStorage } from '@/lib/token-storage'
import { refreshAccessToken } from '@/lib/api/auth'

const X_BLOCKS_KEY = import.meta.env.VITE_X_BLOCKS_KEY
const API_BASE = import.meta.env.VITE_API_BASE_URL

let refreshPromise: Promise<void> | null = null

async function handleTokenRefresh(): Promise<void> {
  const { refreshToken } = tokenStorage.get()
  if (!refreshToken) throw new Error('No refresh token')

  const tokens = await refreshAccessToken(refreshToken)
  tokenStorage.set({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresIn: tokens.expires_in,
  })
}

async function ensureValidToken(): Promise<string> {
  const { accessToken, expiresAt } = tokenStorage.get()

  if (accessToken && Date.now() < expiresAt - 30_000) {
    return accessToken
  }

  if (!refreshPromise) {
    refreshPromise = handleTokenRefresh()
      .catch(() => {
        tokenStorage.clear()
        window.location.href = '/login'
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  await refreshPromise
  const { accessToken: newToken } = tokenStorage.get()
  if (!newToken) throw new Error('Token unavailable after refresh')
  return newToken
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
        tokenStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)
```

Key points:
- The `refreshPromise` singleton pattern ensures only one token refresh runs at a time. Without it, multiple simultaneous 401 responses would each trigger their own refresh, causing race conditions and potential auth failures.
- The `ensureValidToken` function checks expiry with a 30-second buffer to proactively refresh before the token actually expires.
- After a failed refresh, the user is redirected to `/login`.
- All API calls use the `axiosClient` instance — never `axios` directly for authenticated requests.

---

## AuthContext

```typescript
// src/contexts/auth-context.tsx
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { loginWithPassword, isMfaResponse, type AuthResponse } from '@/lib/api/auth'
import { tokenStorage } from '@/lib/token-storage'

interface User {
  itemId: string
  firstName: string
  lastName: string
  email: string
  profileImageUrl?: string
}

interface AuthContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  user: User | null
  login: (username: string, password: string) => Promise<{ mfaRequired?: boolean; error?: string }>
  logout: () => void
  setUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const { accessToken } = tokenStorage.get()
    if (accessToken) {
      fetchUser(accessToken)
        .then(setUser)
        .catch(() => tokenStorage.clear())
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const fetchUser = async (token: string): Promise<User> => {
    const X_BLOCKS_KEY = import.meta.env.VITE_X_BLOCKS_KEY
    const API_BASE = import.meta.env.VITE_API_BASE_URL

    const res = await fetch(`${API_BASE}/idp/v1/Authentication/GetUserInfo`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-blocks-key': X_BLOCKS_KEY,
      },
    })

    if (!res.ok) throw new Error('Failed to fetch user')
    return res.json()
  }

  const login = useCallback(
    async (username: string, password: string) => {
      try {
        const data: AuthResponse = await loginWithPassword(username, password)

        if (isMfaResponse(data)) {
          return { mfaRequired: true }
        }

        tokenStorage.set({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresIn: data.expires_in,
        })

        const userData = await fetchUser(data.access_token)
        setUser(userData)
        navigate('/dashboard')
        return {}
      } catch (err: any) {
        if (err.status === 401) {
          return { error: 'Invalid email or password' }
        }
        return { error: 'Something went wrong. Please try again.' }
      }
    },
    [navigate]
  )

  const logout = useCallback(() => {
    const { accessToken, refreshToken } = tokenStorage.get()
    tokenStorage.clear()
    setUser(null)

    if (refreshToken && accessToken) {
      const X_BLOCKS_KEY = import.meta.env.VITE_X_BLOCKS_KEY
      const API_BASE = import.meta.env.VITE_API_BASE_URL

      fetch(`${API_BASE}/idp/v1/Authentication/Logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'x-blocks-key': X_BLOCKS_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {
        // Ignore logout API errors
      })
    }

    navigate('/login')
  }, [navigate])

  const isAuthenticated = tokenStorage.get().accessToken !== null

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
```

See `actions/get-user-info.md` for the GetUserInfo endpoint contract.

---

## Protected Route Wrapper

```tsx
// src/components/auth/protected-route.tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
```

Usage in the router definition:

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/auth-context'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { LoginPage } from '@/pages/auth/login'
import { DashboardPage } from '@/pages/dashboard'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
```

---

## OIDC Authorization URL Construction

Use the `get-social-login-endpoint` action to get the provider's authorization URL, or construct it manually if the provider metadata is known.

### Option A — Use the API to get the endpoint

```typescript
// src/lib/api/social-login.ts
import { axiosClient } from '@/lib/api/axios-client'

interface SocialLoginEndpointResponse {
  url: string
  isSuccess: boolean
  errors: Record<string, string>
}

export async function getSocialLoginUrl(provider: string): Promise<string> {
  const res = await axiosClient.post<SocialLoginEndpointResponse>(
    '/idp/v1/Authentication/GetSocialLogInEndPoint',
    {
      provider,
      redirectUri: import.meta.env.VITE_OIDC_REDIRECT_URI,
      projectKey: import.meta.env.VITE_X_BLOCKS_KEY,
    }
  )

  if (!res.data.isSuccess) {
    throw new Error(Object.values(res.data.errors).join(', '))
  }

  return res.data.url
}
```

See `actions/get-social-login-endpoint.md` for the full contract.

### Option B — Construct the URL manually

```typescript
// src/lib/oidc-utils.ts
export function buildAuthorizeUrl(params: {
  authorizationEndpoint: string
  clientId: string
  redirectUri: string
  state: string
  scope: string
  nonce?: string
  responseType?: string
  codeChallenge?: string
}): string {
  const {
    authorizationEndpoint,
    clientId,
    redirectUri,
    state,
    scope,
    nonce,
    responseType = 'code',
    codeChallenge,
  } = params

  const query = new URLSearchParams({
    response_type: responseType,
    client_id: clientId,
    state,
    redirect_uri: redirectUri,
    scope,
    ...(nonce && { nonce }),
    ...(codeChallenge && { code_challenge: codeChallenge, code_challenge_method: 'S256' }),
  })

  return `${authorizationEndpoint}?${query.toString()}`
}
```

---

## PKCE Flow (Recommended for SPAs)

PKCE adds a cryptographically random `code_verifier` and its SHA-256 hash (`code_challenge`) to the OIDC flow. It prevents authorization code interception attacks. Always use PKCE in public clients (SPAs).

```typescript
// src/lib/pkce.ts
export async function generatePkcePair(): Promise<{ verifier: string; challenge: string }> {
  const verifier = generateRandomString(128)
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)

  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  return { verifier, challenge }
}

function generateRandomString(length: number): string {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
}

export function generateState(): string {
  return generateRandomString(32)
}
```

Flow in practice:

```typescript
// 1. Login page: generate PKCE pair, store verifier in sessionStorage, redirect
const { verifier, challenge } = await generatePkcePair()
const state = generateState()
sessionStorage.setItem('pkce_verifier', verifier)
sessionStorage.setItem('oidc_state', state)

const authUrl = buildAuthorizeUrl({
  authorizationEndpoint: googleAuthEndpoint,
  clientId: import.meta.env.VITE_OIDC_CLIENT_ID,
  redirectUri: import.meta.env.VITE_OIDC_REDIRECT_URI,
  state,
  scope: 'openid profile email',
  codeChallenge: challenge,
})

window.location.href = authUrl

// 2. Callback page: exchange code for tokens using the stored verifier
const { verifier } = sessionStorage.get('pkce_verifier')!
const code = searchParams.get('code')!

const tokens = await fetch(`${API_BASE}/idp/v1/Authentication/Token`, {
  method: 'POST',
  headers: {
    'x-blocks-key': X_BLOCKS_KEY,
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: import.meta.env.VITE_OIDC_REDIRECT_URI,
    client_id: import.meta.env.VITE_OIDC_CLIENT_ID,
    code_verifier: verifier,
  }),
}).then(r => r.json())

sessionStorage.removeItem('pkce_verifier')
sessionStorage.removeItem('oidc_state')
```

See `contracts.md` for the `authorization_code` grant type contract with `client_id`.

---

## Token Refresh Race Condition Handling

The single-refresh-promise pattern is used both in the Axios interceptor and in the AuthContext. The key pattern:

```typescript
let refreshPromise: Promise<void> | null = null

async function refresh(): Promise<void> {
  if (refreshPromise) {
    // Another request already triggered refresh — wait for it
    return refreshPromise
  }

  refreshPromise = doRefresh()
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}
```

Without this pattern:
1. Request A fails with 401 — triggers refresh
2. Request B fails with 401 — triggers another refresh before A completes
3. Both requests retry with the new token, but one may retry with the old token (race)
4. Multiple refresh token calls may exhaust or invalidate each other

With the singleton pattern, only the first 401 triggers a refresh. All subsequent 401s wait for the same promise and then retry.

---

## Summary of Request Headers

| Header | Value | When |
|--------|-------|------|
| `x-blocks-key` | `$VITE_X_BLOCKS_KEY` | All requests |
| `Authorization` | `Bearer <accessToken>` | Authenticated requests |
| `Content-Type` | `application/json` | JSON body requests |
| `Content-Type` | `application/x-www-form-urlencoded` | Token endpoint only |
