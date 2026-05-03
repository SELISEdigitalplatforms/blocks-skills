import {
  SigninEmailPayload,
  SigninResponse,
  LoginOptionsResponse,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from '../types/auth.types'
import { useAuthStore } from '../store/auth.store'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.seliseblocks.com'
const X_BLOCKS_KEY = process.env.NEXT_PUBLIC_X_BLOCKS_KEY ?? ''

const IDP_BASE = `${API_BASE_URL}/idp/v1`

// ─── Public IDP calls — NO credentials (may conflict with existing user session) ──

const idpPublic = (path: string, body: unknown) => {
  return fetch(`${IDP_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-blocks-key': X_BLOCKS_KEY,
      accept: 'application/json',
    },
    body: JSON.stringify(body),
  })
}

// ─── Authenticated IDP calls — include credentials ──────────────────────────────

const idpAuth = (path: string, body: unknown) => {
  return fetch(`${IDP_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-blocks-key': X_BLOCKS_KEY,
      accept: 'application/json',
    },
    body: body instanceof URLSearchParams ? body.toString() : JSON.stringify(body),
    credentials: 'include',
  })
}

// ─── get-login-options ──────────────────────────────────────────────────────────

export const getLoginOptions = async (): Promise<LoginOptionsResponse> => {
  const res = await fetch(`${IDP_BASE}/Authentication/GetLoginOptions`, {
    method: 'GET',
    headers: {
      'x-blocks-key': X_BLOCKS_KEY,
      accept: 'application/json',
    },
    credentials: 'include',
  })
  const json = await res.json()
  return json as LoginOptionsResponse
}

// ─── get-token (password grant) ────────────────────────────────────────────────

export const signin = async (payload: SigninEmailPayload): Promise<SigninResponse> => {
  const res = await idpAuth('/Authentication/Token', new URLSearchParams({
    grant_type: 'password',
    username: payload.username,
    password: payload.password,
  }))
  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.error_description ?? json.error ?? 'Sign in failed')
  }
  return json as SigninResponse
}

// ─── get-token (mfa_code grant) ───────────────────────────────────────────────

export const verifyMfa = async (mfaId: string, mfaType: string, code: string): Promise<SigninResponse> => {
  const res = await idpAuth('/Authentication/Token', new URLSearchParams({
    grant_type: 'mfa_code',
    mfa_id: mfaId,
    mfa_type: mfaType,
    mfa_code: code,
  }))
  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.error_description ?? json.error ?? 'MFA verification failed')
  }
  return json as SigninResponse
}

// ─── refresh-token ─────────────────────────────────────────────────────────────

export const refreshTokens = async (refreshToken: string) => {
  const res = await idpAuth('/Authentication/Token', new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  }))
  const json = await res.json()
  if (!res.ok) throw new Error('Token refresh failed')
  return {
    access_token: json.access_token,
    refresh_token: json.refresh_token ?? refreshToken,
  }
}

// ─── recover-user (forgot password) ───────────────────────────────────────────

export const forgotPassword = async (payload: ForgotPasswordPayload) => {
  await idpPublic('/Iam/Recover', payload)
  // Always return success to prevent email enumeration
  return { isSuccess: true }
}

// ─── reset-password ────────────────────────────────────────────────────────────

export const resetPassword = async (payload: ResetPasswordPayload) => {
  const res = await idpPublic('/Iam/ResetPassword', payload)
  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.message ?? 'Password reset failed')
  }
  return { isSuccess: true }
}

// ─── activate-user ─────────────────────────────────────────────────────────────

export const activateUser = async (
  code: string,
  password: string,
  firstName?: string,
  lastName?: string
) => {
  const res = await idpPublic('/Iam/Activate', {
    code,
    password,
    projectKey: X_BLOCKS_KEY,
    firstName,
    lastName,
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json.message ?? 'Activation failed')
  }
  return { isSuccess: true }
}

// ─── logout ─────────────────────────────────────────────────────────────────────

const IDP_BASE_URL = `${API_BASE_URL}/idp/v1`

export const logout = async (): Promise<void> => {
  // Read tokens from Zustand store (not httpOnly cookies)
  const { accessToken, refreshToken } = useAuthStore.getState()

  if (refreshToken) {
    try {
      await fetch(`${IDP_BASE_URL}/Authentication/Logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-blocks-key': X_BLOCKS_KEY,
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ refreshToken }),
      })
    } catch (err) {
      console.error('[logout] IDP logout error:', err)
    }
  }

  // Dispatch event to clear Zustand state and trigger cookie cleanup
  window.dispatchEvent(new CustomEvent('auth:logout'))
  window.location.href = '/login'
}
