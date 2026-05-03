import { NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.seliseblocks.com'
const X_BLOCKS_KEY = process.env.NEXT_PUBLIC_X_BLOCKS_KEY ?? ''

const ACCESS_TOKEN_COOKIE = 'blocks_access_token'
const REFRESH_TOKEN_COOKIE = 'blocks_refresh_token'
const ACCESS_TOKEN_CLIENT_COOKIE = 'blocks_access_token_client'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'username and password are required' },
        { status: 400 }
      )
    }

    const params = new URLSearchParams({ grant_type: 'password', username, password })

    const response = await fetch(`${API_BASE_URL}/idp/v1/Authentication/Token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-blocks-key': X_BLOCKS_KEY,
        accept: 'application/json',
      },
      body: params.toString(),
      credentials: 'include',
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: response.status })
    }

    const data = await response.json()
    const expiresIn = data.expires_in ?? 8000

    // Cookies that are sent automatically with cross-origin requests (withCredentials)
    const secureCookies = {
      httpOnly: true,
      secure: true,
      sameSite: 'none' as const,
      path: '/',
    }

    // Non-httpOnly cookie — client JS can read it to build Authorization header
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

    // HttpOnly cookie (for withCredentials auto-send + secure refresh)
    res.cookies.set(ACCESS_TOKEN_COOKIE, data.access_token, {
      ...secureCookies,
      maxAge: expiresIn,
    })

    // Refresh token: always httpOnly
    if (data.refresh_token) {
      res.cookies.set(REFRESH_TOKEN_COOKIE, data.refresh_token, {
        ...secureCookies,
        maxAge: 60 * 60 * 24 * 30,
      })
    }

    // Non-httpOnly access token for client-side Authorization header
    res.cookies.set(ACCESS_TOKEN_CLIENT_COOKIE, data.access_token, {
      ...clientCookie,
      maxAge: expiresIn,
    })

    return res
  } catch (err) {
    console.error('[auth/token]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
