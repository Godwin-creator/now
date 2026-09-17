import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Now — Relancez juste. Récupérez vite.',
  description: 'Application mobile-first de relance de créances assistée par IA pour les PME.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="antialiased bg-gray-50 text-gray-900 min-h-screen font-sans">
        {children}
      </body>
    </html>
  )
}
