'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { signin as apiSignin, verifyMfa as apiVerifyMfa, refreshTokens as apiRefreshTokens } from '../services/auth.service'
import { setAuthState } from '@/lib/https'
import type { User, SigninTokenResponse } from '../types/auth.types'

const AUTH_STORAGE_KEY = 'auth-storage'

interface AuthState {
  isAuthenticated: boolean
  accessToken: string | null
  refreshToken: string | null
  user: User | null

  mfaPending: {
    mfaId: string
    mfaType: string
    username: string
    password: string
  } | null

  signin: (username: string, password: string) => Promise<{ requiresMfa: boolean; mfaId?: string; mfaType?: string }>
  verifyMfa: (code: string) => Promise<void>
  logout: () => void
  refreshAccessToken: () => Promise<boolean>
  setUser: (user: User | null) => void
  clearMfaPending: () => void
}

function syncToHttpClient(accessToken: string | null, refreshToken: string | null) {
  setAuthState({ accessToken, refreshToken })
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      user: null,
      mfaPending: null,

      signin: async (username, password) => {
        const response = await apiSignin({ username, password })

        if ('enable_mfa' in response && response.enable_mfa) {
          set({ mfaPending: { mfaId: response.mfaId, mfaType: response.mfaType, username, password } })
          return { requiresMfa: true, mfaId: response.mfaId, mfaType: response.mfaType }
        }

        const tokenData = response as SigninTokenResponse
        set({ isAuthenticated: true, accessToken: tokenData.access_token, refreshToken: tokenData.refresh_token, mfaPending: null })
        syncToHttpClient(tokenData.access_token, tokenData.refresh_token)
        return { requiresMfa: false }
      },

      verifyMfa: async (code) => {
        const { mfaPending } = get()
        if (!mfaPending) throw new Error('No MFA pending')

        const response = await apiVerifyMfa(mfaPending.mfaId, mfaPending.mfaType, code)

        if ('enable_mfa' in response) throw new Error('MFA verification failed')

        const tokenData = response as SigninTokenResponse
        set({ isAuthenticated: true, accessToken: tokenData.access_token, refreshToken: tokenData.refresh_token, mfaPending: null })
        syncToHttpClient(tokenData.access_token, tokenData.refresh_token)
      },

      logout: () => {
        set({ isAuthenticated: false, accessToken: null, refreshToken: null, user: null, mfaPending: null })
        syncToHttpClient(null, null)
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get()
        if (!refreshToken) return false

        try {
          const tokens = await apiRefreshTokens(refreshToken)
          set({ accessToken: tokens.access_token, refreshToken: tokens.refresh_token })
          syncToHttpClient(tokens.access_token, tokens.refresh_token)
          return true
        } catch {
          set({ isAuthenticated: false, accessToken: null, refreshToken: null })
          syncToHttpClient(null, null)
          return false
        }
      },

      setUser: (user) => set({ user }),

      clearMfaPending: () => set({ mfaPending: null }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
)

if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout', () => {
    useAuthStore.getState().logout()
  })
}
