/**
 * ShopOpti+ Pro - Extractor Registry
 * Manages marketplace-specific product extractors
 */
;(function() {
  'use strict';

  const extractors = {};

  const ExtractorRegistry = {
    register(platform, extractor) {
      extractors[platform] = extractor;
    },

    get(platform) {
      return extractors[platform] || null;
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
        '1688': '1688',
        'taobao': 'taobao',
        'alibaba': 'alibaba',
        'dhgate': 'dhgate',
        'wish': 'wish'
      };

      for (const [key, value] of Object.entries(platformMap)) {
        if (hostname.includes(key)) return value;
      }
      return null;
    },

    listPlatforms() {
      return Object.keys(extractors);
    }
  };

  if (typeof window !== 'undefined') {
    window.ExtractorRegistry = ExtractorRegistry;
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.ExtractorRegistry = ExtractorRegistry;
  }
})();
