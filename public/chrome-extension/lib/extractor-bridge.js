/**
 * ShopOpti+ Extractor Bridge v5.7.0
 * Unified interface connecting all 17+ platform extractors 
 * with the atomic import pipeline
 * 
 * Architecture:
 * ExtractorRegistry -> ExtractorBridge -> DataNormalizer -> ProductValidator -> Pipeline
 */

(function() {
  'use strict';

  if (window.__shopoptiExtractorBridgeLoaded) return;
  window.__shopoptiExtractorBridgeLoaded = true;

  /**
   * Platform capability matrix - what each platform can extract
   */
  const PLATFORM_CAPABILITIES = {
    amazon: {
      supports: ['title', 'description', 'price', 'images', 'videos', 'variants', 'reviews', 'specifications', 'brand', 'sku', 'aplus'],
      reliability: 0.95,
      hasApi: true,
      apiType: 'amazon_pa_api'
    },
    aliexpress: {
      supports: ['title', 'description', 'price', 'images', 'videos', 'variants', 'reviews', 'specifications', 'brand'],
      reliability: 0.90,
      hasApi: true,
      apiType: 'aliexpress_open_platform'
    },
    ebay: {
      supports: ['title', 'description', 'price', 'images', 'variants', 'reviews', 'brand'],
      reliability: 0.88,
      hasApi: true,
      apiType: 'ebay_browse_api'
    },
    temu: {
      supports: ['title', 'description', 'price', 'images', 'videos', 'variants', 'reviews'],
      reliability: 0.75,
      hasApi: false
    },
    shein: {
      supports: ['title', 'description', 'price', 'images', 'videos', 'variants', 'reviews'],
      reliability: 0.78,
      hasApi: false
    },
    walmart: {
      supports: ['title', 'description', 'price', 'images', 'variants', 'reviews', 'brand', 'specifications'],
      reliability: 0.85,
      hasApi: true,
      apiType: 'walmart_affiliate_api'
    },
    etsy: {
      supports: ['title', 'description', 'price', 'images', 'variants', 'reviews', 'brand'],
      reliability: 0.88,
      hasApi: true,
      apiType: 'etsy_open_api'
    },
    cdiscount: {
      supports: ['title', 'description', 'price', 'images', 'variants', 'reviews', 'brand'],
      reliability: 0.80,
      hasApi: false
    },
    fnac: {
      supports: ['title', 'description', 'price', 'images', 'reviews', 'brand'],
      reliability: 0.82,
      hasApi: false
    },
    rakuten: {
      supports: ['title', 'description', 'price', 'images', 'variants', 'reviews'],
      reliability: 0.80,
      hasApi: true,
      apiType: 'rakuten_affiliate_api'
    },
    shopify: {
      supports: ['title', 'description', 'price', 'images', 'variants', 'reviews', 'brand', 'sku'],
      reliability: 0.92,
      hasApi: true,
      apiType: 'shopify_storefront_api'
    },
    tiktok_shop: {
      supports: ['title', 'description', 'price', 'images', 'videos', 'variants', 'reviews'],
      reliability: 0.75,
      hasApi: true,
      apiType: 'tiktok_shop_api'
    },
    cjdropshipping: {
      supports: ['title', 'description', 'price', 'images', 'variants', 'specifications', 'sku'],
      reliability: 0.90,
      hasApi: true,
      apiType: 'cj_open_api'
    },
    banggood: {
      supports: ['title', 'description', 'price', 'images', 'variants', 'reviews'],
      reliability: 0.78,
      hasApi: false
    },
    dhgate: {
      supports: ['title', 'description', 'price', 'images', 'variants', 'reviews'],
      reliability: 0.75,
      hasApi: false
    },
    wish: {
      supports: ['title', 'description', 'price', 'images', 'variants', 'reviews'],
      reliability: 0.70,
      hasApi: true,
      apiType: 'wish_api'
    },
    homedepot: {
      supports: ['title', 'description', 'price', 'images', 'reviews', 'specifications', 'brand', 'sku'],
      reliability: 0.85,
      hasApi: false
    },
    generic: {
      supports: ['title', 'description', 'price', 'images'],
      reliability: 0.50,
      hasApi: false
    }
  };

  /**
   * Extraction strategies per platform
   */
  const EXTRACTION_STRATEGIES = {
    // Primary: Try API first, fallback to scraper
    api_first: ['amazon', 'aliexpress', 'ebay', 'shopify', 'etsy'],
    // Primary: Scraper with network interception
    network_intercept: ['temu', 'shein', 'tiktok_shop'],
    // Primary: Pure DOM scraping
    dom_scrape: ['cdiscount', 'fnac', 'rakuten', 'banggood', 'dhgate', 'wish', 'homedepot']
  };

  class ExtractorBridge {
    constructor() {
      this.extractionAttempts = new Map();
      this.extractionCache = new Map();
      this.networkInterceptor = null;
    }

    /**
     * Get platform capabilities
     */
    getCapabilities(platform) {
      return PLATFORM_CAPABILITIES[platform] || PLATFORM_CAPABILITIES.generic;
    }

    /**
     * Get extraction strategy for platform
     */
    getStrategy(platform) {
      for (const [strategy, platforms] of Object.entries(EXTRACTION_STRATEGIES)) {
        if (platforms.includes(platform)) return strategy;
      }
      return 'dom_scrape';
    }

    /**
     * Extract product with intelligent routing
     * Routes to the best extraction method based on platform
     */
    async extract(url, options = {}) {
      const platform = this.detectPlatform(url);
      const capabilities = this.getCapabilities(platform);
      const strategy = this.getStrategy(platform);

      console.log(`[ExtractorBridge] Extracting from ${platform} using ${strategy} strategy`);

      // Check cache first
      const cacheKey = this.getCacheKey(url);
      if (!options.bypassCache && this.extractionCache.has(cacheKey)) {
        const cached = this.extractionCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 300000) { // 5 min cache
          console.log('[ExtractorBridge] Returning cached extraction');
          return cached.data;
        }
      }

      let result = null;
      let extractionMethod = 'unknown';

      try {
        // Strategy execution
        switch (strategy) {
          case 'api_first':
            result = await this.extractWithApiFirst(platform, url, options);
            extractionMethod = result?._extractionMethod || 'api_or_scrape';
            break;
            
          case 'network_intercept':
            result = await this.extractWithNetworkIntercept(platform, url, options);
            extractionMethod = 'network_intercept';
            break;
            
          case 'dom_scrape':
          default:
            result = await this.extractWithDomScrape(platform, options);
            extractionMethod = 'dom_scrape';
            break;
        }

        if (!result) {
          throw new Error(`Extraction failed for ${platform}`);
        }

        // Enrich result with metadata
        result = this.enrichResult(result, {
          platform,
          url,
          capabilities,
          extractionMethod,
          extractedAt: new Date().toISOString()
        });

        // Cache successful extraction
        this.extractionCache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });

        return result;

      } catch (error) {
        console.error(`[ExtractorBridge] Extraction error for ${platform}:`, error);
        
        // Attempt fallback
        const fallbackResult = await this.attemptFallback(platform, url, error);
        if (fallbackResult) {
          return this.enrichResult(fallbackResult, {
            platform,
            url,
            capabilities,
            extractionMethod: 'fallback',
            extractedAt: new Date().toISOString()
          });
        }
        
        throw error;
      }
    }

    /**
     * API-first extraction strategy
     */
    async extractWithApiFirst(platform, url, options) {
      const capabilities = this.getCapabilities(platform);

      // Try API extraction first
      if (capabilities.hasApi && window.OfficialAPIClient) {
        try {
          console.log(`[ExtractorBridge] Attempting API extraction for ${platform}`);
          const apiResult = await window.OfficialAPIClient.extract(
            capabilities.apiType, 
            url, 
            options
          );
          
          if (apiResult && apiResult.title) {
            apiResult._extractionMethod = 'official_api';
            return apiResult;
          }
        } catch (apiError) {
          console.warn(`[ExtractorBridge] API extraction failed, falling back to scraper:`, apiError.message);
        }
      }

      // Fallback to platform-specific extractor
      return this.extractWithDomScrape(platform, options);
    }

    /**
     * Network interception strategy (for SPA sites)
     */
    async extractWithNetworkIntercept(platform, url, options) {
      // Start network interception if not already active
      if (!this.networkInterceptor) {
        this.setupNetworkInterceptor();
      }

      // Wait a bit for any pending network requests
      await this.waitForNetworkData(1500);

      // Extract using captured network data + DOM
      const extractor = this.getExtractor(platform);
      if (!extractor) {
        throw new Error(`No extractor available for ${platform}`);
      }

      const result = await extractor.extractComplete();
      
      // Merge with intercepted network data
      if (this.networkInterceptor?.capturedData) {
        return this.mergeNetworkData(result, this.networkInterceptor.capturedData);
      }

      return result;
    }

    /**
     * Pure DOM scraping strategy
     */
    async extractWithDomScrape(platform, options) {
      const extractor = this.getExtractor(platform);
      
      if (!extractor) {
        // Fallback to core extractor
        if (window.ShopOptiCoreExtractor) {
          console.log('[ExtractorBridge] Using core extractor as fallback');
          const coreExtractor = new window.ShopOptiCoreExtractor();
          return coreExtractor.extractComplete();
        }
        throw new Error(`No extractor available for ${platform}`);
      }

      return extractor.extractComplete();
    }

    /**
     * Get the appropriate extractor for platform
     */
    getExtractor(platform) {
      // Use ExtractorRegistry if available
      if (window.ExtractorRegistry) {
        return window.ExtractorRegistry.getExtractor(platform);
      }

      // Direct class lookup
      const extractorMap = {
        'amazon': window.AmazonExtractor,
        'aliexpress': window.AliExpressExtractor,
        'ebay': window.EbayExtractor,
        'temu': window.TemuExtractor,
        'shein': window.SheinExtractor,
        'walmart': window.WalmartExtractor,
        'etsy': window.EtsyExtractor,
        'cdiscount': window.CdiscountExtractor,
        'fnac': window.FnacExtractor,
        'rakuten': window.RakutenExtractor,
        'shopify': window.ShopifyExtractor,
        'tiktok_shop': window.TikTokShopExtractor,
        'cjdropshipping': window.CJDropshippingExtractor,
        'banggood': window.BanggoodExtractor,
        'dhgate': window.DHgateExtractor,
        'wish': window.WishExtractor,
        'homedepot': window.HomeDepotExtractor
      };

      const ExtractorClass = extractorMap[platform];
      if (ExtractorClass) {
        return new ExtractorClass();
      }

      return null;
    }

    /**
     * Detect platform from URL
     */
    detectPlatform(url = window.location.href) {
      const hostname = new URL(url).hostname.toLowerCase();
      
      const platformPatterns = {
        'amazon': /amazon\.(com|fr|de|co\.uk|es|it|ca|co\.jp)/,
        'aliexpress': /aliexpress\.(com|fr|us)/,
        'ebay': /ebay\.(com|fr|de|co\.uk)/,
        'temu': /temu\.com/,
        'shein': /shein\.(com|fr)/,
        'walmart': /walmart\.com/,
        'etsy': /etsy\.com/,
        'cdiscount': /cdiscount\.com/,
        'fnac': /fnac\.com/,
        'rakuten': /rakuten\.(com|fr)/,
        'tiktok_shop': /shop\.tiktok\.com|tiktok\.com\/shop/,
        'cjdropshipping': /cjdropshipping\.com/,
        'banggood': /banggood\.com/,
        'dhgate': /dhgate\.com/,
        'wish': /wish\.com/,
        'homedepot': /homedepot\.com/
      };

      for (const [platform, pattern] of Object.entries(platformPatterns)) {
        if (pattern.test(hostname)) {
          return platform;
        }
      }

      // Shopify detection
      if (hostname.includes('myshopify.com') || 
          document.querySelector('meta[name="shopify-checkout-api-token"]') ||
          window.Shopify) {
        return 'shopify';
      }

      return 'generic';
    }

    /**
     * Setup network interceptor for SPA sites
     */
    setupNetworkInterceptor() {
      this.networkInterceptor = {
        capturedData: {},
        originalFetch: window.fetch,
        originalXHR: window.XMLHttpRequest.prototype.open
      };

      // Intercept fetch
      const self = this;
      window.fetch = async function(...args) {
        const response = await self.networkInterceptor.originalFetch.apply(this, args);
        
        try {
          const url = args[0].toString();
          if (self.isProductDataRequest(url)) {
            const clone = response.clone();
            const data = await clone.json();
            self.networkInterceptor.capturedData = {
              ...self.networkInterceptor.capturedData,
              ...data
            };
          }
        } catch (e) {}
        
        return response;
      };
    }

    /**
     * Check if a network request is fetching product data
     */
    isProductDataRequest(url) {
      const productEndpoints = [
        '/api/product',
        '/pdp/',
        '/item/',
        '/goods',
        '/product-detail',
        'GetProductDetailInfo',
        'itemInfo'
      ];
      return productEndpoints.some(endpoint => url.includes(endpoint));
    }

    /**
     * Wait for network data to be captured
     */
    waitForNetworkData(timeout) {
      return new Promise(resolve => setTimeout(resolve, timeout));
    }

    /**
     * Merge network captured data with DOM extraction
     */
    mergeNetworkData(domResult, networkData) {
      // Network data often has better structured data
      return {
        ...domResult,
        // Override with network data if available
        title: networkData.title || networkData.productName || domResult.title,
        price: networkData.price || networkData.salePrice || domResult.price,
        images: [
          ...new Set([
            ...(networkData.images || []),
            ...(domResult.images || [])
          ])
        ],
        videos: [
          ...new Set([
            ...(networkData.videos || []),
            ...(domResult.videos || [])
          ])
        ],
        variants: networkData.variants || networkData.skus || domResult.variants,
        _networkEnriched: true
      };
    }

    /**
     * Attempt fallback extraction
     */
    async attemptFallback(platform, url, originalError) {
      console.log(`[ExtractorBridge] Attempting fallback extraction for ${platform}`);
      
      // Track attempts
      const attempts = this.extractionAttempts.get(url) || 0;
      if (attempts >= 3) {
        console.error('[ExtractorBridge] Max fallback attempts reached');
        return null;
      }
      this.extractionAttempts.set(url, attempts + 1);

      try {
        // Try core extractor as ultimate fallback
        if (window.ShopOptiCoreExtractor) {
          const coreExtractor = new window.ShopOptiCoreExtractor();
          return await coreExtractor.extractComplete();
        }
      } catch (fallbackError) {
        console.error('[ExtractorBridge] Fallback also failed:', fallbackError);
      }

      return null;
    }

    /**
     * Enrich extraction result with metadata
     */
    enrichResult(result, metadata) {
      return {
        ...result,
        _meta: {
          platform: metadata.platform,
          sourceUrl: metadata.url,
          capabilities: metadata.capabilities,
          extractionMethod: metadata.extractionMethod,
          extractedAt: metadata.extractedAt,
          version: '5.7.0'
        }
      };
    }

    /**
     * Generate cache key for URL
     */
    getCacheKey(url) {
      try {
        const urlObj = new URL(url);
        return `${urlObj.hostname}${urlObj.pathname}`;
      } catch {
        return url;
      }
    }

    /**
     * Clear extraction cache
     */
    clearCache() {
      this.extractionCache.clear();
      this.extractionAttempts.clear();
    }

    /**
     * Get extraction statistics
     */
    getStats() {
      return {
        cacheSize: this.extractionCache.size,
        totalAttempts: Array.from(this.extractionAttempts.values()).reduce((a, b) => a + b, 0),
        platforms: Object.keys(PLATFORM_CAPABILITIES).length
      };
    }
  }

  // Export singleton
  window.ExtractorBridge = new ExtractorBridge();

  console.log('[ShopOpti+] ExtractorBridge v5.7.0 loaded - 17 platforms supported');

})();
