import type { MetadataRoute } from 'next';
import { publicRoutes } from '@/lib/seo';

const origin = 'https://www.nowpay.website';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return publicRoutes.map((path) => ({
    url: new URL(path, origin).toString(),
    lastModified: new Date(),
  }));
}
