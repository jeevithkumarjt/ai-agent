/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  trailingSlash: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.tryvium.ai',
      },
    ],
  },
  async redirects() {
    return [
      // Redirect non-trailing-slash to trailing-slash for all pages
      {
        source: '/:path((?!wp-|_next/|api/)[^/]+)$',
        destination: '/:path/',
        permanent: true,
      },
      // Legacy WordPress paths - 301 to home
      {
        source: '/wp-admin/:path*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/wp-content/:path*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/wp-includes/:path*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/wp-json/:path*',
        destination: '/',
        permanent: true,
      },
      // Legacy page redirects if any
      {
        source: '/about/',
        destination: '/about-us/',
        permanent: true,
      },
      {
        source: '/blog/unified-customer-experience/',
        destination: '/blog/how-experience-orchestration-improves-customer-experience/',
        permanent: true,
      },
      {
        source: '/blog/generative-ai/',
        destination: '/blog/',
        permanent: true,
      },
      {
        source: '/blog/enterprise-contact-center-solution/',
        destination: '/services/contact-center/',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
