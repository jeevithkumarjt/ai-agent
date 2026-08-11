import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Container, Section, Button, Badge, Card, CardContent, IconBox } from '@tryvium/ui'
import { Bot, Users, Shield, Workflow, ArrowRight, CheckCircle, HeadphonesIcon, MessageSquare, Zap, GitBranch, Search, Lock, Eye, BarChart3, Layers, SlidersHorizontal, Share2, Activity, Settings } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Tryvium for Microsoft Azure | AI Agent Orchestration for Teams',
  description: 'Enhance enterprise service operations with AI agent orchestration for Teams. Accelerate deployment with intelligent workflows and native integrations.',
  openGraph: {
    title: 'Tryvium for Microsoft Azure | AI Agent Orchestration for Teams',
    description: 'Enhance enterprise service operations with AI agent orchestration for Teams. Accelerate deployment with intelligent workflows and native integrations.',
    url: 'https://www.tryvium.ai/solution/tryvium-for-azure/',
  },
  alternates: { canonical: 'https://www.tryvium.ai/solution/tryvium-for-azure/' },
}

const trustLogos = [
  { src: 'https://www.tryvium.ai/wp-content/uploads/2026/05/intrado.webp', alt: 'intrado' },
  { src: 'https://www.tryvium.ai/wp-content/uploads/2026/05/hawlett-packard.webp', alt: 'hawlett-packard' },
  { src: 'https://www.tryvium.ai/wp-content/uploads/2026/05/neles.webp', alt: 'neles' },
  { src: 'https://www.tryvium.ai/wp-content/uploads/2026/05/mitie.webp', alt: 'mitie' },
  { src: 'https://www.tryvium.ai/wp-content/uploads/2026/05/securities-america.webp', alt: 'securities-america' },
]

const whyChooseBullets = [
  { icon: Bot, title: 'AI-led Orchestration on Microsoft Teams', desc: 'Familiar user experience with enterprise-wide adoption' },
  { icon: Workflow, title: 'Real-time coordination', desc: 'Across your existing systems, workflows, and interactions' },
  { icon: Shield, title: 'Enterprise-grade governance', desc: 'And operational visibility with AI-led execution and human oversight' },
  { icon: Users, title: 'Faster adoption', desc: 'Without changing employee behaviour, with intelligent agent handover' },
]

const comparisonOld = [
  'Automation → Escalation',
  'Bot → Queue → Agent',
  'Reactive service delivery',
  'Multiple disconnected tools',
  'Manual workflow coordination',
  'Limited visibility',
  'Human agents as bottlenecks',
  'Ticket-focused operations',
]

const comparisonNew = [
  'AI Agent Orchestration',
  'AI Agent → Orchestrate → Resolve',
  'Intelligent service execution',
  'Unified orchestration layer',
  'Automated workflow execution',
  'End-to-end operational insights',
  'Human governance engaged when needed',
  'Outcome-driven experiences',
]

const employeeServices = [
  { icon: Zap, title: 'Intelligent IT Support', desc: 'Automate password resets, access requests, software provisioning, and common technical inquiries.' },
  { icon: Users, title: 'HR Service Automation', desc: 'Enable employees to receive instant support for HR policies, benefits, onboarding, and payroll questions.' },
  { icon: Search, title: 'Knowledge Discovery', desc: 'Deliver contextual answers from enterprise knowledge bases and internal systems.' },
  { icon: MessageSquare, title: 'Employee Request Management', desc: 'Enable conversational support across voice, chat, and digital channels.' },
  { icon: GitBranch, title: 'Workplace Productivity Assistance', desc: 'Automatically route requests to the right team, workflow, or subject matter expert.' },
]

const employeeHelpdeskFeatures = [
  { title: 'Automate HR, IT, and internal support operations', desc: 'Streamline routine employee requests and service workflows through AI-led automation.' },
  { title: 'Coordinate AI agents and human support teams', desc: 'Intelligently route requests between AI agents and support teams for efficient resolution.' },
  { title: 'Maintain persistent interaction context', desc: 'Preserve conversation history and employee information across every interaction.' },
  { title: 'Reduce routing complexity and escalations', desc: 'Automatically direct requests to the right resource without manual intervention.' },
  { title: 'Deliver faster internal support experiences', desc: 'Improve response times and resolution speed across employee support functions.' },
]

