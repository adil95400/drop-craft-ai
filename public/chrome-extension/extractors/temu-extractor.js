/**
 * ShopOpti+ Temu Extractor v5.7.0
 * High-fidelity extraction for Temu product pages
 * Extends BaseExtractor - Extracts: Images, Variants, Videos, Reviews, Specifications
 */

(function() {
  'use strict';

  if (window.__shopoptiTemuExtractorLoaded) return;
  window.__shopoptiTemuExtractorLoaded = true;

  const BaseExtractor = window.ShopOptiBaseExtractor;

  class TemuExtractor extends (BaseExtractor || Object) {
    constructor() {
      if (BaseExtractor) super();
      this.platform = 'temu';
      this.version = '5.7.0';
      this.productId = this.extractProductId();
      this.pageData = null;
      this.interceptedData = {};
      this.setupNetworkInterception();
    }

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
             url.includes('goods') || 
             url.includes('product') ||
             url.includes('review');
    }

    processInterceptedData(url, data) {
      if (url.includes('review')) {
        this.interceptedData.reviews = data;
      } else if (url.includes('goods') || url.includes('product')) {
        this.interceptedData.product = data;
        // Try to extract structured data
        if (data.data || data.result) {
          this.pageData = data.data || data.result;
        }
      }
    }

    extractProductId() {
      const patterns = [
        /goods\.html\?goods_id=(\d+)/,
        /-g-(\d+)\.html/,
        /goodsId[=:](\d+)/,
        /\/(\d{15,})\.html/,
        /goods_id=(\d+)/
      ];

      for (const pattern of patterns) {
        const match = window.location.href.match(pattern);
        if (match) return match[1];
      }

      return null;
    }

    getPlatform() {
      return 'temu';
    }

    getExternalId() {
      return this.productId;
    }

    getPageData() {
      if (this.pageData) return this.pageData;

      const dataKeys = ['__INITIAL_STATE__', 'rawData', 'initData', 'pageData', '__NEXT_DATA__'];

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
        
        const stateMatch = content.match(/__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});/);
        if (stateMatch) {
          try {
            this.pageData = JSON.parse(stateMatch[1]);
            return this.pageData;
          } catch (e) {}
        }

        const rawMatch = content.match(/window\.rawData\s*=\s*(\{[\s\S]*?\});/);
        if (rawMatch) {
          try {
            this.pageData = JSON.parse(rawMatch[1]);
            return this.pageData;
          } catch (e) {}
        }
      }

      return null;
    }

    async extractComplete() {
      console.log('[ShopOpti+ Temu v5.7.0] Starting extraction, Product ID:', this.productId);

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
        platform: 'temu',
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

      console.log('[ShopOpti+ Temu v5.7.0] Extraction complete:', {
        title: productData.title?.substring(0, 50),
        images: images.length,
        variants: variants.length
      });

      return productData;
    }

    async extractBasicInfo() {
      // From page data
      if (this.pageData?.goods) {
        const goods = this.pageData.goods;
        return {
          title: goods.goodsName || goods.title || this.extractTitleFromDOM(),
          brand: goods.brandName || goods.storeName || 'Temu',
          description: goods.desc || goods.description || this.extractDescriptionFromDOM(),
          sku: goods.goodsSn || this.productId
        };
      }

      return {
        title: this.extractTitleFromDOM(),
        brand: this.extractBrandFromDOM(),
        description: this.extractDescriptionFromDOM(),
        sku: this.productId
      };
    }

    extractTitleFromDOM() {
      const selectors = [
        'h1[class*="title"]',
        '.goods-title',
        '.product-title',
        '[data-testid="goods-title"]',
        '.goods-detail-title',
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
        '.brand-name'
      ];

      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el?.textContent?.trim()) {
          return el.textContent.trim();
        }
      }

      return 'Temu';
    }

    extractDescriptionFromDOM() {
      const selectors = [
        '.product-description',
        '[class*="description"]',
        '.goods-desc'
      ];

      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el?.textContent?.trim()) {
          return el.textContent.trim().substring(0, 5000);
        }
      }

      return '';
    }

    async extractPricing() {
      let price = 0;
      let originalPrice = null;
      let currency = 'EUR';

      // From page data
      if (this.pageData?.goods?.minPrice) {
        price = parseFloat(this.pageData.goods.minPrice) / 100;
        if (this.pageData.goods.originPrice) {
          originalPrice = parseFloat(this.pageData.goods.originPrice) / 100;
        }
      }

      // DOM fallback
      if (price === 0) {
        const priceSelectors = [
          '[class*="price-current"]',
          '.goods-price',
          '[data-testid="price"]',
          '[class*="salePrice"]',
          '.price-wrapper span'
        ];

        for (const sel of priceSelectors) {
          const el = document.querySelector(sel);
          if (el?.textContent) {
            price = this.parsePrice(el.textContent);
            if (price > 0) break;
          }
        }

        // Original price
        const originalSelectors = ['[class*="originalPrice"]', '[class*="origin-price"]', 'del', 's'];
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
      const pageText = document.body.innerText.substring(0, 3000);
      if (pageText.includes('€')) currency = 'EUR';
      else if (pageText.includes('$')) currency = 'USD';
      else if (pageText.includes('£')) currency = 'GBP';

      return { price, originalPrice, currency };
    }

    parsePrice(priceStr) {
      if (!priceStr) return 0;
      const clean = priceStr.replace(/[€$£¥\s]/g, '').replace(',', '.').trim();
      const match = clean.match(/[\d.]+/);
      return match ? parseFloat(match[0]) : 0;
    }

    async extractImages() {
      const images = new Set();

      // From page data
      if (this.pageData?.goods?.gallery) {
        this.pageData.goods.gallery.forEach(img => {
          const url = typeof img === 'string' ? img : img.url || img.src;
          if (url) images.add(this.normalizeImageUrl(url));
        });
      }

      // From DOM
      const imageSelectors = [
        '[class*="goods-gallery"] img',
        '[class*="image-slider"] img',
        '.product-gallery img',
        '[class*="swiper"] img',
        '[data-testid="gallery-image"] img',
        '.goods-detail-gallery img'
      ];

      for (const sel of imageSelectors) {
        document.querySelectorAll(sel).forEach(img => {
          const src = img.dataset?.src || img.src;
          if (src && (src.includes('temu') || src.includes('kwcdn'))) {
            images.add(this.normalizeImageUrl(src));
          }
        });
      }

      // Thumbnail images
      document.querySelectorAll('[class*="thumbnail"] img, [class*="preview"] img').forEach(img => {
        const src = img.dataset?.src || img.src;
        if (src) {
          images.add(this.normalizeImageUrl(src));
        }
      });

      // From script data
      try {
        const scripts = document.querySelectorAll('script:not([src])');
        for (const script of scripts) {
          const content = script.textContent;
          const urlMatches = content.matchAll(/["'](https?:\/\/[^"']*(?:temu|kwcdn)[^"']*\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi);
          for (const match of urlMatches) {
            if (!match[1].includes('icon') && !match[1].includes('logo')) {
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

      // Get high-res version
      src = src.replace(/_\d+x\d+\./, '.');
      src = src.replace(/thumbnail_\d+/, 'thumbnail_800');
      src = src.split('?')[0];

      return src;
    }

    async extractVideos() {
      const videos = [];

      // From page data
      if (this.pageData?.goods?.video) {
        videos.push({
          url: this.pageData.goods.video.url || this.pageData.goods.video,
          type: 'mp4',
          platform: 'temu'
        });
      }

      // From video elements
      document.querySelectorAll('video source, video').forEach(el => {
        const src = el.src || el.querySelector('source')?.src;
        if (src && !videos.some(v => v.url === src)) {
          videos.push({ url: src, type: 'mp4', platform: 'temu' });
        }
      });

      // From script data
      try {
        const scripts = document.querySelectorAll('script:not([src])');
        for (const script of scripts) {
          const content = script.textContent;
          const videoMatches = content.matchAll(/["']?(videoUrl|video_url|mp4Url)["']?\s*:\s*["']([^"']+\.mp4[^"']*)["']/gi);
          for (const match of videoMatches) {
            const url = match[2].replace(/\\u002F/g, '/').replace(/\\/g, '');
            if (!videos.some(v => v.url === url)) {
              videos.push({ url, type: 'mp4', platform: 'temu' });
            }
          }
        }
      } catch (e) {}

      return videos.slice(0, 10);
    }

    async extractVariants() {
      const variants = [];

      // From page data
      if (this.pageData?.goods?.skcList) {
        this.pageData.goods.skcList.forEach(skc => {
          variants.push({
            id: skc.skcId?.toString(),
            title: skc.skcName || skc.specName,
            price: skc.price ? parseFloat(skc.price) / 100 : null,
            image: skc.image ? this.normalizeImageUrl(skc.image) : null,
            available: skc.stock > 0
          });
        });
      }

      // DOM fallback
      if (variants.length === 0) {
        document.querySelectorAll('[class*="sku-item"], [class*="spec-item"], [class*="variant"]').forEach(item => {
          const img = item.querySelector('img');
          const title = item.getAttribute('title') || item.textContent?.trim();

          if (title) {
            variants.push({
              id: `var_${variants.length}`,
              title: title,
              image: img?.src ? this.normalizeImageUrl(img.src) : null,
              available: !item.className.includes('disabled') && !item.className.includes('sold-out')
            });
          }
        });
      }

      return variants;
    }

    async extractReviews() {
      const reviews = [];

      // Rating summary
      const ratingEl = document.querySelector('[class*="rating-score"], [class*="star-rating"]');
      const countEl = document.querySelector('[class*="review-count"], [class*="sold-count"]');
      
      if (ratingEl || countEl) {
        reviews.push({
          type: 'summary',
          averageRating: parseFloat(ratingEl?.textContent?.match(/[\d.]+/)?.[0]) || 0,
          totalCount: parseInt(countEl?.textContent?.match(/[\d,]+/)?.[0]?.replace(',', '')) || 0
        });
      }

      // Individual reviews
      document.querySelectorAll('[class*="review-item"], [class*="comment-item"]').forEach(reviewEl => {
        const review = {
          author: reviewEl.querySelector('[class*="user-name"], [class*="reviewer"]')?.textContent?.trim() || 'Anonymous',
          rating: this.extractReviewRating(reviewEl),
          content: reviewEl.querySelector('[class*="review-content"], [class*="comment-content"]')?.textContent?.trim() || '',
          date: reviewEl.querySelector('[class*="review-date"], [class*="time"]')?.textContent?.trim() || '',
          images: []
        };

        // Review images
        reviewEl.querySelectorAll('img').forEach(img => {
          if (img.src && (img.src.includes('temu') || img.src.includes('kwcdn'))) {
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
      const starEl = el.querySelector('[class*="star"]');
      if (starEl) {
        const filledStars = starEl.querySelectorAll('[class*="filled"], [class*="active"]').length;
        if (filledStars > 0) return filledStars;
        
        const width = starEl.style.width || starEl.getAttribute('style');
        const widthMatch = width?.match(/(\d+)%/);
        if (widthMatch) return Math.round(parseInt(widthMatch[1]) / 20);
      }
      return 5;
    }

    async extractSpecifications() {
      const specs = {};

      // From page data
      if (this.pageData?.goods?.attributes) {
        this.pageData.goods.attributes.forEach(attr => {
          specs[attr.name || attr.key] = attr.value;
        });
      }

      // DOM fallback
      document.querySelectorAll('[class*="specification"] li, [class*="attribute"] li, [class*="detail-info"] li').forEach(el => {
        const text = el.textContent?.trim();
        const colonIndex = text?.indexOf(':');
        if (colonIndex > 0) {
          specs[text.substring(0, colonIndex).trim()] = text.substring(colonIndex + 1).trim();
        }
      });

      return specs;
    }
  }

  // Register with ExtractorRegistry
  if (window.ExtractorRegistry) {
    window.ExtractorRegistry.register('temu', TemuExtractor);
  }

  window.TemuExtractor = TemuExtractor;
  window.ShopOptiTemuExtractor = TemuExtractor;
  console.log('[ShopOpti+] Temu Extractor v5.7.0 loaded');
})();
