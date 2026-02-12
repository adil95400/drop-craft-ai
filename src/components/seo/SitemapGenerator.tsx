/**
 * Sitemap XML Generator for ShopOpti+
 * Generates dynamic sitemap for SEO
 */

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

// Static pages for the public website
export const staticPages: SitemapUrl[] = [
  { loc: 'https://shopopti.io/', changefreq: 'daily', priority: 1.0 },
  { loc: 'https://shopopti.io/features', changefreq: 'weekly', priority: 0.9 },
  { loc: 'https://shopopti.io/pricing', changefreq: 'weekly', priority: 0.9 },
  { loc: 'https://shopopti.io/about', changefreq: 'monthly', priority: 0.7 },
  { loc: 'https://shopopti.io/contact', changefreq: 'monthly', priority: 0.6 },
  { loc: 'https://shopopti.io/blog', changefreq: 'daily', priority: 0.8 },
  { loc: 'https://shopopti.io/documentation', changefreq: 'weekly', priority: 0.7 },
  { loc: 'https://shopopti.io/faq', changefreq: 'monthly', priority: 0.6 },
  { loc: 'https://shopopti.io/integrations', changefreq: 'weekly', priority: 0.7 },
  { loc: 'https://shopopti.io/logiciel-dropshipping', changefreq: 'monthly', priority: 0.9 },
  { loc: 'https://shopopti.io/alternative-autods', changefreq: 'monthly', priority: 0.9 },
  { loc: 'https://shopopti.io/optimisation-shopify', changefreq: 'monthly', priority: 0.9 },
  { loc: 'https://shopopti.io/gestion-catalogue-ecommerce', changefreq: 'monthly', priority: 0.9 },
  { loc: 'https://shopopti.io/privacy-policy', changefreq: 'yearly', priority: 0.3 },
  { loc: 'https://shopopti.io/terms-of-service', changefreq: 'yearly', priority: 0.3 },
];

export function generateSitemapXML(urls: SitemapUrl[]): string {
  const today = new Date().toISOString().split('T')[0];
  
  const urlEntries = urls.map(url => `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod || today}</lastmod>
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority !== undefined ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urlEntries}
</urlset>`;
}

export function generateRobotsTxt(): string {
  return `# Robots.txt for ShopOpti+
# https://shopopti.io

User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /admin/
Disallow: /api/
Disallow: /auth/

# Sitemaps
Sitemap: https://shopopti.io/sitemap.xml

# Crawl-delay for polite crawling
Crawl-delay: 1
`;
}
