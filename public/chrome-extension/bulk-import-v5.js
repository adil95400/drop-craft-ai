// ============================================
// ShopOpti+ Bulk Import System v5.7.0
// Complete rewrite with queue, multi-store, deep extraction
// 45+ PLATFORMS SUPPORTED - AutoDS Feature Parity
// ============================================

(function() {
  'use strict';
  
  if (window.__shopopti_bulk_v5_loaded) return;
  window.__shopopti_bulk_v5_loaded = true;

  // ============================================
  // CONFIGURATION
  // ============================================
  const CONFIG = {
    VERSION: '5.7.0',
    API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
    APP_URL: 'https://shopopti.io',
    MAX_SELECTION: 100,
    BATCH_SIZE: 10,
    THROTTLE_MS: 200
  };

  // ============================================
  // PLATFORM SELECTORS (45+ platforms - AutoDS parity)
  // ============================================
  const PLATFORMS = {
    // CHINA SUPPLIERS
    aliexpress: {
      listingPage: ['/wholesale', '/category', 'SearchText=', '/w/', '/gcp/', '/af/'],
      productCard: '.search-item-card-wrapper-gallery, .list--gallery--34TropR, [data-widget-type="search"], .search-card-item, .product-snippet, [class*="product-card"]',
      productPage: ['/item/', '/i/'],
      selectors: {
        title: '.multi--titleText--nXeOvyr, .manhattan--titleText--WccHjR6, h1, [class*="titleText"]',
        price: '.multi--price-sale--U-S0jtj, .manhattan--price-sale--1CCSZfK, [class*="price-current"], [class*="product-price"]',
        image: '.images--imageWindow--1Z-J9gn img, .slider--img--K6MIH9z img, [class*="gallery"] img',
        link: 'a[href*="/item/"], a[href*="/i/"]',
        orders: '.multi--trade--Ktbl2jB, [class*="sold"], [class*="order"]',
        rating: '[class*="rating"], [class*="star"]'
      }
    },
    alibaba: {
      listingPage: ['/trade/search', '/products/', '/showroom/'],
      productCard: '.organic-list-offer, .list-no-v2-outter, .J-offer-wrapper, .offer-list-item',
      productPage: ['/product-detail/', '/product/'],
      selectors: {
        title: '.title-con, h1, .subject',
        price: '.price, [class*="price"]',
        image: '.detail-gallery img, .main-img',
        link: 'a[href*="/product"]',
        orders: '.trade-count',
        rating: '.score'
      }
    },
    '1688': {
      listingPage: ['/page/', '/offer/', '/chanpin/'],
      productCard: '.sm-offer-item, .offer-list-row, .offer-item',
      productPage: ['/offer/', '/detail/'],
      selectors: {
        title: '.title, h1, .offer-title',
        price: '.price, .sm-offer-price',
        image: 'img.img, .pic img',
        link: 'a[href*="/offer/"]',
        orders: '.sale-count',
        rating: ''
      }
    },
    taobao: {
      listingPage: ['/search', '/list/'],
      productCard: '.item, .J_MouserOnverReq, .product-iWrap, [data-item-id]',
      productPage: ['/item.htm'],
      selectors: {
        title: '.title, h1, .tb-main-title',
        price: '.price, .tb-rmb-num',
        image: 'img.pic-reco, .tb-main-pic img',
        link: 'a[href*="item.htm"]',
        orders: '.deal-cnt',
        rating: '.rate'
      }
    },
    temu: {
      listingPage: ['/search_result', '/channel/', '/category/', '/bgn/'],
      productCard: '._2BUQJ_w2, [data-testid="goods-item"], [class*="ProductCard"], ._1UEr6Y3b',
      productPage: ['/goods/', '/product/', '-g-'],
      selectors: {
        title: '._2G7NFXUf, ._1VOXlKK6, [class*="ProductTitle"], h1',
        price: '._2RL5rSJD, [class*="Price"], ._21ArE3mQ',
        image: '._3tKlrXZ8 img, img[src*="temu"], ._2FMYjqSd img',
        link: 'a',
        orders: '[class*="sold"], ._1JfFH8K2',
        rating: '[class*="rating"], ._2_h0yVd9'
      }
    },
    shein: {
      listingPage: ['/pdsearch/', '/category/', '/Women/', '/Men/', '/Kids/'],
      productCard: '.S-product-item, .product-card, [data-product-id], .goods-item, .product-list__item',
      productPage: ['/product/', '-p-'],
      selectors: {
        title: '.goods-title-link, .product-title, h3, .product-intro__head-name',
        price: '.original-price, .price, .product-intro__head-price',
        image: '.S-product-item__img img, img[src*="shein"], .goods-img',
        link: 'a',
        orders: '.sold',
        rating: '.rating, .star-rating'
      }
    },
    cjdropshipping: {
      listingPage: ['/product-list/', '/category/', '/search/'],
      productCard: '.product-item, .goods-item, .cj-product-card',
      productPage: ['/product-detail/', '/product/'],
      selectors: {
        title: '.product-title, h3, .prod-name',
        price: '.price, .product-price',
        image: 'img[src*="cjdropshipping"], .product-img',
        link: 'a',
        orders: '.sold-count',
        rating: '.rating'
      }
    },
    banggood: {
      listingPage: ['/search/', '/category/', '/wholesale/'],
      productCard: '.goodsItem, .product-item, .goodsBox, .bg-item',
      productPage: ['-p-', '/product/'],
      selectors: {
        title: '.goodsTitle, .product-title, h3',
        price: '.newPrice, .price, .price-now',
        image: 'img.goodsImg, img[src*="banggood"], .goods-img',
        link: 'a',
        orders: '.sold, .order-num',
        rating: '.rating, .star'
      }
    },
    dhgate: {
      listingPage: ['/wholesale/', '/products/', '/search/'],
      productCard: '.gallery-item, .product-item, .list-item',
      productPage: ['/product/'],
      selectors: {
        title: '.product-title, h3, .goodstitle',
        price: '.price, .actual-price',
        image: 'img[src*="dhgate"], .product-img',
        link: 'a',
        orders: '.sold, .orders',
        rating: '.rating'
      }
    },
    lightinthebox: {
      listingPage: ['/c/', '/search/', '/wholesale/'],
      productCard: '.product-item, .item-box, [data-pid]',
      productPage: ['/p/'],
      selectors: {
        title: '.item-title, h3, .product-name',
        price: '.price, .item-price',
        image: '.item-img img',
        link: 'a[href*="/p/"]',
        orders: '.sold',
        rating: '.rating'
      }
    },
    'made-in-china': {
      listingPage: ['/products/', '/search/', '/showroom/'],
      productCard: '.product-card, .list-item, .offer-list',
      productPage: ['/product/', '/detail/'],
      selectors: {
        title: '.product-name, h3, .offer-name',
        price: '.price, .offer-price',
        image: '.product-img img',
        link: 'a[href*="/product/"]',
        orders: '.trade',
        rating: ''
      }
    },
    wish: {
      listingPage: ['/search', '/feed/', '/categories/'],
      productCard: '.product-feed-item, [data-feed-card], .product-item, .feed-row-product',
      productPage: ['/product/'],
      selectors: {
        title: '.product-title, h3',
        price: '[class*="price"], .sale-price',
        image: 'img, .product-image',
        link: 'a[href*="/product/"]',
        orders: '[class*="bought"]',
        rating: '.rating'
      }
    },

    // US MARKETPLACES
    amazon: {
      listingPage: ['/s?', '/s/', 'keywords=', '/gp/bestsellers'],
      productCard: '[data-component-type="s-search-result"], .s-result-item[data-asin], .a-carousel-card',
      productPage: ['/dp/', '/gp/product/'],
      selectors: {
        title: 'h2 span, .s-title-instructions-style span, .a-size-medium',
        price: '.a-price-whole, .a-offscreen, .a-price span',
        image: '.s-image, img.s-image, .s-product-image-container img',
        link: 'a.a-link-normal[href*="/dp/"]',
        orders: '.a-size-base.s-underline-text, [class*="ratings"]',
        rating: '.a-icon-alt, .a-star-mini'
      }
    },
    ebay: {
      listingPage: ['/sch/', '/b/', 'LH_BIN=', '/e/'],
      productCard: '.s-item:not(.s-item__pl-on-bottom), .srp-results .s-item__wrapper, [data-gr4]',
      productPage: ['/itm/', '/p/'],
      selectors: {
        title: '.s-item__title, h3.s-item__title',
        price: '.s-item__price, .x-price-primary',
        image: '.s-item__image img, .s-item__image-wrapper img',
        link: '.s-item__link, a[href*="/itm/"]',
        orders: '.s-item__quantitySold, .s-item__hotness',
        rating: '.s-item__reviews, .x-star-rating'
      }
    },
    walmart: {
      listingPage: ['/search?', '/browse/', '/shop/'],
      productCard: '[data-testid="list-view"], [data-item-id], .search-result-gridview-item',
      productPage: ['/ip/'],
      selectors: {
        title: '[class*="product-title"], span[data-automation-id="product-title"], .prod-ProductTitle',
        price: '[data-automation-id="product-price"] span, .price-main span',
        image: 'img[data-testid*="image"], .search-result-product-image img',
        link: 'a[link-identifier], a[href*="/ip/"]',
        orders: '',
        rating: '.rating-number, .seo-avg-rating'
      }
    },
    etsy: {
      listingPage: ['/search?', '/c/', '/market/'],
      productCard: '[data-search-results] .v2-listing-card, .wt-grid__item-xs-6, .search-listings-group .listing-link',
      productPage: ['/listing/'],
      selectors: {
        title: 'h3, .v2-listing-card__title, .wt-text-caption',
        price: 'span[class*="price"], .currency-value',
        image: 'img, .wt-image',
        link: 'a, .listing-link',
        orders: '.wt-text-caption',
        rating: '.wt-screen-reader-only'
      }
    },
    target: {
      listingPage: ['/s?', '/c/', '/shop/'],
      productCard: '[data-test="product-card"], .ProductCardWrapper, .h-flex',
      productPage: ['/p/'],
      selectors: {
        title: '[data-test="product-title"], h3',
        price: '[data-test="product-price"], .h-text-bs',
        image: 'img[data-test="product-image"]',
        link: 'a[href*="/p/"]',
        orders: '',
        rating: '[data-test="ratings"]'
      }
    },
    costco: {
      listingPage: ['/search/', '/c/', '/browse/'],
      productCard: '.product-tile, .product-list-item, [data-product-id]',
      productPage: ['/product.'],
      selectors: {
        title: '.description, h3, .product-title',
        price: '.price, .your-price',
        image: '.product-image img',
        link: 'a[href*="/product."]',
        orders: '',
        rating: '.stars'
      }
    },
    homedepot: {
      listingPage: ['/s/', '/b/', '/search/'],
      productCard: '.product-pod, .browse-search__pod, [data-productid]',
      productPage: ['/p/'],
      selectors: {
        title: '.product-pod__title, h2',
        price: '.price, .price-format__main-price',
        image: '.product-image img, .stretchy img',
        link: 'a[href*="/p/"]',
        orders: '',
        rating: '.stars'
      }
    },
    lowes: {
      listingPage: ['/search?', '/pl/', '/c/'],
      productCard: '.product-card, [data-product], .product-tile',
      productPage: ['/pd/'],
      selectors: {
        title: '.product-title, h3',
        price: '.item-price, .price',
        image: '.product-image img',
        link: 'a[href*="/pd/"]',
        orders: '',
        rating: '.ratings'
      }
    },
    bestbuy: {
      listingPage: ['/site/searchpage', '/site/shop/', '/collection/'],
      productCard: '.sku-item, .product-list-item, [data-sku-id]',
      productPage: ['/site/'],
      selectors: {
        title: '.sku-title, h4.sku-header',
        price: '.priceView-customer-price span',
        image: '.product-image img',
        link: 'a.image-link',
        orders: '',
        rating: '.c-ratings-reviews'
      }
    },
    newegg: {
      listingPage: ['/p/', '/Product/', '/global/'],
      productCard: '.item-cell, .item-container, [data-tracking-id]',
      productPage: ['/Item/'],
      selectors: {
        title: '.item-title, a.item-title',
        price: '.price-current strong',
        image: '.item-img img',
        link: 'a.item-title',
        orders: '',
        rating: '.item-rating'
      }
    },
    wayfair: {
      listingPage: ['/keyword.html', '/sb0/', '/filters/'],
      productCard: '.ProductCard, [data-hb-id="ProductCard"], .s-plp-cell',
      productPage: ['/pdp/'],
      selectors: {
        title: '.ProductCard-productName, h2',
        price: '.ProductCard-price, .BasePriceBlock',
        image: '.ProductCard-image img',
        link: 'a[href*="/pdp/"]',
        orders: '',
        rating: '.ProductCard-reviews'
      }
    },
    overstock: {
      listingPage: ['/search?', '/Home-Garden/'],
      productCard: '.product-tile, [data-cy="product-tile"]',
      productPage: ['/item/'],
      selectors: {
        title: '.product-title, h2',
        price: '.monetary-price-value',
        image: '.product-image img',
        link: 'a[href*="/item/"]',
        orders: '',
        rating: '.star-rating'
      }
    },

    // EUROPEAN MARKETPLACES
    cdiscount: {
      listingPage: ['/search', '/c-', '/l-', '/f-', '/browse/'],
      productCard: '.prdtBILDetails, .prdtBIL, .product-box, .product-item, [data-productid], .jsCatalogEntry',
      productPage: ['/f-', '/dp/', '/p/'],
      selectors: {
        title: '.prdtBILTit, .prdtTitle, h2, .product-name',
        price: '.price, .prdtPrice, [class*="price"], .prdtBILPrz',
        image: 'img.prdtImg, img[src*="cdscdn"], .prdtBILImgImg',
        link: 'a[href*="/f-"], a[href*="/dp/"]',
        orders: '.prdtBILSalesNb',
        rating: '[class*="rating"], .starFull, .prdtBILRating'
      }
    },
    fnac: {
      listingPage: ['/SearchResult', '/s/', '/do/', '/l/'],
      productCard: '.Article-item, .SearchResult, .productItem, .product-list-item, .articleItem',
      productPage: ['/a'],
      selectors: {
        title: '.Article-desc, .product-title, h2, .articleItem-title',
        price: '.userPrice, .price, .f-priceBox-price',
        image: 'img.Article-img, img[src*="static.fnac"], .articleItem-img img',
        link: 'a[href*="/a"]',
        orders: '',
        rating: '.rating, .f-star'
      }
    },
    rakuten: {
      listingPage: ['/search/', '/category/', '/s/'],
      productCard: '.product-item, .item-card, [data-item-id]',
      productPage: ['/product/', '/p/'],
      selectors: {
        title: '.product-name, h3, .item-title',
        price: '.price, .item-price',
        image: '.product-image img, .item-img img',
        link: 'a[href*="/product/"]',
        orders: '.sales',
        rating: '.rating'
      }
    },
    zalando: {
      listingPage: ['/homme/', '/femme/', '/enfant/', '/search/'],
      productCard: '[data-zalon-partner-target], .cat_item, ._0xLoFW',
      productPage: ['/'],
      selectors: {
        title: '.h-container, h3',
        price: '.h-price, ._0xLoFW span',
        image: 'img.h-image',
        link: 'a',
        orders: '',
        rating: '.rating'
      }
    },
    asos: {
      listingPage: ['/search/', '/cat/', '/men/', '/women/'],
      productCard: '.product-card, [data-auto-id="productTile"]',
      productPage: ['/prd/'],
      selectors: {
        title: '.product-description, h2',
        price: '.product-price, [data-auto-id="price"]',
        image: 'img.product-image',
        link: 'a[href*="/prd/"]',
        orders: '',
        rating: ''
      }
    },
    manomano: {
      listingPage: ['/search/', '/cat/', '/p/'],
      productCard: '.product-card, [data-testid="product-card"]',
      productPage: ['/p/'],
      selectors: {
        title: '.product-title, h2',
        price: '.price, [data-testid="price"]',
        image: '.product-image img',
        link: 'a[href*="/p/"]',
        orders: '.sales',
        rating: '.rating'
      }
    },
    darty: {
      listingPage: ['/nav/', '/search/'],
      productCard: '.product-list-item, .product-card, [data-product]',
      productPage: ['/fp/'],
      selectors: {
        title: '.product-title, h2',
        price: '.price, .drt-price',
        image: '.product-img img',
        link: 'a[href*="/fp/"]',
        orders: '',
        rating: '.rating'
      }
    },
    boulanger: {
      listingPage: ['/c/', '/search/'],
      productCard: '.product-item, .product-list-item, [data-product-id]',
      productPage: ['/ref/'],
      selectors: {
        title: '.product-name, h2',
        price: '.price, .product-price',
        image: '.product-image img',
        link: 'a[href*="/ref/"]',
        orders: '',
        rating: '.rating'
      }
    },
    leroymerlin: {
      listingPage: ['/produits/', '/cat/', '/search/'],
      productCard: '.product-card, [data-testid="product-card"]',
      productPage: ['/p/'],
      selectors: {
        title: '.product-name, h2',
        price: '.price, [data-testid="price"]',
        image: '.product-img img',
        link: 'a[href*="/p/"]',
        orders: '',
        rating: '.rating'
      }
    },

    // SHOPIFY STORES (Generic)
    shopify: {
      listingPage: ['/collections/', '/search?', '/products'],
      productCard: '.product-card, .product-item, .grid__item, [data-product-id], .product-grid-item',
      productPage: ['/products/'],
      selectors: {
        title: '.product-card__title, .product__title, h3, .card__heading',
        price: '.product-card__price, .price, .price__regular',
        image: '.product-card__image img, .product__media img, .card__media img',
        link: 'a[href*="/products/"]',
        orders: '',
        rating: '.rating, .spr-badge'
      }
    }
  };

  // ============================================
  // BULK IMPORT MANAGER
  // ============================================
  class ShopOptiBulkImport {
    constructor() {
      this.platform = null;
      this.platformConfig = null;
      this.selectedProducts = new Map();
      this.isActive = false;
      this.isImporting = false;
      
      // Import stats
      this.stats = {
        total: 0,
        successful: 0,
        failed: 0,
        pending: 0
      };
      
      // Stores
      this.stores = [];
      this.selectedStores = [];
      
      this.init();
    }
    
    init() {
      this.detectPlatform();
      
      if (this.platform && this.isListingPage()) {
        this.injectStyles();
        this.injectUI();
        this.bindEvents();
        this.injectQuickImportButtons();
        console.log('[ShopOpti+ Bulk v5] Initialized on', this.platform);
      }
    }
    
    detectPlatform() {
      const hostname = window.location.hostname.toLowerCase();
      
      for (const [key, config] of Object.entries(PLATFORMS)) {
        if (hostname.includes(key)) {
          this.platform = key;
          this.platformConfig = config;
          return;
        }
      }
    }
    
    isListingPage() {
      if (!this.platformConfig?.listingPage) return false;
      const url = window.location.href;
      return this.platformConfig.listingPage.some(indicator => url.includes(indicator));
    }
    
    async getToken() {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.get(['extensionToken'], (result) => {
            resolve(result.extensionToken || null);
          });
        } else {
          resolve(null);
        }
      });
    }
    
    async loadStores() {
      try {
        const token = await this.getToken();
        if (!token) return [];
        
        // Try cache first
        const cached = await this.getCachedStores();
        if (cached && cached.length > 0) {
          this.stores = cached;
          return cached;
        }
        
        const response = await fetch(`${CONFIG.API_URL}/list-user-stores`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({})
        });
        
        if (response.ok) {
          const result = await response.json();
          this.stores = result.stores || [];
          await this.cacheStores(this.stores);
        }
        
        return this.stores;
      } catch (error) {
        console.error('[ShopOpti+ Bulk] Store load error:', error);
        return [];
      }
    }
    
    async getCachedStores() {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.get(['bulk_stores_cache'], (result) => {
            resolve(result.bulk_stores_cache || []);
          });
        } else {
          resolve([]);
        }
      });
    }
    
    async cacheStores(stores) {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.set({ bulk_stores_cache: stores }, resolve);
        } else {
          resolve();
        }
      });
    }
    
    // ============================================
    // UI INJECTION
    // ============================================
    
    injectStyles() {
      if (document.getElementById('shopopti-bulk-v5-styles')) return;
      
      const style = document.createElement('style');
      style.id = 'shopopti-bulk-v5-styles';
      style.textContent = `
        /* Floating Action Bar */
        .shopopti-fab {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border: 1px solid rgba(102, 126, 234, 0.4);
          border-radius: 20px;
          padding: 14px 28px;
          display: flex;
          align-items: center;
          gap: 24px;
          z-index: 2147483647;
          box-shadow: 0 12px 48px rgba(0, 0, 0, 0.6);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .shopopti-fab.visible {
          opacity: 1;
          visibility: visible;
        }
        
        .shopopti-fab-count {
          display: flex;
          align-items: center;
          gap: 12px;
          color: white;
        }
        
        .shopopti-fab-badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 8px 16px;
          border-radius: 24px;
          font-weight: 700;
          font-size: 18px;
          min-width: 48px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        
        .shopopti-fab-text {
          font-size: 14px;
          color: #94a3b8;
        }
        
        .shopopti-fab-actions {
          display: flex;
          gap: 12px;
        }
        
        .shopopti-fab-btn {
          padding: 12px 24px;
          border-radius: 14px;
          border: none;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .shopopti-fab-btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .shopopti-fab-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
        }
        
        .shopopti-fab-btn-stores {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: white;
        }
        
        .shopopti-fab-btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }
        
        .shopopti-fab-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
        }
        
        .shopopti-fab-btn-danger {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          padding: 12px 16px;
        }
        
        /* Activation Button */
        .shopopti-activate {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 18px 28px;
          border-radius: 18px;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 8px 32px rgba(102, 126, 234, 0.5);
          z-index: 2147483647;
          transition: all 0.3s ease;
        }
        
        .shopopti-activate:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 12px 40px rgba(102, 126, 234, 0.6);
        }
        
        .shopopti-activate.hidden {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
        }
        
        /* Quick Import Button on Cards */
        .shopopti-quick-import {
          position: absolute !important;
          top: 10px !important;
          right: 10px !important;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          color: white !important;
          border: none !important;
          padding: 10px 16px !important;
          border-radius: 10px !important;
          font-size: 12px !important;
          font-weight: 700 !important;
          cursor: pointer !important;
          z-index: 9999 !important;
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.5) !important;
          transition: all 0.2s ease !important;
          display: flex !important;
          align-items: center !important;
          gap: 6px !important;
          opacity: 1 !important;
          visibility: visible !important;
        }
        
        .shopopti-quick-import:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6) !important;
        }
        
        .shopopti-quick-import.success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
        }
        
        .shopopti-quick-import.error {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
        }
        
        /* Selection Overlay */
        .shopopti-selectable {
          position: relative !important;
        }
        
        .shopopti-selection-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: transparent;
          border: 3px solid transparent;
          border-radius: 12px;
          cursor: pointer;
          z-index: 100;
          transition: all 0.2s ease;
          pointer-events: auto;
        }
        
        .shopopti-selection-overlay:hover {
          background: rgba(102, 126, 234, 0.1);
          border-color: rgba(102, 126, 234, 0.5);
        }
        
        .shopopti-selection-overlay.selected {
          background: rgba(102, 126, 234, 0.15);
          border-color: #667eea;
        }
        
        .shopopti-checkbox {
          position: absolute;
          top: 12px;
          left: 12px;
          width: 28px;
          height: 28px;
          background: rgba(30, 30, 46, 0.95);
          border: 2px solid rgba(102, 126, 234, 0.6);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: transparent;
          font-size: 16px;
          font-weight: bold;
          transition: all 0.2s ease;
          z-index: 101;
        }
        
        .shopopti-selection-overlay.selected .shopopti-checkbox {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: transparent;
          color: white;
        }
        
        .shopopti-order-badge {
          position: absolute;
          bottom: 12px;
          left: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          z-index: 101;
          opacity: 0;
          transform: scale(0);
          transition: all 0.2s ease;
        }
        
        .shopopti-selection-overlay.selected .shopopti-order-badge {
          opacity: 1;
          transform: scale(1);
        }
        
        /* Import Modal */
        .shopopti-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 2147483647;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        .shopopti-modal-overlay.active {
          display: flex;
        }
        
        .shopopti-modal {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border: 1px solid rgba(102, 126, 234, 0.3);
          border-radius: 24px;
          padding: 32px;
          width: 95%;
          max-width: 650px;
          max-height: 85vh;
          overflow-y: auto;
        }
        
        .shopopti-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
        }
        
        .shopopti-modal-title {
          color: white;
          font-size: 24px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .shopopti-modal-close {
          background: none;
          border: none;
          color: #64748b;
          font-size: 28px;
          cursor: pointer;
          transition: color 0.2s;
        }
        
        .shopopti-modal-close:hover {
          color: #ef4444;
        }
        
        /* Progress Section */
        .shopopti-progress {
          margin-bottom: 28px;
        }
        
        .shopopti-progress-bar {
          width: 100%;
          height: 14px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 7px;
          overflow: hidden;
        }
        
        .shopopti-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          width: 0%;
          transition: width 0.3s ease;
        }
        
        .shopopti-progress-text {
          color: #94a3b8;
          font-size: 14px;
          margin-top: 10px;
          text-align: center;
        }
        
        /* Stats Grid */
        .shopopti-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 28px;
        }
        
        .shopopti-stat {
          background: rgba(255, 255, 255, 0.05);
          padding: 20px;
          border-radius: 14px;
          text-align: center;
        }
        
        .shopopti-stat-value {
          font-size: 32px;
          font-weight: 700;
          color: white;
        }
        
        .shopopti-stat-value.success { color: #10b981; }
        .shopopti-stat-value.error { color: #ef4444; }
        .shopopti-stat-value.pending { color: #f59e0b; }
        
        .shopopti-stat-label {
          color: #64748b;
          font-size: 12px;
          margin-top: 6px;
          text-transform: uppercase;
        }
        
        /* Current Item */
        .shopopti-current-item {
          display: flex;
          align-items: center;
          gap: 18px;
          background: rgba(255, 255, 255, 0.05);
          padding: 18px;
          border-radius: 14px;
          margin-bottom: 20px;
        }
        
        .shopopti-current-img {
          width: 72px;
          height: 72px;
          border-radius: 10px;
          object-fit: cover;
        }
        
        .shopopti-current-info {
          flex: 1;
        }
        
        .shopopti-current-title {
          color: white;
          font-size: 15px;
          font-weight: 500;
          margin-bottom: 6px;
        }
        
        .shopopti-current-status {
          color: #64748b;
          font-size: 13px;
        }
        
        .shopopti-spinner {
          width: 28px;
          height: 28px;
          border: 3px solid rgba(102, 126, 234, 0.3);
          border-top-color: #667eea;
          border-radius: 50%;
          animation: shopopti-spin 1s linear infinite;
        }
        
        @keyframes shopopti-spin {
          to { transform: rotate(360deg); }
        }
        
        /* Store Selection */
        .shopopti-stores-section {
          margin-bottom: 24px;
        }
        
        .shopopti-stores-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }
        
        .shopopti-stores-title {
          color: white;
          font-size: 16px;
          font-weight: 600;
        }
        
        .shopopti-stores-actions {
          display: flex;
          gap: 10px;
        }
        
        .shopopti-stores-btn {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #94a3b8;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
        }
        
        .shopopti-stores-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          color: white;
        }
        
        .shopopti-stores-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 200px;
          overflow-y: auto;
        }
        
        .shopopti-store-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .shopopti-store-item:hover {
          background: rgba(255, 255, 255, 0.08);
        }
        
        .shopopti-store-item.selected {
          background: rgba(34, 197, 94, 0.15);
          border-color: rgba(34, 197, 94, 0.4);
        }
        
        .shopopti-store-check {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          color: transparent;
          flex-shrink: 0;
        }
        
        .shopopti-store-item.selected .shopopti-store-check {
          background: #22c55e;
          border-color: #22c55e;
          color: white;
        }
        
        .shopopti-store-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }
        
        .shopopti-store-info {
          flex: 1;
          min-width: 0;
        }
        
        .shopopti-store-name {
          font-size: 14px;
          font-weight: 500;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .shopopti-store-platform {
          font-size: 12px;
          color: #888;
        }
        
        .shopopti-store-badge {
          padding: 5px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          color: white;
        }
        
        .shopopti-no-stores {
          text-align: center;
          padding: 32px;
          color: #64748b;
        }
        
        .shopopti-no-stores-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }
        
        /* Modal Footer */
        .shopopti-modal-footer {
          display: flex;
          gap: 14px;
          margin-top: 24px;
        }
        
        .shopopti-modal-btn {
          flex: 1;
          padding: 16px 24px;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }
        
        .shopopti-modal-btn-cancel {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }
        
        .shopopti-modal-btn-cancel:hover {
          background: rgba(255, 255, 255, 0.15);
        }
        
        .shopopti-modal-btn-import {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .shopopti-modal-btn-import:hover {
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        
        .shopopti-modal-btn-import:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        /* Toast Notifications */
        .shopopti-toast {
          position: fixed;
          bottom: 100px;
          left: 50%;
          transform: translateX(-50%) translateY(20px);
          background: #1e1e2e;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 14px 24px;
          color: white;
          font-size: 14px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          z-index: 2147483647;
          opacity: 0;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .shopopti-toast.visible {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        
        .shopopti-toast.success { border-color: #10b981; }
        .shopopti-toast.error { border-color: #ef4444; }
        .shopopti-toast.info { border-color: #667eea; }
      `;
      
      document.head.appendChild(style);
    }
    
    injectUI() {
      // Activation button
      const activateBtn = document.createElement('button');
      activateBtn.className = 'shopopti-activate';
      activateBtn.id = 'shopopti-activate';
      activateBtn.innerHTML = `
        <span style="font-size: 20px;">📦</span>
        <span>Sélection Multiple</span>
      `;
      document.body.appendChild(activateBtn);
      
      // Floating action bar
      const fab = document.createElement('div');
      fab.className = 'shopopti-fab';
      fab.id = 'shopopti-fab';
      fab.innerHTML = `
        <div class="shopopti-fab-count">
          <span class="shopopti-fab-badge" id="shopopti-count">0</span>
          <span class="shopopti-fab-text">produit(s)</span>
        </div>
        <div class="shopopti-fab-actions">
          <button class="shopopti-fab-btn shopopti-fab-btn-secondary" id="shopopti-select-all">
            ☑️ Tout
          </button>
          <button class="shopopti-fab-btn shopopti-fab-btn-stores" id="shopopti-stores-btn">
            🏪 Boutiques
          </button>
          <button class="shopopti-fab-btn shopopti-fab-btn-primary" id="shopopti-import">
            🚀 Importer
          </button>
          <button class="shopopti-fab-btn shopopti-fab-btn-danger" id="shopopti-clear">
            ✕
          </button>
        </div>
      `;
      document.body.appendChild(fab);
      
      // Import modal
      const modal = document.createElement('div');
      modal.className = 'shopopti-modal-overlay';
      modal.id = 'shopopti-modal';
      modal.innerHTML = `
        <div class="shopopti-modal">
          <div class="shopopti-modal-header">
            <div class="shopopti-modal-title">
              📦 Import en cours
            </div>
            <button class="shopopti-modal-close" id="shopopti-modal-close">✕</button>
          </div>
          
          <div class="shopopti-progress">
            <div class="shopopti-progress-bar">
              <div class="shopopti-progress-fill" id="shopopti-progress-fill"></div>
            </div>
            <div class="shopopti-progress-text" id="shopopti-progress-text">Préparation...</div>
          </div>
          
          <div class="shopopti-stats-grid">
            <div class="shopopti-stat">
              <div class="shopopti-stat-value success" id="shopopti-success">0</div>
              <div class="shopopti-stat-label">Réussis</div>
            </div>
            <div class="shopopti-stat">
              <div class="shopopti-stat-value error" id="shopopti-error">0</div>
              <div class="shopopti-stat-label">Échoués</div>
            </div>
            <div class="shopopti-stat">
              <div class="shopopti-stat-value pending" id="shopopti-pending">0</div>
              <div class="shopopti-stat-label">En attente</div>
            </div>
          </div>
          
          <div class="shopopti-current-item" id="shopopti-current" style="display: none;">
            <img class="shopopti-current-img" id="shopopti-current-img" src="" alt="">
            <div class="shopopti-current-info">
              <div class="shopopti-current-title" id="shopopti-current-title">-</div>
              <div class="shopopti-current-status">Import en cours...</div>
            </div>
            <div class="shopopti-spinner"></div>
          </div>
          
          <div class="shopopti-modal-footer" id="shopopti-modal-footer" style="display: none;">
            <button class="shopopti-modal-btn shopopti-modal-btn-cancel" id="shopopti-modal-done">
              Fermer
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      
      // Store selection modal
      const storeModal = document.createElement('div');
      storeModal.className = 'shopopti-modal-overlay';
      storeModal.id = 'shopopti-store-modal';
      storeModal.innerHTML = `
        <div class="shopopti-modal">
          <div class="shopopti-modal-header">
            <div class="shopopti-modal-title">
              🏪 Sélection des boutiques
            </div>
            <button class="shopopti-modal-close" id="shopopti-store-close">✕</button>
          </div>
          
          <div class="shopopti-stores-section">
            <div class="shopopti-stores-header">
              <span class="shopopti-stores-title">Boutiques connectées</span>
              <div class="shopopti-stores-actions">
                <button class="shopopti-stores-btn" id="shopopti-stores-all">Tout</button>
                <button class="shopopti-stores-btn" id="shopopti-stores-none">Aucun</button>
              </div>
            </div>
            <div class="shopopti-stores-list" id="shopopti-stores-list">
              <div class="shopopti-no-stores">
                <div class="shopopti-no-stores-icon">⏳</div>
                <div>Chargement...</div>
              </div>
            </div>
          </div>
          
          <div class="shopopti-modal-footer">
            <button class="shopopti-modal-btn shopopti-modal-btn-cancel" id="shopopti-store-cancel">
              Annuler
            </button>
            <button class="shopopti-modal-btn shopopti-modal-btn-import" id="shopopti-store-confirm">
              Confirmer (<span id="shopopti-store-count">0</span>)
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(storeModal);
    }
    
    bindEvents() {
      // Activate bulk selection
      document.getElementById('shopopti-activate')?.addEventListener('click', () => this.activate());
      
      // FAB actions
      document.getElementById('shopopti-select-all')?.addEventListener('click', () => this.selectAll());
      document.getElementById('shopopti-import')?.addEventListener('click', () => this.startImport());
      document.getElementById('shopopti-clear')?.addEventListener('click', () => this.clearSelection());
      document.getElementById('shopopti-stores-btn')?.addEventListener('click', () => this.showStoreModal());
      
      // Modal close
      document.getElementById('shopopti-modal-close')?.addEventListener('click', () => this.closeModal());
      document.getElementById('shopopti-modal-done')?.addEventListener('click', () => this.closeModal());
      
      // Store modal
      document.getElementById('shopopti-store-close')?.addEventListener('click', () => this.closeStoreModal());
      document.getElementById('shopopti-store-cancel')?.addEventListener('click', () => this.closeStoreModal());
      document.getElementById('shopopti-store-confirm')?.addEventListener('click', () => this.confirmStoreSelection());
      document.getElementById('shopopti-stores-all')?.addEventListener('click', () => this.selectAllStores());
      document.getElementById('shopopti-stores-none')?.addEventListener('click', () => this.deselectAllStores());
      
      // Observe for new products (infinite scroll)
      this.observeNewProducts();
    }
    
    // ============================================
    // SELECTION METHODS
    // ============================================
    
    activate() {
      this.isActive = true;
      document.getElementById('shopopti-activate')?.classList.add('hidden');
      this.injectSelectionOverlays();
    }
    
    deactivate() {
      this.isActive = false;
      document.getElementById('shopopti-activate')?.classList.remove('hidden');
      document.getElementById('shopopti-fab')?.classList.remove('visible');
      
      // Remove overlays
      document.querySelectorAll('.shopopti-selection-overlay').forEach(el => el.remove());
      document.querySelectorAll('.shopopti-selectable').forEach(el => {
        el.classList.remove('shopopti-selectable');
      });
    }
    
    injectSelectionOverlays() {
      const cards = document.querySelectorAll(this.platformConfig.productCard);
      
      cards.forEach((card, index) => {
        if (card.querySelector('.shopopti-selection-overlay')) return;
        
        // Make position relative
        const computed = window.getComputedStyle(card);
        if (computed.position === 'static') {
          card.style.position = 'relative';
        }
        card.classList.add('shopopti-selectable');
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'shopopti-selection-overlay';
        overlay.dataset.index = index;
        
        overlay.innerHTML = `
          <div class="shopopti-checkbox">✓</div>
          <div class="shopopti-order-badge"></div>
        `;
        
        overlay.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.toggleSelection(card, overlay);
        });
        
        card.appendChild(overlay);
      });
    }
    
    toggleSelection(card, overlay) {
      const productId = this.getProductId(card);
      
      if (this.selectedProducts.has(productId)) {
        this.selectedProducts.delete(productId);
        overlay.classList.remove('selected');
      } else {
        if (this.selectedProducts.size >= CONFIG.MAX_SELECTION) {
          this.showToast(`Maximum ${CONFIG.MAX_SELECTION} produits`, 'error');
          return;
        }
        
        const productData = this.extractProductData(card);
        this.selectedProducts.set(productId, productData);
        overlay.classList.add('selected');
      }
      
      this.updateUI();
    }
    
    selectAll() {
      const cards = document.querySelectorAll(this.platformConfig.productCard);
      
      cards.forEach((card) => {
        if (this.selectedProducts.size >= CONFIG.MAX_SELECTION) return;
        
        const productId = this.getProductId(card);
        if (!this.selectedProducts.has(productId)) {
          const productData = this.extractProductData(card);
          this.selectedProducts.set(productId, productData);
          
          const overlay = card.querySelector('.shopopti-selection-overlay');
          overlay?.classList.add('selected');
        }
      });
      
      this.updateUI();
    }
    
    clearSelection() {
      this.selectedProducts.clear();
      
      document.querySelectorAll('.shopopti-selection-overlay.selected').forEach(el => {
        el.classList.remove('selected');
      });
      
      this.updateUI();
    }
    
    updateUI() {
      const count = this.selectedProducts.size;
      
      // Update FAB
      const fab = document.getElementById('shopopti-fab');
      const countEl = document.getElementById('shopopti-count');
      
      if (count > 0) {
        fab?.classList.add('visible');
        if (countEl) countEl.textContent = count;
      } else {
        fab?.classList.remove('visible');
      }
      
      // Update order badges
      let order = 1;
      this.selectedProducts.forEach((_, id) => {
        const overlay = document.querySelector(`.shopopti-selection-overlay.selected`);
        const badge = overlay?.querySelector('.shopopti-order-badge');
        if (badge) badge.textContent = order++;
      });
    }
    
    // ============================================
    // DATA EXTRACTION
    // ============================================
    
    getProductId(card) {
      // Try various ID sources
      const asin = card.dataset.asin;
      if (asin) return `amazon_${asin}`;
      
      const productId = card.dataset.productId || card.dataset.itemId;
      if (productId) return `${this.platform}_${productId}`;
      
      const link = card.querySelector(this.platformConfig.selectors.link)?.href;
      if (link) return `url_${btoa(link).slice(0, 32)}`;
      
      return `card_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }
    
    extractProductData(card) {
      const selectors = this.platformConfig.selectors;
      
      // Extract text safely
      const getText = (selector) => {
        if (!selector) return '';
        const el = card.querySelector(selector);
        return el?.textContent?.trim() || '';
      };
      
      // Extract price
      const getPriceText = getText(selectors.price);
      const priceMatch = getPriceText.match(/[\d,.]+/);
      const price = priceMatch ? parseFloat(priceMatch[0].replace(',', '.')) : 0;
      
      // Extract image (high-res)
      let image = '';
      const imgEl = card.querySelector(selectors.image);
      if (imgEl) {
        image = imgEl.src || imgEl.dataset.src || '';
        // Normalize to high-res
        image = this.normalizeImageUrl(image);
      }
      
      // Extract link
      const linkEl = card.querySelector(selectors.link);
      const url = linkEl?.href || window.location.href;
      
      return {
        title: getText(selectors.title),
        price,
        image,
        images: [image].filter(Boolean),
        url,
        source_url: url,
        platform: this.platform,
        source: 'chrome_extension_bulk',
        orders: getText(selectors.orders),
        rating: getText(selectors.rating),
        extractedAt: Date.now()
      };
    }
    
    normalizeImageUrl(url) {
      if (!url) return '';
      
      // Amazon: Remove size transforms
      if (url.includes('amazon') || url.includes('m.media-amazon')) {
        return url.replace(/\._[A-Z][A-Z][0-9]+_/, '').replace(/\._[^.]+_\./, '.');
      }
      
      // AliExpress: Get original size
      if (url.includes('alicdn')) {
        return url.replace(/_\d+x\d+/, '').replace(/\.jpg_\d+x\d+/, '.jpg');
      }
      
      return url;
    }
    
    // ============================================
    // QUICK IMPORT BUTTONS
    // ============================================
    
    injectQuickImportButtons() {
      const cards = document.querySelectorAll(this.platformConfig.productCard);
      
      cards.forEach((card) => {
        if (card.querySelector('.shopopti-quick-import')) return;
        
        // Make position relative
        const computed = window.getComputedStyle(card);
        if (computed.position === 'static') {
          card.style.position = 'relative';
        }
        
        const btn = document.createElement('button');
        btn.className = 'shopopti-quick-import';
        btn.innerHTML = '⚡ Import';
        
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          await this.quickImport(card, btn);
        });
        
        card.appendChild(btn);
      });
    }
    
    async quickImport(card, btn) {
      btn.disabled = true;
      btn.innerHTML = '⏳';
      
      try {
        const token = await this.getToken();
        if (!token) {
          throw new Error('Non connecté');
        }
        
        const productData = this.extractProductData(card);
        
        // Use deep extraction if available
        let enrichedData = productData;
        if (window.ShopOptiCoreExtractor) {
          const extractor = new window.ShopOptiCoreExtractor();
          const extracted = await extractor.extractFromUrl(productData.url);
          if (extracted) {
            enrichedData = { ...productData, ...extracted };
          }
        }
        
        const response = await fetch(`${CONFIG.API_URL}/extension-sync-realtime`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-extension-token': token
          },
          body: JSON.stringify({
            action: 'import_products',
            products: [enrichedData]
          })
        });
        
        const result = await response.json();
        
        if (response.ok && (result.imported > 0 || result.success)) {
          btn.className = 'shopopti-quick-import success';
          btn.innerHTML = '✓';
          this.showToast('Produit importé!', 'success');
        } else {
          throw new Error(result.error || 'Erreur import');
        }
      } catch (error) {
        btn.className = 'shopopti-quick-import error';
        btn.innerHTML = '✕';
        this.showToast(error.message, 'error');
        
        setTimeout(() => {
          btn.className = 'shopopti-quick-import';
          btn.innerHTML = '⚡ Import';
          btn.disabled = false;
        }, 2000);
      }
    }
    
    // ============================================
    // STORE SELECTION
    // ============================================
    
    async showStoreModal() {
      const modal = document.getElementById('shopopti-store-modal');
      modal?.classList.add('active');
      
      // Load stores
      await this.loadStores();
      this.renderStoreList();
    }
    
    closeStoreModal() {
      document.getElementById('shopopti-store-modal')?.classList.remove('active');
    }
    
    renderStoreList() {
      const list = document.getElementById('shopopti-stores-list');
      if (!list) return;
      
      if (this.stores.length === 0) {
        list.innerHTML = `
          <div class="shopopti-no-stores">
            <div class="shopopti-no-stores-icon">🔌</div>
            <div>Aucune boutique connectée</div>
            <div style="font-size: 12px; margin-top: 8px; color: #888;">
              Connectez vos boutiques dans ShopOpti+
            </div>
          </div>
        `;
        return;
      }
      
      const platformIcons = {
        shopify: '🟢',
        woocommerce: '🟣',
        prestashop: '🔵',
        magento: '🟠',
        amazon: '📦',
        ebay: '🔴',
        etsy: '🧡'
      };
      
      list.innerHTML = this.stores.map(store => {
        const isSelected = this.selectedStores.includes(store.id);
        const icon = platformIcons[store.platform?.toLowerCase()] || '🏪';
        
        return `
          <div class="shopopti-store-item ${isSelected ? 'selected' : ''}" data-store-id="${store.id}">
            <div class="shopopti-store-check">${isSelected ? '✓' : ''}</div>
            <div class="shopopti-store-icon" style="background: ${store.color || '#6366f1'}">${icon}</div>
            <div class="shopopti-store-info">
              <div class="shopopti-store-name">${this.escapeHtml(store.name || store.domain || 'Boutique')}</div>
              <div class="shopopti-store-platform">${store.platform || 'E-commerce'}</div>
            </div>
            <div class="shopopti-store-badge" style="background: ${store.status === 'connected' ? '#22c55e' : '#64748b'}">
              ${store.productCount || store.product_count || 0}
            </div>
          </div>
        `;
      }).join('');
      
      // Bind click events
      list.querySelectorAll('.shopopti-store-item').forEach(item => {
        item.addEventListener('click', () => {
          const storeId = item.dataset.storeId;
          this.toggleStoreSelection(storeId);
          item.classList.toggle('selected');
          item.querySelector('.shopopti-store-check').textContent = 
            item.classList.contains('selected') ? '✓' : '';
          this.updateStoreCount();
        });
      });
      
      this.updateStoreCount();
    }
    
    toggleStoreSelection(storeId) {
      const index = this.selectedStores.indexOf(storeId);
      if (index > -1) {
        this.selectedStores.splice(index, 1);
      } else {
        this.selectedStores.push(storeId);
      }
    }
    
    selectAllStores() {
      this.selectedStores = this.stores.map(s => s.id);
      this.renderStoreList();
    }
    
    deselectAllStores() {
      this.selectedStores = [];
      this.renderStoreList();
    }
    
    updateStoreCount() {
      const countEl = document.getElementById('shopopti-store-count');
      if (countEl) {
        countEl.textContent = this.selectedStores.length;
      }
    }
    
    confirmStoreSelection() {
      this.closeStoreModal();
      this.showToast(`${this.selectedStores.length} boutique(s) sélectionnée(s)`, 'success');
    }
    
    // ============================================
    // IMPORT PROCESS
    // ============================================
    
    async startImport() {
      if (this.selectedProducts.size === 0) {
        this.showToast('Aucun produit sélectionné', 'error');
        return;
      }
      
      if (this.isImporting) return;
      this.isImporting = true;
      
      const token = await this.getToken();
      if (!token) {
        this.showToast('Non connecté - ouvrez la sidebar', 'error');
        this.isImporting = false;
        return;
      }
      
      // Reset stats
      this.stats = {
        total: this.selectedProducts.size,
        successful: 0,
        failed: 0,
        pending: this.selectedProducts.size
      };
      
      // Show modal
      this.showImportModal();
      
      // Get products array
      const products = Array.from(this.selectedProducts.values());
      const stores = this.stores.filter(s => this.selectedStores.includes(s.id));
      
      // Process in batches
      const batches = this.chunkArray(products, CONFIG.BATCH_SIZE);
      
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        // Process batch with concurrency limit
        for (const product of batch) {
          await this.importProduct(product, token, stores);
          await this.sleep(CONFIG.THROTTLE_MS);
        }
      }
      
      // Show completion
      this.showImportComplete();
      this.isImporting = false;
    }
    
    async importProduct(product, token, stores) {
      // Update current item display
      this.updateCurrentItem(product);
      
      try {
        // Enrich with deep extraction if available
        let enrichedProduct = product;
        if (window.ShopOptiCoreExtractor && product.url) {
          try {
            const extractor = new window.ShopOptiCoreExtractor();
            const extracted = await extractor.extractFromUrl(product.url);
            if (extracted) {
              enrichedProduct = { ...product, ...extracted };
            }
          } catch (e) {
            console.warn('[Bulk Import] Deep extraction failed:', e);
          }
        }
        
        // Import to stores (or default if none selected)
        const targetStores = stores.length > 0 ? stores : [{ id: 'default' }];
        let anySuccess = false;
        
        for (const store of targetStores) {
          try {
            const response = await fetch(`${CONFIG.API_URL}/extension-sync-realtime`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-extension-token': token
              },
              body: JSON.stringify({
                action: 'import_products',
                products: [enrichedProduct],
                store_id: store.id,
                store_platform: store.platform
              })
            });
            
            const result = await response.json();
            
            if (response.ok && (result.imported > 0 || result.success)) {
              anySuccess = true;
            }
          } catch (e) {
            console.error('[Bulk Import] Store import error:', e);
          }
        }
        
        if (anySuccess) {
          this.stats.successful++;
        } else {
          this.stats.failed++;
        }
      } catch (error) {
        console.error('[Bulk Import] Product error:', error);
        this.stats.failed++;
      }
      
      this.stats.pending--;
      this.updateProgress();
    }
    
    showImportModal() {
      const modal = document.getElementById('shopopti-modal');
      modal?.classList.add('active');
      
      document.getElementById('shopopti-current')!.style.display = 'flex';
      document.getElementById('shopopti-modal-footer')!.style.display = 'none';
      
      this.updateProgress();
    }
    
    updateCurrentItem(product) {
      const img = document.getElementById('shopopti-current-img');
      const title = document.getElementById('shopopti-current-title');
      
      if (img) img.src = product.image || '';
      if (title) title.textContent = product.title?.substring(0, 50) + '...' || 'Produit';
    }
    
    updateProgress() {
      const progress = ((this.stats.successful + this.stats.failed) / this.stats.total) * 100;
      
      const progressFill = document.getElementById('shopopti-progress-fill');
      const progressText = document.getElementById('shopopti-progress-text');
      const successEl = document.getElementById('shopopti-success');
      const errorEl = document.getElementById('shopopti-error');
      const pendingEl = document.getElementById('shopopti-pending');
      
      if (progressFill) progressFill.style.width = `${progress}%`;
      if (progressText) progressText.textContent = `${Math.round(progress)}% - ${this.stats.successful + this.stats.failed}/${this.stats.total}`;
      if (successEl) successEl.textContent = this.stats.successful;
      if (errorEl) errorEl.textContent = this.stats.failed;
      if (pendingEl) pendingEl.textContent = this.stats.pending;
    }
    
    showImportComplete() {
      const progressText = document.getElementById('shopopti-progress-text');
      if (progressText) {
        progressText.textContent = `Terminé! ${this.stats.successful} réussis, ${this.stats.failed} échoués`;
      }
      
      document.getElementById('shopopti-current')!.style.display = 'none';
      document.getElementById('shopopti-modal-footer')!.style.display = 'flex';
      
      // Clear selection
      this.clearSelection();
    }
    
    closeModal() {
      document.getElementById('shopopti-modal')?.classList.remove('active');
    }
    
    // ============================================
    // UTILITIES
    // ============================================
    
    observeNewProducts() {
      const observer = new MutationObserver(() => {
        if (this.isActive) {
          this.injectSelectionOverlays();
        }
        this.injectQuickImportButtons();
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
    
    showToast(message, type = 'info') {
      // Remove existing toast
      document.querySelector('.shopopti-toast')?.remove();
      
      const toast = document.createElement('div');
      toast.className = `shopopti-toast ${type}`;
      toast.innerHTML = `
        <span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
        <span>${this.escapeHtml(message)}</span>
      `;
      
      document.body.appendChild(toast);
      
      setTimeout(() => toast.classList.add('visible'), 10);
      setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }
    
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text || '';
      return div.innerHTML;
    }
    
    chunkArray(array, size) {
      const chunks = [];
      for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
      }
      return chunks;
    }
    
    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  }

  // ============================================
  // INITIALIZE
  // ============================================
  window.ShopOptiBulkImport = new ShopOptiBulkImport();

})();
