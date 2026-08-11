import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, Section, Button, Badge, Card, CardContent, IconBox } from '@tryvium/ui'
import { Cloud, Bot, Users, Shield, Workflow, Globe, ArrowRight, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Tryvium for Microsoft Azure | AI Agent Orchestration for Teams',
  description: 'Enhance enterprise service operations with AI agent orchestration for Teams. Accelerate deployment with intelligent workflows and native integrations.',
  openGraph: {
    title: 'Tryvium for Microsoft Azure | AI Agent Orchestration for Teams',
    description: 'Enhance enterprise service operations with AI agent orchestration for Teams.',
    url: 'https://www.tryvium.ai/solution/tryvium-for-azure/',
  },
  alternates: { canonical: 'https://www.tryvium.ai/solution/tryvium-for-azure/' },
}

export default function TryviumForAzurePage() {
  return (
    <>
      <Section background="gray" className="pt-20 pb-32">
        <Container className="text-center">
          <Badge className="mb-4">Solution</Badge>
          <h1 className="text-5xl font-extrabold text-brand-900">Orchestrate Enterprise AI on <span className="text-brand-600">Microsoft Azure</span></h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-600">Enhance enterprise service operations with AI agent orchestration for Teams. Accelerate deployment with intelligent workflows and native integrations.</p>
          <div className="mt-10"><Link href="/schedule-a-demo/"><Button size="xl">Schedule a Demo</Button></Link></div>
        </Container>
      </Section>
      <Section background="white">
        <Container>
          <h2 className="mb-12 text-center text-3xl font-bold text-brand-900">Move beyond conversations and enable connected execution built on Microsoft Teams</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Bot, title: 'AI-Agent Orchestrated Solution', desc: 'Deploy autonomous AI agents that orchestrate service operations on Microsoft Azure.' },
              { icon: Users, title: 'AI-Powered Employee Service Desk', desc: 'Automate IT and HR service desk with AI agents integrated with Microsoft Teams.' },
              { icon: Shield, title: 'Microsoft Validated & Recognized', desc: 'Built on Microsoft Azure with certified integrations and security compliance.' },
              { icon: Globe, title: 'AI-Led Customer Engagement', desc: 'Deliver omnichannel customer experiences orchestrated through Microsoft Teams.' },
              { icon: Workflow, title: 'Service Automation & Optimization', desc: 'Automate workflows and optimize operations with AI-powered insights.' },
              { icon: Cloud, title: 'Enterprise Integrations', desc: 'Seamlessly integrate with Dynamics 365, ServiceNow, SharePoint, and more.' },
            ].map((b) => (
              <IconBox key={b.title} icon={<b.icon className="h-6 w-6" />} title={b.title} description={b.desc} />
            ))}
          </div>
        </Container>
      </Section>
      <Section background="brand" className="text-center">
        <Container>
          <h2 className="text-4xl font-bold text-brand-900">Experience Orchestration Built on Microsoft Teams</h2>
          <div className="mt-8"><Link href="/schedule-a-demo/"><Button size="xl">Get Started on Azure</Button></Link></div>
        </Container>
      </Section>
    </>
  )
}
