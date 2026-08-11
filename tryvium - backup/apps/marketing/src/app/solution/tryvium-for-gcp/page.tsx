import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, Section, Button, Badge, Card, CardContent, IconBox } from '@tryvium/ui'
import { Cloud, Bot, Users, Shield, Workflow, BarChart3, ArrowRight, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Tryvium for GCP | AI Agent Orchestration for Google Cloud',
  description: 'Reimagine employee and customer support with AI agent orchestration for Google cloud. Accelerate service delivery with enterprise-grade scalability and intelligence.',
  openGraph: {
    title: 'Tryvium for GCP | AI Agent Orchestration for Google Cloud',
    description: 'Reimagine employee and customer support with AI agent orchestration for Google cloud.',
    url: 'https://www.tryvium.ai/solution/tryvium-for-gcp/',
  },
  alternates: { canonical: 'https://www.tryvium.ai/solution/tryvium-for-gcp/' },
}

export default function TryviumForGCPPage() {
  return (
    <>
      <Section background="gray" className="pt-20 pb-32">
        <Container className="text-center">
          <Badge className="mb-4">Solution</Badge>
          <h1 className="text-5xl font-extrabold text-brand-900">AI agent-orchestrated service operations on <span className="text-brand-600">Google Cloud Platform</span></h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-600">Reimagine employee and customer support with AI agent orchestration for Google cloud. Accelerate service delivery with enterprise-grade scalability and intelligence.</p>
          <div className="mt-10"><Link href="/schedule-a-demo/"><Button size="xl">Schedule a Demo</Button></Link></div>
        </Container>
      </Section>
      <Section background="white">
        <Container>
          <h2 className="mb-12 text-center text-3xl font-bold text-brand-900">Driving better outcomes across CX and EX</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Bot, title: 'Autonomous AI Agent Orchestration', desc: 'Deploy AI agents that autonomously orchestrate service operations on Google Cloud.' },
              { icon: Users, title: 'IT & HR Service Automation', desc: 'Automate routine IT and HR requests, freeing teams for strategic work.' },
              { icon: Shield, title: 'Enterprise Security & Compliance', desc: 'Built with Google Cloud\'s enterprise-grade security and compliance framework.' },
              { icon: Globe, title: 'Omnichannel Customer Support', desc: 'Deliver seamless experiences across voice, chat, email, and messaging.' },
              { icon: Workflow, title: 'Workflow Automation', desc: 'Automate complex business processes across enterprise systems on GCP.' },
              { icon: BarChart3, title: 'Real-time Insights', desc: 'Gain actionable insights with AI-powered analytics and reporting.' },
            ].map((b) => (
              <IconBox key={b.title} icon={<b.icon className="h-6 w-6" />} title={b.title} description={b.desc} />
            ))}
          </div>
        </Container>
      </Section>
      <Section background="brand" className="text-center">
        <Container>
          <h2 className="text-4xl font-bold text-brand-900">See what Tryvium&apos;s autonomous AI agents can do for your enterprise</h2>
          <div className="mt-8"><Link href="/schedule-a-demo/"><Button size="xl">Get Started on GCP</Button></Link></div>
        </Container>
      </Section>
    </>
  )
}
