/**
 * ShopOpti+ Fnac Extractor v5.7.0
 * High-fidelity extraction for Fnac product pages
 * French Market - Extracts: Images, Reviews, Specifications
 */

(function() {
  'use strict';

  if (window.__shopoptiFnacExtractorLoaded) return;
  window.__shopoptiFnacExtractorLoaded = true;

  class FnacExtractor {
    constructor() {
      this.platform = 'fnac';
      this.productId = this.extractProductId();
    }

    extractProductId() {
      // Pattern: /a123456/
      const match = window.location.href.match(/\/a(\d+)\//i);
      return match ? match[1] : null;
    }

    async extractComplete() {
      console.log('[ShopOpti+ Fnac] Starting extraction, Product ID:', this.productId);

      const [basicInfo, pricing, images, reviews, specifications] = await Promise.all([
        this.extractBasicInfo(),
        this.extractPricing(),
        this.extractImages(),
        this.extractReviews(),
        this.extractSpecifications()
      ]);

      return {
        external_id: this.productId,
        url: window.location.href,
        platform: 'fnac',
        extractedAt: new Date().toISOString(),
        ...basicInfo,
        ...pricing,
        images,
        videos: [],
        variants: [],
        reviews,
        specifications
      };
    }

    async extractBasicInfo() {
      const jsonLD = this.extractFromJsonLD();
      if (jsonLD.title) return jsonLD;

      const titleEl = document.querySelector('h1.f-productHeader-Title, [itemprop="name"]');
      const brandEl = document.querySelector('.f-productHeader-brand, [itemprop="brand"]');
      const descEl = document.querySelector('.f-productDetails-description, [itemprop="description"]');

      return {
        title: titleEl?.textContent?.trim() || '',
        brand: brandEl?.textContent?.trim() || '',
        description: descEl?.textContent?.trim()?.substring(0, 5000) || '',
        sku: this.productId
      };
    }

    extractFromJsonLD() {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent);
          if (data['@type'] === 'Product') {
            return {
              title: data.name || '',
              description: data.description || '',
              brand: typeof data.brand === 'string' ? data.brand : data.brand?.name || '',
              sku: data.sku || ''
            };
          }
        } catch (e) {}
      }
      return {};
    }

    async extractPricing() {
      let price = 0;
      let originalPrice = null;

      const priceEl = document.querySelector('.f-priceBox-price, [itemprop="price"]');
      if (priceEl) {
        price = this.parsePrice(priceEl.textContent || priceEl.getAttribute('content') || '');
      }

      const originalEl = document.querySelector('.f-priceBox-priceOld, del.price');
      if (originalEl) {
        const op = this.parsePrice(originalEl.textContent || '');
        if (op > price) originalPrice = op;
      }

      return { price, originalPrice, currency: 'EUR' };
    }

    parsePrice(str) {
      if (!str) return 0;
      let clean = str.replace(/[€\s]/g, '').replace(/\u00a0/g, '').trim();
      clean = clean.replace(',', '.');
      return parseFloat(clean) || 0;
    }

    async extractImages() {
      const images = new Set();

      document.querySelectorAll('.f-productVisuals-carousel img, .f-productVisuals-main img').forEach(img => {
        const src = img.dataset?.src || img.src;
        if (src && !src.includes('placeholder')) {
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
            imgs.forEach(img => images.add(typeof img === 'string' ? img : img.url));
          }
        } catch (e) {}
      }

      return Array.from(images).filter(url => url?.includes('http')).slice(0, 30);
    }

    normalizeImageUrl(src) {
      if (!src) return null;
      if (src.startsWith('//')) src = 'https:' + src;
      return src.replace(/\/resize=\d+x\d+\//, '/');
    }

    async extractReviews() {
      const reviews = [];

      const ratingEl = document.querySelector('[itemprop="ratingValue"], .f-rating');
      const countEl = document.querySelector('[itemprop="reviewCount"], .f-rating-count');

      if (ratingEl) {
        reviews.push({
          type: 'summary',
          averageRating: parseFloat(ratingEl.textContent?.replace(',', '.') || ratingEl.content || 0),
          totalCount: parseInt(countEl?.textContent?.match(/\d+/)?.[0] || 0)
        });
      }

      document.querySelectorAll('.f-review, .customerReview').forEach(reviewEl => {
        const review = {
          author: reviewEl.querySelector('.f-review-author')?.textContent?.trim() || 'Anonyme',
          rating: 5,
          content: reviewEl.querySelector('.f-review-content')?.textContent?.trim() || '',
          date: reviewEl.querySelector('.f-review-date')?.textContent?.trim() || '',
          images: []
        };

        if (review.content) reviews.push(review);
      });

      return reviews.slice(0, 50);
    }

    async extractSpecifications() {
      const specifications = {};

      document.querySelectorAll('.f-productDetails-characteristics tr').forEach(row => {
        const cells = row.querySelectorAll('td, th');
        if (cells.length >= 2) {
          const key = cells[0].textContent?.trim();
          const value = cells[1].textContent?.trim();
          if (key && value) specifications[key] = value;
        }
      });

      return specifications;
    }
  }

  if (window.ExtractorRegistry) {
    window.ExtractorRegistry.register('fnac', FnacExtractor);
  }

  window.FnacExtractor = FnacExtractor;
})();
