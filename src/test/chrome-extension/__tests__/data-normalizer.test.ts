/**
 * Tests for ShopOpti+ Data Normalizer v5.7.0
 * Normalizes product data from any platform into unified ShopOpti format
 */
import { describe, it, expect, beforeEach } from 'vitest';

// Simplified DataNormalizer for testing
class DataNormalizer {
  parseNumber(value: unknown): number {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return NaN;

    let clean = value.replace(/[€$£¥₹\s]/g, '');
    
    // Handle European format (1.234,56)
    if (clean.match(/^\d{1,3}(\.\d{3})*,\d{2}$/)) {
      clean = clean.replace(/\./g, '').replace(',', '.');
    }
    // Handle standard format with comma as thousands (1,234.56)
    else if (clean.match(/^\d{1,3}(,\d{3})*(\.\d{2})?$/)) {
      clean = clean.replace(/,/g, '');
    }
    // Handle simple comma decimal (12,50)
    else if (clean.match(/^\d+,\d+$/)) {
      clean = clean.replace(',', '.');
    }

    return parseFloat(clean);
  }

  normalizeUrl(url: string): string | null {
    if (!url) return null;
    if (url.startsWith('//')) return 'https:' + url;
    if (!url.startsWith('http')) return null;
    return url;
  }

  normalizeImages(images: unknown): string[] {
    if (!Array.isArray(images)) {
      images = images ? [images] : [];
    }

    return (images as unknown[])
      .map(img => {
        if (typeof img === 'string') return img;
        if (typeof img === 'object' && img !== null) {
          const imgObj = img as Record<string, unknown>;
          return imgObj.src || imgObj.url || imgObj.image;
        }
        return null;
      })
      .filter((url): url is string => url !== null && typeof url === 'string')
      .map(url => this.normalizeUrl(url))
      .filter((url, index, self): url is string => 
        url !== null && self.indexOf(url) === index
      )
      .slice(0, 50);
  }

  normalizeVariants(variants: unknown): Array<{
    id: string;
    title: string;
    price: number;
    sku: string;
    available: boolean;
    options: Record<string, string>;
  }> {
    if (!Array.isArray(variants)) return [];

    return variants.map((variant, index) => {
      const v = variant as Record<string, unknown>;
      return {
        id: String(v.id || v.sku || `variant_${index}`),
        title: String(v.title || v.name || this.buildVariantTitle(v)),
        price: this.parseNumber(v.price) || 0,
        sku: String(v.sku || ''),
        available: v.available !== false && v.in_stock !== false,
        options: this.extractVariantOptions(v)
      };
    }).slice(0, 100);
  }

  buildVariantTitle(variant: Record<string, unknown>): string {
    const options: string[] = [];
    ['option1', 'option2', 'option3', 'size', 'color', 'style'].forEach(key => {
      if (variant[key]) options.push(String(variant[key]));
    });
    return options.join(' / ') || 'Default';
  }

  extractVariantOptions(variant: Record<string, unknown>): Record<string, string> {
    const options: Record<string, string> = {};
    const optionKeys = ['size', 'color', 'style', 'material'];
    
    optionKeys.forEach(key => {
      if (variant[key]) {
        options[key] = String(variant[key]);
      }
    });

    return options;
  }

  normalizeReviews(reviews: unknown): Array<{
    id: string;
    author: string;
    rating: number;
    content: string;
    verified: boolean;
  }> {
    if (!Array.isArray(reviews)) return [];

    return reviews
      .filter(review => {
        const r = review as Record<string, unknown>;
        return r && (r.content || r.text || r.body);
      })
      .map((review, index) => {
        const r = review as Record<string, unknown>;
        return {
          id: String(r.id || `review_${index}`),
          author: String(r.author || r.reviewer || r.name || 'Anonymous'),
          rating: Math.min(5, Math.max(0, this.parseNumber(r.rating) || 5)),
          content: String(r.content || r.text || r.body || '').substring(0, 5000),
          verified: r.verified !== false
        };
      })
      .slice(0, 100);
  }

