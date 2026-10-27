import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import BackToTop from '@/app/components/BackToTop';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://www.nowpay.website'),
  title: 'NowPay — Suivi et relance de factures impayées pour PME',
  description:
    "NowPay aide les PME à voir qui relancer aujourd'hui et à rédiger le bon message de relance par IA (WhatsApp, e-mail, SMS). Gratuit pendant la phase pilote.",
  applicationName: 'NowPay',
  verification: {
    google: '_NaZnXQLJJ3WV9ZIJDGF2CoShmVXxyTOV9s7nkBQh9U',
  },
  openGraph: {
    title: 'NowPay — Suivi et relance de factures impayées pour PME',
    description:
      'Suivez vos factures impayées et préparez vos messages de relance.',
    url: '/',
    siteName: 'NowPay',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: '/images/social/nowpay-open-graph.png',
        width: 1732,
        height: 908,
        alt: 'NowPay, suivi des factures impayées',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NowPay — Suivi et relance de factures impayées pour PME',
    description:
      'Suivez vos factures impayées et préparez vos messages de relance.',
    images: ['/images/social/nowpay-open-graph.png'],
  },
  icons: {
    icon: '/images/brand/nowpay-logo.png',
    apple: '/images/brand/nowpay-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={geist.className}>
      <body className="antialiased min-h-screen bg-now-bg text-slate-900">
        {children}
        <BackToTop />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
