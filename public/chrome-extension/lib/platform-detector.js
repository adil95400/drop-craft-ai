/**
 * ShopOpti+ Platform Detector v5.7.0
 * Advanced platform detection with capability reporting
 * Handles edge cases like Shopify stores, regional domains, SPAs
 */

(function() {
  'use strict';

  if (window.__shopoptiPlatformDetectorLoaded) return;
  window.__shopoptiPlatformDetectorLoaded = true;

  /**
   * Platform definitions with patterns and metadata
   */
  const PLATFORMS = {
    amazon: {
      name: 'Amazon',
      icon: '📦',
      color: '#ff9900',
      domains: [
        'amazon.com', 'amazon.fr', 'amazon.de', 'amazon.co.uk', 
        'amazon.es', 'amazon.it', 'amazon.ca', 'amazon.co.jp',
        'amazon.in', 'amazon.com.br', 'amazon.com.mx', 'amazon.com.au',
        'amazon.nl', 'amazon.se', 'amazon.pl', 'amazon.ae', 'amazon.sa'
      ],
      productPatterns: [
        /\/dp\/([A-Z0-9]{10})/i,
        /\/gp\/product\/([A-Z0-9]{10})/i,
        /\/gp\/aw\/d\/([A-Z0-9]{10})/i
      ],
      extractId: (url) => {
        for (const pattern of PLATFORMS.amazon.productPatterns) {
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
      domains: ['aliexpress.com', 'aliexpress.fr', 'aliexpress.us', 'aliexpress.ru'],
      productPatterns: [
        /\/item\/(\d+)\.html/,
        /\/i\/(\d+)\.html/,
        /\/_p\/(\d+)/,
        /productId=(\d+)/
      ],
      extractId: (url) => {
        for (const pattern of PLATFORMS.aliexpress.productPatterns) {
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
      domains: ['ebay.com', 'ebay.fr', 'ebay.de', 'ebay.co.uk', 'ebay.es', 'ebay.it', 'ebay.ca', 'ebay.com.au'],
      productPatterns: [
        /\/itm\/(\d+)/,
        /\/itm\/[^\/]+\/(\d+)/
      ],
      extractId: (url) => {
        for (const pattern of PLATFORMS.ebay.productPatterns) {
          const match = url.match(pattern);
          if (match) return match[1];
        }
        return null;
      }
    },
    
    temu: {
      name: 'Temu',
      icon: '🎁',
      color: '#f97316',
      domains: ['temu.com'],
      productPatterns: [
        /\/goods\.html\?goods_id=(\d+)/,
        /g-(\d+)\.html/,
        /_p_(\d+)\.html/
      ],
      extractId: (url) => {
        for (const pattern of PLATFORMS.temu.productPatterns) {
          const match = url.match(pattern);
          if (match) return match[1];
        }
        // Extract from URL params
        const urlObj = new URL(url);
        return urlObj.searchParams.get('goods_id');
      }
    },
    
    shein: {
      name: 'Shein',
      icon: '👗',
      color: '#000000',
      domains: ['shein.com', 'shein.fr', 'shein.co.uk', 'shein.de', 'shein.es'],
      productPatterns: [
        /-p-(\d+)\.html/,
        /\/product-detail\//
      ],
      extractId: (url) => {
        const match = url.match(/-p-(\d+)\.html/);
        return match ? match[1] : null;
      }
    },
    
    walmart: {
      name: 'Walmart',
      icon: '🏪',
      color: '#0071ce',
      domains: ['walmart.com', 'walmart.ca'],
      productPatterns: [
        /\/ip\/(\d+)/,
        /\/ip\/[^\/]+\/(\d+)/
      ],
      extractId: (url) => {
        for (const pattern of PLATFORMS.walmart.productPatterns) {
          const match = url.match(pattern);
          if (match) return match[1];
        }
        return null;
      }
    },
    
    etsy: {
      name: 'Etsy',
      icon: '🎨',
      color: '#f56400',
      domains: ['etsy.com'],
      productPatterns: [
        /\/listing\/(\d+)/
      ],
      extractId: (url) => {
        const match = url.match(/\/listing\/(\d+)/);
        return match ? match[1] : null;
      }
    },
    
    cdiscount: {
      name: 'Cdiscount',
      icon: '🛒',
      color: '#e31837',
      domains: ['cdiscount.com'],
      productPatterns: [
        /\/f-\d+-([a-z0-9]+)\.html/i,
        /\/fp\/([a-z0-9]+)/i
      ],
      extractId: (url) => {
        for (const pattern of PLATFORMS.cdiscount.productPatterns) {
          const match = url.match(pattern);
          if (match) return match[1];
        }
        return null;
      }
    },
    
    fnac: {
      name: 'Fnac',
      icon: '📚',
      color: '#e4a600',
      domains: ['fnac.com'],
      productPatterns: [
        /\/a(\d+)\//
      ],
      extractId: (url) => {
        const match = url.match(/\/a(\d+)\//);
        return match ? match[1] : null;
      }
    },
    
    rakuten: {
      name: 'Rakuten',
      icon: '🔴',
      color: '#bf0000',
      domains: ['rakuten.com', 'rakuten.fr'],
      productPatterns: [
        /\/product\/(\d+)/,
        /\/offer\/(\d+)/
      ],
      extractId: (url) => {
        for (const pattern of PLATFORMS.rakuten.productPatterns) {
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
      productPatterns: [
        /\/products\/([^\/\?]+)/
      ],
      detectMeta: () => {
        return !!document.querySelector('meta[name="shopify-checkout-api-token"]') ||
               !!document.querySelector('link[href*="cdn.shopify.com"]') ||
               typeof window.Shopify !== 'undefined';
      },
      extractId: (url) => {
        const match = url.match(/\/products\/([^\/\?]+)/);
        return match ? match[1] : null;
      }
    },
    
    tiktok_shop: {
      name: 'TikTok Shop',
      icon: '🎵',
      color: '#010101',
      domains: ['shop.tiktok.com'],
      productPatterns: [
        /\/product\/(\d+)/,
        /\/p\/(\d+)/
      ],
      extractId: (url) => {
        for (const pattern of PLATFORMS.tiktok_shop.productPatterns) {
          const match = url.match(pattern);
          if (match) return match[1];
        }
        return null;
      }
    },
    
    cjdropshipping: {
      name: 'CJ Dropshipping',
      icon: '📦',
      color: '#1a73e8',
      domains: ['cjdropshipping.com'],
      productPatterns: [
        /\/product-detail\/([a-z0-9-]+)/i,
        /pid=([A-Z0-9]+)/i
      ],
      extractId: (url) => {
        const urlObj = new URL(url);
        const pid = urlObj.searchParams.get('pid');
        if (pid) return pid;
        
        const match = url.match(/\/product-detail\/([a-z0-9-]+)/i);
        return match ? match[1] : null;
      }
    },
    
    banggood: {
      name: 'Banggood',
      icon: '📱',
      color: '#ff6600',
      domains: ['banggood.com'],
      productPatterns: [
        /-p-(\d+)\.html/,
        /\/products\/(\d+)/
      ],
      extractId: (url) => {
        for (const pattern of PLATFORMS.banggood.productPatterns) {
          const match = url.match(pattern);
          if (match) return match[1];
        }
        return null;
      }
    },
    
    dhgate: {
      name: 'DHgate',
      icon: '🏭',
      color: '#e54d00',
      domains: ['dhgate.com'],
      productPatterns: [
        /\/product\/(\d+)\.html/
      ],
      extractId: (url) => {
        const match = url.match(/\/product\/(\d+)\.html/);
        return match ? match[1] : null;
      }
    },
    
    wish: {
      name: 'Wish',
      icon: '⭐',
      color: '#2fb7ec',
      domains: ['wish.com'],
      productPatterns: [
        /\/product\/([a-z0-9]+)/i
      ],
      extractId: (url) => {
        const match = url.match(/\/product\/([a-z0-9]+)/i);
        return match ? match[1] : null;
      }
    },
    
    homedepot: {
      name: 'Home Depot',
      icon: '🏠',
      color: '#f96302',
      domains: ['homedepot.com'],
      productPatterns: [
        /\/p\/([^\/]+\/\d+)/
      ],
      extractId: (url) => {
        const match = url.match(/\/p\/[^\/]+\/(\d+)/);
        return match ? match[1] : null;
      }
    }
  };

  class PlatformDetector {
    constructor() {
      this.cachedDetection = null;
      this.lastUrl = null;
    }

    /**
     * Detect platform from current page or URL
     */
    detect(url = window.location.href) {
      // Use cache if same URL
      if (url === this.lastUrl && this.cachedDetection) {
        return this.cachedDetection;
      }

      let hostname;
      try {
        hostname = new URL(url).hostname.toLowerCase();
      } catch {
        hostname = window.location.hostname.toLowerCase();
      }

      // Check each platform
      for (const [key, platform] of Object.entries(PLATFORMS)) {
        // Domain matching
        if (platform.domains.some(d => hostname.includes(d))) {
          const result = this.buildDetectionResult(key, platform, url);
          this.cacheResult(url, result);
          return result;
        }

        // Meta tag detection (Shopify)
        if (platform.detectMeta && platform.detectMeta()) {
          const result = this.buildDetectionResult(key, platform, url);
          this.cacheResult(url, result);
          return result;
        }
      }

      // Generic fallback
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

    /**
     * Build detection result object
     */
    buildDetectionResult(key, platform, url) {
      return {
        key,
        name: platform.name,
        icon: platform.icon,
        color: platform.color,
        isProductPage: this.isProductPage(key, platform, url),
        productId: platform.extractId ? platform.extractId(url) : null,
        supported: key !== 'generic',
        locale: this.detectLocale(url)
      };
    }

    /**
     * Check if current page is a product page
     */
    isProductPage(key, platform, url) {
      if (!platform.productPatterns || platform.productPatterns.length === 0) {
        return false;
      }

      return platform.productPatterns.some(pattern => pattern.test(url));
    }

    /**
     * Detect locale from URL
     */
    detectLocale(url) {
      try {
        const hostname = new URL(url).hostname.toLowerCase();
        
        // Extract TLD
        const parts = hostname.split('.');
        const tld = parts[parts.length - 1];
        
        // Map TLD to locale
        const tldLocaleMap = {
          'fr': 'fr-FR',
          'de': 'de-DE',
          'es': 'es-ES',
          'it': 'it-IT',
          'uk': 'en-GB',
          'jp': 'ja-JP',
          'ca': 'en-CA',
          'au': 'en-AU',
          'br': 'pt-BR',
          'mx': 'es-MX',
          'nl': 'nl-NL',
          'se': 'sv-SE',
          'pl': 'pl-PL'
        };

        return tldLocaleMap[tld] || 'en-US';
      } catch {
        return 'en-US';
      }
    }

    /**
     * Cache detection result
     */
    cacheResult(url, result) {
      this.lastUrl = url;
      this.cachedDetection = result;
    }

    /**
     * Get all supported platforms
     */
    getSupportedPlatforms() {
      return Object.entries(PLATFORMS).map(([key, platform]) => ({
        key,
        name: platform.name,
        icon: platform.icon,
        color: platform.color,
        domains: platform.domains
      }));
    }

    /**
     * Check if a URL is from a supported platform
     */
    isSupported(url) {
      const detection = this.detect(url);
      return detection.supported;
    }

    /**
     * Get platform by key
     */
    getPlatform(key) {
      return PLATFORMS[key] || null;
    }

    /**
     * Extract product ID from URL
     */
    extractProductId(url) {
      const detection = this.detect(url);
      return detection.productId;
    }

    /**
     * Get list detection summary for bulk URLs
     */
    detectBulk(urls) {
      return urls.map(url => ({
        url,
        ...this.detect(url)
      }));
    }
  }

  // Export singleton
  window.PlatformDetector = new PlatformDetector();

  console.log('[ShopOpti+] PlatformDetector v5.7.0 loaded - 17 platforms configured');

})();
