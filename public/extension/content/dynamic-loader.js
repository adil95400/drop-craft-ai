/**
 * ShopOpti+ Pro - Dynamic Loader
 * Version: 5.7.3
 * 
 * Lightweight core that detects the platform and dynamically loads
 * only the necessary extraction modules and UI components.
 */

(function() {
  'use strict';

  // Prevent double-loading
  if (window.__SHOPOPTI_LOADED__) return;
  window.__SHOPOPTI_LOADED__ = true;

  // ============================================
  // Platform Detection
  // ============================================
  const PLATFORM_PATTERNS = {
    aliexpress: {
      pattern: /aliexpress\.com/,
      productPatterns: [/\/item\/(\d+)\.html/, /\/(\d+)\.html/],
      extractorModule: 'aliexpress-extractor.js'
    },
    amazon: {
      pattern: /amazon\.(com|fr|de|co\.uk|es|it)/,
      productPatterns: [/\/dp\/([A-Z0-9]{10})/, /\/gp\/product\/([A-Z0-9]{10})/],
      extractorModule: 'amazon-extractor.js'
    },
    ebay: {
      pattern: /ebay\.(com|fr|de|co\.uk)/,
      productPatterns: [/\/itm\/(\d+)/, /\/itm\/[^\/]+\/(\d+)/],
      extractorModule: 'ebay-extractor.js'
    },
    walmart: {
      pattern: /walmart\.com/,
      productPatterns: [/\/ip\/[^\/]+\/(\d+)/],
      extractorModule: 'walmart-extractor.js'
    },
    temu: {
      pattern: /temu\.com/,
      productPatterns: [/goods\.html\?.*goods_id=(\d+)/],
      extractorModule: 'temu-extractor.js'
    },
    shein: {
      pattern: /shein\.com/,
      productPatterns: [/-p-(\d+)/],
      extractorModule: 'shein-extractor.js'
    },
    etsy: {
      pattern: /etsy\.com/,
      productPatterns: [/\/listing\/(\d+)/],
      extractorModule: 'etsy-extractor.js'
    },
    banggood: {
      pattern: /banggood\.com/,
      productPatterns: [/-p-(\d+)\.html/],
      extractorModule: 'banggood-extractor.js'
    },
    cjdropshipping: {
      pattern: /cjdropshipping\.com/,
      productPatterns: [/\/product\/.*-p-(\d+)\.html/, /pid=(\d+)/],
      extractorModule: 'cj-extractor.js'
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
      return new Promise((resolve, reject) => {
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
          reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        }, timeout);
      });
    },

    sendToBackground(action, data = {}) {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action, data }, resolve);
      });
    },

    formatPrice(price) {
      if (typeof price === 'string') {
        price = price.replace(/[^\d.,]/g, '').replace(',', '.');
      }
      return parseFloat(price) || 0;
    },

    cleanText(text) {
      if (!text) return '';
      return text.trim().replace(/\s+/g, ' ');
    }
  };

  // ============================================
  // Universal Extractor Base
  // ============================================
  class UniversalExtractor {
    constructor(platform) {
      this.platform = platform;
    }

    async extract() {
      // Try multiple extraction strategies
      const strategies = [
        () => this.extractFromJsonLd(),
        () => this.extractFromMeta(),
        () => this.extractFromDom()
      ];

      let product = null;

      for (const strategy of strategies) {
        try {
          const result = await strategy();
          if (result && result.title) {
            product = result;
            break;
          }
        } catch (error) {
          console.log('Extraction strategy failed:', error);
        }
      }

      if (product) {
        product.platform = this.platform;
        product.url = window.location.href;
        product.extracted_at = new Date().toISOString();
      }

      return product;
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

      if (data['@type'] === 'Product') {
        return {
          title: data.name,
          description: data.description,
          price: this.extractJsonLdPrice(data),
          images: this.extractJsonLdImages(data),
          sku: data.sku || data.productID,
          brand: typeof data.brand === 'string' ? data.brand : data.brand?.name,
          rating: data.aggregateRating?.ratingValue,
          review_count: data.aggregateRating?.reviewCount
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
      if (Array.isArray(data.image)) return data.image.slice(0, 10);
      if (data.image.url) return [data.image.url];
      return [];
    }

    extractFromMeta() {
      const meta = {};
      
      const ogTitle = document.querySelector('meta[property="og:title"]');
      const ogDescription = document.querySelector('meta[property="og:description"]');
      const ogImage = document.querySelector('meta[property="og:image"]');
      const productPrice = document.querySelector('meta[property="product:price:amount"]');

      if (ogTitle) meta.title = ogTitle.content;
      if (ogDescription) meta.description = ogDescription.content;
      if (ogImage) meta.images = [ogImage.content];
      if (productPrice) meta.price = Utils.formatPrice(productPrice.content);

      return meta.title ? meta : null;
    }

    extractFromDom() {
      // Generic DOM extraction - platform-specific extractors will override
      const title = document.querySelector('h1')?.textContent;
      if (!title) return null;

      // Find price
      let price = 0;
      const priceSelectors = [
        '[data-testid="price"]',
        '.price',
        '.Price',
        '[class*="price"]',
        '#priceblock_ourprice',
        '#priceblock_dealprice'
      ];

      for (const selector of priceSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          price = Utils.formatPrice(el.textContent);
          if (price > 0) break;
        }
      }

      // Find images
      const images = [];
      const imageSelectors = [
        '[data-testid="product-image"] img',
        '.product-image img',
        '.gallery img',
        '#main-image',
        'img[data-zoom-image]'
      ];

      for (const selector of imageSelectors) {
        const imgs = document.querySelectorAll(selector);
        imgs.forEach(img => {
          const src = img.src || img.dataset.src || img.dataset.original;
          if (src && !images.includes(src)) {
            images.push(src);
          }
        });
        if (images.length >= 5) break;
      }

      return {
        title: Utils.cleanText(title),
        description: document.querySelector('meta[name="description"]')?.content || '',
        price,
        images
      };
    }
  }

  // ============================================
  // Platform-Specific Extractors
  // ============================================
  const PlatformExtractors = {
    aliexpress: class extends UniversalExtractor {
      async extractFromDom() {
        await Utils.waitForElement('h1').catch(() => {});

        const title = document.querySelector('h1')?.textContent || 
                      document.querySelector('[data-pl="product-title"]')?.textContent;

        // Price extraction
        let price = 0;
        const priceEl = document.querySelector('.product-price-value') ||
                       document.querySelector('[data-pl="product-price"]') ||
                       document.querySelector('.uniform-banner-box-price');
        if (priceEl) {
          price = Utils.formatPrice(priceEl.textContent);
        }

        // Original price
        let originalPrice = null;
        const origPriceEl = document.querySelector('.product-price-del') ||
                           document.querySelector('[class*="origin-price"]');
        if (origPriceEl) {
          originalPrice = Utils.formatPrice(origPriceEl.textContent);
        }

        // Images
        const images = [];
        document.querySelectorAll('.images-view-item img, .slider--img--D7MJNPZ img').forEach(img => {
          const src = img.src || img.dataset.src;
          if (src && src.includes('http')) {
            // Get high-res version
            const highRes = src.replace(/_\d+x\d+/, '_800x800');
            if (!images.includes(highRes)) images.push(highRes);
          }
        });

        // Variants - intercept from network or extract from DOM
        const variants = await this.extractVariants();

        // Shipping info
        const shipping = document.querySelector('[class*="shipping"] [class*="price"]')?.textContent;

        // Seller info
        const seller = {
          name: document.querySelector('.shop-name a')?.textContent,
          rating: document.querySelector('.store-rating')?.textContent
        };

        return {
          title: Utils.cleanText(title),
          description: document.querySelector('.product-description')?.innerHTML || '',
          price,
          original_price: originalPrice,
          images,
          variants,
          shipping_info: shipping,
          seller
        };
      }

      async extractVariants() {
        const variants = [];
        
        // Try to get from page state (SPA data)
        try {
          const stateScript = document.querySelector('script:contains("window.runParams")');
          if (stateScript) {
            const match = stateScript.textContent.match(/window\.runParams\s*=\s*({[\s\S]*?});/);
            if (match) {
              const data = JSON.parse(match[1]);
              if (data.data?.skuModule?.skuPriceList) {
                data.data.skuModule.skuPriceList.forEach(sku => {
                  variants.push({
                    sku_id: sku.skuId,
                    price: sku.skuVal?.actSkuCalPrice || sku.skuVal?.skuCalPrice,
                    attributes: sku.skuAttr
                  });
                });
              }
            }
          }
        } catch (e) {
          console.log('Variant extraction from script failed:', e);
        }

        // Fallback: extract from DOM
        if (variants.length === 0) {
          document.querySelectorAll('.sku-property').forEach(prop => {
            const name = prop.querySelector('.sku-property-text')?.textContent;
            const values = [];
            prop.querySelectorAll('.sku-property-item').forEach(item => {
              values.push({
                name: item.getAttribute('title') || item.textContent,
                image: item.querySelector('img')?.src
              });
            });
            if (name && values.length) {
              variants.push({ name, values });
            }
          });
        }

        return variants;
      }
    },

    amazon: class extends UniversalExtractor {
      async extractFromDom() {
        const title = document.querySelector('#productTitle')?.textContent;

        // ASIN
        const asin = window.location.href.match(/\/dp\/([A-Z0-9]{10})/) ||
                    window.location.href.match(/\/gp\/product\/([A-Z0-9]{10})/);

        // Price
        let price = 0;
        const priceEl = document.querySelector('.a-price .a-offscreen') ||
                       document.querySelector('#priceblock_ourprice') ||
                       document.querySelector('#priceblock_dealprice') ||
                       document.querySelector('.a-price-whole');
        if (priceEl) {
          price = Utils.formatPrice(priceEl.textContent);
        }

        // Images
        const images = [];
        // Main image
        const mainImg = document.querySelector('#landingImage')?.src ||
                       document.querySelector('#imgBlkFront')?.src;
        if (mainImg) images.push(mainImg.replace(/\._.*_\./, '.'));

        // Thumbnail images
        document.querySelectorAll('#altImages img').forEach(img => {
          let src = img.src;
          if (src && !src.includes('sprite') && !src.includes('grey-pixel')) {
            src = src.replace(/\._.*_\./, '.');
            if (!images.includes(src)) images.push(src);
          }
        });

        // Features
        const features = [];
        document.querySelectorAll('#feature-bullets li span').forEach(span => {
          const text = Utils.cleanText(span.textContent);
          if (text && !text.includes('Make sure this fits')) {
            features.push(text);
          }
        });

        // Rating
        const ratingEl = document.querySelector('#acrPopover');
        const rating = ratingEl?.title?.match(/[\d.]+/)?.[0];
        const reviewCount = document.querySelector('#acrCustomerReviewText')?.textContent?.match(/[\d,]+/)?.[0]?.replace(',', '');

        // Brand
        const brand = document.querySelector('#bylineInfo')?.textContent?.replace(/^(Visit the |Brand: )/, '');

        return {
          title: Utils.cleanText(title),
          description: features.join('\n'),
          price,
          images,
          sku: asin?.[1],
          brand: Utils.cleanText(brand),
          rating: parseFloat(rating) || null,
          review_count: parseInt(reviewCount) || null,
          features
        };
      }
    },

    ebay: class extends UniversalExtractor {
      async extractFromDom() {
        const title = document.querySelector('h1.x-item-title__mainTitle')?.textContent ||
                     document.querySelector('#itemTitle')?.textContent;

        // Item ID
        const itemId = window.location.href.match(/\/itm\/(\d+)/)?.[1] ||
                      window.location.href.match(/\/itm\/[^\/]+\/(\d+)/)?.[1];

        // Price
        let price = 0;
        const priceEl = document.querySelector('.x-price-primary span') ||
                       document.querySelector('#prcIsum') ||
                       document.querySelector('[itemprop="price"]');
        if (priceEl) {
          price = Utils.formatPrice(priceEl.textContent || priceEl.content);
        }

        // Images
        const images = [];
        document.querySelectorAll('.ux-image-carousel img, .vi-image-gallery__image img').forEach(img => {
          let src = img.src || img.dataset.src;
          if (src) {
            src = src.replace(/s-l\d+/, 's-l1600');
            if (!images.includes(src)) images.push(src);
          }
        });

        // Seller
        const seller = {
          name: document.querySelector('.x-sellercard-atf__info a')?.textContent,
          rating: document.querySelector('.x-sellercard-atf__data-item--feedback')?.textContent
        };

        // Condition
        const condition = document.querySelector('.x-item-condition-text')?.textContent;

        return {
          title: Utils.cleanText(title),
          description: document.querySelector('#desc_div')?.innerHTML || '',
          price,
          images,
          sku: itemId,
          seller,
          condition: Utils.cleanText(condition)
        };
      }
    }
  };

  // ============================================
  // UI Injection
  // ============================================
  class ShopOptiUI {
    constructor(platform) {
      this.platform = platform;
      this.container = null;
    }

    inject() {
      if (document.querySelector('#shopopti-container')) return;

      this.container = document.createElement('div');
      this.container.id = 'shopopti-container';
      this.container.innerHTML = this.getTemplate();
      document.body.appendChild(this.container);

      this.bindEvents();
    }

    getTemplate() {
      return `
        <div class="shopopti-widget" id="shopopti-widget">
          <div class="shopopti-header">
            <span class="shopopti-logo">ShopOpti+</span>
            <button class="shopopti-close" id="shopopti-close">×</button>
          </div>
          <div class="shopopti-body">
            <div class="shopopti-status" id="shopopti-status">
              <span class="shopopti-spinner"></span>
              Analyse du produit...
            </div>
            <div class="shopopti-product" id="shopopti-product" style="display:none;">
              <img class="shopopti-product-image" id="shopopti-image" src="" alt="">
              <div class="shopopti-product-info">
                <div class="shopopti-product-title" id="shopopti-title"></div>
                <div class="shopopti-product-price" id="shopopti-price"></div>
              </div>
            </div>
            <div class="shopopti-actions">
              <button class="shopopti-btn shopopti-btn-primary" id="shopopti-import">
                Importer le produit
              </button>
              <button class="shopopti-btn shopopti-btn-secondary" id="shopopti-preview">
                Prévisualiser
              </button>
            </div>
          </div>
        </div>
        <button class="shopopti-fab" id="shopopti-fab">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </button>
      `;
    }

    bindEvents() {
      const fab = document.getElementById('shopopti-fab');
      const widget = document.getElementById('shopopti-widget');
      const closeBtn = document.getElementById('shopopti-close');
      const importBtn = document.getElementById('shopopti-import');
      const previewBtn = document.getElementById('shopopti-preview');

      fab?.addEventListener('click', () => {
        widget?.classList.toggle('shopopti-widget--open');
        fab.classList.toggle('shopopti-fab--active');
      });

      closeBtn?.addEventListener('click', () => {
        widget?.classList.remove('shopopti-widget--open');
        fab?.classList.remove('shopopti-fab--active');
      });

      importBtn?.addEventListener('click', () => this.handleImport());
      previewBtn?.addEventListener('click', () => this.handlePreview());
    }

    async updateWithProduct(product) {
      const status = document.getElementById('shopopti-status');
      const productDiv = document.getElementById('shopopti-product');
      const image = document.getElementById('shopopti-image');
      const title = document.getElementById('shopopti-title');
      const price = document.getElementById('shopopti-price');

      if (!product) {
        if (status) status.textContent = 'Produit non détecté';
        return;
      }

      if (status) status.style.display = 'none';
      if (productDiv) productDiv.style.display = 'flex';
      if (image && product.images?.[0]) image.src = product.images[0];
      if (title) title.textContent = product.title?.substring(0, 60) + (product.title?.length > 60 ? '...' : '');
      if (price) price.textContent = `${product.price?.toFixed(2)} €`;

      // Store product for import
      this.currentProduct = product;
    }

    async handleImport() {
      if (!this.currentProduct) return;

      const importBtn = document.getElementById('shopopti-import');
      if (importBtn) {
        importBtn.disabled = true;
        importBtn.textContent = 'Importation...';
      }

      const result = await Utils.sendToBackground('import_product', this.currentProduct);

      if (importBtn) {
        importBtn.disabled = false;
        importBtn.textContent = result.success ? 'Importé ✓' : 'Réessayer';
        
        if (result.success) {
          setTimeout(() => {
            importBtn.textContent = 'Importer le produit';
          }, 3000);
        }
      }
    }

    handlePreview() {
      if (!this.currentProduct) return;
      
      // Open preview modal or send to background for detailed preview
      console.log('Preview product:', this.currentProduct);
    }
  }

  // ============================================
  // Main Initialization
  // ============================================
  async function init() {
    const platformInfo = Utils.detectPlatform();
    
    if (!platformInfo) {
      console.log('ShopOpti+: Platform not supported');
      return;
    }

    console.log(`ShopOpti+: Detected ${platformInfo.platform}`, platformInfo);

    // Initialize UI
    const ui = new ShopOptiUI(platformInfo.platform);
    ui.inject();

    // Only extract on product pages
    if (platformInfo.productId) {
      // Get the appropriate extractor
      const ExtractorClass = PlatformExtractors[platformInfo.platform] || UniversalExtractor;
      const extractor = new ExtractorClass(platformInfo.platform);

      try {
        const product = await extractor.extract();
        
        if (product) {
          product.external_id = platformInfo.productId;
          ui.updateWithProduct(product);
          
          // Notify background script
          Utils.sendToBackground('product_detected', product);
        }
      } catch (error) {
        console.error('ShopOpti+ extraction error:', error);
      }
    }

    // Listen for extraction requests from background
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'extract_product') {
        const ExtractorClass = PlatformExtractors[platformInfo.platform] || UniversalExtractor;
        const extractor = new ExtractorClass(platformInfo.platform);
        
        extractor.extract().then(product => {
          sendResponse({ success: !!product, product });
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
        
        return true;
      }
    });
  }

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
