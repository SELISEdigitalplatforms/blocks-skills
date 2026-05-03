'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/modules/auth/store/auth.store'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

function SigninForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signin } = useAuthStore()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetSuccess = searchParams.get('reset') === 'success'
  const activatedSuccess = searchParams.get('activated') === 'success'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const result = await signin(username, password)

      if (result.requiresMfa) {
        router.push(`/verify-mfa?mfaId=${result.mfaId}&mfaType=${result.mfaType}`)
      } else {
        router.push('/data/data-gateway/schemas')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign in failed'
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credential')) {
        setError('Invalid email or password')
      } else {
        setError(msg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-svh flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">SELISE Blocks</h1>
          <p className="mt-2 text-sm text-white/50">Sign in to your account</p>
        </div>

        <div className="bg-neutral-900 border border-white/10 rounded-xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {resetSuccess && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-3 rounded-lg">
                Password reset successful. Please sign in.
              </div>
            )}

            {activatedSuccess && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-3 rounded-lg">
                Account activated. Please sign in.
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="username" className="block text-sm font-medium text-white/70">
                Email
              </label>
              <input
                id="username"
                type="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full bg-neutral-800 border border-white/10 text-white text-sm rounded-lg px-4 py-2.5 placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/10 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-white/70">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full bg-neutral-800 border border-white/10 text-white text-sm rounded-lg px-4 py-2.5 pr-11 placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/10 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-white/40 hover:text-white/60 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <a href="/forgot-password" className="text-sm text-white/50 hover:text-white/80 transition-colors">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-neutral-950 font-semibold text-sm py-2.5 px-4 rounded-lg hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-white/30">
          Protected by SELISE Blocks Identity
        </p>
      </div>
    </div>
  )
}

export default function SigninPage() {
  return (
    <Suspense fallback={
      <div className="min-h-svh flex items-center justify-center bg-neutral-950">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    }>
      <SigninForm />
    </Suspense>
  )
}
