'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  scrollbarClassName?: string
}

export const ScrollArea: React.FC<ScrollAreaProps> = ({ children, className, scrollbarClassName, ...props }) => {
  const ref = React.useRef<HTMLDivElement>(null)

  return (
    <div ref={ref} className={cn('relative overflow-auto', className)} {...props}>
      {children}
      <div className={cn('absolute right-0 top-0 h-full w-2 bg-transparent', scrollbarClassName)} />
    </div>
  )
}
