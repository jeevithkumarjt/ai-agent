import Link from 'next/link'
import { Container } from './container'
import { Logo } from './logo'

const footerQuickLinks = [
  { href: '/', label: 'Home' },
  { href: '/platform/experience-orchestration-platform/', label: 'Platform' },
  { href: '/why-tryvium/', label: 'Why Tryvium' },
  { href: '/about-us/', label: 'Know Us' },
  { href: '/contact-us/', label: 'Contact Us' },
]

const footerCloudOptions = [
  { href: '/solution/tryvium-for-aws/', label: 'Tryvium for AWS' },
  { href: '/solution/tryvium-for-azure/', label: 'Tryvium for Microsoft Azure' },
  { href: '/solution/tryvium-for-gcp/', label: 'Tryvium for GCP' },
]

const socialLinks = [
  { href: 'https://www.linkedin.com/company/tryvium/', label: 'LinkedIn', icon: 'in' },
  { href: 'https://x.com/tryvium_2024', label: 'X-twitter', icon: 'x' },
  { href: 'https://www.youtube.com/channel/UCIZqmKm7qG0N0jFtkA_QnfQ', label: 'YouTube', icon: 'yt' },
  { href: 'https://www.instagram.com/tryvium_official/', label: 'Instagram', icon: 'ig' },
]

export function Footer() {
  return (
    <footer className="border-t border-brand-100 bg-brand-950 text-white">
      <Container className="py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo className="text-white" />
            <p className="mt-4 text-sm leading-relaxed text-brand-300">
              Orchestrate intelligent experiences with autonomous AI agents across AWS, Microsoft Azure, and Google Cloud.
            </p>
            <div className="mt-6">
              <p className="text-sm font-semibold text-brand-300">Headquarters</p>
              <p className="mt-1 text-sm text-brand-400">
                1460 US Highway 9 North, Suite 303<br />
                Woodbridge, New Jersey 07095 USA
              </p>
              <a href="tel:+17322830499" className="mt-2 block text-sm text-brand-400 hover:text-white">
                +1 732 283 0499
              </a>
              <a href="mailto:sales@tryvium.ai" className="mt-1 block text-sm text-brand-400 hover:text-white">
                sales@tryvium.ai
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-300">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {footerQuickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-brand-300 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-300">
              Cloud Options
            </h3>
            <ul className="space-y-3">
              {footerCloudOptions.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-brand-300 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-300">
              Social
            </h3>
            <div className="flex gap-3">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-700 text-brand-400 transition-colors hover:border-brand-500 hover:text-white"
                  aria-label={s.label}
                >
                  {s.icon === 'in' && <span className="text-sm font-bold">in</span>}
                  {s.icon === 'x' && <span className="text-sm">𝕏</span>}
                  {s.icon === 'yt' && <span className="text-sm">▶</span>}
                  {s.icon === 'ig' && <span className="text-sm">📷</span>}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-brand-800 pt-8">
          <p className="text-sm text-brand-400">
            &copy; {new Date().getFullYear()} Tryvium. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/disclaimer/" className="text-sm text-brand-400 hover:text-white">
              Disclaimer
            </Link>
            <Link href="/privacy-policy/" className="text-sm text-brand-400 hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/cookie-policy/" className="text-sm text-brand-400 hover:text-white">
              Cookie Policy
            </Link>
            <a href="/sitemap_index.xml" className="text-sm text-brand-400 hover:text-white">
              Site map
            </a>
          </div>
        </div>
      </Container>
    </footer>
  )
}
