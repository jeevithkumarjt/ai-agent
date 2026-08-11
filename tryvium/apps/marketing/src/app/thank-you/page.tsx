import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, Section, Button, Card, CardContent } from '@tryvium/ui'
import { CheckCircle, ArrowRight, Home, Headphones } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Thank You for Reaching Out | Tryvium',
  description: 'Your submission has been received successfully. Thank you for your interest in Tryvium. Our team will contact you shortly.',
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://www.tryvium.ai/thank-you/' },
}

export default function ThankYouPage() {
  return (
    <Section background="gray" className="py-32">
      <Container>
        <Card className="mx-auto max-w-lg text-center">
          <CardContent className="pt-12">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <h1 className="mt-6 text-3xl font-bold text-brand-900">You&apos;re All Set!</h1>
            <p className="mt-2 text-lg font-medium text-brand-700">Thank you!</p>
            <p className="mt-4 text-brand-600">Your request has been received, and one of our specialists will be in touch with you shortly.</p>
            <div className="mt-6 space-y-3 text-left rounded-xl border border-brand-100 bg-brand-50 p-4">
              <p className="text-sm font-medium text-brand-900">While you wait, feel free to:</p>
              <ul className="space-y-2 text-sm text-brand-600">
                <li className="flex items-start gap-2">• Head back to our <Link href="/" className="font-medium text-brand-600 underline underline-offset-2 hover:text-brand-500">Home Page</Link> to explore our platform and solutions</li>
                <li className="flex items-start gap-2">• Need help right away? Reach out to our <a href="mailto:support@tryvium.ai" className="font-medium text-brand-600 underline underline-offset-2 hover:text-brand-500">support team</a> — we&apos;re here for you</li>
              </ul>
            </div>
            <p className="mt-6 text-sm text-brand-500">We are excited to enable you to take the next step towards autonomous, AI-powered experiences for your business.</p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/"><Button variant="outline" size="lg"><Home className="mr-2 h-4 w-4" /> Explore Our Platform</Button></Link>
            </div>
          </CardContent>
        </Card>
      </Container>
    </Section>
  )
}
