import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, Section, Button, Badge, Card, CardContent, IconBox } from '@tryvium/ui'
import { ArrowRight, Bot, Users, Shield, Workflow, Globe, BarChart3, Zap, Layers, CheckCircle, ChevronRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Experience Orchestration Platform for Enterprises | Tryvium',
  description: 'An AI Agent Orchestration Platform that helps enterprises transition to autonomous AI agents through intelligent execution, automation, and orchestration.',
  openGraph: {
    title: 'Experience Orchestration Platform for Enterprises | Tryvium',
    description: 'An AI Agent Orchestration Platform that helps enterprises transition to autonomous AI agents through intelligent execution, automation, and orchestration.',
    url: 'https://www.tryvium.ai/',
  },
  alternates: { canonical: 'https://www.tryvium.ai/' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Tryvium | AI Agent Orchestration Platform',
  breadcrumb: { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.tryvium.ai/' }] },
}

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <Section background="gray" className="relative overflow-hidden pt-20 pb-32">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-6">Experience Orchestration Platform</Badge>
            <h1 className="text-5xl font-extrabold tracking-tight text-brand-900 sm:text-6xl lg:text-7xl">
              Orchestrate Intelligent Experiences with{' '}
              <span className="text-brand-600">Autonomous AI Agents</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-brand-600">
              Deploy across AWS, Microsoft Azure, and Google Cloud and orchestrate every interaction, workflow, and decision through a unified intelligence layer for seamless experiences.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/schedule-a-demo/"><Button size="xl">Schedule a Demo</Button></Link>
              <Link href="/platform/experience-orchestration-platform/">
                <Button variant="outline" size="xl">Explore the Platform <ArrowRight className="ml-2 h-5 w-5" /></Button>
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      {/* Trusted by leading enterprises */}
      <Section background="white" className="py-16">
        <Container>
          <p className="mb-10 text-center text-sm font-medium uppercase tracking-wider text-brand-500">Trusted by leading enterprises to deliver intelligent, AI-orchestrated experiences at scale</p>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-50 grayscale">
            {['metso', 'abb', 'teva-pharmaceuticals', 'cargill', 'roquette', 'constellation-energy-corporation'].map((name) => (
              <span key={name} className="text-xl font-bold text-brand-400">{name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
            ))}
          </div>
        </Container>
      </Section>

      {/* The Problem */}
      <Section background="gray" className="py-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">The Problem</Badge>
            <h2 className="text-4xl font-bold text-brand-900">Legacy service operations were built for human teams, not AI agents</h2>
            <p className="mt-6 text-lg leading-relaxed text-brand-600">Today&apos;s customer service platforms were designed to hire, train, schedule, route, and manage human agents. While AI has been added to these environments, it often functions as a feature rather than the operational foundation of the service model.</p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              { icon: Users, title: 'Human-centric operations', desc: 'Contact centers were built to optimize human agent productivity and workforce management.' },
              { icon: Workflow, title: 'Automation-to-escalation models', desc: 'Customers move from bots to queues to human agents, creating fragmented experiences.' },
              { icon: BarChart3, title: 'Inconsistent outcomes', desc: 'Service quality varies based on staffing levels, channels, and individual agent performance.' },
            ].map((item) => (
              <Card key={item.title} className="text-center">
                <CardContent className="pt-8">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-100"><item.icon className="h-7 w-7 text-brand-600" /></div>
                  <h3 className="text-lg font-semibold text-brand-900">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-brand-600">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* The Shift */}
      <Section background="white" className="py-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">The Shift</Badge>
            <h2 className="text-4xl font-bold text-brand-900">The future of customer service is AI agent-orchestrated</h2>
            <p className="mt-6 text-lg leading-relaxed text-brand-600">AI agents are becoming the primary interface for customer engagement, coordinating interactions, workflows, enterprise systems, and human expertise behind the scenes.</p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              { icon: Bot, title: 'Continuous AI engagement', desc: 'AI remains connected throughout the customer journey, shepherding every interaction toward resolution.' },
              { icon: Layers, title: 'Unified service execution', desc: 'AI agents orchestrate workflows, enterprise systems, and human teams in real time.' },
              { icon: Shield, title: 'Human governance', desc: 'Humans participate when judgment, research, or intervention is required.' },
            ].map((item) => (
              <Card key={item.title} className="border-brand-200 bg-brand-50">
                <CardContent className="pt-8">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-600 text-white"><item.icon className="h-7 w-7" /></div>
                  <h3 className="text-lg font-semibold text-brand-900">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-brand-600">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* AI-agent orchestration - 3 columns */}
      <Section background="gray" className="py-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">AI-agent orchestration</Badge>
            <h2 className="text-4xl font-bold text-brand-900">How does Tryvium power autonomous AI experiences</h2>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              { num: '01', icon: Bot, title: 'AI agent orchestration', desc: 'Coordinate AI agents, workflows, and business processes across customer service operations.' },
              { num: '02', icon: Users, title: 'Human agent workspace', desc: 'Enable seamless collaboration between AI agents and human experts with shared context and visibility.' },
              { num: '03', icon: Shield, title: 'Governance and compliance', desc: 'Apply enterprise policies, human oversight, security controls, and compliance frameworks.' },
            ].map((item) => (
              <div key={item.num} className="relative rounded-xl border border-brand-200 bg-white p-8 shadow-sm">
                <span className="absolute right-6 top-6 text-5xl font-black text-brand-100">{item.num}</span>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 text-brand-600"><item.icon className="h-6 w-6" /></div>
                <h3 className="text-xl font-semibold text-brand-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-brand-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Why enterprises choose */}
      <Section background="white" className="py-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">The Platform</Badge>
            <h2 className="text-4xl font-bold text-brand-900">Why enterprises choose Tryvium for AI-orchestrated experiences</h2>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {[
              { icon: Users, title: 'AI + human collaboration', desc: 'Seamless handoffs between AI agents and human experts with full context.' },
              { icon: Globe, title: 'Context that never gets lost', desc: 'Persistent interaction history across channels and sessions.' },
              { icon: Bot, title: 'Built for AI-led operations', desc: 'Purpose-built for autonomous AI agent orchestration at scale.' },
              { icon: Layers, title: 'Designed for enterprise scale', desc: 'Architected for high-volume, mission-critical deployments.' },
              { icon: Zap, title: 'Omnichannel orchestration', desc: 'Unify voice, chat, email, and messaging in a single platform.' },
              { icon: BarChart3, title: 'Faster deployment', desc: 'Pre-built integrations and templates for rapid time-to-value.' },
            ].map((item) => (
              <IconBox key={item.title} icon={<item.icon className="h-6 w-6" />} title={item.title} description={item.desc} />
            ))}
          </div>
        </Container>
      </Section>

      {/* Security */}
      <Section background="brand" className="py-24">
        <Container className="text-center">
          <Badge variant="secondary" className="mb-4">Security & Compliance</Badge>
          <h2 className="text-4xl font-bold text-brand-900">Designed for Security. Built for Compliance.</h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-600">Security, privacy, and governance are integrated into every layer of our platform, helping enterprises accelerate AI adoption while maintaining trust and control.</p>
          <div className="mt-10 flex flex-wrap justify-center gap-8">
            {['ISO 9001', 'ISO 27001', 'SOC 2'].map((cert) => (
              <div key={cert} className="flex items-center gap-2 rounded-lg border border-brand-200 bg-white px-6 py-3 shadow-sm">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-semibold text-brand-900">{cert}</span>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* The Next Era */}
      <Section background="white" className="py-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">The Next Era</Badge>
            <h2 className="text-4xl font-bold text-brand-900">Built for the transition to autonomous AI agents</h2>
          </div>
          <div className="mt-16 space-y-8">
            {[
              { step: '01', title: 'Introduce AI-orchestrated interactions', desc: 'Deploy AI agents alongside existing customer service operations without disrupting current processes.' },
              { step: '02', title: 'Orchestrate AI and human collaboration', desc: 'Enable AI agents to coordinate human expertise when exceptions, approvals, or specialized knowledge are required.' },
              { step: '03', title: 'Scale autonomous service execution', desc: 'Extend AI-led operations across channels, workflows, and customer journeys while maintaining consistency, control, and service quality.' },
              { step: '04', title: 'Optimize and Govern', desc: 'Measure performance, enforce policies, and continuously improve customer and operational outcomes.' },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 rounded-xl border border-brand-100 bg-gray-50 p-8">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-lg font-bold text-white">{item.step}</span>
                <div>
                  <h3 className="text-xl font-semibold text-brand-900">{item.title}</h3>
                  <p className="mt-2 text-brand-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Testimonials */}
      <Section background="gray" className="py-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">Stories of Success</Badge>
            <h2 className="text-4xl font-bold text-brand-900">Hear from our customers</h2>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-2">
            <Card>
              <CardContent className="pt-8">
                <p className="text-sm leading-relaxed text-brand-700">&ldquo;We&apos;ve been working with Tryvium for several years, and user adoption has been seamless. The platform enhances the overall experience through its extensive capabilities, intuitive administration console, and powerful analytics.&rdquo;</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-600">AC</div>
                  <div><p className="text-sm font-semibold text-brand-900">Atlas Copco</p></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-8">
                <p className="text-sm leading-relaxed text-brand-700">&ldquo;Tryvium provides a user-friendly and comprehensive dashboard that offers real-time visibility into chat traffic and performance. Its intuitive experience for end users has contributed to a 30% increase in chat adoption.&rdquo;</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-600">DS</div>
                  <div><p className="text-sm font-semibold text-brand-900">DSM</p></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>

      {/* Hyperscaler */}
      <Section background="white" className="py-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">Hyperscaler Alignment</Badge>
            <h2 className="text-4xl font-bold text-brand-900">Works with your existing cloud ecosystem</h2>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              { name: 'AWS', desc: 'Extend and modernize contact center operations with AI agent orchestration, intelligent automation, and seamless integration across your enterprise workflows.', href: '/solution/tryvium-for-aws/' },
              { name: 'Microsoft Azure', desc: 'Unlock the full value of Microsoft\'s cloud, AI, collaboration, and business applications by coordinating them through a single orchestration framework.', href: '/solution/tryvium-for-azure/' },
              { name: 'Google Cloud', desc: 'Harness enterprise-grade AI models, data services, and cloud infrastructure to power intelligent, scalable, and context-aware experiences.', href: '/solution/tryvium-for-gcp/' },
            ].map((item) => (
              <Card key={item.name}>
                <CardContent className="pt-8 text-center">
                  <h3 className="text-2xl font-bold text-brand-900">{item.name}</h3>
                  <p className="mt-3 text-sm text-brand-600">{item.desc}</p>
                  <Link href={item.href}><Button variant="link" className="mt-4">Learn more <ArrowRight className="ml-1 h-4 w-4" /></Button></Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section background="brand" className="py-24">
        <Container className="text-center">
          <h2 className="text-4xl font-bold text-brand-900">Ready to Orchestrate Autonomous Experiences?</h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-600">Make autonomous experiences a reality by orchestrating AI agents, human expertise, and enterprise systems through the Tryvium Experience Orchestration Platform.</p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/schedule-a-demo/"><Button size="xl">Schedule a Demo</Button></Link>
            <Link href="/platform/experience-orchestration-platform/"><Button variant="outline" size="xl">Explore the platform</Button></Link>
          </div>
        </Container>
      </Section>
    </>
  )
}
