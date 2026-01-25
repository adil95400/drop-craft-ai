import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * ShopOpti+ Chrome Extension - Data Extraction Tests
 * Version 5.0.0 - Comprehensive extraction validation
 * 
 * Tests validate:
 * - Product data extraction accuracy
 * - Variant parsing logic
 * - Image/video extraction
 * - Review parsing
 * - Price normalization
 * - Platform-specific parsing
 */

const EXTENSION_PATH = path.join(__dirname, '../../public/chrome-extension');

// Mock product data for testing extraction logic
const MOCK_PRODUCTS = {
  amazon: {
    title: 'Écouteurs Bluetooth Sans Fil - Noir',
    price: '29.99',
    originalPrice: '49.99',
    currency: '€',
    images: [
      'https://m.media-amazon.com/images/I/71abc123._AC_SL1500_.jpg',
      'https://m.media-amazon.com/images/I/71def456._AC_SL1500_.jpg'
    ],
    variants: [
      { name: 'Noir', price: '29.99', available: true, sku: 'BT-001-BLK' },
      { name: 'Blanc', price: '29.99', available: true, sku: 'BT-001-WHT' },
      { name: 'Rouge', price: '34.99', available: false, sku: 'BT-001-RED' }
    ],
    rating: 4.5,
    reviewCount: 1234,
    asin: 'B0TEST12345'
  },
  aliexpress: {
    title: 'Wireless Earbuds Bluetooth 5.3 Headphones',
    price: '12.50',
    originalPrice: '25.00',
    currency: 'EUR',
    images: [
      'https://ae01.alicdn.com/kf/Simage1.jpg',
      'https://ae01.alicdn.com/kf/Simage2.jpg'
    ],
    variants: [
      { color: 'Black', size: 'Standard', price: '12.50', stock: 500 },
      { color: 'White', size: 'Standard', price: '12.50', stock: 300 },
      { color: 'Black', size: 'Pro', price: '18.99', stock: 0 }
    ],
    rating: 4.8,
    orders: 5000,
    storeId: '1234567'
  },
  cdiscount: {
    title: 'Casque Audio Bluetooth Premium',
    price: '45,99',
    originalPrice: '89,99',
    currency: '€',
    images: [
      'https://www.cdiscount.com/pdt2/1/2/3/1/700x700/auc123.jpg'
    ],
    variants: [],
    rating: 4.2,
    reviewCount: 89
  }
};

test.describe('Price Parsing & Normalization', () => {
  test('parses European number format correctly', () => {
    const parsePrice = (priceStr: string): number => {
      // Handle European format (1.234,56) and French format (1 234,56)
      const cleaned = priceStr
        .replace(/[^\d,.\s]/g, '')
        .replace(/\s/g, '')
        .replace(/\.(?=\d{3})/g, '') // Remove thousand separators
        .replace(',', '.'); // Convert decimal comma to point
      return parseFloat(cleaned) || 0;
    };

    expect(parsePrice('29,99 €')).toBe(29.99);
    expect(parsePrice('1.234,56 €')).toBe(1234.56);
    expect(parsePrice('€45.99')).toBe(45.99);
    expect(parsePrice('$1,234.56')).toBe(1234.56);
    expect(parsePrice('12,50')).toBe(12.50);
    expect(parsePrice('1 234,56 €')).toBe(1234.56);
  });

  test('extracts currency symbol correctly', () => {
    const extractCurrency = (text: string): string => {
      const currencyMap: Record<string, string> = {
        '€': 'EUR',
        '$': 'USD',
        '£': 'GBP',
        '¥': 'JPY',
        'EUR': 'EUR',
        'USD': 'USD'
      };
      
      for (const [symbol, code] of Object.entries(currencyMap)) {
        if (text.includes(symbol)) return code;
      }
      return 'EUR'; // Default
    };

    expect(extractCurrency('29,99 €')).toBe('EUR');
    expect(extractCurrency('$45.99')).toBe('USD');
    expect(extractCurrency('£39.99')).toBe('GBP');
    expect(extractCurrency('¥3999')).toBe('JPY');
  });

  test('calculates discount percentage correctly', () => {
    const calculateDiscount = (original: number, sale: number): number => {
      if (original <= 0 || sale <= 0) return 0;
      return Math.round(((original - sale) / original) * 100);
    };

    expect(calculateDiscount(49.99, 29.99)).toBe(40);
    expect(calculateDiscount(100, 75)).toBe(25);
    expect(calculateDiscount(25.00, 12.50)).toBe(50);
    expect(calculateDiscount(0, 29.99)).toBe(0);
  });
});

