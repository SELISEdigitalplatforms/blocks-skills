'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { Button } from './button'

export interface AlertDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export const AlertDialog: React.FC<AlertDialogProps> = ({ open, onOpenChange, children }) => {
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      {children}
    </div>,
    document.body
  )
}

export interface AlertDialogContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const AlertDialogContent: React.FC<AlertDialogContentProps> = ({ children, className, ...props }) => (
  <div
    className={cn(
      'relative w-full max-w-lg rounded-lg border border-white/10 bg-neutral-900 p-6 shadow-lg',
      className
    )}
    {...props}
  >
    {children}
  </div>
)

export const AlertDialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={cn('flex flex-col gap-2 mb-4', className)} {...props}>
    {children}
  </div>
)

export const AlertDialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={cn('flex justify-end gap-2 mt-6', className)} {...props}>
    {children}
  </div>
)

export const AlertDialogTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className, ...props }) => (
  <h2 className={cn('text-lg font-semibold text-white', className)} {...props}>
    {children}
  </h2>
)

export const AlertDialogDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ children, className, ...props }) => (
  <p className={cn('text-sm text-white/70', className)} {...props}>
    {children}
  </p>
)

export interface AlertDialogActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClick?: () => void
}

export const AlertDialogAction: React.FC<AlertDialogActionProps> = ({ children, className, onClick, ...props }) => (
  <Button onClick={onClick} className={cn('bg-white text-neutral-950 hover:bg-white/90', className)} {...props}>
    {children}
  </Button>
)

export const AlertDialogCancel: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className, onClick, ...props }) => (
  <Button
    variant="ghost"
    onClick={onClick}
    className={cn('text-white hover:bg-white/10', className)}
    {...props}
  >
    {children}
  </Button>
)
