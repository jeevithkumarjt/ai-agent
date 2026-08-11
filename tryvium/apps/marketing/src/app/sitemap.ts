import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.tryvium.ai'

  const pages = [
    { url: '', priority: 1.0, changeFreq: 'weekly' as const },
    { url: '/about-us/', priority: 0.8, changeFreq: 'monthly' as const },
    { url: '/why-tryvium/', priority: 0.8, changeFreq: 'monthly' as const },
    { url: '/platform/experience-orchestration-platform/', priority: 0.9, changeFreq: 'monthly' as const },
    { url: '/solution/tryvium-for-aws/', priority: 0.7, changeFreq: 'monthly' as const },
    { url: '/solution/tryvium-for-azure/', priority: 0.7, changeFreq: 'monthly' as const },
    { url: '/solution/tryvium-for-gcp/', priority: 0.7, changeFreq: 'monthly' as const },
    { url: '/services/contact-center/', priority: 0.7, changeFreq: 'monthly' as const },
    { url: '/services/contact-center-modernization/', priority: 0.7, changeFreq: 'monthly' as const },
    { url: '/services/workforce-management/', priority: 0.7, changeFreq: 'monthly' as const },
    { url: '/resources/', priority: 0.8, changeFreq: 'weekly' as const },
    { url: '/free-trial/', priority: 0.6, changeFreq: 'monthly' as const },
    { url: '/schedule-a-demo/', priority: 0.6, changeFreq: 'monthly' as const },
    { url: '/contact-us/', priority: 0.6, changeFreq: 'monthly' as const },
    { url: '/thank-you/', priority: 0.3, changeFreq: 'yearly' as const },
    { url: '/careers/', priority: 0.5, changeFreq: 'monthly' as const },
    { url: '/disclaimer/', priority: 0.3, changeFreq: 'yearly' as const },
    { url: '/privacy-policy/', priority: 0.3, changeFreq: 'yearly' as const },
    { url: '/cookie-policy/', priority: 0.3, changeFreq: 'yearly' as const },
    { url: '/blog/', priority: 0.8, changeFreq: 'weekly' as const },
    { url: '/blog/key-elements-of-experience-orchestration/', priority: 0.6, changeFreq: 'monthly' as const },
    { url: '/blog/10-experience-orchestration-use-cases-their-business-benefits/', priority: 0.6, changeFreq: 'monthly' as const },
    { url: '/blog/how-experience-orchestration-improves-customer-experience/', priority: 0.6, changeFreq: 'monthly' as const },
    { url: '/blog/how-can-enterprises-orchestrate-customer-experiences/', priority: 0.6, changeFreq: 'monthly' as const },
    { url: '/case-study/', priority: 0.7, changeFreq: 'monthly' as const },
    { url: '/case-study/how-a-global-pharmaceutical-leader-increased-chat-adoption-by-90/', priority: 0.6, changeFreq: 'yearly' as const },
    { url: '/case-study/streamlining-annual-employee-interactions-for-a-global-consumer-goods-company/', priority: 0.6, changeFreq: 'yearly' as const },
    { url: '/case-study/scaling-nationwide-hearing-services-with-an-intelligent-cx-platform/', priority: 0.6, changeFreq: 'yearly' as const },
  ]

  return pages.map((page) => ({
    url: `${baseUrl}${page.url}`,
    lastModified: new Date('2026-07-29'),
    changeFrequency: page.changeFreq,
    priority: page.priority,
  }))
}
