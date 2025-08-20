import { Helmet } from 'react-helmet-async';

interface HeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

export default function Head({
  title = "ShopOpti - Plateforme E-commerce Tout-en-Un | Gestion, Import & Automatisation",
  description = "Transformez votre e-commerce avec ShopOpti. Import de produits, gestion multi-boutiques, analytics avancés et automatisation. Essai gratuit 14 jours.",
  keywords = "e-commerce, shopify, dropshipping, bigbuy, gestion boutique, import produits, analytics, automatisation, multi-boutiques",
  image = "/og/og-home.jpg",
  url = "https://shopopti.com",
  type = "website"
}: HeadProps) {
  const fullImageUrl = image.startsWith('http') ? image : `${url}${image}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="ShopOpti" />
      <meta name="robots" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Language" content="fr" />
      <link rel="canonical" href={url} />

      {/* Open Graph Meta Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="ShopOpti" />
      <meta property="og:locale" content="fr_FR" />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:site" content="@ShopOpti" />
      <meta name="twitter:creator" content="@ShopOpti" />

      {/* Additional Meta Tags */}
      <meta name="theme-color" content="#3b82f6" />
      <meta name="msapplication-TileColor" content="#3b82f6" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "ShopOpti",
          "description": description,
          "url": url,
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "offers": {
            "@type": "Offer",
            "price": "29",
            "priceCurrency": "EUR",
            "priceValidUntil": "2025-12-31"
          },
          "author": {
            "@type": "Organization",
            "name": "ShopOpti",
            "url": url
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "reviewCount": "150"
          }
        })}
      </script>
    </Helmet>
  );
}