# Next.js 14+ App Router — Identity & Access Implementation Guide

This guide covers integrating blocks-idp into a Next.js 14+ project using the App Router. It covers token management via middleware and Server Actions, session cookies, client-side auth state, and route protection.

---

## Environment Variables

Create a `.env.local` file at the project root:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.seliseblocks.com
NEXT_PUBLIC_X_BLOCKS_KEY=your-project-key
NEXT_PUBLIC_OIDC_CLIENT_ID=your-client-id
NEXT_PUBLIC_OIDC_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

- `NEXT_PUBLIC_` prefix exposes variables to the browser — only use it for values that are safe to be public.
- Keep `NEXT_PUBLIC_X_BLOCKS_KEY` as public because it is intended for client-side requests.
- The token endpoint and all authenticated API calls use `NEXT_PUBLIC_API_BASE_URL` combined with the fixed path `/idp/v1/Authentication/Token`.

---

## Session Cookie Configuration

Tokens are stored in an httpOnly, secure, sameSite cookie. This prevents XSS from reading tokens while allowing the browser to send them automatically with every request.

```typescript
// src/lib/cookies.ts
import { cookies } from 'next/headers'

export const COOKIE_NAME = 'blocks_session'
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export const sessionCookieOptions = {
  name: COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: COOKIE_MAX_AGE,
  path: '/',
}

export async function getSessionCookie() {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(COOKIE_NAME)
  if (!cookie) return null

  try {
    return JSON.parse(cookie.value) as {
      accessToken: string
      refreshToken: string
      expiresAt: number
    }
  } catch {
    return null
  }
}

export async function setSessionCookie(data: {
  accessToken: string
  refreshToken: string
  expiresAt: number
}) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, JSON.stringify(data), sessionCookieOptions)
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
```

---

## Token API Helpers

Create a typed fetch utility that handles the blocks-idp API conventions.

```typescript
// src/lib/api-client.ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!
const X_BLOCKS_KEY = process.env.NEXT_PUBLIC_X_BLOCKS_KEY!

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

export function isMfaResponse(res: AuthResponse): res is MfaRequiredResponse {
  return (res as MfaRequiredResponse).enable_mfa === true
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'x-blocks-key': X_BLOCKS_KEY,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const error: any = new Error(`API error ${res.status}`)
    error.status = res.status
    error.body = body
    throw error
  }

  return res.json()
}

export async function fetchToken(formBody: Record<string, string>): Promise<AuthResponse> {
  const params = new URLSearchParams(formBody)
  const res = await fetch(`${API_BASE}/idp/v1/Authentication/Token`, {
    method: 'POST',
    headers: {
      'x-blocks-key': X_BLOCKS_KEY,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  const data = await res.json()

  if (!res.ok) {
    const error: any = new Error(`Token error ${res.status}`)
    error.status = res.status
    error.body = data
    throw error
  }

  return data as AuthResponse
}

export async function fetchAuthenticated<T>(
  path: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  return apiFetch<T>(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export async function refreshTokens(refreshToken: string): Promise<TokenResponse> {
  const data = await fetchToken({ grant_type: 'refresh_token', refresh_token: refreshToken })
  if (isMfaResponse(data)) {
    throw new Error('MFA required during token refresh — re-authenticate')
  }
  return data
}
```

See `actions/get-token.md` and `actions/refresh-token.md` for the full token endpoint contract.

---

## Server Actions

All auth operations live in a single Server Actions file. Use the `'use server'` directive.

