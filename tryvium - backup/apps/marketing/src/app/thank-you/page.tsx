import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, Section, Card, CardContent } from '@tryvium/ui'
import { CheckCircle } from 'lucide-react'

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
            <p className="mt-4 text-brand-600">Your submission has been received successfully. Our team will contact you shortly.</p>
            <div className="mt-8"><Link href="/"><button className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-medium text-white hover:bg-brand-700">Return Home</button></Link></div>
          </CardContent>
        </Card>
      </Container>
    </Section>
  )
}
