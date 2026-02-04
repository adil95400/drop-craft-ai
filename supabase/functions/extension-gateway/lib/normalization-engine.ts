/**
 * NormalizationEngine v1.0
 * Transforms raw multi-source product data into a strict, validated ProductNormalized structure.
 * 
 * Rules:
 * - Core fields NEVER return undefined/null (except reviews)
 * - All data is sanitized and validated
 * - Field sources and confidence are preserved
 */

// ============================================
// TYPES
// ============================================

export interface RawProductData {
  title?: string | null;
  price?: number | string | null;
  compare_at_price?: number | string | null;
  currency?: string | null;
  description?: string | null;
  short_description?: string | null;
  images?: string[] | null;
  image_url?: string | null;
  variants?: RawVariant[] | null;
  category?: string | null;
  categories?: string[] | null;
  brand?: string | null;
  sku?: string | null;
  gtin?: string | null;
  barcode?: string | null;
  weight?: number | string | null;
  weight_unit?: string | null;
  stock_quantity?: number | string | null;
  availability?: string | null;
  rating?: number | string | null;
  reviews_count?: number | string | null;
  reviews?: RawReview[] | null;
  video_urls?: string[] | null;
  supplier_name?: string | null;
  supplier_url?: string | null;
  shipping_time?: string | null;
  tags?: string[] | null;
  attributes?: Record<string, string | string[]> | null;
  
  // Source tracking
  field_sources?: Record<string, FieldSource>;
}

export interface RawVariant {
  id?: string;
  title?: string;
  option_name?: string;
  option_value?: string;
  options?: Record<string, string>;
  sku?: string;
  price?: number | string;
  compare_at_price?: number | string;
  image?: string;
  image_url?: string;
  stock?: number | string;
  available?: boolean;
  barcode?: string;
}

export interface RawReview {
  author?: string;
  rating?: number | string;
  title?: string;
  content?: string;
  date?: string;
  verified?: boolean;
  images?: string[];
}

export interface FieldSource {
  source: 'api' | 'headless' | 'json-ld' | 'opengraph' | 'dom' | 'html' | 'fallback' | 'default';
  confidence: number;
  extracted_at?: string;
}

// ============================================
// NORMALIZED OUTPUT TYPES
// ============================================

export interface ProductNormalized {
  // Required core fields (NEVER null/undefined)
  title: string;
  price: number;
  currency: string;
  images: string[];
  description: string;
  short_description: string;
  category: string;
  status: 'draft' | 'ready' | 'error_incomplete';
  
  // Optional but normalized fields
  compare_at_price: number | null;
  brand: string;
  sku: string;
  gtin: string;
  barcode: string;
  weight: number | null;
  weight_unit: string;
  stock_quantity: number;
  availability: 'in_stock' | 'out_of_stock' | 'preorder' | 'unknown';
  rating: number | null;
  reviews_count: number;
  video_urls: string[];
  supplier_name: string;
  supplier_url: string;
  shipping_time: string;
  tags: string[];
  attributes: Record<string, string[]>;
  
  // Variants (always array, may be empty)
  variants: VariantNormalized[];
  has_variants: boolean;
  
  // Reviews stored separately (optional)
  reviews: ReviewNormalized[] | null;
  
  // Metadata
  completeness_score: number;
  field_sources: Record<string, FieldSource>;
  validation_errors: ValidationError[];
  normalized_at: string;
}

export interface VariantNormalized {
  id: string;
  title: string;
  options: VariantOption[];
  sku: string;
  price: number;
  compare_at_price: number | null;
  image_url: string;
  stock_quantity: number;
  available: boolean;
  barcode: string;
}

export interface VariantOption {
  name: string;
  value: string;
}

