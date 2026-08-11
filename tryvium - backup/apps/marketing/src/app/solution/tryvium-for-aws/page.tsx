import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, Section, Button, Badge, Card, CardContent, IconBox } from '@tryvium/ui'
import { Cloud, Bot, Users, Shield, Workflow, ArrowRight, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Tryvium for AWS | AI Agent Orchestration for Amazon Connect',
  description: 'Modernize employee and customer support with AI agent orchestration on Amazon Connect. Launch faster with one-click deployment, pre-built flows, and enterprise-grade security.',
  openGraph: {
    title: 'Tryvium for AWS | AI Agent Orchestration for Amazon Connect',
    description: 'Modernize employee and customer support with AI agent orchestration on Amazon Connect.',
    url: 'https://www.tryvium.ai/solution/tryvium-for-aws/',
  },
  alternates: { canonical: 'https://www.tryvium.ai/solution/tryvium-for-aws/' },
}

const benefits = [
  { icon: Cloud, title: 'One-Click Amazon Connect Deployment', desc: 'Deploy Tryvium on Amazon Connect with a single click. Pre-built contact flows and service integrations included.' },
  { icon: Bot, title: 'AI Agent-Orchestration', desc: 'Deploy autonomous AI agents that handle interactions from start to finish on AWS infrastructure.' },
  { icon: Users, title: 'Human-Governed AI', desc: 'AI agents handle the majority of interactions while humans maintain oversight and intervene when needed.' },
  { icon: Shield, title: 'Enterprise Security & Compliance', desc: 'Built on AWS with enterprise-grade security, compliance, and governance frameworks.' },
  { icon: Workflow, title: 'IVR Migration', desc: 'Modernize legacy IVR systems with AI-powered conversational experiences on Amazon Connect.' },
  { icon: Cloud, title: 'Pay-as-You-Use Pricing', desc: 'Scale your operations with flexible pricing that aligns with your usage patterns.' },
]

const solutions = [
  { title: 'AI-Powered Employee Service Desk', desc: 'Automate IT and HR service desk operations with AI agents that resolve employee inquiries instantly.' },
  { title: 'AI Agent-Orchestrated Customer Engagement', desc: 'Deliver personalized customer experiences with AI agents that maintain context across every interaction.' },
  { title: 'Unified Experience Orchestration', desc: 'Orchestrate every interaction, workflow, and decision through a unified intelligence layer.' },
]

export default function TryviumForAWSPage() {
  return (
    <>
      <Section background="gray" className="pt-20 pb-32">
        <Container className="text-center">
          <Badge className="mb-4">Solution</Badge>
          <h1 className="text-5xl font-extrabold text-brand-900">Tryvium <span className="text-brand-600">for AWS</span></h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-600">Modernize employee and customer support with AI agent orchestration on Amazon Connect. Launch faster with one-click deployment, pre-built flows, and enterprise-grade security.</p>
          <div className="mt-10"><Link href="/schedule-a-demo/"><Button size="xl">Schedule a Demo</Button></Link></div>
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
          <h2 className="mb-12 text-center text-3xl font-bold text-brand-900">Real Enterprise Challenges. AI Agent-Orchestrated Solutions.</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {solutions.map((s) => (
              <Card key={s.title}>
                <CardContent className="pt-8">
                  <CheckCircle className="mb-4 h-8 w-8 text-green-500" />
                  <h3 className="text-lg font-semibold text-brand-900">{s.title}</h3>
                  <p className="mt-3 text-sm text-brand-600">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
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
