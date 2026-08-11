import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, Section, Button, Badge, Card, CardContent, IconBox } from '@tryvium/ui'
import { Bot, Users, Shield, Workflow, BarChart3, Layers, ArrowRight, CheckCircle, XCircle } from 'lucide-react'

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
  { automation: 'Chatbots deflect then escalate', orchestration: 'AI agents resolve end-to-end' },
  { automation: 'Context resets at each handoff', orchestration: 'Context persists across every interaction' },
  { automation: 'Customers repeat information', orchestration: 'Customers never repeat themselves' },
  { automation: 'Human agents tied to repetitive tasks', orchestration: 'Humans focus on judgment and exceptions' },
  { automation: 'Siloed channels and systems', orchestration: 'Unified orchestration across all systems' },
]

export default function PlatformPage() {
  return (
    <>
      <Section background="gray" className="pt-20 pb-32">
        <Container className="text-center">
          <Badge className="mb-4">Platform</Badge>
          <h1 className="text-5xl font-extrabold text-brand-900">AI-agent orchestration for the next generation of enterprise operations</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-600">Unify AI agents, human teams, workflows, and enterprise systems with our AI-Powered Experience Orchestration for seamless operational execution.</p>
          <div className="mt-10"><Link href="/schedule-a-demo/"><Button size="xl">Schedule a Demo</Button></Link></div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-bold text-brand-900">Automation-Escalation vs. Experience Orchestration</h2>
          </div>
          <div className="mt-12 space-y-3">
            <div className="grid grid-cols-3 gap-4 rounded-t-xl bg-brand-950 p-4 text-sm font-semibold text-white">
              <span></span><span className="text-center">Automation-Escalation</span><span className="text-center">Experience Orchestration</span>
            </div>
            {comparisonRows.map((row, i) => (
              <div key={i} className={`grid grid-cols-3 gap-4 rounded-lg p-4 text-sm ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                <span className="font-medium text-brand-900">{row.automation.split(' ')[0]}</span>
                <span className="text-center text-brand-500 line-through">{row.automation}</span>
                <span className="text-center font-medium text-green-700">{row.orchestration}</span>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section background="brand" className="text-center">
        <Container>
          <h2 className="text-4xl font-bold text-brand-900">Ready to move beyond the automation-escalation model?</h2>
          <div className="mt-8"><Link href="/schedule-a-demo/"><Button size="xl">Schedule a Demo</Button></Link></div>
        </Container>
      </Section>
    </>
  )
}
