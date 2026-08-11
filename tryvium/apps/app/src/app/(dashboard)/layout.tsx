import Link from 'next/link'
import { LayoutDashboard, Settings, Users, CreditCard, BarChart3, LogOut } from 'lucide-react'

const sidebarLinks = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/team', label: 'Team', icon: Users },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <aside className="flex w-64 flex-col border-r border-brand-200 bg-white">
        <div className="flex h-16 items-center border-b border-brand-100 px-6">
          <Link href="/dashboard" className="text-xl font-bold text-brand-700">
            Try<span className="text-brand-500">vium</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {sidebarLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50"
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-brand-100 p-3">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-brand-600 transition-colors hover:bg-red-50 hover:text-red-600">
            <LogOut className="h-5 w-5" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-brand-200 bg-white px-6">
          <h2 className="text-lg font-semibold text-brand-900">Dashboard</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-brand-600">user@example.com</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
