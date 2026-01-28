/**
 * ShopOpti+ Wish Extractor v5.7.0
 * High-fidelity extraction for Wish product pages
 * Budget marketplace focused with shipping estimates
 */

(function() {
  'use strict';

  if (window.__shopoptiWishExtractorLoaded) return;
  window.__shopoptiWishExtractorLoaded = true;

  class WishExtractor {
    constructor() {
      this.platform = 'wish';
      this.productId = this.extractProductId();
    }

    extractProductId() {
      const patterns = [
        /\/product\/([a-zA-Z0-9]+)/i,
        /\/c\/([a-zA-Z0-9]+)/i,
        /cid[=:]([a-zA-Z0-9]+)/i
      ];
      
      for (const pattern of patterns) {
        const match = window.location.href.match(pattern);
        if (match) return match[1];
      }
      return null;
    }

    async extractComplete() {
      console.log('[ShopOpti+ Wish] Starting extraction for product:', this.productId);

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
        platform: 'wish',
        extractedAt: new Date().toISOString(),
        ...basicInfo,
        ...pricing,
        images,
        videos: [],
        variants,
        reviews,
        specifications: await this.extractSpecifications(),
        shipping: await this.extractShipping()
      };
    }

    async extractBasicInfo() {
      const title = document.querySelector('[data-testid="product-name"], .product-title, h1')?.textContent?.trim() || '';
      
      let description = '';
      const descEl = document.querySelector('[data-testid="product-description"], .product-description');
      if (descEl) {
        description = descEl.textContent?.trim()?.substring(0, 8000) || '';
      }

      const storeEl = document.querySelector('[data-testid="store-name"], .store-name a');
      
      return {
        title,
        brand: storeEl?.textContent?.trim() || '',
        description,
        sku: this.productId
      };
    }

    async extractPricing() {
      let price = 0;
      let originalPrice = null;
      let currency = 'EUR';

      const priceEl = document.querySelector('[data-testid="product-price"], .product-price .current');
      if (priceEl) {
        const parsed = this.parsePrice(priceEl.textContent || '');
        price = parsed.price;
        currency = parsed.currency;
      }

      const originalEl = document.querySelector('[data-testid="original-price"], .product-price .original, del');
      if (originalEl) {
        const parsed = this.parsePrice(originalEl.textContent || '');
        if (parsed.price > price) originalPrice = parsed.price;
      }

      return { price, originalPrice, currency };
    }

    parsePrice(str) {
      if (!str) return { price: 0, currency: 'EUR' };
      
      let currency = 'EUR';
      if (str.includes('$')) currency = 'USD';
      else if (str.includes('£')) currency = 'GBP';
      
      const clean = str.replace(/[€$£\s]/g, '').replace(',', '.').trim();
      const match = clean.match(/[\d.]+/);
      
      return { price: parseFloat(match?.[0] || 0), currency };
    }

    async extractImages() {
      const images = new Set();

      // Main gallery
      document.querySelectorAll('[data-testid="product-image"] img, .product-gallery img, .product-image img').forEach(img => {
        let src = img.dataset.src || img.src;
        if (src) {
          // Get high resolution
          src = src.replace(/-small/, '-large').replace(/_\d+x\d+/, '');
          if (src.startsWith('//')) src = 'https:' + src;
          if (!src.includes('placeholder')) images.add(src);
        }
      });

      // Thumbnails
      document.querySelectorAll('[data-testid="thumbnail"] img, .product-thumbs img').forEach(img => {
        let src = img.dataset.src || img.src;
        if (src) {
          src = src.replace(/-small/, '-large').replace(/_\d+x\d+/, '');
          if (src.startsWith('//')) src = 'https:' + src;
          images.add(src);
        }
      });

      return Array.from(images).filter(url => url?.includes('http')).slice(0, 50);
    }

    async extractVariants() {
      const variants = [];

      // Size/Color options
      document.querySelectorAll('[data-testid="variant-option"], .variant-item, .product-option').forEach((item, idx) => {
        const title = item.getAttribute('title') || item.getAttribute('aria-label') || item.textContent?.trim();
        const img = item.querySelector('img')?.src;
        const isSelected = item.classList.contains('selected') || item.getAttribute('aria-checked') === 'true';
        
        if (title) {
          variants.push({
            id: item.dataset.variantId || `var_${idx}`,
            title,
            image: img?.startsWith('//') ? 'https:' + img : img,
            selected: isSelected,
            available: !item.classList.contains('disabled') && !item.classList.contains('out-of-stock')
          });
        }
      });

      return variants;
    }

    async extractReviews() {
      const reviews = [];

      // Summary
      const ratingEl = document.querySelector('[data-testid="product-rating"], .product-rating-value');
      const countEl = document.querySelector('[data-testid="review-count"], .product-rating-count');
      
      if (ratingEl) {
        reviews.push({
          type: 'summary',
          averageRating: parseFloat(ratingEl.textContent?.replace(',', '.') || 0),
          totalCount: parseInt(countEl?.textContent?.match(/\d+/)?.[0] || 0)
        });
      }

      // Individual reviews
      document.querySelectorAll('[data-testid="review-item"], .review-item').forEach(reviewEl => {
        const author = reviewEl.querySelector('[data-testid="reviewer-name"], .reviewer-name')?.textContent?.trim() || 'Anonymous';
        const stars = reviewEl.querySelectorAll('[data-testid="star-filled"], .star-filled').length;
        const content = reviewEl.querySelector('[data-testid="review-content"], .review-content')?.textContent?.trim() || '';
        const date = reviewEl.querySelector('[data-testid="review-date"], .review-date')?.textContent?.trim() || '';
        
        const images = [];
        reviewEl.querySelectorAll('[data-testid="review-image"] img, .review-images img').forEach(img => {
          const src = img.src || img.dataset.src;
          if (src) images.push(src.startsWith('//') ? 'https:' + src : src);
        });

        if (content) {
          reviews.push({
            author,
            rating: stars || 5,
            content,
            date,
            images
          });
        }
      });

      return reviews.slice(0, 50);
    }

    async extractSpecifications() {
      const specs = {};

      document.querySelectorAll('[data-testid="spec-item"], .product-specs tr, .spec-row').forEach(row => {
        const key = row.querySelector('[data-testid="spec-name"], td:first-child, .spec-name')?.textContent?.trim();
        const value = row.querySelector('[data-testid="spec-value"], td:last-child, .spec-value')?.textContent?.trim();
        if (key && value && key !== value) specs[key] = value;
      });

      return specs;
    }

    async extractShipping() {
      const shipping = {
        cost: 0,
        estimatedDelivery: '',
        freeShipping: false
      };

      const shippingEl = document.querySelector('[data-testid="shipping-info"], .shipping-info, .delivery-info');
      if (shippingEl) {
        const text = shippingEl.textContent || '';
        
        // Check for free shipping
        shipping.freeShipping = text.toLowerCase().includes('free') || text.includes('gratuit');
        
        // Extract shipping cost
        const costMatch = text.match(/[€$£]?\s*[\d,.]+/);
        if (costMatch && !shipping.freeShipping) {
          shipping.cost = parseFloat(costMatch[0].replace(/[€$£\s,]/g, '.').replace('..', '.')) || 0;
        }
        
        // Extract delivery estimate
        const deliveryMatch = text.match(/(\d+[-–]\d+)\s*(jours?|days?|semaines?|weeks?)/i);
        if (deliveryMatch) {
          shipping.estimatedDelivery = deliveryMatch[0];
        }
      }

      return shipping;
    }
  }

  // Register with ExtractorRegistry
  if (window.ExtractorRegistry) {
    window.ExtractorRegistry.register('wish', WishExtractor);
  }

  window.WishExtractor = WishExtractor;
})();
