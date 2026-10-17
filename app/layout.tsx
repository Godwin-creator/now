import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import BackToTop from '@/app/components/BackToTop'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.nowpay.website'),
  title: { default: 'NowPay — suivi des créances', template: '%s | NowPay' },
  description: "Voyez qui relancer aujourd'hui, préparez le bon message et gardez la main sur son envoi.",
  applicationName: 'NowPay',
  verification: {
    google: '_NaZnXQLJJ3WV9ZIJDGF2CoShmVXxyTOV9s7nkBQh9U',
  },
  openGraph: {
    title: 'NowPay — suivi des créances',
    description: "Voyez qui relancer aujourd'hui et préparez vos messages de relance.",
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
    title: 'NowPay — suivi des créances',
    description: "Voyez qui relancer aujourd'hui et préparez vos messages de relance.",
    images: ['/logo-nowpay.png'],
  },
  icons: {
    icon: '/logo-nowpay.png',
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
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
