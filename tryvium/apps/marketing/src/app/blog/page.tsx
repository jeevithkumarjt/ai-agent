import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, Section, Button, Badge, Card, CardContent } from '@tryvium/ui'
import { ArrowRight, Calendar, Clock } from 'lucide-react'
import { getMdxList } from '@/lib/mdx'

export const metadata: Metadata = {
  title: 'Blog Archive | Tryvium',
  description: 'Explore insights on AI orchestration, customer experience, and enterprise automation from Tryvium.',
  alternates: { canonical: 'https://www.tryvium.ai/blog/' },
}

export default function BlogIndexPage() {
  const posts = getMdxList('blog')

  return (
    <>
      <Section background="gray" className="pt-20 pb-32">
        <Container className="text-center">
          <Badge className="mb-4">Blog</Badge>
          <h1 className="text-5xl font-extrabold text-brand-900">Decoding Enterprise AI, One Story at a Time</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-600">Insights on AI orchestration, customer experience, and enterprise automation.</p>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <div className="grid gap-8 md:grid-cols-2">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}/`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="pt-8">
                    <div className="flex items-center gap-4 text-sm text-brand-500">
                      <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {new Date(post.frontmatter.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <h2 className="mt-4 text-xl font-semibold text-brand-900">{post.frontmatter.title}</h2>
                    <p className="mt-3 text-sm leading-relaxed text-brand-600">{post.frontmatter.description}</p>
                    <div className="mt-4 flex items-center text-sm font-medium text-brand-600">
                      Read more <ArrowRight className="ml-1 h-4 w-4" />
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