  cleanTitle(title: string): string {
    return title
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-'&àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ]/gi, '')
      .trim()
      .substring(0, 500);
  }

  cleanDescription(description: string): string {
    let clean = description.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    clean = clean.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    clean = clean.replace(/\s+/g, ' ').trim();
    return clean.substring(0, 50000);
  }

  generateExternalId(url: string, platform: string): string {
    const patterns: Record<string, RegExp> = {
      aliexpress: /\/item\/(\d+)/,
      amazon: /\/dp\/([A-Z0-9]{10})/,
      ebay: /\/itm\/(\d+)/,
      shopify: /\/products\/([^/?]+)/,
      temu: /\/goods\/(\d+)/
    };

    const pattern = patterns[platform];
    if (pattern) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return this.hashString(url);
  }

  hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  normalize(rawData: Record<string, unknown>, platform: string) {
    return {
      platform,
      external_id: this.generateExternalId(String(rawData.url || ''), platform),
      url: String(rawData.url || ''),
      title: this.cleanTitle(String(rawData.title || rawData.name || '')),
      description: this.cleanDescription(String(rawData.description || rawData.body_html || '')),
      price: this.parseNumber(rawData.price) || 0,
      original_price: this.parseNumber(rawData.original_price),
      currency: String(rawData.currency || 'EUR'),
      images: this.normalizeImages(rawData.images),
      variants: this.normalizeVariants(rawData.variants),
      reviews: this.normalizeReviews(rawData.reviews),
      brand: String(rawData.brand || rawData.vendor || ''),
      category: String(rawData.category || rawData.product_type || ''),
      sku: String(rawData.sku || ''),
      extracted_at: new Date().toISOString(),
      extractor_version: '5.7.0'
    };
  }
}

