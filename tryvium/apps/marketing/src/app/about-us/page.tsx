import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Container, Section, Button, Badge, Card, CardContent } from '@tryvium/ui'
import { Target, Eye, Heart, Layers, Workflow, Bot, Users, Shield, Zap, Globe, BarChart3 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Tryvium: Vision & Mission',
  description: 'Explore About Tryvium to learn how we are helping enterprises transition from Automation-Escalation service models to AI Agent-Orchestrated operations.',
  openGraph: {
    title: 'About Tryvium: Vision & Mission',
    description: 'Explore About Tryvium to learn how we are helping enterprises transition from Automation-Escalation service models to AI Agent-Orchestrated operations.',
    url: 'https://www.tryvium.ai/about-us/',
    images: [{ url: 'https://www.tryvium.ai/wp-content/uploads/2026/06/event1-img.webp', width: 601, height: 464, alt: 'About-Us' }],
  },
  alternates: { canonical: 'https://www.tryvium.ai/about-us/' },
}

const eventImages = [
  'event1-img.webp',
  'event2-img.webp',
  'event3-img.webp',
  'event4-img.webp',
  'event5-img.webp',
]

const recognitionImages = [
  'recognized-across-enterprise-4.png',
]

const partnerLogos = [
  'intrado-1.png',
  'interactions_0-2.png',
  'hewlett-packard-enterprise-2.png',
  'neles-2.png',
  'mitie-2.png',
  'marelli-1.png',
  'securities-america_0-2.png',
  'boehringer-ingelheim-logo.webp',
  'abb-logo.webp',
  'atlas-copco-logo.webp',
]

const pillars = [
  { icon: Layers, title: 'AI-Native\nOrchestration' },
  { icon: Workflow, title: 'Unified\nExperience Platform' },
  { icon: Bot, title: 'Seamless AI + Human Collaboration' },
  { icon: Shield, title: 'Real-Time\nIntelligent Decisioning' },
  { icon: Users, title: 'Persistent\nContext Management' },
]

const whyChoose = [
  { icon: Globe, title: 'Omnichannel\nExperience Delivery' },
  { icon: Zap, title: 'Faster\nService Operations' },
  { icon: Workflow, title: 'Enterprise Workflow Automation' },
  { icon: Shield, title: 'Cloud & Hyperscaler\nReady' },
  { icon: BarChart3, title: 'Scalable AI-Led\nOperations' },
]

