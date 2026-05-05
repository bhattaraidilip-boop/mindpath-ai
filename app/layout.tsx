import type { Metadata, Viewport } from 'next'
import { Inter, Nunito } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
  weight: ['400', '600', '700', '800', '900'],
})

export const metadata: Metadata = {
  title: {
    default: 'MindPath AI — Learning That Adapts to Your Child',
    template: '%s | MindPath AI',
  },
  description:
    'MindPath AI combines Kumon discipline with Duolingo engagement and AI personalization for children ages 4–18.',
  keywords: ['kids learning', 'AI tutor', 'math', 'reading', 'homeschool', 'education app'],
  authors: [{ name: 'MindPath AI' }],
  creator: 'MindPath AI',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://mindpathAI.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'MindPath AI',
    description: 'AI-powered learning for children ages 4–18',
    siteName: 'MindPath AI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MindPath AI',
    description: 'AI-powered learning for children ages 4–18',
  },
  icons: {
    icon: '/icons/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${nunito.variable}`}>
      <body className="bg-white text-gray-900 antialiased font-sans">
        {children}
      </body>
    </html>
  )
}
