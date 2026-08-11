import type { Metadata } from 'next'
import { Container, Section, Button, Badge, Card, CardContent } from '@tryvium/ui'
import { Briefcase, MapPin, Clock, Upload } from 'lucide-react'

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
          <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-600">If you&apos;re passionate about innovation and AI, join Tryvium as we accelerate the transition to Autonomous AI Agents and redefine the future of enterprise AI.</p>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <h2 className="mb-2 text-2xl font-bold text-brand-900">Open Positions</h2>
          <p className="mb-8 text-sm text-brand-600">Work alongside talented professionals to build intelligent, scalable solutions that transform businesses. Explore our current opportunities.</p>

          <div className="mb-4 flex flex-wrap gap-4">
            <select className="h-10 rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option>All locations</option>
            </select>
            <select className="h-10 rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option>All teams</option>
            </select>
          </div>

          <div className="mb-16 space-y-4">
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
                  <Button variant="outline" size="sm" style={{ borderColor: '#F26E26', color: '#F26E26' }}>Apply</Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold text-brand-900">Apply for Designation</h2>
            <form className="mt-8 space-y-6" method="POST" action="/api/careers" encType="multipart/form-data">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium text-brand-900">First Name *</label>
                  <input id="firstName" name="firstName" required className="flex h-10 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm placeholder:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="First name" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium text-brand-900">Last Name *</label>
                  <input id="lastName" name="lastName" required className="flex h-10 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm placeholder:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Last name" />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-brand-900">Email *</label>
                <input id="email" name="email" type="email" required className="flex h-10 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm placeholder:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="you@company.com" />
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-brand-900">Mobile Number *</label>
                <input id="phone" name="phone" type="tel" required className="flex h-10 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm placeholder:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="+1 000 000 0000" />
              </div>
              <div className="space-y-2">
                <label htmlFor="resume" className="text-sm font-medium text-brand-900">Upload Resume (PDF, DOC, DOCX UP TO 2MB) *</label>
                <input id="resume" name="resume" type="file" accept=".pdf,.doc,.docx" required className="flex h-10 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-brand-100 file:px-3 file:py-1 file:text-sm file:font-medium file:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <Button type="submit" size="lg" className="w-full" style={{ backgroundColor: '#F26E26' }}><Upload className="mr-2 h-4 w-4" /> Submit</Button>
            </form>
            <p className="mt-6 text-center text-sm text-brand-500">Join our team. For any other queries, please reach out to <a href="mailto:info@tryvium.ai" className="font-medium text-brand-600 underline underline-offset-2 hover:text-brand-500">info@tryvium.ai</a></p>
          </div>
        </Container>
      </Section>
    </>
  )
}
