import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'MarketX — Marketing Automation Platform',
  description: 'Manage campaigns, automate communication, and track engagement.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      <html lang="en" className={inter.variable}>
        <body className="min-h-screen bg-background font-sans antialiased">{children}</body>
      </html>
    </Providers>
  )
}
