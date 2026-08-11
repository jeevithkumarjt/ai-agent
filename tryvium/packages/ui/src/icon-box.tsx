import { cn } from './utils'

interface IconBoxProps {
  icon: React.ReactNode
  title: string
  description: string
  className?: string
}

export function IconBox({ icon, title, description, className }: IconBoxProps) {
  return (
    <div className={cn('flex flex-col items-start gap-4 rounded-xl p-6', className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-brand-900">{title}</h3>
      <p className="text-sm leading-relaxed text-brand-600">{description}</p>
    </div>
  )
}
