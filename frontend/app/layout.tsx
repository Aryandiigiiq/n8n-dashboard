import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DigiIQ — Social Posts Dashboard',
  description: 'Manage and automate your social media posts across Instagram, Facebook, and LinkedIn.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <main>
          {children}
        </main>
      </body>
    </html>
  )
}
