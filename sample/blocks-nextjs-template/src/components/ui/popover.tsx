'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

export interface PopoverProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

interface PopoverContextType {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  setTriggerRect?: (rect: DOMRect | null) => void
  triggerRect?: DOMRect | null
}

const PopoverContext = React.createContext<PopoverContextType>({})

export const Popover: React.FC<PopoverProps> = ({ children, open, onOpenChange }) => {
  const [triggerRect, setTriggerRect] = React.useState<DOMRect | null>(null)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const contextValue = React.useMemo(() => ({
    open: open ?? false,
    onOpenChange,
    setTriggerRect,
    triggerRect,
  }), [open, onOpenChange, triggerRect])

  return (
    <PopoverContext.Provider value={contextValue}>
      {children}
    </PopoverContext.Provider>
  )
}

export interface PopoverTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

export const PopoverTrigger: React.FC<PopoverTriggerProps> = ({ children, asChild }) => {
  const { open, onOpenChange, setTriggerRect } = React.useContext(PopoverContext)

  const handleClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setTriggerRect?.(rect)
    onOpenChange?.(!open)
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
    <div onClick={handleClick} style={{ display: 'inline-block' }}>
      {children}
    </div>
  )
}

export interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
}

export const PopoverContent: React.FC<PopoverContentProps> = ({
  children,
  className,
  align = 'center',
  side = 'bottom',
  ...props
}) => {
  const { open, onOpenChange, triggerRect } = React.useContext(PopoverContext)
  const [mounted, setMounted] = React.useState(false)
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
        onOpenChange?.(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, onOpenChange])

  if (!mounted || !open || !triggerRect) return null

  const getPositionStyle = () => {
    if (align === 'center') {
      return {
        left: `${triggerRect.left + triggerRect.width / 2}px`,
        transform: 'translateX(-50%)',
      }
    } else if (align === 'start') {
      return {
        left: `${triggerRect.left}px`,
        transform: 'translateX(0)',
      }
    } else {
      return {
        left: `${triggerRect.right}px`,
        transform: 'translateX(-100%)',
      }
    }
  }

  const positionStyle = getPositionStyle()

  return createPortal(
    <div
      ref={contentRef}
      className={cn(
        'fixed z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover shadow-lg',
        className
      )}
      style={{
        top: side === 'bottom' ? `${triggerRect.bottom}px` : 'auto',
        bottom: side === 'top' ? `${window.innerHeight - triggerRect.top}px` : 'auto',
        ...positionStyle,
      }}
      {...props}
    >
      {children}
    </div>,
    document.body
  )
}
