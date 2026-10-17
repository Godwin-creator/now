import type { Metadata } from 'next';

export const disambiguation =
  "NowPay est un outil de suivi et de relance de factures impayées. Ce n'est pas un service d'avance sur salaire, de prêt ni de paiement.";

export const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'NowPay',
      url: 'https://www.nowpay.website',
      logo: 'https://www.nowpay.website/logo-nowpay.png',
      description: disambiguation,
    },
    {
      '@type': 'WebSite',
      name: 'NowPay',
      url: 'https://www.nowpay.website',
      inLanguage: 'fr',
    },
    {
      '@type': 'SoftwareApplication',
      name: 'NowPay',
      url: 'https://www.nowpay.website',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      inLanguage: 'fr',
      areaServed: 'Togo',
      description: disambiguation,
      offers: {
        price: '0',
        priceCurrency: 'XOF',
        description: 'Gratuit pendant la phase pilote',
      },
    },
  ],
} as const;

export function jsonLdScript<T extends object>(data: T): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function publicPageMetadata(
  path: string,
  title: string,
  description: string,
): Metadata {
  const image = {
    url: '/opengraph-image.png',
    width: 1200,
    height: 630,
    alt: 'NowPay, suivi des factures impayées',
  };

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | NowPay`,
      description,
      url: path,
      siteName: 'NowPay',
      locale: 'fr_FR',
      type: 'website',
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | NowPay`,
      description,
      images: ['/opengraph-image.png'],
    },
  };
}

export const publicRoutes = [
  '/',
  '/mentions-legales',
  '/confidentialite',
  '/cgu',
] as const;
