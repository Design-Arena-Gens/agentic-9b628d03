import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Deep Search PDF Generator',
  description: 'Search reputable sources and create citation-rich PDFs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  )
}
