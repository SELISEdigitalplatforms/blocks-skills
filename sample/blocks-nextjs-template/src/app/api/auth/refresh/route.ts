import { NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.seliseblocks.com'
const X_BLOCKS_KEY = process.env.NEXT_PUBLIC_X_BLOCKS_KEY ?? ''

const ACCESS_TOKEN_COOKIE = 'blocks_access_token'
const REFRESH_TOKEN_COOKIE = 'blocks_refresh_token'
const ACCESS_TOKEN_CLIENT_COOKIE = 'blocks_access_token_client'

export async function POST(request: Request) {
  try {
    const refreshToken = request.headers.get('x-refresh-token')

    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token required' }, { status: 401 })
    }

    const response = await fetch(`${API_BASE_URL}/idp/v1/Authentication/Token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-blocks-key': X_BLOCKS_KEY,
        accept: 'application/json',
      },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
      credentials: 'include',
    })

    if (!response.ok) {
      const res = NextResponse.json({ error: 'Token refresh failed' }, { status: 401 })
      res.cookies.set(ACCESS_TOKEN_COOKIE, '', { path: '/', maxAge: 0 })
      res.cookies.set(REFRESH_TOKEN_COOKIE, '', { path: '/', maxAge: 0 })
      res.cookies.set(ACCESS_TOKEN_CLIENT_COOKIE, '', { path: '/', maxAge: 0 })
      return res
    }

    const data = await response.json()
    const expiresIn = data.expires_in ?? 8000

    const secureCookies = {
      httpOnly: true,
      secure: true,
      sameSite: 'none' as const,
      path: '/',
    }

    const clientCookie = {
      httpOnly: false,
      secure: true,
      sameSite: 'none' as const,
      path: '/',
    }

    const res = NextResponse.json({
      access_token: data.access_token,
      expires_in: expiresIn,
    })

    res.cookies.set(ACCESS_TOKEN_COOKIE, data.access_token, {
      ...secureCookies,
      maxAge: expiresIn,
    })

    res.cookies.set(ACCESS_TOKEN_CLIENT_COOKIE, data.access_token, {
      ...clientCookie,
      maxAge: expiresIn,
    })

    if (data.refresh_token) {
      res.cookies.set(REFRESH_TOKEN_COOKIE, data.refresh_token, {
        ...secureCookies,
        maxAge: 60 * 60 * 24 * 30,
      })
    }

    return res
  } catch (err) {
    console.error('[auth/refresh]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
