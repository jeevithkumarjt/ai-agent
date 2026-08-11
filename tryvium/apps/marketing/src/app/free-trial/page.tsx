import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, Section, Button, Badge, Card, CardContent } from '@tryvium/ui'
import { CheckCircle, ArrowRight } from 'lucide-react'

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
          <h1 className="text-5xl font-extrabold text-brand-900">Experience Tryvium with a Free Trial</h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-brand-600">Explore the Experience Orchestration Platform enabling the transition to autonomous AI agents. See how Tryvium orchestrates AI agents, human agents, workflows, automation, and enterprise systems through one connected execution layer designed for Employee Helpdesk and Customer Service Desk operations.</p>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold text-brand-900">Start Your Free Trial</h2>
              <form className="mt-8 space-y-6" method="POST" action="/api/lead">
                <input type="hidden" name="_honeypot" style={{ display: 'none' }} />
                <input type="hidden" name="_captcha" value="turnstile" />
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-brand-900">Full Name *</label>
                  <input id="name" name="name" required className="flex h-10 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm placeholder:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Your name" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-brand-900">Work Email Address *</label>
                  <input id="email" name="email" type="email" required className="flex h-10 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm placeholder:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="you@company.com" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="company" className="text-sm font-medium text-brand-900">Company Name *</label>
                  <input id="company" name="company" required className="flex h-10 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm placeholder:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Your company" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium text-brand-900">Phone Number</label>
                  <input id="phone" name="phone" type="tel" className="flex h-10 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm placeholder:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="+1 000 000 0000" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="cloud" className="text-sm font-medium text-brand-900">Enterprise Cloud</label>
                  <select id="cloud" name="cloud" className="flex h-10 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="">—Please choose an option—</option>
                    <option value="AWS">AWS</option>
                    <option value="Azure">Microsoft Azure</option>
                    <option value="GCP">GCP</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium text-brand-900">Interests</label>
                  <textarea id="message" name="message" maxLength={500} className="flex min-h-[100px] w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm placeholder:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Tell us about your needs..." />
                  <p className="text-xs text-brand-400">0 / 500</p>
                </div>
                <div className="flex items-start gap-2">
                  <input id="terms" name="terms" type="checkbox" required className="mt-1 h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500" />
                  <label htmlFor="terms" className="text-sm text-brand-600">I agree to the Terms of Service and Privacy Policy.</label>
                </div>
                <Button type="submit" size="lg" className="w-full" style={{ backgroundColor: '#F26E26' }}>Start Free Trial</Button>
              </form>
            </div>

            <div>
              <Card className="h-full"><CardContent className="pt-8">
                <h2 className="text-2xl font-bold text-brand-900">Explore AI-Led Orchestration</h2>
                <p className="mt-2 text-sm text-brand-600">No credit card required. Full access for 14 days.</p>
                <ul className="mt-6 space-y-3">
                  {[
                    'Automate employee helpdesk and customer service desk',
                    'Orchestrate AI agents and human agents through a unified platform',
                    'Enable intelligent routing, workflow automation, and escalations',
                    'Connect enterprise applications, ITSM, CRM, and collaboration tools',
                    'Gain real-time visibility across interactions and operations',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-brand-700"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" /> {item}</li>
                  ))}
                </ul>
              </CardContent></Card>

              <div className="mt-8 rounded-xl border border-brand-100 bg-brand-50 p-6 text-center">
                <h3 className="text-lg font-semibold text-brand-900">Not Ready for a Trial?</h3>
                <p className="mt-2 text-sm text-brand-600">Explore how Tryvium helps organizations transition to autonomous AI agents through AI-led orchestration, automation, and connected execution across Employee Helpdesk and Customer Service Desk operations.</p>
                <Link href="/contact-us"><Button variant="outline" size="lg" className="mt-4">Contact Us <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}
