/**
 * ShopOpti+ AliExpress Extractor v5.7.0
 * High-fidelity extraction for AliExpress product pages
 * Extends BaseExtractor - Extracts: Images (800x800), Variants, Videos, Reviews, Specifications
 */

(function() {
  'use strict';

  if (window.__shopoptiAliExpressExtractorLoaded) return;
  window.__shopoptiAliExpressExtractorLoaded = true;

  const BaseExtractor = window.ShopOptiBaseExtractor;

  class AliExpressExtractor extends (BaseExtractor || Object) {
    constructor() {
      if (BaseExtractor) super();
      this.platform = 'aliexpress';
      this.version = '5.7.0';
      this.productId = this.extractProductId();
      this.pageData = null;
      this.interceptedData = {};
      this.setupNetworkInterception();
    }

    /**
     * Setup network interception for SPA data capture
     */
    setupNetworkInterception() {
      if (this._interceptorActive) return;
      this._interceptorActive = true;

      const self = this;
      const originalFetch = window.fetch;
      
      window.fetch = async function(...args) {
        const response = await originalFetch.apply(this, args);
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
        
        if (url && self.isRelevantRequest(url)) {
          try {
            const clone = response.clone();
            const data = await clone.json();
            self.processInterceptedData(url, data);
          } catch (e) {}
        }
        
        return response;
      };
    }

    isRelevantRequest(url) {
      if (!url) return false;
      return url.includes('/api/') || 
             url.includes('product') || 
             url.includes('sku') ||
             url.includes('review') ||
             url.includes('feedback');
    }

    processInterceptedData(url, data) {
      if (url.includes('review') || url.includes('feedback')) {
        this.interceptedData.reviews = data;
      } else if (url.includes('sku')) {
        this.interceptedData.skus = data;
      } else {
        this.interceptedData.product = data;
      }
    }

    /**
     * Extract product ID from URL
     */
    extractProductId() {
      const patterns = [
        /\/item\/(\d+)\.html/,
        /\/i\/(\d+)\.html/,
        /\/_p\/(\d+)/,
        /productId=(\d+)/,
        /\/(\d{10,})\.html/
      ];

      for (const pattern of patterns) {
        const match = window.location.href.match(pattern);
        if (match) return match[1];
      }

      return null;
    }

    getPlatform() {
      return 'aliexpress';
    }

    getExternalId() {
      return this.productId;
    }

    /**
     * Try to get page data from window objects
     */
    getPageData() {
      if (this.pageData) return this.pageData;

      const dataKeys = [
        'runParams', 'detailData', 'pageData', 
        '__INITIAL_STATE__', 'productData', 'window.runParams'
      ];

      for (const key of dataKeys) {
        if (window[key]) {
          this.pageData = window[key];
          return this.pageData;
        }
      }

      // Parse from script tags
      const scripts = document.querySelectorAll('script:not([src])');
      for (const script of scripts) {
        const content = script.textContent;
        
        // runParams pattern
        const runParamsMatch = content.match(/runParams\s*=\s*(\{[\s\S]*?\});/);
        if (runParamsMatch) {
          try {
            this.pageData = JSON.parse(runParamsMatch[1]);
            return this.pageData;
          } catch (e) {}
        }

        // data pattern
        const dataMatch = content.match(/data\s*:\s*(\{[\s\S]*?"priceModule"[\s\S]*?\})\s*[,}]/);
        if (dataMatch) {
          try {
            this.pageData = JSON.parse(dataMatch[1]);
            return this.pageData;
          } catch (e) {}
        }

        // window.__INIT_DATA__ pattern
        const initMatch = content.match(/__INIT_DATA__\s*=\s*(\{[\s\S]*?\});/);
        if (initMatch) {
          try {
            this.pageData = JSON.parse(initMatch[1]);
            return this.pageData;
          } catch (e) {}
        }
      }

      return null;
    }

    /**
     * Main extraction method
     */
    async extractComplete() {
      console.log('[ShopOpti+ AliExpress v5.7.0] Starting extraction, Product ID:', this.productId);

      this.getPageData();

      const [basicInfo, pricing, images, videos, variants, reviews, specifications] = await Promise.all([
        this.extractBasicInfo(),
        this.extractPricing(),
        this.extractImages(),
        this.extractVideos(),
        this.extractVariants(),
        this.extractReviews(),
        this.extractSpecifications()
      ]);

      const productData = {
        external_id: this.productId,
        url: window.location.href,
        platform: 'aliexpress',
        version: this.version,
        extractedAt: new Date().toISOString(),
        ...basicInfo,
        ...pricing,
        images,
        videos,
        variants,
        reviews,
        specifications
      };

      console.log('[ShopOpti+ AliExpress v5.7.0] Extraction complete:', {
        title: productData.title?.substring(0, 50),
        images: images.length,
        videos: videos.length,
        variants: variants.length
      });

      return productData;
    }

    /**
     * Extract basic product info
     */
    async extractBasicInfo() {
      // From page data
      if (this.pageData) {
        const titleModule = this.pageData.titleModule || this.pageData.pageModule || {};
        const storeModule = this.pageData.storeModule || {};

        return {
          title: titleModule.subject || titleModule.title || this.extractTitleFromDOM(),
          brand: storeModule.storeName || storeModule.companyId || '',
          description: this.extractDescription(),
          sku: this.productId
        };
      }

      return {
        title: this.extractTitleFromDOM(),
        brand: this.extractBrandFromDOM(),
        description: this.extractDescription(),
        sku: this.productId
      };
    }

    extractTitleFromDOM() {
      const selectors = [
        'h1[data-pl="product-title"]',
        '.product-title',
        '.product-title-text',
        'h1[class*="title"]',
        '.title--wrap--UUHae_g h1',
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

    extractBrandFromDOM() {
      const selectors = [
        '.store-name',
        '[class*="store-name"]',
        '.shop-name a',
        '.store-header-name',
        '.store--info--oVYPqIY'
      ];

      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el?.textContent?.trim()) {
          return el.textContent.trim();
        }
      }

      return '';
    }

    extractDescription() {
      const selectors = [
        '.product-description',
        '[class*="description"]',
        '#product-description',
        '.detail-desc',
        '.description--wrap--SHjiB_I'
      ];

      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el?.textContent?.trim()) {
          return el.textContent.trim().substring(0, 5000);
        }
      }

      return '';
    }

    /**
     * Extract pricing
     */
    async extractPricing() {
      let price = 0;
      let originalPrice = null;
      let currency = 'USD';

      // From page data
      if (this.pageData?.priceModule) {
        const priceModule = this.pageData.priceModule;
        price = parseFloat(priceModule.minAmount?.value || priceModule.activityAmount?.value || priceModule.formattedActivityPrice?.replace(/[^0-9.]/g, '') || 0);
        originalPrice = parseFloat(priceModule.maxAmount?.value || priceModule.originalAmount?.value || 0);
        currency = priceModule.minAmount?.currency || priceModule.currencyCode || 'USD';
        
        if (originalPrice <= price) originalPrice = null;
      }

      // DOM fallback
      if (price === 0) {
        const priceSelectors = [
          '.product-price-current',
          '[class*="price-current"]',
          '.uniform-banner-box-price',
          '[class*="product-price"] [class*="current"]',
          '.es--wrap--erdmPRe',
          '.price--current--I_0sLrN'
        ];

        for (const sel of priceSelectors) {
          const el = document.querySelector(sel);
          if (el?.textContent) {
            price = this.parsePrice(el.textContent);
            if (price > 0) break;
          }
        }

        // Original price
        const originalSelectors = ['.product-price-origin', '[class*="price-original"]', '[class*="del"]', '.price--original--F_xXPgr'];
        for (const sel of originalSelectors) {
          const el = document.querySelector(sel);
          if (el?.textContent) {
            const op = this.parsePrice(el.textContent);
            if (op > price) {
              originalPrice = op;
              break;
            }
          }
        }
      }

      // Currency detection
      const currencyEl = document.querySelector('[class*="currency"]');
      if (currencyEl?.textContent) {
        if (currencyEl.textContent.includes('€')) currency = 'EUR';
        else if (currencyEl.textContent.includes('$')) currency = 'USD';
        else if (currencyEl.textContent.includes('£')) currency = 'GBP';
      }

      return { price, originalPrice, currency };
    }

    parsePrice(priceStr) {
      if (!priceStr) return 0;
      const clean = priceStr.replace(/[€$£¥\s]/g, '').replace(',', '.').trim();
      const match = clean.match(/[\d.]+/);
      return match ? parseFloat(match[0]) : 0;
    }

    /**
     * Extract HIGH-RESOLUTION images
     */
    async extractImages() {
      const images = new Set();

      // Strategy 1: From page data
      if (this.pageData?.imageModule?.imagePathList) {
        this.pageData.imageModule.imagePathList.forEach(img => {
          images.add(this.normalizeImageUrl(img));
        });
      }

      // Strategy 2: From slider/gallery
      const sliderSelectors = [
        '[class*="slider"] img',
        '.images-view img',
        '[class*="gallery"] img',
        '.image-view-magnifier img',
        '.slider--img--D7MJNPZ',
        '.pdp-info-right-image img',
        '.magnifier--image--RHvmpe0'
      ];

      for (const sel of sliderSelectors) {
        document.querySelectorAll(sel).forEach(img => {
          const src = img.dataset?.src || img.src;
          if (src && src.includes('alicdn')) {
            images.add(this.normalizeImageUrl(src));
          }
        });
      }

      // Strategy 3: Thumbnail images
      document.querySelectorAll('.images-view-item img, [class*="thumbnail"] img').forEach(img => {
        const src = img.dataset?.src || img.src;
        if (src && src.includes('alicdn')) {
          images.add(this.normalizeImageUrl(src));
        }
      });

      // Strategy 4: From script data
      try {
        const scripts = document.querySelectorAll('script:not([src])');
        for (const script of scripts) {
          const content = script.textContent;
          
          const pathListMatch = content.match(/imagePathList["']?\s*:\s*\[([^\]]+)\]/);
          if (pathListMatch) {
            const urls = pathListMatch[1].matchAll(/["']([^"']+alicdn[^"']+)["']/g);
            for (const match of urls) {
              images.add(this.normalizeImageUrl(match[1]));
            }
          }
        }
      } catch (e) {}

      return Array.from(images).filter(url => url && url.includes('http')).slice(0, 30);
    }

    normalizeImageUrl(src) {
      if (!src) return null;

      if (src.startsWith('//')) src = 'https:' + src;

      // Convert to 800x800 high-res
      src = src.replace(/_\d+x\d+\w*\./, '_800x800.');
      src = src.replace(/\.\d+x\d+\./, '.800x800.');
      src = src.replace(/_[0-9]+x[0-9]+[a-z]*\.jpg/i, '.jpg');
      src = src.replace(/\.jpg_\d+x\d+\.jpg/i, '.jpg');
      src = src.split('?')[0];

      return src;
    }

    /**
     * Extract product videos
     */
    async extractVideos() {
      const videos = [];

      // From page data
      if (this.pageData?.imageModule?.videoUid) {
        videos.push({
          url: `https://cloud.video.taobao.com/play/u/${this.pageData.imageModule.videoUid}/p/1/e/6/t/1/${this.productId}.mp4`,
          type: 'mp4',
          platform: 'aliexpress'
        });
      }

      // From video elements
      document.querySelectorAll('video source, video').forEach(el => {
        const src = el.src || el.querySelector('source')?.src;
        if (src && !videos.some(v => v.url === src)) {
          videos.push({ url: src, type: 'mp4', platform: 'aliexpress' });
        }
      });

      // From script data
      try {
        const scripts = document.querySelectorAll('script:not([src])');
        for (const script of scripts) {
          const content = script.textContent;
          
          const videoMatches = content.matchAll(/["']?(videoUrl|video_url)["']?\s*:\s*["']([^"']+\.mp4[^"']*)["']/gi);
          for (const match of videoMatches) {
            const url = match[2].replace(/\\u002F/g, '/').replace(/\\/g, '');
            if (!videos.some(v => v.url === url)) {
              videos.push({ url, type: 'mp4', platform: 'aliexpress' });
            }
          }
        }
      } catch (e) {}

      return videos.slice(0, 10);
    }

    /**
     * Extract product variants (color, size, etc.)
     */
    async extractVariants() {
      const variants = [];

      // From page data
      if (this.pageData?.skuModule?.productSKUPropertyList) {
        this.pageData.skuModule.productSKUPropertyList.forEach(property => {
          property.skuPropertyValues?.forEach(value => {
            variants.push({
              id: value.propertyValueId?.toString(),
              title: value.propertyValueDisplayName || value.skuPropertyImagePath,
              type: property.skuPropertyName,
              image: value.skuPropertyImagePath ? this.normalizeImageUrl(value.skuPropertyImagePath) : null,
              available: true
            });
          });
        });
      }

      // DOM fallback
      if (variants.length === 0) {
        document.querySelectorAll('[class*="sku-property"] [class*="item"], .sku-item, .sku-property-item').forEach(item => {
          const img = item.querySelector('img');
          const title = item.getAttribute('title') || item.textContent?.trim();
          const id = item.dataset?.skuId || item.dataset?.value;

          if (title) {
            variants.push({
              id: id || `var_${variants.length}`,
              title: title,
              image: img?.src ? this.normalizeImageUrl(img.src) : null,
              available: !item.className.includes('disabled')
            });
          }
        });
      }

      return variants;
    }

    /**
     * Extract product reviews
     */
    async extractReviews() {
      const reviews = [];

      // Rating summary from page data
      if (this.pageData?.feedbackModule) {
        const feedback = this.pageData.feedbackModule;
        reviews.push({
          type: 'summary',
          averageRating: parseFloat(feedback.evarageStar || feedback.averageStar || 0),
          totalCount: parseInt(feedback.totalValidNum || feedback.reviewCount || 0),
          positiveRate: feedback.positiveRate
        });
      }

      // Use intercepted data if available
      if (this.interceptedData.reviews) {
        // Process intercepted reviews
        const feedbackData = this.interceptedData.reviews;
        if (feedbackData.data?.evaViewList) {
          feedbackData.data.evaViewList.forEach(eva => {
            reviews.push({
              author: eva.buyerName || 'Anonymous',
              rating: eva.buyerEval || 5,
              content: eva.buyerFeedback || '',
              date: eva.evalDate || '',
              country: eva.buyerCountry || '',
              images: (eva.images || []).map(img => this.normalizeImageUrl(img))
            });
          });
        }
      }

      // DOM extraction for individual reviews
      document.querySelectorAll('.feedback-item, [class*="review-item"]').forEach(reviewEl => {
        const review = {
          author: reviewEl.querySelector('.user-name, [class*="reviewer"]')?.textContent?.trim() || 'Anonymous',
          rating: this.extractReviewRating(reviewEl),
          content: reviewEl.querySelector('.buyer-feedback, [class*="content"]')?.textContent?.trim() || '',
          date: reviewEl.querySelector('.r-time, [class*="date"]')?.textContent?.trim() || '',
          country: reviewEl.querySelector('.user-country, [class*="country"]')?.textContent?.trim() || '',
          images: []
        };

        // Review images
        reviewEl.querySelectorAll('img[src*="alicdn"]').forEach(img => {
          if (img.src && !img.src.includes('avatar')) {
            review.images.push(this.normalizeImageUrl(img.src));
          }
        });

        if (review.content) {
          reviews.push(review);
        }
      });

      return reviews.slice(0, 50);
    }

    extractReviewRating(el) {
      const starEl = el.querySelector('[class*="star"], .star-view');
      if (starEl) {
        const width = starEl.style.width || starEl.getAttribute('style');
        const widthMatch = width?.match(/(\d+)%/);
        if (widthMatch) {
          return Math.round(parseInt(widthMatch[1]) / 20);
        }
      }
      return 5;
    }

    /**
     * Extract product specifications
     */
    async extractSpecifications() {
      const specs = {};

      // From page data
      if (this.pageData?.specsModule?.props) {
        this.pageData.specsModule.props.forEach(prop => {
          specs[prop.attrName] = prop.attrValue;
        });
      }

      // DOM fallback
      document.querySelectorAll('[class*="specification"] li, [class*="property-item"]').forEach(el => {
        const keyEl = el.querySelector('[class*="name"], [class*="key"]');
        const valueEl = el.querySelector('[class*="value"]');
        if (keyEl && valueEl) {
          specs[keyEl.textContent.trim()] = valueEl.textContent.trim();
        } else {
          const text = el.textContent?.trim();
          const colonIndex = text?.indexOf(':');
          if (colonIndex > 0) {
            specs[text.substring(0, colonIndex).trim()] = text.substring(colonIndex + 1).trim();
          }
        }
      });

      return specs;
    }
  }

  // Register with ExtractorRegistry
  if (window.ExtractorRegistry) {
    window.ExtractorRegistry.register('aliexpress', AliExpressExtractor);
  }

  window.AliExpressExtractor = AliExpressExtractor;
  window.ShopOptiAliExpressExtractor = AliExpressExtractor;
  console.log('[ShopOpti+] AliExpress Extractor v5.7.0 loaded');
})();