```typescript
// src/actions/auth.ts
'use server'

import { redirect } from 'next/navigation'
import { fetchToken, refreshTokens, isMfaResponse, type AuthResponse } from '@/lib/api-client'
import { setSessionCookie, clearSessionCookie } from '@/lib/cookies'

export interface LoginResult {
  success: boolean
  mfaRequired?: boolean
  mfaType?: 'email' | 'authenticator'
  mfaId?: string
  message?: string
  errors?: Record<string, string>
}

export async function loginAction(
  prevState: unknown,
  formData: FormData
): Promise<LoginResult> {
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  if (!username || !password) {
    return { success: false, errors: { general: 'Username and password are required' } }
  }

  try {
    const data: AuthResponse = await fetchToken({
      grant_type: 'password',
      username,
      password,
    })

    if (isMfaResponse(data)) {
      return {
        success: false,
        mfaRequired: true,
        mfaType: data.mfaType,
        mfaId: data.mfaId,
        message: data.message,
      }
    }

    const expiresAt = Date.now() + data.expires_in * 1000
    await setSessionCookie({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt,
    })

    return { success: true }
  } catch (err: any) {
    if (err.status === 401) {
      return { success: false, errors: { general: 'Invalid email or password' } }
    }
    return { success: false, errors: { general: 'Something went wrong. Please try again.' } }
  }
}

export async function refreshTokenAction(): Promise<{ success: boolean }> {
  const { getSessionCookie } = await import('@/lib/cookies')
  const session = await getSessionCookie()

  if (!session?.refreshToken) {
    return { success: false }
  }

  try {
    const tokens = await refreshTokens(session.refreshToken)
    const expiresAt = Date.now() + tokens.expires_in * 1000
    await setSessionCookie({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
    })
    return { success: true }
  } catch {
    return { success: false }
  }
}

export async function logoutAction() {
  const { getSessionCookie } = await import('@/lib/cookies')
  const session = await getSessionCookie()

  if (session?.refreshToken) {
    try {
      const { fetchAuthenticated } = await import('@/lib/api-client')
      await fetchAuthenticated('/idp/v1/Authentication/Logout', session.accessToken, {
        method: 'POST',
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      })
    } catch {
      // Proceed with logout even if the API call fails
    }
  }

  await clearSessionCookie()
  redirect('/login')
}
```

### Client Component Login Form

```tsx
// src/components/auth/login-form.tsx
'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { loginAction } from '@/actions/auth'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Signing in...' : 'Sign In'}
    </button>
  )
}

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, null)

  if (state?.mfaRequired) {
    return (
      <div>
        <p>{state.message}</p>
        <MfaVerifyForm mfaType={state.mfaType!} mfaId={state.mfaId!} />
      </div>
    )
  }

  return (
    <form action={formAction}>
      {state?.errors?.general && <p className="error">{state.errors.general}</p>}
      <input name="username" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      <SubmitButton />
    </form>
  )
}
```

See `actions/logout.md` for the logout endpoint contract.

---

## Middleware — Token Validation and Route Protection

Middleware runs on every request before rendering. Use it to protect routes, attach the access token to headers for Server Components, and handle silent token refresh.

```typescript
// middleware.ts (at project root)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const COOKIE_NAME = 'blocks_session'
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!
const X_BLOCKS_KEY = process.env.NEXT_PUBLIC_X_BLOCKS_KEY!

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth|login|signup|activate|forgot-password|resetpassword|sent-email|success|activate-failed).*)',
  ],
}

function isTokenExpired(expiresAt: number): boolean {
  return Date.now() >= expiresAt - 30_000 // 30-second buffer
}

async function tryRefreshSession(
  refreshToken: string,
  accessToken: string
): Promise<{ accessToken: string; refreshToken: string; expiresAt: number } | null> {
  try {
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

    if (!res.ok) return null

    const data = await res.json()
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    }
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const cookie = request.cookies.get(COOKIE_NAME)

  if (!cookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  let session: { accessToken: string; refreshToken: string; expiresAt: number }
  try {
    session = JSON.parse(cookie.value)
  } catch {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isTokenExpired(session.expiresAt)) {
    const refreshed = await tryRefreshSession(session.refreshToken, session.accessToken)
    if (!refreshed) {
      const logoutResponse = NextResponse.redirect(new URL('/login', request.url))
      logoutResponse.cookies.delete(COOKIE_NAME)
      return logoutResponse
    }

    session = refreshed
    response.cookies.set(COOKIE_NAME, JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
  }

  response.headers.set('x-access-token', session.accessToken)
  return response
}
```

Key points:
- The `matcher` explicitly excludes public routes (login, signup, etc.) and Next.js internals.
- The middleware parses the session cookie but does not modify it — the token is forwarded via a request header (`x-access-token`) for Server Components to use.
- Silent refresh is attempted when the token is within 30 seconds of expiry. If refresh fails, the user is redirected to login.
- Never set `httpOnly: false` on the session cookie — it must remain httpOnly to prevent XSS.

---

## Client-Side Auth State with React Context

Use a context + provider to expose auth state to client components.

