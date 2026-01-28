/**
 * ShopOpti+ eBay Extractor v5.7.0
 * High-fidelity extraction for eBay product pages
 * Extends BaseExtractor - Extracts: Images, Variants, Videos, Reviews, Specifications
 */

(function() {
  'use strict';

  if (window.__shopoptiEbayExtractorLoaded) return;
  window.__shopoptiEbayExtractorLoaded = true;

  const BaseExtractor = window.ShopOptiBaseExtractor;

  class EbayExtractor extends (BaseExtractor || Object) {
    constructor() {
      if (BaseExtractor) super();
      this.platform = 'ebay';
      this.version = '5.7.0';
      this.itemId = this.extractItemId();
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
             url.includes('item') || 
             url.includes('reviews');
    }

    processInterceptedData(url, data) {
      if (url.includes('review')) {
        this.interceptedData.reviews = data;
      } else {
        this.interceptedData.product = data;
      }
    }

    /**
     * Extract item ID from URL
     */
    extractItemId() {
      const patterns = [
        /\/itm\/(\d+)/,
        /\/p\/(\d+)/,
        /item=(\d+)/,
        /itemId=(\d+)/,
        /\/itm\/[^/]+\/(\d+)/
      ];

      for (const pattern of patterns) {
        const match = window.location.href.match(pattern);
        if (match) return match[1];
      }

      return null;
    }

    getPlatform() {
      return 'ebay';
    }

    getExternalId() {
      return this.itemId;
    }

    /**
     * Main extraction method
     */
    async extractComplete() {
      console.log('[ShopOpti+ eBay v5.7.0] Starting extraction, Item ID:', this.itemId);

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
        external_id: this.itemId,
        url: window.location.href,
        platform: 'ebay',
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

      console.log('[ShopOpti+ eBay v5.7.0] Extraction complete:', {
        title: productData.title?.substring(0, 50),
        images: images.length,
        variants: variants.length
      });

      return productData;
    }

    /**
     * Extract basic product info
     */
    async extractBasicInfo() {
      // JSON-LD first
      const jsonLD = this.extractFromJsonLD();
      if (jsonLD.title) return jsonLD;

      // DOM extraction
      const titleSelectors = [
        'h1.x-item-title__mainTitle',
        '[data-testid="x-item-title"]',
        '#itemTitle',
        'h1[itemprop="name"]',
        '.x-item-title span'
      ];

      let title = '';
      for (const sel of titleSelectors) {
        const el = document.querySelector(sel);
        if (el?.textContent?.trim()) {
          title = el.textContent.replace(/^Details about\s*/i, '').trim();
          break;
        }
      }

      // Brand/Seller
      const brandSelectors = [
        '[data-testid="x-store-info"] a',
        '.x-sellercard-atf__info a',
        '[class*="seller-info"] a',
        '.x-seller-info a'
      ];
      let brand = '';
      for (const sel of brandSelectors) {
        const el = document.querySelector(sel);
        if (el?.textContent?.trim()) {
          brand = el.textContent.trim();
          break;
        }
      }

      // Description
      let description = '';
      const descFrame = document.querySelector('#desc_ifr, #description iframe');
      if (descFrame) {
        try {
          const frameDoc = descFrame.contentDocument || descFrame.contentWindow?.document;
          description = frameDoc?.body?.textContent?.trim()?.substring(0, 5000) || '';
        } catch (e) {}
      }
      if (!description) {
        const descEl = document.querySelector('#viTabs_0_is, [itemprop="description"], .d-item-description');
        description = descEl?.textContent?.trim()?.substring(0, 5000) || '';
      }

      // SKU / MPN
      let sku = this.itemId;
      const skuEl = document.querySelector('[class*="item-id"], [data-testid="x-item-number"]');
      if (skuEl) {
        sku = skuEl.textContent?.match(/\d+/)?.[0] || this.itemId;
      }

      return { title, brand, description, sku };
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
                sku: item.sku || item.productID || '',
                brand: typeof item.brand === 'string' ? item.brand : item.brand?.name || ''
              };
            }
          }
        } catch (e) {}
      }
      
      return {};
    }

    /**
     * Extract pricing
     */
    async extractPricing() {
      let price = 0;
      let originalPrice = null;
      let currency = 'EUR';

      // JSON-LD pricing
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent);
          const items = Array.isArray(data) ? data : [data];
          
          for (const item of items) {
            if (item['@type'] === 'Product' && item.offers) {
              const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
              price = parseFloat(offers.price) || 0;
              currency = offers.priceCurrency || 'EUR';
              break;
            }
          }
        } catch (e) {}
      }

      // DOM fallback
      if (price === 0) {
        const priceSelectors = [
          '[data-testid="x-price-primary"] .ux-textspans',
          '[itemprop="price"]',
          '#prcIsum',
          '.x-price-primary',
          '.x-buybox__price-section span'
        ];

        for (const sel of priceSelectors) {
          const el = document.querySelector(sel);
          if (el) {
            price = this.parsePrice(el.textContent || el.getAttribute('content') || '');
            if (price > 0) break;
          }
        }
      }

      // Original price
      const originalSelectors = [
        '[data-testid="x-price-secondary"]',
        '.x-price-secondary',
        '[class*="original-price"]',
        '.ux-textspans--STRIKETHROUGH'
      ];
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

      return { price, originalPrice, currency };
    }

    parsePrice(priceStr) {
      if (!priceStr) return 0;
      let clean = priceStr.replace(/[€$£¥\s]/g, '').replace('EUR', '').replace('USD', '').trim();
      
      // Handle European format
      if (/^\d{1,3}([.\s]\d{3})*,\d{2}$/.test(clean)) {
        clean = clean.replace(/[.\s]/g, '').replace(',', '.');
      } else if (clean.includes(',') && !clean.includes('.')) {
        clean = clean.replace(',', '.');
      }
      
      return parseFloat(clean) || 0;
    }

    /**
     * Extract images
     */
    async extractImages() {
      const images = new Set();

      // Main carousel images
      document.querySelectorAll('.ux-image-carousel img, [data-testid="ux-image-carousel"] img, .ux-image-magnify img').forEach(img => {
        const src = img.dataset?.src || img.dataset?.zoom || img.src;
        if (src) {
          images.add(this.normalizeImageUrl(src));
        }
      });

      // Thumbnail images
      document.querySelectorAll('[class*="thumb"] img, .x-photos-thumb img, .ux-image-filmstrip img').forEach(img => {
        const src = img.dataset?.src || img.src;
        if (src) {
          images.add(this.normalizeImageUrl(src));
        }
      });

      // Main large image
      const mainImg = document.querySelector('#icImg, .ux-image-filmstrip-image img');
      if (mainImg) {
        images.add(this.normalizeImageUrl(mainImg.dataset?.src || mainImg.src));
      }

      // From JSON-LD
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent);
          const items = Array.isArray(data) ? data : [data];
          for (const item of items) {
            if (item['@type'] === 'Product' && item.image) {
              const imgs = Array.isArray(item.image) ? item.image : [item.image];
              imgs.forEach(img => {
                const src = typeof img === 'string' ? img : img.url;
                if (src) images.add(this.normalizeImageUrl(src));
              });
            }
          }
        } catch (e) {}
      }

      return Array.from(images).filter(url => url && url.includes('http')).slice(0, 30);
    }

    normalizeImageUrl(src) {
      if (!src) return null;

      if (src.startsWith('//')) src = 'https:' + src;

      // Get high-res version
      src = src.replace(/s-l\d+/g, 's-l1600');
      src = src.replace(/\$_\d+/g, '$_57');
      src = src.split('?')[0];

      return src;
    }

    /**
     * Extract product videos
     */
    async extractVideos() {
      const videos = [];

      // Video elements
      document.querySelectorAll('video source, video').forEach(el => {
        const src = el.src || el.querySelector('source')?.src;
        if (src && !videos.some(v => v.url === src)) {
          videos.push({ url: src, type: 'mp4', platform: 'ebay' });
        }
      });

      // YouTube embeds
      document.querySelectorAll('iframe[src*="youtube"]').forEach(iframe => {
        const src = iframe.src;
        if (src) {
          videos.push({ url: src, type: 'youtube', platform: 'ebay' });
        }
      });

      return videos.slice(0, 10);
    }

    /**
     * Extract product variants
     */
    async extractVariants() {
      const variants = [];

      // Variation selectors
      document.querySelectorAll('[data-testid*="select"] select option, #msku-sel-1 option').forEach(option => {
        if (option.value && option.value !== '-1') {
          variants.push({
            id: option.value,
            title: option.textContent.trim(),
            available: !option.disabled
          });
        }
      });

      // Buttons/swatches
      document.querySelectorAll('.x-variation-value, [class*="variation-item"], .x-msku__swatch-button').forEach(item => {
        const title = item.getAttribute('aria-label') || item.textContent?.trim();
        const img = item.querySelector('img');
        
        if (title) {
          variants.push({
            id: `var_${variants.length}`,
            title: title,
            image: img?.src ? this.normalizeImageUrl(img.src) : null,
            available: !item.className.includes('unavailable') && !item.hasAttribute('disabled')
          });
        }
      });

      return variants;
    }

    /**
     * Extract product reviews
     */
    async extractReviews() {
      const reviews = [];

      // Rating summary
      const ratingEl = document.querySelector('[class*="star-rating"], [itemprop="ratingValue"]');
      const countEl = document.querySelector('[class*="reviews-count"], [itemprop="reviewCount"]');
      
      if (ratingEl || countEl) {
        reviews.push({
          type: 'summary',
          averageRating: parseFloat(ratingEl?.textContent?.match(/[\d.]+/)?.[0] || ratingEl?.getAttribute('content')) || 0,
          totalCount: parseInt(countEl?.textContent?.match(/[\d,]+/)?.[0]?.replace(',', '') || countEl?.getAttribute('content')) || 0
        });
      }

      // Individual reviews
      document.querySelectorAll('[class*="review-item"], [data-testid*="review"]').forEach(reviewEl => {
        const review = {
          author: reviewEl.querySelector('[class*="reviewer"], [class*="user"]')?.textContent?.trim() || 'Anonymous',
          rating: this.extractReviewRating(reviewEl),
          content: reviewEl.querySelector('[class*="review-text"], [class*="content"]')?.textContent?.trim() || '',
          date: reviewEl.querySelector('[class*="date"], time')?.textContent?.trim() || ''
        };

        if (review.content) {
          reviews.push(review);
        }
      });

      return reviews.slice(0, 50);
    }

    extractReviewRating(el) {
      const starEl = el.querySelector('[class*="star-rating"]');
      if (starEl) {
        const ariaLabel = starEl.getAttribute('aria-label');
        const match = ariaLabel?.match(/(\d[.,]?\d?)/);
        if (match) return parseFloat(match[1].replace(',', '.'));
      }
      return 5;
    }

    /**
     * Extract product specifications
     */
    async extractSpecifications() {
      const specs = {};

      // Item specifics table
      document.querySelectorAll('[data-testid="ux-labels-values"] .ux-labels-values__labels-content, .itemAttr tr').forEach(row => {
        const keyEl = row.querySelector('.ux-labels-values__labels, th');
        const valueEl = row.querySelector('.ux-labels-values__values, td');
        
        if (keyEl && valueEl) {
          const key = keyEl.textContent.trim().replace(/:\s*$/, '');
          const value = valueEl.textContent.trim();
          if (key && value) {
            specs[key] = value;
          }
        }
      });

      // Labels-values layout
      document.querySelectorAll('.ux-layout-section--features .ux-labels-values').forEach(item => {
        const key = item.querySelector('.ux-labels-values__labels')?.textContent?.trim();
        const value = item.querySelector('.ux-labels-values__values')?.textContent?.trim();
        if (key && value) {
          specs[key] = value;
        }
      });

      return specs;
    }
  }

  // Register with ExtractorRegistry
  if (window.ExtractorRegistry) {
    window.ExtractorRegistry.register('ebay', EbayExtractor);
  }

  window.EbayExtractor = EbayExtractor;
  window.ShopOptiEbayExtractor = EbayExtractor;
  console.log('[ShopOpti+] eBay Extractor v5.7.0 loaded');
})();