export default function AboutPage() {
  return (
    <>
      <Section background="gray" className="pt-20 pb-32">
        <Container className="text-center">
          <Badge className="mb-4">Enterprise Orchestration Platform</Badge>
          <h1 className="text-5xl font-extrabold text-brand-900">Accelerating Enterprise Transformation Through AI Orchestration</h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-brand-600">Tryvium is an AI-led Experience Orchestration platform that helps enterprises unify human expertise, AI agents, customer engagement, and automation into one intelligent experience platform</p>
          <div className="mt-10"><Link href="https://www.tryvium.ai/demo/"><Button size="xl">Schedule a demo</Button></Link></div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">Who We Are?</Badge>
            <h2 className="text-4xl font-bold text-brand-900">Built for Modern Enterprise Operations</h2>
          </div>
          <div className="mt-10 space-y-6 text-center text-brand-600">
            <p className="mx-auto max-w-4xl text-lg">Powered by Sensiple&apos;s 25+ years of technology leadership, Tryvium helps enterprises modernize operations, connect enterprise systems, and deliver seamless experiences across customers and employees alike.</p>
            <p className="mx-auto max-w-4xl text-lg">Tryvium helps enterprises evolve from legacy environments to AI-driven ecosystems that enhance operational efficiency and solve real business challenges.</p>
            <p className="mx-auto max-w-4xl text-lg">From optimizing customer interactions to automating workflows and orchestrating enterprise-wide experiences, Tryvium simplifies complex business operations, unlocks enterprise excellence, and drives measurable business impact.</p>
          </div>
        </Container>
      </Section>

      <Section background="gray">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">Events</Badge>
            <h2 className="text-4xl font-bold text-brand-900">Recognized Across Enterprise Ecosystems</h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {eventImages.map((img) => (
              <div key={img} className="overflow-hidden rounded-xl">
                <Image
                  src={`https://www.tryvium.ai/wp-content/uploads/2026/06/${img}`}
                  alt="Event"
                  width={300}
                  height={232}
                  className="h-auto w-full object-cover"
                />
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">Enterprise Integrations</Badge>
            <h2 className="text-4xl font-bold text-brand-900">Recognized Across Enterprise Ecosystems</h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {recognitionImages.map((img) => (
              <div key={img} className="overflow-hidden rounded-xl">
                <Image
                  src={`https://www.tryvium.ai/wp-content/uploads/2026/06/${img}`}
                  alt="Recognition"
                  width={300}
                  height={200}
                  className="h-auto w-full object-contain"
                />
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section background="gray">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">Our Partners</Badge>
            <h2 className="text-3xl font-bold text-brand-900">Security &amp; Compliance</h2>
            <p className="mt-4 text-xl text-brand-600">Enterprise Security &amp; Compliance Built into Every Interaction</p>
          </div>
          <div className="mt-8 flex justify-center">
            <Image
              src="https://www.tryvium.ai/wp-content/uploads/2026/06/certificate-for-aws-gcp.webp"
              alt="Security Certifications"
              width={400}
              height={300}
              className="h-auto"
            />
          </div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">Business outcomes</Badge>
            <h2 className="text-4xl font-bold text-brand-900">Experience Outcomes That Matter</h2>
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-4">
            {[
              { stat: '90%', label: 'First-Contact Resolution' },
              { stat: '60%', label: 'Reduction in Average Handle Time' },
              { stat: '3x', label: 'Increase in Agent Productivity' },
              { stat: '80%', label: 'Ticket Deflection Through AI-Led Self-Service' },
            ].map((v) => (
              <Card key={v.label}>
                <CardContent className="pt-8 text-center">
                  <div className="text-5xl font-extrabold text-brand-600">{v.stat}</div>
                  <p className="mt-3 text-sm text-brand-600">{v.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section background="gray">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">Vision &amp; Mission</Badge>
            <h2 className="text-4xl font-bold text-brand-900">The Principles That Drive Everything We Build</h2>
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <Card>
              <CardContent className="pt-8">
                <h3 className="text-xl font-semibold text-brand-600">Our Vision</h3>
                <p className="mt-3 text-brand-900">Turn every interaction into an intelligent, connected, and valuable experience through AI orchestration.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-8">
                <h3 className="text-xl font-semibold text-brand-600">Our Mission</h3>
                <p className="mt-3 text-brand-900">To orchestrate AI, people, and enterprise systems into one seamless experience platform — enabling faster decisions, smarter operations, and effortless customer engagement.</p>
              </CardContent>
            </Card>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {pillars.map((p) => (
              <Card key={p.title}>
                <CardContent className="pt-8 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-100 text-brand-600"><p.icon className="h-7 w-7" /></div>
                  <h3 className="whitespace-pre-line text-lg font-semibold text-brand-900">{p.title}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-bold text-brand-900">Why Enterprises Choose Tryvium?</h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {whyChoose.map((p) => (
              <Card key={p.title}>
                <CardContent className="pt-8 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-100 text-brand-600"><p.icon className="h-7 w-7" /></div>
                  <h3 className="whitespace-pre-line text-lg font-semibold text-brand-900">{p.title}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section background="gray">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">Partnerships</Badge>
            <h2 className="text-4xl font-bold text-brand-900">Strategic Partnerships</h2>
            <p className="mt-4 text-lg text-brand-600">Our solutions are strengthened by alliances with leading technology providers, including Microsoft ensuring best-in-class outcomes for our clients.</p>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-8">
            <Image src="https://www.tryvium.ai/wp-content/uploads/2026/06/Microsoft-Partner--150x150.png" alt="Microsoft Partner" width={100} height={100} />
            <Image src="https://www.tryvium.ai/wp-content/uploads/2026/06/AWS.png" alt="AWS" width={80} height={60} />
            <Image src="https://www.tryvium.ai/wp-content/uploads/2026/06/google-cloud.png" alt="Google Cloud" width={80} height={60} />
          </div>
          <div className="mt-4 text-center">
            <p className="text-lg text-brand-600">Our trusted partners, from bold startups to global icons</p>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6">
            {partnerLogos.map((img) => (
              <Image
                key={img}
                src={`https://www.tryvium.ai/wp-content/uploads/2026/06/${img}`}
                alt="Partner"
                width={100}
                height={50}
                className="h-12 w-auto object-contain"
              />
            ))}
          </div>
        </Container>
      </Section>

      <Section background="brand" className="text-center">
        <Container>
          <Badge className="mb-4">The future of service</Badge>
          <h2 className="text-4xl font-bold text-brand-900">Orchestrate AI. Simplify Operations. Scale Outcomes.</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="https://www.tryvium.ai/contact-us/"><Button size="xl">Schedule a Demo</Button></Link>
            <Link href="https://www.tryvium.ai/demo/"><Button size="xl" variant="outline">Schedule a Demo</Button></Link>
          </div>
        </Container>
      </Section>
    </>
  )
}
