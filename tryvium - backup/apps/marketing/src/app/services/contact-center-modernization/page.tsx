import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, Section, Button, Badge, Card, CardContent } from '@tryvium/ui'
import { Cloud, Bot, Users, Shield, Zap, BarChart3, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact Center Modernization Services | Tryvium',
  description: 'Modernize your contact center with Tryvium\'s Contact Center Modernization Services. Deploy Autonomous AI Agents to improve resolution, reduce costs, and enhance CX.',
  openGraph: {
    title: 'Contact Center Modernization Services | Tryvium',
    description: 'Modernize your contact center with Tryvium\'s Contact Center Modernization Services.',
    url: 'https://www.tryvium.ai/services/contact-center-modernization/',
    images: [{ url: 'https://www.tryvium.ai/wp-content/uploads/2026/07/contact-center-migrations.webp', width: 800, height: 600, alt: 'Contact Center Modernization' }],
  },
  alternates: { canonical: 'https://www.tryvium.ai/services/contact-center-modernization/' },
}

export default function ModernizationPage() {
  return (
    <>
      <Section background="gray" className="pt-20 pb-32">
        <Container className="text-center">
          <Badge className="mb-4">Services</Badge>
          <h1 className="text-5xl font-extrabold text-brand-900">Contact Center Modernization</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-600">Modernize your contact center with Tryvium&apos;s Contact Center Modernization Services. Deploy Autonomous AI Agents to improve resolution, reduce costs, and enhance CX.</p>
          <div className="mt-10"><Link href="/schedule-a-demo/"><Button size="xl">Schedule a Demo</Button></Link></div>
        </Container>
      </Section>
      <Section background="white">
        <Container>
          <h2 className="mb-12 text-center text-3xl font-bold text-brand-900">How do we modernize your contact center?</h2>
          <div className="grid gap-8 md:grid-cols-4">
            {[
              { step: '01', title: 'Assess', desc: 'Evaluate current infrastructure, map customer journeys, and identify automation opportunities.' },
              { step: '02', title: 'Migrate', desc: 'Deploy AI agents alongside existing operations with zero disruption to ongoing services.' },
              { step: '03', title: 'Optimize', desc: 'Enable AI-human collaboration with shared context and continuous performance monitoring.' },
              { step: '04', title: 'Scale', desc: 'Extend AI-led operations across channels, departments, and geographies with governance.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-600">{s.step}</div>
                <h3 className="text-lg font-semibold text-brand-900">{s.title}</h3>
                <p className="mt-2 text-sm text-brand-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>
    </>
  )
}
