/**
 * ShopOpti+ Rakuten Extractor v5.7.0
 * High-fidelity extraction for Rakuten product pages
 * France/Japan Market - Extracts: Images, Variants, Reviews
 */

(function() {
  'use strict';

  if (window.__shopoptiRakutenExtractorLoaded) return;
  window.__shopoptiRakutenExtractorLoaded = true;

  class RakutenExtractor {
    constructor() {
      this.platform = 'rakuten';
      this.productId = this.extractProductId();
    }

    extractProductId() {
      const match = window.location.href.match(/\/product\/(\d+)/i);
      if (match) return match[1];
      
      const altMatch = window.location.href.match(/offer\/(\d+)/i);
      return altMatch ? altMatch[1] : null;
    }

    async extractComplete() {
      console.log('[ShopOpti+ Rakuten] Starting extraction');

      const [basicInfo, pricing, images, variants, reviews] = await Promise.all([
        this.extractBasicInfo(),
        this.extractPricing(),
        this.extractImages(),
        this.extractVariants(),
        this.extractReviews()
      ]);

      return {
        external_id: this.productId,
        url: window.location.href,
        platform: 'rakuten',
        extractedAt: new Date().toISOString(),
        ...basicInfo,
        ...pricing,
        images,
        videos: [],
        variants,
        reviews,
        specifications: {}
      };
    }

    async extractBasicInfo() {
      const jsonLD = this.extractFromJsonLD();
      if (jsonLD.title) return jsonLD;

      const titleEl = document.querySelector('h1[itemprop="name"], .product-title, h1');
      const brandEl = document.querySelector('[itemprop="brand"], .seller-name');
      const descEl = document.querySelector('[itemprop="description"], .product-description');

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

      const priceEl = document.querySelector('[itemprop="price"], .price, .product-price');
      if (priceEl) {
        price = this.parsePrice(priceEl.textContent || priceEl.getAttribute('content') || '');
      }

      const originalEl = document.querySelector('.old-price, del, .price-strike');
      if (originalEl) {
        const op = this.parsePrice(originalEl.textContent || '');
        if (op > price) originalPrice = op;
      }

      return { price, originalPrice, currency: 'EUR' };
    }

    parsePrice(str) {
      if (!str) return 0;
      let clean = str.replace(/[€¥\s]/g, '').replace(/\u00a0/g, '').trim();
      clean = clean.replace(/\./g, '').replace(',', '.');
      return parseFloat(clean) || 0;
    }

    async extractImages() {
      const images = new Set();

      document.querySelectorAll('.product-gallery img, .carousel img, [itemprop="image"]').forEach(img => {
        const src = img.dataset?.src || img.src;
        if (src && !src.includes('placeholder') && !src.includes('icon')) {
          images.add(this.normalizeImageUrl(src));
        }
      });

      return Array.from(images).filter(url => url?.includes('http')).slice(0, 30);
    }

    normalizeImageUrl(src) {
      if (!src) return null;
      if (src.startsWith('//')) src = 'https:' + src;
      return src;
    }

    async extractVariants() {
      const variants = [];

      document.querySelectorAll('.variant-option, .product-variant, select option').forEach(item => {
        const title = item.textContent?.trim() || item.getAttribute('title') || item.value;
        if (title && title !== '-' && title !== 'Sélectionner') {
          variants.push({
            id: item.value || `var_${variants.length}`,
            title: title,
            available: !item.disabled
          });
        }
      });

      return variants;
    }

    async extractReviews() {
      const reviews = [];

      const ratingEl = document.querySelector('[itemprop="ratingValue"], .rating-value');
      const countEl = document.querySelector('[itemprop="reviewCount"], .review-count');

      if (ratingEl) {
        reviews.push({
          type: 'summary',
          averageRating: parseFloat(ratingEl.textContent?.replace(',', '.') || ratingEl.content || 0),
          totalCount: parseInt(countEl?.textContent?.match(/\d+/)?.[0] || 0)
        });
      }

      document.querySelectorAll('.review-item, .customer-review').forEach(reviewEl => {
        const review = {
          author: reviewEl.querySelector('.reviewer-name, .author')?.textContent?.trim() || 'Anonyme',
          rating: 5,
          content: reviewEl.querySelector('.review-text, .comment')?.textContent?.trim() || '',
          date: reviewEl.querySelector('.review-date, time')?.textContent?.trim() || '',
          images: []
        };

        if (review.content) reviews.push(review);
      });

      return reviews.slice(0, 50);
    }
  }

  if (window.ExtractorRegistry) {
    window.ExtractorRegistry.register('rakuten', RakutenExtractor);
  }

  window.RakutenExtractor = RakutenExtractor;
})();
