import { cn } from './utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantMap = {
    default: 'bg-brand-100 text-brand-800',
    secondary: 'bg-gray-100 text-gray-800',
    outline: 'border border-brand-200 text-brand-700',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
        variantMap[variant],
        className
      )}
      {...props}
    />
  )
}