describe('DataNormalizer', () => {
  let normalizer: DataNormalizer;

  beforeEach(() => {
    normalizer = new DataNormalizer();
  });

  describe('parseNumber', () => {
    it('should parse standard decimal numbers', () => {
      expect(normalizer.parseNumber('29.99')).toBe(29.99);
      expect(normalizer.parseNumber('100')).toBe(100);
    });

    it('should parse European format numbers', () => {
      expect(normalizer.parseNumber('1.234,56')).toBe(1234.56);
      expect(normalizer.parseNumber('29,99')).toBe(29.99);
    });

    it('should parse numbers with currency symbols', () => {
      expect(normalizer.parseNumber('€29.99')).toBe(29.99);
      expect(normalizer.parseNumber('$100')).toBe(100);
      expect(normalizer.parseNumber('£49.99')).toBe(49.99);
    });

    it('should parse numbers with thousand separators', () => {
      expect(normalizer.parseNumber('1,234.56')).toBe(1234.56);
      expect(normalizer.parseNumber('10,000')).toBe(10000);
    });

    it('should return number if already a number', () => {
      expect(normalizer.parseNumber(29.99)).toBe(29.99);
    });

    it('should return NaN for invalid input', () => {
      expect(normalizer.parseNumber('invalid')).toBeNaN();
      expect(normalizer.parseNumber(null)).toBeNaN();
    });
  });

  describe('normalizeUrl', () => {
    it('should return valid http URLs unchanged', () => {
      expect(normalizer.normalizeUrl('https://example.com/img.jpg')).toBe('https://example.com/img.jpg');
      expect(normalizer.normalizeUrl('http://example.com/img.jpg')).toBe('http://example.com/img.jpg');
    });

    it('should add https: to protocol-relative URLs', () => {
      expect(normalizer.normalizeUrl('//cdn.example.com/img.jpg')).toBe('https://cdn.example.com/img.jpg');
    });

    it('should return null for invalid URLs', () => {
      expect(normalizer.normalizeUrl('/local/path.jpg')).toBeNull();
      expect(normalizer.normalizeUrl('data:image/png;base64')).toBeNull();
      expect(normalizer.normalizeUrl('')).toBeNull();
    });
  });

  describe('normalizeImages', () => {
    it('should handle array of URL strings', () => {
      const images = ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'];
      const result = normalizer.normalizeImages(images);

      expect(result).toHaveLength(2);
      expect(result[0]).toBe('https://example.com/img1.jpg');
    });

    it('should handle array of image objects', () => {
      const images = [
        { src: 'https://example.com/img1.jpg' },
        { url: 'https://example.com/img2.jpg' }
      ];
      const result = normalizer.normalizeImages(images);

      expect(result).toHaveLength(2);
    });

    it('should remove duplicates', () => {
      const images = [
        'https://example.com/img1.jpg',
        'https://example.com/img1.jpg',
        'https://example.com/img2.jpg'
      ];
      const result = normalizer.normalizeImages(images);

      expect(result).toHaveLength(2);
    });

    it('should limit to 50 images', () => {
      const images = Array(100).fill('https://example.com/img.jpg').map((url, i) => `${url}?${i}`);
      const result = normalizer.normalizeImages(images);

      expect(result).toHaveLength(50);
    });

    it('should handle single image as input', () => {
      const result = normalizer.normalizeImages('https://example.com/img.jpg');

      expect(result).toHaveLength(1);
    });

    it('should filter out invalid URLs', () => {
      const images = [
        'https://example.com/valid.jpg',
        '/invalid/path.jpg',
        'https://example.com/another.jpg'
      ];
      const result = normalizer.normalizeImages(images);

      expect(result).toHaveLength(2);
    });
  });

  describe('normalizeVariants', () => {
    it('should normalize variant array with all fields', () => {
      const variants = [{
        id: 'var1',
        title: 'Small / Red',
        price: 29.99,
        sku: 'SKU-001',
        size: 'Small',
        color: 'Red'
      }];

      const result = normalizer.normalizeVariants(variants);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'var1',
        title: 'Small / Red',
        price: 29.99,
        sku: 'SKU-001'
      });
    });

    it('should build title from options when missing', () => {
      const variants = [{
        price: 29.99,
        size: 'Large',
        color: 'Blue'
      }];

      const result = normalizer.normalizeVariants(variants);

      expect(result[0].title).toContain('Large');
      expect(result[0].title).toContain('Blue');
    });

    it('should limit to 100 variants', () => {
      const variants = Array(150).fill({
        title: 'Variant',
        price: 29.99
      });

      const result = normalizer.normalizeVariants(variants);

      expect(result).toHaveLength(100);
    });

    it('should return empty array for non-array input', () => {
      expect(normalizer.normalizeVariants(null)).toEqual([]);
      expect(normalizer.normalizeVariants('invalid')).toEqual([]);
    });
  });

  describe('normalizeReviews', () => {
    it('should normalize review array', () => {
      const reviews = [{
        author: 'John Doe',
        rating: 5,
        content: 'Great product!'
      }];

      const result = normalizer.normalizeReviews(reviews);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        author: 'John Doe',
        rating: 5,
        content: 'Great product!',
        verified: true
      });
    });

    it('should handle alternative content fields', () => {
      const reviews = [
        { author: 'User1', text: 'Good', rating: 4 },
        { reviewer: 'User2', body: 'Nice', rating: 5 }
      ];

      const result = normalizer.normalizeReviews(reviews);

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('Good');
      expect(result[1].author).toBe('User2');
    });

    it('should clamp rating between 0 and 5', () => {
      const reviews = [
        { content: 'Review 1', rating: 10 },
        { content: 'Review 2', rating: -2 }
      ];

      const result = normalizer.normalizeReviews(reviews);

      expect(result[0].rating).toBe(5);
      expect(result[1].rating).toBe(0);
    });

    it('should filter out reviews without content', () => {
      const reviews = [
        { author: 'User1', content: 'Has content' },
        { author: 'User2' },
        { author: 'User3', text: 'Also has content' }
      ];

      const result = normalizer.normalizeReviews(reviews);

      expect(result).toHaveLength(2);
    });

    it('should limit to 100 reviews', () => {
      const reviews = Array(150).fill({
        author: 'User',
        content: 'Review text'
      });

      const result = normalizer.normalizeReviews(reviews);

      expect(result).toHaveLength(100);
    });
  });

  describe('cleanTitle', () => {
    it('should normalize whitespace', () => {
      expect(normalizer.cleanTitle('Product   Title   Test')).toBe('Product Title Test');
    });

    it('should remove special characters', () => {
      expect(normalizer.cleanTitle('Product™ Title® Test©')).toBe('Product Title Test');
    });

    it('should preserve accented characters', () => {
      expect(normalizer.cleanTitle('Café élégant')).toBe('Café élégant');
    });

    it('should limit to 500 characters', () => {
      const longTitle = 'A'.repeat(600);
      expect(normalizer.cleanTitle(longTitle).length).toBe(500);
    });
  });

  describe('cleanDescription', () => {
    it('should remove script tags', () => {
      const description = 'Hello <script>alert("xss")</script> World';
      expect(normalizer.cleanDescription(description)).toBe('Hello  World');
    });

    it('should remove style tags', () => {
      const description = 'Hello <style>.class{color:red}</style> World';
      expect(normalizer.cleanDescription(description)).toBe('Hello World');
    });

    it('should normalize whitespace', () => {
      expect(normalizer.cleanDescription('Hello    World')).toBe('Hello World');
    });

    it('should limit to 50000 characters', () => {
      const longDesc = 'A'.repeat(60000);
      expect(normalizer.cleanDescription(longDesc).length).toBe(50000);
    });
  });

  describe('generateExternalId', () => {
    it('should extract Amazon ASIN from URL', () => {
      const url = 'https://www.amazon.com/dp/B08N5WRWNW';
      expect(normalizer.generateExternalId(url, 'amazon')).toBe('B08N5WRWNW');
    });

    it('should extract AliExpress item ID from URL', () => {
      const url = 'https://www.aliexpress.com/item/1005001234567890.html';
      expect(normalizer.generateExternalId(url, 'aliexpress')).toBe('1005001234567890');
    });

    it('should extract eBay item ID from URL', () => {
      const url = 'https://www.ebay.com/itm/123456789012';
      expect(normalizer.generateExternalId(url, 'ebay')).toBe('123456789012');
    });

    it('should extract Shopify product handle from URL', () => {
      const url = 'https://store.myshopify.com/products/awesome-product';
      expect(normalizer.generateExternalId(url, 'shopify')).toBe('awesome-product');
    });

    it('should generate hash for unknown platforms', () => {
      const url = 'https://unknown-store.com/product/123';
      const result = normalizer.generateExternalId(url, 'unknown');

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });

  describe('normalize', () => {
    it('should normalize complete AliExpress product', () => {
      const rawData = {
        title: 'Test Product',
        price: '29.99',
        url: 'https://www.aliexpress.com/item/1234567890.html',
        description: 'A great product description',
        images: ['https://img.aliexpress.com/img1.jpg'],
        brand: 'Test Brand',
        category: 'Electronics',
        variants: [{ title: 'Default', price: 29.99 }]
      };

      const result = normalizer.normalize(rawData, 'aliexpress');

      expect(result).toMatchObject({
        platform: 'aliexpress',
        title: 'Test Product',
        price: 29.99,
        currency: 'EUR',
        extractor_version: '5.7.0'
      });
      expect(result.extracted_at).toBeTruthy();
    });

    it('should handle Shopify product format', () => {
      const rawData = {
        title: 'Shopify Product',
        body_html: '<p>Product description</p>',
        vendor: 'Shop Vendor',
        product_type: 'Clothing',
        price: 49.99,
        url: 'https://shop.myshopify.com/products/test'
      };

      const result = normalizer.normalize(rawData, 'shopify');

      expect(result.title).toBe('Shopify Product');
      expect(result.description).toContain('Product description');
      expect(result.brand).toBe('Shop Vendor');
      expect(result.category).toBe('Clothing');
    });
  });
});
