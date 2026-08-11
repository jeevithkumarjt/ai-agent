import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Container, Section, Button, Badge, Card, CardContent } from '@tryvium/ui'
import { Bot, BarChart3, Globe, GitBranch, Shield, Zap, Gauge, Layers, Clock, TrendingUp } from 'lucide-react'

export const metadata: Metadata = {
  title: 'AI-Powered Contact Center Solutions with Autonomous AI agents | Tryvium',
  description: 'Modernize your customer support operations with Tryvium\'s AI Contact Center Solution, powered by Autonomous AI Agents for intelligent automation.',
  openGraph: {
    title: 'AI-Powered Contact Center Solutions with Autonomous AI agents | Tryvium',
    description: 'Modernize your customer support operations with Tryvium\'s AI Contact Center Solution, powered by Autonomous AI Agents for intelligent automation.',
    url: 'https://www.tryvium.ai/services/contact-center/',
    images: [{ url: 'https://www.tryvium.ai/wp-content/uploads/2026/07/operating-model-img.webp', width: 460, height: 375, alt: 'Contact Center' }],
  },
  alternates: { canonical: 'https://www.tryvium.ai/services/contact-center/' },
}

const steps = [
  { number: '01', title: 'Assess and Align', desc: 'We start by understanding your current customer engagement setup, then identify where interactions stall, escalate, or repeat and align that against your business goals.' },
  { number: '02', title: 'Design the AI journey', desc: 'Our experts design a journey where AI agents resolve interactions directly, built around your specific pain points, goals and business policies. It is not a one-size-fits-all solution.' },
  { number: '03', title: 'Connect your enterprise systems', desc: 'We integrate with your existing CRMs, collaboration platforms and enterprise systems without disrupting your operations, so AI agents have the context they need from day one.' },
  { number: '04', title: 'Autonomous Resolution', desc: 'AI agents handle interactions end to end — no hold time, no repeats, no escalation, for everything from routine requests to complex, multi-step issues.' },
  { number: '05', title: 'Monitor & Optimize', desc: 'Full visibility into resolution rates, agent productivity, and customer sentiment, as interactions happen.' },
  { number: '06', title: 'Scale with confidence', desc: 'Tryvium grows with your business, adjusting to changing demand while keeping cost per resolution low.' },
]

const resolutions = [
  { icon: Bot, title: 'Zero-touch resolution', desc: 'AI agents orchestrate business processes and enterprise systems to resolve interactions end to end, without involving human intervention.', img: 'https://www.tryvium.ai/wp-content/uploads/2026/07/resolution-contact-center-icon-1.png' },
  { icon: GitBranch, title: 'Enterprise-wide orchestration', desc: 'Coordinate AI agents, workflows, and enterprise applications across every customer interaction from a single orchestration layer.', img: 'https://www.tryvium.ai/wp-content/uploads/2026/07/resolution-contact-center-icon-2.png' },
  { icon: Globe, title: 'Unified context', desc: 'AI agents access customer history, business data, and workflow context across connected systems to deliver informed, personalized resolutions.', img: 'https://www.tryvium.ai/wp-content/uploads/2026/07/resolution-contact-center-icon-3.png' },
  { icon: Shield, title: 'Human governance', desc: 'Built-in human oversight ensures policy compliance, approvals, and exception handling without disrupting autonomous execution.', img: 'https://www.tryvium.ai/wp-content/uploads/2026/07/resolution-contact-center-icon-4.png' },
  { icon: Zap, title: 'Operational efficiency', desc: 'Reduce manual effort, eliminate unnecessary handoffs, and lower the cost of resolution while improving service consistency.', img: 'https://www.tryvium.ai/wp-content/uploads/2026/07/resolution-contact-center-icon-5.png' },
  { icon: BarChart3, title: 'Real-time intelligence', desc: 'Every interaction is measured, governed, and analyzed, creating a continuous feedback loop that improves performance over time.', img: 'https://www.tryvium.ai/wp-content/uploads/2026/07/resolution-contact-center-icon-6.png' },
]

const whyChoose = [
  { icon: Zap, title: 'Faster time-to-value', desc: 'Deploy AI agents in days, not months with a structured implementation approach that delivers measurable outcomes fast.' },
  { icon: Shield, title: 'Built on enterprise-grade infrastructure', desc: 'Runs on Microsoft Azure, AWS, and GCP, so you\'re deploying on an infrastructure your enterprise already trusts.' },
  { icon: Gauge, title: 'Configurable to your industry', desc: 'Policies, workflows, and compliance requirements to adapt to your industry, not the other way around.' },
  { icon: TrendingUp, title: 'A partner through the transition', desc: 'From assessment to autonomous resolution, Tryvium\'s team stays involved, not just at go-live.' },
]

export default function ContactCenterPage() {
  return (
    <>
      <Section background="gray" className="pt-20 pb-32">
        <Container className="text-center">
          <Badge className="mb-4">Contact center</Badge>
          <h1 className="text-5xl font-extrabold text-brand-900">Contact center,&nbsp;transformed by autonomous AI agents</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-600">Tryvium&rsquo;s AI agents operate autonomously, resolving interactions without hold times, handoffs, repetition, or escalations.</p>
          <div className="mt-10"><Link href="/contact-us/"><Button size="xl">Schedule a demo</Button></Link></div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <h2 className="text-4xl font-bold text-brand-900">The contact center is ready for a new operating model</h2>
            <p className="mt-6 text-lg text-brand-600">The traditional contact center is built around automation-escalation model, moving customers from IVRs to bots to human agents until someone can solve the problem.</p>
            <p className="mt-4 text-lg text-brand-600">Tryvium replaces this fragmented service model with autonomous AI agents that orchestrate and resolve interactions from end to end.</p>
            <p className="mt-4 text-lg text-brand-600">Built-in human governance ensures policy compliance, oversight, and control, resulting in faster resolutions, fewer handoffs, and lower operating costs.</p>
          </div>
          <div className="flex justify-center">
            <Image
              src="https://www.tryvium.ai/wp-content/uploads/2026/07/operating-model-img.webp"
              alt="Operating Model"
              width={460}
              height={375}
              className="h-auto"
            />
          </div>
        </Container>
      </Section>

      <Section background="gray">
        <Container>
          <h2 className="mb-16 text-center text-4xl font-bold text-brand-900">The path from legacy contact center to autonomous resolution</h2>
          <div className="relative">
            <Image
              src="https://www.tryvium.ai/wp-content/uploads/2026/07/contact-center-bg-1.webp"
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
          <h2 className="mb-16 text-center text-4xl font-bold text-brand-900">What autonomous resolution delivers for your contact center</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {resolutions.map((r) => (
              <Card key={r.title}>
                <CardContent className="pt-8">
                  <div className="mb-4">
                    <Image src={r.img} alt={r.title} width={60} height={60} className="h-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-brand-900">{r.title}</h3>
                  <p className="mt-2 text-sm text-brand-600">{r.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section background="gray">
        <Container>
          <h2 className="mb-16 text-center text-4xl font-bold text-brand-900">Why enterprises choose Tryvium for contact center needs</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {whyChoose.map((w) => (
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
            <h2 className="text-4xl font-bold text-brand-900">Capabilities built for enterprise scale</h2>
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
          <h2 className="text-4xl font-bold text-brand-900">Bring autonomous resolution to your contact center</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-brand-600">No hold. No repeats. No escalation. Just resolution.</p>
          <div className="mt-8"><Link href="/contact-us/"><Button size="xl">Schedule a Demo</Button></Link></div>
        </Container>
      </Section>
    </>
  )
}
