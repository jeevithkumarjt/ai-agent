import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, Section, Button, Badge, Card, CardContent } from '@tryvium/ui'
import { ArrowRight, Target, Eye, Heart, Users, Shield, Globe, Award } from 'lucide-react'

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

export default function AboutPage() {
  return (
    <>
      <Section background="gray" className="pt-20 pb-32">
        <Container className="text-center">
          <Badge className="mb-4">About Us</Badge>
          <h1 className="text-5xl font-extrabold text-brand-900">Accelerating Enterprise Transformation Through AI Orchestration</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-600">We are helping enterprises transition from Automation-Escalation service models to AI Agent-Orchestrated operations.</p>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Target, title: 'Mission', desc: 'To help enterprises transition from human-centric service operations to autonomous, AI-orchestrated experiences.' },
              { icon: Eye, title: 'Vision', desc: 'A world where every enterprise interaction is intelligent, seamless, and continuously improving.' },
              { icon: Heart, title: 'Values', desc: 'Customer-first approach, enterprise-grade security, and practical paths to AI adoption.' },
              { icon: Award, title: 'Recognition', desc: 'Recognized across enterprise ecosystems for innovation in AI orchestration.' },
            ].map((v) => (
              <Card key={v.title}>
                <CardContent className="pt-8 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-100 text-brand-600"><v.icon className="h-7 w-7" /></div>
                  <h3 className="text-lg font-semibold text-brand-900">{v.title}</h3>
                  <p className="mt-3 text-sm text-brand-600">{v.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section background="brand" className="text-center">
        <Container>
          <h2 className="text-4xl font-bold text-brand-900">Orchestrate AI. Simplify Operations. Scale Outcomes.</h2>
          <div className="mt-8"><Link href="/contact-us/"><Button size="xl">Contact Us <ArrowRight className="ml-2 h-5 w-5" /></Button></Link></div>
        </Container>
      </Section>
    </>
  )
}
