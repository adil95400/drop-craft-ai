/**
 * ShopOpti+ Pro - Dynamic Loader v6.0.0
 * 
 * Enterprise-grade extraction with 2025-hardened selectors,
 * full variant/review/video support, and robust fallback strategies.
 * 
 * [CAN] Optimisation: Ne s'injecte que sur les pages produit (pas les listings/accueil)
 */

(function() {
  'use strict';

  // Prevent double-loading
  if (window.__SHOPOPTI_LOADED__) return;
  window.__SHOPOPTI_LOADED__ = true;

  const LOADER_VERSION = '6.0.0';

  // ============================================
  // Platform Detection (2025 Updated)
  // ============================================
  const PLATFORM_PATTERNS = {
    aliexpress: {
      pattern: /aliexpress\.(com|ru|us)/,
      productPatterns: [/\/item\/(\d+)\.html/, /\/(\d+)\.html/, /productId=(\d+)/],
      // [CAN] Only run on product pages, not homepages/listings
      excludePatterns: [/^https?:\/\/[^/]+\/?$/, /\/category\//, /\/wholesale\//],
      extractorModule: 'aliexpress-extractor.js'
    },
    amazon: {
      pattern: /amazon\.(com|fr|de|co\.uk|es|it|ca|com\.au)/,
      productPatterns: [/\/dp\/([A-Z0-9]{10})/, /\/gp\/product\/([A-Z0-9]{10})/, /\/gp\/aw\/d\/([A-Z0-9]{10})/],
      excludePatterns: [/^https?:\/\/[^/]+\/?$/, /\/s\?/, /\/b\//],
      extractorModule: 'amazon-extractor.js'
    },
    ebay: {
      pattern: /ebay\.(com|fr|de|co\.uk|es|it)/,
      productPatterns: [/\/itm\/(\d+)/, /\/itm\/[^\/]+\/(\d+)/],
      excludePatterns: [/^https?:\/\/[^/]+\/?$/, /\/sch\//, /\/b\//],
      extractorModule: 'ebay-extractor.js'
    },
    walmart: {
      pattern: /walmart\.com/,
      productPatterns: [/\/ip\/[^\/]+\/(\d+)/],
      excludePatterns: [/^https?:\/\/[^/]+\/?$/, /\/search\//],
      extractorModule: 'walmart-extractor.js'
    },
    temu: {
      pattern: /temu\.com/,
      productPatterns: [/goods\.html\?.*goods_id=(\d+)/, /\?.*goods_id=(\d+)/, /-g-(\d+)\.html/],
      excludePatterns: [/^https?:\/\/[^/]+\/?$/],
      extractorModule: 'temu-extractor.js'
    },
    shein: {
      pattern: /shein\.(com|fr)/,
      productPatterns: [/-p-(\d+)/, /\/p\/[^\/]+-cat-\d+-id-(\d+)/],
      excludePatterns: [/^https?:\/\/[^/]+\/?$/, /\/category\//],
      extractorModule: 'shein-extractor.js'
    },
    etsy: {
      pattern: /etsy\.com/,
      productPatterns: [/\/listing\/(\d+)/],
      excludePatterns: [/^https?:\/\/[^/]+\/?$/, /\/search\//],
      extractorModule: 'etsy-extractor.js'
    },
    banggood: {
      pattern: /banggood\.com/,
      productPatterns: [/-p-(\d+)\.html/, /products\/(\d+)/],
      excludePatterns: [/^https?:\/\/[^/]+\/?$/],
      extractorModule: 'banggood-extractor.js'
    },
    cjdropshipping: {
      pattern: /cjdropshipping\.com/,
      productPatterns: [/\/product\/.*-p-(\d+)\.html/, /pid=(\d+)/],
      excludePatterns: [/^https?:\/\/[^/]+\/?$/],
      extractorModule: 'cj-extractor.js'
    },
    costco: {
      pattern: /costco\.com/,
      productPatterns: [/\.product\.(\d+)\.html/, /productId=(\d+)/],
      excludePatterns: [/^https?:\/\/[^/]+\/?$/],
      extractorModule: 'costco-extractor.js'
    },
    homedepot: {
      pattern: /homedepot\.com/,
      productPatterns: [/\/p\/[^\/]+\/(\d+)/, /\/(\d{9})\/?$/],
      excludePatterns: [/^https?:\/\/[^/]+\/?$/],
      extractorModule: 'homedepot-extractor.js'
    }
  };

  // ============================================
  // Core Utilities
  // ============================================
  const Utils = {
    detectPlatform() {
      const hostname = window.location.hostname;
      const href = window.location.href;

      for (const [platform, config] of Object.entries(PLATFORM_PATTERNS)) {
        if (config.pattern.test(hostname)) {
          // [CAN] Skip excluded pages (homepages, listings, search)
          if (config.excludePatterns) {
            const isExcluded = config.excludePatterns.some(p => p.test(href));
            if (isExcluded) {
              console.log(`[ShopOpti+] Skipping non-product page on ${platform}: ${href}`);
              return null;
            }
          }

          return {
            platform,
            config,
            productId: this.extractProductId(href, config.productPatterns)
          };
        }
      }
      return null;
    },

    extractProductId(url, patterns) {
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }
      return null;
    },

    async waitForElement(selector, timeout = 10000) {
      return new Promise((resolve) => {
        const element = document.querySelector(selector);
        if (element) {
          resolve(element);
          return;
        }

        const observer = new MutationObserver(() => {
          const el = document.querySelector(selector);
          if (el) {
            observer.disconnect();
            resolve(el);
          }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        setTimeout(() => {
          observer.disconnect();
          resolve(null);
        }, timeout);
      });
    },

    async waitForMultipleElements(selectors, timeout = 10000) {
      const startTime = Date.now();
      while (Date.now() - startTime < timeout) {
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) return element;
        }
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      return null;
    },

    sendToBackground(action, data = {}) {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          chrome.runtime.sendMessage({ action, data }, resolve);
        } else {
          resolve({ success: false, error: 'Extension context invalid' });
        }
      });
    },

    formatPrice(price) {
      if (typeof price === 'number') return price;
      if (!price || typeof price !== 'string') return 0;
      
      let cleaned = price.replace(/[€$£¥₹₽CHF₿฿₫₭₦₲₵₡₢₠₩₮₰₪]/gi, '')
                         .replace(/\s+/g, '')
                         .replace(/EUR|USD|GBP|JPY|CNY|CAD|AUD/gi, '')
                         .trim();
      
      if (cleaned.includes(',') && !cleaned.includes('.')) {
        cleaned = cleaned.replace(',', '.');
      } else if (cleaned.includes(',') && cleaned.includes('.')) {
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      }
      
      const match = cleaned.match(/[\d]+[.,]?[\d]*/);
      return match ? parseFloat(match[0].replace(',', '.')) || 0 : 0;
    },

    cleanText(text) {
      if (!text) return '';
      return text.trim().replace(/\s+/g, ' ').substring(0, 2000);
    },

    normalizeImageUrl(url, platform) {
      if (!url || typeof url !== 'string') return '';
      
      const invalidPatterns = ['sprite', 'pixel', 'grey', 'transparent', 'placeholder', 
                               'loader', 'loading', 'spacer', '1x1', 'blank', 'empty', 
                               'data:image', 'svg+xml', 'icon', 'logo', 'favicon', 'spinner'];
      const urlLower = url.toLowerCase();
      for (const pattern of invalidPatterns) {
        if (urlLower.includes(pattern)) return '';
      }

      let normalized = url;
      
      if (normalized.startsWith('//')) {
        normalized = 'https:' + normalized;
      }

      if (platform === 'amazon') {
        normalized = normalized.replace(/_AC_[A-Z]{2}\d+_/g, '_AC_SL1500_');
        normalized = normalized.replace(/_S[XYL]\d+_/g, '_SL1500_');
        normalized = normalized.replace(/\._[A-Z]+\d+[_,]\d*_?\./g, '._SL1500_.');
        normalized = normalized.replace(/_SY\d+_/g, '_SL1500_');
        normalized = normalized.replace(/_SX\d+_/g, '_SL1500_');
      }
      
      if (platform === 'aliexpress') {
        normalized = normalized.replace(/_\d+x\d+\./g, '.');
        normalized = normalized.replace(/\.jpg_\d+x\d+\.jpg/g, '.jpg');
        normalized = normalized.replace(/\?.*$/g, '');
      }
      
      if (platform === 'ebay') {
        normalized = normalized.replace(/s-l\d+/g, 's-l1600');
      }

      if (platform === 'temu' || platform === 'shein') {
        normalized = normalized.replace(/_thumbnail_\d+/g, '');
        normalized = normalized.replace(/\?.*$/g, '');
      }

      return normalized;
    },

    generateQualityScore(product) {
      let score = 0;
      
      if (product.title && product.title.length > 10) score += 20;
      if (product.description && product.description.length > 50) score += 15;
      if (product.price && product.price > 0) score += 15;
      if (product.images && product.images.length >= 3) score += 20;
      if (product.images && product.images.length >= 6) score += 10;
      if (product.variants && product.variants.length > 0) score += 10;
      if (product.brand) score += 5;
      if (product.category) score += 5;
      
      return Math.min(100, score);
    }
  };

  // ============================================
  // Universal Extractor Base (Enhanced)
  // ============================================
  class UniversalExtractor {
    constructor(platform) {
      this.platform = platform;
    }

    async extract() {
      const strategies = [
        () => this.extractFromJsonLd(),
        () => this.extractFromMeta(),
        () => this.extractFromDom(),
        () => this.extractFromNetworkState()
      ];

      let product = null;

      for (const strategy of strategies) {
        try {
          const result = await strategy();
          if (result && result.title) {
            product = this.mergeProducts(product, result);
          }
        } catch (error) {
          console.log('ShopOpti+ extraction strategy failed:', error.message);
        }
      }

      if (product) {
        product.platform = this.platform;
        product.url = window.location.href;
        product.extracted_at = new Date().toISOString();
        product.quality_score = Utils.generateQualityScore(product);
        
        if (product.images) {
          product.images = product.images
            .map(url => Utils.normalizeImageUrl(url, this.platform))
            .filter(Boolean)
            .filter((url, index, self) => self.indexOf(url) === index)
            .slice(0, 30);
        }
      }

      return product;
    }

    mergeProducts(existing, newData) {
      if (!existing) return newData;
      return {
        ...existing,
        ...newData,
        images: [...new Set([...(existing.images || []), ...(newData.images || [])])],
        variants: [...(existing.variants || []), ...(newData.variants || [])],
        videos: [...new Set([...(existing.videos || []), ...(newData.videos || [])])]
      };
    }

    extractFromJsonLd() {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent);
          const product = this.parseJsonLd(data);
          if (product) return product;
        } catch (e) {
          // Continue to next script
        }
      }
      return null;
    }

    parseJsonLd(data) {
      if (Array.isArray(data)) {
        for (const item of data) {
          const result = this.parseJsonLd(item);
          if (result) return result;
        }
        return null;
      }

      if (data['@graph']) {
        return this.parseJsonLd(data['@graph']);
      }

      if (data['@type'] === 'Product' || data['@type']?.includes?.('Product')) {
        return {
          title: data.name,
          description: data.description,
          price: this.extractJsonLdPrice(data),
          images: this.extractJsonLdImages(data),
          sku: data.sku || data.productID || data.mpn,
          brand: typeof data.brand === 'string' ? data.brand : data.brand?.name,
          category: data.category,
          rating: data.aggregateRating?.ratingValue ? parseFloat(data.aggregateRating.ratingValue) : null,
          review_count: data.aggregateRating?.reviewCount ? parseInt(data.aggregateRating.reviewCount) : null
        };
      }

      return null;
    }

    extractJsonLdPrice(data) {
      if (data.offers) {
        const offer = Array.isArray(data.offers) ? data.offers[0] : data.offers;
        return Utils.formatPrice(offer.price || offer.lowPrice);
      }
      return 0;
    }

    extractJsonLdImages(data) {
      if (!data.image) return [];
      if (typeof data.image === 'string') return [data.image];
      if (Array.isArray(data.image)) {
        return data.image.map(img => typeof img === 'string' ? img : img.url).filter(Boolean).slice(0, 20);
      }
      if (data.image.url) return [data.image.url];
      return [];
    }

    extractFromMeta() {
      const meta = {};
      
      const ogTitle = document.querySelector('meta[property="og:title"]');
      const ogDescription = document.querySelector('meta[property="og:description"]');
      const ogImage = document.querySelector('meta[property="og:image"]');
      const productPrice = document.querySelector('meta[property="product:price:amount"]');
      const productCurrency = document.querySelector('meta[property="product:price:currency"]');

      if (ogTitle) meta.title = Utils.cleanText(ogTitle.content);
      if (ogDescription) meta.description = ogDescription.content;
      if (ogImage) meta.images = [ogImage.content];
      if (productPrice) meta.price = Utils.formatPrice(productPrice.content);
      if (productCurrency) meta.currency = productCurrency.content;

      return meta.title ? meta : null;
    }

    extractFromDom() {
      const titleSelectors = ['h1', '[data-testid="product-title"]', '.product-title', '#productTitle'];
      let title = null;
      for (const selector of titleSelectors) {
        const el = document.querySelector(selector);
        if (el?.textContent?.trim()) {
          title = Utils.cleanText(el.textContent);
          break;
        }
      }
      if (!title) return null;

      let price = 0;
      const priceSelectors = [
        '[data-testid="price"]', '.price', '.Price', '[class*="price"]',
        '#priceblock_ourprice', '#priceblock_dealprice', '[itemprop="price"]'
      ];

      for (const selector of priceSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          price = Utils.formatPrice(el.textContent || el.content);
          if (price > 0) break;
        }
      }

      const images = this.extractImagesFromDom();
      const category = this.extractCategoryFromDom();

      return { title, description: document.querySelector('meta[name="description"]')?.content || '', price, images, category };
    }

    extractImagesFromDom() {
      const images = [];
      const seenUrls = new Set();
      
      const imageSelectors = [
        '[data-testid="product-image"] img', '.product-image img', '.gallery img',
        '#main-image', 'img[data-zoom-image]', '.product-gallery img',
        '[class*="product"] [class*="image"] img', '[class*="carousel"] img', '[class*="slider"] img'
      ];

      for (const selector of imageSelectors) {
        const imgs = document.querySelectorAll(selector);
        imgs.forEach(img => {
          const src = img.src || img.dataset.src || img.dataset.original || img.dataset.zoom;
          if (src && !seenUrls.has(src)) {
            const normalized = Utils.normalizeImageUrl(src, this.platform);
            if (normalized) {
              seenUrls.add(src);
              images.push(normalized);
            }
          }
        });
        if (images.length >= 20) break;
      }

      return images;
    }

    extractCategoryFromDom() {
      const breadcrumbSelectors = [
        '[itemtype*="BreadcrumbList"] [itemprop="name"]', '.breadcrumb a',
        '[class*="breadcrumb"] a', 'nav[aria-label*="breadcrumb"] a', '[data-testid="breadcrumb"] a'
      ];

      for (const selector of breadcrumbSelectors) {
        const items = document.querySelectorAll(selector);
        if (items.length >= 2) {
          const categories = Array.from(items)
            .map(el => Utils.cleanText(el.textContent))
            .filter(text => text && !text.toLowerCase().includes('accueil') && !text.toLowerCase().includes('home'));
          if (categories.length > 0) {
            return categories.slice(-2).join(' > ');
          }
        }
      }
      return null;
    }

    async extractFromNetworkState() {
      return null; // Override in platform-specific extractors
    }
  }

  // ============================================
  // ShopOpti Button Injection
  // ============================================
  class ButtonInjector {
    constructor(platform) {
      this.platform = platform;
      this.buttonId = 'shopopti-import-btn';
    }

    inject() {
      if (document.getElementById(this.buttonId)) return;

      const button = document.createElement('button');
      button.id = this.buttonId;
      button.className = 'shopopti-float-btn';
      // [SHOULD] use textContent, not innerHTML for static content
      button.textContent = '+ ShopOpti';
      button.setAttribute('aria-label', 'Importer ce produit avec ShopOpti+');

      button.addEventListener('click', async () => {
        button.disabled = true;
        button.textContent = '⏳ Import...';

        try {
          const extractor = new UniversalExtractor(this.platform);
          const product = await extractor.extract();

          if (product && product.title) {
            const result = await Utils.sendToBackground('import_product', product);
            if (result?.success) {
              button.textContent = '✓ Importé';
              button.style.background = '#10B981';
            } else {
              // [MUST] Show error message, not silent fail
              button.textContent = `✗ ${(result?.error || 'Erreur').substring(0, 25)}`;
              button.style.background = '#EF4444';
            }
          } else {
            button.textContent = '✗ Extraction échouée';
            button.style.background = '#EF4444';
          }
        } catch (error) {
          console.error('ShopOpti+ import error:', error);
          button.textContent = '✗ Erreur';
          button.style.background = '#EF4444';
        }

        setTimeout(() => {
          button.disabled = false;
          button.textContent = '+ ShopOpti';
          button.style.background = '';
        }, 4000);
      });

      document.body.appendChild(button);
    }
  }

  // ============================================
  // Message Listener for Background
  // ============================================
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'extract_product') {
      const detected = Utils.detectPlatform();
      if (!detected) {
        sendResponse({ success: false, error: 'Platform not detected' });
        return true;
      }

      const extractor = new UniversalExtractor(detected.platform);
      extractor.extract().then(product => {
        if (product) {
          sendResponse({ success: true, product });
        } else {
          sendResponse({ success: false, error: 'No product data found' });
        }
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });

      return true;
    }
  });

  // ============================================
  // Auto-Initialize
  // ============================================
  function initialize() {
    const detected = Utils.detectPlatform();
    if (!detected) {
      // [CAN] Don't inject on non-product pages
      console.log('[ShopOpti+] No supported product page detected, skipping injection.');
      return;
    }

    console.log(`[ShopOpti+] v${LOADER_VERSION} detected ${detected.platform} product page`);

    // Inject import button
    const injector = new ButtonInjector(detected.platform);
    injector.inject();

    // Notify background of product detection
    const extractor = new UniversalExtractor(detected.platform);
    extractor.extract().then(product => {
      if (product) {
        Utils.sendToBackground('product_detected', product);
      }
    }).catch(() => {});
  }

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initialize, 1000));
  } else {
    setTimeout(initialize, 1000);
  }

})();