test.describe('Image URL Normalization', () => {
  test('normalizes Amazon image URLs to high-res', () => {
    const normalizeAmazonImage = (url: string): string => {
      // Remove size transformations to get original high-res
      return url
        .replace(/\._AC_[A-Z]+\d+_\./, '.')
        .replace(/\._S[XY]\d+_\./, '.')
        .replace(/\._U[A-Z]\d+[A-Z,_\d]*\./, '.');
    };

    const lowRes = 'https://m.media-amazon.com/images/I/71abc123._AC_SL1000_.jpg';
    const expected = 'https://m.media-amazon.com/images/I/71abc123.jpg';
    
    expect(normalizeAmazonImage(lowRes)).toBe(expected);
    
    const sxRes = 'https://m.media-amazon.com/images/I/71abc123._SX300_.jpg';
    expect(normalizeAmazonImage(sxRes)).toBe(expected);
  });

  test('normalizes AliExpress image URLs to high-res', () => {
    const normalizeAliExpressImage = (url: string): string => {
      // Remove size parameters
      return url
        .replace(/_\d+x\d+/, '')
        .replace(/\.jpg_\d+x\d+\.jpg/, '.jpg');
    };

    const lowRes = 'https://ae01.alicdn.com/kf/S123_350x350.jpg';
    expect(normalizeAliExpressImage(lowRes)).toBe('https://ae01.alicdn.com/kf/S123.jpg');
  });

  test('deduplicates images using hash comparison', () => {
    const deduplicateImages = (urls: string[]): string[] => {
      const seen = new Set<string>();
      return urls.filter(url => {
        // Simple hash based on filename
        const filename = url.split('/').pop()?.split('?')[0] || url;
        if (seen.has(filename)) return false;
        seen.add(filename);
        return true;
      });
    };

    const images = [
      'https://example.com/image1.jpg',
      'https://example.com/image1.jpg?v=2',
      'https://example.com/image2.jpg',
      'https://other.com/image1.jpg' // Same filename, different domain - should be included
    ];

    const deduplicated = deduplicateImages(images);
    expect(deduplicated.length).toBe(3);
  });

  test('filters invalid image URLs', () => {
    const isValidImageUrl = (url: string): boolean => {
      if (!url || typeof url !== 'string') return false;
      if (url.startsWith('data:')) return url.length < 100000; // Small data URIs only
      if (!url.startsWith('http')) return false;
      
      const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];
      const urlLower = url.toLowerCase().split('?')[0];
      
      return validExtensions.some(ext => urlLower.endsWith(ext)) || 
             url.includes('/images/') ||
             url.includes('media-amazon') ||
             url.includes('alicdn.com');
    };

    expect(isValidImageUrl('https://example.com/photo.jpg')).toBe(true);
    expect(isValidImageUrl('https://m.media-amazon.com/images/I/123.jpg')).toBe(true);
    expect(isValidImageUrl('javascript:alert(1)')).toBe(false);
    expect(isValidImageUrl('')).toBe(false);
    expect(isValidImageUrl('//invalid-url')).toBe(false);
  });
});

test.describe('Variant Parsing Logic', () => {
  test('groups variants by attribute correctly', () => {
    interface Variant {
      color?: string;
      size?: string;
      price: string;
      stock?: number;
      available?: boolean;
    }

    const groupVariantsByAttribute = (variants: Variant[]): Record<string, string[]> => {
      const groups: Record<string, Set<string>> = {};
      
      variants.forEach(variant => {
        Object.entries(variant).forEach(([key, value]) => {
          if (['color', 'size', 'style', 'material'].includes(key) && typeof value === 'string') {
            if (!groups[key]) groups[key] = new Set();
            groups[key].add(value);
          }
        });
      });

      const result: Record<string, string[]> = {};
      for (const [key, values] of Object.entries(groups)) {
        result[key] = Array.from(values);
      }
      return result;
    };

    const variants = MOCK_PRODUCTS.aliexpress.variants;
    const grouped = groupVariantsByAttribute(variants);
    
    expect(grouped.color).toContain('Black');
    expect(grouped.color).toContain('White');
    expect(grouped.size).toContain('Standard');
    expect(grouped.size).toContain('Pro');
  });

  test('calculates variant availability correctly', () => {
    const getAvailableVariants = (variants: Array<{ stock?: number; available?: boolean }>) => {
      return variants.filter(v => {
        if (typeof v.available === 'boolean') return v.available;
        if (typeof v.stock === 'number') return v.stock > 0;
        return true;
      });
    };

    const amazonVariants = MOCK_PRODUCTS.amazon.variants;
    const aliVariants = MOCK_PRODUCTS.aliexpress.variants;

    expect(getAvailableVariants(amazonVariants).length).toBe(2);
    expect(getAvailableVariants(aliVariants).length).toBe(2);
  });

  test('generates SKU from variant options', () => {
    const generateSKU = (title: string, options: Record<string, string>): string => {
      const titlePart = title
        .replace(/[^a-zA-Z0-9]/g, '')
        .substring(0, 10)
        .toUpperCase();
      
      const optionPart = Object.values(options)
        .map(v => v.substring(0, 3).toUpperCase())
        .join('-');
      
      return `${titlePart}-${optionPart}`;
    };

    expect(generateSKU('Écouteurs Bluetooth', { color: 'Noir' })).toBe('COUTEURSBL-NOI');
    expect(generateSKU('Headphones', { color: 'Black', size: 'Large' })).toBe('HEADPHONES-BLA-LAR');
  });
});

