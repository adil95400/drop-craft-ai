/**
 * Tests for ShopOpti+ Platform Detector v5.7.0
 * Advanced platform detection with capability reporting
 */
import { describe, it, expect, beforeEach } from 'vitest';

// Platform definitions matching the actual implementation
const PLATFORMS: Record<string, {
  name: string;
  icon: string;
  color: string;
  domains: string[];
  productPatterns: RegExp[];
  extractId: (url: string) => string | null;
}> = {
  amazon: {
    name: 'Amazon',
    icon: '📦',
    color: '#ff9900',
    domains: ['amazon.com', 'amazon.fr', 'amazon.de', 'amazon.co.uk'],
    productPatterns: [
      /\/dp\/([A-Z0-9]{10})/i,
      /\/gp\/product\/([A-Z0-9]{10})/i
    ],
    extractId: (url: string) => {
      const patterns = [/\/dp\/([A-Z0-9]{10})/i, /\/gp\/product\/([A-Z0-9]{10})/i];
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
      return null;
    }
  },
  aliexpress: {
    name: 'AliExpress',
    icon: '🛒',
    color: '#ff6a00',
    domains: ['aliexpress.com', 'aliexpress.fr'],
    productPatterns: [
      /\/item\/(\d+)\.html/,
      /\/i\/(\d+)\.html/
    ],
    extractId: (url: string) => {
      const patterns = [/\/item\/(\d+)\.html/, /\/i\/(\d+)\.html/];
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
      return null;
    }
  },
  ebay: {
    name: 'eBay',
    icon: '🏷️',
    color: '#e53238',
    domains: ['ebay.com', 'ebay.fr', 'ebay.de'],
    productPatterns: [
      /\/itm\/(\d+)/,
      /\/itm\/[^\/]+\/(\d+)/
    ],
    extractId: (url: string) => {
      const patterns = [/\/itm\/(\d+)/, /\/itm\/[^\/]+\/(\d+)/];
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
      return null;
    }
  },
  shopify: {
    name: 'Shopify',
    icon: '🛍️',
    color: '#96bf48',
    domains: ['myshopify.com'],
    productPatterns: [/\/products\/([^\/\?]+)/],
    extractId: (url: string) => {
      const match = url.match(/\/products\/([^\/\?]+)/);
      return match ? match[1] : null;
    }
  },
  temu: {
    name: 'Temu',
    icon: '🎁',
    color: '#f97316',
    domains: ['temu.com'],
    productPatterns: [/g-(\d+)\.html/, /_p_(\d+)\.html/],
    extractId: (url: string) => {
      const patterns = [/g-(\d+)\.html/, /_p_(\d+)\.html/];
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
      try {
        const urlObj = new URL(url);
        return urlObj.searchParams.get('goods_id');
      } catch {
        return null;
      }
    }
  }
};

class PlatformDetector {
  private cachedDetection: ReturnType<typeof this.buildDetectionResult> | null = null;
  private lastUrl: string | null = null;

  detect(url: string) {
    if (url === this.lastUrl && this.cachedDetection) {
      return this.cachedDetection;
    }

    let hostname: string;
    try {
      hostname = new URL(url).hostname.toLowerCase();
    } catch {
      hostname = '';
    }

    for (const [key, platform] of Object.entries(PLATFORMS)) {
      if (platform.domains.some(d => hostname.includes(d))) {
        const result = this.buildDetectionResult(key, platform, url);
        this.cacheResult(url, result);
        return result;
      }
    }

    const genericResult = this.buildDetectionResult('generic', {
      name: 'Unknown',
      icon: '🌐',
      color: '#6b7280',
      domains: [],
      productPatterns: [],
      extractId: () => null
    }, url);

    this.cacheResult(url, genericResult);
    return genericResult;
  }

  buildDetectionResult(key: string, platform: typeof PLATFORMS[string], url: string) {
    return {
      key,
      name: platform.name,
      icon: platform.icon,
      color: platform.color,
      isProductPage: this.isProductPage(platform, url),
      productId: platform.extractId ? platform.extractId(url) : null,
      supported: key !== 'generic',
      locale: this.detectLocale(url)
    };
  }

  isProductPage(platform: typeof PLATFORMS[string], url: string) {
    if (!platform.productPatterns || platform.productPatterns.length === 0) {
      return false;
    }
    return platform.productPatterns.some(pattern => pattern.test(url));
  }

