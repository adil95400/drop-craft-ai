/**
 * ShopOpti+ Home Depot Extractor v5.7.0
 * High-fidelity extraction for Home Depot product pages
 * US B2B Market - Extracts: Images, Variants, Reviews, Specifications
 */

(function() {
  'use strict';

  if (window.__shopoptiHomeDepotExtractorLoaded) return;
  window.__shopoptiHomeDepotExtractorLoaded = true;

  class HomeDepotExtractor {
    constructor() {
      this.platform = 'homedepot';
      this.productId = this.extractProductId();
      this.pageData = null;
    }

    /**
     * Extract product ID from URL
     */
    extractProductId() {
      // Pattern: /p/PRODUCT-NAME/123456789
      const match = window.location.href.match(/\/p\/[^\/]+\/(\d+)/i);
      if (match) return match[1];

      // Alternative: itemId parameter
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('itemId') || null;
    }

    /**
     * Try to get page data from window objects
     */
    getPageData() {
      if (this.pageData) return this.pageData;

      // Try window.__REACT_QUERY_STATE__
      if (window.__REACT_QUERY_STATE__) {
        this.pageData = window.__REACT_QUERY_STATE__;
        return this.pageData;
      }

      // Try __NEXT_DATA__
      const nextDataScript = document.getElementById('__NEXT_DATA__');
      if (nextDataScript) {
        try {
          this.pageData = JSON.parse(nextDataScript.textContent);
          return this.pageData;
        } catch (e) {}
      }

      return null;
    }

    /**
     * Main extraction method
     */
    async extractComplete() {
      console.log('[ShopOpti+ HomeDepot] Starting extraction, Product ID:', this.productId);

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
        platform: 'homedepot',
        extractedAt: new Date().toISOString(),
        ...basicInfo,
        ...pricing,
        images,
        videos,
        variants,
        reviews,
        specifications
      };

      console.log('[ShopOpti+ HomeDepot] Extraction complete:', {
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

      // DOM fallback
      const titleEl = document.querySelector('h1.product-title, [data-testid="product-title"], h1[class*="title"]');
      const brandEl = document.querySelector('[data-testid="brand-link"], .product-brand, [class*="brand"]');
      const descEl = document.querySelector('[data-testid="product-description"], .product-description, [class*="description"]');

      const modelEl = document.querySelector('[data-testid="model-number"], .model-number, [class*="model"]');
      const skuEl = document.querySelector('[data-testid="internet-number"], .sku, [class*="internet"]');

      return {
        title: titleEl?.textContent?.trim() || '',
        brand: brandEl?.textContent?.trim() || '',
        description: descEl?.textContent?.trim()?.substring(0, 5000) || '',
        sku: skuEl?.textContent?.replace(/[^\d]/g, '')?.trim() || this.productId,
        model: modelEl?.textContent?.replace('Model #', '')?.trim() || ''
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
                sku: item.sku || item.productID || '',
                brand: typeof item.brand === 'string' ? item.brand : item.brand?.name || '',
                model: item.model || ''
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
      const currency = 'USD';

      // JSON-LD pricing
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent);
          if (data['@type'] === 'Product' && data.offers) {
            const offers = Array.isArray(data.offers) ? data.offers[0] : data.offers;
            price = parseFloat(offers.price) || 0;
            if (price > 0) break;
          }
        } catch (e) {}
      }

      // DOM fallback
      if (price === 0) {
        const priceSelectors = [
          '[data-testid="price"] span',
          '.price__dollars',
          '[class*="price-format"] span',
          '[itemprop="price"]'
        ];

        for (const sel of priceSelectors) {
          const el = document.querySelector(sel);
          if (el) {
            price = this.parsePrice(el.textContent || el.getAttribute('content') || '');
            if (price > 0) break;
          }
        }

        // Combine dollars and cents
        const dollarsEl = document.querySelector('.price__dollars, [class*="dollars"]');
        const centsEl = document.querySelector('.price__cents, [class*="cents"]');
        if (dollarsEl && centsEl) {
          const dollars = parseInt(dollarsEl.textContent?.replace(/[^\d]/g, '') || '0');
          const cents = parseInt(centsEl.textContent?.replace(/[^\d]/g, '') || '0');
          price = dollars + (cents / 100);
        }
      }

      // Original price
      const originalSelectors = ['.price--was', '[class*="was-price"]', 'del', '.strike-through'];
      for (const sel of originalSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          const op = this.parsePrice(el.textContent || '');
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
      let clean = priceStr.replace(/[$,\s]/g, '').trim();
      const match = clean.match(/[\d.]+/);
      return match ? parseFloat(match[0]) : 0;
    }

    /**
     * Extract images
     */
    async extractImages() {
      const images = new Set();

      // Main product images
      const imageSelectors = [
        '[data-testid="media-gallery"] img',
        '.mediagallery__mainimage img',
        '[class*="media-gallery"] img',
        '.product-image img'
      ];

      for (const sel of imageSelectors) {
        document.querySelectorAll(sel).forEach(img => {
          const src = img.dataset?.src || img.src;
          if (src && this.isValidImage(src)) {
            images.add(this.normalizeImageUrl(src));
          }
        });
      }

      // Thumbnails
      document.querySelectorAll('[data-testid="thumbnail-image"] img, .mediagallery__thumbnails img').forEach(img => {
        const src = img.dataset?.src || img.src;
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
      
      // Get high-res version - Home Depot uses ?wid=xxx
      src = src.replace(/\?wid=\d+/, '?wid=1000');
      src = src.replace(/&hei=\d+/, '&hei=1000');
      
      // Remove size suffixes
      src = src.replace(/_\d+\.(jpg|png|webp)/i, '_1000.$1');
      
      return src;
    }

    isValidImage(src) {
      if (!src) return false;
      if (src.includes('pixel') || src.includes('blank') || src.includes('spacer')) return false;
      if (src.includes('icon') || src.includes('logo') || src.includes('badge')) return false;
      return true;
    }

    /**
     * Extract videos
     */
    async extractVideos() {
      const videos = [];

      // Video elements
      document.querySelectorAll('video source, video[src]').forEach(el => {
        const src = el.src || el.querySelector('source')?.src;
        if (src && !videos.some(v => v.url === src)) {
          videos.push({ url: src, type: 'mp4', platform: 'homedepot' });
        }
      });

      // YouTube embeds
      document.querySelectorAll('iframe[src*="youtube"]').forEach(iframe => {
        const src = iframe.src;
        if (src) {
          videos.push({ url: src, type: 'youtube', platform: 'homedepot' });
        }
      });

      return videos.slice(0, 10);
    }

    /**
     * Extract variants
     */
    async extractVariants() {
      const variants = [];

      // Size/Color/Style options
      document.querySelectorAll('[data-testid="attribute-selector"] button, [class*="variant-option"]').forEach(item => {
        const title = item.textContent?.trim() || item.getAttribute('title') || item.getAttribute('aria-label');
        const id = item.dataset?.value || item.dataset?.optionId;
        const img = item.querySelector('img');
        
        if (title) {
          variants.push({
            id: id || `var_${variants.length}`,
            title: title,
            image: img?.src ? this.normalizeImageUrl(img.src) : null,
            available: !item.disabled && !item.className.includes('disabled')
          });
        }
      });

      // Dropdown options
      document.querySelectorAll('[data-testid="super-sku-dropdown"] option, select[name*="variant"] option').forEach(option => {
        if (option.value && option.value !== '' && option.value !== '-1') {
          variants.push({
            id: option.value,
            title: option.textContent?.trim(),
            available: !option.disabled
          });
        }
      });

      return variants;
    }

    /**
     * Extract reviews
     */
    async extractReviews() {
      const reviews = [];

      // Rating summary
      const ratingEl = document.querySelector('[data-testid="ratings-reviews-summary"] [class*="rating"], .ratings-reviews__average');
      const countEl = document.querySelector('[data-testid="ratings-reviews-summary"] [class*="count"], .ratings-reviews__count');

      if (ratingEl || countEl) {
        reviews.push({
          type: 'summary',
          averageRating: parseFloat(ratingEl?.textContent?.match(/[\d.]+/)?.[0] || 0),
          totalCount: parseInt(countEl?.textContent?.match(/[\d,]+/)?.[0]?.replace(',', '') || 0)
        });
      }

      // Individual reviews
      document.querySelectorAll('[data-testid="review-card"], .ratings-reviews__review').forEach(reviewEl => {
        const review = {
          author: reviewEl.querySelector('[data-testid="author-name"], .review__author')?.textContent?.trim() || 'Anonymous',
          rating: this.extractReviewRating(reviewEl),
          content: reviewEl.querySelector('[data-testid="review-content"], .review__text')?.textContent?.trim() || '',
          title: reviewEl.querySelector('[data-testid="review-title"], .review__headline')?.textContent?.trim() || '',
          date: reviewEl.querySelector('[data-testid="review-date"], .review__date')?.textContent?.trim() || '',
          images: [],
          verified: !!reviewEl.querySelector('[class*="verified"]')
        };

        // Review images
        reviewEl.querySelectorAll('img[src*="reviews"], img[class*="review-image"]').forEach(img => {
          if (img.src) {
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
      const ratingEl = el.querySelector('[class*="star"], [data-testid="rating"]');
      if (ratingEl) {
        const ariaLabel = ratingEl.getAttribute('aria-label');
        if (ariaLabel) {
          const match = ariaLabel.match(/([\d.]+)/);
          if (match) return parseFloat(match[1]);
        }
        
        const ratingText = ratingEl.textContent;
        const match = ratingText?.match(/([\d.]+)/);
        if (match) return parseFloat(match[1]);
      }
      return 5;
    }

    /**
     * Extract specifications
     */
    async extractSpecifications() {
      const specifications = {};

      // Specifications table
      document.querySelectorAll('[data-testid="product-specs"] tr, .product-info-bar__spec-row').forEach(row => {
        const cells = row.querySelectorAll('td, th');
        if (cells.length >= 2) {
          const key = cells[0].textContent?.trim();
          const value = cells[1].textContent?.trim();
          if (key && value) {
            specifications[key] = value;
          }
        }
      });

      // Key-value format specs
      document.querySelectorAll('[data-testid="spec-item"], .product-spec').forEach(item => {
        const keyEl = item.querySelector('[class*="label"], .spec-label');
        const valueEl = item.querySelector('[class*="value"], .spec-value');
        
        if (keyEl && valueEl) {
          specifications[keyEl.textContent.trim()] = valueEl.textContent.trim();
        }
      });

      // Dimensions
      const dimensionsEl = document.querySelector('[data-testid="dimensions"], .product-dimensions');
      if (dimensionsEl) {
        specifications['Dimensions'] = dimensionsEl.textContent?.trim() || '';
      }

      return specifications;
    }
  }

  // Register with ExtractorRegistry if available
  if (window.ExtractorRegistry) {
    window.ExtractorRegistry.register('homedepot', HomeDepotExtractor);
  }

  // Export
  window.HomeDepotExtractor = HomeDepotExtractor;

})();
