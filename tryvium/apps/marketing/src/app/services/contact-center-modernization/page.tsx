import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Container, Section, Button, Badge, Card, CardContent } from '@tryvium/ui'
import { Zap, TrendingUp, BarChart3, Gauge, Shield, Activity, Clock, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact Center Modernization Services | Tryvium',
  description: 'Modernize your contact center with Tryvium\'s Contact Center Modernization Services. Deploy Autonomous AI Agents to improve resolution, reduce costs, and enhance CX.',
  openGraph: {
    title: 'Contact Center Modernization Services | Tryvium',
    description: 'Modernize your contact center with Tryvium\'s Contact Center Modernization Services. Deploy Autonomous AI Agents to improve resolution, reduce costs, and enhance CX.',
    url: 'https://www.tryvium.ai/services/contact-center-modernization/',
    images: [{ url: 'https://www.tryvium.ai/wp-content/uploads/2026/07/contact-center-migrations.webp', width: 460, height: 375, alt: 'Contact Center Modernization' }],
  },
  alternates: { canonical: 'https://www.tryvium.ai/services/contact-center-modernization/' },
}

const steps = [
  { number: '01', title: 'Assessment & Strategy', desc: 'We evaluate your current contact center, map where automation and escalation break down, understand the loopholes in managing customer interactions and build a modernization roadmap aligned to your business goals.' },
  { number: '02', title: 'Platform Selection & Architecture Design', desc: 'Whether you\'re choosing a new cloud platform or building on your existing cloud environment, we design a secure, scalable architecture optimized for AI agent orchestration across Microsoft Azure, Google Cloud Platform, and AWS.' },
  { number: '03', title: 'Migration & Integration', desc: 'We seamlessly migrate IVRs, call flows, and contact center applications without interrupting business operations. By integrating contact centers with your existing CRM, ticketing, and enterprise systems, we enable AI agents to retrieve information, execute workflows, and resolve issues autonomously.' },
  { number: '04', title: 'Modernization', desc: 'We deploy AI agents that resolve issues end to end through autonomous self-service with human governance, backed by intelligent routing to human agents only for exceptional cases, persistent context across every channel and handoff, and real-time analytics.' },
  { number: '05', title: 'Optimization & Continuous Improvement', desc: 'We continuously monitor AI agent performance and orchestration workflows using real-time analytics. By tracking key metrics such as autonomous resolution rate, first contact resolution (FCR), CSAT, and average handling time (AHT), we identify opportunities to improve customer outcomes over time.' },
]

const benefits = [
  { icon: Zap, title: 'Faster resolution', desc: 'AI agents resolve customer issues autonomously, reducing resolution times instead of simply routing interactions faster.', img: 'https://www.tryvium.ai/wp-content/uploads/2026/07/key-benefits-1.webp' },
  { icon: TrendingUp, title: 'Lower operating costs', desc: 'Increase autonomous resolution to reduce escalations, optimize staffing requirements, and lower the cost of servicing every customer interaction.', img: 'https://www.tryvium.ai/wp-content/uploads/2026/07/key-benefits-2.webp' },
  { icon: Gauge, title: 'Built to scale', desc: 'Handle growing customer volumes without increasing headcount or expanding contact center infrastructure.', img: 'https://www.tryvium.ai/wp-content/uploads/2026/07/key-benefits-3.webp' },
  { icon: Users, title: 'Higher agent productivity', desc: 'Free human agents to focus on high-value, complex interactions while AI agents handle routine and repetitive requests.', img: 'https://www.tryvium.ai/wp-content/uploads/2026/07/key-benefits-4.webp' },
  { icon: BarChart3, title: 'Actionable insights', desc: 'Gain real-time visibility into customer interactions and AI agent performance to continuously optimize operations and improve business outcomes.', img: 'https://www.tryvium.ai/wp-content/uploads/2026/07/key-benefits-5.webp' },
  { icon: Shield, title: 'Lower migration risk', desc: 'Transition from legacy contact center platforms with minimal downtime, business disruption, and customer impact.', img: 'https://www.tryvium.ai/wp-content/uploads/2026/07/key-benefits-6.webp' },
]

