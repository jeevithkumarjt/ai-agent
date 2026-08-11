import Link from 'next/link'
import Image from 'next/image'
import { Container } from './container'

const quickLinks = [
  { href: '/', label: 'Home' },
  { href: '/platform/experience-orchestration-platform/', label: 'Platform' },
  { href: '/why-tryvium/', label: 'Why Tryvium' },
  { href: '/about-us/', label: 'Know Us' },
  { href: '/contact-us/', label: 'Contact Us' },
]

const cloudOptions = [
  { href: '/solution/tryvium-for-aws/', label: 'Tryvium for AWS' },
  { href: '/solution/tryvium-for-azure/', label: 'Tryvium for Microsoft Azure' },
  { href: '/solution/tryvium-for-gcp/', label: 'Tryvium for GCP' },
]

const socials = [
  {
    href: 'https://www.linkedin.com/company/tryvium/',
    label: 'LinkedIn',
    path: 'M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z',
    viewBox: '0 0 448 512',
  },
  {
    href: 'https://x.com/tryvium_2024',
    label: 'X-twitter',
    path: 'M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z',
    viewBox: '0 0 512 512',
  },
  {
    href: 'https://www.youtube.com/channel/UCIZqmKm7qG0N0jFtkA_QnfQ',
    label: 'YouTube',
    path: 'M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z',
    viewBox: '0 0 576 512',
  },
  {
    href: 'https://www.instagram.com/tryvium_official/',
    label: 'Instagram',
    path: 'M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z',
    viewBox: '0 0 448 512',
  },
]

const aiIcons = [
  { href: 'https://copilot.microsoft.com/', src: 'https://www.tryvium.ai/wp-content/uploads/2026/05/copilot.webp', alt: 'Ask Copilot' },
  { href: 'https://claude.ai/new', src: 'https://www.tryvium.ai/wp-content/uploads/2026/05/claud.png', alt: 'Ask Claude' },
  { href: 'https://chatgpt.com/', src: 'https://www.tryvium.ai/wp-content/uploads/2026/05/chatgpt.png', alt: 'Ask ChatGPT' },
  { href: 'https://grok.com/', src: 'https://www.tryvium.ai/wp-content/uploads/2026/05/grok.png', alt: 'Ask Grok' },
]

const cloudPartners = [
  { src: 'https://www.tryvium.ai/wp-content/uploads/2026/06/AWS-logo-.png', width: 200, height: 134, alt: 'AWS' },
  { src: 'https://www.tryvium.ai/wp-content/uploads/2026/05/Azure-badge.png', width: 38, height: 38, alt: 'Azure' },
  { src: 'https://www.tryvium.ai/wp-content/uploads/2026/05/Google-Cloud-badge.png', width: 42, height: 38, alt: 'GCP' },
]

const strategicPartners = [
  { src: 'https://www.tryvium.ai/wp-content/uploads/2026/05/tcs.png', width: 38, height: 24, alt: 'TCS' },
  { src: 'https://www.tryvium.ai/wp-content/uploads/2026/06/wipro.svg', width: 30, height: 24, alt: 'Wipro' },
  { src: 'https://www.tryvium.ai/wp-content/uploads/2026/06/technossus.png', width: 134, height: 24, alt: 'Technossus' },
]

const isoLogos = [
  { src: 'https://www.tryvium.ai/wp-content/uploads/2026/05/iso-logo-3.png', width: 47, height: 47, alt: 'ISO' },
  { src: 'https://www.tryvium.ai/wp-content/uploads/2026/05/ISO-27001-logo.png', width: 47, height: 47, alt: 'ISO 27001' },
]

