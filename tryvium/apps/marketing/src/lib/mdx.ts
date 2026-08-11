import fs from 'fs'
import path from 'path'

export interface Frontmatter {
  title: string
  description: string
  date: string
  author?: string
  ogImage?: string
  slug: string
}

export interface MdxPost {
  frontmatter: Frontmatter
  content: string
  slug: string
}

const contentDir = path.join(process.cwd(), 'src', 'content')

export function getMdxList(type: 'blog' | 'case-studies'): MdxPost[] {
  const dir = path.join(contentDir, type)
  if (!fs.existsSync(dir)) return []

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.mdx'))

  return files.map((file) => {
    const raw = fs.readFileSync(path.join(dir, file), 'utf-8')
    const { frontmatter, content } = parseMdx(raw)
    return { frontmatter, content, slug: frontmatter.slug }
  }).sort((a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime())
}

export function getMdxBySlug(type: 'blog' | 'case-studies', slug: string): MdxPost | null {
  const posts = getMdxList(type)
  return posts.find(p => p.slug === slug) || null
}

function parseMdx(raw: string): { frontmatter: Frontmatter; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) throw new Error('Invalid MDX: no frontmatter found')

  const frontmatterRaw = match[1]!
  const content = match[2]!.trim()

  const frontmatter: Record<string, string> = {}
  frontmatterRaw.split('\n').forEach(line => {
    const sep = line.indexOf(':')
    if (sep > 0) {
      const key = line.slice(0, sep).trim()
      const val = line.slice(sep + 1).trim().replace(/^["']|["']$/g, '')
      frontmatter[key] = val
    }
  })

  return {
    frontmatter: {
      title: frontmatter['title'] || '',
      description: frontmatter['description'] || '',
      date: frontmatter['date'] || '',
      author: frontmatter['author'],
      ogImage: frontmatter['ogImage'],
      slug: frontmatter['slug'] || '',
    },
    content,
  }
}
