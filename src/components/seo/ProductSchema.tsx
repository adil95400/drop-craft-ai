/**
 * Schema.org structured data pour SEO - Phase 3.3
 * Rich snippets pour les moteurs de recherche
 */
import { Helmet } from 'react-helmet-async';

// FAQ Schema for homepage/FAQ pages
interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSchemaProps {
  items: FAQItem[];
}

export function FAQSchema({ items }: FAQSchemaProps) {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": items.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
}

// Product Schema for product pages
interface ProductSchemaProps {
  name: string;
  description: string;
  image: string;
  price: number;
  currency?: string;
  sku?: string;
  brand?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  rating?: number;
  reviewCount?: number;
}

export function ProductSchema({
  name,
  description,
  image,
  price,
  currency = 'EUR',
  sku,
  brand = 'ShopOpti+',
  availability = 'InStock',
  rating,
  reviewCount
}: ProductSchemaProps) {
  const schemaData: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": name,
    "description": description,
    "image": image,
    "brand": {
      "@type": "Brand",
      "name": brand
    },
    "offers": {
      "@type": "Offer",
      "price": price,
      "priceCurrency": currency,
      "availability": `https://schema.org/${availability}`
    }
  };

  if (sku) {
    schemaData.sku = sku;
  }

  if (rating && reviewCount) {
    schemaData.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": rating,
      "reviewCount": reviewCount
    };
  }

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
}

// Breadcrumb Schema
interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
}

// Review Schema
interface ReviewSchemaProps {
  itemName: string;
  reviewBody: string;
  authorName: string;
  ratingValue: number;
  datePublished?: string;
}

export function ReviewSchema({
  itemName,
  reviewBody,
  authorName,
  ratingValue,
  datePublished = new Date().toISOString()
}: ReviewSchemaProps) {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Review",
    "itemReviewed": {
      "@type": "SoftwareApplication",
      "name": itemName
    },
    "reviewBody": reviewBody,
    "author": {
      "@type": "Person",
      "name": authorName
    },
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": ratingValue,
      "bestRating": 5
    },
    "datePublished": datePublished
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
}

// How-to Schema for tutorials
interface HowToStep {
  name: string;
  text: string;
  image?: string;
}

interface HowToSchemaProps {
  name: string;
  description: string;
  steps: HowToStep[];
  totalTime?: string; // ISO 8601 duration format
}

export function HowToSchema({
  name,
  description,
  steps,
  totalTime = 'PT10M'
}: HowToSchemaProps) {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": name,
    "description": description,
    "totalTime": totalTime,
    "step": steps.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": step.name,
      "text": step.text,
      ...(step.image && { "image": step.image })
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
}

// Article Schema for blog posts
interface ArticleSchemaProps {
  headline: string;
  description: string;
  image: string;
  authorName: string;
  datePublished: string;
  dateModified?: string;
}

export function ArticleSchema({
  headline,
  description,
  image,
  authorName,
  datePublished,
  dateModified
}: ArticleSchemaProps) {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": headline,
    "description": description,
    "image": image,
    "author": {
      "@type": "Person",
      "name": authorName
    },
    "publisher": {
      "@type": "Organization",
      "name": "ShopOpti+",
      "logo": {
        "@type": "ImageObject",
        "url": "https://drop-craft-ai.lovable.app/logo.png"
      }
    },
    "datePublished": datePublished,
    "dateModified": dateModified || datePublished
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
}

// Local Business Schema (optional for enterprise)
interface LocalBusinessSchemaProps {
  name: string;
  description: string;
  address?: {
    streetAddress: string;
    addressLocality: string;
    postalCode: string;
    addressCountry: string;
  };
  telephone?: string;
  email?: string;
}

export function LocalBusinessSchema({
  name,
  description,
  address,
  telephone,
  email
}: LocalBusinessSchemaProps) {
  const schemaData: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "SoftwareCompany",
    "name": name,
    "description": description,
    "url": "https://drop-craft-ai.lovable.app"
  };

  if (address) {
    schemaData.address = {
      "@type": "PostalAddress",
      ...address
    };
  }

  if (telephone) schemaData.telephone = telephone;
  if (email) schemaData.email = email;

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
}
