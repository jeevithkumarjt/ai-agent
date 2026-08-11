import type { Metadata } from 'next'
import { Container, Section, Button, Badge, Card, CardContent } from '@tryvium/ui'
import { CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Start Your 14-Day Free Trial | Tryvium',
  description: 'Start your 14-day Tryvium free trial to unify AI, people, and enterprise systems through intelligent orchestration.',
  alternates: { canonical: 'https://www.tryvium.ai/free-trial/' },
}

export default function FreeTrialPage() {
  return (
    <>
      <Section background="gray" className="pt-20 pb-32">
        <Container className="text-center">
          <Badge className="mb-4">Free Trial</Badge>
          <h1 className="text-5xl font-extrabold text-brand-900">Start Your AI-Led Transformation</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-600">Explore AI-Led Orchestration. Start your 14-day free trial to unify AI, people, and enterprise systems.</p>
        </Container>
      </Section>
      <Section background="white">
        <Container>
          <div className="mx-auto grid max-w-4xl gap-12 lg:grid-cols-2">
            <Card><CardContent className="pt-8">
              <h2 className="text-2xl font-bold text-brand-900">Explore AI-Led Orchestration</h2>
              <p className="mt-2 text-sm text-brand-600">No credit card required. Full access for 14 days.</p>
              <ul className="mt-6 space-y-3">
                {['Full platform access', 'AI agent orchestration', 'Human agent workspace', 'Analytics dashboard', 'Email support'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-brand-700"><CheckCircle className="h-4 w-4 text-green-500" /> {item}</li>
                ))}
              </ul>
            </CardContent></Card>
            <div>
              <form className="space-y-6" method="POST" action="/api/lead">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-brand-900">Name</label>
                  <input id="name" name="name" required className="flex h-10 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm placeholder:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Your name" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-brand-900">Work Email</label>
                  <input id="email" name="email" type="email" required className="flex h-10 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm placeholder:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="you@company.com" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="company" className="text-sm font-medium text-brand-900">Company</label>
                  <input id="company" name="company" className="flex h-10 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm placeholder:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Your company" />
                </div>
                <Button type="submit" size="lg" className="w-full">Start Free Trial</Button>
              </form>
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}
