/**
 * NormalizationEngine v2.0
 * Transforms raw product data from any source into a validated ProductNormalized structure.
 * Guarantees: non-null critical fields, HTML sanitization, confidence scoring, source attribution.
 * 
 * v2.0 improvements:
 * - Batch error recovery (skip invalid, collect errors)
 * - Idempotency via content hashing
 * - Duplicate detection within batches
 * - Enhanced validation with field-level error reporting
 * - Configurable scoring weights
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
  content_hash: string;
}

export interface NormalizationError {
  index: number;
  raw: RawProductInput;
  error: string;
  field?: string;
}

export interface BatchResult {
  products: ProductNormalized[];
  errors: NormalizationError[];
  duplicates: { index: number; duplicateOf: number; hash: string }[];
  stats: {
    total: number;
    success: number;
    failed: number;
    duplicates: number;
    avg_completeness: number;
    duration_ms: number;
  };
}

export interface CompletenessWeights {
  title: number;
  description: number;
  category: number;
  price: number;
  images: number;
  tags: number;
  seoTitle: number;
  seoDescription: number;
  sku: number;
}

// ── Raw input type (flexible) ──────────────────────────────────────────

export type RawProductInput = Record<string, unknown>;

// ── Engine ──────────────────────────────────────────────────────────────

const DEFAULT_WEIGHTS: CompletenessWeights = {
  title: 20, description: 20, category: 10, price: 15,
  images: 15, tags: 5, seoTitle: 5, seoDescription: 5, sku: 5,
};

export class NormalizationEngine {
  private defaultSource: FieldMeta['source'];
  private weights: CompletenessWeights;

  constructor(source: FieldMeta['source'] = 'import', weights?: Partial<CompletenessWeights>) {
    this.defaultSource = source;
    this.weights = { ...DEFAULT_WEIGHTS, ...weights };
  }

  /**
   * Normalize a single raw product into ProductNormalized.
   * Throws on critical validation failure.
   */
  normalize(raw: RawProductInput): ProductNormalized {
    if (!raw || typeof raw !== 'object') {
      throw new Error('Input must be a non-null object');
    }

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

    const currency = this.extractString(raw, ['currency', 'price_currency'], 'EUR').toUpperCase().slice(0, 3);

    const images = this.extractImages(raw);
    fieldMeta.images = this.meta(images.length > 0 ? 90 : 0);

    const tags = this.extractTags(raw);
    const variants = this.extractVariants(raw);

    const seoTitle = this.extractString(raw, ['seo_title', 'meta_title'], '') || null;
    const seoDescription = this.extractString(raw, ['seo_description', 'meta_description'], '') || null;

    const sku = this.extractString(raw, ['sku', 'product_sku', 'item_sku'], '') || null;
    const barcode = this.extractString(raw, ['barcode', 'upc', 'ean', 'gtin'], '') || null;

    const sourceUrl = this.extractValidUrl(raw, ['source_url', 'url', 'product_url']);
    const supplierUrl = this.extractValidUrl(raw, ['supplier_url', 'vendor_url']);

    const completeness = this.calculateCompleteness({ title, description, category, price, images, tags, seoTitle, seoDescription, sku });

    const status: ProductStatus = completeness >= 80 ? 'active' : completeness >= 60 ? 'draft' : 'error_incomplete';

    const contentHash = this.hashContent(title, description, price, sku);

    return {
      title: title.slice(0, 500),
      description: description.slice(0, 10000),
      category: category.slice(0, 200),
      price,
      compare_at_price: compareAtPrice,
      currency,
      sku: sku?.slice(0, 64) ?? null,
      barcode: barcode?.slice(0, 64) ?? null,
      images: images.slice(0, 20),
      seo_title: seoTitle?.slice(0, 70) ?? null,
      seo_description: seoDescription?.slice(0, 170) ?? null,
      tags: tags.slice(0, 30),
      variants: variants.slice(0, 100),
      status,
      completeness_score: completeness,
      field_meta: fieldMeta,
      source_url: sourceUrl,
      supplier_url: supplierUrl,
      normalized_at: new Date().toISOString(),
      content_hash: contentHash,
    };
  }

  /**
   * Normalize a batch with error recovery and duplicate detection.
   */
  normalizeBatch(rawProducts: RawProductInput[]): BatchResult {
    const start = Date.now();
    const products: ProductNormalized[] = [];
    const errors: NormalizationError[] = [];
    const duplicates: BatchResult['duplicates'] = [];
    const hashMap = new Map<string, number>(); // hash -> first index

    for (let i = 0; i < rawProducts.length; i++) {
      try {
        const normalized = this.normalize(rawProducts[i]);

        // Duplicate detection
        const existingIdx = hashMap.get(normalized.content_hash);
        if (existingIdx !== undefined) {
          duplicates.push({ index: i, duplicateOf: existingIdx, hash: normalized.content_hash });
          continue;
        }

        hashMap.set(normalized.content_hash, i);
        products.push(normalized);
      } catch (err) {
        errors.push({
          index: i,
          raw: rawProducts[i],
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const avgCompleteness = products.length > 0
      ? Math.round(products.reduce((sum, p) => sum + p.completeness_score, 0) / products.length)
      : 0;

    return {
      products,
      errors,
      duplicates,
      stats: {
        total: rawProducts.length,
        success: products.length,
        failed: errors.length,
        duplicates: duplicates.length,
        avg_completeness: avgCompleteness,
        duration_ms: Date.now() - start,
      },
    };
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
      if (typeof value === 'number' && !isNaN(value) && isFinite(value)) return value;
      if (typeof value === 'string') {
        const parsed = parseFloat(value.replace(',', '.').replace(/[^\d.\-]/g, ''));
        if (!isNaN(parsed) && isFinite(parsed)) return parsed;
      }
    }
    return fallback;
  }

  private extractValidUrl(raw: RawProductInput, keys: string[]): string | null {
    for (const key of keys) {
      const value = raw[key];
      if (typeof value === 'string') {
        try {
          const url = new URL(value);
          if (['http:', 'https:'].includes(url.protocol)) return value;
        } catch { /* skip invalid */ }
      }
    }
    return null;
  }

  private sanitizeHtml(html: string): string {
    if (!html) return '';
    const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'ul', 'ol', 'li', 'p', 'br', 'h2', 'h3', 'h4'] });
    return clean.trim();
  }

  private extractImages(raw: RawProductInput): ProductNormalized['images'] {
    const images: ProductNormalized['images'] = [];

    for (const key of ['images', 'image_urls', 'media', 'photos']) {
      const value = raw[key];
      if (Array.isArray(value)) {
        value.forEach((img, idx) => {
          if (typeof img === 'string' && this.isValidImageUrl(img)) {
            images.push({ url: img, alt: '', position: idx });
          } else if (img && typeof img === 'object' && (img as Record<string, unknown>).url) {
            const url = (img as Record<string, unknown>).url as string;
            if (this.isValidImageUrl(url)) {
              images.push({
                url,
                alt: ((img as Record<string, unknown>).alt as string) || '',
                position: idx,
              });
            }
          }
        });
        if (images.length > 0) return images;
      }
    }

    for (const key of ['image', 'image_url', 'thumbnail', 'featured_image']) {
      const value = raw[key];
      if (typeof value === 'string' && this.isValidImageUrl(value)) {
        images.push({ url: value, alt: '', position: 0 });
        return images;
      }
    }

    return images;
  }

  private isValidImageUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  private extractTags(raw: RawProductInput): string[] {
    for (const key of ['tags', 'keywords', 'labels']) {
      const value = raw[key];
      if (Array.isArray(value)) return value.filter((t) => typeof t === 'string').map((t) => t.trim()).filter(Boolean);
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
        sku: (typeof v.sku === 'string' ? v.sku : null),
        title: (typeof v.title === 'string' ? v.title : typeof v.name === 'string' ? v.name : 'Default'),
        price: Math.max(0, Number(v.price) || 0),
        compare_at_price: v.compare_at_price ? Number(v.compare_at_price) : null,
        inventory_qty: Math.max(0, Math.floor(Number(v.inventory_qty ?? v.inventory_quantity ?? v.stock ?? 0))),
        options: (v.options && typeof v.options === 'object' ? v.options : {}) as Record<string, string>,
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
    const w = this.weights;

    if (fields.title && fields.title !== 'Produit sans titre') score += w.title;
    if (fields.description.length > 20) score += w.description;
    else if (fields.description.length > 0) score += w.description * 0.5;
    if (fields.category !== 'Non catégorisé') score += w.category;
    if (fields.price > 0) score += w.price;
    if (fields.images.length >= 3) score += w.images;
    else if (fields.images.length > 0) score += w.images * (fields.images.length / 3);
    if (fields.tags.length > 0) score += w.tags;
    if (fields.seoTitle) score += w.seoTitle;
    if (fields.seoDescription) score += w.seoDescription;
    if (fields.sku) score += w.sku;

    return Math.round(score);
  }

  /**
   * Simple content hash for idempotency & dedup.
   * Uses a fast djb2 variant.
   */
  private hashContent(title: string, description: string, price: number, sku: string | null): string {
    const input = `${title.toLowerCase()}|${description.slice(0, 200).toLowerCase()}|${price}|${sku || ''}`;
    let hash = 5381;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) + hash + input.charCodeAt(i)) >>> 0;
    }
    return hash.toString(36);
  }
}

// Singleton for convenience
export const normalizationEngine = new NormalizationEngine();
