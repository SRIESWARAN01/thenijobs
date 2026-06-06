import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const BASE = 'https://thenijobs.com';
  const now = new Date();

  const staticPages = [
    { url: `${BASE}/`, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE}/jobs`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE}/businesses`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/services`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/register`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/login`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/company/register`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/employer/post-job`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/pricing`, changeFrequency: 'weekly', priority: 0.7 },
  ] as MetadataRoute.Sitemap;

  const categoryPages = [
    'agriculture', 'construction', 'education', 'healthcare',
    'it-software', 'textiles', 'manufacturing', 'retail', 'transport', 'finance',
  ].map(cat => ({
    url: `${BASE}/businesses/${cat}`,
    changeFrequency: 'daily' as const,
    priority: 0.8,
    lastModified: now,
  }));

  // Static company pages (would be dynamic from DB in production)
  const companyPages = [
    'arasu-pandi-farm-services-theni',
    'theni-builders-pvt-ltd',
    'greenfield-agro-dindigul',
    'sboa-matriculation-theni',
  ].map(slug => ({
    url: `${BASE}/company/${slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.85,
    lastModified: now,
  }));

  return [...staticPages, ...categoryPages, ...companyPages];
}
