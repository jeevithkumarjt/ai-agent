import type { Metadata } from 'next'
import { Container, Section, Badge } from '@tryvium/ui'

export const metadata: Metadata = {
  title: 'Privacy Policy | Tryvium',
  robots: { index: false, follow: false },
}

export default function PrivacyPolicyPage() {
  return (
    <Section background="gray" className="py-24">
      <Container>
        <article className="prose prose-brand mx-auto max-w-3xl">
          <Badge className="mb-4">Legal</Badge>
          <h1 className="text-4xl font-bold text-brand-900">Privacy Policy</h1>
          <p className="mt-6 text-brand-600">
            Your privacy is important to us. It is Tryvium&apos;s policy to respect your privacy regarding
            any information we may collect from you across our website.
          </p>
          <h2 className="mt-8 text-2xl font-bold text-brand-900">Information We Collect</h2>
          <p className="mt-4 text-brand-600">
            We only ask for personal information when we truly need it to provide a service to you.
            We collect it by fair and lawful means, with your knowledge and consent.
          </p>
          <h2 className="mt-8 text-2xl font-bold text-brand-900">How We Use Information</h2>
          <p className="mt-4 text-brand-600">
            We use the information we collect to operate, maintain, and provide you with the features and
            functionality of our services, to analyze usage, and to improve user experience.
          </p>
        </article>
      </Container>
    </Section>
  )
}
