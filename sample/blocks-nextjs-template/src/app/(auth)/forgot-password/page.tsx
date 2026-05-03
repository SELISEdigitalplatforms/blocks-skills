'use client'

import { useState } from 'react'
import { forgotPassword } from '@/modules/auth/services/auth.service'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const X_BLOCKS_KEY = process.env.NEXT_PUBLIC_X_BLOCKS_KEY ?? ''

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await forgotPassword({ email, projectKey: X_BLOCKS_KEY })
      // Always show success — even on 404 — to prevent email enumeration
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-neutral-950 px-4">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <div className="text-4xl mb-4">📧</div>
            <h1 className="text-2xl font-bold text-white">Check your email</h1>
            <p className="mt-2 text-sm text-white/50">
              If this email is registered, you will receive a password reset link shortly.
            </p>
          </div>

          <div className="bg-neutral-900 border border-white/10 rounded-xl p-8">
            <p className="text-sm text-white/50 text-center">
              The reset link will expire in 15 minutes. Check your spam folder if you don&apos;t see it.
            </p>
          </div>

          <div className="text-center space-y-3">
            <p className="text-sm text-white/50">
              Didn&apos;t receive it?{' '}
              <button
                onClick={() => setSubmitted(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                Try again
              </button>
            </p>
            <Link
              href="/sign-in"
              className="block text-sm text-white/30 hover:text-white/60 transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-1 text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
          <h1 className="text-2xl font-bold text-white">Reset password</h1>
          <p className="text-sm text-white/50">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {/* Form */}
        <div className="bg-neutral-900 border border-white/10 rounded-xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-white/70">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full bg-neutral-800 border border-white/10 text-white text-sm rounded-lg px-4 py-2.5 placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/10 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-neutral-950 font-semibold text-sm py-2.5 px-4 rounded-lg hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
