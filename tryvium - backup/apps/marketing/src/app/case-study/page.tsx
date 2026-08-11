import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, Section, Button, Badge, Card, CardContent } from '@tryvium/ui'
import { ArrowRight, FileText, BarChart3 } from 'lucide-react'
import { getMdxList } from '@/lib/mdx'

export const metadata: Metadata = {
  title: 'Case Studies | Tryvium',
  description: 'See how leading enterprises transform service operations with Tryvium\'s AI orchestration platform.',
  alternates: { canonical: 'https://www.tryvium.ai/case-study/' },
}

export default function CaseStudiesIndexPage() {
  const studies = getMdxList('case-studies')

  return (
    <>
      <Section background="gray" className="pt-20 pb-32">
        <Container className="text-center">
          <Badge className="mb-4">Case Studies</Badge>
          <h1 className="text-5xl font-extrabold text-brand-900">Proof that better experiences deliver better business outcomes.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-600">See how leading enterprises transform service operations with Tryvium&apos;s AI orchestration platform.</p>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <div className="grid gap-8 md:grid-cols-3">
            {studies.map((s) => (
              <Link key={s.slug} href={`/case-study/${s.slug}/`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="pt-8">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                      <BarChart3 className="h-6 w-6" />
                    </div>
                    <h2 className="text-lg font-semibold text-brand-900">{s.frontmatter.title}</h2>
                    <p className="mt-3 text-sm text-brand-600">{s.frontmatter.description}</p>
                    <div className="mt-4 flex items-center text-sm font-medium text-brand-600">
                      Read case study <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      </Section>
    </>
  )
}
