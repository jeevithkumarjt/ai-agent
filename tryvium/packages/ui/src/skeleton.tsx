'use client'

import { forwardRef } from 'react'
import { cn } from './utils'

const Skeleton = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, width, height, radius = 'lg', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'animate-pulse bg-gray-100/50 rounded-md',
        radius === 'sm' && 'rounded-sm',
        radius === 'lg' && 'rounded-lg',
        radius === 'full' && 'rounded-full',
        height && `h-[${height}]`,
        width && `w-[${width}]`,
        className
      )}
      {...props}
    />
  )
)
Skeleton.displayName = 'Skeleton'

export { Skeleton }