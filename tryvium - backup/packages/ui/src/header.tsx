'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Container } from './container'
import { Button } from './button'
import { Logo } from './logo'
import { Menu, X, ChevronDown } from 'lucide-react'

const navLinks = [
  { href: '/platform/experience-orchestration-platform/', label: 'Tryvium Platform' },
  {
    label: 'Cloud Options',
    dropdown: [
      { href: '/solution/tryvium-for-aws/', label: 'on AWS' },
      { href: '/solution/tryvium-for-azure/', label: 'on Microsoft Azure' },
      { href: '/solution/tryvium-for-gcp/', label: 'on GCP' },
    ],
  },
  { href: '/why-tryvium/', label: 'Why Tryvium' },
  { href: '/about-us/', label: 'Know Us' },
]

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-brand-100 bg-white/95 backdrop-blur-sm">
      <Container>
        <div className="flex h-20 items-center justify-between">
          <Logo />

          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => {
              if ('dropdown' in link) {
                return (
                  <div
                    key={link.label}
                    className="relative"
                    onMouseEnter={() => setDropdownOpen(true)}
                    onMouseLeave={() => setDropdownOpen(false)}
                  >
                    <button className="flex items-center gap-1 text-sm font-medium text-brand-700 transition-colors hover:text-brand-500">
                      {link.label}
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    {dropdownOpen && (
                      <div className="absolute left-0 top-full mt-2 w-56 rounded-xl border border-brand-100 bg-white p-2 shadow-lg">
                        {link.dropdown.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="block rounded-lg px-4 py-2.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }
              return (
                <Link
                  key={link.href}
                  href={link.href!}
                  className="text-sm font-medium text-brand-700 transition-colors hover:text-brand-500"
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <Link href="/contact-us/">
              <Button size="sm" variant="default">Contact Us</Button>
            </Link>
          </div>

          <button
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-brand-100 pb-4 pt-2 md:hidden">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => {
                if ('dropdown' in link) {
                  return (
                    <div key={link.label} className="px-3 py-2">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-400">{link.label}</p>
                      <div className="ml-2 flex flex-col gap-1">
                        {link.dropdown.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="rounded-lg px-3 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50"
                            onClick={() => setMobileOpen(false)}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )
                }
                return (
                  <Link
                    key={link.href}
                    href={link.href!}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                )
              })}
              <div className="mt-2 px-3">
                <Link href="/contact-us/" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full" size="sm">Contact Us</Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </Container>
    </header>
  )
}
