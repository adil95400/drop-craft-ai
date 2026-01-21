/**
 * Drop Craft AI - Lowe's Platform Extractor
 * Extracts product data from lowes.com
 */

(function() {
  'use strict';

  if (window.__dcLowesLoaded) return;
  window.__dcLowesLoaded = true;

  class LowesExtractor {
    constructor() {
      this.platform = 'lowes';
    }

    async extractProduct() {
      const data = {
        platform: this.platform,
        url: window.location.href,
        scrapedAt: new Date().toISOString()
      };

      // Try JSON-LD first
      const ldData = this.extractFromJsonLD();
      if (ldData) Object.assign(data, ldData);

      // DOM extraction
      const domData = this.extractFromDOM();
      Object.assign(data, { ...domData, ...data });

      // Lowe's specific data
      data.itemNumber = this.extractItemNumber();
      data.modelNumber = this.extractModelNumber();
      data.specifications = this.extractSpecifications();
      data.availability = this.extractAvailability();
      data.variants = await this.extractVariants();

      return data;
    }

    extractFromJsonLD() {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          const json = JSON.parse(script.textContent);
          const items = Array.isArray(json) ? json : [json];
          
          for (const item of items) {
            if (item['@type'] === 'Product') {
              const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
              return {
                title: item.name,
                description: item.description,
                price: parseFloat(offer?.price) || 0,
                currency: offer?.priceCurrency || 'USD',
                image: Array.isArray(item.image) ? item.image[0] : item.image,
                images: Array.isArray(item.image) ? item.image : [item.image].filter(Boolean),
                sku: item.sku,
                mpn: item.mpn,
                brand: item.brand?.name,
                rating: item.aggregateRating?.ratingValue,
                reviewCount: item.aggregateRating?.reviewCount
              };
            }
          }
        } catch (e) {}
      }
      return null;
    }

    extractFromDOM() {
      const data = {};

      // Title
      const titleEl = document.querySelector('h1[data-selector="product-title"], .product-title, h1.h1');
      if (titleEl) data.title = titleEl.textContent.trim();

      // Price
      const priceEl = document.querySelector('[data-selector="price"], .price-main, .main-price');
      if (priceEl) {
        const priceText = priceEl.textContent.replace(/[^0-9.]/g, '');
        data.price = parseFloat(priceText) || 0;
      }

      // Was price
      const wasPriceEl = document.querySelector('.was-price, [data-selector="was-price"]');
      if (wasPriceEl) {
        data.originalPrice = parseFloat(wasPriceEl.textContent.replace(/[^0-9.]/g, '')) || null;
      }

      // Images
      data.images = [];
      const imgEls = document.querySelectorAll('.product-image-gallery img, [data-selector="product-image"] img');
      imgEls.forEach(img => {
        let src = img.src || img.dataset.src;
        if (src) {
          // Get high-res version
          src = src.replace(/\?.*/, '').replace(/\/[a-z]+_/, '/');
          if (!data.images.includes(src)) data.images.push(src);
        }
      });
      if (data.images.length) data.image = data.images[0];

      // Rating
      const ratingEl = document.querySelector('[data-selector="rating-value"], .rating-value');
      if (ratingEl) {
        data.rating = parseFloat(ratingEl.textContent) || 0;
      }

      // Review count
      const reviewCountEl = document.querySelector('[data-selector="review-count"], .review-count');
      if (reviewCountEl) {
        data.reviewCount = parseInt(reviewCountEl.textContent.replace(/[^0-9]/g, '')) || 0;
      }

      // Brand
      const brandEl = document.querySelector('[data-selector="brand"], .product-brand a');
      if (brandEl) data.brand = brandEl.textContent.trim();

      // Description
      const descEl = document.querySelector('[data-selector="product-description"], .product-description');
      if (descEl) data.description = descEl.textContent.trim().substring(0, 2000);

      return data;
    }

    extractItemNumber() {
      const el = document.querySelector('[data-selector="item-number"], .item-number');
      if (!el) return null;
      const match = el.textContent.match(/\d+/);
      return match ? match[0] : null;
    }

    extractModelNumber() {
      const el = document.querySelector('[data-selector="model-number"], .model-number');
      if (!el) return null;
      return el.textContent.replace(/Model\s*#?\s*/i, '').trim();
    }

    extractSpecifications() {
      const specs = {};
      const rows = document.querySelectorAll('.specifications-list li, [data-selector="specifications"] tr');
      
      rows.forEach(row => {
        const label = row.querySelector('.spec-label, th')?.textContent?.trim();
        const value = row.querySelector('.spec-value, td')?.textContent?.trim();
        if (label && value) specs[label] = value;
      });

      return Object.keys(specs).length ? specs : null;
    }

    extractAvailability() {
      const availEl = document.querySelector('[data-selector="availability"], .availability-message');
      if (!availEl) return 'unknown';
      
      const text = availEl.textContent.toLowerCase();
      if (text.includes('in stock') || text.includes('available')) return 'in_stock';
      if (text.includes('out of stock') || text.includes('unavailable')) return 'out_of_stock';
      if (text.includes('limited')) return 'limited';
      if (text.includes('ship to store')) return 'ship_to_store';
      return 'unknown';
    }

    async extractVariants() {
      const variants = [];
      const swatches = document.querySelectorAll('[data-selector="swatch"], .product-swatch');
      
      swatches.forEach(swatch => {
        const variant = {
          name: swatch.getAttribute('aria-label') || swatch.title,
          value: swatch.dataset.value || swatch.dataset.optionValue,
          image: swatch.querySelector('img')?.src,
          selected: swatch.classList.contains('selected') || swatch.getAttribute('aria-selected') === 'true'
        };
        
        if (variant.name) variants.push(variant);
      });

      return variants;
    }

    async extractFromListing() {
      const products = [];
      const cards = document.querySelectorAll('[data-selector="product-card"], .product-card');

      cards.forEach((card, index) => {
        const product = {
          platform: this.platform,
          scrapedAt: new Date().toISOString(),
          source: 'listing'
        };

        // Title & URL
        const titleEl = card.querySelector('[data-selector="product-title"] a, .product-title a');
        product.title = titleEl?.textContent?.trim() || `Lowe's Product ${index + 1}`;
        product.url = titleEl?.href;

        // Price
        const priceEl = card.querySelector('[data-selector="price"], .price');
        product.price = parseFloat(priceEl?.textContent?.replace(/[^0-9.]/g, '')) || 0;

        // Image
        const imgEl = card.querySelector('img[data-selector="product-image"], .product-image img');
        product.image = imgEl?.src || imgEl?.dataset.src;

        // Rating
        const ratingEl = card.querySelector('[data-selector="rating"]');
        product.rating = parseFloat(ratingEl?.textContent) || 0;

        // Brand
        const brandEl = card.querySelector('[data-selector="brand"]');
        product.brand = brandEl?.textContent?.trim();

        if (product.title && product.url) {
          products.push(product);
        }
      });

      return products;
    }
  }

  window.DropCraftLowesExtractor = LowesExtractor;
  window.__dcPlatformExtractor = new LowesExtractor();
})();