const customerServiceFeatures = [
  { title: 'Omnichannel customer engagement', desc: 'Deliver consistent customer experiences across voice, chat, email, and digital channels.' },
  { title: 'AI-led interactions with human governance', desc: 'Enable AI agents to handle routine inquiries while maintaining human oversight when needed.' },
  { title: 'Continuous customer context across channels', desc: 'Maintain a unified view of customer interactions across every touchpoint.' },
  { title: 'Workflow-driven resolution acceleration', desc: 'Automate processes and approvals to reduce resolution times and improve service efficiency.' },
  { title: 'End-to-end customer journeys', desc: 'Connect interactions, workflows, and systems to deliver seamless customer experiences from start to resolution.' },
]

const orchestratedItems = [
  { icon: Layers, title: 'Unified Experience Orchestration', desc: 'Coordinate AI agents, human agents, workflows, and enterprise applications through a single orchestration layer that eliminates operational silos.' },
  { icon: Share2, title: 'Connected Workflows & Systems', desc: 'Unify fragmented processes by connecting interactions, workflows, automation, approvals, and enterprise applications in real time.' },
  { icon: Bot, title: 'AI-Led Service Execution', desc: 'Enable AI agents to automate routine tasks, accelerate resolution, and seamlessly engage human experts when required.' },
  { icon: Activity, title: 'Persistent Context Across Every Interaction', desc: 'Maintain conversation, workflow, and operational context across every employee and customer interaction.' },
  { icon: Shield, title: 'Scalable Operations with Governance', desc: 'Scale AI-led service operations with enterprise-grade governance, visibility, compliance, and human oversight.' },
]

const customerSolutions = [
  { icon: Bot, title: 'AI Agent-Orchestrated Customer Engagement', desc: 'Deliver seamless customer experiences through AI-powered engagement, intelligent automation, and continuous service orchestration.' },
  { icon: Zap, title: 'Intelligent Case Resolution', desc: 'Accelerate issue resolution through AI-guided workflows and recommendations.' },
  { icon: MessageSquare, title: 'Omnichannel Experience Management', desc: 'Support customers across voice, chat, email, SMS, and digital channels.' },
  { icon: Users, title: 'Self-Service Automation', desc: 'Provide personalized assistance and automate routine customer inquiries.' },
  { icon: GitBranch, title: 'Agent Assist & Collaboration', desc: 'Equip agents with real-time recommendations, next-best actions, and contextual guidance.' },
]

const employeeServiceItems = [
  { iconN: 'https://www.tryvium.ai/wp-content/uploads/2026/06/ai-powered-img-N1.svg', iconO: 'https://www.tryvium.ai/wp-content/uploads/2026/06/ai-powered-img-o1.svg', title: 'Automated Password Reset', desc: 'Instantly resolve password and account access issues without manual intervention.' },
  { iconN: 'https://www.tryvium.ai/wp-content/uploads/2026/06/ai-powered-img-N2.svg', iconO: 'https://www.tryvium.ai/wp-content/uploads/2026/06/ai-powered-img-O2.svg', title: 'Software Access Provisioning', desc: 'Automate application access requests, approvals, and user onboarding workflows.' },
  { iconN: 'https://www.tryvium.ai/wp-content/uploads/2026/06/ai-powered-img-N3.svg', iconO: 'https://www.tryvium.ai/wp-content/uploads/2026/06/ai-powered-img-O3.svg', title: 'Ticket Classification', desc: 'Automatically categorize, prioritize, and route tickets to appropriate teams.' },
  { iconN: 'https://www.tryvium.ai/wp-content/uploads/2026/06/ai-powered-img-N4.svg', iconO: 'https://www.tryvium.ai/wp-content/uploads/2026/06/ai-powered-img-O4.svg', title: 'Knowledge Recommendations', desc: 'Deliver relevant knowledge articles and solutions based on employee queries.' },
  { iconN: 'https://www.tryvium.ai/wp-content/uploads/2026/06/ai-powered-img-N5.svg', iconO: 'https://www.tryvium.ai/wp-content/uploads/2026/06/ai-powered-img-O5.svg', title: 'Intelligent Escalation', desc: 'Route complex requests to the right experts with complete context.' },
  { iconN: 'https://www.tryvium.ai/wp-content/uploads/2026/06/ai-powered-img-N6.svg', iconO: 'https://www.tryvium.ai/wp-content/uploads/2026/06/ai-powered-img-O6.svg', title: 'SLA Monitoring', desc: 'Track service performance and ensure compliance with agreed SLA targets.' },
]

