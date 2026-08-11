import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, Section, Button, Badge, Card, CardContent, IconBox } from '@tryvium/ui'
import { Bot, Users, Globe, Zap, Headphones, BarChart3, Layers, ArrowRight, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'AI-Powered Contact Center Solutions with Autonomous AI agents | Tryvium',
  description: 'Modernize your customer support operations with Tryvium\'s AI Contact Center Solution, powered by Autonomous AI Agents for intelligent automation.',
  openGraph: {
    title: 'AI-Powered Contact Center Solutions with Autonomous AI agents | Tryvium',
    description: 'Modernize your customer support operations with Tryvium\'s AI Contact Center Solution.',
    url: 'https://www.tryvium.ai/services/contact-center/',
    images: [{ url: 'https://www.tryvium.ai/wp-content/uploads/2026/07/operating-model-img.webp', width: 800, height: 600, alt: 'Contact Center' }],
  },
  alternates: { canonical: 'https://www.tryvium.ai/services/contact-center/' },
}

export default function ContactCenterPage() {
  return (
    <>
      <Section background="gray" className="pt-20 pb-32">
        <Container className="text-center">
          <Badge className="mb-4">Services</Badge>
          <h1 className="text-5xl font-extrabold text-brand-900">Contact center, transformed by autonomous AI agents</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-600">Modernize your customer support operations with Tryvium&apos;s AI Contact Center Solution, powered by Autonomous AI Agents for intelligent automation.</p>
          <div className="mt-10"><Link href="/schedule-a-demo/"><Button size="xl">Schedule a Demo</Button></Link></div>
        </Container>
      </Section>
      <Section background="white">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-bold text-brand-900">The path from legacy contact center to autonomous resolution</h2>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {[
              { icon: Bot, title: 'AI-Led Resolution', desc: 'AI agents handle the complete resolution lifecycle end-to-end without escalation.' },
              { icon: Users, title: 'Human Collaboration', desc: 'Seamless handoff to human experts with full context when judgment is needed.' },
              { icon: Globe, title: 'Omnichannel Orchestration', desc: 'Unified experience across voice, chat, email, and social channels.' },
              { icon: Zap, title: 'Faster Resolution', desc: 'Reduce handle times with AI-powered context and workflow automation.' },
              { icon: BarChart3, title: 'Real-time Analytics', desc: 'Comprehensive dashboards and insights for continuous improvement.' },
              { icon: Layers, title: 'Enterprise Scale', desc: 'Architected for high-volume, mission-critical contact center deployments.' },
            ].map((b) => (
              <Card key={b.title}>
                <CardContent className="pt-8">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 text-brand-600"><b.icon className="h-6 w-6" /></div>
                  <h3 className="text-lg font-semibold text-brand-900">{b.title}</h3>
                  <p className="mt-2 text-sm text-brand-600">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>
    </>
  )
}
