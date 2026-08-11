import type { Metadata } from 'next'
import { Header } from '@tryvium/ui'
import { Footer } from '@tryvium/ui'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Experience Orchestration Platform for Enterprises | Tryvium',
    template: '%s | Tryvium',
  },
  description: 'An AI Agent Orchestration Platform that helps enterprises transition to autonomous AI agents through intelligent execution, automation, and orchestration.',
  metadataBase: new URL('https://www.tryvium.ai'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Tryvium',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://www.tryvium.ai/#organization',
      name: 'Tryvium',
      url: 'https://www.tryvium.ai',
      logo: 'https://www.tryvium.ai/wp-content/uploads/2026/05/tryvium-logo.svg',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '1460 US Highway 9 North, Suite 303',
        addressLocality: 'Woodbridge',
        addressRegion: 'NJ',
        postalCode: '07095',
        addressCountry: 'US',
      },
      contactPoint: [
        { '@type': 'ContactPoint', telephone: '+1-732-283-0499', contactType: 'sales' },
        { '@type': 'ContactPoint', email: 'sales@tryvium.ai', contactType: 'sales' },
      ],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://www.tryvium.ai/#website',
      url: 'https://www.tryvium.ai',
      name: 'Tryvium',
      description: 'Experience Orchestration Platform for Enterprises',
      publisher: { '@id': 'https://www.tryvium.ai/#organization' },
    },
    {
      '@type': 'SoftwareApplication',
      name: 'Tryvium Experience Orchestration Platform',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Cloud',
      description: 'AI Agent Orchestration Platform for enterprise service operations.',
      offers: [
        { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      ],
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-US">
      <body className="min-h-screen flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