export interface ReviewNormalized {
  id: string;
  author: string;
  rating: number;
  title: string;
  content: string;
  date: string;
  verified: boolean;
  images: string[];
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface NormalizationResult {
  success: boolean;
  product: ProductNormalized | null;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// ============================================
// CATEGORY MAPPING
// ============================================

const CATEGORY_MAPPINGS: Record<string, string[]> = {
  'electronics': ['electronics', 'tech', 'gadgets', 'computers', 'phones', 'mobile', 'tablets', 'laptops', 'audio', 'headphones', 'speakers', 'cameras', 'tv', 'television', 'gaming', 'consoles', 'accessories'],
  'clothing': ['clothing', 'apparel', 'fashion', 'clothes', 'wear', 'shirts', 'pants', 'dresses', 'jackets', 'coats', 'sweaters', 'tops', 'bottoms', 'activewear', 'sportswear'],
  'shoes': ['shoes', 'footwear', 'sneakers', 'boots', 'sandals', 'heels', 'flats', 'loafers', 'athletic shoes'],
  'accessories': ['accessories', 'jewelry', 'watches', 'bags', 'handbags', 'wallets', 'belts', 'hats', 'scarves', 'sunglasses', 'eyewear'],
  'home': ['home', 'furniture', 'decor', 'decoration', 'kitchen', 'bedroom', 'bathroom', 'living room', 'garden', 'outdoor', 'patio', 'lighting', 'storage'],
  'beauty': ['beauty', 'cosmetics', 'makeup', 'skincare', 'haircare', 'fragrance', 'perfume', 'personal care', 'grooming'],
  'health': ['health', 'wellness', 'fitness', 'supplements', 'vitamins', 'medical', 'pharmacy', 'nutrition'],
  'toys': ['toys', 'games', 'puzzles', 'dolls', 'action figures', 'board games', 'outdoor toys', 'educational toys'],
  'baby': ['baby', 'infant', 'toddler', 'nursery', 'stroller', 'car seat', 'diaper', 'feeding'],
  'sports': ['sports', 'fitness', 'exercise', 'gym', 'outdoor', 'camping', 'hiking', 'cycling', 'running', 'swimming', 'yoga'],
  'automotive': ['automotive', 'car', 'vehicle', 'auto parts', 'motorcycle', 'tools', 'garage'],
  'books': ['books', 'ebooks', 'audiobooks', 'magazines', 'comics', 'textbooks', 'literature'],
  'music': ['music', 'instruments', 'vinyl', 'records', 'cds', 'musical equipment'],
  'pet': ['pet', 'pets', 'dog', 'cat', 'fish', 'bird', 'animal', 'pet supplies', 'pet food'],
  'food': ['food', 'grocery', 'gourmet', 'snacks', 'beverages', 'drinks', 'organic', 'specialty foods'],
  'office': ['office', 'supplies', 'stationery', 'desk', 'organization', 'printing', 'school supplies'],
  'art': ['art', 'craft', 'crafts', 'diy', 'painting', 'drawing', 'sewing', 'knitting', 'scrapbooking'],
};

// ============================================
// NORMALIZATION ENGINE
// ============================================

export class NormalizationEngine {
  private errors: ValidationError[] = [];
  private warnings: ValidationError[] = [];
  private fieldSources: Record<string, FieldSource> = {};

  /**
   * Main normalization entry point
   */
  normalize(raw: RawProductData): NormalizationResult {
    this.errors = [];
    this.warnings = [];
    this.fieldSources = raw.field_sources || {};

    try {
      // Normalize all fields
      const title = this.normalizeTitle(raw.title);
      const { price, currency } = this.normalizePrice(raw.price, raw.currency);
      const images = this.normalizeImages(raw.images, raw.image_url);
      const description = this.normalizeDescription(raw.description);
      const shortDescription = this.normalizeShortDescription(raw.short_description, description);
      const category = this.normalizeCategory(raw.category, raw.categories);
      const variants = this.normalizeVariants(raw.variants);
      const reviews = this.normalizeReviews(raw.reviews);

      // Check critical fields
      const hasCriticalErrors = this.errors.some(e => e.severity === 'error');
      const status = hasCriticalErrors ? 'error_incomplete' : 'draft';

      // Build normalized product
      const product: ProductNormalized = {
        // Core required fields
        title,
        price,
        currency,
        images,
        description,
        short_description: shortDescription,
        category,
        status,
        
        // Optional normalized fields
        compare_at_price: this.normalizeNumber(raw.compare_at_price),
        brand: this.normalizeString(raw.brand),
        sku: this.normalizeString(raw.sku),
        gtin: this.normalizeString(raw.gtin),
        barcode: this.normalizeString(raw.barcode),
        weight: this.normalizeNumber(raw.weight),
        weight_unit: this.normalizeWeightUnit(raw.weight_unit),
        stock_quantity: this.normalizeStock(raw.stock_quantity),
        availability: this.normalizeAvailability(raw.availability, raw.stock_quantity),
        rating: this.normalizeRating(raw.rating),
        reviews_count: this.normalizeInteger(raw.reviews_count) || 0,
        video_urls: this.normalizeVideoUrls(raw.video_urls),
        supplier_name: this.normalizeString(raw.supplier_name),
        supplier_url: this.normalizeUrl(raw.supplier_url),
        shipping_time: this.normalizeString(raw.shipping_time),
        tags: this.normalizeTags(raw.tags),
        attributes: this.normalizeAttributes(raw.attributes),
        
        // Variants
        variants,
        has_variants: variants.length > 0,
        
        // Reviews (optional, stored separately)
        reviews,
        
        // Metadata
        completeness_score: this.calculateCompletenessScore({
          title, price, images, description, category, variants, reviews
        }),
        field_sources: this.fieldSources,
        validation_errors: [...this.errors, ...this.warnings],
        normalized_at: new Date().toISOString(),
      };

      return {
        success: !hasCriticalErrors,
        product,
        errors: this.errors,
        warnings: this.warnings,
      };
    } catch (error) {
      this.addError('_general', 'NORMALIZATION_FAILED', `Normalization failed: ${error}`, 'error');
      return {
        success: false,
        product: null,
        errors: this.errors,
        warnings: this.warnings,
      };
    }
  }

  // ============================================
  // TITLE NORMALIZATION
  // ============================================

  private normalizeTitle(raw: string | null | undefined): string {
    if (!raw || typeof raw !== 'string') {
      this.addError('title', 'TITLE_MISSING', 'Title is required', 'error');
      return '';
    }

    let title = this.stripHtml(raw).trim();
    
    // Remove excessive whitespace
    title = title.replace(/\s+/g, ' ');
    
    // Remove common spam patterns
    title = title.replace(/^(buy|shop|order|get)\s+/i, '');
    title = title.replace(/\s+(free shipping|fast delivery|best price)$/i, '');
    
    // Truncate if too long (preserve word boundaries)
    if (title.length > 200) {
      title = title.substring(0, 197).replace(/\s+\S*$/, '') + '...';
      this.addWarning('title', 'TITLE_TRUNCATED', 'Title was truncated to 200 characters');
    }

    if (title.length === 0) {
      this.addError('title', 'TITLE_EMPTY', 'Title cannot be empty after cleaning', 'error');
    }

    return title;
  }

  // ============================================
  // PRICE NORMALIZATION
  // ============================================

  private normalizePrice(
    rawPrice: number | string | null | undefined,
    rawCurrency: string | null | undefined
  ): { price: number; currency: string } {
    let price = 0;
    let currency = 'EUR'; // Default currency

    // Parse price
    if (rawPrice !== null && rawPrice !== undefined) {
      if (typeof rawPrice === 'number') {
        price = rawPrice;
      } else if (typeof rawPrice === 'string') {
        // Extract currency from price string if present
        const currencyMatch = rawPrice.match(/^([€$£¥₹])|([A-Z]{3})$/);
        if (currencyMatch) {
          const symbol = currencyMatch[1] || currencyMatch[2];
          currency = this.currencySymbolToCode(symbol) || currency;
        }
        
        // Extract numeric value
        const numericValue = rawPrice.replace(/[^0-9.,]/g, '');
        // Handle European format (1.234,56) vs US format (1,234.56)
        const normalized = numericValue.includes(',') && numericValue.includes('.')
          ? numericValue.replace('.', '').replace(',', '.')
          : numericValue.replace(',', '.');
        price = parseFloat(normalized) || 0;
      }
    }

    // Validate price
    if (price <= 0) {
      this.addError('price', 'PRICE_INVALID', 'Price must be a positive number', 'error');
      price = 0;
    } else if (price > 1000000) {
      this.addWarning('price', 'PRICE_HIGH', 'Price seems unusually high');
    }

    // Normalize currency
    if (rawCurrency && typeof rawCurrency === 'string') {
      const upperCurrency = rawCurrency.toUpperCase().trim();
      if (upperCurrency.length === 3 && /^[A-Z]{3}$/.test(upperCurrency)) {
        currency = upperCurrency;
      } else {
        currency = this.currencySymbolToCode(rawCurrency) || currency;
      }
    }

    return { price: Math.round(price * 100) / 100, currency };
  }

  private currencySymbolToCode(symbol: string): string | null {
    const map: Record<string, string> = {
      '€': 'EUR', '$': 'USD', '£': 'GBP', '¥': 'JPY', '₹': 'INR',
      'EUR': 'EUR', 'USD': 'USD', 'GBP': 'GBP', 'JPY': 'JPY', 'INR': 'INR',
      'CAD': 'CAD', 'AUD': 'AUD', 'CNY': 'CNY', 'CHF': 'CHF',
    };
    return map[symbol] || null;
  }

  // ============================================
  // IMAGES NORMALIZATION
  // ============================================

  private normalizeImages(
    images: string[] | null | undefined,
    singleImage: string | null | undefined
  ): string[] {
    const result: string[] = [];
    const seen = new Set<string>();

    // Process array
    if (Array.isArray(images)) {
      for (const img of images) {
        const normalized = this.normalizeImageUrl(img);
        if (normalized && !seen.has(normalized)) {
          seen.add(normalized);
          result.push(normalized);
        }
      }
    }

    // Add single image if not already present
    if (singleImage) {
      const normalized = this.normalizeImageUrl(singleImage);
      if (normalized && !seen.has(normalized)) {
        result.unshift(normalized); // Main image first
      }
    }

    // Validate minimum
    if (result.length === 0) {
      this.addError('images', 'IMAGES_MISSING', 'At least one image is required', 'error');
    }

    // Limit to reasonable number
    if (result.length > 20) {
      this.addWarning('images', 'IMAGES_TRUNCATED', `Truncated from ${result.length} to 20 images`);
      return result.slice(0, 20);
    }

    return result;
  }

  private normalizeImageUrl(url: string | null | undefined): string | null {
    if (!url || typeof url !== 'string') return null;

    let normalized = url.trim();
    
    // Skip data URLs and invalid URLs
    if (normalized.startsWith('data:') || normalized.length < 10) return null;
    
    // Ensure absolute URL
    if (normalized.startsWith('//')) {
      normalized = 'https:' + normalized;
    }
    
    // Validate URL format
    try {
      new URL(normalized);
    } catch {
      return null;
    }

    // Upgrade to high-res for known platforms
    normalized = this.upgradeToHighRes(normalized);

    return normalized;
  }

  private upgradeToHighRes(url: string): string {
    // Amazon high-res upgrade
    if (url.includes('amazon.com') || url.includes('media-amazon.com')) {
      return url.replace(/\._[A-Z]{2}\d+_\./, '._SL1500_.').replace(/\._S[XY]\d+_\./, '._SL1500_.');
    }
    
    // AliExpress high-res
    if (url.includes('alicdn.com') || url.includes('aliexpress.com')) {
      return url.replace(/_\d+x\d+\./, '.').replace(/\.jpg_\d+x\d+\.jpg/, '.jpg');
    }
    
    // Temu high-res
    if (url.includes('temu.com')) {
      return url.replace(/thumb\//, '').replace(/_thumbnail/, '');
    }

    return url;
  }

  // ============================================
  // DESCRIPTION NORMALIZATION
  // ============================================

  private normalizeDescription(raw: string | null | undefined): string {
    if (!raw || typeof raw !== 'string') return '';

    // Remove dangerous HTML
    let cleaned = this.sanitizeHtml(raw);
    
    // Normalize whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // Truncate if extremely long
    if (cleaned.length > 10000) {
      cleaned = cleaned.substring(0, 9997) + '...';
      this.addWarning('description', 'DESCRIPTION_TRUNCATED', 'Description was truncated to 10000 characters');
    }

    return cleaned;
  }

  private normalizeShortDescription(
    raw: string | null | undefined,
    fullDescription: string
  ): string {
    if (raw && typeof raw === 'string') {
      const cleaned = this.stripHtml(raw).trim();
      if (cleaned.length > 0 && cleaned.length <= 500) {
        return cleaned;
      }
    }

    // Generate from full description
    if (fullDescription.length > 0) {
      const plainText = this.stripHtml(fullDescription);
      if (plainText.length <= 160) return plainText;
      
      // Extract first sentence or truncate
      const firstSentence = plainText.match(/^[^.!?]+[.!?]/);
      if (firstSentence && firstSentence[0].length <= 160) {
        return firstSentence[0].trim();
      }
      
      return plainText.substring(0, 157).replace(/\s+\S*$/, '') + '...';
    }

    return '';
  }

  private sanitizeHtml(html: string): string {
    // Remove script and style tags with content
    let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Remove event handlers
    cleaned = cleaned.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    cleaned = cleaned.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
    
    // Remove javascript: and data: URLs
    cleaned = cleaned.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');
    cleaned = cleaned.replace(/src\s*=\s*["']data:[^"']*["']/gi, '');
    
    // Remove iframe, object, embed
    cleaned = cleaned.replace(/<(iframe|object|embed|form)[^>]*>.*?<\/\1>/gi, '');
    cleaned = cleaned.replace(/<(iframe|object|embed|form)[^>]*\/?>/gi, '');
    
    return cleaned;
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  // ============================================
  // CATEGORY NORMALIZATION
  // ============================================

  private normalizeCategory(
    category: string | null | undefined,
    categories: string[] | null | undefined
  ): string {
    const candidates: string[] = [];
    
    if (category && typeof category === 'string') {
      candidates.push(category.toLowerCase().trim());
    }
    
    if (Array.isArray(categories)) {
      for (const cat of categories) {
        if (typeof cat === 'string') {
          candidates.push(cat.toLowerCase().trim());
        }
      }
    }

    // Try to map to internal category
    for (const candidate of candidates) {
      for (const [internalCat, keywords] of Object.entries(CATEGORY_MAPPINGS)) {
        for (const keyword of keywords) {
          if (candidate.includes(keyword)) {
            return internalCat;
          }
        }
      }
    }

    // Return original category if available, otherwise fallback
    if (candidates.length > 0) {
      const original = candidates[0];
      // Clean and format
      return original.charAt(0).toUpperCase() + original.slice(1);
    }

    return 'uncategorized';
  }

  // ============================================
  // VARIANTS NORMALIZATION
  // ============================================

  private normalizeVariants(raw: RawVariant[] | null | undefined): VariantNormalized[] {
    if (!Array.isArray(raw) || raw.length === 0) return [];

    const normalized: VariantNormalized[] = [];

    for (let i = 0; i < raw.length; i++) {
      const v = raw[i];
      if (!v || typeof v !== 'object') continue;

      // Extract options
      const options = this.extractVariantOptions(v);
      
      // Generate title if not present
      const title = v.title || options.map(o => o.value).join(' / ') || `Variant ${i + 1}`;
      
      // Parse price
      let price = 0;
      if (v.price !== undefined && v.price !== null) {
        price = typeof v.price === 'number' ? v.price : parseFloat(String(v.price)) || 0;
      }

      // Parse compare at price
      let compareAtPrice: number | null = null;
      if (v.compare_at_price !== undefined && v.compare_at_price !== null) {
        const parsed = typeof v.compare_at_price === 'number' 
          ? v.compare_at_price 
          : parseFloat(String(v.compare_at_price));
        if (!isNaN(parsed) && parsed > 0) {
          compareAtPrice = parsed;
        }
      }

      // Parse stock
      let stockQuantity = 0;
      if (v.stock !== undefined && v.stock !== null) {
        stockQuantity = typeof v.stock === 'number' ? v.stock : parseInt(String(v.stock)) || 0;
      }

      normalized.push({
        id: v.id || `variant_${i}_${Date.now()}`,
        title,
        options,
        sku: this.normalizeString(v.sku),
        price: Math.round(price * 100) / 100,
        compare_at_price: compareAtPrice ? Math.round(compareAtPrice * 100) / 100 : null,
        image_url: this.normalizeImageUrl(v.image || v.image_url) || '',
        stock_quantity: Math.max(0, stockQuantity),
        available: v.available !== false && stockQuantity > 0,
        barcode: this.normalizeString(v.barcode),
      });
    }

    // Limit variants
    if (normalized.length > 100) {
      this.addWarning('variants', 'VARIANTS_TRUNCATED', `Truncated from ${normalized.length} to 100 variants`);
      return normalized.slice(0, 100);
    }

    return normalized;
  }

  private extractVariantOptions(v: RawVariant): VariantOption[] {
    const options: VariantOption[] = [];

    // From options object
    if (v.options && typeof v.options === 'object') {
      for (const [name, value] of Object.entries(v.options)) {
        if (name && value && typeof value === 'string') {
          options.push({ name: this.normalizeOptionName(name), value: value.trim() });
        }
      }
    }

    // From explicit option_name/option_value
    if (v.option_name && v.option_value) {
      options.push({
        name: this.normalizeOptionName(v.option_name),
        value: String(v.option_value).trim(),
      });
    }

    return options;
  }

  private normalizeOptionName(name: string): string {
    const normalized = name.toLowerCase().trim();
    const mapping: Record<string, string> = {
      'size': 'Size',
      'taille': 'Size',
      'color': 'Color',
      'colour': 'Color',
      'couleur': 'Color',
      'material': 'Material',
      'matière': 'Material',
      'style': 'Style',
      'type': 'Type',
    };
    return mapping[normalized] || (name.charAt(0).toUpperCase() + name.slice(1).toLowerCase());
  }

  // ============================================
  // REVIEWS NORMALIZATION
  // ============================================

  private normalizeReviews(raw: RawReview[] | null | undefined): ReviewNormalized[] | null {
    if (!Array.isArray(raw) || raw.length === 0) return null;

    const normalized: ReviewNormalized[] = [];

    for (let i = 0; i < Math.min(raw.length, 100); i++) {
      const r = raw[i];
      if (!r || typeof r !== 'object') continue;

      const rating = this.normalizeRating(r.rating);
      if (rating === null) continue; // Skip invalid reviews

      normalized.push({
        id: `review_${i}_${Date.now()}`,
        author: this.normalizeString(r.author) || 'Anonymous',
        rating,
        title: this.normalizeString(r.title),
        content: this.stripHtml(String(r.content || '')),
        date: this.normalizeDate(r.date),
        verified: r.verified === true,
        images: Array.isArray(r.images) 
          ? r.images.map(img => this.normalizeImageUrl(img)).filter(Boolean) as string[]
          : [],
      });
    }

    return normalized.length > 0 ? normalized : null;
  }

  // ============================================
  // UTILITY NORMALIZERS
  // ============================================

  private normalizeString(value: string | null | undefined): string {
    if (!value || typeof value !== 'string') return '';
    return value.trim();
  }

  private normalizeNumber(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined) return null;
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    return isNaN(num) ? null : num;
  }

  private normalizeInteger(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined) return null;
    const num = typeof value === 'number' ? Math.round(value) : parseInt(String(value));
    return isNaN(num) ? null : num;
  }

  private normalizeStock(value: number | string | null | undefined): number {
    const num = this.normalizeInteger(value);
    return num !== null && num >= 0 ? num : 0;
  }

  private normalizeRating(value: number | string | null | undefined): number | null {
    const num = this.normalizeNumber(value);
    if (num === null) return null;
    // Normalize to 0-5 scale
    if (num > 5 && num <= 10) return Math.round((num / 2) * 10) / 10;
    if (num > 10 && num <= 100) return Math.round((num / 20) * 10) / 10;
    if (num >= 0 && num <= 5) return Math.round(num * 10) / 10;
    return null;
  }

  private normalizeWeightUnit(value: string | null | undefined): string {
    if (!value) return 'kg';
    const lower = value.toLowerCase().trim();
    const mapping: Record<string, string> = {
      'kg': 'kg', 'kilogram': 'kg', 'kilograms': 'kg',
      'g': 'g', 'gram': 'g', 'grams': 'g',
      'lb': 'lb', 'lbs': 'lb', 'pound': 'lb', 'pounds': 'lb',
      'oz': 'oz', 'ounce': 'oz', 'ounces': 'oz',
    };
    return mapping[lower] || 'kg';
  }

  private normalizeAvailability(
    value: string | null | undefined,
    stock: number | string | null | undefined
  ): 'in_stock' | 'out_of_stock' | 'preorder' | 'unknown' {
    if (value && typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower.includes('in stock') || lower.includes('available') || lower === 'instock') {
        return 'in_stock';
      }
      if (lower.includes('out of stock') || lower.includes('unavailable') || lower === 'outofstock') {
        return 'out_of_stock';
      }
      if (lower.includes('preorder') || lower.includes('pre-order') || lower.includes('backorder')) {
        return 'preorder';
      }
    }

    // Infer from stock quantity
    const stockNum = this.normalizeInteger(stock);
    if (stockNum !== null) {
      return stockNum > 0 ? 'in_stock' : 'out_of_stock';
    }

    return 'unknown';
  }

  private normalizeVideoUrls(urls: string[] | null | undefined): string[] {
    if (!Array.isArray(urls)) return [];
    return urls
      .map(url => this.normalizeUrl(url))
      .filter(url => url.length > 0 && (
        url.includes('youtube') || 
        url.includes('vimeo') || 
        url.includes('.mp4') ||
        url.includes('.webm')
      ));
  }

  private normalizeUrl(url: string | null | undefined): string {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    try {
      new URL(trimmed);
      return trimmed;
    } catch {
      return '';
    }
  }

  private normalizeTags(tags: string[] | null | undefined): string[] {
    if (!Array.isArray(tags)) return [];
    return [...new Set(
      tags
        .filter(t => typeof t === 'string')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0 && t.length <= 50)
    )].slice(0, 30);
  }

