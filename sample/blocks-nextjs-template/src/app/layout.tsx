import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ProtectedRoute } from '@/modules/auth/components/protected-route'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'SELISE Blocks | Enterprise Cloud OS',
  description:
    'Open Source Enterprise Reliability at Startup Speeds. Build secure, scalable applications with built-in observability, AI agents, identity management, and more.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ProtectedRoute>{children}</ProtectedRoute>
      </body>
    </html>
  )
}
