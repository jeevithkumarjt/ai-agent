import type { Metadata } from 'next'
import { Container, Section, Badge } from '@tryvium/ui'

export const metadata: Metadata = {
  title: 'Our Disclaimer | Tryvium',
  description: "Read Tryvium's disclaimer to understand the terms, responsibilities, and limitations related to website usage and content.",
  alternates: { canonical: 'https://www.tryvium.ai/disclaimer/' },
}

export default function DisclaimerPage() {
  return (
    <Section background="gray" className="py-24">
      <Container>
        <article className="prose prose-brand mx-auto max-w-3xl">
          <Badge className="mb-4">Disclaimer</Badge>
          <h1 className="text-4xl font-bold text-brand-900">Disclaimer</h1>

          <p>The information provided on Sensiple&apos;s website (www.tryvium.ai) is for general informational purposes only. The Site, and all content, materials, information, software, products and services provided on the Site, are provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. While Sensiple strive to provide accurate and up-to-date information, Sensiple make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability with respect to the website or the information, products, services, or related graphics contained on the website for any purpose. The following terms and conditions under which you may use this website. By accessing or using this site, you agree to comply with the terms and conditions outlined below. If you disagree with any part of this disclaimer, please do not use the website.</p>

          <p>The content on this website is provided for informational purposes only. While we make every effort to ensure the accuracy and reliability of the information provided, we do not guarantee that the content is complete, error-free, or up-to-date. All content is provided &ldquo;as-is&rdquo; without any warranty of any kind, either express or implied, including but not limited to the warranties of merchantability or fitness for a particular purpose. We will not be liable for any loss or damage arising from the use of, or inability to use, this website, including but not limited to loss of data, service interruptions, or errors in content.</p>

          <p>We collect certain personal information, such as names, emails, and other details, through registration forms, cookies, and analytics tools. The Users right to privacy is of paramount importance to Sensiple. Any information provided by the Users will not be shared with any third party. Sensiple reserves the right to use the information to provide the User a more personalized online experience.</p>

          <p>All content present on this site is the exclusive property of Sensiple. The software, text, images, graphics, video and audio used on this site belong to Sensiple. No material from this site may be copied, modified, reproduced, republished, uploaded, transmitted, posted or distributed in any form without prior written permission from Sensiple. All rights not expressly granted herein are reserved. Unauthorized use of the materials appearing on this site may violate copyright, trademark and other applicable laws, and could result in criminal or civil penalties. Sensiple is a registered trademark of Sensiple Inc and its affiliates. This trademark may not be used in any manner without prior written consent from Sensiple.</p>

          <p>Users of this website are expected to behave responsibly and respectfully. Any form of spamming, hate speech, abusive behavior, or unlawful actions will not be tolerated. We reserve the right to suspend or terminate access to the site for users who violate these terms. The provisions with regard to disclaimer of warranty shall survive such termination.</p>

          <p>Accessing third-party links is done at your own risk, and we assume no liability for any damages or loss resulting from such actions. By using this website, you agree to indemnify and hold harmless the website owner, its affiliates, and its partners from any claims, damages, losses, or expenses (including legal fees) by any third party, arising from your use of the website or any user-generated actions.</p>

          <p>The website may experience temporary downtimes or disruptions due to maintenance or technical issues. We are not responsible for any inconvenience or damages resulting from these interruptions. Sensiple may change or discontinue any aspect of its website at any time and such changes shall be effective immediately. Users will not be notified of any changes. It is your responsibility to periodically review this page for any updates.</p>

          <p>Sensiple disclaim any responsibility for external software or hardware failures, data loss, or errors caused by user actions or technical issues on third-party platforms. Sensiple is not liable for any damages arising from such events. This disclaimer is intended to protect both the website owner and users by setting clear guidelines for responsible use of the website. For any further inquiries or clarifications, please contact us at legal@tryvium.ai</p>
        </article>
      </Container>
    </Section>
  )
}
