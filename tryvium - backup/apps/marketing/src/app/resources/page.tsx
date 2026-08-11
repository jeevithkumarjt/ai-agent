import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, Section, Badge, Card, CardContent } from '@tryvium/ui'
import { BookOpen, FileText, ArrowRight } from 'lucide-react'
import { getMdxList } from '@/lib/mdx'

export const metadata: Metadata = {
  title: 'Our Resources | Tryvium',
  description: 'Access blogs, guides, case studies, whitepapers, and videos on customer experience, customer and employee service automation, and AI-powered operations.',
  alternates: { canonical: 'https://www.tryvium.ai/resources/' },
}

export default function ResourcesPage() {
  const blogs = getMdxList('blog')
  const studies = getMdxList('case-studies')

  return (
    <>
      <Section background="gray" className="pt-20 pb-32">
        <Container className="text-center">
          <Badge className="mb-4">Resources</Badge>
          <h1 className="text-5xl font-extrabold text-brand-900">The knowledge hub for AI agent orchestration</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-600">
            Access blogs, guides, case studies, whitepapers, and videos on customer experience,
            customer and employee service automation, and AI-powered operations.
          </p>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <h2 className="mb-8 text-3xl font-bold text-brand-900">Latest Articles</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {blogs.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}/`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="pt-8">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <Badge className="mb-3">Blog</Badge>
                    <h3 className="text-lg font-semibold text-brand-900">{post.frontmatter.title}</h3>
                    <p className="mt-2 text-sm text-brand-500">{new Date(post.frontmatter.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <div className="mt-4 flex items-center text-sm font-medium text-brand-600">
                      Read more <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <h2 className="mb-8 mt-16 text-3xl font-bold text-brand-900">Case Studies</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {studies.map((s) => (
              <Link key={s.slug} href={`/case-study/${s.slug}/`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="pt-8">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                      <FileText className="h-6 w-6" />
                    </div>
                    <Badge className="mb-3" variant="secondary">Case Study</Badge>
                    <h3 className="text-lg font-semibold text-brand-900">{s.frontmatter.title}</h3>
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
