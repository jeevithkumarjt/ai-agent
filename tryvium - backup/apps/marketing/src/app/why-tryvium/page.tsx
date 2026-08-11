import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, Section, Button, Badge, Card, CardContent } from '@tryvium/ui'
import { Bot, Users, Globe, Zap, Layers, BarChart3, CheckCircle, ArrowRight, XCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Why Tryvium - Built for the AI-Orchestrated Operations',
  description: 'Find out why enterprises choose Tryvium to deliver faster resolutions, higher productivity, and seamless AI-powered operations.',
  alternates: { canonical: 'https://www.tryvium.ai/why-tryvium/' },
}

const comparisons = [
  { before: 'Fragmented point solutions', after: 'Unified orchestration platform' },
  { before: 'Bot → Queue → Agent escalation', after: 'AI agent-led resolution' },
  { before: 'Lost context across channels', after: 'Persistent interaction history' },
  { before: 'Manual workforce management', after: 'AI-optimized operations' },
]

export default function WhyTryviumPage() {
  return (
    <>
      <Section background="gray" className="pt-20 pb-32">
        <Container className="text-center">
          <Badge className="mb-4">Why Tryvium</Badge>
          <h1 className="text-5xl font-extrabold text-brand-900">Experiences that win customers. Efficiency that empowers teams.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-600">Find out why enterprises choose Tryvium to deliver faster resolutions, higher productivity, and seamless AI-powered operations.</p>
          <div className="mt-10"><Link href="/schedule-a-demo/"><Button size="xl">Schedule a Demo</Button></Link></div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">The Shift</Badge>
            <h2 className="text-4xl font-bold text-brand-900">What&apos;s standing between enterprises and exceptional CX?</h2>
          </div>
          <div className="mt-12 space-y-4">
            {comparisons.map((c, i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl border border-brand-100 bg-gray-50 p-4">
                <XCircle className="h-6 w-6 shrink-0 text-red-400" />
                <span className="flex-1 text-brand-600 line-through">{c.before}</span>
                <ArrowRight className="h-5 w-5 text-brand-300" />
                <CheckCircle className="h-6 w-6 shrink-0 text-green-500" />
                <span className="flex-1 font-medium text-brand-900">{c.after}</span>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section background="brand" className="text-center">
        <Container>
          <h2 className="text-4xl font-bold text-brand-900">Ready to get started with Tryvium?</h2>
          <div className="mt-8"><Link href="/schedule-a-demo/"><Button size="xl">Schedule a Demo</Button></Link></div>
        </Container>
      </Section>
    </>
  )
}
