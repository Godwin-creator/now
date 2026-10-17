import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import robots from '@/app/robots';
import sitemap from '@/app/sitemap';
import { jsonLdScript, publicRoutes, structuredData } from '@/lib/seo';

const landing = readFileSync('app/page.tsx', 'utf8');

describe('SEO public', () => {
  it('publie un JSON-LD valide avec les types demandés et échappe les chevrons', () => {
    const parsed: unknown = JSON.parse(jsonLdScript(structuredData));
    expect(parsed).toMatchObject({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'Organization' },
        { '@type': 'WebSite' },
        {
          '@type': 'SoftwareApplication',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          inLanguage: 'fr',
          areaServed: 'Togo',
          offers: { price: '0', priceCurrency: 'XOF' },
        },
      ],
    });

    const encoded = jsonLdScript({ name: '<NowPay>' });
    expect(encoded).not.toContain('<');
    expect(encoded).toContain('\\u003c');
    expect(JSON.parse(encoded)).toEqual({ name: '<NowPay>' });
    expect(landing.match(/type="application\/ld\+json"/g)).toHaveLength(1);
  });

  it('autorise les pages publiques et exclut les espaces privés des robots', () => {
    const result = robots();
    const rules = result.rules;
    expect(rules).toMatchObject({
      allow: ['/', '/mentions-legales', '/confidentialite', '/cgu'],
      disallow: ['/dashboard', '/login', '/signup', '/onboarding', '/api'],
    });
    expect(result.sitemap).toBe('https://www.nowpay.website/sitemap.xml');
  });

  it('ne place que les pages publiques existantes dans le sitemap', async () => {
    const entries = await sitemap();
    expect(
      entries.map(({ url }) =>
        String(url).replace('https://www.nowpay.website', ''),
      ),
    ).toEqual(publicRoutes);
    expect(
      entries.every(({ lastModified }) => lastModified instanceof Date),
    ).toBe(true);
    expect(
      entries.some(({ url }) =>
        /dashboard|login|signup|onboarding|api/.test(String(url)),
      ),
    ).toBe(false);
  });

  it('déclare un canonical pour chaque page publique', () => {
    expect(landing).toContain("alternates: { canonical: '/' }");
    const pages = [
      ['app/mentions-legales/page.tsx', "'/mentions-legales'"],
      ['app/confidentialite/page.tsx', "'/confidentialite'"],
      ['app/cgu/page.tsx', "'/cgu'"],
    ] as const;

    for (const [file, canonical] of pages) {
      expect(readFileSync(file, 'utf8')).toContain(canonical);
    }
    expect(readFileSync('app/layout.tsx', 'utf8')).toContain(
      "metadataBase: new URL('https://www.nowpay.website')",
    );
  });

  it('garde les termes interdits et les pourcentages non sourcés hors de la landing', () => {
    const forbidden = [
      /automatique(?:ment)?/i,
      /24\s*\/\s*7/i,
      /1\s+clic/i,
      /ultra/i,
      /\bPWA\b/i,
      /en moins d['’]une minute/i,
    ];

    for (const term of forbidden) {
      expect(landing).not.toMatch(term);
    }

    const percentages = landing.matchAll(/\d+(?:[.,]\d+)?\s*%/g);
    for (const match of percentages) {
      const before = landing.slice(Math.max(0, match.index - 60), match.index);
      expect(before).toMatch(/source/i);
    }
  });
});
