import type { Metadata } from 'next'
import './globals.css'
import BackToTop from '@/app/components/BackToTop'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.nowpay.website'),
  title: 'NowPay | Recouvrement intelligent',
  description:
    'Solution de gestion et de relance automatisée de créances par IA pour les entreprises en Afrique.',
  icons: {
    icon: '/logo-nowpay2.png',
    apple: '/logo-nowpay.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="antialiased min-h-screen bg-now-bg text-slate-900">
        {children}
        <BackToTop />
      </body>
    </html>
  )
}
