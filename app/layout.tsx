import type { Metadata } from 'next'
import './globals.css'
import BackToTop from '@/app/components/BackToTop'

export const metadata: Metadata = {
  title: 'Now — Relancez juste. Récupérez vite.',
  description: 'Application mobile-first de relance de créances assistée par IA pour les PME africaines.',
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="antialiased min-h-screen bg-now-bg"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        {children}
        <BackToTop />
      </body>
    </html>
  )
}
