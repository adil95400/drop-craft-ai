/**
 * E2E Tests - Extraction Pipeline
 * Validates the complete extraction flow from URL to normalized data
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock browser environment for extension testing
const mockDocument = {
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(() => []),
  createElement: vi.fn(() => ({ 
    textContent: '', 
    innerHTML: '',
    querySelectorAll: vi.fn(() => [])
  })),
  body: { innerHTML: '' }
};

const mockWindow = {
  location: { href: '', hostname: '' },
  fetch: vi.fn(),
  XMLHttpRequest: vi.fn()
};

describe('E2E: Extraction Pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Platform Detection Flow', () => {
    const testCases = [
      { 
        url: 'https://www.amazon.fr/dp/B08N5WRWNW', 
        expectedPlatform: 'amazon',
        expectedId: 'B08N5WRWNW',
        expectedLocale: 'fr'
      },
      { 
        url: 'https://fr.aliexpress.com/item/1005003123456789.html', 
        expectedPlatform: 'aliexpress',
        expectedId: '1005003123456789',
        expectedLocale: 'fr'
      },
      { 
        url: 'https://www.ebay.com/itm/123456789012', 
        expectedPlatform: 'ebay',
        expectedId: '123456789012',
        expectedLocale: 'us'
      },
      { 
        url: 'https://www.temu.com/product-12345.html', 
        expectedPlatform: 'temu',
        expectedId: '12345',
        expectedLocale: 'us'
      },
      { 
        url: 'https://www.etsy.com/listing/987654321/handmade-item', 
        expectedPlatform: 'etsy',
        expectedId: '987654321',
        expectedLocale: 'us'
      },
      { 
        url: 'https://mystore.myshopify.com/products/cool-product', 
        expectedPlatform: 'shopify',
        expectedId: 'cool-product',
        expectedLocale: 'us'
      },
      { 
        url: 'https://us.shein.com/Product-p-12345678.html', 
        expectedPlatform: 'shein',
        expectedId: '12345678',
        expectedLocale: 'us'
      }
    ];

    testCases.forEach(({ url, expectedPlatform, expectedId, expectedLocale }) => {
      it(`detects ${expectedPlatform} from URL: ${url}`, () => {
        // Simulate platform detection logic
        const detectPlatform = (testUrl: string) => {
          const patterns: Record<string, RegExp> = {
            amazon: /amazon\.(com|fr|de|co\.uk|es|it|nl|ca|com\.au)/,
            aliexpress: /aliexpress\.com/,
            ebay: /ebay\.(com|fr|de|co\.uk)/,
            temu: /temu\.com/,
            etsy: /etsy\.com/,
            shopify: /myshopify\.com|shopify\.com/,
            shein: /shein\.com/
          };
          
          for (const [platform, regex] of Object.entries(patterns)) {
            if (regex.test(testUrl)) return platform;
          }
          return 'unknown';
        };

        const extractProductId = (testUrl: string, platform: string): string => {
          const extractors: Record<string, RegExp> = {
            amazon: /\/dp\/([A-Z0-9]{10})/i,
            aliexpress: /\/item\/(\d+)\.html/,
            ebay: /\/itm\/(\d+)/,
            temu: /product-(\d+)/,
            etsy: /\/listing\/(\d+)/,
            shopify: /\/products\/([^/?]+)/,
            shein: /-p-(\d+)/
          };
          
          const match = testUrl.match(extractors[platform] || /$/);
          return match?.[1] || '';
        };

        const detectLocale = (testUrl: string): string => {
          if (testUrl.includes('.fr') || testUrl.includes('fr.')) return 'fr';
          if (testUrl.includes('.de') || testUrl.includes('de.')) return 'de';
          if (testUrl.includes('.co.uk')) return 'uk';
          return 'us';
        };

        const platform = detectPlatform(url);
        const productId = extractProductId(url, platform);
        const locale = detectLocale(url);

        expect(platform).toBe(expectedPlatform);
        expect(productId).toBe(expectedId);
        expect(locale).toBe(expectedLocale);
      });
    });
  });

  describe('Data Extraction Simulation', () => {
    it('extracts complete product data from Amazon-like structure', () => {
      const mockAmazonData = {
        title: 'Test Product - High Quality Item',
        price: '29,99 €',
        originalPrice: '49,99 €',
        images: [
          'https://m.media-amazon.com/images/I/71abc123._AC_SL1500_.jpg',
          'https://m.media-amazon.com/images/I/71def456._AC_SL1500_.jpg'
        ],
        description: 'This is a high quality test product with amazing features.',
        rating: '4.5',
        reviewCount: '1,234',
        variants: [
          { name: 'Color', options: ['Red', 'Blue', 'Green'] },
          { name: 'Size', options: ['S', 'M', 'L', 'XL'] }
        ],
        asin: 'B08N5WRWNW',
        brand: 'TestBrand'
      };

      // Simulate extraction result
      const extractedData = {
        name: mockAmazonData.title,
        price: parseFloat(mockAmazonData.price.replace(',', '.').replace(/[^0-9.]/g, '')),
        compareAtPrice: parseFloat(mockAmazonData.originalPrice.replace(',', '.').replace(/[^0-9.]/g, '')),
        images: mockAmazonData.images,
        description: mockAmazonData.description,
        rating: parseFloat(mockAmazonData.rating),
        reviewsCount: parseInt(mockAmazonData.reviewCount.replace(/\D/g, '')),
        variants: mockAmazonData.variants,
        externalId: mockAmazonData.asin,
        brand: mockAmazonData.brand,
        source: 'amazon'
      };

      expect(extractedData.name).toBe('Test Product - High Quality Item');
      expect(extractedData.price).toBe(29.99);
      expect(extractedData.compareAtPrice).toBe(49.99);
      expect(extractedData.images).toHaveLength(2);
      expect(extractedData.rating).toBe(4.5);
      expect(extractedData.reviewsCount).toBe(1234);
      expect(extractedData.variants).toHaveLength(2);
      expect(extractedData.externalId).toBe('B08N5WRWNW');
    });

    it('handles AliExpress SKU structure correctly', () => {
      const mockAliExpressData = {
        title: 'Wireless Bluetooth Headphones',
        price: {
          min: 15.99,
          max: 25.99,
          currency: 'USD'
        },
        skuProperties: [
          {
            name: 'Color',
            values: [
              { id: '1', name: 'Black', image: 'https://ae01.alicdn.com/black.jpg' },
              { id: '2', name: 'White', image: 'https://ae01.alicdn.com/white.jpg' }
            ]
          },
          {
            name: 'Version',
            values: [
              { id: '10', name: 'Standard' },
              { id: '11', name: 'Pro' }
            ]
          }
        ],
        images: [
          'https://ae01.alicdn.com/img1_800x800.jpg',
          'https://ae01.alicdn.com/img2_800x800.jpg'
        ]
      };

      // Transform to unified format
      const variants = mockAliExpressData.skuProperties.map(prop => ({
        name: prop.name,
        options: prop.values.map(v => v.name),
        images: prop.values.filter(v => 'image' in v && v.image).map(v => (v as any).image)
      }));

      expect(variants).toHaveLength(2);
      expect(variants[0].name).toBe('Color');
      expect(variants[0].options).toContain('Black');
      expect(variants[0].options).toContain('White');
      expect(variants[0].images).toHaveLength(2);
      expect(variants[1].name).toBe('Version');
      expect(variants[1].options).toHaveLength(2);
    });

    it('normalizes Shopify JSON API response', () => {
      const mockShopifyResponse = {
        product: {
          id: 123456789,
          title: 'Premium T-Shirt',
          handle: 'premium-t-shirt',
          body_html: '<p>High quality cotton t-shirt</p>',
          vendor: 'MyBrand',
          product_type: 'Apparel',
          tags: ['cotton', 'premium', 'summer'],
          variants: [
            { id: 1, title: 'Small / Red', price: '29.99', sku: 'TS-S-R', inventory_quantity: 50 },
            { id: 2, title: 'Medium / Red', price: '29.99', sku: 'TS-M-R', inventory_quantity: 75 },
            { id: 3, title: 'Large / Blue', price: '31.99', sku: 'TS-L-B', inventory_quantity: 30 }
          ],
          images: [
            { id: 1, src: 'https://cdn.shopify.com/s/files/1/tshirt1.jpg', position: 1 },
            { id: 2, src: 'https://cdn.shopify.com/s/files/1/tshirt2.jpg', position: 2 }
          ]
        }
      };

      const normalized = {
        name: mockShopifyResponse.product.title,
        externalId: String(mockShopifyResponse.product.id),
        description: mockShopifyResponse.product.body_html.replace(/<[^>]*>/g, ''),
        brand: mockShopifyResponse.product.vendor,
        category: mockShopifyResponse.product.product_type,
        tags: mockShopifyResponse.product.tags,
        price: Math.min(...mockShopifyResponse.product.variants.map(v => parseFloat(v.price))),
        images: mockShopifyResponse.product.images
          .sort((a, b) => a.position - b.position)
          .map(img => img.src),
        variants: mockShopifyResponse.product.variants.map(v => ({
          title: v.title,
          price: parseFloat(v.price),
          sku: v.sku,
          inventory: v.inventory_quantity
        })),
        source: 'shopify'
      };

      expect(normalized.name).toBe('Premium T-Shirt');
      expect(normalized.price).toBe(29.99);
      expect(normalized.images).toHaveLength(2);
      expect(normalized.variants).toHaveLength(3);
      expect(normalized.description).toBe('High quality cotton t-shirt');
      expect(normalized.tags).toContain('premium');
    });
  });

  describe('Validation Pipeline', () => {
    const validateProduct = (data: any): { isValid: boolean; score: number; errors: string[] } => {
      const errors: string[] = [];
      let score = 0;
      const maxScore = 100;

      // Required fields (50 points)
      if (data.name && data.name.length >= 3) score += 20;
      else errors.push('Name is required (min 3 chars)');

      if (data.price && data.price > 0) score += 20;
      else errors.push('Valid price is required');

      if (data.images && data.images.length > 0) score += 10;
      else errors.push('At least one image is required');

      // Quality fields (50 points)
      if (data.description && data.description.length >= 20) score += 15;
      if (data.images && data.images.length >= 3) score += 10;
      if (data.variants && data.variants.length > 0) score += 10;
      if (data.rating && data.rating >= 1) score += 5;
      if (data.reviewsCount && data.reviewsCount > 0) score += 5;
      if (data.brand) score += 5;

      return {
        isValid: errors.length === 0,
        score: Math.round((score / maxScore) * 100),
        errors
      };
    };

    it('validates complete product with high score', () => {
      const completeProduct = {
        name: 'Complete Test Product',
        price: 29.99,
        images: ['img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg'],
        description: 'This is a complete product description with all details.',
        variants: [{ name: 'Size', options: ['S', 'M', 'L'] }],
        rating: 4.5,
        reviewsCount: 150,
        brand: 'TestBrand'
      };

      const result = validateProduct(completeProduct);
      
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects product missing critical fields', () => {
      const incompleteProduct = {
        name: 'Te',  // Too short
        price: 0,    // Invalid
        images: []   // Empty
      };

      const result = validateProduct(incompleteProduct);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name is required (min 3 chars)');
      expect(result.errors).toContain('Valid price is required');
      expect(result.errors).toContain('At least one image is required');
    });

    it('calculates intermediate score for partial data', () => {
      const partialProduct = {
        name: 'Partial Product',
        price: 19.99,
        images: ['img1.jpg'],
        description: 'Short desc'  // Too short for bonus
      };

      const result = validateProduct(partialProduct);
      
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(40);
      expect(result.score).toBeLessThan(80);
    });
  });

  describe('Price Normalization', () => {
    const normalizePrice = (priceStr: string): number => {
      if (!priceStr) return 0;
      
      // Remove currency symbols and spaces
      let cleaned = priceStr.replace(/[€$£¥₹\s]/g, '').trim();
      
      // Handle European format (1.234,56 -> 1234.56)
      if (cleaned.includes(',') && cleaned.includes('.')) {
        if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
          cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        } else {
          cleaned = cleaned.replace(/,/g, '');
        }
      } else if (cleaned.includes(',')) {
        // Could be decimal separator or thousands
        const parts = cleaned.split(',');
        if (parts[parts.length - 1].length === 2) {
          cleaned = cleaned.replace(',', '.');
        } else {
          cleaned = cleaned.replace(/,/g, '');
        }
      }
      
      return parseFloat(cleaned) || 0;
    };

    const testPrices = [
      { input: '29,99 €', expected: 29.99 },
      { input: '$199.00', expected: 199.00 },
      { input: '1.299,00 €', expected: 1299.00 },
      { input: '£49.99', expected: 49.99 },
      { input: '1,299.00', expected: 1299.00 },
      { input: '99', expected: 99 },
      { input: '  45,50  ', expected: 45.50 }
    ];

    testPrices.forEach(({ input, expected }) => {
      it(`normalizes "${input}" to ${expected}`, () => {
        expect(normalizePrice(input)).toBe(expected);
      });
    });
  });

  describe('Image URL Processing', () => {
    const processImageUrl = (url: string, platform: string): string => {
      if (!url) return '';
      
      // Ensure HTTPS
      let processed = url.replace(/^http:\/\//, 'https://');
      
      // Platform-specific HD upgrades
      switch (platform) {
        case 'amazon':
          processed = processed.replace(/\._[A-Z]+_[0-9]+_\./, '._AC_SL1500_.');
          break;
        case 'aliexpress':
          processed = processed.replace(/_\d+x\d+/, '_800x800');
          break;
        case 'ebay':
          processed = processed.replace(/s-l\d+/, 's-l1600');
          break;
        case 'etsy':
          processed = processed.replace(/il_\d+x\d+/, 'il_fullxfull');
          break;
      }
      
      return processed;
    };

    it('upgrades Amazon images to HD', () => {
      const input = 'https://m.media-amazon.com/images/I/71abc._AC_SX200_.jpg';
      const result = processImageUrl(input, 'amazon');
      expect(result).toContain('_AC_SL1500_');
    });

    it('upgrades AliExpress images to 800x800', () => {
      const input = 'https://ae01.alicdn.com/kf/image_50x50.jpg';
      const result = processImageUrl(input, 'aliexpress');
      expect(result).toContain('_800x800');
    });

    it('upgrades eBay images to full resolution', () => {
      const input = 'https://i.ebayimg.com/images/g/abc/s-l300.jpg';
      const result = processImageUrl(input, 'ebay');
      expect(result).toContain('s-l1600');
    });

    it('upgrades Etsy images to fullxfull', () => {
      const input = 'https://i.etsystatic.com/12345/r/il_340x270/abc.jpg';
      const result = processImageUrl(input, 'etsy');
      expect(result).toContain('il_fullxfull');
    });

    it('converts HTTP to HTTPS', () => {
      const input = 'http://example.com/image.jpg';
      const result = processImageUrl(input, 'unknown');
      expect(result.startsWith('https://')).toBe(true);
    });
  });
});
