import { Helmet } from "react-helmet-async";

type SEOProps = {
  title: string;
  description: string;
  path?: string;
  keywords?: string;
  jsonLd?: object;
};

export const SEO = ({ title, description, path = "/", keywords, jsonLd }: SEOProps) => {
  const url = `https://shopopti.io${path}`;
  const ogImg = "https://shopopti.io/og-image.png";

  const safeTitle = title && typeof title === 'string' ? title : "ShopOpti+";
  const safeDescription = description && typeof description === 'string' ? description : "Plateforme e-commerce intelligente";

  return (
    <Helmet prioritizeSeoTags>
      <title>{safeTitle}</title>
      <meta name="description" content={safeDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content="ShopOpti+" />
      <meta name="robots" content="index, follow" />

      <link rel="canonical" href={url} />

      <meta property="og:title" content={safeTitle} />
      <meta property="og:description" content={safeDescription} />
      <meta property="og:image" content={ogImg} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="ShopOpti+" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={safeTitle} />
      <meta name="twitter:description" content={safeDescription} />
      <meta name="twitter:image" content={ogImg} />

      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};
