/**
 * ShopOpti+ Pro - Extractor Registry v7
 * Manages marketplace-specific product extractors with video/review support
 */
;(function() {
  'use strict';

  const extractors = {};

  const ExtractorRegistry = {
    register(platform, ExtractorClass) {
      extractors[platform] = ExtractorClass;
      console.log(`[ExtractorRegistry] Registered: ${platform}`);
    },

    get(platform) {
      return extractors[platform] || null;
    },

    /**
     * Create an instance of the platform-specific extractor
     */
    createExtractor(platform) {
      const ExtractorClass = extractors[platform];
      if (ExtractorClass) {
        return new ExtractorClass();
      }
      return null;
    },

    detect(url) {
      const hostname = new URL(url).hostname.toLowerCase();
      const platformMap = {
        'aliexpress': 'aliexpress',
        'amazon': 'amazon',
        'ebay': 'ebay',
        'walmart': 'walmart',
        'temu': 'temu',
        'shein': 'shein',
        'etsy': 'etsy',
        'banggood': 'banggood',
        'cjdropshipping': 'cjdropshipping',
        'tiktok': 'tiktok',
        '1688': '1688',
        'taobao': 'taobao',
        'alibaba': 'alibaba',
        'dhgate': 'dhgate',
        'wish': 'wish',
        'cdiscount': 'cdiscount',
        'fnac': 'fnac',
        'rakuten': 'rakuten'
      };

      for (const [key, value] of Object.entries(platformMap)) {
        if (hostname.includes(key)) return value;
      }
      return null;
    },

    listPlatforms() {
      return Object.keys(extractors);
    },

    /**
     * Check which features a platform extractor supports
     */
    getCapabilities(platform) {
      const extractor = this.createExtractor(platform);
      if (!extractor) return { images: true, variants: false, reviews: false, videos: false };
      
      return {
        images: true,
        variants: typeof extractor._extractVariants === 'function',
        reviews: typeof extractor._extractReviews === 'function',
        videos: typeof extractor._extractVideos === 'function',
        hdImages: typeof extractor._extractHDImages === 'function'
      };
    }
  };

  if (typeof window !== 'undefined') {
    window.ExtractorRegistry = ExtractorRegistry;
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.ExtractorRegistry = ExtractorRegistry;
  }
})();
