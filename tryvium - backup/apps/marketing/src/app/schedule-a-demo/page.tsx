import type { Metadata } from 'next'
import { Container, Section, Button, Badge, Card, CardContent } from '@tryvium/ui'

export const metadata: Metadata = {
  title: 'Schedule a demo | Tryvium',
  description: 'See how Autonomous AI Agents simplify service and support operations by bringing AI, people, and systems together.',
  alternates: { canonical: 'https://www.tryvium.ai/schedule-a-demo/' },
}

export default function ScheduleDemoPage() {
  return (
    <>
      <Section background="gray" className="pt-20 pb-32">
        <Container className="text-center">
          <Badge className="mb-4">Demo</Badge>
          <h1 className="text-5xl font-extrabold text-brand-900">Get started with Tryvium</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-600">See how Autonomous AI Agents simplify service and support operations by bringing AI, people, and systems together.</p>
        </Container>
      </Section>
      <Section background="white">
        <Container>
          <div className="mx-auto max-w-2xl">
            <Card><CardContent className="pt-8">
              <h2 className="mb-6 text-2xl font-bold text-brand-900">Schedule a demo now</h2>
              <form className="space-y-6" method="POST" action="/api/lead">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="text-sm font-medium text-brand-900">First Name</label>
                    <input id="firstName" name="firstName" required className="flex h-10 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm placeholder:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="First name" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="lastName" className="text-sm font-medium text-brand-900">Last Name</label>
                    <input id="lastName" name="lastName" required className="flex h-10 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm placeholder:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Last name" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-brand-900">Work Email</label>
                  <input id="email" name="email" type="email" required className="flex h-10 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm placeholder:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="you@company.com" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="company" className="text-sm font-medium text-brand-900">Company</label>
                  <input id="company" name="company" className="flex h-10 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm placeholder:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Your company" />
                </div>
                <Button type="submit" size="lg" className="w-full">Schedule Demo</Button>
              </form>
            </CardContent></Card>
          </div>
        </Container>
      </Section>
    </>
  )
}
