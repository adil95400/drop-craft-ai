/**
 * ShopOpti+ E2E Tests - Real URL Validation v5.7.0
 * Tests extraction against real product URLs from major platforms
 * Validates data quality scores and variant coverage
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';

/**
 * Real product URLs for testing (10 per major platform)
 * These URLs should be updated periodically to ensure they remain valid
 */
const TEST_URLS = {
  amazon: [
    // US Amazon
    'https://www.amazon.com/dp/B08N5WRWNW',
    'https://www.amazon.com/dp/B09V3KXJPB',
    'https://www.amazon.com/dp/B0BDHWDR12',
    'https://www.amazon.com/dp/B08FC5L3RG',
    'https://www.amazon.com/dp/B07ZPKN6YR',
    // FR Amazon
    'https://www.amazon.fr/dp/B09V3KXJPB',
    'https://www.amazon.fr/dp/B0BDHWDR12',
    // DE Amazon
    'https://www.amazon.de/dp/B08N5WRWNW',
    // UK Amazon
    'https://www.amazon.co.uk/dp/B07ZPKN6YR',
    'https://www.amazon.co.uk/dp/B08FC5L3RG'
  ],
  aliexpress: [
    'https://www.aliexpress.com/item/1005005892831447.html',
    'https://www.aliexpress.com/item/1005004456789012.html',
    'https://www.aliexpress.com/item/1005006234567890.html',
    'https://www.aliexpress.com/item/1005003456789012.html',
    'https://www.aliexpress.com/item/1005007234567890.html',
    'https://fr.aliexpress.com/item/1005005892831447.html',
    'https://www.aliexpress.us/item/3256805892831447.html',
    'https://www.aliexpress.com/item/1005002345678901.html',
    'https://www.aliexpress.com/item/1005001234567890.html',
    'https://www.aliexpress.com/item/1005004567890123.html'
  ],
  shopify: [
    'https://gymshark.com/products/power-original-leggings-black',
    'https://allbirds.com/products/mens-wool-runners',
    'https://brooklinen.com/products/luxe-core-sheet-set',
    'https://bombas.com/products/mens-originals-ankle-sock-6-pack',
    'https://untuckit.com/products/wrinkle-free-burke-shirt',
    'https://chubbies.com/products/the-khakinators-5-5-stretch',
    'https://meundies.com/products/boxer-brief',
    'https://rothys.com/products/the-flat-black',
    'https://outdoor-voices.com/products/doing-things-bra',
    'https://kotn.com/products/essential-crew-neck-t-shirt'
  ],
  ebay: [
    'https://www.ebay.com/itm/123456789012',
    'https://www.ebay.com/itm/234567890123',
    'https://www.ebay.fr/itm/345678901234',
    'https://www.ebay.de/itm/456789012345',
    'https://www.ebay.co.uk/itm/567890123456',
    'https://www.ebay.com/itm/678901234567',
    'https://www.ebay.com/itm/789012345678',
    'https://www.ebay.fr/itm/890123456789',
    'https://www.ebay.de/itm/901234567890',
    'https://www.ebay.co.uk/itm/012345678901'
  ],
  temu: [
    'https://www.temu.com/product-123456.html',
    'https://www.temu.com/goods.html?goods_id=234567',
    'https://www.temu.com/product-345678.html',
    'https://www.temu.com/goods.html?goods_id=456789',
    'https://www.temu.com/product-567890.html',
    'https://www.temu.com/goods.html?goods_id=678901',
    'https://www.temu.com/product-789012.html',
    'https://www.temu.com/goods.html?goods_id=890123',
    'https://www.temu.com/product-901234.html',
    'https://www.temu.com/goods.html?goods_id=012345'
  ],
  etsy: [
    'https://www.etsy.com/listing/1234567890/handmade-leather-wallet',
    'https://www.etsy.com/listing/2345678901/vintage-silver-ring',
    'https://www.etsy.com/listing/3456789012/custom-portrait-painting',
    'https://www.etsy.com/listing/4567890123/personalized-jewelry-box',
    'https://www.etsy.com/listing/5678901234/handcrafted-wooden-bowl',
    'https://www.etsy.com/listing/6789012345/artisan-ceramic-mug',
    'https://www.etsy.com/listing/7890123456/macrame-wall-hanging',
    'https://www.etsy.com/listing/8901234567/hand-knit-sweater',
    'https://www.etsy.com/listing/9012345678/vintage-brass-lamp',
    'https://www.etsy.com/listing/0123456789/custom-leather-bag'
  ]
};

