'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface CommandProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Command: React.FC<CommandProps> = ({ children, className, ...props }) => (
  <div className={cn('flex flex-col overflow-hidden rounded-md bg-neutral-900', className)} {...props}>
    {children}
  </div>
)

export interface CommandInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onValueChange?: (value: string) => void
}

export const CommandInput: React.FC<CommandInputProps> = ({ className, onValueChange, onChange, ...props }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e)
    onValueChange?.(e.target.value)
  }

  return (
    <div className="flex items-center border-b border-white/10 px-3">
      <svg className="mr-2 h-4 w-4 shrink-0 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        onChange={handleChange}
        className={cn(
          'flex h-10 w-full rounded-md bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/40',
          className
        )}
        {...props}
      />
    </div>
  )
}

export const CommandList: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={cn('max-h-[300px] overflow-y-auto overflow-x-hidden p-1', className)} {...props}>
    {children}
  </div>
)

export const CommandEmpty: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={cn('py-6 text-center text-sm text-white/50', className)} {...props}>
    {children}
  </div>
)

export const CommandGroup: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={cn('overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-white/40', className)} {...props}>
    {props.title && <div className="px-2 py-1.5 text-xs font-medium text-white/40">{props.title}</div>}
    {children}
  </div>
)

export interface CommandItemProps {
  children?: React.ReactNode
  className?: string
  onSelect?: () => void
  value?: string
}

export const CommandItem: React.FC<CommandItemProps> = ({ children, className, onSelect, value, ...props }) => (
  <div
    className={cn(
      'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-white outline-none hover:bg-white/10 data-[selected=true]:bg-white/10',
      className
    )}
    onClick={onSelect}
    data-value={value}
    {...props}
  >
    {children}
  </div>
)

export const CommandSeparator: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('-mx-1 h-px bg-white/10', className)} {...props} />
)
