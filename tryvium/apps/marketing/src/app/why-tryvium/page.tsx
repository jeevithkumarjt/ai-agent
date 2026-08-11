import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Container, Section, Button, Badge, Card, CardContent } from '@tryvium/ui'
import { Bot, Users, Globe, Zap, Layers, BarChart3, CheckCircle, ArrowRight, XCircle, Sparkles, Shield, Workflow } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Why Tryvium - Built for the AI-Orchestrated Operations',
  description: 'Find out why enterprises choose Tryvium to deliver faster resolutions, higher productivity, and seamless AI-powered operations.',
  alternates: { canonical: 'https://www.tryvium.ai/why-tryvium/' },
}

const capabilities = [
  { img: 'coordinate-ai-and-human.webp', title: 'Coordinate AI and human interactions in real time' },
  { img: 'maintain-context.webp', title: 'Maintain context across channels, handoffs, and workflows' },
  { img: 'enterprise-systems.webp', title: 'Automate execution across enterprise systems' },
  { img: 'eliminate-transfer-and-queue-workflows.webp', title: 'Eliminate transfer-and-queue workflows' },
  { img: 'deliver-seamless-experiences-at-scale.webp', title: 'Deliver seamless experiences at scale' },
  { img: 'frictionless-customer-experiences.webp', title: 'Frictionless customer experiences — no holds, no transfers' },
]

const businessOutcomes = [
  { stat: '60%', label: 'Lower Average Handle Time' },
  { stat: '3x', label: 'more interactions handled per agent' },
  { stat: '90%', label: 'First Contact Resolution' },
  { stat: '30%+', label: 'higher resolution rates' },
  { stat: '80%', label: 'ticket deflection through AI-led self-service' },
  { stat: '10x', label: 'more requests resolved autonomously' },
] as const

const features = [
  { icon: Bot, title: 'Built for AI-led\noperations' },
  { icon: Users, title: 'AI + Human\ncollaboration' },
  { icon: Layers, title: 'Context that never\ngets lost' },
  { icon: Shield, title: 'Designed for\nenterprise scale' },
]

const whyChoose = [
  { icon: Globe, title: 'Omnichannel\norchestration' },
  { icon: Zap, title: 'Faster\ndeployment' },
  { icon: Sparkles, title: 'One platform for\nCX and EX' },
  { icon: Workflow, title: 'Seamless enterprise\nintegrations' },
]