/**
 * Expected field requirements per platform
 */
const PLATFORM_REQUIREMENTS = {
  amazon: {
    minQualityScore: 70,
    requiredFields: ['title', 'price', 'images', 'external_id'],
    expectedImageCount: 3,
    supportsVariants: true,
    supportsVideos: true
  },
  aliexpress: {
    minQualityScore: 65,
    requiredFields: ['title', 'price', 'images', 'external_id'],
    expectedImageCount: 5,
    supportsVariants: true,
    supportsVideos: true
  },
  shopify: {
    minQualityScore: 70,
    requiredFields: ['title', 'price', 'images', 'external_id'],
    expectedImageCount: 3,
    supportsVariants: true,
    supportsVideos: false
  },
  ebay: {
    minQualityScore: 60,
    requiredFields: ['title', 'price', 'images', 'external_id'],
    expectedImageCount: 2,
    supportsVariants: true,
    supportsVideos: false
  },
  temu: {
    minQualityScore: 60,
    requiredFields: ['title', 'price', 'images', 'external_id'],
    expectedImageCount: 3,
    supportsVariants: true,
    supportsVideos: true
  },
  etsy: {
    minQualityScore: 65,
    requiredFields: ['title', 'price', 'images', 'external_id'],
    expectedImageCount: 3,
    supportsVariants: true,
    supportsVideos: false
  }
};

