import type { Metadata } from 'next'
import { Container, Section, Button, Badge, Card, CardContent } from '@tryvium/ui'
import { Calendar, CheckCircle } from 'lucide-react'

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
          <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold text-brand-900">Schedule a demo now</h2>
              <form className="mt-8 space-y-6" method="POST" action="/api/lead">
                <input type="hidden" name="_honeypot" style={{ display: 'none' }} />
                <input type="hidden" name="_captcha" value="turnstile" />
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-brand-900">Full Name *</label>
                  <input id="name" name="name" required className="flex h-10 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm placeholder:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Your name" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-brand-900">Business Email *</label>
                  <input id="email" name="email" type="email" required className="flex h-10 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm placeholder:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="you@company.com" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="company" className="text-sm font-medium text-brand-900">Company Name *</label>
                  <input id="company" name="company" required className="flex h-10 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm placeholder:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Your company" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="companySize" className="text-sm font-medium text-brand-900">Company Size</label>
                    <select id="companySize" name="companySize" className="flex h-10 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-500">
                      <option value="">—Please choose—</option>
                      <option value="10-50">10-50</option>
                      <option value="50-100">50-100</option>
                      <option value="100-200">100-200</option>
                      <option value="200-500">200-500</option>
                      <option value="500-1000">500-1000</option>
                      <option value="1000">1000+</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="employees" className="text-sm font-medium text-brand-900">Employee Size</label>
                    <select id="employees" name="employees" className="flex h-10 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-500">
                      <option value="">—Please choose—</option>
                      <option value="10-50">10-50</option>
                      <option value="50-100">50-100</option>
                      <option value="100-200">100-200</option>
                      <option value="200-500">200-500</option>
                      <option value="500-1000">500-1000</option>
                      <option value="1000">1000+</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="demoDate" className="text-sm font-medium text-brand-900">Demo Date & Time *</label>
                  <input id="demoDate" name="demoDate" type="datetime-local" required className="flex h-10 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div className="flex items-start gap-2">
                  <input id="terms" name="terms" type="checkbox" required className="mt-1 h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500" />
                  <label htmlFor="terms" className="text-sm text-brand-600">I agree to the Terms of Service and Privacy Policy.</label>
                </div>
                <Button type="submit" size="lg" className="w-full" style={{ backgroundColor: '#F26E26' }}><Calendar className="mr-2 h-4 w-4" /> Schedule Demo</Button>
              </form>
            </div>

            <div>
              <Card className="h-full"><CardContent className="pt-8">
                <h2 className="text-2xl font-bold text-brand-900">Demo</h2>
                <p className="mt-2 text-sm text-brand-600">Schedule a demo to learn how Tryvium:</p>
                <ul className="mt-6 space-y-3">
                  {[
                    'Orchestrates AI agents, human agents, and enterprise systems in real time',
                    'Replaces fragmented transfer-and-queue workflows with AI-led execution',
                    'Maintains continuous interaction context across every customer touchpoint',
                    'Enables faster resolutions with intelligent workflow orchestration',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-brand-700"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" /> {item}</li>
                  ))}
                </ul>
                <div className="mt-8 border-t border-brand-100 pt-6">
                  <p className="text-sm font-medium text-brand-900">Questions?</p>
                  <a href="mailto:demo@tryvium.ai" className="mt-1 block text-sm text-brand-600 hover:text-brand-500">demo@tryvium.ai</a>
                  <a href="mailto:sales@tryvium.ai" className="mt-1 block text-sm text-brand-600 hover:text-brand-500">sales@tryvium.ai</a>
                </div>
              </CardContent></Card>
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}