const customerEngagementItems = [
  { iconN: 'https://www.tryvium.ai/wp-content/uploads/2026/06/conversational-ai-support-normal.svg', iconO: 'https://www.tryvium.ai/wp-content/uploads/2026/06/customer-service-o1.svg', title: 'Conversational AI Support', desc: 'Provide instant, personalized assistance across voice and digital channels.' },
  { iconN: 'https://www.tryvium.ai/wp-content/uploads/2026/06/automated-request-handling-normal.svg', iconO: 'https://www.tryvium.ai/wp-content/uploads/2026/06/customer-service-o2.svg', title: 'Automated Request Handling', desc: 'Resolve routine customer inquiries without requiring agent intervention.' },
  { iconN: 'https://www.tryvium.ai/wp-content/uploads/2026/06/real-time-agent-assist-normal.svg', iconO: 'https://www.tryvium.ai/wp-content/uploads/2026/06/customer-service-o3.svg', title: 'Real-Time Agent Assist', desc: 'Equip agents with recommendations and insights during live interactions.' },
  { iconN: 'https://www.tryvium.ai/wp-content/uploads/2026/06/omnichannel-context-management-normal.svg', iconO: 'https://www.tryvium.ai/wp-content/uploads/2026/06/customer-service-o4.svg', title: 'Omnichannel Context Management', desc: 'Maintain customer context seamlessly across channels and conversations.' },
  { iconN: 'https://www.tryvium.ai/wp-content/uploads/2026/06/smart-routing-normal.svg', iconO: 'https://www.tryvium.ai/wp-content/uploads/2026/06/customer-service-o5.svg', title: 'Smart Routing', desc: 'Direct customer requests to the most suitable resource instantly.' },
  { iconN: 'https://www.tryvium.ai/wp-content/uploads/2026/06/proactive-customer-updates-normal.svg', iconO: 'https://www.tryvium.ai/wp-content/uploads/2026/06/customer-service-o6.svg', title: 'Proactive Customer Updates', desc: 'Keep customers informed with timely notifications and status updates.' },
]

const orchestrationItems = [
  { iconN: 'https://www.tryvium.ai/wp-content/uploads/2026/06/persistent-customer-context-normal.svg', iconO: 'https://www.tryvium.ai/wp-content/uploads/2026/06/persistent-customer-context-hover.svg', title: 'Persistent Customer Context', desc: 'Maintain customer information and conversation history across every interaction.' },
  { iconN: 'https://www.tryvium.ai/wp-content/uploads/2026/06/unified-interaction-history-normal.svg', iconO: 'https://www.tryvium.ai/wp-content/uploads/2026/06/unified-interaction-history-hover.svg', title: 'Unified Interaction History', desc: 'Provide a complete view of customer engagement across all channels.' },
  { iconN: 'https://www.tryvium.ai/wp-content/uploads/2026/06/workflow-coordination-normal.svg', iconO: 'https://www.tryvium.ai/wp-content/uploads/2026/06/workflow-coordination-hover.svg', title: 'Workflow Coordination', desc: 'Orchestrate tasks, approvals, and processes across multiple business functions.' },
  { iconN: 'https://www.tryvium.ai/wp-content/uploads/2026/06/cross-system-integration-normal.svg', iconO: 'https://www.tryvium.ai/wp-content/uploads/2026/06/cross-system-integration-hover.svg', title: 'Cross-System Integration', desc: 'Connect enterprise applications to eliminate information silos and delays.' },
  { iconN: 'https://www.tryvium.ai/wp-content/uploads/2026/06/channel-continuity-normal.svg', iconO: 'https://www.tryvium.ai/wp-content/uploads/2026/06/channel-continuity-hover.svg', title: 'Channel Continuity', desc: 'Enable seamless transitions between voice, chat, email, and self-service.' },
  { iconN: 'https://www.tryvium.ai/wp-content/uploads/2026/06/centralized-service-visibility-normal.svg', iconO: 'https://www.tryvium.ai/wp-content/uploads/2026/06/centralized-service-visibility-hover.svg', title: 'Centralized Service Visibility', desc: 'Gain real-time visibility into service performance and customer journeys.' },
]

