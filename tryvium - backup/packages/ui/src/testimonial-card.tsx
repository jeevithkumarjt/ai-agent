import { cn } from './utils'

interface TestimonialCardProps {
  quote: string
  author: string
  role?: string
  className?: string
}

export function TestimonialCard({ quote, author, role, className }: TestimonialCardProps) {
  return (
    <div className={cn('rounded-xl border border-brand-100 bg-white p-8 shadow-sm', className)}>
      <svg className="mb-4 h-8 w-8 text-brand-200" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C7.546 6.068 5.983 8.789 5.983 11H10v10H0z" />
      </svg>
      <p className="mb-6 text-base leading-relaxed text-brand-700">{quote}</p>
      <div>
        <p className="font-semibold text-brand-900">{author}</p>
        {role && <p className="text-sm text-brand-500">{role}</p>}
      </div>
    </div>
  )
}
