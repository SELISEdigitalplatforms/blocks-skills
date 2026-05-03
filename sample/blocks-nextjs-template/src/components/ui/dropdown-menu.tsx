'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface DropdownMenuContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRect: DOMRect | null
  setTriggerRect: (rect: DOMRect | null) => void
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null)

export interface DropdownMenuProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ children, open: controlledOpen, onOpenChange }) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const [triggerRect, setTriggerRect] = React.useState<DOMRect | null>(null)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen, triggerRect, setTriggerRect }}>
      {children}
    </DropdownMenuContext.Provider>
  )
}

export interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({ children, asChild, ...props }) => {
  const ctx = React.useContext(DropdownMenuContext)
  if (!ctx) throw new Error('DropdownMenuTrigger must be used within DropdownMenu')

  const handleClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    ctx.setTriggerRect(rect)
    ctx.setOpen(!ctx.open)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>, {
      onClick: (e: React.MouseEvent) => {
        handleClick(e)
        ;(children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>).props.onClick?.(e)
      },
    })
  }

  return (
    <button type="button" onClick={handleClick} {...props}>
      {children}
    </button>
  )
}

export interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'bottom'
}

export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({
  children,
  className,
  align = 'end',
  side = 'bottom',
  ...props
}) => {
  const ctx = React.useContext(DropdownMenuContext)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        ctx?.setOpen(false)
      }
    }

    if (ctx?.open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [ctx])

  if (!ctx?.open || !ctx?.triggerRect) return null

  const getPositionStyle = () => {
    const rect = ctx.triggerRect!
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight

    if (align === 'end') {
      return {
        right: `${windowWidth - rect.right}px`,
        top: side === 'bottom' ? `${rect.bottom}px` : 'auto',
        bottom: side === 'top' ? `${windowHeight - rect.top}px` : 'auto',
      }
    } else if (align === 'start') {
      return {
        left: `${rect.left}px`,
        top: side === 'bottom' ? `${rect.bottom}px` : 'auto',
        bottom: side === 'top' ? `${windowHeight - rect.top}px` : 'auto',
      }
    } else {
      return {
        left: `${rect.left + rect.width / 2}px`,
        transform: 'translateX(-50%)',
        top: side === 'bottom' ? `${rect.bottom}px` : 'auto',
        bottom: side === 'top' ? `${windowHeight - rect.top}px` : 'auto',
      }
    }
  }

  return createPortal(
    <div
      ref={ref}
      className={cn(
        'fixed z-50 min-w-[8rem] overflow-hidden rounded-md border border-white/10 bg-neutral-900 p-1 shadow-lg',
        className
      )}
      style={getPositionStyle()}
      {...props}
    >
      {children}
    </div>,
    document.body
  )
}

export interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean
}

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({ children, className, inset, ...props }) => (
  <div
    className={cn(
      'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-white/70 outline-none transition-colors hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white',
      inset && 'pl-8',
      className
    )}
    {...props}
  >
    {children}
  </div>
)

export const DropdownMenuSeparator: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('-mx-1 my-1 h-px bg-white/10', className)} {...props} />
)
