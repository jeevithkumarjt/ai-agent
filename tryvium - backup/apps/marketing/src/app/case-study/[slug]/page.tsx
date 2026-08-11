import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Container, Section, Badge } from '@tryvium/ui'
import { ArrowLeft } from 'lucide-react'
import { getMdxBySlug, getMdxList } from '@/lib/mdx'

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  const studies = getMdxList('case-studies')
  return studies.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const study = getMdxBySlug('case-studies', params.slug)
  if (!study) return {}

  return {
    title: `${study.frontmatter.title} | Tryvium Case Study`,
    description: study.frontmatter.description,
    alternates: { canonical: `https://www.tryvium.ai/case-study/${study.slug}/` },
  }
}

export default function CaseStudyPage({ params }: Props) {
  const study = getMdxBySlug('case-studies', params.slug)
  if (!study) notFound()

  return (
    <Section background="white" className="py-24">
      <Container>
        <article className="mx-auto max-w-3xl">
          <Link href="/case-study/" className="mb-8 flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-500">
            <ArrowLeft className="h-4 w-4" /> Back to Case Studies
          </Link>
          <Badge className="mb-4">Case Study</Badge>
          <h1 className="text-4xl font-bold text-brand-900">{study.frontmatter.title}</h1>
          <div className="mt-8 prose prose-brand max-w-none">
            {study.content.split('\n').map((paragraph, i) => {
              if (paragraph.startsWith('## ')) {
                return <h2 key={i} className="mt-8 text-2xl font-bold text-brand-900">{paragraph.replace('## ', '')}</h2>
              }
              if (paragraph.startsWith('### ')) {
                return <h3 key={i} className="mt-6 text-xl font-semibold text-brand-900">{paragraph.replace('### ', '')}</h3>
              }
              if (paragraph.trim() === '') return <div key={i} className="h-4" />
              return <p key={i} className="mt-4 text-base leading-relaxed text-brand-700">{paragraph}</p>
            })}
          </div>
        </article>
      </Container>
    </Section>
  )
}
