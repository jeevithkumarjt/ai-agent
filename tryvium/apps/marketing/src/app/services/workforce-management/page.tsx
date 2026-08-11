import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Container, Section, Button, Badge, Card, CardContent } from '@tryvium/ui'
import { BarChart3, TrendingUp, Gauge, Shield, Users, Clock, Activity } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact Center Workforce Management (WFM) & Analytics | Tryvium',
  description: 'Optimize your contact center Workforce Management & Analytics solution for accurate forecasting, smart scheduling, real-time insights, and improved agent performance.',
  openGraph: {
    title: 'Contact Center Workforce Management (WFM) & Analytics | Tryvium',
    description: 'Optimize your contact center Workforce Management & Analytics solution for accurate forecasting, smart scheduling, real-time insights, and improved agent performance.',
    url: 'https://www.tryvium.ai/services/workforce-management/',
    images: [{ url: 'https://www.tryvium.ai/wp-content/uploads/2026/07/workforce-management-bg.webp', width: 460, height: 375, alt: 'workforce-management' }],
  },
  alternates: { canonical: 'https://www.tryvium.ai/services/workforce-management/' },
}

const steps = [
  { number: '01', title: 'Assessment & Forecasting', desc: 'Analyze historical data, seasonal trends, and interaction patterns to accurately predict contact volumes and staffing needs.' },
  { number: '02', title: 'Smart Scheduling & Allocation', desc: 'Assign shifts based on skill sets, availability, and predicted demand, so the right agent is available at the right time, and workloads stay fair.' },
  { number: '03', title: 'Real-Time Monitoring', desc: 'Get live visibility into queue lengths, handle times, and agent performance, so supervisors can act before small issues become bigger ones.' },
  { number: '04', title: 'Performance Analytics', desc: 'Track KPIs like AHT, CSAT, and utilization through dynamic dashboards and reports built for fast, informed decisions.' },
  { number: '05', title: 'Continuous Optimization', desc: 'Use analytics to fine-tune schedules, training, and workflows, continuously improving both efficiency and employee satisfaction.' },
]

const benefits = [
  { icon: TrendingUp, title: 'Improved service levels', desc: 'Accurate forecasting and smart scheduling mean the right number of agents are available exactly when demand requires it.', img: 'https://www.tryvium.ai/wp-content/uploads/2026/07/key-benefits-workforce-management-1.webp' },
  { icon: TrendingUp, title: 'Lower operating costs', desc: 'Reduce overstaffing and last-minute scrambling by aligning staffing precisely with predicted volume.', img: 'https://www.tryvium.ai/wp-content/uploads/2026/07/key-benefits-workforce-management-2.webp' },
  { icon: Users, title: 'Higher agent engagement', desc: 'Fair scheduling and transparent performance data give agents clarity and consistency to perform their best.', img: 'https://www.tryvium.ai/wp-content/uploads/2026/07/key-benefits-workforce-management-3.webp' },
  { icon: BarChart3, title: 'Data-driven decision making', desc: 'Real-time dashboards improve live visibility into performance and trend insights.', img: 'https://www.tryvium.ai/wp-content/uploads/2026/07/key-benefits-workforce-management-4.webp' },
  { icon: Shield, title: 'Built-in compliance & adherence', desc: 'Track adherence automatically, so compliance is part of daily operations, not a separate audit process.', img: 'https://www.tryvium.ai/wp-content/uploads/2026/07/key-benefits-workforce-management-5.webp' },
  { icon: Gauge, title: 'Scalable without added complexity', desc: 'Handle seasonal peaks and growing volume without scrambling to rebuild schedules from scratch.', img: 'https://www.tryvium.ai/wp-content/uploads/2026/07/key-benefits-workforce-management-6.webp' },
]

const whyTrust = [
  { icon: Activity, title: 'Proven implementation expertise', desc: 'Years of deploying workforce management for enterprise contact centers, backed by a proven implementation process.' },
  { icon: Gauge, title: 'Unified workforce platform', desc: 'Manage scheduling, analytics, and reporting through a single dashboard, no switching between disconnected tools.' },
  { icon: Clock, title: 'Seamless integrations', desc: 'Connect effortlessly with CRMs, CCaaS platforms, and HR systems for complete operational visibility.' },
  { icon: Shield, title: 'Dedicated support beyond go-live', desc: 'Ongoing support and optimization after deployment, not a handoff once the platform is live.' },
]

