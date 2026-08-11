import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, Section, Button, Badge, Card, CardContent } from '@tryvium/ui'
import { Calendar, Users, BarChart3, Clock, TrendingUp, Target, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact Center Workforce Management (WFM) & Analytics | Tryvium',
  description: 'Optimize your contact center Workforce Management & Analytics solution for accurate forecasting, smart scheduling, real-time insights, and improved agent performance.',
  openGraph: {
    title: 'Contact Center Workforce Management (WFM) & Analytics | Tryvium',
    description: 'Optimize your contact center Workforce Management & Analytics solution.',
    url: 'https://www.tryvium.ai/services/workforce-management/',
    images: [{ url: 'https://www.tryvium.ai/wp-content/uploads/2026/07/workforce-management-bg.webp', width: 800, height: 600, alt: 'workforce-management' }],
  },
  alternates: { canonical: 'https://www.tryvium.ai/services/workforce-management/' },
}

export default function WorkforceManagementPage() {
  return (
    <>
      <Section background="gray" className="pt-20 pb-32">
        <Container className="text-center">
          <Badge className="mb-4">Services</Badge>
          <h1 className="text-5xl font-extrabold text-brand-900">Enterprise workforce management for modern contact centers</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-600">Optimize your contact center Workforce Management & Analytics solution for accurate forecasting, smart scheduling, real-time insights, and improved agent performance.</p>
          <div className="mt-10"><Link href="/schedule-a-demo/"><Button size="xl">Schedule a Demo</Button></Link></div>
        </Container>
      </Section>
      <Section background="white">
        <Container>
          <h2 className="mb-12 text-center text-3xl font-bold text-brand-900">Powerful capabilities for modern workforce management</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Calendar, title: 'Accurate Forecasting', desc: 'AI-powered demand forecasting for optimal staffing levels across all channels.' },
              { icon: Users, title: 'Smart Scheduling', desc: 'Intelligent shift scheduling that balances business needs and agent preferences.' },
              { icon: BarChart3, title: 'Real-time Adherence', desc: 'Monitor schedule adherence and make real-time adjustments to maintain SLAs.' },
              { icon: Clock, title: 'Time Tracking', desc: 'Automated time tracking and attendance management with compliance reporting.' },
              { icon: TrendingUp, title: 'Performance Analytics', desc: 'Comprehensive analytics and reporting for contact center continuous improvement.' },
              { icon: Target, title: 'Goal Management', desc: 'Set and track performance goals with AI-driven insights and recommendations.' },
            ].map((f) => (
              <Card key={f.title}>
                <CardContent className="pt-8">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 text-brand-600"><f.icon className="h-6 w-6" /></div>
                  <h3 className="text-lg font-semibold text-brand-900">{f.title}</h3>
                  <p className="mt-2 text-sm text-brand-600">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>
    </>
  )
}
