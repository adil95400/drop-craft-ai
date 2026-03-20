import { Helmet } from "react-helmet-async";

type SEOProps = {
  title: string;
  description: string;
  path?: string;
  keywords?: string;
  jsonLd?: object | object[];
  locale?: string;
  alternateLocales?: { lang: string; path: string }[];
};

export const SEO = ({ title, description, path = "/", keywords, jsonLd, locale = "en", alternateLocales }: SEOProps) => {
  const url = `https://shopopti.io${path}`;
  const ogImg = "https://shopopti.io/og-image.png";

  const safeTitle = title && typeof title === 'string' ? title : "ShopOpti+";
  const safeDescription = description && typeof description === 'string' ? description : "AI-powered Shopify automation platform";

  return (
    <Helmet prioritizeSeoTags>
      <html lang={locale} />
      <title>{safeTitle}</title>
      <meta name="description" content={safeDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content="ShopOpti+" />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
      <meta name="theme-color" content="#3B82F6" />

      <link rel="canonical" href={url} />

      {/* Hreflang */}
      <link rel="alternate" hrefLang="x-default" href={url} />
      <link rel="alternate" hrefLang={locale} href={url} />
      {alternateLocales?.map(({ lang, path: altPath }) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={`https://shopopti.io${altPath}`} />
      ))}

      {/* Open Graph */}
      <meta property="og:title" content={safeTitle} />
      <meta property="og:description" content={safeDescription} />
      <meta property="og:image" content={ogImg} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="ShopOpti+ — AI Shopify Automation Platform" />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="ShopOpti+" />
      <meta property="og:locale" content={locale === 'fr' ? 'fr_FR' : 'en_US'} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={safeTitle} />
      <meta name="twitter:description" content={safeDescription} />
      <meta name="twitter:image" content={ogImg} />

      {/* JSON-LD */}
      {jsonLd && (
        Array.isArray(jsonLd)
          ? jsonLd.map((schema, i) => (
              <script key={i} type="application/ld+json">
                {JSON.stringify(schema)}
              </script>
            ))
          : (
              <script type="application/ld+json">
                {JSON.stringify(jsonLd)}
              </script>
            )
      )}
    </Helmet>
  );
};
