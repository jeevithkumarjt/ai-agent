import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, Section, Button, Badge, Card, CardContent } from '@tryvium/ui'
import { Briefcase, MapPin, Clock, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Careers | Tryvium',
  description: 'Join Tryvium to build intelligent AI solutions and transform your career.',
  alternates: { canonical: 'https://www.tryvium.ai/careers/' },
}

const positions = [
  { title: 'Senior Software Engineer', dept: 'Engineering', location: 'Remote US', type: 'Full-time' },
  { title: 'Product Manager', dept: 'Product', location: 'New Jersey', type: 'Full-time' },
  { title: 'Solutions Architect', dept: 'Customer Success', location: 'Remote US', type: 'Full-time' },
]

export default function CareersPage() {
  return (
    <>
      <Section background="gray" className="pt-20 pb-32">
        <Container className="text-center">
          <Badge className="mb-4">Careers</Badge>
          <h1 className="text-5xl font-extrabold text-brand-900">Shape Your Future. Orchestrate What&apos;s Next.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-600">Join Tryvium to build intelligent AI solutions and transform your career.</p>
        </Container>
      </Section>
      <Section background="white">
        <Container>
          <h2 className="mb-8 text-2xl font-bold text-brand-900">Open Positions</h2>
          <div className="space-y-4">
            {positions.map((p) => (
              <Card key={p.title} className="transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col items-start justify-between gap-4 pt-6 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-brand-900">{p.title}</h3>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-brand-500">
                      <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> {p.dept}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {p.location}</span>
                      <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {p.type}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Apply <ArrowRight className="ml-1 h-4 w-4" /></Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>
    </>
  )
}
