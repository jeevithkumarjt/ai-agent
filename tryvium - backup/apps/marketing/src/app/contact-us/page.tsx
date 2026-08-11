import type { Metadata } from 'next'
import { Container, Section, Button, Badge, Card, CardContent } from '@tryvium/ui'
import { Mail, Phone, MapPin, Send } from 'lucide-react'

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
          <Badge className="mb-4">Contact</Badge>
          <h1 className="text-5xl font-extrabold text-brand-900">Connect with Our Experts</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-600">Connect with the Tryvium team for inquiries, support, partnerships, or to learn more about our solutions and services.</p>
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-brand-900">Name</label>
                    <input id="name" name="name" required className="flex h-10 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm placeholder:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Your name" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-brand-900">Email</label>
                    <input id="email" name="email" type="email" required className="flex h-10 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm placeholder:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="you@company.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="company" className="text-sm font-medium text-brand-900">Company</label>
                  <input id="company" name="company" className="flex h-10 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm placeholder:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Your company" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium text-brand-900">Message</label>
                  <textarea id="message" name="message" required className="flex min-h-[120px] w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm placeholder:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Tell us about your needs..." />
                </div>
                <Button type="submit" size="lg" className="w-full sm:w-auto"><Send className="mr-2 h-4 w-4" /> Send Message</Button>
              </form>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-brand-900">Contact Information</h2>
              <div className="mt-8 space-y-6">
                <Card><CardContent className="flex items-start gap-4 pt-6">
                  <MapPin className="mt-1 h-5 w-5 shrink-0 text-brand-500" />
                  <div><h3 className="font-semibold text-brand-900">Headquarters</h3><p className="mt-1 text-sm text-brand-600">1460 US Highway 9 North, Suite 303<br />Woodbridge, New Jersey 07095 USA</p></div>
                </CardContent></Card>
                <Card><CardContent className="flex items-start gap-4 pt-6">
                  <Phone className="mt-1 h-5 w-5 shrink-0 text-brand-500" />
                  <div><h3 className="font-semibold text-brand-900">Phone</h3><a href="tel:+17322830499" className="mt-1 block text-sm text-brand-600 hover:text-brand-500">+1 732 283 0499</a></div>
                </CardContent></Card>
                <Card><CardContent className="flex items-start gap-4 pt-6">
                  <Mail className="mt-1 h-5 w-5 shrink-0 text-brand-500" />
                  <div><h3 className="font-semibold text-brand-900">Email</h3><a href="mailto:sales@tryvium.ai" className="mt-1 block text-sm text-brand-600 hover:text-brand-500">sales@tryvium.ai</a></div>
                </CardContent></Card>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}
