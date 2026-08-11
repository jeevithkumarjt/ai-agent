'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Container } from './container'
import { Logo } from './logo'
import { Menu, X, ChevronDown } from 'lucide-react'

interface DropdownItem {
  href: string
  label: string
}

interface DropdownNavLink {
  label: string
  dropdown: DropdownItem[]
}

interface SimpleNavLink {
  href: string
  label: string
}

type NavLink = SimpleNavLink | DropdownNavLink

const navLinks: NavLink[] = [
  {
    label: 'Platform',
    dropdown: [
      { href: '/platform/experience-orchestration-platform/', label: 'Tryvium Platform' },
    ],
  },
  {
    label: 'Cloud Options',
    dropdown: [
      { href: '/solution/tryvium-for-aws/', label: 'AWS' },
      { href: '/solution/tryvium-for-azure/', label: 'Azure' },
      { href: '/solution/tryvium-for-gcp/', label: 'GCP' },
    ],
  },
  { href: '/why-tryvium/', label: 'Why Tryvium' },
  { href: '/about-us/', label: 'Know Us' },
]

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = (label: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setOpenDropdown(label)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setOpenDropdown(null), 150)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <Container>
        <div className="flex h-[72px] items-center justify-between">
          <Logo width={140} height={38} />

          <nav className="hidden items-center gap-9 md:flex">
            {navLinks.map((link) => {
              if ('dropdown' in link) {
                return (
                  <div
                    key={link.label}
                    className="relative"
                    onMouseEnter={() => handleMouseEnter(link.label)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <button className="flex items-center gap-1 text-[15px] font-medium text-[#1a1a2e] transition-colors hover:text-[#F26E26]">
                      {link.label}
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    {openDropdown === link.label && (
                      <div
                        className="absolute left-0 top-full mt-2 w-56 rounded-xl border border-gray-100 bg-white p-2 shadow-lg"
                        onMouseEnter={() => handleMouseEnter(link.label)}
                        onMouseLeave={handleMouseLeave}
                      >
                        {link.dropdown.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="block rounded-lg px-4 py-2.5 text-sm font-medium text-[#1a1a2e] transition-colors hover:bg-orange-50 hover:text-[#F26E26]"
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
                  className="text-[15px] font-medium text-[#1a1a2e] transition-colors hover:text-[#F26E26]"
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <Link
              href="/contact-us/"
              className="inline-flex h-[42px] items-center justify-center rounded-[30px] bg-[#F26E26] px-7 text-sm font-semibold text-white transition-colors hover:bg-[#d95e18]"
            >
              Contact Us
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
          <div className="border-t border-gray-100 pb-4 pt-2 md:hidden">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => {
                if ('dropdown' in link) {
                  return (
                    <div key={link.label} className="px-3 py-2">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                        {link.label}
                      </p>
                      <div className="ml-2 flex flex-col gap-1">
                        {link.dropdown.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="rounded-lg px-3 py-2 text-sm font-medium text-[#1a1a2e] transition-colors hover:bg-orange-50"
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
                    className="rounded-lg px-3 py-2 text-sm font-medium text-[#1a1a2e] transition-colors hover:bg-orange-50"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                )
              })}
              <div className="mt-2 px-3">
                <Link
                  href="/contact-us/"
                  className="flex w-full items-center justify-center rounded-[30px] bg-[#F26E26] px-7 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#d95e18]"
                  onClick={() => setMobileOpen(false)}
                >
                  Contact Us
                </Link>
              </div>
            </nav>
          </div>
        )}
      </Container>
    </header>
  )
}
