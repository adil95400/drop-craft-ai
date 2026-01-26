/**
 * ShopOpti+ Centralized Selectors Configuration v5.7.0
 * Dynamic selectors with fallback chains for maximum extraction reliability
 * Updatable without republishing extension
 */

const SelectorsConfig = {
  VERSION: '5.7.0',
  LAST_UPDATED: '2026-01-26',
  
  // Selector priority: Primary (most specific) -> Fallback chains
  platforms: {
    amazon: {
      name: 'Amazon',
      domains: ['amazon.com', 'amazon.fr', 'amazon.de', 'amazon.co.uk', 'amazon.es', 'amazon.it', 'amazon.ca', 'amazon.co.jp'],
      
      // Product page detection
      productPatterns: [/\/dp\/[A-Z0-9]+/i, /\/gp\/product\/[A-Z0-9]+/i],
      listingPatterns: [/\/s\?|\/gp\/bestsellers|\/zgbs\//i],
      
      // Product button injection targets
      buttonTargets: [
        '#add-to-cart-button',
        '#buy-now-button', 
        '#buybox',
        '#rightCol',
        '#desktop_buybox',
        '.a-button-stack',
        '#addToCart',
        '#add-to-cart-button-ubb'
      ],
      
      // Listing card selectors
      cardSelectors: [
        '[data-asin]:not([data-shopopti-card])',
        '.s-result-item:not([data-shopopti-card])',
        '.a-section.a-spacing-medium:not([data-shopopti-card])'
      ],
      
      // Extraction selectors
      extraction: {
        title: ['#productTitle', '#title', '.product-title-word-break'],
        price: [
          '#priceblock_ourprice',
          '#priceblock_dealprice',
          '.a-price .a-offscreen:first-child',
          '#corePrice_feature_div .a-offscreen',
          '.apexPriceToPay .a-offscreen',
          '#price_inside_buybox',
          '.priceToPay .a-offscreen'
        ],
        originalPrice: [
          '.a-text-strike .a-offscreen',
          '.a-price[data-a-strike] .a-offscreen',
          '.basisPrice .a-offscreen'
        ],
        images: [
          '#altImages img',
          '#imageBlock img',
          '.a-dynamic-image',
          '#landingImage',
          '#main-image-container img'
        ],
        description: ['#feature-bullets ul', '#productDescription', '#aplus'],
        brand: ['#bylineInfo', 'a#bylineInfo', '.po-brand .a-span9'],
        rating: ['#acrPopover .a-icon-alt', '.a-icon-star span'],
        reviewCount: ['#acrCustomerReviewText', '#averageCustomerReviews .a-declarative'],
        variants: [
          '#variation_color_name li',
          '#variation_size_name li',
          '.swatchAvailable',
          '[data-defaultasin]'
        ],
        specifications: ['#productDetails_techSpec_section_1 tr', '#prodDetails table tr']
      },
      
      // URL extraction from card
      extractUrl: (card) => {
        const link = card.querySelector('a[href*="/dp/"]');
        if (link) return new URL(link.href, 'https://www.amazon.com').href;
        const asin = card.getAttribute('data-asin');
        if (asin) return `https://www.amazon.com/dp/${asin}`;
        return null;
      }
    },
    
    aliexpress: {
      name: 'AliExpress',
      domains: ['aliexpress.com', 'aliexpress.fr', 'aliexpress.us', 'fr.aliexpress.com'],
      
      productPatterns: [/\/item\/|\/i\/|\/_p\//i],
      listingPatterns: [/\/category\/|\/wholesale|SearchText=/i],
      
      buttonTargets: [
        '.product-action',
        '.product-action-main',
        '.action--container',
        '.product-info',
        '[class*="AddCart"]',
        '[class*="buy-now"]',
        '.comet-v2-btn-important'
      ],
      
      cardSelectors: [
        '.search-item-card:not([data-shopopti-card])',
        '.list-item:not([data-shopopti-card])',
        '[data-pl-id]:not([data-shopopti-card])',
        '[class*="SearchProductFeed--item"]:not([data-shopopti-card])',
        '[class*="_2s3W9"]:not([data-shopopti-card])'
      ],
      
      extraction: {
        title: [
          'h1[data-pl="product-title"]',
          '.product-title',
          'h1[class*="title"]',
          '.product-title-text',
          '[data-spm="title"]'
        ],
        price: [
          '.product-price-current',
          '[class*="price-current"]',
          '.uniform-banner-box-price',
          '[class*="Price--originalText"]',
          '[class*="es--wrap"] span:first-child'
        ],
        originalPrice: [
          '.product-price-original',
          '[class*="price-del"]',
          '[class*="Price--originalTextDel"]'
        ],
        images: [
          '[class*="slider"] img',
          '.images-view img',
          '[class*="gallery"] img',
          '[class*="Carousel"] img',
          'img[src*="alicdn.com"]'
        ],
        description: [
          '.product-description',
          '[class*="description"]',
          '.detail-desc-decorate-richtext'
        ],
        brand: ['.store-name', '[class*="store-name"]', '[class*="StoreName"]'],
        variants: [
          '[class*="sku-property"] li',
          '.sku-item',
          '[class*="skuList"] li',
          '[class*="Property--item"]'
        ],
        shipping: [
          '[class*="shipping"]',
          '[class*="delivery"]',
          '[class*="Shipping--text"]'
        ]
      },
      
      extractUrl: (card) => {
        const link = card.querySelector('a[href*="/item/"], a[href*="/i/"]');
        return link ? link.href : null;
      }
    },
    
    ebay: {
      name: 'eBay',
      domains: ['ebay.com', 'ebay.fr', 'ebay.de', 'ebay.co.uk'],
      
      productPatterns: [/\/itm\/\d+/i],
      listingPatterns: [/\/b\/|\/sch\//i],
      
      buttonTargets: [
        '#binBtn_btn',
        '#is498i498',
        '.ux-call-to-action',
        '#mainContent .x-bin-action',
        '[data-testid="ux-call-to-action"]'
      ],
      
      cardSelectors: [
        '.s-item:not([data-shopopti-card])',
        '.srp-results .s-item__wrapper:not([data-shopopti-card])'
      ],
      
      extraction: {
        title: ['h1.x-item-title__mainTitle', '[data-testid="x-item-title"]', '#itemTitle'],
        price: ['[data-testid="x-price-primary"] .ux-textspans', '[itemprop="price"]', '#prcIsum'],
        images: ['.ux-image-carousel img', '[data-testid="ux-image-carousel"] img', '#icImg'],
        description: ['#desc_wrapper', '.d-item-description', '#viTabs_0_is'],
        brand: ['[data-testid="x-store-info"] a', '.x-sellercard-atf__info'],
        shipping: ['.ux-labels-values--shipping', '[data-testid="ux-labels-values"]']
      },
      
      extractUrl: (card) => {
        const link = card.querySelector('a[href*="/itm/"]');
        return link ? link.href : null;
      }
    },
    
    temu: {
      name: 'Temu',
      domains: ['temu.com'],
      
      productPatterns: [/\/goods\.html|g-\d+\.html/i],
      listingPatterns: [/\/channel\/|\/search_result/i],
      
      buttonTargets: [
        '[class*="AddToCart"]',
        '[class*="buy-button"]',
        '[class*="action-bar"]',
        'button[class*="_2dQOZ"]',
        '[class*="_3OQ93"]'
      ],
      
      cardSelectors: [
        '[class*="goods-container"]:not([data-shopopti-card])',
        '[class*="product-card"]:not([data-shopopti-card])',
        '[class*="_18hWC"]:not([data-shopopti-card])'
      ],
      
      extraction: {
        title: ['h1[class*="title"]', '[class*="goodsTitle"]', '[class*="_2rn4t"]'],
        price: ['[class*="price-current"]', '[class*="_2-bVZ"]', 'span[class*="price"]'],
        images: ['[class*="gallery"] img', '[class*="slider"] img', 'img[src*="temu."]'],
        description: ['[class*="description"]', '[class*="detail"]'],
        variants: ['[class*="variant"] li', '[class*="sku"] li']
      },
      
      extractUrl: (card) => {
        const link = card.querySelector('a[href*="goods.html"]');
        return link ? link.href : null;
      }
    },
    
    shein: {
      name: 'Shein',
      domains: ['shein.com', 'shein.fr', 'us.shein.com', 'fr.shein.com'],
      
      productPatterns: [/\/-p-\d+\.html|\/product-detail/i],
      listingPatterns: [/\/category\/|pdsearch/i],
      
      buttonTargets: [
        '[class*="add-cart"]',
        '[class*="product-intro"]',
        '.product-action',
        '[class*="add-btn"]',
        'button[class*="button-buy"]'
      ],
      
      cardSelectors: [
        '[class*="product-card"]:not([data-shopopti-card])',
        '[class*="goods-item"]:not([data-shopopti-card])',
        '[class*="product-list-item"]:not([data-shopopti-card])'
      ],
      
      extraction: {
        title: ['h1[class*="title"]', '.product-intro__head-name', '[class*="goods-title"]'],
        price: ['[class*="from"]', '[class*="price-now"]', '[class*="origin-price"]'],
        images: ['[class*="gallery"] img', '[class*="slider"] img', '.goods-detail__img img'],
        description: ['[class*="description"]', '.product-intro__description'],
        variants: ['[class*="color"] li', '[class*="size"] li', '.product-intro__size-radio']
      },
      
      extractUrl: (card) => {
        const link = card.querySelector('a[href*="product"]');
        return link ? link.href : null;
      }
    },
    
    shopify: {
      name: 'Shopify',
      domains: ['myshopify.com'],
      
      productPatterns: [/\/products\//i],
      listingPatterns: [/\/collections\//i],
      
      buttonTargets: [
        '[type="submit"][name="add"]',
        '.product-form__submit',
        '.add-to-cart',
        '#AddToCart',
        '.product__add-to-cart',
        '[data-add-to-cart]',
        'button[name="add"]'
      ],
      
      cardSelectors: [
        '.product-card:not([data-shopopti-card])',
        '[class*="product-item"]:not([data-shopopti-card])',
        '.grid__item .card:not([data-shopopti-card])'
      ],
      
      extraction: {
        title: ['h1[itemprop="name"]', '.product__title', '.product-title', 'h1.title'],
        price: ['[itemprop="price"]', '.product__price', '.price', '.price__regular'],
        images: ['[itemprop="image"]', '.product__media img', '.product__photo img'],
        description: ['[itemprop="description"]', '.product__description', '.product-description'],
        variants: ['.product-form__input', '.variant-input', 'select[name="id"] option']
      },
      
      extractUrl: (card) => {
        const link = card.querySelector('a[href*="/products/"]');
        return link ? link.href : null;
      }
    },
    
    cdiscount: {
      name: 'Cdiscount',
      domains: ['cdiscount.com'],
      
      productPatterns: [/\/f-\d+-[a-z0-9]+\.html|\/fp\//i],
      listingPatterns: [/\/search|\/browse|\/l-\d+/i],
      
      buttonTargets: [
        '#fpAddBsk',
        '.fpBuyBloc',
        '[data-qa="add-to-cart"]',
        '.fpActBloc button'
      ],
      
      cardSelectors: [
        '.prdtBloc:not([data-shopopti-card])',
        '[class*="product-card"]:not([data-shopopti-card])'
      ],
      
      extraction: {
        title: ['.fpDesCol h1', '.fpTMain h1', '[itemprop="name"]'],
        price: ['.fpPrice', '.priceContainer .price', '[itemprop="price"]'],
        images: ['.fpImgLnk img', '.fpGalImg img', '[itemprop="image"]'],
        description: ['.fpDesc', '[itemprop="description"]'],
        brand: ['.fpBrandName', '[itemprop="brand"]']
      },
      
      extractUrl: (card) => {
        const link = card.querySelector('a[href*=".html"]');
        return link ? link.href : null;
      }
    },
    
    etsy: {
      name: 'Etsy',
      domains: ['etsy.com'],
      
      productPatterns: [/\/listing\//i],
      listingPatterns: [/\/search\?|\/c\//i],
      
      buttonTargets: [
        '[data-add-to-cart-button]',
        '.add-to-cart-button',
        'button[type="submit"][data-selector="add-to-cart"]'
      ],
      
      cardSelectors: [
        '[data-logger-id*="listing"]:not([data-shopopti-card])',
        '.v2-listing-card:not([data-shopopti-card])'
      ],
      
      extraction: {
        title: ['h1[data-buy-box-listing-title]', '.listing-page-title', 'h1'],
        price: ['[data-buy-box-region="price"] span', '.wt-text-title-03'],
        images: ['[data-carousel-image]', '.carousel-image', '.listing-page-image-carousel img'],
        description: ['[data-listing-page-description]', '#description-text']
      },
      
      extractUrl: (card) => {
        const link = card.querySelector('a[href*="/listing/"]');
        return link ? link.href : null;
      }
    },
    
    fnac: {
      name: 'Fnac',
      domains: ['fnac.com'],
      
      productPatterns: [/\/a\d+\//i],
      listingPatterns: [/\/recherche\//i],
      
      buttonTargets: [
        '.f-buyBox-cta',
        '[data-automation-id="add-to-cart"]',
        '.Offer-button'
      ],
      
      cardSelectors: [
        '.Article-item:not([data-shopopti-card])',
        '[class*="product-card"]:not([data-shopopti-card])'
      ],
      
      extraction: {
        title: ['h1.f-productHeader-Title', '[itemprop="name"]'],
        price: ['.f-priceBox-price', '[itemprop="price"]'],
        images: ['.f-productVisuals-picture img', '[itemprop="image"]'],
        description: ['.f-productDetails-description', '[itemprop="description"]']
      },
      
      extractUrl: (card) => {
        const link = card.querySelector('a[href*="/a"]');
        return link ? link.href : null;
      }
    },
    
    walmart: {
      name: 'Walmart',
      domains: ['walmart.com'],
      
      productPatterns: [/\/ip\/\d+/i],
      listingPatterns: [/\/search\/|\/browse\//i],
      
      buttonTargets: [
        '[data-automation-id="atc-button"]',
        'button[data-testid="add-to-cart-btn"]',
        '.add-to-cart-section button'
      ],
      
      cardSelectors: [
        '[data-item-id]:not([data-shopopti-card])',
        '[class*="product-card"]:not([data-shopopti-card])'
      ],
      
      extraction: {
        title: ['h1[itemprop="name"]', '.prod-ProductTitle'],
        price: ['[itemprop="price"]', '[data-automation-id="product-price"] span'],
        images: ['[data-testid="product-image"]', '.hover-zoom-hero-image img'],
        description: ['[data-testid="product-description"]', '.about-desc']
      },
      
      extractUrl: (card) => {
        const link = card.querySelector('a[href*="/ip/"]');
        return link ? link.href : null;
      }
    }
  },
  
  /**
   * Get selectors for a platform
   */
  getForPlatform(platform) {
    return this.platforms[platform] || this.platforms.shopify;
  },
  
  /**
   * Detect platform from URL
   */
  detectPlatform(hostname) {
    if (!hostname) hostname = window.location.hostname.toLowerCase();
    
    for (const [key, config] of Object.entries(this.platforms)) {
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
    
    return null;
  },
  
  /**
   * Try selectors with fallback chain
   */
  queryWithFallback(selectors, container = document) {
    if (!Array.isArray(selectors)) selectors = [selectors];
    
    for (const selector of selectors) {
      try {
        const el = container.querySelector(selector);
        if (el) return el;
      } catch (e) {}
    }
    return null;
  },
  
  /**
   * Query all with fallback chain
   */
  queryAllWithFallback(selectors, container = document) {
    if (!Array.isArray(selectors)) selectors = [selectors];
    
    for (const selector of selectors) {
      try {
        const els = container.querySelectorAll(selector);
        if (els.length > 0) return Array.from(els);
      } catch (e) {}
    }
    return [];
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SelectorsConfig;
}

if (typeof window !== 'undefined') {
  window.ShopOptiSelectors = SelectorsConfig;
}
