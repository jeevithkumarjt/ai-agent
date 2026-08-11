import type { Metadata } from 'next'
import { Container, Section, Badge } from '@tryvium/ui'

export const metadata: Metadata = {
  title: 'Our Cookie Policy | Tryvium',
  description: 'Learn how Tryvium uses cookies and similar technologies to enhance website functionality, improve user experience, and support analytics and performance.',
  alternates: { canonical: 'https://www.tryvium.ai/cookie-policy/' },
}

export default function CookiePolicyPage() {
  return (
    <Section background="gray" className="py-24">
      <Container>
        <article className="prose prose-brand mx-auto max-w-3xl">
          <Badge className="mb-4">Cookie Policy</Badge>
          <h1 className="text-4xl font-bold text-brand-900">Cookie Policy</h1>

          <h2>1. What is a cookie?</h2>

          <p>A cookie is a small text file that is stored on your computer or other internet connected device in order to identify your browser, provide analytics, remember information about you such as your language preference or login information. They&rsquo;re completely safe and can&rsquo;t be used to run programs or deliver viruses to your device.</p>

          <h2>2. What type of cookies does Tryvium use?</h2>

          <p>Cookies can either be session cookies or persistent cookies. A session cookie expires automatically when you close your browser. A persistent cookie will remain until it expires or you delete your cookies. Expiration dates are set in the cookies themselves; some may expire after a few minutes while others may expire after multiple years. Cookies placed by the website you&rsquo;re visiting are called &ldquo;first party cookies&rdquo;.</p>

          <h2>3. We classify cookies in the following categories:</h2>

          <h3>Strictly Necessary cookies</h3>

          <p>Strictly Necessary cookies are necessary for our website to function and cannot be switched off in our systems. They are essential in order to enable you to navigate around the website and use its features. If you remove or disable these cookies, we cannot guarantee that you will be able to use our websites.</p>

          <h3>Function/Preference cookies</h3>

          <p>Function/Preference cookies allow us to remember the choices made by you (such as your user name, language or region) as well as other functionalities (such as controlling the cookie banner, redirection to a new page) in order to provide a more personalized online experience. These preferences are remembered (through the use of persistent cookies) so that you need not set them again the next time you visit the page.</p>

          <p><strong>Note:</strong> The live chat widget will <strong>not</strong> work if the functionality/preference setting is disabled.</p>

          <h3>Analytics cookies</h3>

          <p>Analytics cookies help us improve the way our websites work (e.g. by ensuring that users are finding what they are looking for easily). These track information about visits to the websites so that we can make improvement and report our performance. For example: analyze visitor and user behavior so as to provide more relevant content or suggest certain activities. These cookies also collect information about how visitors use the websites, which site the user came from, the number of each user&rsquo;s visits and how long the user stays on the websites. We might also use analytics cookies to test new pages or features to see how users react to them.</p>

          <h3>What is a third-party cookie?</h3>

          <p>A third-party cookie is one which is not set by the website that you are visiting (e.g. cookies set by youtube.com on tryvium.ai). Some of Tryvium&rsquo;s own technologies and applications may be hosted in a domain that is a third-party to the domain that you may be visiting. However, our commitment extends to these domains equally.</p>

          <p>However, Tryvium does not allow third-party tracking companies to set cookies or other trackers on our website as part of our commitment to protect the privacy of our users with the utmost care. When we embed content that is hosted on a third-party&rsquo;s platform on our website, the third-party may set cookies on your browser which are usually for the purposes of providing the service as intended (such as for bandwidth management, to store your preference of language, tracking consent and for collecting anonymous statistics such as the number of times a video has been streamed). Wherever possible, we choose the most privacy friendly options such as Privacy Mode, Anonymous Statistics Only, to ensure we guarantee you privacy. However, some of the properties of such embeds may not be fully under our control such as our ability to control cookies that are set by these third-parties unilaterally when the webpage embedded with such content loads.</p>

          <h2>4. How you can manage cookies?</h2>

          <h3>Cookie preference manager</h3>

          <p>You can manage your cookie preference anytime by clicking on &ldquo;Manage Cookie Preference&rdquo; at the top of this page or via the Cookie icon that appears at the left bottom most corner of the webpages.</p>

          <h3>Browser settings</h3>

          <p>Most browsers allow you to control cookies through their &lsquo;settings&rsquo; preferences. However, if you limit the ability of websites to set cookies, you may worsen your overall user experience, since it will no longer be personalized to you. It may also stop you from saving customized settings like login information.</p>

          <h2>5. Disclaimer</h2>

          <p>We may update this Cookie Statement from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal or regulatory reasons. Please therefore re-visit this Cookie Statement regularly to stay informed about our use of cookies and related technologies. For more information relating to cookies, you may contact <a href="mailto:webmaster@tryvium.ai">webmaster@tryvium.ai</a>.</p>
        </article>
      </Container>
    </Section>
  )
}