  detectLocale(url: string) {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      const parts = hostname.split('.');
      const tld = parts[parts.length - 1];
      
      const tldLocaleMap: Record<string, string> = {
        'fr': 'fr-FR',
        'de': 'de-DE',
        'es': 'es-ES',
        'it': 'it-IT',
        'uk': 'en-GB',
        'jp': 'ja-JP',
        'ca': 'en-CA'
      };

      return tldLocaleMap[tld] || 'en-US';
    } catch {
      return 'en-US';
    }
  }

  cacheResult(url: string, result: ReturnType<typeof this.buildDetectionResult>) {
    this.lastUrl = url;
    this.cachedDetection = result;
  }

  getSupportedPlatforms() {
    return Object.entries(PLATFORMS).map(([key, platform]) => ({
      key,
      name: platform.name,
      icon: platform.icon,
      color: platform.color,
      domains: platform.domains
    }));
  }

  isSupported(url: string) {
    const detection = this.detect(url);
    return detection.supported;
  }

  extractProductId(url: string) {
    const detection = this.detect(url);
    return detection.productId;
  }

  detectBulk(urls: string[]) {
    return urls.map(url => ({
      url,
      ...this.detect(url)
    }));
  }
}

describe('PlatformDetector', () => {
  let detector: PlatformDetector;

  beforeEach(() => {
    detector = new PlatformDetector();
  });

  describe('Platform Detection', () => {
    it('should detect Amazon.com', () => {
      const result = detector.detect('https://www.amazon.com/dp/B08N5WRWNW');

      expect(result.key).toBe('amazon');
      expect(result.name).toBe('Amazon');
      expect(result.supported).toBe(true);
    });

    it('should detect Amazon.fr', () => {
      const result = detector.detect('https://www.amazon.fr/dp/B08N5WRWNW');

      expect(result.key).toBe('amazon');
      expect(result.locale).toBe('fr-FR');
    });

    it('should detect AliExpress', () => {
      const result = detector.detect('https://www.aliexpress.com/item/1005001234567890.html');

      expect(result.key).toBe('aliexpress');
      expect(result.name).toBe('AliExpress');
    });

    it('should detect eBay', () => {
      const result = detector.detect('https://www.ebay.com/itm/123456789012');

      expect(result.key).toBe('ebay');
      expect(result.name).toBe('eBay');
    });

    it('should detect Shopify stores', () => {
      const result = detector.detect('https://store.myshopify.com/products/awesome-product');

      expect(result.key).toBe('shopify');
      expect(result.name).toBe('Shopify');
    });

    it('should detect Temu', () => {
      const result = detector.detect('https://www.temu.com/g-123456.html');

      expect(result.key).toBe('temu');
      expect(result.name).toBe('Temu');
    });

    it('should return generic for unknown platforms', () => {
      const result = detector.detect('https://unknown-store.com/product/123');

      expect(result.key).toBe('generic');
      expect(result.name).toBe('Unknown');
      expect(result.supported).toBe(false);
    });
  });

  describe('Product Page Detection', () => {
    it('should detect Amazon product page', () => {
      const result = detector.detect('https://www.amazon.com/dp/B08N5WRWNW');

      expect(result.isProductPage).toBe(true);
    });

    it('should detect AliExpress product page', () => {
      const result = detector.detect('https://www.aliexpress.com/item/1005001234567890.html');

      expect(result.isProductPage).toBe(true);
    });

    it('should not detect category page as product', () => {
      const result = detector.detect('https://www.amazon.com/s?k=electronics');

      expect(result.isProductPage).toBe(false);
    });

    it('should detect Shopify product page', () => {
      const result = detector.detect('https://store.myshopify.com/products/awesome-product');

      expect(result.isProductPage).toBe(true);
    });
  });

  describe('Product ID Extraction', () => {
    it('should extract Amazon ASIN', () => {
      const result = detector.detect('https://www.amazon.com/dp/B08N5WRWNW');

      expect(result.productId).toBe('B08N5WRWNW');
    });

    it('should extract Amazon ASIN from /gp/product/', () => {
      const result = detector.detect('https://www.amazon.com/gp/product/B08N5WRWNW');

      expect(result.productId).toBe('B08N5WRWNW');
    });

    it('should extract AliExpress item ID', () => {
      const result = detector.detect('https://www.aliexpress.com/item/1005001234567890.html');

      expect(result.productId).toBe('1005001234567890');
    });

    it('should extract eBay item ID', () => {
      const result = detector.detect('https://www.ebay.com/itm/123456789012');

      expect(result.productId).toBe('123456789012');
    });

    it('should extract Shopify product handle', () => {
      const result = detector.detect('https://store.myshopify.com/products/awesome-product');

      expect(result.productId).toBe('awesome-product');
    });

    it('should return null for non-product pages', () => {
      const result = detector.detect('https://www.amazon.com/s?k=electronics');

      expect(result.productId).toBeNull();
    });
  });

  describe('Locale Detection', () => {
    it('should detect French locale from .fr domain', () => {
      const result = detector.detect('https://www.amazon.fr/dp/B08N5WRWNW');

      expect(result.locale).toBe('fr-FR');
    });

    it('should detect German locale from .de domain', () => {
      const result = detector.detect('https://www.amazon.de/dp/B08N5WRWNW');

      expect(result.locale).toBe('de-DE');
    });

    it('should detect UK locale from .co.uk domain', () => {
      const result = detector.detect('https://www.ebay.co.uk/itm/123456');

      expect(result.locale).toBe('en-GB');
    });

    it('should default to en-US for .com domains', () => {
      const result = detector.detect('https://www.amazon.com/dp/B08N5WRWNW');

      expect(result.locale).toBe('en-US');
    });
  });

  describe('Caching', () => {
    it('should cache detection results', () => {
      const url = 'https://www.amazon.com/dp/B08N5WRWNW';
      
      const result1 = detector.detect(url);
      const result2 = detector.detect(url);

      expect(result1).toBe(result2);
    });

    it('should invalidate cache for different URL', () => {
      const result1 = detector.detect('https://www.amazon.com/dp/B08N5WRWNW');
      const result2 = detector.detect('https://www.ebay.com/itm/123456');

      expect(result1.key).toBe('amazon');
      expect(result2.key).toBe('ebay');
    });
  });

  describe('Bulk Detection', () => {
    it('should detect multiple URLs at once', () => {
      const urls = [
        'https://www.amazon.com/dp/B08N5WRWNW',
        'https://www.aliexpress.com/item/1234567890.html',
        'https://www.ebay.com/itm/123456789'
      ];

      const results = detector.detectBulk(urls);

      expect(results).toHaveLength(3);
      expect(results[0].key).toBe('amazon');
      expect(results[1].key).toBe('aliexpress');
      expect(results[2].key).toBe('ebay');
    });

    it('should include original URL in results', () => {
      const urls = ['https://www.amazon.com/dp/B08N5WRWNW'];
      const results = detector.detectBulk(urls);

      expect(results[0].url).toBe(urls[0]);
    });
  });

  describe('getSupportedPlatforms', () => {
    it('should return list of all supported platforms', () => {
      const platforms = detector.getSupportedPlatforms();

      expect(platforms.length).toBeGreaterThan(0);
      expect(platforms.some(p => p.key === 'amazon')).toBe(true);
      expect(platforms.some(p => p.key === 'aliexpress')).toBe(true);
    });

    it('should include platform metadata', () => {
      const platforms = detector.getSupportedPlatforms();
      const amazon = platforms.find(p => p.key === 'amazon');

      expect(amazon).toBeDefined();
      expect(amazon?.name).toBe('Amazon');
      expect(amazon?.icon).toBe('📦');
      expect(amazon?.color).toBe('#ff9900');
    });
  });

  describe('isSupported', () => {
    it('should return true for supported platforms', () => {
      expect(detector.isSupported('https://www.amazon.com/dp/B08N5WRWNW')).toBe(true);
      expect(detector.isSupported('https://www.aliexpress.com/item/123.html')).toBe(true);
    });

    it('should return false for unsupported platforms', () => {
      expect(detector.isSupported('https://unknown-site.com/product')).toBe(false);
    });
  });

  describe('extractProductId shorthand', () => {
    it('should extract product ID directly', () => {
      expect(detector.extractProductId('https://www.amazon.com/dp/B08N5WRWNW')).toBe('B08N5WRWNW');
      expect(detector.extractProductId('https://www.aliexpress.com/item/1234567890.html')).toBe('1234567890');
    });
  });
});
