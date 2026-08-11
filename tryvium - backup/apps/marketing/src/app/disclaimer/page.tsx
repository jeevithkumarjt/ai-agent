import type { Metadata } from 'next'
import { Container, Section, Badge } from '@tryvium/ui'

export const metadata: Metadata = {
  title: 'Disclaimer | Tryvium',
  robots: { index: false, follow: false },
}

export default function DisclaimerPage() {
  return (
    <Section background="gray" className="py-24">
      <Container>
        <article className="prose prose-brand mx-auto max-w-3xl">
          <Badge className="mb-4">Legal</Badge>
          <h1 className="text-4xl font-bold text-brand-900">Disclaimer</h1>
          <p className="mt-6 text-brand-600">
            The information provided on the Tryvium website is for general informational purposes only.
            All information on the site is provided in good faith, however we make no representation or
            warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability,
            availability, or completeness of any information on the site.
          </p>
          <h2 className="mt-8 text-2xl font-bold text-brand-900">External Links Disclaimer</h2>
          <p className="mt-4 text-brand-600">
            The Site may contain links to other websites or content belonging to or originating from third
            parties or links to websites and features in banners or other advertising. Such external links
            are not investigated, monitored, or checked for accuracy, adequacy, validity, reliability,
            availability, or completeness by us.
          </p>
        </article>
      </Container>
    </Section>
  )
}
