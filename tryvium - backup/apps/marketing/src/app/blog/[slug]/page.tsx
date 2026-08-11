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
  const posts = getMdxList('blog')
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getMdxBySlug('blog', params.slug)
  if (!post) return {}

  return {
    title: `${post.frontmatter.title} | Tryvium`,
    description: post.frontmatter.description,
    openGraph: {
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      ...(post.frontmatter.ogImage && { images: [{ url: post.frontmatter.ogImage }] }),
    },
    alternates: { canonical: `https://www.tryvium.ai/blog/${post.slug}/` },
  }
}

export default function BlogPostPage({ params }: Props) {
  const post = getMdxBySlug('blog', params.slug)
  if (!post) notFound()

  return (
    <Section background="white" className="py-24">
      <Container>
        <article className="mx-auto max-w-3xl">
          <Link href="/blog/" className="mb-8 flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-500">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>
          <Badge className="mb-4">Article</Badge>
          <h1 className="text-4xl font-bold text-brand-900">{post.frontmatter.title}</h1>
          <div className="mt-4 text-sm text-brand-500">
            {new Date(post.frontmatter.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            {post.frontmatter.author && ` · ${post.frontmatter.author}`}
          </div>
          <div className="mt-8 prose prose-brand max-w-none">
            {post.content.split('\n').map((paragraph, i) => {
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
