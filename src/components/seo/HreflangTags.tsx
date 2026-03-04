import { Helmet } from 'react-helmet-async';

interface HreflangEntry {
  lang: string;
  href: string;
}

interface HreflangTagsProps {
  entries: HreflangEntry[];
  xDefault?: string;
}

/**
 * Adds hreflang link tags for international SEO.
 * Usage:
 *   <HreflangTags entries={[
 *     { lang: 'fr', href: 'https://shopopti.io/optimisation-shopify' },
 *     { lang: 'en', href: 'https://shopopti.io/shopify-ai-optimization' },
 *   ]} xDefault="https://shopopti.io/shopify-ai-optimization" />
 */
export const HreflangTags = ({ entries, xDefault }: HreflangTagsProps) => (
  <Helmet>
    {entries.map((e) => (
      <link key={e.lang} rel="alternate" hrefLang={e.lang} href={e.href} />
    ))}
    {xDefault && <link rel="alternate" hrefLang="x-default" href={xDefault} />}
  </Helmet>
);
