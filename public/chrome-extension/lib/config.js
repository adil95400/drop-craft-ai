/**
 * ShopOpti+ Configuration Module v5.0
 * Centralized configuration for the extension
 */

const Config = {
  VERSION: '5.0.0',
  BRAND: 'ShopOpti+',
  
  // API Configuration
  API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
  APP_URL: 'https://shopopti.io',
  
  // Extraction Limits
  MAX_IMAGES: 50,
  MAX_VIDEOS: 20,
  MAX_REVIEWS: 200,
  MAX_VARIANTS: 500,
  MAX_DESCRIPTION_LENGTH: 10000,
  
  // Performance Settings
  DEBOUNCE_DELAY_MS: 350,
  SCROLL_DELAY_MS: 600,
  MAX_SCROLL_ATTEMPTS: 15,
  LOAD_MORE_DELAY: 800,
  MUTATION_OBSERVER_DEBOUNCE: 500,
  
  // Rate Limiting
  RATE_LIMIT_REQUESTS: 30,
  RATE_LIMIT_WINDOW_MS: 60000,
  
  // Alarm Intervals
  SYNC_INTERVAL_MINUTES: 30,
  PRICE_CHECK_INTERVAL_MINUTES: 60,
  STOCK_CHECK_INTERVAL_MINUTES: 120,
  
  // Supported Platforms with metadata
  PLATFORMS: {
    amazon: {
      name: 'Amazon',
      icon: '📦',
      color: '#ff9900',
      domains: ['amazon.com', 'amazon.fr', 'amazon.de', 'amazon.co.uk', 'amazon.es', 'amazon.it', 'amazon.ca', 'amazon.co.jp'],
      productPatterns: [/\/(dp|gp\/product)\/[A-Z0-9]+/i],
      listingPatterns: [/\/gp\/bestsellers|\/s\?|\/b\?|\/zgbs\//i],
      supportsReviews: true,
      supportsVariants: true,
      supportsVideos: true
    },
    aliexpress: {
      name: 'AliExpress',
      icon: '🛒',
      color: '#ff6a00',
      domains: ['aliexpress.com', 'aliexpress.fr', 'aliexpress.us'],
      productPatterns: [/\/item\/|\/i\/|\/_p\//i],
      listingPatterns: [/\/category\/|\/wholesale|SearchText=/i],
      supportsReviews: true,
      supportsVariants: true,
      supportsVideos: true
    },
    ebay: {
      name: 'eBay',
      icon: '🏷️',
      color: '#e53238',
      domains: ['ebay.com', 'ebay.fr', 'ebay.de', 'ebay.co.uk'],
      productPatterns: [/\/itm\/\d+/i],
      listingPatterns: [/\/b\/|\/sch\//i],
      supportsReviews: true,
      supportsVariants: true,
      supportsVideos: false
    },
    walmart: {
      name: 'Walmart',
      icon: '🏪',
      color: '#0071ce',
      domains: ['walmart.com'],
      productPatterns: [/\/ip\/\d+/i],
      listingPatterns: [/\/search\/|\/browse\//i],
      supportsReviews: true,
      supportsVariants: true,
      supportsVideos: true
    },
    temu: {
      name: 'Temu',
      icon: '🎁',
      color: '#f97316',
      domains: ['temu.com'],
      productPatterns: [/\/[a-z0-9_-]+-g-\d+\.html|goods\.html/i],
      listingPatterns: [/\/channel\/|\/search_result/i],
      supportsReviews: true,
      supportsVariants: true,
      supportsVideos: true
    },
    shein: {
      name: 'Shein',
      icon: '👗',
      color: '#000000',
      domains: ['shein.com', 'shein.fr'],
      productPatterns: [/\/-p-\d+\.html/i],
      listingPatterns: [/\/category\/|pdsearch/i],
      supportsReviews: true,
      supportsVariants: true,
      supportsVideos: true
    },
    etsy: {
      name: 'Etsy',
      icon: '🎨',
      color: '#f56400',
      domains: ['etsy.com'],
      productPatterns: [/\/listing\//i],
      listingPatterns: [/\/search\?|\/c\//i],
      supportsReviews: true,
      supportsVariants: true,
      supportsVideos: false
    },
    cdiscount: {
      name: 'Cdiscount',
      icon: '🛒',
      color: '#e31837',
      domains: ['cdiscount.com'],
      productPatterns: [/\/f-\d+-[a-z0-9]+\.html|\/fp\//i],
      listingPatterns: [/\/search|\/browse|\/l-\d+/i],
      supportsReviews: true,
      supportsVariants: true,
      supportsVideos: false
    },
    fnac: {
      name: 'Fnac',
      icon: '📚',
      color: '#e4a600',
      domains: ['fnac.com'],
      productPatterns: [/\/a\d+\//i],
      listingPatterns: [/\/recherche\//i],
      supportsReviews: true,
      supportsVariants: false,
      supportsVideos: false
    },
    shopify: {
      name: 'Shopify',
      icon: '🛍️',
      color: '#96bf48',
      domains: ['myshopify.com'],
      productPatterns: [/\/products\//i],
      listingPatterns: [/\/collections\//i],
      supportsReviews: true,
      supportsVariants: true,
      supportsVideos: false
    },
    cjdropshipping: {
      name: 'CJ Dropshipping',
      icon: '📦',
      color: '#1a73e8',
      domains: ['cjdropshipping.com'],
      productPatterns: [/\/product-detail\//i],
      listingPatterns: [/\/search\//i],
      supportsReviews: true,
      supportsVariants: true,
      supportsVideos: false
    },
    banggood: {
      name: 'Banggood',
      icon: '📱',
      color: '#ff6600',
      domains: ['banggood.com'],
      productPatterns: [/\/-p-\d+\.html/i],
      listingPatterns: [/\/search\//i],
      supportsReviews: true,
      supportsVariants: true,
      supportsVideos: false
    },
    dhgate: {
      name: 'DHgate',
      icon: '🏭',
      color: '#e54d00',
      domains: ['dhgate.com'],
      productPatterns: [/\/product\/\d+\.html/i],
      listingPatterns: [/\/wholesale\//i],
      supportsReviews: true,
      supportsVariants: true,
      supportsVideos: false
    },
    wish: {
      name: 'Wish',
      icon: '⭐',
      color: '#2fb7ec',
      domains: ['wish.com'],
      productPatterns: [/\/product\//i],
      listingPatterns: [/\/search\//i],
      supportsReviews: true,
      supportsVariants: true,
      supportsVideos: false
    }
  },
  
  /**
   * Detect platform from hostname
   */
  detectPlatform(hostname) {
    if (!hostname) hostname = window.location.hostname;
    hostname = hostname.toLowerCase();
    
    for (const [key, config] of Object.entries(this.PLATFORMS)) {
      if (config.domains.some(d => hostname.includes(d))) {
        return key;
      }
    }
    
    // Shopify detection via meta tags
    if (typeof document !== 'undefined') {
      if (document.querySelector('meta[name="shopify-checkout-api-token"]') ||
          document.querySelector('link[href*="cdn.shopify.com"]') ||
          window.Shopify) {
        return 'shopify';
      }
    }
    
    return 'generic';
  },
  
  /**
   * Get platform configuration
   */
  getPlatformConfig(platform) {
    return this.PLATFORMS[platform] || {
      name: 'Unknown',
      icon: '🌐',
      color: '#6b7280',
      domains: [],
      productPatterns: [/\/product/i],
      listingPatterns: [/\/search|\/category/i],
      supportsReviews: false,
      supportsVariants: false,
      supportsVideos: false
    };
  },
  
  /**
   * Check if URL is a product page
   */
  isProductPage(url, platform) {
    if (!url) url = window.location.href;
    if (!platform) platform = this.detectPlatform();
    
    const config = this.getPlatformConfig(platform);
    return config.productPatterns.some(pattern => pattern.test(url));
  },
  
  /**
   * Check if URL is a listing page
   */
  isListingPage(url, platform) {
    if (!url) url = window.location.href;
    if (!platform) platform = this.detectPlatform();
    
    const config = this.getPlatformConfig(platform);
    return config.listingPatterns.some(pattern => pattern.test(url));
  }
};

// Export for both contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Config;
}

if (typeof window !== 'undefined') {
  window.ShopOptiConfig = Config;
}
