/**
 * ShopOpti+ Extractor Registry v5.7.0
 * Central registry for platform-specific extractors
 * Modular architecture for easy maintenance and extensibility
 */

(function() {
  'use strict';

  // Platform configuration and extractor mapping
  const ExtractorRegistry = {
    version: '5.7.0',
    
    // Registered extractors by platform
    extractors: {},
    
    // Platform metadata
    platforms: {
      aliexpress: {
        name: 'AliExpress',
        icon: '🛒',
        color: '#ff6a00',
        domains: ['aliexpress.com', 'aliexpress.fr', 'aliexpress.us'],
        productPatterns: [/\/item\/|\/i\/|\/_p\//i],
        features: ['variants', 'videos', 'reviews', 'specifications'],
        apiAvailable: true,
        apiType: 'aliexpress_open_platform'
      },
      amazon: {
        name: 'Amazon',
        icon: '📦',
        color: '#ff9900',
        domains: ['amazon.com', 'amazon.fr', 'amazon.de', 'amazon.co.uk', 'amazon.es', 'amazon.it', 'amazon.ca', 'amazon.co.jp'],
        productPatterns: [/\/(dp|gp\/product)\/[A-Z0-9]+/i],
        features: ['variants', 'videos', 'reviews', 'specifications', 'aplus'],
        apiAvailable: true,
        apiType: 'amazon_pa_api'
      },
      ebay: {
        name: 'eBay',
        icon: '🏷️',
        color: '#e53238',
        domains: ['ebay.com', 'ebay.fr', 'ebay.de', 'ebay.co.uk'],
        productPatterns: [/\/itm\/\d+/i],
        features: ['variants', 'reviews'],
        apiAvailable: true,
        apiType: 'ebay_browse_api'
      },
      temu: {
        name: 'Temu',
        icon: '🎁',
        color: '#f97316',
        domains: ['temu.com'],
        productPatterns: [/\/[a-z0-9_-]+-g-\d+\.html|goods\.html/i],
        features: ['variants', 'videos', 'reviews'],
        apiAvailable: false
      },
      shein: {
        name: 'Shein',
        icon: '👗',
        color: '#000000',
        domains: ['shein.com', 'shein.fr'],
        productPatterns: [/\/-p-\d+\.html/i],
        features: ['variants', 'videos', 'reviews'],
        apiAvailable: false
      },
      walmart: {
        name: 'Walmart',
        icon: '🏪',
        color: '#0071ce',
        domains: ['walmart.com'],
        productPatterns: [/\/ip\/\d+/i],
        features: ['variants', 'reviews'],
        apiAvailable: true,
        apiType: 'walmart_affiliate_api'
      },
      etsy: {
        name: 'Etsy',
        icon: '🎨',
        color: '#f56400',
        domains: ['etsy.com'],
        productPatterns: [/\/listing\//i],
        features: ['variants', 'reviews'],
        apiAvailable: true,
        apiType: 'etsy_open_api'
      },
      cdiscount: {
        name: 'Cdiscount',
        icon: '🛒',
        color: '#e31837',
        domains: ['cdiscount.com'],
        productPatterns: [/\/f-\d+-[a-z0-9]+\.html|\/fp\//i],
        features: ['variants', 'reviews'],
        apiAvailable: false
      },
      fnac: {
        name: 'Fnac',
        icon: '📚',
        color: '#e4a600',
        domains: ['fnac.com'],
        productPatterns: [/\/a\d+\//i],
        features: ['reviews'],
        apiAvailable: false
      },
      rakuten: {
        name: 'Rakuten',
        icon: '🔴',
        color: '#bf0000',
        domains: ['rakuten.com', 'rakuten.fr'],
        productPatterns: [/\/product\//i],
        features: ['variants', 'reviews'],
        apiAvailable: true,
        apiType: 'rakuten_affiliate_api'
      },
      tiktok_shop: {
        name: 'TikTok Shop',
        icon: '🎵',
        color: '#010101',
        domains: ['shop.tiktok.com', 'tiktok.com/shop'],
        productPatterns: [/\/product\/|\/p\//i],
        features: ['variants', 'videos', 'reviews'],
        apiAvailable: true,
        apiType: 'tiktok_shop_api'
      },
      shopify: {
        name: 'Shopify',
        icon: '🛍️',
        color: '#96bf48',
        domains: ['myshopify.com'],
        productPatterns: [/\/products\//i],
        features: ['variants', 'reviews'],
        apiAvailable: true,
        apiType: 'shopify_storefront_api'
      },
      cjdropshipping: {
        name: 'CJ Dropshipping',
        icon: '📦',
        color: '#1a73e8',
        domains: ['cjdropshipping.com'],
        productPatterns: [/\/product-detail\//i],
        features: ['variants', 'reviews'],
        apiAvailable: true,
        apiType: 'cj_open_api'
      },
      banggood: {
        name: 'Banggood',
        icon: '📱',
        color: '#ff6600',
        domains: ['banggood.com'],
        productPatterns: [/\/-p-\d+\.html/i],
        features: ['variants', 'reviews'],
        apiAvailable: false
      },
      dhgate: {
        name: 'DHgate',
        icon: '🏭',
        color: '#e54d00',
        domains: ['dhgate.com'],
        productPatterns: [/\/product\/\d+\.html/i],
        features: ['variants', 'reviews'],
        apiAvailable: false
      },
      wish: {
        name: 'Wish',
        icon: '⭐',
        color: '#2fb7ec',
        domains: ['wish.com'],
        productPatterns: [/\/product\//i],
        features: ['variants', 'reviews'],
        apiAvailable: true,
        apiType: 'wish_api'
      },
      homedepot: {
        name: 'Home Depot',
        icon: '🏠',
        color: '#f96302',
        domains: ['homedepot.com'],
        productPatterns: [/\/p\//i],
        features: ['reviews', 'specifications'],
        apiAvailable: false
      },
      lowes: {
        name: "Lowe's",
        icon: '🔧',
        color: '#004990',
        domains: ['lowes.com'],
        productPatterns: [/\/pd\//i],
        features: ['reviews', 'specifications'],
        apiAvailable: false
      },
      costco: {
        name: 'Costco',
        icon: '🏬',
        color: '#e31837',
        domains: ['costco.com'],
        productPatterns: [/\.product\./i],
        features: ['reviews'],
        apiAvailable: false
      }
    },

    /**
     * Register an extractor for a platform
     */
    register(platform, ExtractorClass) {
      this.extractors[platform] = ExtractorClass;
      console.log(`[ExtractorRegistry] Registered extractor for: ${platform}`);
    },

    /**
     * Get extractor instance for current page
     */
    getExtractor(platform = null) {
      platform = platform || this.detectPlatform();
      
      // Return platform-specific extractor if available
      if (this.extractors[platform]) {
        return new this.extractors[platform]();
      }
      
      // Fallback to core extractor
      if (window.ShopOptiCoreExtractor) {
        return new window.ShopOptiCoreExtractor();
      }
      
      console.warn(`[ExtractorRegistry] No extractor found for: ${platform}`);
      return null;
    },

    /**
     * Detect current platform from URL
     */
    detectPlatform() {
      const hostname = window.location.hostname.toLowerCase();
      
      for (const [platform, config] of Object.entries(this.platforms)) {
        if (config.domains.some(d => hostname.includes(d))) {
          return platform;
        }
      }
      
      // Shopify detection via meta tags
      if (document.querySelector('meta[name="shopify-checkout-api-token"]') ||
          document.querySelector('link[href*="cdn.shopify.com"]') ||
          window.Shopify) {
        return 'shopify';
      }
      
      return 'generic';
    },

    /**
     * Check if current page is a product page
     */
    isProductPage(platform = null) {
      platform = platform || this.detectPlatform();
      const config = this.platforms[platform];
      
      if (!config) return false;
      
      return config.productPatterns.some(pattern => pattern.test(window.location.href));
    },

    /**
     * Get platform configuration
     */
    getPlatformConfig(platform = null) {
      platform = platform || this.detectPlatform();
      return this.platforms[platform] || {
        name: 'Unknown',
        icon: '🌐',
        color: '#6b7280',
        domains: [],
        productPatterns: [],
        features: [],
        apiAvailable: false
      };
    },

    /**
     * Check if platform has API support
     */
    hasAPISupport(platform = null) {
      platform = platform || this.detectPlatform();
      const config = this.platforms[platform];
      return config?.apiAvailable || false;
    },

    /**
     * Get API type for platform
     */
    getAPIType(platform = null) {
      platform = platform || this.detectPlatform();
      const config = this.platforms[platform];
      return config?.apiType || null;
    },

    /**
     * List all supported platforms
     */
    listPlatforms() {
      return Object.entries(this.platforms).map(([key, config]) => ({
        key,
        ...config
      }));
    },

    /**
     * Extract product using appropriate extractor
     * Now integrates with the full pipeline (validation, normalization)
     */
    async extract(options = {}) {
      const platform = options.platform || this.detectPlatform();
      
      // Use ExtractionOrchestrator if available (preferred)
      if (window.ExtractionOrchestrator && options.useOrchestrator !== false) {
        console.log('[ExtractorRegistry] Delegating to ExtractionOrchestrator');
        try {
          const result = await window.ExtractionOrchestrator.extract(
            window.location.href,
            { ...options, platform }
          );
          return result.product;
        } catch (e) {
          console.warn('[ExtractorRegistry] Orchestrator failed, using direct extraction:', e);
        }
      }

      // Use ExtractorBridge if available
      if (window.ExtractorBridge && options.useBridge !== false) {
        console.log('[ExtractorRegistry] Delegating to ExtractorBridge');
        try {
          return await window.ExtractorBridge.extract(window.location.href, options);
        } catch (e) {
          console.warn('[ExtractorRegistry] Bridge failed, using direct extraction:', e);
        }
      }

      // Direct extraction fallback
      const extractor = this.getExtractor(platform);
      
      if (!extractor) {
        throw new Error(`No extractor available for platform: ${platform}`);
      }
      
      // Check if we should use API (if available and configured)
      const config = this.getPlatformConfig(platform);
      if (config.apiAvailable && options.preferAPI !== false) {
        try {
          const apiResult = await this.extractViaAPI(platform, options);
          if (apiResult) return apiResult;
        } catch (e) {
          console.warn(`[ExtractorRegistry] API extraction failed, falling back to scraping:`, e);
        }
      }
      
      // Direct scraping
      const rawResult = await extractor.extractComplete();
      
      // Apply normalization if available
      if (window.ShopOptiNormalizer) {
        return window.ShopOptiNormalizer.normalize(rawResult, platform);
      }
      
      return rawResult;
    },

    /**
     * Extract using official API (when available)
     */
    async extractViaAPI(platform, options = {}) {
      const apiType = this.getAPIType(platform);
      
      if (!apiType) return null;
      
      // Delegate to OfficialAPIClient
      if (window.OfficialAPIClient) {
        return window.OfficialAPIClient.extract(apiType, window.location.href, options);
      }
      
      return null;
    },

    /**
     * Validate extracted product data
     * @param {object} productData - Raw extracted data
     * @returns {object} Validation result
     */
    validateProduct(productData) {
      if (window.ShopOptiValidator) {
        return window.ShopOptiValidator.validate(productData);
      }
      
      // Basic validation fallback
      const issues = [];
      const warnings = [];
      
      if (!productData.title) issues.push({ field: 'title', message: 'Missing title' });
      if (!productData.price) issues.push({ field: 'price', message: 'Missing price' });
      if (!productData.images?.length) warnings.push({ field: 'images', message: 'No images' });
      
      return {
        valid: issues.length === 0,
        score: issues.length === 0 ? 80 : 30,
        issues,
        warnings
      };
    },

    /**
     * Get extraction capabilities for current platform
     */
    getExtractionCapabilities(platform = null) {
      platform = platform || this.detectPlatform();
      
      if (window.ExtractorBridge) {
        return window.ExtractorBridge.getCapabilities(platform);
      }
      
      const config = this.getPlatformConfig(platform);
      return {
        supports: config.features || [],
        reliability: config.apiAvailable ? 0.9 : 0.7,
        hasApi: config.apiAvailable,
        apiType: config.apiType
      };
    }
  };

  // Auto-register existing extractors
  const autoRegisterExtractors = {
    'aliexpress': 'AliExpressExtractor',
    'amazon': 'AmazonExtractor',
    'ebay': 'EbayExtractor',
    'temu': 'TemuExtractor',
    'shein': 'SheinExtractor',
    'tiktok_shop': 'TikTokShopExtractor',
    'walmart': 'WalmartExtractor',
    'etsy': 'EtsyExtractor',
    'cdiscount': 'CdiscountExtractor',
    'fnac': 'FnacExtractor',
    'rakuten': 'RakutenExtractor',
    'shopify': 'ShopifyExtractor',
    'cjdropshipping': 'CJDropshippingExtractor',
    'banggood': 'BanggoodExtractor',
    'dhgate': 'DHgateExtractor',
    'wish': 'WishExtractor',
    'homedepot': 'HomeDepotExtractor'
  };

  // Register all available extractors
  for (const [platform, extractorName] of Object.entries(autoRegisterExtractors)) {
    if (window[extractorName]) {
      ExtractorRegistry.register(platform, window[extractorName]);
    }
  }

  // Export
  window.ExtractorRegistry = ExtractorRegistry;
  
})();
