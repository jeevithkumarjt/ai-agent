import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/wp-admin/', '/wp-content/', '/wp-includes/', '/wp-json/', '/app/', '/dashboard/'],
      },
    ],
    sitemap: 'https://www.tryvium.ai/sitemap.xml',
  }
}
