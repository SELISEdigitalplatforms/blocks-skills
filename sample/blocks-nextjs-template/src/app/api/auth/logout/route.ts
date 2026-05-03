import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.seliseblocks.com'
const X_BLOCKS_KEY = process.env.NEXT_PUBLIC_X_BLOCKS_KEY ?? ''

const ACCESS_TOKEN_COOKIE = 'blocks_access_token'
const REFRESH_TOKEN_COOKIE = 'blocks_refresh_token'
const ACCESS_TOKEN_CLIENT_COOKIE = 'blocks_access_token_client'

export async function POST() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value

  try {
    if (refreshToken) {
      await fetch(`${API_BASE_URL}/idp/v1/Authentication/Logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-blocks-key': X_BLOCKS_KEY,
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ refreshToken }),
      })
    }
  } catch (err) {
    console.error('[auth/logout] IDP logout error:', err)
  }

  const res = NextResponse.json({ success: true })

  const del = (name: string) => res.cookies.set(name, '', { path: '/', maxAge: 0 })

  del(ACCESS_TOKEN_COOKIE)
  del(REFRESH_TOKEN_COOKIE)
  del(ACCESS_TOKEN_CLIENT_COOKIE)

  return res
}
