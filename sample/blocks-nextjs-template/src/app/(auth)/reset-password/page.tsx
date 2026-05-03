'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { resetPassword } from '@/modules/auth/services/auth.service'
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const X_BLOCKS_KEY = process.env.NEXT_PUBLIC_X_BLOCKS_KEY ?? ''

const PASSWORD_REQUIREMENTS = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number', test: (p: string) => /\d/.test(p) },
  { label: 'One special character', test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
]

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const passed = PASSWORD_REQUIREMENTS.filter((r) => r.test(password))
  const pct = (passed.length / PASSWORD_REQUIREMENTS.length) * 100
  const label = ['', 'Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'][passed.length] ?? 'Weak'
  const color = ['', 'bg-red-500', 'bg-red-500', 'bg-yellow-500', 'bg-green-400', 'bg-green-500'][passed.length]

  return (
    <div className="space-y-2">
      <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-300`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-medium ${passed.length >= 3 ? 'text-white/70' : 'text-white/30'}`}>
        {label}
      </span>
      <ul className="space-y-0.5">
        {PASSWORD_REQUIREMENTS.map((req) => (
          <li key={req.label} className="flex items-center gap-1.5 text-xs">
            {req.test(password) ? (
              <CheckCircle2 className="w-3 h-3 text-green-500" />
            ) : (
              <XCircle className="w-3 h-3 text-white/20" />
            )}
            <span className={req.test(password) ? 'text-white/50' : 'text-white/20'}>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const code = searchParams.get('code')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    code ? null : 'Reset code is missing from the URL. Please use the link from your email.'
  )

  const isPasswordStrong = PASSWORD_REQUIREMENTS.every((r) => r.test(password))
  const passwordsMatch = password === confirmPassword && password.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code || !isPasswordStrong) return

    setError(null)
    setIsLoading(true)

    try {
      await resetPassword({ code, newPassword: password, projectKey: X_BLOCKS_KEY })
      router.push('/sign-in?reset=success')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Password reset failed'
      if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid')) {
        setError('This reset link has expired or been used. Please request a new one.')
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
        <div className="space-y-2">
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-1 text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
          <h1 className="text-2xl font-bold text-white">Set new password</h1>
          <p className="text-sm text-white/50">Choose a strong password that you don&apos;t use elsewhere.</p>
        </div>

        <div className="bg-neutral-900 border border-white/10 rounded-xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {!code ? (
              <div className="text-center py-4 space-y-2">
                <XCircle className="w-8 h-8 text-red-400 mx-auto" />
                <p className="text-sm text-white/50">{error}</p>
                <Link href="/forgot-password" className="block text-sm text-white/70 hover:text-white transition-colors">
                  Request a new reset link
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-white/70">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
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
                  <PasswordStrength password={password} />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/70">
                    Confirm password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={`w-full bg-neutral-800 border text-sm rounded-lg px-4 py-2.5 placeholder-white/30 focus:outline-none focus:ring-1 transition-colors ${
                      confirmPassword && !passwordsMatch
                        ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20'
                        : 'border-white/10 focus:border-white/30 focus:ring-white/10'
                    }`}
                  />
                  {confirmPassword && !passwordsMatch && (
                    <p className="text-xs text-red-400">Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !isPasswordStrong || !passwordsMatch}
                  className="w-full bg-white text-neutral-950 font-semibold text-sm py-2.5 px-4 rounded-lg hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isLoading ? 'Resetting...' : 'Reset password'}
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-svh flex items-center justify-center bg-neutral-950">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