export function Footer() {
  return (
    <footer className="bg-black text-white">
      <Container className="py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-6">
            <Image
              src="https://www.tryvium.ai/wp-content/uploads/2026/05/tryvium2.0-footer-logo.webp"
              alt="Tryvium"
              width={228}
              height={76}
              className="object-contain"
            />
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <svg width="15" height="20" viewBox="0 0 15 20" fill="none" className="mt-0.5 shrink-0">
                  <path d="M7.57125 0C3.47188 0 0 3.49187 0 7.6275C0 11.9588 4.02438 16.3881 6.73125 19.5013C6.74188 19.5138 7.17938 19.9994 7.71813 19.9994H7.76562C8.305 19.9994 8.73938 19.5138 8.75 19.5013C11.29 16.5813 15 11.7656 15 7.6275C15 3.49125 12.2919 0 7.57125 0ZM7.82187 18.6625C7.8 18.6844 7.76813 18.7088 7.74 18.7294C7.71125 18.7094 7.68 18.6844 7.65687 18.6625L7.33 18.2863C4.76375 15.3425 1.24938 11.3106 1.24938 7.62688C1.24938 4.16938 4.14438 1.24875 7.57063 1.24875C11.8388 1.24875 13.7494 4.45188 13.7494 7.62688C13.7494 10.4231 11.755 14.1369 7.82187 18.6625ZM7.52187 3.78438C5.45125 3.78438 3.77187 5.46313 3.77187 7.53438C3.77187 9.60563 5.45125 11.2844 7.52187 11.2844C9.5925 11.2844 11.2719 9.605 11.2719 7.53438C11.2719 5.46375 9.59312 3.78438 7.52187 3.78438ZM7.52187 10.0344C6.14313 10.0344 4.99312 8.88563 4.99312 7.50688C4.99312 6.12813 6.11438 5.00688 7.49312 5.00688C8.8725 5.00688 9.99312 6.12813 9.99312 7.50688C9.99375 8.88563 8.90125 10.0344 7.52187 10.0344Z" fill="white" />
                </svg>
                <div>
                  <h6 className="text-sm font-semibold text-white">Headquarters</h6>
                  <p className="mt-1 text-sm text-gray-400">
                    1460 US Highway 9 North, Suite 303<br />
                    Woodbridge, New Jersey 07095<br />
                    USA
                  </p>
                </div>
              </div>
              <a href="tel:+17322830499" className="flex items-center gap-3 text-sm text-gray-400 transition-colors hover:text-white">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
                  <path d="M3.12383 5.07212L5.11549 3.08045C5.27071 2.92171 5.45608 2.79558 5.66072 2.70946C5.86536 2.62335 6.08514 2.57899 6.30716 2.57899C6.52918 2.57899 6.74896 2.62335 6.9536 2.70946C7.15824 2.79558 7.34361 2.92171 7.49883 3.08045L8.63216 4.21378C8.78712 4.36857 8.91005 4.55239 8.99393 4.75472C9.0778 4.95705 9.12097 5.17393 9.12097 5.39295C9.12097 5.61198 9.0778 5.82885 8.99393 6.03118C8.91005 6.23352 8.78712 6.41733 8.63216 6.57212L7.89049 7.32212C9.0476 9.25304 10.6616 10.8699 12.5905 12.0305L13.3322 11.2805C13.4869 11.1255 13.6708 11.0026 13.8731 10.9187C14.0754 10.8348 14.2923 10.7916 14.5113 10.7916C14.7304 10.7916 14.9472 10.8348 15.1496 10.9187C15.3519 11.0026 15.5357 11.1255 15.6905 11.2805L16.8072 12.3888C16.9621 12.5436 17.0851 12.7274 17.1689 12.9297C17.2528 13.132 17.296 13.3489 17.296 13.568C17.296 13.787 17.2528 14.0039 17.1689 14.2062C17.0851 14.4085 16.9621 14.5923 16.8072 14.7471L14.8155 16.7555C14.6799 16.8919 14.5012 16.9773 14.3098 16.9971C14.1184 17.0168 13.9261 16.9697 13.7655 16.8638C9.50422 14.0356 5.85196 10.3834 3.02383 6.12212C2.91683 5.96242 2.86834 5.77064 2.88657 5.57928C2.90479 5.38792 2.98861 5.20875 3.12383 5.07212Z" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                +1 7322830499
              </a>
              <a href="mailto:sales@tryvium.ai" className="flex items-center gap-3 text-sm text-gray-400 transition-colors hover:text-white">
                <svg width="16" height="13" viewBox="0 0 16 13" fill="none" className="shrink-0">
                  <path d="M1.33333 11.3333L5.5 6.33333M14.6667 11.3333L10.5 6.33333M0.5 3L6.52083 7.01383C7.05542 7.37025 7.32267 7.5485 7.61158 7.61767C7.86692 7.67892 8.13308 7.67892 8.38842 7.61767C8.67733 7.5485 8.94458 7.37025 9.47917 7.01383L15.5 3M3.16667 12.1667H12.8333C13.7667 12.1667 14.2335 12.1667 14.59 11.985C14.9036 11.8252 15.1586 11.5703 15.3183 11.2567C15.5 10.9002 15.5 10.4334 15.5 9.5V3.16667C15.5 2.23325 15.5 1.76653 15.3183 1.41002C15.1586 1.09641 14.9036 0.841442 14.59 0.681658C14.2335 0.5 13.7667 0.5 12.8333 0.5H3.16667C2.23325 0.5 1.76653 0.5 1.41002 0.681658C1.09641 0.841442 0.841442 1.09641 0.681658 1.41002C0.5 1.76653 0.5 2.23324 0.5 3.16667V9.5C0.5 10.4334 0.5 10.9002 0.681658 11.2567C0.841442 11.5703 1.09641 11.8252 1.41002 11.985C1.76653 12.1667 2.23324 12.1667 3.16667 12.1667Z" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                sales@tryvium.ai
              </a>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Quick Links</h3>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-gray-400 transition-colors hover:text-[#F26E26]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Cloud Options</h3>
              <ul className="space-y-3">
                {cloudOptions.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-gray-400 transition-colors hover:text-[#F26E26]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Social</h3>
            <div className="flex gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-600 text-gray-400 transition-all hover:border-[#F26E26] hover:text-[#F26E26]"
                  aria-label={s.label}
                >
                  <svg viewBox={s.viewBox} className="h-4 w-4" fill="currentColor">
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>

            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Ask AI for a summary of Tryvium</h3>
              <div className="flex gap-3">
                {aiIcons.map((ai) => (
                  <a
                    key={ai.alt}
                    href={ai.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block transition-transform duration-200 hover:translate-y-[-4px] hover:scale-105 hover:opacity-85"
                  >
                    <Image src={ai.src} alt={ai.alt} width={40} height={40} className="rounded-full" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Cloud Partners</h3>
              <div className="flex flex-wrap items-center gap-4">
                {cloudPartners.map((p) => (
                  <Image key={p.alt} src={p.src} alt={p.alt} width={p.width} height={p.height} className="object-contain" />
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Strategic Alliance Partners</h3>
              <div className="flex flex-wrap items-center gap-4">
                {strategicPartners.map((p) => (
                  <Image key={p.alt} src={p.src} alt={p.alt} width={p.width} height={p.height} className="object-contain" />
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">ISO Certification</h3>
              <div className="flex items-center gap-4">
                {isoLogos.map((p) => (
                  <Image key={p.alt} src={p.src} alt={p.alt} width={p.width} height={p.height} className="object-contain" />
                ))}
              </div>
            </div>
          </div>
        </div>

        <hr className="my-8 border-gray-800" />

        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-gray-400">&copy; 2026 Tryvium. All right reserved.</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <a href="/sitemap_index.xml" className="text-sm text-gray-400 transition-colors hover:text-white">
              Site map
            </a>
            <Link href="/disclaimer/" className="text-sm text-gray-400 transition-colors hover:text-white">
              Disclaimer
            </Link>
            <Link href="/privacy-policy/" className="text-sm text-gray-400 transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/cookie-policy/" className="text-sm text-gray-400 transition-colors hover:text-white">
              Cookie Policy
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  )
}
