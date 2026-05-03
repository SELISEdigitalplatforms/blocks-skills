export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string | null
  id_token: string | null
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}
