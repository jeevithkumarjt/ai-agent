import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Tryvium Dashboard',
    template: '%s | Tryvium',
  },
  description: 'Tryvium Experience Orchestration Platform Dashboard',
  robots: {
    index: false,
    follow: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-US">
      <body className={`${inter.className} min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