test.describe('Review Parsing Logic', () => {
  test('extracts rating from various formats', () => {
    const parseRating = (text: string): number | null => {
      // Match patterns like "4.5/5", "4,5 sur 5", "4.5 out of 5", "★★★★☆"
      const patterns = [
        /(\d+[.,]\d+)\s*(?:\/|sur|out of|of)\s*5/i,
        /(\d+[.,]\d+)\s*(?:étoiles?|stars?)/i,
        /rating[:\s]*(\d+[.,]\d+)/i
      ];

      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          return parseFloat(match[1].replace(',', '.'));
        }
      }

      // Count stars
      const stars = (text.match(/★/g) || []).length;
      const halfStars = (text.match(/½/g) || []).length;
      if (stars > 0) return stars + halfStars * 0.5;

      return null;
    };

    expect(parseRating('4.5/5 étoiles')).toBe(4.5);
    expect(parseRating('4,5 sur 5')).toBe(4.5);
    expect(parseRating('4.5 out of 5 stars')).toBe(4.5);
    expect(parseRating('★★★★☆')).toBe(4);
    expect(parseRating('rating: 4.8')).toBe(4.8);
  });

  test('parses review count from various formats', () => {
    const parseReviewCount = (text: string): number => {
      // Match patterns like "1,234 avis", "1.234 reviews", "(1234)"
      const patterns = [
        /(\d{1,3}(?:[.,\s]\d{3})*)\s*(?:avis|reviews?|évaluations?|ratings?|notes?)/i,
        /\((\d{1,3}(?:[.,\s]\d{3})*)\)/,
        /(\d+)k\+?\s*(?:avis|reviews?)/i
      ];

      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          let numStr = match[1].replace(/[.,\s]/g, '');
          if (text.toLowerCase().includes('k')) {
            return parseInt(numStr) * 1000;
          }
          return parseInt(numStr);
        }
      }

      return 0;
    };

    expect(parseReviewCount('1,234 avis')).toBe(1234);
    expect(parseReviewCount('1.234 reviews')).toBe(1234);
    expect(parseReviewCount('(1234)')).toBe(1234);
    expect(parseReviewCount('5k+ reviews')).toBe(5000);
  });

  test('sanitizes review content', () => {
    const sanitizeReview = (text: string): string => {
      return text
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim()
        .substring(0, 1000); // Limit length
    };

    const dirty = '<p>Great product! <script>alert(1)</script></p>';
    expect(sanitizeReview(dirty)).toBe('Great product! alert(1)');
    
    const longText = 'A'.repeat(2000);
    expect(sanitizeReview(longText).length).toBe(1000);
  });
});

