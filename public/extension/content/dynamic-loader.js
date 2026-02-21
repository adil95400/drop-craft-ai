/**
 * ShopOpti+ Pro - Dynamic Loader v7.0.0
 * 
 * Modular architecture: loads platform-specific extractors for
 * HD images, videos, reviews, and multi-variants.
 * Falls back to UniversalExtractor for unsupported platforms.
 */

(function() {
  'use strict';

  if (window.__SHOPOPTI_LOADED__) return;
  window.__SHOPOPTI_LOADED__ = true;

  const LOADER_VERSION = '7.0.0';

  // ============================================
  // Platform Detection (2025 Updated + TikTok)
  // ============================================
  const PLATFORM_PATTERNS = {
    aliexpress: {
      pattern: /aliexpress\.(com|ru|us)/,
      productPatterns: [/\/item\/(\d+)\.html/, /\/(\d+)\.html/, /productId=(\d+)/],
      excludePatterns: [/^https?:\/\/[^/]+\/?$/, /\/category\//, /\/wholesale\//],
    },
    amazon: {
      pattern: /amazon\.(com|fr|de|co\.uk|es|it|ca|com\.au)/,
      productPatterns: [/\/dp\/([A-Z0-9]{10})/, /\/gp\/product\/([A-Z0-9]{10})/, /\/gp\/aw\/d\/([A-Z0-9]{10})/],
      excludePatterns: [/^https?:\/\/[^/]+\/?$/, /\/s\?/, /\/b\//],
    },
    tiktok: {
      pattern: /tiktok\.com/,
      productPatterns: [/\/product\/(\d+)/, /goods_id=(\d+)/, /\/view\/product\/(\d+)/],
      excludePatterns: [/^https?:\/\/[^/]+\/?$/, /\/foryou/, /\/following/],
    },
    ebay: {
      pattern: /ebay\.(com|fr|de|co\.uk|es|it)/,
      productPatterns: [/\/itm\/(\d+)/, /\/itm\/[^\/]+\/(\d+)/],
      excludePatterns: [/^https?:\/\/[^/]+\/?$/, /\/sch\//, /\/b\//],
    },
    temu: {
      pattern: /temu\.com/,
      productPatterns: [/goods\.html\?.*goods_id=(\d+)/, /\?.*goods_id=(\d+)/, /-g-(\d+)\.html/],
      excludePatterns: [/^https?:\/\/[^/]+\/?$/],
    },
    walmart: {
      pattern: /walmart\.com/,
      productPatterns: [/\/ip\/[^\/]+\/(\d+)/],
      excludePatterns: [/^https?:\/\/[^/]+\/?$/, /\/search\//],
    },
    shein: {
      pattern: /shein\.(com|fr)/,
      productPatterns: [/-p-(\d+)/, /\/p\/[^\/]+-cat-\d+-id-(\d+)/],
      excludePatterns: [/^https?:\/\/[^/]+\/?$/, /\/category\//],
    },
    etsy: {
      pattern: /etsy\.com/,
      productPatterns: [/\/listing\/(\d+)/],
      excludePatterns: [/^https?:\/\/[^/]+\/?$/, /\/search\//],
    },
    banggood: {
      pattern: /banggood\.com/,
      productPatterns: [/-p-(\d+)\.html/, /products\/(\d+)/],
      excludePatterns: [/^https?:\/\/[^/]+\/?$/],
    },
    cjdropshipping: {
      pattern: /cjdropshipping\.com/,
      productPatterns: [/\/product\/.*-p-(\d+)\.html/, /pid=(\d+)/],
      excludePatterns: [/^https?:\/\/[^/]+\/?$/],
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
          if (config.excludePatterns) {
            const isExcluded = config.excludePatterns.some(p => p.test(href));
            if (isExcluded) {
              console.log(`[ShopOpti+] Skipping non-product page on ${platform}`);
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
        if (match && match[1]) return match[1];
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
                         .replace(/\s+/g, '').replace(/EUR|USD|GBP|JPY|CNY|CAD|AUD/gi, '').trim();
      if (cleaned.includes(',') && !cleaned.includes('.')) cleaned = cleaned.replace(',', '.');
      else if (cleaned.includes(',') && cleaned.includes('.')) cleaned = cleaned.replace(/\./g, '').replace(',', '.');
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
      for (const p of invalidPatterns) { if (urlLower.includes(p)) return ''; }
      let normalized = url;
      if (normalized.startsWith('//')) normalized = 'https:' + normalized;
      if (platform === 'amazon') normalized = normalized.replace(/_AC_[A-Z]{2}\d+_/g, '_AC_SL1500_');
      if (platform === 'aliexpress') normalized = normalized.replace(/_\d+x\d+\./g, '.').replace(/\?.*$/g, '');
      if (platform === 'ebay') normalized = normalized.replace(/s-l\d+/g, 's-l1600');
      if (platform === 'temu' || platform === 'shein') normalized = normalized.replace(/_thumbnail_\d+/g, '').replace(/\?.*$/g, '');
      return normalized;
    },

    generateQualityScore(product) {
      let score = 0;
      if (product.title && product.title.length > 10) score += 15;
      if (product.description && product.description.length > 50) score += 10;
      if (product.price && product.price > 0) score += 10;
      if (product.images && product.images.length >= 3) score += 15;
      if (product.images && product.images.length >= 6) score += 5;
      if (product.variants && product.variants.length > 0) score += 15;
      if (product.reviews && product.reviews.length > 0) score += 15;
      if (product.videos && product.videos.length > 0) score += 10;
      if (product.brand) score += 5;
      return Math.min(100, score);
    }
  };

  // ============================================
  // Universal Extractor (fallback for unregistered platforms)
  // ============================================
  class UniversalExtractor {
    constructor(platform) {
      this.platform = platform;
    }

    async extract() {
      const strategies = [
        () => this.extractFromJsonLd(),
        () => this.extractFromMeta(),
        () => this.extractFromDom()
      ];
      let product = null;
      for (const strategy of strategies) {
        try {
          const result = await strategy();
          if (result && result.title) product = this._merge(product, result);
        } catch {}
      }
      if (product) {
        product.platform = this.platform;
        product.url = window.location.href;
        product.extracted_at = new Date().toISOString();
        product.quality_score = Utils.generateQualityScore(product);
        if (product.images) {
          product.images = product.images
            .map(url => Utils.normalizeImageUrl(url, this.platform))
            .filter(Boolean).filter((u, i, a) => a.indexOf(u) === i).slice(0, 30);
        }
      }
      return product;
    }

    _merge(existing, newData) {
      if (!existing) return newData;
      return {
        ...existing, ...newData,
        images: [...new Set([...(existing.images || []), ...(newData.images || [])])],
        variants: [...(existing.variants || []), ...(newData.variants || [])],
        videos: [...new Set([...(existing.videos || []), ...(newData.videos || [])])],
        reviews: [...(existing.reviews || []), ...(newData.reviews || [])]
      };
    }

    extractFromJsonLd() {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent);
          const product = this._parseJsonLd(data);
          if (product) return product;
        } catch {}
      }
      return null;
    }

    _parseJsonLd(data) {
      if (Array.isArray(data)) { for (const item of data) { const r = this._parseJsonLd(item); if (r) return r; } return null; }
      if (data['@graph']) return this._parseJsonLd(data['@graph']);
      if (data['@type'] === 'Product' || data['@type']?.includes?.('Product')) {
        const offer = Array.isArray(data.offers) ? data.offers[0] : data.offers;
        return {
          title: data.name, description: data.description,
          price: Utils.formatPrice(offer?.price || offer?.lowPrice),
          images: data.image ? (Array.isArray(data.image) ? data.image.map(i => typeof i === 'string' ? i : i.url).filter(Boolean) : [typeof data.image === 'string' ? data.image : data.image.url]).filter(Boolean) : [],
          sku: data.sku || data.productID, brand: typeof data.brand === 'string' ? data.brand : data.brand?.name,
          category: data.category, rating: data.aggregateRating?.ratingValue ? parseFloat(data.aggregateRating.ratingValue) : null,
          review_count: data.aggregateRating?.reviewCount ? parseInt(data.aggregateRating.reviewCount) : null
        };
      }
      return null;
    }

    extractFromMeta() {
      const meta = {};
      const ogTitle = document.querySelector('meta[property="og:title"]');
      const ogDesc = document.querySelector('meta[property="og:description"]');
      const ogImg = document.querySelector('meta[property="og:image"]');
      const price = document.querySelector('meta[property="product:price:amount"]');
      if (ogTitle) meta.title = Utils.cleanText(ogTitle.content);
      if (ogDesc) meta.description = ogDesc.content;
      if (ogImg) meta.images = [ogImg.content];
      if (price) meta.price = Utils.formatPrice(price.content);
      return meta.title ? meta : null;
    }

    extractFromDom() {
      const titleSelectors = ['h1', '[data-testid="product-title"]', '.product-title', '#productTitle'];
      let title = null;
      for (const sel of titleSelectors) {
        const el = document.querySelector(sel);
        if (el?.textContent?.trim()) { title = Utils.cleanText(el.textContent); break; }
      }
      if (!title) return null;
      let price = 0;
      for (const sel of ['[data-testid="price"]', '.price', '[class*="price"]', '#priceblock_ourprice', '[itemprop="price"]']) {
        const el = document.querySelector(sel);
        if (el) { price = Utils.formatPrice(el.textContent || el.content); if (price > 0) break; }
      }
      const images = [];
      document.querySelectorAll('.product-image img, .gallery img, [class*="product"] [class*="image"] img').forEach(img => {
        const src = img.src || img.dataset.src;
        if (src) { const n = Utils.normalizeImageUrl(src, this.platform); if (n) images.push(n); }
      });
      return { title, description: document.querySelector('meta[name="description"]')?.content || '', price, images: images.slice(0, 20) };
    }
  }

  // ============================================
  // Smart Extractor — tries platform module first, falls back to universal
  // ============================================
  async function extractProduct(platform) {
    let product = null;

    // Try platform-specific extractor from registry
    if (typeof window.ExtractorRegistry !== 'undefined') {
      const platformExtractor = window.ExtractorRegistry.createExtractor(platform);
      if (platformExtractor) {
        try {
          product = await platformExtractor.extract();
          if (product && product.title) {
            console.log(`[ShopOpti+ v7] Extracted via ${platform} module: ${product.title.substring(0, 50)}`);
            product.extractor = 'modular';
            product.quality_score = Utils.generateQualityScore(product);
            return product;
          }
        } catch (err) {
          console.warn(`[ShopOpti+ v7] ${platform} extractor failed:`, err.message);
        }
      }
    }

    // Fallback to universal extractor
    console.log(`[ShopOpti+ v7] Using universal extractor for ${platform}`);
    const universal = new UniversalExtractor(platform);
    product = await universal.extract();
    if (product) product.extractor = 'universal';
    return product;
  }

  // ============================================
  // Button Injection
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
      button.textContent = '+ ShopOpti';
      button.setAttribute('aria-label', 'Importer ce produit avec ShopOpti+');

      button.addEventListener('click', async () => {
        button.disabled = true;
        button.textContent = '⏳ Import...';
        try {
          const product = await extractProduct(this.platform);
          if (product && product.title) {
            const result = await Utils.sendToBackground('import_product', product);
            if (result?.success) {
              button.textContent = '✓ Importé';
              button.style.background = '#10B981';
            } else {
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

      // Smart injection: try product-area first, then float
      const targetSelectors = {
        amazon: '#ppd, #centerCol, #buybox',
        aliexpress: '.product-action, .uniform-banner-box',
        tiktok: '[class*="product-action"], [class*="add-to-cart"]',
        ebay: '#mainContent .vim',
        temu: '[class*="goods-action"]'
      };

      let injected = false;
      const selectors = targetSelectors[this.platform];
      if (selectors) {
        for (const sel of selectors.split(',')) {
          const target = document.querySelector(sel.trim());
          if (target && this._isVisible(target)) {
            target.insertAdjacentElement('afterend', button);
            button.style.cssText = 'margin:12px 0;padding:12px 24px;background:linear-gradient(135deg,#8B5CF6,#6366F1);color:white;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 15px rgba(139,92,246,0.4);transition:all 0.3s ease;width:auto;display:inline-flex;align-items:center;gap:8px;z-index:999999;';
            injected = true;
            break;
          }
        }
      }

      if (!injected) {
        button.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:2147483647;padding:14px 24px;background:linear-gradient(135deg,#8B5CF6,#6366F1);color:white;border:none;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 20px rgba(139,92,246,0.4);transition:all 0.3s ease;';
        document.body.appendChild(button);
      }
    }

    _isVisible(el) {
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    }
  }

  // ============================================
  // Message Listener
  // ============================================
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'extract_product') {
      const detected = Utils.detectPlatform();
      if (!detected) {
        sendResponse({ success: false, error: 'Platform not detected' });
        return true;
      }
      extractProduct(detected.platform).then(product => {
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
      console.log('[ShopOpti+] No supported product page detected, skipping.');
      return;
    }

    console.log(`[ShopOpti+] v${LOADER_VERSION} detected ${detected.platform} product page`);

    // Log capabilities
    if (typeof window.ExtractorRegistry !== 'undefined') {
      const caps = window.ExtractorRegistry.getCapabilities(detected.platform);
      console.log(`[ShopOpti+] ${detected.platform} capabilities:`, JSON.stringify(caps));
    }

    const injector = new ButtonInjector(detected.platform);
    injector.inject();

    // Notify background
    extractProduct(detected.platform).then(product => {
      if (product) Utils.sendToBackground('product_detected', product);
    }).catch(() => {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initialize, 1000));
  } else {
    setTimeout(initialize, 1000);
  }
})();
