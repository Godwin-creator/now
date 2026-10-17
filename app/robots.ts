import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/mentions-legales', '/confidentialite', '/cgu'],
      disallow: ['/dashboard', '/login', '/signup', '/onboarding', '/api'],
    },
    sitemap: 'https://www.nowpay.website/sitemap.xml',
  };
}
