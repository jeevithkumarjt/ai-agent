import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, Section, Button, Badge, Card, CardContent, IconBox } from '@tryvium/ui'
import { Cloud, Bot, Users, Shield, Workflow, ArrowRight, CheckCircle, BarChart3, HeadphonesIcon, BookOpen, MessageSquare, Zap, GitBranch, Search } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Tryvium for AWS | AI Agent Orchestration for Amazon Connect',
  description: 'Modernize employee and customer support with AI agent orchestration on Amazon Connect. Launch faster with one-click deployment, pre-built flows, and enterprise-grade security.',
  openGraph: {
    title: 'Tryvium for AWS | AI Agent Orchestration for Amazon Connect',
    description: 'Modernize employee and customer support with AI agent orchestration on Amazon Connect. Launch faster with one-click deployment, pre-built flows, and enterprise-grade security.',
    url: 'https://www.tryvium.ai/solution/tryvium-for-aws/',
  },
  alternates: { canonical: 'https://www.tryvium.ai/solution/tryvium-for-aws/' },
}

const benefits = [
  { icon: Cloud, title: 'One-Click Amazon Connect Deployment', desc: 'Deploy Tryvium on Amazon Connect with a single click. Pre-built contact flows and service integrations included.' },
  { icon: Bot, title: 'Pre-Built Contact Flows & Service Integrations', desc: 'Ready-to-use IVR flows and out-of-the-box integrations with ServiceNow, Salesforce, Jira, and more.' },
  { icon: Users, title: 'AI Agent-Orchestration', desc: 'Deploy autonomous AI agents that handle interactions from start to finish on AWS infrastructure.' },
  { icon: Workflow, title: 'IVR Migration', desc: 'Modernize legacy IVR systems with AI-powered conversational experiences on Amazon Connect.' },
  { icon: Shield, title: 'Human-Governed AI', desc: 'AI agents handle the majority of interactions while humans maintain oversight and intervene when needed.' },
  { icon: BarChart3, title: 'Pay-as-You-Use Pricing', desc: 'Scale your operations with flexible pricing that aligns with your usage patterns on AWS.' },
]

const employeeSolutions = [
  { icon: HeadphonesIcon, title: 'Employee Help Desk', desc: 'Empower employees with instant support, intelligent self-service, and AI-powered assistance while reducing the burden on IT and HR teams.' },
  { icon: Zap, title: 'Intelligent IT Support', desc: 'Automate password resets, access requests, software provisioning, and common technical inquiries.' },
  { icon: BookOpen, title: 'Knowledge Discovery', desc: 'Deliver contextual answers from enterprise knowledge bases and internal systems.' },
  { icon: MessageSquare, title: 'Employee Request Management', desc: 'Enable conversational support across voice, chat, and digital channels.' },
  { icon: GitBranch, title: 'Workplace Productivity Assistance', desc: 'Automatically route requests to the right team, workflow, or subject matter expert.' },
  { icon: Search, title: 'Service Performance Monitoring', desc: 'Monitor employee service performance, request trends, and operational efficiency.' },
]

const customerSolutions = [
  { icon: Bot, title: 'AI Agent-Orchestrated Customer Engagement', desc: 'Deliver seamless customer experiences through AI-powered engagement, intelligent automation, and continuous service orchestration.' },
  { icon: MessageSquare, title: 'Omnichannel Experience Management', desc: 'Support customers across voice, chat, email, SMS, and digital channels.' },
  { icon: Zap, title: 'Self-Service Automation', desc: 'Provide personalized assistance and automate routine customer inquiries.' },
  { icon: Users, title: 'Agent Assist & Collaboration', desc: 'Equip agents with real-time recommendations, next-best actions, and contextual guidance.' },
]

const comparisonOld = [
  'Complex deployments',
  'Custom workflows and integrations',
  'Fragmented experiences',
  'Limited context',
  'Human-centric workflows',
]

const comparisonNew = [
  'One-click deployment',
  'Pre-built IVRs, contact flows & integrations',
  'Continuous AI engagement',
  'Persistent context',
  'Human-Governed AI',
]

export default function TryviumForAWSPage() {
  return (
    <>
      <Section background="gray" className="pt-20 pb-32">
        <Container className="text-center">
          <Badge className="mb-4">Solution</Badge>
          <h1 className="text-5xl font-extrabold text-brand-900">Tryvium <span className="text-brand-600">for AWS</span></h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-600">Modernize employee and customer support with AI agent orchestration on Amazon Connect. Launch faster with one-click deployment, pre-built flows, and enterprise-grade security.</p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/schedule-a-demo/"><Button size="xl">Schedule a Demo</Button></Link>
            <Link href="/platform/experience-orchestration-platform/"><Button size="xl" variant="outline">Explore Platform</Button></Link>
          </div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <h2 className="mb-12 text-center text-3xl font-bold text-brand-900">AI Agent-Orchestrated Service Operations On AWS</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {benefits.map((b) => (
              <IconBox key={b.title} icon={<b.icon className="h-6 w-6" />} title={b.title} description={b.desc} />
            ))}
          </div>
        </Container>
      </Section>

      <Section background="gray">
        <Container>
          <h2 className="mb-4 text-center text-3xl font-bold text-brand-900">Why Tryvium + Amazon Connect Is the Right Choice for Modern Enterprises?</h2>
          <div className="mx-auto mb-12 max-w-3xl text-center text-brand-600">
            <p className="text-sm font-semibold uppercase tracking-wider">The Old Way &mdash; Automation-Escalation Model</p>
            <p className="text-sm italic">Bot &rarr; Queue &rarr; Agent</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardContent className="pt-8">
                <h3 className="mb-4 text-lg font-semibold text-red-600">Legacy Approach</h3>
                <ul className="space-y-2">
                  {comparisonOld.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-brand-600">
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="border-brand-500">
              <CardContent className="pt-8">
                <h3 className="mb-4 text-lg font-semibold text-green-600">The Tryvium for AWS Way</h3>
                <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-600">AI Agent-Orchestration Model</p>
                <p className="mb-4 text-sm italic text-brand-600">AI Agent &rarr; Orchestrate &rarr; Resolve</p>
                <ul className="space-y-2">
                  {comparisonNew.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-brand-600">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
          <div className="mt-10 text-center">
            <Link href="/schedule-a-demo/"><Button size="xl">Book a Demo</Button></Link>
          </div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <h2 className="mb-12 text-center text-3xl font-bold text-brand-900">AI Agent-Orchestrated Service Solutions</h2>
          <div className="mb-16">
            <h3 className="mb-8 text-center text-2xl font-bold text-brand-900">Employee Help Desk</h3>
            <div className="grid gap-6 md:grid-cols-3">
              {employeeSolutions.map((s) => (
                <IconBox key={s.title} icon={<s.icon className="h-6 w-6" />} title={s.title} description={s.desc} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-8 text-center text-2xl font-bold text-brand-900">AI Agent-Orchestrated Customer Engagement</h3>
            <div className="grid gap-6 md:grid-cols-2">
              {customerSolutions.map((s) => (
                <IconBox key={s.title} icon={<s.icon className="h-6 w-6" />} title={s.title} description={s.desc} />
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section background="brand" className="text-center">
        <Container>
          <h2 className="text-4xl font-bold text-brand-900">Orchestrate AI. Simplify Operations. Scale Outcomes.</h2>
          <div className="mt-8"><Link href="/schedule-a-demo/"><Button size="xl">Get Started on AWS</Button></Link></div>
        </Container>
      </Section>
    </>
  )
}
