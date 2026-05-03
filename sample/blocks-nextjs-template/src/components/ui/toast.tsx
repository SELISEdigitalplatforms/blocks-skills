'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

type ToastVariant = 'default' | 'success' | 'destructive' | 'warning'

interface Toast {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export const useToast = () => {
  const ctx = React.useContext(ToastContext)
  if (!ctx) {
    return {
      toast: (props: Omit<Toast, 'id'>) => console.log('Toast:', props),
      dismiss: (id: string) => {},
    }
  }
  return {
    toast: ctx.addToast,
    dismiss: ctx.removeToast,
  }
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { ...toast, id }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {typeof window !== 'undefined' &&
        createPortal(
          <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={cn(
                  'flex flex-col gap-1 rounded-lg border p-4 shadow-lg animate-in slide-in-from-right',
                  toast.variant === 'destructive' && 'border-red-500/30 bg-red-500/10',
                  toast.variant === 'success' && 'border-green-500/30 bg-green-500/10',
                  toast.variant === 'warning' && 'border-yellow-500/30 bg-yellow-500/10',
                  (!toast.variant || toast.variant === 'default') && 'border-white/10 bg-neutral-900'
                )}
              >
                {toast.title && <p className="font-medium text-white">{toast.title}</p>}
                {toast.description && <p className="text-sm text-white/70">{toast.description}</p>}
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  )
}

export const showSuccessToast = ({ title, description }: { title?: string; description: string }) => {
  console.log('Success:', title, description)
}

export const showErrorToast = ({ title, description, errors }: { title?: string; description: string; errors?: unknown }) => {
  console.error('Error:', title, description, errors)
}

export const showWarningToast = ({ title, description }: { title?: string; description: string }) => {
  console.warn('Warning:', title, description)
}