const automationItems = [
  { iconN: 'https://www.tryvium.ai/wp-content/uploads/2026/06/workflow-automation-normal.svg', iconO: 'https://www.tryvium.ai/wp-content/uploads/2026/06/workflow-automation-hover.svg', title: 'Workflow Automation', desc: 'Automate repetitive tasks to accelerate service delivery and execution.' },
  { iconN: 'https://www.tryvium.ai/wp-content/uploads/2026/06/ai-case-deflection-normal.svg', iconO: 'https://www.tryvium.ai/wp-content/uploads/2026/06/ai-case-deflection-hover.svg', title: 'AI Case Deflection', desc: 'Resolve common requests through AI before agent involvement is needed.' },
  { iconN: 'https://www.tryvium.ai/wp-content/uploads/2026/06/workforce-optimization-normal.svg', iconO: 'https://www.tryvium.ai/wp-content/uploads/2026/06/workforce-optimization-hover.svg', title: 'Workforce Optimization', desc: 'Improve resource planning and productivity across service operations teams.' },
  { iconN: 'https://www.tryvium.ai/wp-content/uploads/2026/06/resource-utilization-analytics-normal.svg', iconO: 'https://www.tryvium.ai/wp-content/uploads/2026/06/resource-utilization-analytics-hover.svg', title: 'Resource Utilization Analytics', desc: 'Track performance metrics to maximize operational efficiency and capacity.' },
  { iconN: 'https://www.tryvium.ai/wp-content/uploads/2026/06/intelligent-task-routing-normal.svg', iconO: 'https://www.tryvium.ai/wp-content/uploads/2026/06/intelligent-task-routing-hover.svg', title: 'Intelligent Task Routing', desc: 'Assign tasks automatically based on skills, priority, and availability.' },
  { iconN: 'https://www.tryvium.ai/wp-content/uploads/2026/06/cost-to-serve-reduction-normal.svg', iconO: 'https://www.tryvium.ai/wp-content/uploads/2026/06/cost-to-serve-reduction-hover.svg', title: 'Cost-to-Serve Reduction', desc: 'Lower support costs through automation and process optimization initiatives.' },
]

const governanceItems = [
  { iconN: 'https://www.tryvium.ai/wp-content/uploads/2026/06/human-approval-workflows-normal.svg', iconO: 'https://www.tryvium.ai/wp-content/uploads/2026/06/human-approval-workflows-hover.svg', title: 'Human Approval Workflows', desc: 'Require human review and approval for critical business decisions.' },
  { iconN: 'https://www.tryvium.ai/wp-content/uploads/2026/06/policy-enforcement-normal.svg', iconO: 'https://www.tryvium.ai/wp-content/uploads/2026/06/policy-enforcement-hover.svg', title: 'Policy Enforcement', desc: 'Ensure service operations consistently adhere to organizational policies.' },
  { iconN: 'https://www.tryvium.ai/wp-content/uploads/2026/06/audit-trails-normal.svg', iconO: 'https://www.tryvium.ai/wp-content/uploads/2026/06/audit-trails-hover.svg', title: 'Audit Trails', desc: 'Maintain detailed records of actions, decisions, and interactions.' },
  { iconN: 'https://www.tryvium.ai/wp-content/uploads/2026/06/ai-decision-transparency-normal.svg', iconO: 'https://www.tryvium.ai/wp-content/uploads/2026/06/ai-decision-transparency-hover.svg', title: 'AI Decision Transparency', desc: 'Provide visibility into AI recommendations and automated actions taken.' },
  { iconN: 'https://www.tryvium.ai/wp-content/uploads/2026/06/role-based-access-controls-normal.svg', iconO: 'https://www.tryvium.ai/wp-content/uploads/2026/06/role-based-access-controls-hover.svg', title: 'Role-Based Access Controls', desc: 'Restrict access to sensitive information based on user permissions.' },
  { iconN: 'https://www.tryvium.ai/wp-content/uploads/2026/06/compliance-monitoring-normal.svg', iconO: 'https://www.tryvium.ai/wp-content/uploads/2026/06/compliance-monitoring-hover.svg', title: 'Compliance Monitoring', desc: 'Continuously monitor operations against regulatory and compliance requirements.' },
]