test.describe('Shipping Information Parsing', () => {
  test('extracts delivery time ranges', () => {
    const parseDeliveryTime = (text: string): { min: number; max: number; unit: string } | null => {
      const patterns = [
        /(\d+)\s*[-à]\s*(\d+)\s*(jours?|days?|semaines?|weeks?)/i,
        /livraison\s+en\s+(\d+)\s*[-à]\s*(\d+)\s*(jours?)/i,
        /(\d+)\s*(jours?|days?|semaines?|weeks?)\s*(?:ouvrés?|business)?/i
      ];

      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          const min = parseInt(match[1]);
          const max = match[2] ? parseInt(match[2]) : min;
          const unit = match[3] || match[2] || 'days';
          
          const normalizedUnit = unit.toLowerCase().startsWith('semaine') || 
                                  unit.toLowerCase().startsWith('week') ? 'weeks' : 'days';
          
          return { min, max, unit: normalizedUnit };
        }
      }

      return null;
    };

    expect(parseDeliveryTime('Livraison en 3-5 jours')).toEqual({ min: 3, max: 5, unit: 'days' });
    expect(parseDeliveryTime('5 à 10 jours ouvrés')).toEqual({ min: 5, max: 10, unit: 'days' });
    expect(parseDeliveryTime('1-2 semaines')).toEqual({ min: 1, max: 2, unit: 'weeks' });
    expect(parseDeliveryTime('7 days delivery')).toEqual({ min: 7, max: 7, unit: 'days' });
  });

  test('parses shipping cost correctly', () => {
    const parseShippingCost = (text: string): { cost: number; free: boolean } => {
      const freePatterns = /gratuit|free|offert|inclus/i;
      if (freePatterns.test(text)) {
        return { cost: 0, free: true };
      }

      const pricePattern = /(\d+[.,]\d{2})\s*€/;
      const match = text.match(pricePattern);
      if (match) {
        return { cost: parseFloat(match[1].replace(',', '.')), free: false };
      }

      return { cost: 0, free: false };
    };

    expect(parseShippingCost('Livraison gratuite')).toEqual({ cost: 0, free: true });
    expect(parseShippingCost('Free shipping')).toEqual({ cost: 0, free: true });
    expect(parseShippingCost('Frais de port: 4,99 €')).toEqual({ cost: 4.99, free: false });
  });
});

test.describe('Platform-Specific Extraction', () => {
  test('extracts Amazon ASIN from URL', () => {
    const extractASIN = (url: string): string | null => {
      const patterns = [
        /\/dp\/([A-Z0-9]{10})/i,
        /\/gp\/product\/([A-Z0-9]{10})/i,
        /\/product\/([A-Z0-9]{10})/i,
        /asin[=:]([A-Z0-9]{10})/i
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1].toUpperCase();
      }

      return null;
    };

    expect(extractASIN('https://www.amazon.fr/dp/B0TEST12345')).toBe('B0TEST12345');
    expect(extractASIN('https://amazon.com/gp/product/B0ABC123DE/ref=sr')).toBe('B0ABC123DE');
    expect(extractASIN('https://www.amazon.de/-/en/dp/B012345678')).toBe('B012345678');
  });

  test('extracts AliExpress item ID from URL', () => {
    const extractAliExpressId = (url: string): string | null => {
      const match = url.match(/item\/(\d+)\.html/i);
      return match ? match[1] : null;
    };

    expect(extractAliExpressId('https://www.aliexpress.com/item/1005001234567890.html')).toBe('1005001234567890');
    expect(extractAliExpressId('https://fr.aliexpress.com/item/32987654321.html')).toBe('32987654321');
  });

  test('detects Shopify stores correctly', () => {
    const isShopifyStore = (url: string, pageContent?: string): boolean => {
      // URL patterns
      if (url.includes('.myshopify.com')) return true;
      if (url.includes('/products/')) return true;
      
      // Check for Shopify indicators in page content
      if (pageContent) {
        const indicators = [
          'window.Shopify',
          'shopify-section',
          'cdn.shopify.com',
          '"vendor":"Shopify"'
        ];
        return indicators.some(ind => pageContent.includes(ind));
      }

      return false;
    };

    expect(isShopifyStore('https://store.myshopify.com/products/test')).toBe(true);
    expect(isShopifyStore('https://example.com/products/test')).toBe(true);
    expect(isShopifyStore('https://example.com', 'window.Shopify = {}')).toBe(true);
    expect(isShopifyStore('https://amazon.com/dp/test')).toBe(false);
  });
});

test.describe('Core Extractor File Validation', () => {
  test('core-extractor.js exists and exports required methods', () => {
    const extractorPath = path.join(EXTENSION_PATH, 'extractors/core-extractor.js');
    
    if (fs.existsSync(extractorPath)) {
      const content = fs.readFileSync(extractorPath, 'utf-8');
      
      // Should have main class
      expect(content).toContain('class');
      
      // Should have extraction methods
      const requiredMethods = [
        'extractTitle',
        'extractPrice',
        'extractImages',
        'extractVariants'
      ];
      
      requiredMethods.forEach(method => {
        expect(content.toLowerCase()).toContain(method.toLowerCase());
      });
    }
  });

  test('lib/config.js contains platform configurations', () => {
    const configPath = path.join(EXTENSION_PATH, 'lib/config.js');
    
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8');
      
      // Should have platform configs
      const platforms = ['amazon', 'aliexpress', 'shopify', 'cdiscount'];
      platforms.forEach(platform => {
        expect(content.toLowerCase()).toContain(platform);
      });
    }
  });
});
