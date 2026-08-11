import type { Metadata } from 'next'
import { Container, Section, Button, Badge, Card, CardContent } from '@tryvium/ui'
import { MapPin, Phone, Mail, Send } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Connect with Our Experts | Tryvium',
  description: 'Connect with the Tryvium team for inquiries, support, partnerships, or to learn more about our solutions and services.',
  alternates: { canonical: 'https://www.tryvium.ai/contact-us/' },
}

export default function ContactPage() {
  return (
    <>
      <Section background="gray" className="pt-20 pb-32">
        <Container className="text-center">
          <Badge className="mb-4">Contact Us</Badge>
          <h1 className="text-5xl font-extrabold text-brand-900">Get in Touch</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-600">Ready to explore Tryvium?</p>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold text-brand-900">Send us a message</h2>
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
                <Button type="submit" size="lg" className="w-full sm:w-auto" style={{ backgroundColor: '#F26E26' }}><Send className="mr-2 h-4 w-4" /> Submit</Button>
              </form>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-brand-900">Our Location</h2>
              <div className="mt-8 space-y-6">
                <Card><CardContent className="flex items-start gap-4 pt-6">
                  <MapPin className="mt-1 h-5 w-5 shrink-0 text-brand-500" />
                  <div><h3 className="font-semibold text-brand-900">Headquarters</h3><p className="mt-1 text-sm text-brand-600">1460 US Highway 9 North, Suite 303<br />Woodbridge, New Jersey 07095<br />United States of America</p></div>
                </CardContent></Card>
                <Card><CardContent className="flex items-start gap-4 pt-6">
                  <Phone className="mt-1 h-5 w-5 shrink-0 text-brand-500" />
                  <div><h3 className="font-semibold text-brand-900">Phone</h3><a href="tel:+17322830499" className="mt-1 block text-sm text-brand-600 hover:text-brand-500">+1 732 283 0499</a><p className="text-xs text-brand-400">extension 251</p></div>
                </CardContent></Card>
                <Card><CardContent className="flex items-start gap-4 pt-6">
                  <Mail className="mt-1 h-5 w-5 shrink-0 text-brand-500" />
                  <div><h3 className="font-semibold text-brand-900">Email</h3><a href="mailto:info@tryvium.ai" className="mt-1 block text-sm text-brand-600 hover:text-brand-500">info@tryvium.ai</a><a href="mailto:sales@tryvium.ai" className="mt-1 block text-sm text-brand-600 hover:text-brand-500">sales@tryvium.ai</a></div>
                </CardContent></Card>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}
