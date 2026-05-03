'use client'

import { Suspense, useState, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/modules/auth/store/auth.store'
import { Loader2 } from 'lucide-react'

function OtpInput({
  length,
  onComplete,
}: {
  length: number
  onComplete: (code: string) => void
}) {
  const [value, setValue] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = useCallback(
    (idx: number, char: string) => {
      if (!/^\d*$/.test(char)) return
      const newVal = value.slice(0, idx) + char + value.slice(idx + 1)
      setValue(newVal)
      if (char && idx < length - 1) {
        inputRefs.current[idx + 1]?.focus()
      }
      if (newVal.length === length) {
        onComplete(newVal)
      }
    },
    [length, onComplete, value]
  )

  const handleKeyDown = useCallback(
    (idx: number, e: React.KeyboardEvent) => {
      if (e.key === 'Backspace' && !value[idx] && idx > 0) {
        inputRefs.current[idx - 1]?.focus()
      }
    },
    [value]
  )

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el
            if (i === 0) el?.focus()
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-12 h-14 text-center text-2xl font-bold bg-neutral-800 border border-white/20 text-white rounded-lg focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 transition-colors"
        />
      ))}
    </div>
  )
}

function VerifyMfaForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { verifyMfa } = useAuthStore()

  const mfaType = searchParams.get('mfaType') ?? 'email'
  const codeLength = mfaType === 'email' ? 5 : 6

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleVerify = useCallback(
    async (code: string) => {
      setIsLoading(true)
      setError(null)
      try {
        await verifyMfa(code)
        router.push('/data/data-gateway/schemas')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Verification failed')
      } finally {
        setIsLoading(false)
      }
    },
    [verifyMfa, router]
  )

  return (
    <div className="min-h-svh flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Two-Factor Authentication</h1>
          <p className="mt-2 text-sm text-white/50">
            {mfaType === 'email'
              ? 'Enter the 5-digit code sent to your email'
              : 'Enter the 6-digit code from your authenticator app'}
          </p>
        </div>

        <div className="bg-neutral-900 border border-white/10 rounded-xl p-8 shadow-2xl">
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <OtpInput length={codeLength} onComplete={handleVerify} />

          {isLoading && (
            <div className="mt-6 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-white/50" />
            </div>
          )}

          {!isLoading && !error && (
            <p className="mt-6 text-center text-xs text-white/30">
              Auto-submits when all digits are entered
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VerifyMfaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-svh flex items-center justify-center bg-neutral-950">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    }>
      <VerifyMfaForm />
    </Suspense>
  )
}
