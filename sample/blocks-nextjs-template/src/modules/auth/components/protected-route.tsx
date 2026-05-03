'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/modules/auth/store/auth.store'
import { setAuthState } from '@/lib/https'
import { Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'

const PUBLIC_PATHS = [
  '/sign-in',
  '/forgot-password',
  '/reset-password',
  '/verify-mfa',
  '/activate',
]

function ProtectedContentInner({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, accessToken } = useAuthStore()

  const isPublic = PUBLIC_PATHS.some((p) => pathname.includes(p))

  // Sync persisted tokens to https.ts on mount
  const state = useAuthStore.getState()
  setAuthState({ accessToken: state.accessToken, refreshToken: state.refreshToken })

  useEffect(() => {
    if (!isPublic && !isAuthenticated && !accessToken) {
      router.push('/sign-in')
    }
  }, [isPublic, isAuthenticated, accessToken, router])

  if (isPublic) return <>{children}</>

  if (!isAuthenticated && !accessToken) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-neutral-950">
        <Loader2 className="w-6 h-6 animate-spin text-white/40" />
      </div>
    )
  }

  return <>{children}</>
}

const ProtectedContent = dynamic(
  () => Promise.resolve(ProtectedContentInner),
  { ssr: false, loading: () => (
    <div className="min-h-svh flex items-center justify-center bg-neutral-950">
      <Loader2 className="w-6 h-6 animate-spin text-white/40" />
    </div>
  )}
)

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="min-h-svh flex items-center justify-center bg-neutral-950">
        <Loader2 className="w-6 h-6 animate-spin text-white/40" />
      </div>
    }>
      <ProtectedContent>{children}</ProtectedContent>
    </Suspense>
  )
}
