import type { Metadata } from 'next'
import './globals.css'
import BackToTop from '@/app/components/BackToTop'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.nowpay.website'),
  title: 'NowPay | Recouvrement intelligent',
  description:
    'Solution de gestion et de relance automatisée de créances par IA pour les entreprises en Afrique.',
  verification: {
    google: '_NaZnXQLJJ3WV9ZIJDGF2CoShmVXxyTOV9s7nkBQh9U',
  },
  openGraph: {
    title: 'NowPay | Recouvrement intelligent',
    description:
      'Solution de gestion et de relance automatisée de créances par IA pour les entreprises en Afrique.',
    url: '/',
    siteName: 'NowPay',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: '/logo-nowpay.png',
        width: 1200,
        height: 630,
        alt: 'Logo NowPay',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NowPay | Recouvrement intelligent',
    description:
      'Solution de gestion et de relance automatisée de créances par IA pour les entreprises en Afrique.',
    images: ['/logo-nowpay.png'],
  },
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
