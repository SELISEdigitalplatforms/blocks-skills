import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import type { AxiosResponse, AxiosError } from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.seliseblocks.com'
const X_BLOCKS_KEY = process.env.NEXT_PUBLIC_X_BLOCKS_KEY ?? ''

export interface UdsResponse<T> {
  isSuccess: boolean
  message: string
  httpStatusCode: number
  data: T
  errors: Record<string, string>
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
}

let authState: AuthState = { accessToken: null, refreshToken: null }

export const setAuthState = (state: AuthState) => {
  authState = state
}

export const getAuthState = () => authState

const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb)
}

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

const createHttpClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: `${API_BASE_URL}/uds/v1`,
    headers: {
      'Content-Type': 'application/json',
      'x-blocks-key': X_BLOCKS_KEY,
      'accept': 'application/json',
      'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
    },
    withCredentials: true,
  })

  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getCookie('blocks_access_token_client')
      if (token && authState.accessToken !== null) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

      if (error.response?.status !== 401 || originalRequest._retry) {
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(client(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = getCookie('blocks_refresh_token')
        if (!refreshToken) {
          throw new Error('No refresh token')
        }

        const res = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'x-refresh-token': refreshToken },
          credentials: 'include',
        })

        if (!res.ok) {
          throw new Error('Refresh failed')
        }

        const newToken = getCookie('blocks_access_token_client')
        if (!newToken) {
          throw new Error('No new token after refresh')
        }

        onTokenRefreshed(newToken)
        authState.accessToken = newToken
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return client(originalRequest)
      } catch {
        authState.accessToken = null
        authState.refreshToken = null
        refreshSubscribers = []

        try {
          await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
        } catch {
          // logout endpoint failure is non-fatal
        }

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:logout'))
          window.location.href = '/login'
        }

        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }
  )

  return client
}

const https = createHttpClient()

export default https
