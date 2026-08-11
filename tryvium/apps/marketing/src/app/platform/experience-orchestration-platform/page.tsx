import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Container, Section, Button, Badge, Card, CardContent } from '@tryvium/ui'
import { Bot, Users, Shield, Workflow, BarChart3, Layers, ArrowRight, CheckCircle, XCircle, Sparkles, Eye, GitBranch, RefreshCw, Target, Sliders, Globe } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Enterprise AI Orchestration Platform | Tryvium',
  description: 'Unify AI agents, human teams, workflows, and enterprise systems with Tryvium\'s AI-Powered Experience Orchestration for seamless operational execution.',
  openGraph: {
    title: 'Enterprise AI Orchestration Platform | Tryvium',
    description: 'Unify AI agents, human teams, workflows, and enterprise systems with Tryvium\'s AI-Powered Experience Orchestration for seamless operational execution.',
    url: 'https://www.tryvium.ai/platform/experience-orchestration-platform/',
    images: [{ url: 'https://www.tryvium.ai/wp-content/uploads/2026/06/understand-interactions-.webp', width: 404, height: 404, alt: 'Experience Orchestration Platform' }],
  },
  alternates: { canonical: 'https://www.tryvium.ai/platform/experience-orchestration-platform/' },
}

const comparisonRows = [
  { label: 'How AI is used', automation: 'Handles tier-1, escalates the rest', orchestration: 'Executes across all interactions' },
  { label: 'How humans are involved', automation: 'Fallback handling layer', orchestration: 'Governance and oversight layer' },
  { label: 'How decisions are made', automation: 'Rule-based escalation triggers', orchestration: 'Dynamic, intent-based execution' },
  { label: 'How experiences feel', automation: 'Bot \u2192 Hold \u2192 Human', orchestration: 'One continuous conversation' },
]

const steps = [
  { num: '01', title: 'Understand Interactions', img: 'understand-interactions-.webp', desc: 'Tryvium listens first. It identifies intent, context, interaction history, and operational signals in real time, ensuring every action starts with a complete understanding of what needs to happen next.' },
  { num: '02', title: 'Determine Operational Flows', img: 'determine-operational-flows.webp', desc: 'Not every interaction should follow the same path. Tryvium intelligently determines whether work should be handled by AI agents, human teams, enterprise systems, automated workflows, or a combination of all four.' },
  { num: '03', title: 'Orchestrate Operations', img: 'orchestrate-operations.webp', desc: 'This is where coordination happens. Tryvium continuously orchestrates AI agents, human agents, enterprise applications, workflows, and operational processes in real time.' },
  { num: '04', title: 'Maintain Persistent Context', img: 'maintain-persistent-context.webp', desc: 'Context follows every interaction across channels, systems, workflows, and engagement environments. AI agents and human teams always have the information they need to deliver seamless experiences, so customers never have to repeat themselves.' },
  { num: '05', title: 'Govern Operations', img: 'govern-operations.webp', desc: 'Tryvium is built with human-in-the-loop governance at its core. AI agents can automate tasks, execute workflows, and drive interactions at scale, while human teams remain involved in the decisions, approvals, validations, and oversight that matter most.' },
  { num: '06', title: 'Measure and Optimize', img: 'measure-and-optimize.webp', desc: 'Orchestration is a continuous optimization process. Tryvium provides real-time visibility into experience and operational performance, helping teams improve outcomes with every interaction.' },
]

const scenarios = [
  {
    icon: 'customer-who-expect.svg',
    title: 'The Customer who shouldn\u2019t have to wait',
    desc: 'A customer contacts your business after hours with an urgent issue. In a fragmented environment, the request sits in a queue until someone is available.',
    desc2: 'With Tryvium, AI agents understand the intent, resolve eligible requests autonomously, coordinate human involvement in the background where judgment is required. Customers get help when they need it, while human teams focus on where expertise matters most.',
  },
  {
    icon: 'customer-should-not-wait.svg',
    title: 'The employee who just needs an answer',
    desc: 'An employee needs access to a business application before an important meeting. Instead of navigating portals, and waiting for support, the request is orchestrated automatically across IT systems, approval workflows, and service teams.',
    desc2: 'AI handles routine tasks, humans govern exceptions, and the employee gets what they need without disruption.',
  },
  {
    icon: 'employee-need-answer.svg',
    title: 'The customer who expects every interaction to connect',
    desc: 'A customer starts their query on WhatsApp, continues on email, and eventually speaks to an agent. Most platforms treat these as separate interactions. Tryvium treats them as one continuous experience.',
    desc2: 'Every AI agent and human agent shares the same context, history, and intent, enabling faster, more accurate resolution across every channel.',
  },
]

