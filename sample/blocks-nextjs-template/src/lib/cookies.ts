const ACCESS_TOKEN_COOKIE = 'blocks_access_token'
const REFRESH_TOKEN_COOKIE = 'blocks_refresh_token'
const ACCESS_TOKEN_CLIENT_COOKIE = 'blocks_access_token_client'

/**
 * Read tokens from document cookies (client-side).
 * Returns null if not found or if running server-side.
 */
export function getCookies(): { accessToken: string | null; refreshToken: string | null } {
  if (typeof document === 'undefined') return { accessToken: null, refreshToken: null }

  const get = (name: string) => {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
    return match ? decodeURIComponent(match[1]) : null
  }

  return {
    // Read from the client-readable cookie (non-httpOnly)
    accessToken: get(ACCESS_TOKEN_CLIENT_COOKIE),
    // Refresh token is httpOnly — not readable from JS
    refreshToken: get(REFRESH_TOKEN_COOKIE),
  }
}

/**
 * Write tokens to document cookies (client-side).
 */
export function setCookies(accessToken: string, refreshToken: string, expiresIn = 8000): void {
  if (typeof document === 'undefined') return

  const write = (name: string, value: string, httpOnly = false) => {
    const parts = [
      `${name}=${encodeURIComponent(value)}`,
      'path=/',
      'SameSite=None',
      httpOnly ? 'HttpOnly' : '',
      'Secure',
      `Max-Age=${httpOnly ? 60 * 60 * 24 * 30 : expiresIn}`,
    ].filter(Boolean)
    document.cookie = parts.join('; ')
  }

  // Non-httpOnly so client JS can read it for Authorization header
  write(ACCESS_TOKEN_CLIENT_COOKIE, accessToken, false)
  // httpOnly — only server can use it
  write(REFRESH_TOKEN_COOKIE, refreshToken, true)
  // Also set httpOnly version for withCredentials auto-send
  write(ACCESS_TOKEN_COOKIE, accessToken, true)
}

export function clearCookies(): void {
  if (typeof document === 'undefined') return
  const del = (name: string) => {
    document.cookie = `${name}=; path=/; Max-Age=0`
  }
  del(ACCESS_TOKEN_COOKIE)
  del(REFRESH_TOKEN_COOKIE)
  del(ACCESS_TOKEN_CLIENT_COOKIE)
}