const integrationLogos = [
  { src: 'https://www.tryvium.ai/wp-content/uploads/2026/06/salesforce-logo.png', alt: 'Salesforce' },
  { src: 'https://www.tryvium.ai/wp-content/uploads/2026/07/bmc-logo.png', alt: 'BMC' },
  { src: 'https://www.tryvium.ai/wp-content/uploads/2026/07/ivanti-logo.png', alt: 'Ivanti' },
  { src: 'https://www.tryvium.ai/wp-content/uploads/2026/06/zendesk.png', alt: 'Zendesk' },
  { src: 'https://www.tryvium.ai/wp-content/uploads/2026/06/service-now-logo.png', alt: 'ServiceNow' },
  { src: 'https://www.tryvium.ai/wp-content/uploads/2026/07/cherwell.png', alt: 'Cherwell' },
]

const microsoftBadges = [
  { src: 'https://www.tryvium.ai/wp-content/uploads/2026/06/microsoft-certified-software.png', alt: 'Unify Certified' },
  { src: 'https://www.tryvium.ai/wp-content/uploads/2026/07/ms-teams.png', alt: 'Microsoft Teams' },
  { src: 'https://www.tryvium.ai/wp-content/uploads/2026/06/microsoft-modern-work.png', alt: 'Microsoft Modern Work' },
  { src: 'https://www.tryvium.ai/wp-content/uploads/2026/06/microsoft-data-and-ai.png', alt: 'Microsoft Data and AI' },
  { src: 'https://www.tryvium.ai/wp-content/uploads/2026/06/microsoft-digital-and-app-innovation.png', alt: 'Microsoft Digital and App Innovation' },
  { src: 'https://www.tryvium.ai/wp-content/uploads/2026/06/microsoft-infra-azure.png', alt: 'Microsoft Infra Azure' },
]

