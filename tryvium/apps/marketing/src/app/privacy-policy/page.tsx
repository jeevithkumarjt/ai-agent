import type { Metadata } from 'next'
import { Container, Section, Badge } from '@tryvium/ui'

export const metadata: Metadata = {
  title: 'Our Privacy Policy | Tryvium',
  description: 'Learn how Tryvium collects, uses, stores, and protects your information through our privacy practices and security measures.',
  alternates: { canonical: 'https://www.tryvium.ai/privacy-policy/' },
}

export default function PrivacyPolicyPage() {
  return (
    <Section background="gray" className="py-24">
      <Container>
        <article className="prose prose-brand mx-auto max-w-3xl">
          <Badge className="mb-4">Privacy Policy</Badge>
          <p className="text-sm text-brand-400">Last Updated: July 2026</p>
          <h1 className="text-4xl font-bold text-brand-900">Privacy Policy</h1>

          <p>This Privacy Policy describes how Tryvium (&ldquo;Tryvium&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) collects, uses, discloses, transfers, and protects personal data when you access or use our websites, applications, and services (collectively, the &ldquo;Services&rdquo;).</p>

          <p>We are committed to protecting your privacy and complying with applicable data protection laws worldwide, including the EU General Data Protection Regulation (GDPR), UK GDPR, California Consumer Privacy Act (CCPA/CPRA), and other relevant regulations.</p>

          <h2>1. Personal Data We Collect</h2>

          <p>We collect personal data directly from you, automatically when you use our Services, and from third parties where permitted.</p>

          <table className="w-full text-sm">
            <thead><tr><th className="text-left font-semibold text-brand-900">Category</th><th className="text-left font-semibold text-brand-900">Examples</th><th className="text-left font-semibold text-brand-900">Source</th></tr></thead>
            <tbody>
              <tr><td className="pr-4 align-top font-medium">Contact Information</td><td className="pr-4 align-top">Name, email address, company name, phone number</td><td className="align-top">Provided by you</td></tr>
              <tr><td className="pr-4 align-top font-medium">Account Information</td><td className="pr-4 align-top">Username, hashed password, preferences</td><td className="align-top">Created by you</td></tr>
              <tr><td className="pr-4 align-top font-medium">Usage Data</td><td className="pr-4 align-top">Pages visited, clicks, session duration, IP address, browser</td><td className="align-top">Automatically collected</td></tr>
              <tr><td className="pr-4 align-top font-medium">Technical Data</td><td className="pr-4 align-top">Logs, device identifiers, diagnostics</td><td className="align-top">System-generated</td></tr>
              <tr><td className="pr-4 align-top font-medium">Communications</td><td className="pr-4 align-top">Emails, support tickets, chat messages</td><td className="align-top">Provided by you</td></tr>
              <tr><td className="pr-4 align-top font-medium">Marketing &amp; Preferences</td><td className="pr-4 align-top">Subscription status, consent preferences</td><td className="align-top">Consent tools/forms</td></tr>
              <tr><td className="pr-4 align-top font-medium">Integration Data</td><td className="pr-4 align-top">Data from connected third-party services</td><td className="align-top">Authorized by you</td></tr>
            </tbody>
          </table>

          <p>We do <strong>not</strong> intentionally collect sensitive personal data unless required and explicitly consented to.</p>

          <h2>2. How We Use Personal Data (Legal Basis)</h2>

          <p>We process personal data for the following purposes:</p>

          <table className="w-full text-sm">
            <thead><tr><th className="text-left font-semibold text-brand-900">Purpose</th><th className="text-left font-semibold text-brand-900">Legal Basis (where applicable)</th></tr></thead>
            <tbody>
              <tr><td className="pr-4 align-top">Provide and maintain Services</td><td className="align-top">Contractual necessity</td></tr>
              <tr><td className="pr-4 align-top">Customer support and communication</td><td className="align-top">Contract / Legitimate interest</td></tr>
              <tr><td className="pr-4 align-top">Send marketing communications</td><td className="align-top">Consent (opt-in; withdraw anytime)</td></tr>
              <tr><td className="pr-4 align-top">Improve performance and analytics</td><td className="align-top">Legitimate interest</td></tr>
              <tr><td className="pr-4 align-top">Prevent fraud and ensure security</td><td className="align-top">Legitimate interest / Legal obligation</td></tr>
              <tr><td className="pr-4 align-top">Comply with legal requirements</td><td className="align-top">Legal obligation</td></tr>
              <tr><td className="pr-4 align-top">Internal operations and governance</td><td className="align-top">Legitimate interest</td></tr>
            </tbody>
          </table>

          <p>Where we rely on legitimate interest, we ensure your rights are not overridden.</p>

          <h2>3. How We Share Personal Data</h2>

          <p>We may share your personal data with the following categories of recipients:</p>

          <ul>
            <li><strong>Service Providers and Vendors</strong> &ndash; such as hosting, analytics, CRM, payment processors or communication tools.</li>
            <li><strong>Affiliates</strong> &ndash; within the Tryvium corporate group.</li>
            <li><strong>Professional Advisors</strong> &ndash; including auditors, legal counsel and consulting.</li>
            <li><strong>Business Transfers</strong> &ndash; in connection with mergers, acquisitions, asset transfers or sale.</li>
            <li><strong>Regulatory Authorities</strong> &ndash; where required to comply with legal obligations.</li>
            <li><strong>Third Parties with Your Consent</strong> &ndash; such as integrations or third-party platforms explicitly authorized by you.</li>
          </ul>

          <p>All processors are bound by data protection agreements compliant with applicable laws (e.g., GDPR Article 28).</p>

          <p><strong>WE DO NOT SELL PERSONAL DATA.</strong></p>

          <h2>4. Data Retention</h2>

          <p>We retain personal data only for as long as necessary to fulfill the purposes for which it was collected, or as required by applicable laws and regulations, unless otherwise specified in the customer contract, personal data will be retained for a period of three (3) months. Retention periods may be adjusted based on specific customer requirements agreed upon in the contract.</p>

          <table className="w-full text-sm">
            <thead><tr><th className="text-left font-semibold text-brand-900">Data Category</th><th className="text-left font-semibold text-brand-900">Retention Period and Justification</th></tr></thead>
            <tbody>
              <tr><td className="pr-4 align-top font-medium">Account data</td><td className="align-top">Retained for the duration of the customer relationship or up to 12 months after account closure (for audit, legal or billing purposes).</td></tr>
              <tr><td className="pr-4 align-top font-medium">Support / communications</td><td className="align-top">Retained for 5 years for dispute resolution and compliance.</td></tr>
              <tr><td className="pr-4 align-top font-medium">Marketing data</td><td className="align-top">Retained for a maximum of 24 months or until consent is withdrawn.</td></tr>
              <tr><td className="pr-4 align-top font-medium">Logs &amp; Analytics</td><td className="align-top">Retained in pseudonymized form for up to 24 months for system security and diagnostics.</td></tr>
            </tbody>
          </table>

          <p>Unless otherwise agreed in customer contracts, shorter retention periods (e.g., 3 months) may apply. After the retention period, data will be either deleted securely or anonymized irreversibly.</p>

          <h2>5. Your Privacy Rights</h2>

          <p>Depending on your location, you may have the following rights:</p>

          <table className="w-full text-sm">
            <thead><tr><th className="text-left font-semibold text-brand-900">Right</th><th className="text-left font-semibold text-brand-900">Description</th><th className="text-left font-semibold text-brand-900">Typical Response Time</th></tr></thead>
            <tbody>
              <tr><td className="pr-4 align-top font-medium">Access</td><td className="pr-4 align-top">Request a copy of your data.</td><td className="align-top">Within 30 Calendar days; extended for complex cases.</td></tr>
              <tr><td className="pr-4 align-top font-medium">Erasure / Correction</td><td className="pr-4 align-top">Request deletion of your data under certain conditions. Fix inaccurate data.</td><td className="align-top">Within 30 Calendar days after Data Controller&apos;s request.</td></tr>
              <tr><td className="pr-4 align-top font-medium">Rectification</td><td className="pr-4 align-top">Request correction of inaccurate data.</td><td className="align-top">Typically fulfilled within 30 Calendar days.</td></tr>
              <tr><td className="pr-4 align-top font-medium">Restriction of Processing</td><td className="pr-4 align-top">Request temporary suspension of processing (during dispute or accuracy check).</td><td className="align-top">Evaluated case by case.</td></tr>
              <tr><td className="pr-4 align-top font-medium">Data Portability</td><td className="pr-4 align-top">Receive your data in structured format. Commonly used, machine readable format of your data.</td><td className="align-top">Processed where technically possible (only the data provided by the user, as per Article 20).</td></tr>
              <tr><td className="pr-4 align-top font-medium">Objection</td><td className="pr-4 align-top">Object to processing based on legitimate interests or for direct marketing purposes.</td><td className="align-top">Actioned immediately or within 30 days.</td></tr>
              <tr><td className="pr-4 align-top font-medium">Automated Decision-Making</td><td className="pr-4 align-top">Request human intervention where automated decisions significantly affect you.</td><td className="align-top">Evaluated on request.</td></tr>
              <tr><td className="pr-4 align-top font-medium">Information</td><td className="pr-4 align-top">Receive clear details about the processing of your data.</td><td className="align-top">Provided within 30 Calendar days.</td></tr>
              <tr><td className="pr-4 align-top font-medium">Lodge a Complaint</td><td className="pr-4 align-top">File a complaint with your local Data Protection Authority if you believe your rights are violated.</td><td className="align-top">Guidance and contact information provided upon request.</td></tr>
            </tbody>
          </table>

          <p>For California residents (CCPA/CPRA): Right to know, delete, correct. Right to opt out of sharing (if applicable). Right to non-discrimination. Operationally, we handle data subject requests through its administrative console, based on the retention period agreed with the customer. Requests are logged, verified, and billed per actual effort, where applicable. To exercise any of these rights, contact us at <a href="mailto:legal@tryvium.ai">legal@tryvium.ai</a>. We may require proof of identity before fulfilling requests. Response time is typically within 30 calendar days.</p>

          <h2>6. Cookies &amp; Tracking Technologies</h2>

          <p>We use cookies and similar tracking technologies to:</p>

          <ul>
            <li>Enable authenticate sessions and maintain user login.</li>
            <li>Store user preferences.</li>
            <li>Analyze traffic patterns and user behavior.</li>
            <li>Deliver targeted marketing (with your consent).</li>
          </ul>

          <p>Cookie usage is controlled through a cookie consent banner presented upon first visit and available at any time via the &ldquo;Cookie Settings&rdquo; link in the footer of our website. We use a Consent Management Platform that allows you to accept or reject different categories of cookies; withdraw or update your consent at any time. For more details, please refer to <a href="/cookie-policy">Cookie Policy</a>.</p>

          <h2>7. International Data Transfers</h2>

          <p>Your data may be transferred and processed in multiple countries, and outside your country of residence including: European Economic Area (EEA), United Kingdom, United States, India.</p>

          <p>We use or implement appropriate safeguards in accordance with applicable privacy law such as:</p>

          <ul>
            <li>Standard Contractual Clauses (SCCs)</li>
            <li>Adequacy decisions by the European Commission</li>
            <li>Encryption (in transit and at rest)</li>
            <li>Restricted access controls on a need to know basis.</li>
          </ul>

          <h2>8. Data Security</h2>

          <p>We employ a combination of organizational, technical and industry-standard safeguards:</p>

          <ul>
            <li>Encryption (AES-256 for data at rest and TLS for data in transit)</li>
            <li>Role-based access control</li>
            <li>Firewalls, monitoring and intrusion detection systems</li>
            <li>Regular penetration and vulnerability scans and security testing and audits</li>
            <li>Employee security awareness training</li>
          </ul>

          <p>If a data breach occurs, we will notify users and regulators as required by applicable laws.</p>

          <h2>9. Children&apos;s Privacy</h2>

          <p>Our Services are not intended for children under 16 years (or applicable local age). We do not knowingly collect children&apos;s data. If you identified, please contact us we will delete it promptly.</p>

          <h2>10. Updates to This Policy</h2>

          <p>We may update this policy periodically to reflect changes in our practices, technology and legal requirements. The &ldquo;Last Updated&rdquo; date will be revised. If changes are material, we will notify users by email or prominent notice.</p>

          <h2>11. Contact Us</h2>

          <p><strong>Tryvium</strong><br />
          Email: <a href="mailto:legal@tryvium.ai">legal@tryvium.ai</a><br />
          Address: 1460 US Highway 9 North, Suite 303, Woodbridge, New Jersey, 07095, United States of America</p>

          <p>If you are located in the EU or UK, you have the right to lodge a complaint with your local Data Protection Authority (DPA). Upon request, we can assist in identifying the appropriate authority and provide their contact details.</p>
        </article>
      </Container>
    </Section>
  )
}
