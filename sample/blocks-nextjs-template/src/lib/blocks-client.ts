import { cookies } from 'next/headers'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.seliseblocks.com'
const X_BLOCKS_KEY = process.env.NEXT_PUBLIC_X_BLOCKS_KEY ?? ''

const ACCESS_TOKEN_COOKIE = 'blocks_access_token'
const REFRESH_TOKEN_COOKIE = 'blocks_refresh_token'

const COOKIE_OPTS = {
  httpOnly: true,
  secure: true,
  sameSite: 'none' as const,
  path: '/',
}

export async function getAuthTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
  const cookieStore = await cookies()
  return {
    accessToken: cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null,
    refreshToken: cookieStore.get(REFRESH_TOKEN_COOKIE)?.value ?? null,
  }
}

export async function refreshTokens(): Promise<boolean> {
  const { refreshToken } = await getAuthTokens()
  if (!refreshToken) return false

  try {
    const res = await fetch(`${API_BASE_URL}/idp/v1/Authentication/Token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-blocks-key': X_BLOCKS_KEY,
        accept: 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }).toString(),
      credentials: 'include',
    })

    if (!res.ok) return false

    const data = await res.json()
    const cookieStore = await cookies()

    cookieStore.set(ACCESS_TOKEN_COOKIE, data.access_token, {
      ...COOKIE_OPTS,
      maxAge: data.expires_in ?? 8000,
    })

    if (data.refresh_token) {
      cookieStore.set(REFRESH_TOKEN_COOKIE, data.refresh_token, {
        ...COOKIE_OPTS,
        maxAge: 60 * 60 * 24 * 30,
      })
    }

    return true
  } catch {
    return false
  }
}

/** Base fetch with auto-refresh on 401. Handles both JSON and FormData bodies. */
export async function blocksFetch<T>(
  endpoint: string,
  options: Omit<RequestInit, 'body'> & {
    body?: unknown
    isFormData?: boolean
  }
): Promise<{ data: T | null; error: string | null }> {
  const isFormData = options.isFormData ?? false

  const headers: Record<string, string> = {
    'x-blocks-key': X_BLOCKS_KEY,
    accept: 'application/json',
  }

  if (!isFormData && options.body) {
    headers['Content-Type'] = 'application/json'
  }

  let res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string> ?? {}) },
    credentials: 'include',
    body: isFormData
      ? (options.body as FormData)
      : options.body
        ? JSON.stringify(options.body)
        : undefined,
  })

  if (res.status === 401) {
    const refreshed = await refreshTokens()
    if (refreshed) {
      const newHeaders: Record<string, string> = {
        'x-blocks-key': X_BLOCKS_KEY,
        accept: 'application/json',
      }
      if (!isFormData && options.body) {
        newHeaders['Content-Type'] = 'application/json'
      }
      res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: { ...newHeaders, ...(options.headers as Record<string, string> ?? {}) },
        credentials: 'include',
        body: isFormData
          ? (options.body as FormData)
          : options.body
            ? JSON.stringify(options.body)
            : undefined,
      })
    }
  }

  const json = await res.json().catch(() => null)

  if (!res.ok) {
    return {
      data: json as T | null,
      error: json?.Message ?? json?.message ?? json?.error ?? `HTTP ${res.status}`,
    }
  }

  return { data: json as T, error: null }
}
