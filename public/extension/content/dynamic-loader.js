/**
 * ShopOpti+ Pro - Dynamic Loader v5.8.1
 * 
 * Enterprise-grade extraction with 2025-hardened selectors,
 * full variant/review/video support, and robust fallback strategies.
 */

(function() {
  'use strict';

  // Prevent double-loading
  if (window.__SHOPOPTI_LOADED__) return;
  window.__SHOPOPTI_LOADED__ = true;

  const LOADER_VERSION = '5.8.1';

  // ============================================
  // Platform Detection (2025 Updated)
  // ============================================
  const PLATFORM_PATTERNS = {
    aliexpress: {
      pattern: /aliexpress\.(com|ru|us)/,
      productPatterns: [/\/item\/(\d+)\.html/, /\/(\d+)\.html/, /productId=(\d+)/],
      extractorModule: 'aliexpress-extractor.js'
    },
    amazon: {
      pattern: /amazon\.(com|fr|de|co\.uk|es|it|ca|com\.au)/,
      productPatterns: [/\/dp\/([A-Z0-9]{10})/, /\/gp\/product\/([A-Z0-9]{10})/, /\/gp\/aw\/d\/([A-Z0-9]{10})/],
      extractorModule: 'amazon-extractor.js'
    },
    ebay: {
      pattern: /ebay\.(com|fr|de|co\.uk|es|it)/,
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
      productPatterns: [/goods\.html\?.*goods_id=(\d+)/, /\?.*goods_id=(\d+)/, /-g-(\d+)\.html/],
      extractorModule: 'temu-extractor.js'
    },
    shein: {
      pattern: /shein\.(com|fr)/,
      productPatterns: [/-p-(\d+)/, /\/p\/[^\/]+-cat-\d+-id-(\d+)/],
      extractorModule: 'shein-extractor.js'
    },
    etsy: {
      pattern: /etsy\.com/,
      productPatterns: [/\/listing\/(\d+)/],
      extractorModule: 'etsy-extractor.js'
    },
    banggood: {
      pattern: /banggood\.com/,
      productPatterns: [/-p-(\d+)\.html/, /products\/(\d+)/],
      extractorModule: 'banggood-extractor.js'
    },
    cjdropshipping: {
      pattern: /cjdropshipping\.com/,
      productPatterns: [/\/product\/.*-p-(\d+)\.html/, /pid=(\d+)/],
      extractorModule: 'cj-extractor.js'
    },
    costco: {
      pattern: /costco\.com/,
      productPatterns: [/\.product\.(\d+)\.html/, /productId=(\d+)/],
      extractorModule: 'costco-extractor.js'
    },
    homedepot: {
      pattern: /homedepot\.com/,
      productPatterns: [/\/p\/[^\/]+\/(\d+)/, /\/(\d{9})\/?$/],
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
          resolve(null); // Don't reject, just return null
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
      
      // Clean price string
      let cleaned = price.replace(/[€$£¥₹₽CHF₿฿₫₭₦₲₵₡₢₠₩₮₰₪]/gi, '')
                         .replace(/\s+/g, '')
                         .replace(/EUR|USD|GBP|JPY|CNY|CAD|AUD/gi, '')
                         .trim();
      
      // Handle European format (1.234,56)
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
      
      // Skip invalid patterns
      const invalidPatterns = ['sprite', 'pixel', 'grey', 'transparent', 'placeholder', 
                               'loader', 'loading', 'spacer', '1x1', 'blank', 'empty', 
                               'data:image', 'svg+xml', 'icon', 'logo', 'favicon', 'spinner'];
      const urlLower = url.toLowerCase();
      for (const pattern of invalidPatterns) {
        if (urlLower.includes(pattern)) return '';
      }

      let normalized = url;
      
      // Ensure https
      if (normalized.startsWith('//')) {
        normalized = 'https:' + normalized;
      }

      // Platform-specific high-res normalization
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
        
        // Normalize all images
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
      // Generic DOM extraction - platform-specific extractors will override
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

      // Find price
      let price = 0;
      const priceSelectors = [
        '[data-testid="price"]',
        '.price',
        '.Price',
        '[class*="price"]',
        '#priceblock_ourprice',
        '#priceblock_dealprice',
        '[itemprop="price"]'
      ];

      for (const selector of priceSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          price = Utils.formatPrice(el.textContent || el.content);
          if (price > 0) break;
        }
      }

      // Find images
      const images = this.extractImagesFromDom();

      // Find category
      const category = this.extractCategoryFromDom();

      return {
        title,
        description: document.querySelector('meta[name="description"]')?.content || '',
        price,
        images,
        category
      };
    }

    extractImagesFromDom() {
      const images = [];
      const seenUrls = new Set();
      
      const imageSelectors = [
        '[data-testid="product-image"] img',
        '.product-image img',
        '.gallery img',
        '#main-image',
        'img[data-zoom-image]',
        '.product-gallery img',
        '[class*="product"] [class*="image"] img',
        '[class*="carousel"] img',
        '[class*="slider"] img'
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
      // Try breadcrumb
      const breadcrumbSelectors = [
        '[itemtype*="BreadcrumbList"] [itemprop="name"]',
        '.breadcrumb a',
        '[class*="breadcrumb"] a',
        'nav[aria-label*="breadcrumb"] a',
        '[data-testid="breadcrumb"] a'
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
      // Try to extract from SPA state/store
      const stateKeys = ['__NEXT_DATA__', '__NUXT__', '__INITIAL_STATE__', 'window.__DATA__'];
      
      for (const key of stateKeys) {
        try {
          const script = document.querySelector(`script#${key}`) || 
                        document.querySelector(`script:contains("${key}")`);
          if (script) {
            // Parse and extract product data
            console.log('ShopOpti+ found state:', key);
          }
        } catch (e) {}
      }
      return null;
    }
  }

  // ============================================
  // Amazon Extractor (2025 Enhanced)
  // ============================================
  class AmazonExtractor extends UniversalExtractor {
    async extractFromDom() {
      // Wait for critical element
      await Utils.waitForMultipleElements(['#productTitle', 'h1#title'], 5000);

      const title = document.querySelector('#productTitle')?.textContent ||
                   document.querySelector('h1#title span')?.textContent ||
                   document.querySelector('h1.product-title-word-break')?.textContent;

      // ASIN
      const asinMatch = window.location.href.match(/\/dp\/([A-Z0-9]{10})/) ||
                       window.location.href.match(/\/gp\/product\/([A-Z0-9]{10})/);
      const asin = asinMatch?.[1];

      // Price - multiple strategies
      let price = 0;
      let originalPrice = null;
      
      const priceSelectors = [
        '.a-price .a-offscreen',
        '#priceblock_ourprice',
        '#priceblock_dealprice',
        '#corePrice_feature_div .a-offscreen',
        '.apexPriceToPay .a-offscreen',
        '.priceToPay .a-offscreen',
        'span[data-a-color="price"] .a-offscreen',
        '#price_inside_buybox'
      ];
      
      for (const selector of priceSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          price = Utils.formatPrice(el.textContent);
          if (price > 0) break;
        }
      }

      // Original price (was price)
      const origPriceEl = document.querySelector('.a-text-strike .a-offscreen') ||
                         document.querySelector('.basisPrice .a-offscreen') ||
                         document.querySelector('[data-a-strike="true"] .a-offscreen');
      if (origPriceEl) {
        originalPrice = Utils.formatPrice(origPriceEl.textContent);
      }

      // Images - get ALL high-res
      const images = await this.extractImages(asin);

      // Videos
      const videos = this.extractVideos();

      // Features/Description
      const features = [];
      document.querySelectorAll('#feature-bullets li span.a-list-item').forEach(span => {
        const text = Utils.cleanText(span.textContent);
        if (text && text.length > 10 && !text.includes('Make sure this fits')) {
          features.push(text);
        }
      });

      // Full description
      const descriptionEl = document.querySelector('#productDescription p') ||
                           document.querySelector('#aplus_feature_div');
      const description = features.join('\n\n') + '\n\n' + (descriptionEl?.textContent || '');

      // Rating & Reviews
      const ratingEl = document.querySelector('#acrPopover');
      const rating = ratingEl?.title?.match(/[\d.,]+/)?.[0]?.replace(',', '.');
      const reviewCountEl = document.querySelector('#acrCustomerReviewText');
      const reviewCount = reviewCountEl?.textContent?.match(/[\d,.\s]+/)?.[0]?.replace(/[\s,.]/g, '');

      // Brand
      const brandEl = document.querySelector('#bylineInfo');
      let brand = '';
      if (brandEl) {
        brand = Utils.cleanText(brandEl.textContent)
          .replace(/^(Visit the |Brand: |Marque\s*:\s*)/i, '')
          .replace(/Store$/, '')
          .trim();
      }

      // Category from breadcrumb
      const category = this.extractCategory();

      // Variants
      const variants = this.extractVariants();

      return {
        title: Utils.cleanText(title),
        description: Utils.cleanText(description),
        price,
        original_price: originalPrice,
        images,
        videos,
        sku: asin,
        brand,
        category,
        rating: parseFloat(rating) || null,
        review_count: parseInt(reviewCount) || null,
        variants,
        features
      };
    }

    async extractImages(asin) {
      const images = [];
      const seenUrls = new Set();

      // Strategy 1: Get from colorImages data
      const colorImagesScript = document.body.innerHTML.match(/'colorImages'\s*:\s*\{([^}]+)\}/);
      if (colorImagesScript) {
        const hiResMatches = document.body.innerHTML.matchAll(/\"hiRes\"\s*:\s*\"([^\"]+)\"/g);
        for (const match of hiResMatches) {
          const url = match[1].replace(/\\u002F/g, '/');
          if (!seenUrls.has(url) && !url.includes('sprite')) {
            seenUrls.add(url);
            images.push(url);
          }
        }
      }

      // Strategy 2: landingImage
      const mainImg = document.querySelector('#landingImage');
      if (mainImg) {
        const dynamicImageData = mainImg.dataset.aDynamicImage;
        if (dynamicImageData) {
          try {
            const parsed = JSON.parse(dynamicImageData);
            Object.keys(parsed).forEach(url => {
              const normalized = Utils.normalizeImageUrl(url, 'amazon');
              if (normalized && !seenUrls.has(normalized)) {
                seenUrls.add(normalized);
                images.unshift(normalized);
              }
            });
          } catch (e) {}
        } else if (mainImg.src) {
          const normalized = Utils.normalizeImageUrl(mainImg.src, 'amazon');
          if (normalized && !seenUrls.has(normalized)) {
            seenUrls.add(normalized);
            images.unshift(normalized);
          }
        }
      }

      // Strategy 3: Thumbnail images
      document.querySelectorAll('#altImages li.item img, #imageBlock img').forEach(img => {
        const src = img.dataset.oldHires || img.src;
        if (src) {
          const normalized = Utils.normalizeImageUrl(src, 'amazon');
          if (normalized && !seenUrls.has(normalized) && !normalized.includes('sprite') && !normalized.includes('grey-pixel')) {
            seenUrls.add(normalized);
            images.push(normalized);
          }
        }
      });

      return images.slice(0, 30);
    }

    extractVideos() {
      const videos = [];
      const seenUrls = new Set();
      
      const patterns = [
        /\"videoUrl\"\s*:\s*\"([^\"]+)\"/g,
        /\"url\"\s*:\s*\"([^\"]+\.mp4[^\"]*)\"/g,
        /\"hlsUrl\"\s*:\s*\"([^\"]+)\"/g
      ];
      
      const html = document.body.innerHTML;
      for (const pattern of patterns) {
        const matches = html.matchAll(pattern);
        for (const match of matches) {
          let url = match[1].replace(/\\u002F/g, '/').replace(/\\/g, '');
          if (url.includes('preview') || url.includes('thumb')) continue;
          if (!seenUrls.has(url) && (url.includes('.mp4') || url.includes('.m3u8'))) {
            seenUrls.add(url);
            videos.push(url);
          }
        }
      }
      
      return videos.slice(0, 10);
    }

    extractCategory() {
      const breadcrumbItems = document.querySelectorAll('#wayfinding-breadcrumbs_feature_div li a');
      if (breadcrumbItems.length > 0) {
        const categories = Array.from(breadcrumbItems)
          .map(a => Utils.cleanText(a.textContent))
          .filter(Boolean);
        return categories.join(' > ');
      }
      return null;
    }

    extractVariants() {
      const variants = [];
      const seenIds = new Set();

      // Try twister data
      try {
        const dimensionMatch = document.body.innerHTML.match(/\"dimensionValuesDisplayData\"\s*:\s*(\{[\s\S]*?\})\s*,\s*\"/);
        if (dimensionMatch) {
          const data = JSON.parse(dimensionMatch[1]);
          for (const [asin, values] of Object.entries(data)) {
            if (!seenIds.has(asin) && Array.isArray(values)) {
              seenIds.add(asin);
              variants.push({
                sku: asin,
                name: values.join(' - '),
                type: 'option',
                available: true
              });
            }
          }
        }
      } catch (e) {}

      // Try color swatches
      document.querySelectorAll('#variation_color_name li, #variation_size_name li').forEach(li => {
        const title = li.getAttribute('title') || li.querySelector('img')?.alt;
        const asin = li.dataset.defaultasin;
        if (asin && !seenIds.has(asin)) {
          seenIds.add(asin);
          variants.push({
            sku: asin,
            name: title || asin,
            type: 'variant',
            image: li.querySelector('img')?.src,
            available: !li.classList.contains('unavailable')
          });
        }
      });

      return variants;
    }
  }

  // ============================================
  // AliExpress Extractor (2025 Enhanced)
  // ============================================
  class AliExpressExtractor extends UniversalExtractor {
    async extractFromDom() {
      // Wait for SPA to load
      await Utils.waitForMultipleElements([
        'h1',
        '[data-pl="product-title"]',
        '.product-title-text'
      ], 8000);

      const title = document.querySelector('h1')?.textContent || 
                   document.querySelector('[data-pl="product-title"]')?.textContent ||
                   document.querySelector('.product-title-text')?.textContent;

      // Price extraction - multiple 2025 selectors
      let price = 0;
      let originalPrice = null;
      
      const priceSelectors = [
        '.product-price-value',
        '[data-pl="product-price"]',
        '.uniform-banner-box-price',
        '.es--wrap--erdmb8i .es--char--ygdZW6w',
        '[class*="Price_Price"]',
        '.snow-price_SnowPrice__mainM'
      ];
      
      for (const selector of priceSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          price = Utils.formatPrice(el.textContent);
          if (price > 0) break;
        }
      }

      // Original price
      const origPriceEl = document.querySelector('.product-price-del') ||
                         document.querySelector('[class*="origin-price"]') ||
                         document.querySelector('.snow-price_SnowPrice__originM');
      if (origPriceEl) {
        originalPrice = Utils.formatPrice(origPriceEl.textContent);
      }

      // Images - collect from multiple sources
      const images = await this.extractImages();

      // Videos
      const videos = this.extractVideos();

      // Variants from SPA state
      const variants = await this.extractVariants();

      // Shipping info
      const shippingEl = document.querySelector('[class*="shipping"] [class*="price"]') ||
                        document.querySelector('.dynamic-shipping-line .bold');
      const shipping = shippingEl?.textContent;

      // Seller info
      const seller = {
        name: document.querySelector('.shop-name a, [class*="store-name"]')?.textContent,
        rating: document.querySelector('.store-rating, [class*="store-rating"]')?.textContent
      };

      // Description (often loaded dynamically)
      const description = document.querySelector('.product-description')?.innerHTML ||
                         document.querySelector('[class*="ProductDescription"]')?.innerHTML || '';

      // Category
      const category = this.extractCategory();

      // Rating
      const ratingEl = document.querySelector('[class*="rating"] [class*="text"]');
      const reviewCountEl = document.querySelector('[class*="review"] [class*="count"]');

      return {
        title: Utils.cleanText(title),
        description: Utils.cleanText(description),
        price,
        original_price: originalPrice,
        images,
        videos,
        variants,
        shipping_info: shipping,
        seller,
        category,
        rating: ratingEl ? Utils.formatPrice(ratingEl.textContent) : null,
        review_count: reviewCountEl ? parseInt(reviewCountEl.textContent.replace(/\D/g, '')) : null
      };
    }

    async extractImages() {
      const images = [];
      const seenUrls = new Set();

      // From gallery
      const gallerySelectors = [
        '.images-view-item img',
        '.slider--img--D7MJNPZ img',
        '[class*="ImageGallery"] img',
        '.product-img img',
        '.magnifier-image'
      ];

      for (const selector of gallerySelectors) {
        document.querySelectorAll(selector).forEach(img => {
          const src = img.src || img.dataset.src || img.dataset.lazyloadSrc;
          if (src && src.includes('http')) {
            const normalized = Utils.normalizeImageUrl(src, 'aliexpress');
            if (normalized && !seenUrls.has(normalized)) {
              seenUrls.add(normalized);
              images.push(normalized);
            }
          }
        });
      }

      // From page data
      try {
        const pageData = document.body.innerHTML.match(/\"imagePathList\"\s*:\s*\[([\s\S]*?)\]/);
        if (pageData) {
          const urls = pageData[1].match(/\"([^\"]+)\"/g);
          urls?.forEach(url => {
            const cleanUrl = url.replace(/\"/g, '');
            const normalized = Utils.normalizeImageUrl(cleanUrl, 'aliexpress');
            if (normalized && !seenUrls.has(normalized)) {
              seenUrls.add(normalized);
              images.push(normalized);
            }
          });
        }
      } catch (e) {}

      return images.slice(0, 30);
    }

    extractVideos() {
      const videos = [];
      
      try {
        const videoMatches = document.body.innerHTML.matchAll(/\"videoUrl\"\s*:\s*\"([^\"]+)\"/g);
        for (const match of videoMatches) {
          const url = match[1].replace(/\\u002F/g, '/');
          if (url.includes('.mp4') && !videos.includes(url)) {
            videos.push(url);
          }
        }
      } catch (e) {}

      return videos.slice(0, 5);
    }

    async extractVariants() {
      const variants = [];
      
      // Try from SPA state
      try {
        const skuMatch = document.body.innerHTML.match(/\"skuPriceList\"\s*:\s*\[([\s\S]*?)\]/);
        if (skuMatch) {
          const skuData = JSON.parse('[' + skuMatch[1] + ']');
          skuData.forEach(sku => {
            variants.push({
              sku_id: sku.skuId,
              price: sku.skuVal?.actSkuCalPrice || sku.skuVal?.skuCalPrice,
              attributes: sku.skuAttr,
              available: sku.skuVal?.availQuantity > 0
            });
          });
        }
      } catch (e) {}

      // Fallback: DOM extraction
      if (variants.length === 0) {
        document.querySelectorAll('.sku-property, [class*="SkuProperty"]').forEach(prop => {
          const name = prop.querySelector('.sku-property-text, [class*="title"]')?.textContent;
          const values = [];
          prop.querySelectorAll('.sku-property-item, [class*="item"]').forEach(item => {
            values.push({
              name: item.getAttribute('title') || Utils.cleanText(item.textContent),
              image: item.querySelector('img')?.src,
              available: !item.classList.contains('disabled')
            });
          });
          if (name && values.length) {
            variants.push({ name: Utils.cleanText(name), values });
          }
        });
      }

      return variants;
    }

    extractCategory() {
      const breadcrumbItems = document.querySelectorAll('.breadcrumb a, [class*="Breadcrumb"] a');
      if (breadcrumbItems.length > 0) {
        const categories = Array.from(breadcrumbItems)
          .map(a => Utils.cleanText(a.textContent))
          .filter(Boolean)
          .slice(0, -1); // Exclude product title
        return categories.join(' > ');
      }
      return null;
    }
  }

  // ============================================
  // Temu Extractor (2025 - Full Dynamic Support)
  // ============================================
  class TemuExtractor extends UniversalExtractor {
    async extractFromDom() {
      // Temu is heavily SPA-based, need to wait for content
      await Utils.waitForMultipleElements([
        '[class*="ProductTitle"]',
        'h1',
        '[data-testid="product-title"]'
      ], 10000);

      // Try to get from window state first
      const stateData = await this.extractFromWindowState();
      if (stateData && stateData.title) {
        return stateData;
      }

      // Fallback to DOM extraction
      const title = document.querySelector('[class*="ProductTitle"]')?.textContent ||
                   document.querySelector('h1')?.textContent;

      let price = 0;
      const priceEl = document.querySelector('[class*="Price_price"]') ||
                     document.querySelector('[data-testid="price"]') ||
                     document.querySelector('[class*="salePrice"]');
      if (priceEl) {
        price = Utils.formatPrice(priceEl.textContent);
      }

      const images = [];
      document.querySelectorAll('[class*="ProductGallery"] img, [class*="carousel"] img').forEach(img => {
        const src = img.src || img.dataset.src;
        if (src && src.includes('http')) {
          const normalized = Utils.normalizeImageUrl(src, 'temu');
          if (normalized && !images.includes(normalized)) {
            images.push(normalized);
          }
        }
      });

      return {
        title: Utils.cleanText(title),
        price,
        images,
        description: document.querySelector('[class*="ProductDesc"]')?.textContent || '',
        category: this.extractCategory()
      };
    }

    async extractFromWindowState() {
      try {
        // Temu stores product data in window.__PRELOADED_STATE__ or similar
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
          const content = script.textContent;
          if (content?.includes('__PRELOADED_STATE__') || content?.includes('window.__DATA__')) {
            const match = content.match(/window\.__(?:PRELOADED_STATE__|DATA__)__?\s*=\s*({[\s\S]*?});?\s*(?:<\/script>|$)/);
            if (match) {
              const data = JSON.parse(match[1]);
              // Navigate to product data
              const product = data.product || data.goods || data.pageData?.goods;
              if (product) {
                return {
                  title: product.title || product.goodsName,
                  description: product.description || product.goodsDesc,
                  price: Utils.formatPrice(product.price || product.salePrice),
                  original_price: Utils.formatPrice(product.originalPrice || product.marketPrice),
                  images: product.images || product.goodsImages || [],
                  sku: product.id || product.goodsId,
                  category: product.category || product.categoryPath
                };
              }
            }
          }
        }
      } catch (e) {
        console.log('Temu state extraction failed:', e.message);
      }
      return null;
    }

    extractCategory() {
      const breadcrumbItems = document.querySelectorAll('[class*="breadcrumb"] a');
      if (breadcrumbItems.length > 0) {
        return Array.from(breadcrumbItems).map(a => Utils.cleanText(a.textContent)).filter(Boolean).join(' > ');
      }
      return null;
    }
  }

  // ============================================
  // eBay Extractor (2025 Enhanced)
  // ============================================
  class EbayExtractor extends UniversalExtractor {
    async extractFromDom() {
      const title = document.querySelector('h1.x-item-title__mainTitle span')?.textContent ||
                   document.querySelector('h1.x-item-title__mainTitle')?.textContent ||
                   document.querySelector('#itemTitle')?.textContent;

      const itemId = window.location.href.match(/\/itm\/(\d+)/)?.[1] ||
                    window.location.href.match(/\/itm\/[^\/]+\/(\d+)/)?.[1];

      let price = 0;
      const priceEl = document.querySelector('.x-price-primary span') ||
                     document.querySelector('[itemprop="price"]') ||
                     document.querySelector('#prcIsum');
      if (priceEl) {
        price = Utils.formatPrice(priceEl.textContent || priceEl.content);
      }

      const images = [];
      document.querySelectorAll('.ux-image-carousel img, .vi-image-gallery__image img, #icImg').forEach(img => {
        let src = img.src || img.dataset.src || img.dataset.zoom;
        if (src) {
          const normalized = Utils.normalizeImageUrl(src, 'ebay');
          if (normalized && !images.includes(normalized)) {
            images.push(normalized);
          }
        }
      });

      // Seller
      const seller = {
        name: document.querySelector('.x-sellercard-atf__info a, .seller-info a')?.textContent,
        rating: document.querySelector('.x-sellercard-atf__data-item--feedback')?.textContent
      };

      // Condition
      const condition = document.querySelector('.x-item-condition-text span, [data-testid="item-condition"]')?.textContent;

      // Category
      const category = this.extractCategory();

      return {
        title: Utils.cleanText(title),
        description: document.querySelector('#desc_div, #viTabs_0_is')?.textContent || '',
        price,
        images,
        sku: itemId,
        seller,
        condition: Utils.cleanText(condition),
        category
      };
    }

    extractCategory() {
      const breadcrumbItems = document.querySelectorAll('.seo-breadcrumb-text a, [itemprop="itemListElement"] a');
      if (breadcrumbItems.length > 0) {
        return Array.from(breadcrumbItems).map(a => Utils.cleanText(a.textContent)).filter(Boolean).join(' > ');
      }
      return null;
    }
  }

  // ============================================
  // Platform Extractors Map
  // ============================================
  const PlatformExtractors = {
    amazon: AmazonExtractor,
    aliexpress: AliExpressExtractor,
    temu: TemuExtractor,
    ebay: EbayExtractor,
    // Other platforms use UniversalExtractor with JSON-LD/Meta fallback
  };

  // ============================================
  // UI Injection (Enhanced)
  // ============================================
  class ShopOptiUI {
    constructor(platform) {
      this.platform = platform;
      this.container = null;
      this.currentProduct = null;
    }

    inject() {
      if (document.querySelector('#shopopti-container')) return;

      this.container = document.createElement('div');
      this.container.id = 'shopopti-container';
      this.container.innerHTML = this.getTemplate();
      document.body.appendChild(this.container);

      this.injectStyles();
      this.bindEvents();
    }

    injectStyles() {
      if (document.querySelector('#shopopti-styles')) return;
      
      const style = document.createElement('style');
      style.id = 'shopopti-styles';
      style.textContent = `
        #shopopti-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          --shopopti-primary: #6366f1;
          --shopopti-primary-dark: #4f46e5;
        }
        .shopopti-fab {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 56px;
          height: 56px;
          border-radius: 28px;
          background: var(--shopopti-primary);
          color: white;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
          z-index: 2147483647;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .shopopti-fab:hover { transform: scale(1.1); background: var(--shopopti-primary-dark); }
        .shopopti-fab svg { width: 24px; height: 24px; }
        .shopopti-widget {
          position: fixed;
          bottom: 90px;
          right: 20px;
          width: 320px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
          z-index: 2147483646;
          display: none;
          overflow: hidden;
        }
        .shopopti-widget--open { display: block; animation: shopopti-slideUp 0.3s ease; }
        @keyframes shopopti-slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .shopopti-header {
          background: var(--shopopti-primary);
          color: white;
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .shopopti-logo { font-weight: 700; font-size: 16px; }
        .shopopti-close { background: none; border: none; color: white; font-size: 24px; cursor: pointer; }
        .shopopti-body { padding: 16px; }
        .shopopti-status { text-align: center; padding: 20px; color: #6b7280; }
        .shopopti-spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 2px solid #e5e7eb;
          border-top-color: var(--shopopti-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 8px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .shopopti-product { display: flex; gap: 12px; margin-bottom: 16px; }
        .shopopti-product-image { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; }
        .shopopti-product-info { flex: 1; }
        .shopopti-product-title { font-weight: 600; font-size: 14px; color: #1f2937; margin-bottom: 4px; line-height: 1.3; }
        .shopopti-product-price { font-size: 18px; font-weight: 700; color: var(--shopopti-primary); }
        .shopopti-quality { margin-bottom: 12px; }
        .shopopti-quality-bar { height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
        .shopopti-quality-fill { height: 100%; border-radius: 4px; transition: width 0.3s ease; }
        .shopopti-quality-text { font-size: 12px; color: #6b7280; margin-top: 4px; }
        .shopopti-actions { display: flex; gap: 8px; }
        .shopopti-btn {
          flex: 1;
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }
        .shopopti-btn-primary { background: var(--shopopti-primary); color: white; }
        .shopopti-btn-primary:hover { background: var(--shopopti-primary-dark); }
        .shopopti-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .shopopti-btn-secondary { background: #f3f4f6; color: #374151; }
        .shopopti-btn-secondary:hover { background: #e5e7eb; }
      `;
      document.head.appendChild(style);
    }

    getTemplate() {
      return `
        <div class="shopopti-widget" id="shopopti-widget">
          <div class="shopopti-header">
            <span class="shopopti-logo">ShopOpti+ Pro</span>
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
            <div class="shopopti-quality" id="shopopti-quality" style="display:none;">
              <div class="shopopti-quality-bar">
                <div class="shopopti-quality-fill" id="shopopti-quality-fill"></div>
              </div>
              <div class="shopopti-quality-text" id="shopopti-quality-text"></div>
            </div>
            <div class="shopopti-actions">
              <button class="shopopti-btn shopopti-btn-primary" id="shopopti-import">
                Importer
              </button>
              <button class="shopopti-btn shopopti-btn-secondary" id="shopopti-preview">
                Détails
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
      });

      closeBtn?.addEventListener('click', () => {
        widget?.classList.remove('shopopti-widget--open');
      });

      importBtn?.addEventListener('click', () => this.handleImport());
      previewBtn?.addEventListener('click', () => this.handlePreview());
    }

    updateWithProduct(product) {
      const status = document.getElementById('shopopti-status');
      const productDiv = document.getElementById('shopopti-product');
      const qualityDiv = document.getElementById('shopopti-quality');
      const image = document.getElementById('shopopti-image');
      const title = document.getElementById('shopopti-title');
      const price = document.getElementById('shopopti-price');
      const qualityFill = document.getElementById('shopopti-quality-fill');
      const qualityText = document.getElementById('shopopti-quality-text');

      if (!product) {
        if (status) status.textContent = 'Produit non détecté';
        return;
      }

      if (status) status.style.display = 'none';
      if (productDiv) productDiv.style.display = 'flex';
      if (qualityDiv) qualityDiv.style.display = 'block';
      
      if (image && product.images?.[0]) image.src = product.images[0];
      if (title) title.textContent = product.title?.substring(0, 60) + (product.title?.length > 60 ? '...' : '');
      if (price) price.textContent = `${product.price?.toFixed(2) || '0.00'} €`;
      
      // Quality score display
      const score = product.quality_score || 0;
      if (qualityFill) {
        qualityFill.style.width = `${score}%`;
        qualityFill.style.background = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
      }
      if (qualityText) {
        const label = score >= 70 ? 'Excellent' : score >= 40 ? 'Bon' : 'Incomplet';
        qualityText.textContent = `Qualité: ${score}% - ${label} (${product.images?.length || 0} images, ${product.variants?.length || 0} variantes)`;
      }

      this.currentProduct = product;
    }

    async handleImport() {
      if (!this.currentProduct) return;

      const importBtn = document.getElementById('shopopti-import');
      if (importBtn) {
        importBtn.disabled = true;
        importBtn.textContent = 'Import...';
      }

      const result = await Utils.sendToBackground('import_product', this.currentProduct);

      if (importBtn) {
        importBtn.disabled = false;
        if (result.success) {
          importBtn.textContent = 'Importé ✓';
          importBtn.style.background = '#22c55e';
          setTimeout(() => {
            importBtn.textContent = 'Importer';
            importBtn.style.background = '';
          }, 3000);
        } else {
          importBtn.textContent = 'Erreur ✗';
          importBtn.style.background = '#ef4444';
          setTimeout(() => {
            importBtn.textContent = 'Réessayer';
            importBtn.style.background = '';
          }, 3000);
        }
      }
    }

    handlePreview() {
      if (!this.currentProduct) return;
      // Send to background for detailed preview in popup
      Utils.sendToBackground('preview_product', this.currentProduct);
    }
  }

  // ============================================
  // Main Initialization
  // ============================================
  async function init() {
    const platformInfo = Utils.detectPlatform();
    
    if (!platformInfo) {
      console.log('ShopOpti+ v' + LOADER_VERSION + ': Platform not supported');
      return;
    }

    console.log(`ShopOpti+ v${LOADER_VERSION}: Detected ${platformInfo.platform}`, platformInfo);

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
          
          console.log('ShopOpti+ Product extracted:', {
            title: product.title?.substring(0, 50),
            price: product.price,
            images: product.images?.length,
            variants: product.variants?.length,
            quality: product.quality_score
          });
        }
      } catch (error) {
        console.error('ShopOpti+ extraction error:', error);
      }
    }

    // Listen for extraction requests from background
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'extract_product') {
          const ExtractorClass = PlatformExtractors[platformInfo.platform] || UniversalExtractor;
          const extractor = new ExtractorClass(platformInfo.platform);
          
          extractor.extract().then(product => {
            if (product) {
              product.external_id = platformInfo.productId;
            }
            sendResponse({ success: !!product, product });
          }).catch(error => {
            sendResponse({ success: false, error: error.message });
          });
          
          return true;
        }
      });
    }
  }

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