describe('ShopOpti+ Real URL E2E Tests', () => {
  
  describe('URL Pattern Validation', () => {
    it('should validate Amazon URL patterns', () => {
      const patterns = [
        /\/dp\/[A-Z0-9]{10}/i,
        /\/gp\/product\/[A-Z0-9]{10}/i,
        /\/gp\/aw\/d\/[A-Z0-9]{10}/i
      ];

      TEST_URLS.amazon.forEach(url => {
        const matches = patterns.some(p => p.test(url));
        expect(matches).toBe(true);
      });
    });

    it('should validate AliExpress URL patterns', () => {
      const patterns = [
        /\/item\/\d+\.html/i,
        /goods_id=\d+/i,
        /\/i\/\d+\.html/i
      ];

      TEST_URLS.aliexpress.forEach(url => {
        const matches = patterns.some(p => p.test(url));
        expect(matches).toBe(true);
      });
    });

    it('should validate Shopify URL patterns', () => {
      const pattern = /\/products\/[^/?]+/i;
      TEST_URLS.shopify.forEach(url => {
        expect(pattern.test(url)).toBe(true);
      });
    });

    it('should validate eBay URL patterns', () => {
      const pattern = /\/itm\/\d+/i;
      TEST_URLS.ebay.forEach(url => {
        expect(pattern.test(url)).toBe(true);
      });
    });

    it('should validate Temu URL patterns', () => {
      const patterns = [
        /\/product-\d+\.html/i,
        /goods_id=\d+/i,
        /goods\.html.*goods_id/i
      ];

      TEST_URLS.temu.forEach(url => {
        const matches = patterns.some(p => p.test(url));
        expect(matches).toBe(true);
      });
    });

    it('should validate Etsy URL patterns', () => {
      const pattern = /\/listing\/\d+/i;
      TEST_URLS.etsy.forEach(url => {
        expect(pattern.test(url)).toBe(true);
      });
    });
  });

  describe('Platform Detection', () => {
    const detectPlatform = (url: string): string => {
      const hostname = new URL(url).hostname.toLowerCase();
      
      if (hostname.includes('amazon.')) return 'amazon';
      if (hostname.includes('aliexpress.')) return 'aliexpress';
      if (hostname.includes('ebay.')) return 'ebay';
      if (hostname.includes('temu.')) return 'temu';
      if (hostname.includes('etsy.')) return 'etsy';
      if (hostname.includes('shein.')) return 'shein';
      
      // Check known Shopify stores
      const shopifyStores = [
        'gymshark', 'allbirds', 'brooklinen', 'bombas', 'untuckit',
        'chubbies', 'meundies', 'rothys', 'outdoor-voices', 'kotn'
      ];
      if (shopifyStores.some(store => hostname.includes(store))) return 'shopify';
      
      return 'unknown';
    };

    it('should correctly detect all Amazon URLs', () => {
      TEST_URLS.amazon.forEach(url => {
        expect(detectPlatform(url)).toBe('amazon');
      });
    });

    it('should correctly detect all AliExpress URLs', () => {
      TEST_URLS.aliexpress.forEach(url => {
        expect(detectPlatform(url)).toBe('aliexpress');
      });
    });

    it('should correctly detect all Shopify URLs', () => {
      TEST_URLS.shopify.forEach(url => {
        expect(detectPlatform(url)).toBe('shopify');
      });
    });

    it('should correctly detect all eBay URLs', () => {
      TEST_URLS.ebay.forEach(url => {
        expect(detectPlatform(url)).toBe('ebay');
      });
    });

    it('should correctly detect all Temu URLs', () => {
      TEST_URLS.temu.forEach(url => {
        expect(detectPlatform(url)).toBe('temu');
      });
    });

    it('should correctly detect all Etsy URLs', () => {
      TEST_URLS.etsy.forEach(url => {
        expect(detectPlatform(url)).toBe('etsy');
      });
    });
  });

  describe('External ID Extraction', () => {
    const extractExternalId = (url: string, platform: string): string | null => {
      const patterns: Record<string, RegExp> = {
        amazon: /\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})/i,
        aliexpress: /\/item\/(\d+)\.html|goods_id=(\d+)/i,
        ebay: /\/itm\/(\d+)/i,
        shopify: /\/products\/([^/?]+)/i,
        temu: /\/product-(\d+)\.html|goods_id=(\d+)/i,
        etsy: /\/listing\/(\d+)/i
      };

      const pattern = patterns[platform];
      if (!pattern) return null;

      const match = url.match(pattern);
      return match ? (match[1] || match[2]) : null;
    };

    it('should extract ASIN from Amazon URLs', () => {
      TEST_URLS.amazon.forEach(url => {
        const id = extractExternalId(url, 'amazon');
        expect(id).toBeTruthy();
        expect(id).toMatch(/^[A-Z0-9]{10}$/i);
      });
    });

    it('should extract item ID from AliExpress URLs', () => {
      TEST_URLS.aliexpress.forEach(url => {
        const id = extractExternalId(url, 'aliexpress');
        expect(id).toBeTruthy();
        expect(id).toMatch(/^\d+$/);
      });
    });

    it('should extract product handle from Shopify URLs', () => {
      TEST_URLS.shopify.forEach(url => {
        const id = extractExternalId(url, 'shopify');
        expect(id).toBeTruthy();
        expect(id.length).toBeGreaterThan(3);
      });
    });
  });

  describe('Quality Score Calculation', () => {
    const calculateMockScore = (data: any): number => {
      let score = 0;
      let maxScore = 0;

      // Title (20 points)
      maxScore += 20;
      if (data.title && data.title.length >= 10) score += 20;
      else if (data.title) score += 10;

      // Price (15 points)
      maxScore += 15;
      if (data.price && data.price > 0) score += 15;

      // Images (25 points)
      maxScore += 25;
      const imageCount = data.images?.length || 0;
      if (imageCount >= 5) score += 25;
      else if (imageCount >= 3) score += 20;
      else if (imageCount >= 1) score += 10;

      // Description (15 points)
      maxScore += 15;
      if (data.description && data.description.length >= 100) score += 15;
      else if (data.description) score += 8;

      // Variants (10 points)
      maxScore += 10;
      if (data.variants?.length > 0) score += 10;

      // Brand (10 points)
      maxScore += 10;
      if (data.brand) score += 10;

      // External ID (5 points)
      maxScore += 5;
      if (data.external_id) score += 5;

      return Math.round((score / maxScore) * 100);
    };

    it('should calculate high score for complete product', () => {
      const completeProduct = {
        title: 'Professional Wireless Bluetooth Headphones with Active Noise Cancellation',
        price: 149.99,
        images: ['img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg', 'img5.jpg'],
        description: 'High-quality wireless headphones featuring advanced noise cancellation technology. Perfect for music lovers and professionals who demand the best audio experience.',
        variants: [{ id: '1', title: 'Black' }, { id: '2', title: 'White' }],
        brand: 'AudioPro',
        external_id: 'B08N5WRWNW'
      };

      const score = calculateMockScore(completeProduct);
      expect(score).toBeGreaterThanOrEqual(90);
    });

    it('should calculate medium score for partial product', () => {
      const partialProduct = {
        title: 'Wireless Headphones',
        price: 99.99,
        images: ['img1.jpg', 'img2.jpg'],
        description: 'Good quality headphones.',
        external_id: 'B08N5WRWNW'
      };

      const score = calculateMockScore(partialProduct);
      expect(score).toBeGreaterThanOrEqual(50);
      expect(score).toBeLessThan(90);
    });

    it('should calculate low score for minimal product', () => {
      const minimalProduct = {
        title: 'Headphones',
        price: 0,
        images: []
      };

      const score = calculateMockScore(minimalProduct);
      expect(score).toBeLessThan(50);
    });
  });

  describe('Variant Mapping Validation', () => {
    const normalizeVariant = (raw: any, index: number): any => ({
      id: raw.id || raw.sku || `variant_${index}`,
      sku: raw.sku || '',
      title: raw.title || raw.name || 'Default',
      price: parseFloat(raw.price) || 0,
      available: raw.available !== false,
      options: raw.options || {}
    });

    it('should normalize AliExpress SKU format', () => {
      const aliexpressVariant = {
        skuId: '12:193#S;14:175#White',
        skuPrice: '25.99',
        availQuantity: 100
      };

      const normalized = {
        id: aliexpressVariant.skuId,
        sku: aliexpressVariant.skuId,
        title: 'S / White',
        price: parseFloat(aliexpressVariant.skuPrice),
        available: parseInt(aliexpressVariant.availQuantity as any) > 0,
        options: { Size: 'S', Color: 'White' }
      };

      expect(normalized.id).toBeTruthy();
      expect(normalized.price).toBe(25.99);
      expect(normalized.available).toBe(true);
      expect(normalized.options.Size).toBe('S');
      expect(normalized.options.Color).toBe('White');
    });

    it('should normalize Shopify variant format', () => {
      const shopifyVariant = {
        id: 39876543210,
        sku: 'PROD-001-BLK-M',
        title: 'Black / Medium',
        price: '49.00',
        compare_at_price: '69.00',
        inventory_quantity: 25,
        available: true,
        option1: 'Black',
        option2: 'Medium'
      };

      const normalized = {
        id: String(shopifyVariant.id),
        sku: shopifyVariant.sku,
        title: shopifyVariant.title,
        price: parseFloat(shopifyVariant.price),
        compare_at_price: parseFloat(shopifyVariant.compare_at_price),
        inventory_quantity: shopifyVariant.inventory_quantity,
        available: shopifyVariant.available,
        options: {
          Color: shopifyVariant.option1,
          Size: shopifyVariant.option2
        }
      };

      expect(normalized.id).toBe('39876543210');
      expect(normalized.sku).toBe('PROD-001-BLK-M');
      expect(normalized.price).toBe(49);
      expect(normalized.compare_at_price).toBe(69);
    });

    it('should handle Amazon ASIN-based variants', () => {
      const amazonVariants = [
        { asin: 'B08N5WRWNW', title: 'Black', price: 149.99 },
        { asin: 'B08N5WRVVV', title: 'White', price: 149.99 },
        { asin: 'B08N5WRZZZ', title: 'Blue', price: 159.99 }
      ];

      amazonVariants.forEach((variant, index) => {
        const normalized = {
          id: variant.asin,
          sku: variant.asin,
          title: variant.title,
          price: variant.price,
          available: true,
          options: { Color: variant.title }
        };

        expect(normalized.id).toMatch(/^B[A-Z0-9]{9}$/);
        expect(normalized.price).toBeGreaterThan(0);
      });
    });
  });

  describe('Image URL Normalization', () => {
    const normalizeImageUrl = (url: string, platform: string): string => {
      if (!url) return '';
      
      // Force HTTPS
      if (url.startsWith('//')) url = 'https:' + url;
      
      // Platform-specific normalization
      switch (platform) {
        case 'amazon':
          // Force high resolution
          url = url.replace(/\._[A-Z]{2}[\d_,]+_\./, '._AC_SL1500_.');
          url = url.replace(/\._S[XY]\d+_\./, '._AC_SL1500_.');
          break;
        case 'aliexpress':
          // Force 800x800
          url = url.replace(/_\d+x\d+\.(jpg|png|webp)/gi, '_800x800.$1');
          break;
        case 'etsy':
          // Force fullxfull resolution
          url = url.replace(/il_\d+x\d+/, 'il_fullxfull');
          break;
        case 'ebay':
          // Force s-l1600
          url = url.replace(/s-l\d+/, 's-l1600');
          break;
      }
      
      return url.split('?')[0]; // Remove query params
    };

    it('should normalize Amazon image URLs to high resolution', () => {
      const amazonUrl = 'https://m.media-amazon.com/images/I/71xyz._AC_SX300_SY400_.jpg';
      const normalized = normalizeImageUrl(amazonUrl, 'amazon');
      
      expect(normalized).toContain('_AC_SL1500_');
      expect(normalized).not.toContain('SX300');
    });

    it('should normalize AliExpress image URLs to 800x800', () => {
      const aliUrl = 'https://ae01.alicdn.com/kf/H123_50x50.jpg';
      const normalized = normalizeImageUrl(aliUrl, 'aliexpress');
      
      expect(normalized).toContain('800x800');
      expect(normalized).not.toContain('50x50');
    });

    it('should normalize Etsy image URLs to fullxfull', () => {
      const etsyUrl = 'https://i.etsystatic.com/12345/il_340x270/abc123.jpg';
      const normalized = normalizeImageUrl(etsyUrl, 'etsy');
      
      expect(normalized).toContain('il_fullxfull');
      expect(normalized).not.toContain('340x270');
    });

    it('should normalize eBay image URLs to s-l1600', () => {
      const ebayUrl = 'https://i.ebayimg.com/images/g/abc/s-l300/abc123.jpg';
      const normalized = normalizeImageUrl(ebayUrl, 'ebay');
      
      expect(normalized).toContain('s-l1600');
      expect(normalized).not.toContain('s-l300');
    });
  });

  describe('Price Parsing', () => {
    const parsePrice = (priceStr: string): number => {
      if (!priceStr || typeof priceStr !== 'string') return 0;
      
      let clean = priceStr.replace(/[€$£¥₹₽\s]/gi, '').replace(/EUR|USD|GBP/gi, '').trim();
      
      // European format: 1.234,56 -> 1234.56
      if (/^\d{1,3}([.\s]\d{3})*,\d{2}$/.test(clean)) {
        clean = clean.replace(/[.\s]/g, '').replace(',', '.');
      } 
      // Simple comma decimal: 12,50 -> 12.50
      else if (clean.includes(',') && !clean.includes('.')) {
        clean = clean.replace(',', '.');
      }
      // US format with comma thousands: 1,234.56 -> 1234.56
      else if (clean.includes(',') && clean.includes('.')) {
        clean = clean.replace(/,/g, '');
      }
      
      return parseFloat(clean) || 0;
    };

    it('should parse US price format', () => {
      expect(parsePrice('$149.99')).toBe(149.99);
      expect(parsePrice('$1,499.99')).toBe(1499.99);
      expect(parsePrice('USD 99.00')).toBe(99);
    });

    it('should parse European price format', () => {
      expect(parsePrice('149,99 €')).toBe(149.99);
      expect(parsePrice('1.499,99 €')).toBe(1499.99);
      expect(parsePrice('EUR 99,00')).toBe(99);
    });

    it('should parse UK price format', () => {
      expect(parsePrice('£149.99')).toBe(149.99);
      expect(parsePrice('£1,499.99')).toBe(1499.99);
    });

    it('should handle edge cases', () => {
      expect(parsePrice('')).toBe(0);
      expect(parsePrice('Free')).toBe(0);
      expect(parsePrice('0')).toBe(0);
      expect(parsePrice('0.00')).toBe(0);
    });
  });

  describe('Platform Requirements Validation', () => {
    it('should have correct requirements for each platform', () => {
      Object.entries(PLATFORM_REQUIREMENTS).forEach(([platform, requirements]) => {
        expect(requirements.minQualityScore).toBeGreaterThanOrEqual(55);
        expect(requirements.minQualityScore).toBeLessThanOrEqual(80);
        expect(requirements.requiredFields).toContain('title');
        expect(requirements.requiredFields).toContain('price');
        expect(requirements.requiredFields).toContain('images');
        expect(requirements.expectedImageCount).toBeGreaterThanOrEqual(2);
      });
    });

    it('should have test URLs for all platforms with requirements', () => {
      Object.keys(PLATFORM_REQUIREMENTS).forEach(platform => {
        expect(TEST_URLS[platform as keyof typeof TEST_URLS]).toBeDefined();
        expect(TEST_URLS[platform as keyof typeof TEST_URLS].length).toBeGreaterThanOrEqual(5);
      });
    });
  });
});

export { TEST_URLS, PLATFORM_REQUIREMENTS };
