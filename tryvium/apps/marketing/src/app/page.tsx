import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Container, Section, Button, Badge, Card, CardContent, IconBox } from '@tryvium/ui'
import { ArrowRight, Bot, Users, Globe, BarChart3, Zap, Layers } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Experience Orchestration Platform for Enterprises | Tryvium',
  description: 'An AI Agent Orchestration Platform that helps enterprises transition to autonomous AI agents through intelligent execution, automation, and orchestration.',
  openGraph: {
    title: 'Experience Orchestration Platform for Enterprises | Tryvium',
    description: 'An AI Agent Orchestration Platform that helps enterprises transition to autonomous AI agents through intelligent execution, automation, and orchestration.',
    url: 'https://www.tryvium.ai/',
    siteName: 'tryvium',
    locale: 'en_US',
    type: 'website',
  },
  alternates: { canonical: 'https://www.tryvium.ai/' },
  twitter: {
    card: 'summary_large_image',
    title: 'Experience Orchestration Platform for Enterprises | Tryvium',
    description: 'An AI Agent Orchestration Platform that helps enterprises transition to autonomous AI agents through intelligent execution, automation, and orchestration.',
  },
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
          <div className="flex flex-wrap items-center justify-center gap-10 opacity-60 grayscale">
            <Image src="https://www.tryvium.ai/wp-content/uploads/2026/07/metso.webp" alt="Metso" width={120} height={40} className="h-10 w-auto object-contain" />
            <Image src="https://www.tryvium.ai/wp-content/uploads/2026/07/abb.webp" alt="ABB" width={80} height={40} className="h-10 w-auto object-contain" />
            <Image src="https://www.tryvium.ai/wp-content/uploads/2026/07/teva-pharmaceuticals.webp" alt="Teva Pharmaceuticals" width={140} height={40} className="h-10 w-auto object-contain" />
            <Image src="https://www.tryvium.ai/wp-content/uploads/2026/07/cargill.webp" alt="Cargill" width={100} height={40} className="h-10 w-auto object-contain" />
            <Image src="https://www.tryvium.ai/wp-content/uploads/2026/07/roquette.webp" alt="Roquette" width={100} height={40} className="h-10 w-auto object-contain" />
            <Image src="https://www.tryvium.ai/wp-content/uploads/2026/07/constellation-energy-corporation.webp" alt="Constellation Energy" width={160} height={40} className="h-10 w-auto object-contain" />
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
              { img: 'fragmented-customer-journey.webp', title: 'Fragmented customer journey', desc: 'Customer interactions are scattered across disconnected channels, creating disjointed experiences and forcing customers to repeat information at every touchpoint.' },
              { img: 'loss-of-context.webp', title: 'Loss of context', desc: 'When conversations move between bots and human agents, critical context is lost, leading to frustration, repeated efforts, and longer resolution times.' },
              { img: 'long-wait-time.webp', title: 'Long wait time', desc: 'Customers face extended hold times as traditional queuing systems struggle to efficiently match inquiries with the right resources and expertise.' },
            ].map((item) => (
              <Card key={item.title} className="overflow-hidden text-center">
                <div className="relative h-48 w-full bg-brand-100">
                  <Image src={`https://www.tryvium.ai/wp-content/uploads/2026/06/${item.img}`} alt={item.title} fill className="object-contain p-4" />
                </div>
                <CardContent className="pt-6">
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
              { img: 'ai-managed-interactions.webp', title: 'AI-managed interactions', desc: 'AI agents handle end-to-end customer journeys, proactively managing interactions across channels while maintaining complete context and continuity.' },
              { img: 'ai-coordinates.webp', title: 'AI coordinates workflows', desc: 'AI agents orchestrate complex workflows, integrate with backend systems, and coordinate enterprise resources in real time.' },
              { img: 'humans-intervens.webp', title: 'Humans intervene when needed', desc: 'Human experts are engaged only when judgment, creativity, or specialized knowledge is required, with full context preserved.' },
            ].map((item) => (
              <Card key={item.title} className="overflow-hidden border-brand-200 bg-brand-50">
                <div className="relative h-48 w-full">
                  <Image src={`https://www.tryvium.ai/wp-content/uploads/2026/06/${item.img}`} alt={item.title} fill className="object-contain p-4" />
                </div>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold text-brand-900">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-brand-600">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* AI-agent orchestration */}
      <Section background="gray" className="py-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">AI-agent orchestration</Badge>
            <h2 className="text-4xl font-bold text-brand-900">How does Tryvium power autonomous AI experiences</h2>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              { img: 'ai-agent-orchest.webp', num: '01', title: 'AI agent orchestration', desc: 'Coordinate AI agents, workflows, and business processes across customer service operations.' },
              { img: 'human-agent.webp', num: '02', title: 'Human agent workspace', desc: 'Enable seamless collaboration between AI agents and human experts with shared context and visibility.' },
              { img: 'governance-and-compliance.webp', num: '03', title: 'Governance and compliance', desc: 'Apply enterprise policies, human oversight, security controls, and compliance frameworks.' },
            ].map((item) => (
              <div key={item.num} className="relative overflow-hidden rounded-xl border border-brand-200 bg-white shadow-sm">
                <div className="relative h-48 w-full">
                  <Image src={`https://www.tryvium.ai/wp-content/uploads/2026/06/${item.img}`} alt={item.title} fill className="object-contain p-4" />
                </div>
                <div className="p-8 pt-4">
                  <span className="mb-2 block text-5xl font-black text-brand-100">{item.num}</span>
                  <h3 className="text-xl font-semibold text-brand-900">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-brand-600">{item.desc}</p>
                </div>
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

      {/* Security & Compliance */}
      <Section background="brand" className="py-24">
        <Container className="text-center">
          <Badge variant="secondary" className="mb-4">Security & Compliance</Badge>
          <h2 className="text-4xl font-bold text-brand-900">Designed for Security. Built for Compliance.</h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-600">Security, privacy, and governance are integrated into every layer of our platform, helping enterprises accelerate AI adoption while maintaining trust and control.</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-8">
            <Image src="https://www.tryvium.ai/wp-content/uploads/2026/07/iso-9001.webp" alt="ISO 9001" width={100} height={60} className="h-14 w-auto" />
            <Image src="https://www.tryvium.ai/wp-content/uploads/2026/07/iso-27001.webp" alt="ISO 27001" width={100} height={60} className="h-14 w-auto" />
            <Image src="https://www.tryvium.ai/wp-content/uploads/2026/07/aicpa-soc.webp" alt="SOC 2" width={100} height={60} className="h-14 w-auto" />
          </div>
        </Container>
      </Section>

      {/* The Next Era */}
      <Section background="white" className="py-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">The Next Era</Badge>
            <h2 className="text-4xl font-bold text-brand-900">Built for the transition to autonomous AI agents</h2>
            <p className="mt-6 text-lg leading-relaxed text-brand-600">The shift to autonomous AI won&apos;t happen all at once. Enterprises need a practical, governed path to evolve from human-centric operations to autonomous, AI-orchestrated experiences.</p>
          </div>
          <div className="mt-16 space-y-8">
            {[
              { step: '01', title: 'Introduce AI-orchestrated interactions', desc: 'Deploy AI agents alongside existing customer service operations without disrupting current processes.', img: 'ai-mediated-interaction.webp' },
              { step: '02', title: 'Orchestrate AI and human collaboration', desc: 'Enable AI agents to coordinate human expertise when exceptions, approvals, or specialized knowledge are required.', img: 'ai-and-human-collabration.webp' },
              { step: '03', title: 'Scale autonomous service execution', desc: 'Extend AI-led operations across channels, workflows, and customer journeys while maintaining consistency, control, and service quality.', img: 'autonomous-service.webp' },
              { step: '04', title: 'Optimize and Govern', desc: 'Measure performance, enforce policies, and continuously improve customer and operational outcomes.', img: 'optimize-and-govern.webp' },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-6 rounded-xl border border-brand-100 bg-gray-50 p-8">
                <div className="relative h-32 w-48 shrink-0 overflow-hidden rounded-lg">
                  <Image src={`https://www.tryvium.ai/wp-content/uploads/2026/${item.step <= '02' ? '05' : '06'}/${item.img}`} alt={item.title} fill className="object-contain" />
                </div>
                <div className="flex items-start gap-6">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-lg font-bold text-white">{item.step}</span>
                  <div>
                    <h3 className="text-xl font-semibold text-brand-900">{item.title}</h3>
                    <p className="mt-2 text-brand-600">{item.desc}</p>
                  </div>
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
                <p className="text-sm leading-relaxed text-brand-700">&ldquo;We&apos;ve been working with Tryvium for several years, and user adoption has been seamless. The platform enhances the overall experience through its extensive capabilities, intuitive administration console, and powerful analytics that help us make informed business decisions. What stands out most is the strong partnership with the Tryvium support team. Their proactive engagement, regular review sessions, and commitment to continuous improvement have been invaluable. The platform&apos;s integration with ServiceNow has also been a significant advantage for our operations.&rdquo;</p>
                <div className="mt-6 flex items-center gap-3">
                  <Image src="https://www.tryvium.ai/wp-content/uploads/2026/06/atlas-copco.webp" alt="Atlas Copco" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                  <div><p className="text-sm font-semibold text-brand-900">Atlas Copco</p></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-8">
                <p className="text-sm leading-relaxed text-brand-700">&ldquo;Tryvium provides a user-friendly and comprehensive dashboard that offers real-time visibility into chat traffic and performance. Its intuitive experience for end users has contributed to a 30% increase in chat adoption while also improving agent productivity. Overall, Tryvium delivers a seamless and efficient experience for both customers and agents.&rdquo;</p>
                <div className="mt-6 flex items-center gap-3">
                  <Image src="https://www.tryvium.ai/wp-content/uploads/2026/06/dms.webp" alt="DSM" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
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
            <p className="mt-6 text-lg leading-relaxed text-brand-600">Leverage the cloud platforms and technologies you already use while orchestrating AI agents, human expertise, and enterprise systems through a unified orchestration layer with Tryvium.</p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              { img: 'amazon-connect.webp', name: 'AWS', desc: 'Extend and modernize contact center operations with AI agent orchestration, intelligent automation, and seamless integration across your enterprise workflows.' },
              { img: 'microsoft-azure-logo.webp', name: 'Microsoft Azure', desc: 'Unlock the full value of Microsoft\'s cloud, AI, collaboration, and business applications by coordinating them through a single orchestration framework.' },
              { img: 'google-cloud-dialogflow.webp', name: 'Google Cloud', desc: 'Harness enterprise-grade AI models, data services, and cloud infrastructure to power intelligent, scalable, and context-aware experiences.' },
            ].map((item) => (
              <Card key={item.name}>
                <CardContent className="pt-8 text-center">
                  <div className="relative mx-auto mb-4 h-16 w-32">
                    <Image src={`https://www.tryvium.ai/wp-content/uploads/2026/${item.name === 'Microsoft Azure' ? '07' : '05'}/${item.img}`} alt={item.name} fill className="object-contain" />
                  </div>
                  <h3 className="text-2xl font-bold text-brand-900">{item.name}</h3>
                  <p className="mt-3 text-sm text-brand-600">{item.desc}</p>
                  <Link href={item.name === 'AWS' ? '/solution/tryvium-for-aws/' : item.name === 'Microsoft Azure' ? '/solution/tryvium-for-azure/' : '/solution/tryvium-for-gcp/'}><Button variant="link" className="mt-4">Learn more <ArrowRight className="ml-1 h-4 w-4" /></Button></Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section background="brand" className="py-24">
        <Container className="text-center">
          <Badge variant="secondary" className="mb-4">The future of enterprise experiences</Badge>
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