  private normalizeAttributes(attrs: Record<string, string | string[]> | null | undefined): Record<string, string[]> {
    if (!attrs || typeof attrs !== 'object') return {};
    
    const result: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(attrs)) {
      if (!key || key.length > 100) continue;
      
      const values = Array.isArray(value) ? value : [value];
      const normalized = values
        .filter(v => typeof v === 'string')
        .map(v => v.trim())
        .filter(v => v.length > 0 && v.length <= 500);
      
      if (normalized.length > 0) {
        result[key] = normalized;
      }
    }
    return result;
  }

  private normalizeDate(value: string | null | undefined): string {
    if (!value || typeof value !== 'string') {
      return new Date().toISOString();
    }
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return new Date().toISOString();
      }
      return date.toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  // ============================================
  // COMPLETENESS SCORE
  // ============================================

  private calculateCompletenessScore(data: {
    title: string;
    price: number;
    images: string[];
    description: string;
    category: string;
    variants: VariantNormalized[];
    reviews: ReviewNormalized[] | null;
  }): number {
    let score = 0;
    const weights = {
      title: 20,
      price: 20,
      images: 20,
      description: 15,
      category: 10,
      variants: 10,
      reviews: 5,
    };

    // Title (0-20)
    if (data.title.length > 0) {
      score += data.title.length >= 20 ? weights.title : Math.round((data.title.length / 20) * weights.title);
    }

    // Price (0-20)
    if (data.price > 0) {
      score += weights.price;
    }

    // Images (0-20)
    if (data.images.length > 0) {
      score += Math.min(data.images.length, 5) * (weights.images / 5);
    }

    // Description (0-15)
    if (data.description.length > 0) {
      const descLength = data.description.length;
      if (descLength >= 200) score += weights.description;
      else if (descLength >= 100) score += weights.description * 0.7;
      else if (descLength >= 50) score += weights.description * 0.4;
      else score += weights.description * 0.2;
    }

    // Category (0-10)
    if (data.category !== 'uncategorized') {
      score += weights.category;
    } else {
      score += weights.category * 0.3; // Partial credit for having fallback
    }

    // Variants (0-10)
    if (data.variants.length > 0) {
      score += weights.variants;
    }

    // Reviews (0-5)
    if (data.reviews && data.reviews.length > 0) {
      score += weights.reviews;
    }

    return Math.round(score);
  }

  // ============================================
  // ERROR HELPERS
  // ============================================

  private addError(field: string, code: string, message: string, severity: 'error' | 'warning') {
    this.errors.push({ field, code, message, severity });
  }

  private addWarning(field: string, code: string, message: string) {
    this.warnings.push({ field, code, message, severity: 'warning' });
  }
}

// ============================================
// FACTORY FUNCTION
// ============================================

export function createNormalizationEngine(): NormalizationEngine {
  return new NormalizationEngine();
}

/**
 * Quick normalize function for simple use cases
 */
export function normalizeProduct(raw: RawProductData): NormalizationResult {
  const engine = new NormalizationEngine();
  return engine.normalize(raw);
}
