import { cn } from './utils'

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  background?: 'white' | 'brand' | 'gray'
}

export function Section({ className, children, background = 'white', ...props }: SectionProps) {
  const bgMap = {
    white: 'bg-white',
    brand: 'bg-brand-50',
    gray: 'bg-gray-50',
  }

  return (
    <section className={cn('py-16 md:py-24', bgMap[background], className)} {...props}>
      {children}
    </section>
  )
}
