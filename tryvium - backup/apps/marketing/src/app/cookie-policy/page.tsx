import type { Metadata } from 'next'
import { Container, Section, Badge } from '@tryvium/ui'

export const metadata: Metadata = {
  title: 'Cookie Policy | Tryvium',
  robots: { index: false, follow: false },
}

export default function CookiePolicyPage() {
  return (
    <Section background="gray" className="py-24">
      <Container>
        <article className="prose prose-brand mx-auto max-w-3xl">
          <Badge className="mb-4">Legal</Badge>
          <h1 className="text-4xl font-bold text-brand-900">Cookie Policy</h1>
          <p className="mt-6 text-brand-600">
            This Cookie Policy explains how Tryvium uses cookies and similar technologies to recognize
            you when you visit our website.
          </p>
          <h2 className="mt-8 text-2xl font-bold text-brand-900">What Are Cookies</h2>
          <p className="mt-4 text-brand-600">
            Cookies are small data files that are placed on your computer or mobile device when you visit
            a website. Cookies are widely used by website owners to make their websites work more efficiently.
          </p>
          <h2 className="mt-8 text-2xl font-bold text-brand-900">Types of Cookies We Use</h2>
          <p className="mt-4 text-brand-600">
            <strong>Necessary:</strong> Cookies required to enable core website functionality and security.<br />
            <strong>Analytics:</strong> Cookies that help us understand how this website performs.<br />
            <strong>Marketing:</strong> Cookies used to deliver advertising relevant to your interests.
          </p>
        </article>
      </Container>
    </Section>
  )
}
