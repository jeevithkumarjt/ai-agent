import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Container, Section, Button, Badge, Card, CardContent, IconBox } from '@tryvium/ui'
import { Bot, Users, Shield, Workflow, ArrowRight, CheckCircle, HeadphonesIcon, MessageSquare, Zap, GitBranch, Search, Lock, Eye, BarChart3, Layers, Settings, Repeat, Activity, TrendingDown } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Tryvium for GCP | AI Agent Orchestration for Google Cloud',
  description: 'Reimagine employee and customer support with AI agent orchestration for Google cloud. Accelerate service delivery with enterprise-grade scalability and intelligence.',
  openGraph: {
    title: 'Tryvium for GCP | AI Agent Orchestration for Google Cloud',
    description: 'Reimagine employee and customer support with AI agent orchestration for Google cloud. Accelerate service delivery with enterprise-grade scalability and intelligence.',
    url: 'https://www.tryvium.ai/solution/tryvium-for-gcp/',
  },
  alternates: { canonical: 'https://www.tryvium.ai/solution/tryvium-for-gcp/' },
}

const comparisonOld = [
  'Bot → Queue → Agent',
  'Disconnected business systems',
  'Human-dependent task completion',
  'Fragmented experiences',
  'Limited visibility',
  'Rule-based responses',
]

const comparisonNew = [
  'AI Agent → Orchestrate → Resolve',
  'Enterprise-wide orchestration',
  'Autonomous execution with human governance',
  'Seamless customer and employee experiences',
  'End-to-end operational insights',
  'Context-aware decision making',
]

const employeeServices = [
  { icon: Zap, title: 'Intelligent IT Support', desc: 'Automate password resets, access requests, software provisioning, and common IT support inquiries.' },
  { icon: Users, title: 'HR Service Automation', desc: 'Provide instant assistance for policies, benefits, onboarding, payroll, and employee-related requests.' },
  { icon: Search, title: 'Enterprise Knowledge Access', desc: 'Deliver contextual answers from knowledge bases, documentation, and enterprise systems.' },
  { icon: GitBranch, title: 'Request & Approval Orchestration', desc: 'Automate request routing, approvals, fulfillment processes, and status updates across departments.' },
  { icon: MessageSquare, title: 'Employee Productivity Assistance', desc: 'Help employees complete tasks, find information, and navigate enterprise systems through conversational AI.' },
]

const customerServices = [
  { icon: MessageSquare, title: 'Customer Inquiry Resolution', desc: 'Answer product, service, billing, account, and policy-related questions with accurate, contextual responses.' },
  { icon: Settings, title: 'Order & Account Management', desc: 'Help customers manage orders, subscriptions, appointments, account updates, and service requests without agent intervention.' },
  { icon: Activity, title: 'Case & Issue Resolution', desc: 'Resolve customer issues by executing actions, orchestrating workflows, and coordinating enterprise systems.' },
  { icon: Repeat, title: 'Omnichannel Customer Support', desc: 'Provide seamless support across voice, chat, email, messaging, and digital channels while maintaining context throughout the journey.' },
  { icon: Bot, title: 'Self-Service Automation', desc: 'Enable customers to complete transactions, submit requests, and resolve common issues without agent intervention.' },
]

const customerSolutions = [
  { icon: Bot, title: 'AI Agent-Orchestrated Customer Engagement', desc: 'Deliver seamless customer experiences through AI-powered engagement, intelligent automation, and continuous service orchestration.' },
  { icon: Zap, title: 'Intelligent Case Resolution', desc: 'Accelerate issue resolution through AI-guided workflows and recommendations.' },
  { icon: MessageSquare, title: 'Omnichannel Experience Management', desc: 'Support customers across voice, chat, email, SMS, and digital channels.' },
  { icon: Users, title: 'Self-Service Automation', desc: 'Provide personalized assistance and automate routine customer inquiries.' },
  { icon: GitBranch, title: 'Agent Assist & Collaboration', desc: 'Equip agents with real-time recommendations, next-best actions, and contextual guidance.' },
]