```typescript
// src/contexts/auth-context.tsx
'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'

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
  accessToken: string | null
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  const fetchUser = useCallback(async (token: string) => {
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!
    const X_BLOCKS_KEY = process.env.NEXT_PUBLIC_X_BLOCKS_KEY!

    const res = await fetch(`${API_BASE}/idp/v1/Authentication/GetUserInfo`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-blocks-key': X_BLOCKS_KEY,
      },
    })

    if (res.ok) {
      const data = await res.json()
      setUser(data)
    }
  }, [])

  useEffect(() => {
    const loadSession = async () => {
      const { getSessionCookie } = await import('@/lib/cookies')
      const session = await getSessionCookie()

      if (session?.accessToken) {
        setAccessToken(session.accessToken)
        await fetchUser(session.accessToken)
      }

      setIsLoading(false)
    }

    loadSession()
  }, [fetchUser])

  const logout = useCallback(async () => {
    const { logoutAction } = await import('@/actions/auth')
    await logoutAction()
  }, [])

  const isAuthenticated = !!accessToken

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, accessToken, logout }}>
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

Add the provider to your root layout:

```tsx
// src/app/layout.tsx
import { AuthProvider } from '@/contexts/auth-context'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
```

See `actions/get-user-info.md` for the GetUserInfo endpoint contract.

---

## Protected Route Wrapper

Use this component to guard pages that require authentication. It reads from the context rather than the cookie directly.

```tsx
// src/components/auth/protected-route.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
```

Usage in a layout or page:

```tsx
// src/app/dashboard/layout.tsx
import { ProtectedRoute } from '@/components/auth/protected-route'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  )
}
```

---

## API Route Handler for OIDC Callback

When using OIDC / social login, the provider redirects back with an authorization code. Exchange it for tokens in an API route handler.

```typescript
// src/app/api/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { fetchToken, isMfaResponse } from '@/lib/api-client'
import { setSessionCookie } from '@/lib/cookies'

const X_BLOCKS_KEY = process.env.NEXT_PUBLIC_X_BLOCKS_KEY!
const OIDC_CLIENT_ID = process.env.NEXT_PUBLIC_OIDC_CLIENT_ID!
const OIDC_REDIRECT_URI = process.env.NEXT_PUBLIC_OIDC_REDIRECT_URI!

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(new URL('/login?error=oidc_failed', request.url))
  }

  try {
    const data = await fetchToken({
      grant_type: 'authorization_code',
      code,
      redirect_uri: OIDC_REDIRECT_URI,
      client_id: OIDC_CLIENT_ID,
    })

    if (isMfaResponse(data)) {
      return NextResponse.redirect(
        new URL(`/verify-mfa?mfaType=${data.mfaType}&mfaId=${data.mfaId}`, request.url)
      )
    }

    await setSessionCookie({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    })

    const returnTo = state ? decodeURIComponent(state) : '/dashboard'
    return NextResponse.redirect(new URL(returnTo, request.url))
  } catch {
    return NextResponse.redirect(new URL('/login?error=oidc_failed', request.url))
  }
}
```

See `actions/get-social-login-endpoint.md` for constructing the authorize URL. See `contracts.md` for the `authorization_code` grant type contract.

---

## Token Refresh on 401 in Client Components

For client-side data fetching (e.g., React Query or SWR), handle 401 by refreshing the token and retrying.

```typescript
// src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query'
import { getSessionCookie, setSessionCookie } from '@/lib/cookies'
import { refreshTokens } from '@/lib/api-client'

let refreshPromise: Promise<void> | null = null

async function doRefresh() {
  const session = await getSessionCookie()
  if (!session?.refreshToken) throw new Error('No refresh token')

  const tokens = await refreshTokens(session.refreshToken)
  await setSessionCookie({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + tokens.expires_in * 1000,
  })
}

export async function refreshSessionAndRetry() {
  if (!refreshPromise) {
    refreshPromise = doRefresh()
      .catch(() => {
        // Refresh failed — redirect to login handled by route guard
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  await refreshPromise
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.status === 401) return false
        return failureCount < 2
      },
    },
    mutations: {
      onError: async (error: any) => {
        if (error?.status === 401) {
          await refreshSessionAndRetry()
        }
      },
    },
  },
})
```

The `refreshPromise` singleton prevents multiple simultaneous refresh requests — a common race condition when multiple API calls fail at the same time.

---

## Summary of Request Headers

| Header | Value | When |
|--------|-------|------|
| `x-blocks-key` | `$NEXT_PUBLIC_X_BLOCKS_KEY` | All requests |
| `Authorization` | `Bearer <accessToken>` | Authenticated requests |
| `Content-Type` | `application/json` | JSON body requests |
| `Content-Type` | `application/x-www-form-urlencoded` | Token endpoint only |
