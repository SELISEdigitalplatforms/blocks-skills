'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SwitchProps {
  size?: 'sm' | 'default' | 'lg'
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export const Switch: React.FC<SwitchProps> = ({
  className,
  size = 'default',
  checked,
  onCheckedChange,
  disabled,
}) => {
  const sizeClasses = {
    sm: 'w-8 h-4',
    default: 'w-10 h-5',
    lg: 'w-12 h-6',
  }

  return (
    <div className="relative inline-flex items-center">
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        disabled={disabled}
        className={cn(
          'peer appearance-none cursor-pointer rounded-full bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          sizeClasses[size],
          checked && 'bg-primary',
          className
        )}
      />
      <span
        className={cn(
          'absolute left-0.5 top-0.5 pointer-events-none rounded-full bg-white shadow transition-transform',
          size === 'sm' && 'h-3 w-3',
          size === 'default' && 'h-4 w-4',
          size === 'lg' && 'h-5 w-5',
          checked && (size === 'sm' ? 'translate-x-4' : size === 'lg' ? 'translate-x-6' : 'translate-x-5')
        )}
      />
    </div>
  )
}
