/**
 * ShopOpti+ Etsy Extractor v5.7.0
 * High-fidelity extraction for Etsy product pages
 * Extends BaseExtractor - Handmade/Vintage Market - Extracts: Images, Variants, Reviews
 */

(function() {
  'use strict';

  if (window.__shopoptiEtsyExtractorLoaded) return;
  window.__shopoptiEtsyExtractorLoaded = true;

  const BaseExtractor = window.ShopOptiBaseExtractor;

  class EtsyExtractor extends (BaseExtractor || Object) {
    constructor() {
      if (BaseExtractor) super();
      this.platform = 'etsy';
      this.version = '5.7.0';
      this.listingId = this.extractListingId();
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
             url.includes('listing') || 
             url.includes('review');
    }

    processInterceptedData(url, data) {
      if (url.includes('review')) {
        this.interceptedData.reviews = data;
      } else {
        this.interceptedData.product = data;
      }
    }

    extractListingId() {
      const match = window.location.href.match(/\/listing\/(\d+)/i);
      return match ? match[1] : null;
    }

    getPlatform() {
      return 'etsy';
    }

    getExternalId() {
      return this.listingId;
    }

    async extractComplete() {
      console.log('[ShopOpti+ Etsy v5.7.0] Starting extraction, Listing ID:', this.listingId);

      const [basicInfo, pricing, images, variants, reviews, specifications] = await Promise.all([
        this.extractBasicInfo(),
        this.extractPricing(),
        this.extractImages(),
        this.extractVariants(),
        this.extractReviews(),
        this.extractSpecifications()
      ]);

      return {
        external_id: this.listingId,
        url: window.location.href,
        platform: 'etsy',
        version: this.version,
        extractedAt: new Date().toISOString(),
        ...basicInfo,
        ...pricing,
        images,
        videos: await this.extractVideos(),
        variants,
        reviews,
        specifications
      };
    }

    async extractBasicInfo() {
      const jsonLD = this.extractFromJsonLD();
      if (jsonLD.title) return jsonLD;

      const titleEl = document.querySelector('h1[data-listing-page-title], h1.wt-text-body-01, [data-buy-box-listing-title]');
      const shopEl = document.querySelector('[data-shop-name], .wt-text-link-no-underline, [data-shop-info] a');
      const descEl = document.querySelector('[data-product-details-description-text-content], .wt-text-body-01, .wt-content-toggle__body');

      return {
        title: titleEl?.textContent?.trim() || '',
        brand: shopEl?.textContent?.trim() || '',
        description: descEl?.textContent?.trim()?.substring(0, 5000) || '',
        sku: this.listingId
      };
    }

    extractFromJsonLD() {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent);
          const items = Array.isArray(data) ? data : [data];
          for (const item of items) {
            if (item['@type'] === 'Product') {
              return {
                title: item.name || '',
                description: item.description || '',
                brand: typeof item.brand === 'string' ? item.brand : item.brand?.name || '',
                sku: item.sku || ''
              };
            }
          }
        } catch (e) {}
      }
      return {};
    }

    async extractPricing() {
      let price = 0;
      let originalPrice = null;

      // JSON-LD pricing
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent);
          if (data['@type'] === 'Product' && data.offers) {
            const offers = Array.isArray(data.offers) ? data.offers[0] : data.offers;
            price = parseFloat(offers.price) || 0;
            break;
          }
        } catch (e) {}
      }

      // DOM fallback
      if (price === 0) {
        const priceEl = document.querySelector('[data-appears-component-name="price"] p, .wt-text-title-03, [data-buy-box-region="price"]');
        if (priceEl) {
          price = this.parsePrice(priceEl.textContent || '');
        }
      }

      // Original price
      const originalEl = document.querySelector('.wt-text-strikethrough, del, [data-original-price]');
      if (originalEl) {
        const op = this.parsePrice(originalEl.textContent || '');
        if (op > price) originalPrice = op;
      }

      const currency = this.detectCurrency();

      return { price, originalPrice, currency };
    }

    parsePrice(str) {
      if (!str) return 0;
      let clean = str.replace(/[€$£¥,\s]/g, '').trim();
      return parseFloat(clean) || 0;
    }

    detectCurrency() {
      const priceText = document.querySelector('[data-appears-component-name="price"]')?.textContent || '';
      if (priceText.includes('€')) return 'EUR';
      if (priceText.includes('£')) return 'GBP';
      return 'USD';
    }

    async extractImages() {
      const images = new Set();

      // Main carousel images
      document.querySelectorAll('[data-carousel-image] img, .listing-page-image-carousel img, .image-carousel img').forEach(img => {
        const src = img.dataset?.srcDelay || img.dataset?.src || img.src;
        if (src && this.isValidImage(src)) {
          images.add(this.normalizeImageUrl(src));
        }
      });

      // Thumbnails
      document.querySelectorAll('[data-carousel-thumbnail] img, .carousel-thumbnail img, .listing-thumb img').forEach(img => {
        const src = img.dataset?.srcDelay || img.dataset?.src || img.src;
        if (src && this.isValidImage(src)) {
          images.add(this.normalizeImageUrl(src));
        }
      });

      // JSON-LD images
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent);
          if (data['@type'] === 'Product' && data.image) {
            const imgs = Array.isArray(data.image) ? data.image : [data.image];
            imgs.forEach(img => {
              const url = typeof img === 'string' ? img : img.url;
              if (url) images.add(this.normalizeImageUrl(url));
            });
          }
        } catch (e) {}
      }

      return Array.from(images).filter(url => url && url.includes('http')).slice(0, 30);
    }

    normalizeImageUrl(src) {
      if (!src) return null;
      
      // Get full resolution
      src = src.replace(/il_\d+x\d+/, 'il_fullxfull');
      src = src.replace(/_75x75/, '_fullxfull');
      
      return src;
    }

    isValidImage(src) {
      if (!src) return false;
      if (src.includes('icon') || src.includes('logo') || src.includes('avatar')) return false;
      return src.includes('etsystatic') || src.includes('etsy.com');
    }

    async extractVideos() {
      const videos = [];

      document.querySelectorAll('video source, video[src]').forEach(el => {
        const src = el.src || el.querySelector('source')?.src;
        if (src && !videos.some(v => v.url === src)) {
          videos.push({ url: src, type: 'mp4', platform: 'etsy' });
        }
      });

      return videos.slice(0, 5);
    }

    async extractVariants() {
      const variants = [];

      // Variation selects
      document.querySelectorAll('[data-selector="listing-page-variation"] select option').forEach(option => {
        if (option.value && option.value !== '') {
          variants.push({
            id: option.value,
            title: option.textContent?.trim(),
            available: !option.disabled
          });
        }
      });

      // Variation buttons
      document.querySelectorAll('[data-variation-value], .wt-list-inline button, [data-personalization-variation]').forEach(button => {
        const title = button.textContent?.trim() || button.getAttribute('title');
        const value = button.dataset?.variationValue;
        
        if (title && title.length < 50) {
          variants.push({
            id: value || `var_${variants.length}`,
            title: title,
            available: !button.disabled && !button.className.includes('disabled')
          });
        }
      });

      return variants;
    }

    async extractReviews() {
      const reviews = [];

      // Rating summary
      const ratingEl = document.querySelector('[data-rating], [aria-label*="star"], [data-shop-star-rating]');
      const countEl = document.querySelector('[data-reviews-count], .wt-text-caption, [data-reviews]');

      if (ratingEl || countEl) {
        const ratingMatch = ratingEl?.getAttribute('aria-label')?.match(/([\d.]+)/) || 
                           ratingEl?.getAttribute('data-rating')?.match(/([\d.]+)/);
        const countMatch = countEl?.textContent?.match(/(\d+)/);
        
        reviews.push({
          type: 'summary',
          averageRating: parseFloat(ratingMatch?.[1] || 0),
          totalCount: parseInt(countMatch?.[1] || 0)
        });
      }

      // Individual reviews
      document.querySelectorAll('[data-review-region] > div, .review-item, [data-review-id]').forEach(reviewEl => {
        const review = {
          author: reviewEl.querySelector('.wt-text-title-01, .reviewer-name, [data-review-author]')?.textContent?.trim() || 'Anonymous',
          rating: this.extractReviewRating(reviewEl),
          content: reviewEl.querySelector('.wt-content-toggle--truncated, .review-content, [data-review-body]')?.textContent?.trim() || '',
          date: reviewEl.querySelector('.wt-text-caption, .review-date')?.textContent?.trim() || '',
          images: []
        };

        // Review images
        reviewEl.querySelectorAll('img[src*="etsystatic"]').forEach(img => {
          if (!img.src.includes('avatar') && !img.src.includes('icon')) {
            review.images.push(img.src);
          }
        });

        if (review.content) {
          reviews.push(review);
        }
      });

      return reviews.slice(0, 50);
    }

    extractReviewRating(el) {
      const ratingEl = el.querySelector('[aria-label*="star"], [data-stars]');
      if (ratingEl) {
        const ariaLabel = ratingEl.getAttribute('aria-label');
        const match = ariaLabel?.match(/([\d.]+)/);
        if (match) return parseFloat(match[1]);
        
        const dataStars = ratingEl.getAttribute('data-stars');
        if (dataStars) return parseInt(dataStars);
      }
      return 5;
    }

    async extractSpecifications() {
      const specifications = {};

      // Item details section
      document.querySelectorAll('[data-appears-component-name="item-details"] tr, .listing-attributes tr').forEach(row => {
        const cells = row.querySelectorAll('td, th');
        if (cells.length >= 2) {
          const key = cells[0].textContent?.trim();
          const value = cells[1].textContent?.trim();
          if (key && value) {
            specifications[key] = value;
          }
        }
      });

      // Key-value pairs
      document.querySelectorAll('.wt-text-body-01 .wt-display-flex-xs, [data-item-overview] li').forEach(item => {
        const text = item.textContent?.trim();
        const colonIndex = text?.indexOf(':');
        if (colonIndex > 0 && colonIndex < 30) {
          const key = text.substring(0, colonIndex).trim();
          const value = text.substring(colonIndex + 1).trim();
          if (key && value) {
            specifications[key] = value;
          }
        }
      });

      return specifications;
    }
  }

  // Register with ExtractorRegistry
  if (window.ExtractorRegistry) {
    window.ExtractorRegistry.register('etsy', EtsyExtractor);
  }

  window.EtsyExtractor = EtsyExtractor;
  window.ShopOptiEtsyExtractor = EtsyExtractor;
  console.log('[ShopOpti+] Etsy Extractor v5.7.0 loaded');
})();
