/**
 * Shopopti+ - Universal Shopify Store Detector & Extractor
 * Detects and extracts products from ANY Shopify store (frontend)
 * Version 1.0.0
 */

(function() {
  'use strict';

  if (window.__shopoptiShopifyUniversalLoaded) return;
  window.__shopoptiShopifyUniversalLoaded = true;

  const SHOPIFY_DETECTION_METHODS = {
    // Method 1: Check for window.Shopify object
    checkWindowShopify: () => {
      return typeof window.Shopify !== 'undefined' && window.Shopify !== null;
    },

    // Method 2: Check meta tags
    checkMetaTags: () => {
      const generators = document.querySelectorAll('meta[name="generator"], meta[property="og:platform"]');
      for (const meta of generators) {
        const content = (meta.content || '').toLowerCase();
        if (content.includes('shopify')) return true;
      }
      return false;
    },

    // Method 3: Check for Shopify CDN scripts
    checkShopifyScripts: () => {
      const scripts = document.querySelectorAll('script[src*="cdn.shopify.com"], link[href*="cdn.shopify.com"]');
      return scripts.length > 0;
    },

    // Method 4: Check for Shopify-specific DOM elements
    checkShopifyDom: () => {
      const shopifyElements = [
        '[data-shopify]',
        '.shopify-section',
        '[class*="shopify-"]',
        '#shopify-section-header',
        'form[action*="/cart/add"]'
      ];
      
      for (const selector of shopifyElements) {
        if (document.querySelector(selector)) return true;
      }
      return false;
    },

    // Method 5: Check URL patterns
    checkUrlPatterns: () => {
      const url = window.location.href;
      return url.includes('.myshopify.com') || 
             url.includes('/products/') && document.querySelector('form[action*="/cart"]');
    }
  };

  class ShopifyUniversalExtractor {
    constructor() {
      this.isShopify = false;
      this.shopData = null;
      this.productData = null;
      this.collectionData = null;
    }

    /**
     * Detect if current page is a Shopify store
     */
    async detect() {
      // Run all detection methods
      for (const [method, check] of Object.entries(SHOPIFY_DETECTION_METHODS)) {
        try {
          if (check()) {
            console.log(`[Shopopti+] Shopify detected via: ${method}`);
            this.isShopify = true;
            break;
          }
        } catch (e) {
          console.warn(`[Shopopti+] Detection method ${method} failed:`, e);
        }
      }

      if (this.isShopify) {
        await this.extractShopInfo();
      }

      return this.isShopify;
    }

    /**
     * Extract shop information
     */
    async extractShopInfo() {
      this.shopData = {
        name: this.getShopName(),
        domain: window.location.hostname,
        currency: this.getCurrency(),
        country: this.getCountry()
      };

      console.log('[Shopopti+] Shop info:', this.shopData);
      return this.shopData;
    }

    getShopName() {
      // Try window.Shopify
      if (window.Shopify?.shop) {
        return window.Shopify.shop.replace('.myshopify.com', '');
      }

      // Try meta tags
      const siteName = document.querySelector('meta[property="og:site_name"]');
      if (siteName?.content) return siteName.content;

      // Try title
      const title = document.querySelector('title');
      if (title) return title.textContent.split('|')[0].trim();

      return window.location.hostname;
    }

    getCurrency() {
      if (window.Shopify?.currency?.active) {
        return window.Shopify.currency.active;
      }

      const currencyMeta = document.querySelector('meta[property="og:price:currency"]');
      if (currencyMeta) return currencyMeta.content;

      // Detect from page content
      const priceEl = document.querySelector('[class*="price"], .price');
      if (priceEl) {
        const text = priceEl.textContent;
        if (text.includes('€') || text.includes('EUR')) return 'EUR';
        if (text.includes('$') || text.includes('USD')) return 'USD';
        if (text.includes('£') || text.includes('GBP')) return 'GBP';
      }

      return 'EUR';
    }

    getCountry() {
      if (window.Shopify?.country) return window.Shopify.country;
      
      const locale = document.documentElement.lang || navigator.language;
      return locale.split('-')[1] || 'FR';
    }

    /**
     * Check if current page is a product page
     */
    isProductPage() {
      const url = window.location.pathname;
      return url.includes('/products/') && !url.includes('/collections/');
    }

    /**
     * Check if current page is a collection/category page
     */
    isCollectionPage() {
      const url = window.location.pathname;
      return url.includes('/collections/') || 
             url.includes('/search') ||
             document.querySelector('.collection-products, [data-collection-products]');
    }

    /**
     * Extract single product data from product page
     */
    async extractProduct() {
      if (!this.isProductPage()) {
        console.warn('[Shopopti+] Not a product page');
        return null;
      }

      console.log('[Shopopti+] Extracting product...');

      // Try JSON API first (most reliable)
      const jsonProduct = await this.fetchProductJson();
      if (jsonProduct) {
        this.productData = this.normalizeProduct(jsonProduct);
        return this.productData;
      }

      // Fallback to DOM extraction
      this.productData = await this.extractProductFromDom();
      return this.productData;
    }

    /**
     * Fetch product data from Shopify JSON endpoint
     */
    async fetchProductJson() {
      try {
        const handle = this.getProductHandle();
        if (!handle) return null;

        const response = await fetch(`/products/${handle}.js`);
        if (!response.ok) return null;

        const data = await response.json();
        console.log('[Shopopti+] Fetched product JSON:', data.title);
        return data;
      } catch (e) {
        console.warn('[Shopopti+] JSON fetch failed:', e);
        return null;
      }
    }

    getProductHandle() {
      const match = window.location.pathname.match(/\/products\/([^\/\?]+)/);
      return match ? match[1] : null;
    }

    /**
     * Normalize Shopify product data to Shopopti format
     */
    normalizeProduct(shopifyProduct) {
      const variants = (shopifyProduct.variants || []).map(v => ({
        id: v.id?.toString(),
        sku: v.sku || '',
        title: v.title || 'Default',
        price: v.price / 100, // Shopify prices are in cents
        compareAtPrice: v.compare_at_price ? v.compare_at_price / 100 : null,
        available: v.available !== false,
        option1: v.option1,
        option2: v.option2,
        option3: v.option3,
        image: v.featured_image?.src || null,
        inventory_quantity: v.inventory_quantity || null
      }));

      const images = (shopifyProduct.images || []).map(img => {
        // Get high-res version by removing size params
        return typeof img === 'string' 
          ? img.replace(/_\d+x\d*\./, '.').replace(/\?.*$/, '')
          : img;
      });

      // Extract videos if available
      const videos = [];
      if (shopifyProduct.media) {
        shopifyProduct.media.forEach(m => {
          if (m.media_type === 'video' || m.media_type === 'external_video') {
            videos.push({
              url: m.sources?.[0]?.url || m.external_id,
              type: m.media_type,
              alt: m.alt
            });
          }
        });
      }

      return {
        external_id: shopifyProduct.id?.toString(),
        title: shopifyProduct.title,
        description: this.cleanDescription(shopifyProduct.description || shopifyProduct.body_html || ''),
        descriptionHtml: shopifyProduct.body_html || shopifyProduct.description || '',
        price: shopifyProduct.price / 100,
        compareAtPrice: shopifyProduct.compare_at_price ? shopifyProduct.compare_at_price / 100 : null,
        currency: this.shopData?.currency || 'EUR',
        sku: variants[0]?.sku || '',
        vendor: shopifyProduct.vendor || this.shopData?.name || '',
        brand: shopifyProduct.vendor || null,
        productType: shopifyProduct.product_type || '',
        tags: shopifyProduct.tags || [],
        images,
        videos,
        variants,
        options: (shopifyProduct.options || []).map(opt => ({
          name: opt.name,
          values: opt.values || []
        })),
        available: shopifyProduct.available !== false,
        url: window.location.href,
        platform: 'shopify',
        source: this.shopData?.domain || window.location.hostname,
        metadata: {
          handle: shopifyProduct.handle,
          published_at: shopifyProduct.published_at,
          created_at: shopifyProduct.created_at,
          updated_at: shopifyProduct.updated_at
        }
      };
    }

    cleanDescription(html) {
      const div = document.createElement('div');
      div.innerHTML = html;
      return div.textContent?.trim() || '';
    }

    /**
     * Extract product from DOM (fallback)
     */
    async extractProductFromDom() {
      const product = {
        external_id: this.getProductIdFromDom(),
        title: this.getTitleFromDom(),
        description: this.getDescriptionFromDom(),
        price: this.getPriceFromDom(),
        images: this.getImagesFromDom(),
        videos: [],
        variants: this.getVariantsFromDom(),
        url: window.location.href,
        platform: 'shopify',
        source: window.location.hostname
      };

      console.log('[Shopopti+] Extracted from DOM:', product.title);
      return product;
    }

    getProductIdFromDom() {
      // Try various sources
      if (window.ShopifyAnalytics?.meta?.product?.id) {
        return window.ShopifyAnalytics.meta.product.id.toString();
      }

      const productEl = document.querySelector('[data-product-id]');
      if (productEl) return productEl.dataset.productId;

      const form = document.querySelector('form[action*="/cart/add"]');
      if (form) {
        const input = form.querySelector('input[name="id"]');
        if (input) return input.value;
      }

      return `dom_${Date.now()}`;
    }

    getTitleFromDom() {
      const selectors = [
        'h1.product-title', 
        '.product__title h1', 
        '[data-product-title]',
        '.product-single__title',
        'h1[itemprop="name"]',
        '.product-info h1',
        'h1'
      ];

      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el?.textContent?.trim()) {
          return el.textContent.trim();
        }
      }

      return document.title.split('|')[0].trim();
    }

    getDescriptionFromDom() {
      const selectors = [
        '.product-description',
        '[data-product-description]',
        '.product__description',
        '[itemprop="description"]',
        '.product-single__description'
      ];

      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el?.textContent?.trim()) {
          return el.textContent.trim().substring(0, 5000);
        }
      }

      return '';
    }

    getPriceFromDom() {
      const selectors = [
        '[data-product-price]',
        '.product__price',
        '.price--show-badge',
        '[itemprop="price"]',
        '.product-price'
      ];

      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) {
          const text = el.textContent || el.getAttribute('content') || '';
          const price = this.parsePrice(text);
          if (price > 0) return price;
        }
      }

      return 0;
    }

    parsePrice(text) {
      if (!text) return 0;
      const clean = text.replace(/[€$£¥\s]/g, '').replace(',', '.').trim();
      return parseFloat(clean) || 0;
    }

    getImagesFromDom() {
      const images = new Set();

      // Product gallery images
      document.querySelectorAll('.product__media img, .product-gallery img, [data-product-media] img').forEach(img => {
        const src = img.dataset.src || img.src;
        if (src && !src.includes('placeholder')) {
          images.add(src.replace(/_\d+x\d*\./, '.'));
        }
      });

      // OG image
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage?.content) {
        images.add(ogImage.content.replace(/_\d+x\d*\./, '.'));
      }

      return Array.from(images).slice(0, 20);
    }

    getVariantsFromDom() {
      const variants = [];
      
      // Try to get from form
      const form = document.querySelector('form[action*="/cart/add"]');
      if (form) {
        const select = form.querySelector('select[name="id"]');
        if (select) {
          select.querySelectorAll('option').forEach(opt => {
            if (opt.value) {
              variants.push({
                id: opt.value,
                title: opt.textContent.trim(),
                available: !opt.disabled
              });
            }
          });
        }
      }

      return variants;
    }

    /**
     * Extract products from collection/category page
     */
    async extractCollection() {
      if (!this.isCollectionPage()) {
        console.warn('[Shopopti+] Not a collection page');
        return [];
      }

      console.log('[Shopopti+] Extracting collection...');

      // Try JSON API first
      const jsonProducts = await this.fetchCollectionJson();
      if (jsonProducts && jsonProducts.length > 0) {
        this.collectionData = jsonProducts.map(p => this.normalizeProduct(p));
        return this.collectionData;
      }

      // Fallback to DOM extraction
      this.collectionData = await this.extractCollectionFromDom();
      return this.collectionData;
    }

    async fetchCollectionJson() {
      try {
        // Try collection JSON endpoint
        const collectionMatch = window.location.pathname.match(/\/collections\/([^\/\?]+)/);
        if (collectionMatch) {
          const response = await fetch(`/collections/${collectionMatch[1]}/products.json`);
          if (response.ok) {
            const data = await response.json();
            return data.products || [];
          }
        }

        // Try search JSON
        if (window.location.pathname.includes('/search')) {
          const params = new URLSearchParams(window.location.search);
          const query = params.get('q');
          if (query) {
            const response = await fetch(`/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product`);
            if (response.ok) {
              const data = await response.json();
              return data.resources?.results?.products || [];
            }
          }
        }

        return [];
      } catch (e) {
        console.warn('[Shopopti+] Collection JSON fetch failed:', e);
        return [];
      }
    }

    async extractCollectionFromDom() {
      const products = [];
      
      const productCards = document.querySelectorAll(
        '.product-card, [data-product-card], .grid-product, .product-item, ' +
        '.collection-product, [class*="ProductCard"], [class*="product-card"]'
      );

      productCards.forEach((card, index) => {
        const product = this.extractProductCardData(card, index);
        if (product.title) {
          products.push(product);
        }
      });

      console.log(`[Shopopti+] Extracted ${products.length} products from DOM`);
      return products;
    }

    extractProductCardData(card, index) {
      const link = card.querySelector('a[href*="/products/"]');
      const img = card.querySelector('img');
      const title = card.querySelector('.product-card__title, .product-title, h3, h2, [class*="title"]');
      const price = card.querySelector('.product-card__price, .price, [class*="price"]');

      return {
        external_id: link?.href?.match(/\/products\/([^\/\?]+)/)?.[1] || `card_${index}`,
        title: title?.textContent?.trim() || '',
        price: this.parsePrice(price?.textContent || ''),
        images: img ? [img.src?.replace(/_\d+x\d*\./, '.')] : [],
        url: link?.href || '',
        platform: 'shopify',
        source: window.location.hostname
      };
    }
  }

  // Create global instance
  window.ShopoptiShopifyExtractor = new ShopifyUniversalExtractor();

  // Auto-detect on load
  window.ShopoptiShopifyExtractor.detect().then(isShopify => {
    if (isShopify) {
      console.log('[Shopopti+] ✅ Shopify store detected:', window.ShopoptiShopifyExtractor.shopData?.name);
      
      // Dispatch event for sidebar to pick up
      window.dispatchEvent(new CustomEvent('shopopti:shopify-detected', {
        detail: {
          shop: window.ShopoptiShopifyExtractor.shopData,
          isProductPage: window.ShopoptiShopifyExtractor.isProductPage(),
          isCollectionPage: window.ShopoptiShopifyExtractor.isCollectionPage()
        }
      }));
    }
  });

})();