export default function TryviumForAzurePage() {
  return (
    <>
      <Section background="gray" className="pt-20 pb-32">
        <Container className="text-center">
          <Badge className="mb-4">Tryvium for Microsoft Azure</Badge>
          <h1 className="text-5xl font-extrabold text-brand-900">Orchestrate Enterprise AI <span className="text-brand-600">on Microsoft Azure</span></h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-brand-600">
            Move beyond conversations and enable connected execution <em className="font-semibold">built on Microsoft Teams</em>.
            Built on Microsoft Teams, Tryvium for Microsoft Azure orchestrates AI agents, human agents, workflows, and enterprise applications
            through one connected execution layer, enabling AI-led Employee Helpdesk and Customer Service Desk experiences alike.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/schedule-a-demo/"><Button size="xl">Schedule a Demo</Button></Link>
            <Link href="/platform/experience-orchestration-platform/"><Button size="xl" variant="outline">Experience Tryvium</Button></Link>
          </div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <p className="mb-8 text-center text-sm font-semibold uppercase tracking-wider text-brand-500">Trusted By Leading Enterprises</p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {trustLogos.map((l) => (
              <Image key={l.alt} src={l.src} alt={l.alt} width={120} height={40} className="h-8 w-auto object-contain opacity-60 grayscale" />
            ))}
          </div>
        </Container>
      </Section>

      <Section background="gray">
        <Container>
          <h2 className="mb-12 text-center text-3xl font-bold text-brand-900">Why Enterprises Choose Tryvium for Microsoft Azure</h2>
          <p className="mx-auto mb-12 max-w-3xl text-center text-brand-600">
            Enterprise AI demands more than powerful models — it requires intelligent orchestration. Tryvium extends Microsoft Azure
            by seamlessly connecting AI agents, human expertise, enterprise applications, and workflows into a unified platform
            for autonomous, secure, and scalable experiences.
          </p>
          <div className="grid gap-6 md:grid-cols-4">
            {whyChooseBullets.map((b) => (
              <IconBox key={b.title} icon={<b.icon className="h-6 w-6" />} title={b.title} description={b.desc} />
            ))}
          </div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <h2 className="mb-4 text-center text-3xl font-bold text-brand-900">Why Tryvium is the Right Choice for Modern Enterprises</h2>
          <p className="mx-auto mb-12 max-w-3xl text-center text-brand-600">
            As organizations transition to Autonomous AI Agents, Experience Orchestration becomes the foundation for intelligent service execution.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardContent className="pt-8">
                <h3 className="mb-4 text-lg font-semibold text-red-600">Traditional Automation Escalation Model</h3>
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
                <h3 className="mb-4 text-lg font-semibold text-green-600">Tryvium for Microsoft Azure</h3>
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
          <h2 className="mb-12 text-center text-3xl font-bold text-brand-900">AI-Agent Orchestrated Solution on Microsoft Azure</h2>
          <p className="mx-auto mb-12 max-w-3xl text-center text-brand-600">
            Empowering enterprises modernize employee helpdesk and customer service desk through AI-led orchestration, intelligent automation, and scalable service execution powered by Microsoft Azure.
          </p>
          <div className="mb-16">
            <h3 className="mb-8 text-center text-2xl font-bold text-brand-900">Employee Help Desk</h3>
            <div className="grid gap-6 md:grid-cols-5">
              {employeeServices.map((s) => (
                <IconBox key={s.title} icon={<s.icon className="h-6 w-6" />} title={s.title} description={s.desc} />
              ))}
            </div>
          </div>

          <h3 className="mb-8 text-center text-2xl font-bold text-brand-900">AI-led Employee Helpdesk</h3>
          <div className="grid gap-6 md:grid-cols-5">
            {employeeHelpdeskFeatures.map((f) => (
              <Card key={f.title}>
                <CardContent className="pt-6">
                  <h4 className="mb-2 font-semibold text-brand-900">{f.title}</h4>
                  <p className="text-sm text-brand-600">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <h3 className="mb-8 text-center text-2xl font-bold text-brand-900">AI-led Customer Service Desk</h3>
          <div className="grid gap-6 md:grid-cols-5">
            {customerServiceFeatures.map((f) => (
              <Card key={f.title}>
                <CardContent className="pt-6">
                  <h4 className="mb-2 font-semibold text-brand-900">{f.title}</h4>
                  <p className="text-sm text-brand-600">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section background="gray">
        <Container>
          <h2 className="mb-4 text-center text-3xl font-bold text-brand-900">Enterprise Challenges, Orchestrated</h2>
          <p className="mx-auto mb-12 max-w-3xl text-center text-brand-600">
            How Tryvium for Microsoft Azure Orchestrates AI-led Operations
          </p>
          <div className="grid gap-6 md:grid-cols-5">
            {orchestratedItems.map((o) => (
              <IconBox key={o.title} icon={<o.icon className="h-6 w-6" />} title={o.title} description={o.desc} />
            ))}
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
          <h2 className="mb-12 text-center text-3xl font-bold text-brand-900">AI-Powered Employee Service Desk</h2>
          <p className="mx-auto mb-12 max-w-3xl text-center text-brand-600">
            Empower your employees with instant support, faster issue resolution, and seamless service experiences while reducing the burden on your support teams.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {employeeServiceItems.map((item) => (
              <Card key={item.title}>
                <CardContent className="flex items-start gap-4 pt-6">
                  <Image src={item.iconN} alt="" width={40} height={40} className="h-10 w-10 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-brand-900">{item.title}</h4>
                    <p className="text-sm text-brand-600">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <h2 className="mb-12 text-center text-3xl font-bold text-brand-900">AI-Led Customer Engagement</h2>
          <p className="mx-auto mb-12 max-w-3xl text-center text-brand-600">
            Orchestrate seamless customer experiences across every channel with intelligent engagement, faster resolutions, and personalized support at every touchpoint.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {customerEngagementItems.map((item) => (
              <Card key={item.title}>
                <CardContent className="flex items-start gap-4 pt-6">
                  <Image src={item.iconN} alt="" width={40} height={40} className="h-10 w-10 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-brand-900">{item.title}</h4>
                    <p className="text-sm text-brand-600">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section background="gray">
        <Container>
          <h2 className="mb-12 text-center text-3xl font-bold text-brand-900">Unified Experience Orchestration</h2>
          <p className="mx-auto mb-12 max-w-3xl text-center text-brand-600">
            Bring together AI, people, workflows, and enterprise systems to create seamless service journeys that drive better experiences and business outcomes.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {orchestrationItems.map((item) => (
              <Card key={item.title}>
                <CardContent className="flex items-start gap-4 pt-6">
                  <Image src={item.iconN} alt="" width={40} height={40} className="h-10 w-10 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-brand-900">{item.title}</h4>
                    <p className="text-sm text-brand-600">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <h2 className="mb-12 text-center text-3xl font-bold text-brand-900">Service Automation & Optimization</h2>
          <p className="mx-auto mb-12 max-w-3xl text-center text-brand-600">
            Transform service delivery through intelligent automation and workflow optimization that improves operational efficiency, reduces costs, and enhances every service experience.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {automationItems.map((item) => (
              <Card key={item.title}>
                <CardContent className="flex items-start gap-4 pt-6">
                  <Image src={item.iconN} alt="" width={40} height={40} className="h-10 w-10 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-brand-900">{item.title}</h4>
                    <p className="text-sm text-brand-600">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section background="gray">
        <Container>
          <h2 className="mb-12 text-center text-3xl font-bold text-brand-900">Human-Governed AI Operations</h2>
          <p className="mx-auto mb-12 max-w-3xl text-center text-brand-600">
            Empower your organization to scale AI responsibly with human-guided governance that ensures trust, compliance, transparency, and control across every service journey.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {governanceItems.map((item) => (
              <Card key={item.title}>
                <CardContent className="flex items-start gap-4 pt-6">
                  <Image src={item.iconN} alt="" width={40} height={40} className="h-10 w-10 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-brand-900">{item.title}</h4>
                    <p className="text-sm text-brand-600">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <h2 className="mb-12 text-center text-3xl font-bold text-brand-900">Enterprise Integrations, Simplified</h2>
          <p className="mx-auto mb-12 max-w-3xl text-center text-brand-600">
            Built on Microsoft Teams and designed to integrate with your ecosystem, Tryvium for Microsoft Azure connects employee support, customer service, workflows, and business applications through a flexible integration ecosystem.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {integrationLogos.map((l) => (
              <Image key={l.alt} src={l.src} alt={l.alt} width={120} height={40} className="h-8 w-auto object-contain opacity-60 grayscale" />
            ))}
          </div>
        </Container>
      </Section>

      <Section background="gray">
        <Container>
          <h2 className="mb-12 text-center text-3xl font-bold text-brand-900">Building Security, Governance & Compliance Built into Every Interaction</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <IconBox icon={<Lock className="h-6 w-6" />} title="Data Privacy" description="Data protection principles are embedded across interactions, workflows, integrations, and AI operations to help organizations maintain compliance and safeguard sensitive information." />
            <IconBox icon={<Eye className="h-6 w-6" />} title="Human-Governed AI" description="AI-led execution remains transparent, explainable, and governed through configurable controls, ensuring human oversight when needed." />
            <IconBox icon={<Shield className="h-6 w-6" />} title="Enterprise-Grade Security Controls" description="Role-based access, encryption, monitoring, auditability, and governance frameworks help organizations maintain secure and compliant service delivery at scale." />
          </div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <h2 className="mb-12 text-center text-3xl font-bold text-brand-900">Microsoft Validated & Recognized</h2>
          <ul className="mx-auto mb-12 max-w-2xl space-y-2 text-center text-brand-600">
            <li>Unify Certified (1 of 7 globally)</li>
            <li>Solution Certified for Microsoft Teams</li>
            <li>Microsoft Modern Work Certified Software for Teams AI Contact Center</li>
            <li>Marketplace availability and ecosystem alignment</li>
          </ul>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {microsoftBadges.map((b) => (
              <Image key={b.alt} src={b.src} alt={b.alt} width={100} height={60} className="h-14 w-auto object-contain" />
            ))}
          </div>
        </Container>
      </Section>

      <Section background="brand" className="text-center">
        <Container>
          <h2 className="text-4xl font-bold text-brand-900">Experience Orchestration Built on Microsoft Teams</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-brand-700">Delivering AI-led employee and customer experiences with Tryvium for Microsoft Azure.</p>
          <div className="mt-8"><Link href="/schedule-a-demo/"><Button size="xl">Schedule a Demo</Button></Link></div>
        </Container>
      </Section>
    </>
  )
}
