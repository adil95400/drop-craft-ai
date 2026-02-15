/**
 * NormalizationEngine v1.0
 * Transforms raw product data from any source into a validated ProductNormalized structure.
 * Guarantees: non-null critical fields, HTML sanitization, confidence scoring, source attribution.
 */
import DOMPurify from 'dompurify';

// ── Types ──────────────────────────────────────────────────────────────

export type ProductStatus = 'draft' | 'active' | 'paused' | 'archived' | 'error_incomplete';

export interface FieldMeta {
  source: 'import' | 'ai' | 'user' | 'scrape' | 'supplier' | 'unknown';
  confidence: number; // 0-100
}

export interface NormalizedVariant {
  sku: string | null;
  title: string;
  price: number;
  compare_at_price: number | null;
  inventory_qty: number;
  options: Record<string, string>;
}

export interface ProductNormalized {
  // Core
  title: string;
  description: string;
  category: string;
  price: number;
  compare_at_price: number | null;
  currency: string;
  sku: string | null;
  barcode: string | null;

  // Media
  images: { url: string; alt: string; position: number }[];

  // SEO
  seo_title: string | null;
  seo_description: string | null;
  tags: string[];

  // Variants
  variants: NormalizedVariant[];

  // Meta
  status: ProductStatus;
  completeness_score: number; // 0-100
  field_meta: Partial<Record<keyof ProductNormalized, FieldMeta>>;
  source_url: string | null;
  supplier_url: string | null;
  normalized_at: string;
}

// ── Raw input type (flexible) ──────────────────────────────────────────

export type RawProductInput = Record<string, unknown>;

// ── Engine ──────────────────────────────────────────────────────────────

export class NormalizationEngine {
  private defaultSource: FieldMeta['source'];

  constructor(source: FieldMeta['source'] = 'import') {
    this.defaultSource = source;
  }

  /**
   * Normalize a single raw product into ProductNormalized.
   */
  normalize(raw: RawProductInput): ProductNormalized {
    const fieldMeta: ProductNormalized['field_meta'] = {};

    const title = this.extractString(raw, ['title', 'name', 'product_name'], 'Produit sans titre');
    fieldMeta.title = this.meta(title !== 'Produit sans titre' ? 95 : 10);

    const description = this.sanitizeHtml(this.extractString(raw, ['description', 'body', 'body_html', 'content'], ''));
    fieldMeta.description = this.meta(description.length > 20 ? 90 : description.length > 0 ? 50 : 0);

    const category = this.extractString(raw, ['category', 'product_type', 'type'], 'Non catégorisé');
    fieldMeta.category = this.meta(category !== 'Non catégorisé' ? 80 : 10);

    const price = this.extractNumber(raw, ['price', 'sale_price', 'unit_price'], 0);
    fieldMeta.price = this.meta(price > 0 ? 95 : 0);

    const compareAtPrice = this.extractNumber(raw, ['compare_at_price', 'original_price', 'msrp'], null);

    const currency = this.extractString(raw, ['currency', 'price_currency'], 'EUR').toUpperCase();

    const images = this.extractImages(raw);
    fieldMeta.images = this.meta(images.length > 0 ? 90 : 0);

    const tags = this.extractTags(raw);

    const variants = this.extractVariants(raw);

    const seoTitle = this.extractString(raw, ['seo_title', 'meta_title'], null as unknown as string) || null;
    const seoDescription = this.extractString(raw, ['seo_description', 'meta_description'], null as unknown as string) || null;

    const sku = this.extractString(raw, ['sku', 'product_sku', 'item_sku'], null as unknown as string) || null;
    const barcode = this.extractString(raw, ['barcode', 'upc', 'ean', 'gtin'], null as unknown as string) || null;

    const sourceUrl = this.extractString(raw, ['source_url', 'url', 'product_url'], null as unknown as string) || null;
    const supplierUrl = this.extractString(raw, ['supplier_url', 'vendor_url'], null as unknown as string) || null;

    const completeness = this.calculateCompleteness({ title, description, category, price, images, tags, seoTitle, seoDescription, sku });

    const status: ProductStatus = completeness >= 60 ? 'draft' : 'error_incomplete';

    return {
      title,
      description,
      category,
      price,
      compare_at_price: compareAtPrice,
      currency,
      sku,
      barcode,
      images,
      seo_title: seoTitle,
      seo_description: seoDescription,
      tags,
      variants,
      status,
      completeness_score: completeness,
      field_meta: fieldMeta,
      source_url: sourceUrl,
      supplier_url: supplierUrl,
      normalized_at: new Date().toISOString(),
    };
  }