const whyTrust = [
  { icon: Activity, title: 'End-to-end migration expertise', desc: 'We manage your entire migration and modernization journey, from assessment through post-deployment optimization.' },
  { icon: Shield, title: 'De-risked migration frameworks', desc: 'Pre-built tools and proven frameworks help you migrate faster without compromising uptime or CX.' },
  { icon: Gauge, title: 'Industry-tailored AI agents', desc: 'AI agents configured for your industry\'s workflows, compliance needs, and customer expectations.' },
  { icon: TrendingUp, title: 'Continuous optimization', desc: 'Resolution outcomes are tracked and tuned after deployment, so performance keeps improving over time.' },
]

export default function ModernizationPage() {
  return (
    <>
      <Section background="gray" className="pt-20 pb-32">
        <Container className="text-center">
          <Badge className="mb-4">Contact center</Badge>
          <h1 className="text-5xl font-extrabold text-brand-900">Contact Center Modernization</h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-brand-600">Modernize your contact center by moving away from rigid, legacy platforms and transition to a contact center where AI agents resolve issues end to end without compromising the customer experience.</p>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-brand-600">Tryvium helps you replace the traditional automation-and-escalation model with an AI agent orchestration platform that enables autonomous resolution at enterprise scale.</p>
          <div className="mt-10"><Link href="/contact-us/"><Button size="xl">Speak to an expert</Button></Link></div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <h2 className="text-4xl font-bold text-brand-900">Why enterprises should modernize their contact centers now?</h2>
            <p className="mt-6 text-lg text-brand-600">Legacy contact center migrations often come with risks such as downtime, data loss, and customer experience challenges. Tryvium removes that complexity, enabling a seamless transition to autonomous resolution without impacting business continuity.</p>
          </div>
          <div className="flex justify-center">
            <Image
              src="https://www.tryvium.ai/wp-content/uploads/2026/07/contact-center-migrations.webp"
              alt="Contact Center Migrations"
              width={460}
              height={375}
              className="h-auto"
            />
          </div>
        </Container>
      </Section>

      <Section background="gray">
        <Container>
          <h2 className="mb-16 text-center text-4xl font-bold text-brand-900">How do we modernize your contact center?</h2>
          <div className="relative">
            <Image
              src="https://www.tryvium.ai/wp-content/uploads/2026/07/contact-center-bg.webp"
              alt="Unified Experience Orchestration"
              width={1520}
              height={574}
              className="mb-12 w-full rounded-xl"
            />
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((s) => (
              <Card key={s.number}>
                <CardContent className="pt-8">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 text-xl font-bold text-brand-600">{s.number}</div>
                  <h3 className="text-lg font-semibold text-brand-900">{s.title}</h3>
                  <p className="mt-2 text-sm text-brand-600">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <h2 className="mb-16 text-center text-4xl font-bold text-brand-900">Key benefits of modernizing your contact center</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {benefits.map((b) => (
              <Card key={b.title}>
                <CardContent className="pt-8">
                  <div className="mb-4">
                    <Image src={b.img} alt={b.title} width={135} height={135} className="h-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-brand-900">{b.title}</h3>
                  <p className="mt-2 text-sm text-brand-600">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section background="gray">
        <Container>
          <h2 className="mb-16 text-center text-4xl font-bold text-brand-900">Why enterprises trust Tryvium</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {whyTrust.map((w) => (
              <Card key={w.title}>
                <CardContent className="flex items-start gap-4 pt-8">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                    <w.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-brand-900">{w.title}</h3>
                    <p className="mt-2 text-sm text-brand-600">{w.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section background="brand">
        <Container>
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-bold text-brand-900">Enterprise value through contact center modernization</h2>
          </div>
          <div className="flex justify-center">
            <Image
              src="https://www.tryvium.ai/wp-content/uploads/2026/07/enterprise-scale.webp"
              alt="Enterprise Scale"
              width={800}
              height={500}
              className="h-auto rounded-xl"
            />
          </div>
        </Container>
      </Section>

      <Section background="white" className="text-center">
        <Container>
          <h2 className="text-4xl font-bold text-brand-900">Ready to modernize your enterprise contact center?</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-brand-600">Shift to autonomous resolution with Tryvium.</p>
          <div className="mt-8"><Link href="/contact-us/"><Button size="xl">Speak to an expert</Button></Link></div>
        </Container>
      </Section>
    </>
  )
}