const problems = [
  { title: 'Customers repeat themselves every time they switch channels', desc: 'Tryvium maintains a single conversation thread across voice, chat, email, and messaging. Powered by Google\'s data infrastructure, the autonomous agent sees the full history before the first word is exchanged. No repetition. No frustration.' },
  { title: 'High query volumes mean long wait times and dropped resolutions', desc: 'Tryvium\'s AI agents handle high-frequency customer requests end to end, eliminating queues. Resolution times remain consistent even during peak demand, ensuring customers get the support they need without delays.' },
  { title: 'High volumes of routine queries limit CX teams capacity', desc: 'Routine customer queries are resolved autonomously handled by AI agents, allowing human agents to focus on interactions that require human expertise, judgment, and empathy.' },
  { title: 'Employees lose hours waiting on routine IT and HR requests', desc: 'From password resets to leave approvals, routine employee requests are completed in seconds as autonomous AI agents resolve requests, execute actions, and orchestrate approvals across enterprise systems in real time.' },
  { title: 'IT and HR teams are buried in repetitive requests', desc: 'Tryvium\'s AI agents absorb the repetitive request load, answering policy questions, triggering approvals, and surfacing knowledge, so IT and HR teams can shift their focus to work that drives the business forward.' },
]

const securityFeatures = [
  { icon: Shield, title: 'Data residency controls', desc: 'Choose where your data lives. Region-specific deployments on Google Cloud.' },
  { icon: Shield, title: 'SOC 2 Type II & ISO 27001', desc: 'Adherence to industry-compliant standards.' },
  { icon: Lock, title: 'RBAC & SSO', desc: 'Granular access control with SAML 2.0 and OAuth 2.0 support.' },
  { icon: Lock, title: 'Encryption at rest & in transit', desc: 'AES-256 at rest. TLS 1.2+ in transit. Credentials managed with GCP Secret Manager.' },
  { icon: Eye, title: 'Full audit logs', desc: 'Every action logged and exportable to your SIEM of choice.' },
]

const integrationLogos = [
  { src: 'https://www.tryvium.ai/wp-content/uploads/2026/06/salesforce-logo.png', alt: 'Salesforce' },
  { src: 'https://www.tryvium.ai/wp-content/uploads/2026/06/oracle-logo.png', alt: 'Oracle' },
  { src: 'https://www.tryvium.ai/wp-content/uploads/2026/06/atlassian-Logo.png', alt: 'Atlassian' },
  { src: 'https://www.tryvium.ai/wp-content/uploads/2026/06/zendesk.png', alt: 'Zendesk' },
  { src: 'https://www.tryvium.ai/wp-content/uploads/2026/06/service-now-logo.png', alt: 'ServiceNow' },
  { src: 'https://www.tryvium.ai/wp-content/uploads/2026/06/SAP-logo-1.png', alt: 'SAP' },
]