const cloudLogos = [
  '7/microsoft-azure-logo.webp',
  '6/AWS-logo-.png',
  '5/google-cloud-dialogflow.webp',
]

const capabilities = [
  { icon: Globe, title: 'Omnichannel engagement environments' },
  { icon: Shield, title: 'Flexible deployment across cloud and hyperscaler ecosystems' },
  { icon: Bot, title: 'Autonomous AI-agent execution across all interactions' },
  { icon: Layers, title: 'Scalable AI-agent execution across systems and teams' },
  { icon: RefreshCw, title: 'Seamless support for legacy and modern operating models' },
  { icon: Users, title: 'Human governance without human handling' },
]

export default function PlatformPage() {
  return (
    <>
      <Section background="gray" className="pt-20 pb-32">
        <Container className="text-center">
          <Badge className="mb-4">Experience Orchestration Platform</Badge>
          <h1 className="text-5xl font-extrabold text-brand-900">AI-agent orchestration for the next generation of enterprise operations</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-600">Most platforms automate the simple and escalate the rest. Tryvium&apos;s experience orchestration platform orchestrates everything: AI agents execute, human teams govern, and every experience runs without friction.</p>
          <div className="mt-10"><Link href="/schedule-a-demo/"><Button size="xl">Schedule a Demo</Button></Link></div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <div className="mx-auto max-w-3xl">
            <Badge className="mb-4">What is an experience orchestration platform?</Badge>
            <h2 className="text-3xl font-bold text-brand-900">What is an experience orchestration platform?</h2>
            <p className="mt-4 text-lg text-brand-600">An Experience Orchestration Platform is the intelligence layer that coordinates AI agents, human teams, workflows, and enterprise systems to deliver connected experiences and consistent operational execution.</p>
            <p className="mt-4 text-lg text-brand-600">But not all EOPs are built the same way. And to understand why, you have to understand where most of them came from.</p>
          </div>
        </Container>
      </Section>

      <Section background="gray">
        <Container>
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold text-brand-900">Is your EOP built for orchestration or escalation?</h2>
            <p className="mt-4 text-lg text-brand-600">Enterprise platforms were built around human agents. When automation arrived, it was layered on top. Bots and automated workflows became the gateway to human support. AI was a bolt-on, not a rethink.</p>
            <p className="mt-4 text-lg text-brand-600">That is the automation-escalation model. And most EOPs today are still built on it.</p>
          </div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-brand-900">Which model are you running today?</h2>
          </div>
          <div className="mt-10 overflow-hidden rounded-xl border border-brand-100">
            <div className="grid grid-cols-3 gap-4 bg-brand-950 p-4 text-sm font-semibold text-white">
              <span></span>
              <span className="text-center">Automation-Escalation Model</span>
              <span className="text-center">Experience Orchestration</span>
            </div>
            {comparisonRows.map((row, i) => (
              <div key={row.label} className={`grid grid-cols-3 gap-4 p-4 text-sm ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                <span className="font-medium text-brand-900">{row.label}</span>
                <span className="text-center text-brand-500 line-through">{row.automation}</span>
                <span className="text-center font-medium text-green-700">{row.orchestration}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <p className="text-lg font-medium text-brand-600">Most businesses are running the first model and calling it the second.</p>
          </div>
        </Container>
      </Section>

      <Section background="gray">
        <Container>
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold text-brand-900">What true experience orchestration looks like</h2>
            <p className="mt-4 text-lg text-brand-600">In an autonomous AI-agent orchestration model, every interaction is handled by an AI agent from start to finish. The AI doesn&apos;t deflect; it executes. When human judgment is genuinely required, human agents assist in the background without taking over.</p>
            <p className="mt-4 text-lg text-brand-600">The experience stays continuous. Human support without disrupting.</p>
            <ul className="mt-6 space-y-3">
              {[
                'No holds, no transfers, no tier boundaries',
                'Consistent outcomes regardless of time, channel, or staffing',
                'Operations that scale beyond labor constraints',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                  <span className="text-brand-900">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold text-brand-900">Experience orchestration requires a different kind of platform</h2>
            <p className="mt-4 text-lg text-brand-600">The future of enterprise operations isn&apos;t human-only or AI-only. It&apos;s intelligently orchestrated.</p>
            <p className="mt-4 text-lg text-brand-600">Tryvium is not an automation-escalation tool with orchestration painted over it or AI retrofitted like legacy platforms.</p>
            <p className="mt-4 text-lg text-brand-600">Tryvium&apos;s experience orchestration platform coordinates AI agents, human teams, and enterprise systems through a single unified layer, so AI executes continuously. Humans govern what matters most, and every experience runs without friction.</p>
          </div>
        </Container>
      </Section>

      <Section background="gray">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">AI-agent orchestration</Badge>
            <h2 className="text-4xl font-bold text-brand-900">How Tryvium&apos;s AI-agent orchestration platform works</h2>
          </div>
          <div className="mt-12 space-y-16">
            {steps.map((step, i) => (
              <div key={step.num} className={`flex flex-col items-center gap-8 ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
                <div className="flex-1">
                  <span className="text-6xl font-black text-brand-200">{step.num}</span>
                  <h3 className="mt-2 text-2xl font-bold text-brand-900">{step.title}</h3>
                  <p className="mt-4 text-brand-600">{step.desc}</p>
                </div>
                <div className="flex-1">
                  <Image
                    src={`https://www.tryvium.ai/wp-content/uploads/2026/06/${step.img}`}
                    alt={step.title}
                    width={404}
                    height={404}
                    className="h-auto w-full max-w-sm rounded-xl"
                  />
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-brand-900">What does AI-agent orchestration look like in practice?</h2>
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {scenarios.map((s) => (
              <Card key={s.title}>
                <CardContent className="pt-8">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center">
                    <Image
                      src={`https://www.tryvium.ai/wp-content/uploads/2026/06/${s.icon}`}
                      alt={s.title}
                      width={80}
                      height={80}
                    />
                  </div>
                  <h3 className="text-center text-lg font-semibold text-brand-900">{s.title}</h3>
                  <p className="mt-3 text-sm text-brand-600">{s.desc}</p>
                  <p className="mt-3 text-sm text-brand-600">{s.desc2}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section background="gray">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-brand-900">Built to work with your existing cloud eco system</h2>
            <p className="mt-4 text-lg text-brand-600">Whether you&apos;re using AWS, Microsoft Azure, Google Cloud, or a combination of all three. Tryvium works seamlessly across leading cloud and hyperscaler ecosystems, providing a unified orchestration layer for experiences, workflows, and operations.</p>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-8">
            {cloudLogos.map((logo) => (
              <Image
                key={logo}
                src={`https://www.tryvium.ai/wp-content/uploads/2026/${logo}`}
                alt="Cloud Provider"
                width={120}
                height={80}
                className="h-16 w-auto object-contain"
              />
            ))}
          </div>
          <div className="mt-8 text-center">
            <p className="text-lg text-brand-600">Your cloud platforms provide the foundation. Tryvium provides the intelligence, orchestration, and governance layer that brings everything together.</p>
          </div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold text-brand-900">Everything you need to orchestrate experiences, workflows, and operations, powered by Tryvium</h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((c) => (
              <Card key={c.title}>
                <CardContent className="flex items-start gap-4 pt-8">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600"><c.icon className="h-6 w-6" /></div>
                  <p className="font-medium text-brand-900">{c.title}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-12 text-center">
            <p className="text-lg font-medium text-brand-900">Trusted by enterprises worldwide to orchestrate AI-led experiences and operations.</p>
          </div>
        </Container>
      </Section>

      <Section background="brand" className="text-center">
        <Container>
          <h2 className="text-4xl font-bold text-brand-900">Ready to move beyond the automation-escalation model?</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-brand-700">Talk to our team to see how Tryvium helps enterprises make the shift to intelligent experience orchestration.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/schedule-a-demo/"><Button size="xl">Schedule a Demo</Button></Link>
            <Link href="/platform/experience-orchestration-platform/"><Button size="xl" variant="outline">Explore the platform</Button></Link>
          </div>
        </Container>
      </Section>
    </>
  )
}