export default function WhyTryviumPage() {
  return (
    <>
      <Section background="gray" className="pt-20 pb-32">
        <Container className="text-center">
          <Badge className="mb-4">The Enterprise Platform for Experience Orchestration</Badge>
          <h1 className="text-5xl font-extrabold text-brand-900">Experiences that win customers. Efficiency that empowers teams.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-600">Transform fragmented service operations into connected, AI-led experiences where AI agents, human agents, and enterprise systems work as one.</p>
          <div className="mt-10"><Link href="https://www.tryvium.ai/demo/"><Button size="xl">Schedule a demo</Button></Link></div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">Problem with existing approach</Badge>
            <h2 className="text-4xl font-bold text-brand-900">What&apos;s standing between enterprises and exceptional CX?</h2>
            <p className="mt-4 text-lg text-brand-600">Disconnected workflows, fragmented data, and siloed automation create friction across the customer journey. The impact is felt across every interaction</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-4">
            {[
              { icon: XCircle, title: 'Lost Context', desc: 'Customers repeat information across channels and touchpoints.' },
              { icon: XCircle, title: 'Slower Resolution', desc: 'Issues take longer to resolve due to disconnected processes.' },
              { icon: XCircle, title: 'Lower Productivity', desc: 'Employees spend valuable time navigating multiple systems.' },
              { icon: XCircle, title: 'Higher Costs', desc: 'Operational complexity increases as service demands grow.' },
            ].map((v) => (
              <Card key={v.title}>
                <CardContent className="pt-8 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 text-red-400"><v.icon className="h-7 w-7" /></div>
                  <h3 className="text-lg font-semibold text-brand-900">{v.title}</h3>
                  <p className="mt-3 text-sm text-brand-600">{v.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <p className="text-lg font-medium text-brand-900">Enterprises need a unified approach that connects agents, AI, and systems.</p>
          </div>
        </Container>
      </Section>

      <Section background="gray">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">Solution</Badge>
            <h2 className="text-4xl font-bold text-brand-900">The future of CX is orchestrated, connected, and intelligent</h2>
            <p className="mt-4 text-lg text-brand-600">Customers don&apos;t experience your channels, teams, or systems separately. They experience one journey. Delivering that journey requires continuous coordination across people, AI, workflows, and enterprise systems.</p>
            <p className="mt-4 text-lg text-brand-600">Tryvium transforms fragmented operations into connected, AI-led experiences through a unified orchestration layer. Eliminate wait times, queues, manual handoffs, and siloed experiences while maintaining continuity across every customer journey.</p>
          </div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">What&apos;s possible</Badge>
            <h2 className="text-4xl font-bold text-brand-900">With Tryvium, enterprises can</h2>
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((c) => (
              <Card key={c.title}>
                <CardContent className="pt-8 text-center">
                  <div className="mx-auto mb-4 flex items-center justify-center">
                    <Image
                      src={`https://www.tryvium.ai/wp-content/uploads/2026/06/${c.img}`}
                      alt={c.title}
                      width={120}
                      height={120}
                      className="h-28 w-28 object-contain"
                    />
                  </div>
                  <h3 className="text-base font-semibold text-brand-900">{c.title}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section background="gray">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">Business Outcomes</Badge>
            <h2 className="text-4xl font-bold text-brand-900">The Business Impact of Experience Orchestration</h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { label: 'Operational Efficiency', items: [businessOutcomes[0], businessOutcomes[1]] },
              { label: 'Customer Experience', items: [businessOutcomes[2], businessOutcomes[3]] },
              { label: 'Automation Impact', items: [businessOutcomes[4], businessOutcomes[5]] },
            ].map((group) => (
              <div key={group.label}>
                <h3 className="mb-4 text-center text-xl font-bold text-brand-600">{group.label}</h3>
                <div className="space-y-4">
                  {group.items.map((v, i) => (
                    <Card key={i}>
                      <CardContent className="py-6 text-center">
                        <div className="text-4xl font-extrabold text-brand-600">{v!.stat}</div>
                        <p className="mt-2 text-sm text-brand-600">{v!.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <p className="text-lg font-medium text-brand-900">Trusted by leading enterprises to deliver intelligent, AI-orchestrated experiences at scale.</p>
          </div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <div className="grid gap-6 md:grid-cols-4">
            {features.map((f) => (
              <Card key={f.title}>
                <CardContent className="pt-8 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-100 text-brand-600"><f.icon className="h-7 w-7" /></div>
                  <h3 className="whitespace-pre-line text-lg font-semibold text-brand-900">{f.title}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-12">
            <h2 className="mb-8 text-center text-3xl font-bold text-brand-900">Why Enterprises Choose Tryvium</h2>
            <div className="grid gap-6 md:grid-cols-4">
              {whyChoose.map((p) => (
                <Card key={p.title}>
                  <CardContent className="pt-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-100 text-brand-600"><p.icon className="h-7 w-7" /></div>
                    <h3 className="whitespace-pre-line text-lg font-semibold text-brand-900">{p.title}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section background="brand" className="text-center">
        <Container>
          <Badge className="mb-4">The future of enterprise experiences</Badge>
          <h2 className="text-4xl font-bold text-brand-900">Ready to get started with Tryvium?</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-brand-700">Book a 30-minute demo with a Tryvium expert and see experience orchestration in action.</p>
          <div className="mt-8"><Link href="/schedule-a-demo/"><Button size="xl">Schedule a Demo</Button></Link></div>
        </Container>
      </Section>
    </>
  )
}
