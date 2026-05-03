'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { activateUser } from '@/modules/auth/services/auth.service';
import { Loader2, CheckCircle2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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
      <span className={`text-xs font-medium ${passed.length >= 3 ? 'text-white/70' : 'text-white/30'}`}>{label}</span>
      <ul className="space-y-0.5">
        {PASSWORD_REQUIREMENTS.map((req) => (
          <li key={req.label} className="flex items-center gap-1.5 text-xs">
            {req.test(password) ? (
              <CheckCircle2 className="w-3 h-3 text-green-500" />
            ) : (
              <div className="w-3 h-3 rounded-full border border-white/20" />
            )}
            <span className={req.test(password) ? 'text-white/50' : 'text-white/20'}>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ActivationForm() {
  const searchParams = useSearchParams()

  const code = searchParams.get('code')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const isPasswordStrong = PASSWORD_REQUIREMENTS.every((r) => r.test(password))
  const passwordsMatch = password === confirmPassword && password.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code || !isPasswordStrong) return

    setError(null)
    setIsLoading(true)

    try {
      await activateUser(code, password, firstName, lastName)
      setSuccess(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Activation failed'
      if (
        msg.toLowerCase().includes('expired') ||
        msg.toLowerCase().includes('invalid') ||
        msg.toLowerCase().includes('already')
      ) {
        setError('This activation link has expired or has already been used. Contact your administrator.')
      } else {
        setError(msg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-neutral-950 px-4">
        <div className="w-full max-w-sm space-y-8 text-center">
          <div className="flex justify-center">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Account Activated</h1>
            <p className="mt-2 text-sm text-white/50">Your account is ready. You can now sign in.</p>
          </div>
          <Link
            href="/sign-in?activated=success"
            className="inline-flex items-center justify-center w-full px-4 py-2.5 text-sm font-semibold bg-white text-neutral-950 rounded-lg hover:bg-white/90 transition-colors"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (!code) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-neutral-950 px-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-red-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Missing activation code</h1>
            <p className="mt-2 text-sm text-white/50">
              Please use the link from your invitation email. Contact your administrator if you need a new one.
            </p>
          </div>
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center w-full px-4 py-2.5 text-sm font-semibold bg-white text-neutral-950 rounded-lg hover:bg-white/90 transition-colors"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white">Activate your account</h1>
          <p className="text-sm text-white/50">Complete your profile and set a password to get started.</p>
        </div>

        <div className="bg-neutral-900 border border-white/10 rounded-xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="firstName" className="block text-sm font-medium text-white/70">First name</label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jane"
                  required
                  autoFocus
                  className="w-full bg-neutral-800 border border-white/10 text-white text-sm rounded-lg px-4 py-2.5 placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/10 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="lastName" className="block text-sm font-medium text-white/70">Last name</label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  required
                  className="w-full bg-neutral-800 border border-white/10 text-white text-sm rounded-lg px-4 py-2.5 placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/10 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-white/70">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-neutral-800 border border-white/10 text-white text-sm rounded-lg px-4 py-2.5 placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/10 transition-colors"
              />
              <PasswordStrength password={password} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/70">Confirm password</label>
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
              {isLoading ? 'Activating...' : 'Activate account'}
            </button>
          </form>
        </div>

        <div className="text-center">
          <Link href="/sign-in" className="inline-flex items-center gap-1 text-sm text-white/30 hover:text-white/60 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ActivatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-svh flex items-center justify-center bg-neutral-950">
        <Loader2 className="w-6 h-6 animate-spin text-white/40" />
      </div>
    }>
      <ActivationForm />
    </Suspense>
  )
}