export default function TryviumForGCPPage() {
  return (
    <>
      <Section background="gray" className="pt-20 pb-32">
        <Container className="text-center">
          <Badge className="mb-4">Tryvium for GCP</Badge>
          <h1 className="text-5xl font-extrabold text-brand-900">AI agent-orchestrated service operations <span className="text-brand-600">on Google Cloud Platform</span></h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-brand-600">
            Tryvium brings autonomous AI agents to your enterprise. Combined with GCP services, it enables faster deployment, greater scalability, and more intelligent customer and employee experiences.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/schedule-a-demo/"><Button size="xl">Schedule a Demo</Button></Link>
            <Link href="/platform/experience-orchestration-platform/"><Button size="xl" variant="outline">Explore Tryvium</Button></Link>
          </div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <h2 className="mb-12 text-center text-3xl font-bold text-brand-900">How Tryvium for GCP enables autonomous AI agents for your enterprise</h2>
          <p className="mx-auto mb-12 max-w-3xl text-center text-brand-600">
            Traditional service platforms were built around human-led interactions. Tryvium combines autonomous AI agents with GCP to orchestrate interactions, automate workflows, and streamline enterprise operations through a unified experience orchestration platform.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardContent className="pt-8">
                <h3 className="mb-4 text-lg font-semibold text-red-600">Traditional Service Model</h3>
                <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-500">Automation-escalation</p>
                <ul className="space-y-2">
                  {comparisonOld.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-brand-600">
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="border-brand-500">
              <CardContent className="pt-8">
                <h3 className="mb-4 text-lg font-semibold text-green-600">Autonomous AI Agent Orchestration</h3>
                <ul className="space-y-2">
                  {comparisonNew.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-brand-600">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
          <div className="mt-10 text-center">
            <Link href="/schedule-a-demo/"><Button size="xl">Book a Demo</Button></Link>
          </div>
        </Container>
      </Section>

      <Section background="gray">
        <Container>
          <h2 className="mb-4 text-center text-3xl font-bold text-brand-900">One platform. Two autonomous desks built for your enterprise.</h2>
          <p className="mx-auto mb-12 max-w-3xl text-center text-brand-600">
            Whether the priority is empowering your workforce or improving your customer experience, Tryvium has a purpose-built offering, both supercharged by Google Cloud Platform.
          </p>
          <div className="mb-16">
            <h3 className="mb-8 text-center text-2xl font-bold text-brand-900">Employee Help Desk</h3>
            <div className="grid gap-6 md:grid-cols-5">
              {employeeServices.map((s) => (
                <IconBox key={s.title} icon={<s.icon className="h-6 w-6" />} title={s.title} description={s.desc} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-8 text-center text-2xl font-bold text-brand-900">Customer Service Desk</h3>
            <div className="grid gap-6 md:grid-cols-5">
              {customerServices.map((s) => (
                <IconBox key={s.title} icon={<s.icon className="h-6 w-6" />} title={s.title} description={s.desc} />
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <h2 className="mb-12 text-center text-3xl font-bold text-brand-900">AI-Agent Orchestrated Service Solutions</h2>
          <div className="grid gap-6 md:grid-cols-5">
            {customerSolutions.map((s) => (
              <IconBox key={s.title} icon={<s.icon className="h-6 w-6" />} title={s.title} description={s.desc} />
            ))}
          </div>
        </Container>
      </Section>

      <Section background="gray">
        <Container>
          <h2 className="mb-12 text-center text-3xl font-bold text-brand-900">The enterprise problems Tryvium on GCP is built to solve</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {problems.map((p) => (
              <Card key={p.title}>
                <CardContent className="pt-6">
                  <h4 className="mb-2 font-semibold text-brand-900">{p.title}</h4>
                  <p className="text-sm text-brand-600">{p.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <h2 className="mb-12 text-center text-3xl font-bold text-brand-900">Driving better outcomes across CX and EX</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <Card>
              <CardContent className="pt-8 text-center">
                <h3 className="mb-2 text-4xl font-extrabold text-brand-600">Operational Efficiency</h3>
                <p className="text-5xl font-extrabold text-brand-900">60%</p>
                <p className="mt-1 text-sm text-brand-600">lower Average Handle Time</p>
                <p className="text-5xl font-extrabold text-brand-900">2.5x</p>
                <p className="mt-1 text-sm text-brand-600">more interactions handled per agent</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-8 text-center">
                <h3 className="mb-2 text-4xl font-extrabold text-brand-600">Customer Experience</h3>
                <p className="text-5xl font-extrabold text-brand-900">85%+</p>
                <p className="mt-1 text-sm text-brand-600">First Contact Resolution</p>
                <p className="text-5xl font-extrabold text-brand-900">40%</p>
                <p className="mt-1 text-sm text-brand-600">higher resolution rates</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-8 text-center">
                <h3 className="mb-2 text-4xl font-extrabold text-brand-600">Employee Experience</h3>
                <p className="text-5xl font-extrabold text-brand-900">70%</p>
                <p className="mt-1 text-sm text-brand-600">ticket deflection through AI-led self-service</p>
                <p className="text-5xl font-extrabold text-brand-900">3x</p>
                <p className="mt-1 text-sm text-brand-600">more requests resolved autonomously</p>
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>

      <Section background="gray">
        <Container>
          <h2 className="mb-12 text-center text-3xl font-bold text-brand-900">Seamlessly integrates with enterprise applications</h2>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {integrationLogos.map((l) => (
              <Image key={l.alt} src={l.src} alt={l.alt} width={120} height={40} className="h-8 w-auto object-contain opacity-60 grayscale" />
            ))}
          </div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <h2 className="mb-12 text-center text-3xl font-bold text-brand-900">Built for enterprises that can&apos;t afford to compromise</h2>
          <p className="mx-auto mb-12 max-w-3xl text-center text-brand-600">
            Tryvium on GCP inherits a security model built for the most demanding enterprise environments, so your security and compliance teams have one less thing to worry about.
          </p>
          <div className="grid gap-6 md:grid-cols-5">
            {securityFeatures.map((f) => (
              <IconBox key={f.title} icon={<f.icon className="h-6 w-6" />} title={f.title} description={f.desc} />
            ))}
          </div>
        </Container>
      </Section>

      <Section background="brand" className="text-center">
        <Container>
          <h2 className="text-4xl font-bold text-brand-900">See what Tryvium&apos;s autonomous AI agents can do for your enterprise</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-brand-700">
            Tell us about your use case and we&apos;ll show you exactly how Tryvium + GCP fits into your environment, no generic demos.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="/schedule-a-demo/"><Button size="xl">Schedule a Demo</Button></Link>
            <Link href="/contact-us/"><Button size="xl" variant="outline">Talk to an Expert</Button></Link>
          </div>
        </Container>
      </Section>
    </>
  )
}
