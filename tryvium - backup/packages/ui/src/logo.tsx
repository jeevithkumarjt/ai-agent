import Link from 'next/link'

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={className}>
      <span className="text-2xl font-bold text-brand-700">
        Try<span className="text-brand-500">vium</span>
      </span>
    </Link>
  )
}