export default function WorkforceManagementPage() {
  return (
    <>
      <Section background="gray" className="pt-20 pb-32">
        <Container className="text-center">
          <Badge className="mb-4">Contact center</Badge>
          <h1 className="text-5xl font-extrabold text-brand-900">Enterprise workforce management for modern contact centers</h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-brand-600">Give your contact center workforce the visibility and structure to perform at their best, with forecasting, scheduling, and adherence built for how contact centers actually run.</p>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-brand-600">Tryvium&rsquo;s Workforce Management &amp; Analytics platform helps you optimize staffing, scheduling, and performance decisions with real-time data, so agents are set up to succeed and customers get consistent, reliable service.</p>
          <div className="mt-10"><Link href="/contact-us/"><Button size="xl">Speak to an expert</Button></Link></div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <h2 className="text-4xl font-bold text-brand-900">Why enterprises need better workforce management</h2>
            <p className="mt-6 text-lg text-brand-600">Understaffing, poor scheduling, and manual planning processes don&rsquo;t just hurt service levels, they make it harder to keep agents engaged and motivated. Tryvium replaces static schedules and manual planning with real-time forecasting and analytics, so staffing keeps pace with demand, adherence is tracked automatically, and fair, transparent performance data keeps your workforce motivated.</p>
          </div>
          <div className="flex justify-center">
            <Image
              src="https://www.tryvium.ai/wp-content/uploads/2026/07/workforce-management-bg.webp"
              alt="Workforce Management"
              width={460}
              height={375}
              className="h-auto"
            />
          </div>
        </Container>
      </Section>

      <Section background="gray">
        <Container>
          <h2 className="mb-16 text-center text-4xl font-bold text-brand-900">Our approach to data-driven workforce optimization</h2>
          <div className="relative">
            <Image
              src="https://www.tryvium.ai/wp-content/uploads/2026/07/workforce-management-bg-1-1.webp"
              alt="Unified Experience Orchestration"
              width={1520}
              height={574}
              className="mb-12 w-full rounded-xl"
            />
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((s) => (
              <Card key={s.number}>
                <CardContent className="pt-8">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 text-xl font-bold text-brand-600">{s.number}</div>
                  <h3 className="text-lg font-semibold text-brand-900">{s.title}</h3>
                  <p className="mt-2 text-sm text-brand-600">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <h2 className="mb-16 text-center text-4xl font-bold text-brand-900">Key benefits of workforce management &amp; analytics</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {benefits.map((b) => (
              <Card key={b.title}>
                <CardContent className="pt-8">
                  <div className="mb-4">
                    <Image src={b.img} alt={b.title} width={135} height={135} className="h-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-brand-900">{b.title}</h3>
                  <p className="mt-2 text-sm text-brand-600">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section background="gray">
        <Container>
          <h2 className="mb-16 text-center text-4xl font-bold text-brand-900">Why operation leaders trust Tryvium</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {whyTrust.map((w) => (
              <Card key={w.title}>
                <CardContent className="flex items-start gap-4 pt-8">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                    <w.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-brand-900">{w.title}</h3>
                    <p className="mt-2 text-sm text-brand-600">{w.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section background="brand">
        <Container>
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-bold text-brand-900">Powerful capabilities for modern workforce management</h2>
          </div>
          <div className="flex justify-center">
            <Image
              src="https://www.tryvium.ai/wp-content/uploads/2026/07/enterprise-scale.webp"
              alt="Enterprise Scale"
              width={800}
              height={500}
              className="h-auto rounded-xl"
            />
          </div>
        </Container>
      </Section>

      <Section background="white" className="text-center">
        <Container>
          <h2 className="text-4xl font-bold text-brand-900">Ready to optimize your workforce?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-brand-600">Empower your contact center with workforce management and analytics that deliver measurable results. Tryvium helps you optimize staffing, strengthen agent engagement, and make smarter, faster decisions, all from one platform.</p>
          <div className="mt-8"><Link href="/contact-us/"><Button size="xl">Book a free consultation</Button></Link></div>
        </Container>
      </Section>
    </>
  )
}