  /**
   * Normalize a batch of raw products.
   */
  normalizeBatch(rawProducts: RawProductInput[]): ProductNormalized[] {
    return rawProducts.map((raw) => this.normalize(raw));
  }

  // ── Private helpers ────────────────────────────────────────────────────

  private meta(confidence: number): FieldMeta {
    return { source: this.defaultSource, confidence: Math.min(100, Math.max(0, confidence)) };
  }

  private extractString(raw: RawProductInput, keys: string[], fallback: string): string {
    for (const key of keys) {
      const value = raw[key];
      if (typeof value === 'string' && value.trim().length > 0) return value.trim();
    }
    return fallback;
  }

  private extractNumber(raw: RawProductInput, keys: string[], fallback: number | null): number | null {
    for (const key of keys) {
      const value = raw[key];
      if (typeof value === 'number' && !isNaN(value)) return value;
      if (typeof value === 'string') {
        const parsed = parseFloat(value.replace(',', '.').replace(/[^\\d.]/g, ''));
        if (!isNaN(parsed)) return parsed;
      }
    }
    return fallback;
  }

  private sanitizeHtml(html: string): string {
    if (!html) return '';
    // Strip scripts & styles, keep safe HTML
    const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'ul', 'ol', 'li', 'p', 'br', 'h2', 'h3', 'h4'] });
    return clean.trim();
  }

  private extractImages(raw: RawProductInput): ProductNormalized['images'] {
    const images: ProductNormalized['images'] = [];

    // Try array fields
    for (const key of ['images', 'image_urls', 'media', 'photos']) {
      const value = raw[key];
      if (Array.isArray(value)) {
        value.forEach((img, idx) => {
          if (typeof img === 'string' && img.startsWith('http')) {
            images.push({ url: img, alt: '', position: idx });
          } else if (img && typeof img === 'object' && (img as Record<string, unknown>).url) {
            images.push({
              url: (img as Record<string, unknown>).url as string,
              alt: ((img as Record<string, unknown>).alt as string) || '',
              position: idx,
            });
          }
        });
        if (images.length > 0) return images;
      }
    }

    // Try single image field
    for (const key of ['image', 'image_url', 'thumbnail', 'featured_image']) {
      const value = raw[key];
      if (typeof value === 'string' && value.startsWith('http')) {
        images.push({ url: value, alt: '', position: 0 });
        return images;
      }
    }

    return images;
  }

  private extractTags(raw: RawProductInput): string[] {
    for (const key of ['tags', 'keywords', 'labels']) {
      const value = raw[key];
      if (Array.isArray(value)) return value.filter((t) => typeof t === 'string').map((t) => t.trim());
      if (typeof value === 'string') return value.split(',').map((t) => t.trim()).filter(Boolean);
    }
    return [];
  }

  private extractVariants(raw: RawProductInput): NormalizedVariant[] {
    const value = raw['variants'];
    if (!Array.isArray(value)) return [];

    return value
      .filter((v) => v && typeof v === 'object')
      .map((v: Record<string, unknown>) => ({
        sku: (v.sku as string) || null,
        title: (v.title as string) || (v.name as string) || 'Default',
        price: Number(v.price) || 0,
        compare_at_price: v.compare_at_price ? Number(v.compare_at_price) : null,
        inventory_qty: Number(v.inventory_qty ?? v.inventory_quantity ?? v.stock ?? 0),
        options: (v.options as Record<string, string>) || {},
      }));
  }

  private calculateCompleteness(fields: {
    title: string;
    description: string;
    category: string;
    price: number;
    images: unknown[];
    tags: string[];
    seoTitle: string | null;
    seoDescription: string | null;
    sku: string | null;
  }): number {
    let score = 0;
    const weights = { title: 20, description: 20, category: 10, price: 15, images: 15, tags: 5, seoTitle: 5, seoDescription: 5, sku: 5 };

    if (fields.title && fields.title !== 'Produit sans titre') score += weights.title;
    if (fields.description.length > 20) score += weights.description;
    else if (fields.description.length > 0) score += weights.description * 0.5;
    if (fields.category !== 'Non catégorisé') score += weights.category;
    if (fields.price > 0) score += weights.price;
    if (fields.images.length >= 3) score += weights.images;
    else if (fields.images.length > 0) score += weights.images * (fields.images.length / 3);
    if (fields.tags.length > 0) score += weights.tags;
    if (fields.seoTitle) score += weights.seoTitle;
    if (fields.seoDescription) score += weights.seoDescription;
    if (fields.sku) score += weights.sku;

    return Math.round(score);
  }
}

// Singleton for convenience
export const normalizationEngine = new NormalizationEngine();
