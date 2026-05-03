// ─── Payloads ──────────────────────────────────────────────────────────────────

export interface SigninEmailPayload {
  username: string
  password: string
}

export interface ForgotPasswordPayload {
  email: string
  projectKey: string
}

export interface ResetPasswordPayload {
  code: string
  newPassword: string
  projectKey: string
}

// ─── Responses ─────────────────────────────────────────────────────────────────

export interface SigninTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  id_token: string | null
}

export interface SigninMfaResponse {
  enable_mfa: true
  mfaType: 'email' | 'authenticator'
  mfaId: string
  message: string
}

export type SigninResponse = SigninTokenResponse | SigninMfaResponse

export interface LoginOption {
  provider: 'email' | 'google' | 'oidc' | string
  enabled: boolean
}

export interface LoginOptionsResponse {
  isSuccess: boolean
  data: LoginOption[]
  errors: Record<string, string[]>
}

export interface User {
  id: string
  email: string
  username?: string
  firstName?: string
  lastName?: string
  roles?: string[]
}

export interface ForgotPasswordResponse {
  isSuccess: boolean
  message?: string
}

export interface ResetPasswordResponse {
  isSuccess: boolean
  message?: string
}

// ─── Type Guards ───────────────────────────────────────────────────────────────

export const isMfaResponse = (res: SigninResponse): res is SigninMfaResponse =>
  (res as SigninMfaResponse).enable_mfa === true
