/**
 * Drop Craft AI - Home Depot Platform Extractor
 * Extracts product data from homedepot.com
 */

(function() {
  'use strict';

  if (window.__dcHomeDepotLoaded) return;
  window.__dcHomeDepotLoaded = true;

  class HomeDepotExtractor {
    constructor() {
      this.platform = 'homedepot';
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

      // DOM extraction as fallback/supplement
      const domData = this.extractFromDOM();
      Object.assign(data, { ...domData, ...data }); // LD takes priority

      // Extract additional HD-specific data
      data.modelNumber = this.extractModelNumber();
      data.internetNumber = this.extractInternetNumber();
      data.storeSkuNumber = this.extractStoreSkuNumber();
      data.specifications = this.extractSpecifications();
      data.availability = this.extractAvailability();

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
                reviewCount: item.aggregateRating?.reviewCount,
                availability: offer?.availability?.includes('InStock') ? 'in_stock' : 'out_of_stock'
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
      const titleEl = document.querySelector('h1.product-title, .product-details__title, [data-testid="product-title"]');
      if (titleEl) data.title = titleEl.textContent.trim();

      // Price
      const priceEl = document.querySelector('.price-format__main-price, [data-testid="price-format"]');
      if (priceEl) {
        const priceText = priceEl.textContent.replace(/[^0-9.]/g, '');
        data.price = parseFloat(priceText) || 0;
      }

      // Original price
      const origPriceEl = document.querySelector('.price-format__was-price');
      if (origPriceEl) {
        data.originalPrice = parseFloat(origPriceEl.textContent.replace(/[^0-9.]/g, '')) || null;
      }

      // Images
      data.images = [];
      const imgEls = document.querySelectorAll('.mediagallery__image img, [data-testid="media-gallery"] img');
      imgEls.forEach(img => {
        const src = img.src || img.dataset.src;
        if (src && !data.images.includes(src)) {
          // Get high-res version
          const hiRes = src.replace(/_\d+\./g, '_1000.');
          data.images.push(hiRes);
        }
      });
      if (data.images.length) data.image = data.images[0];

      // Rating
      const ratingEl = document.querySelector('.stars-rating__star-count');
      if (ratingEl) {
        data.rating = parseFloat(ratingEl.textContent) || 0;
      }

      // Review count
      const reviewEl = document.querySelector('.ratings-reviews__count');
      if (reviewEl) {
        data.reviewCount = parseInt(reviewEl.textContent.replace(/[^0-9]/g, '')) || 0;
      }

      // Brand
      const brandEl = document.querySelector('.product-details__brand a, [data-testid="product-brand"]');
      if (brandEl) data.brand = brandEl.textContent.trim();

      // Description
      const descEl = document.querySelector('.product-overview__content, [data-testid="product-overview"]');
      if (descEl) data.description = descEl.textContent.trim().substring(0, 2000);

      return data;
    }

    extractModelNumber() {
      const el = document.querySelector('[data-testid="model-number"], .product-info-bar__detail--model');
      return el?.textContent?.replace(/Model\s*#?\s*/i, '').trim() || null;
    }

    extractInternetNumber() {
      const el = document.querySelector('[data-testid="internet-number"], .product-info-bar__detail--internet');
      return el?.textContent?.replace(/Internet\s*#?\s*/i, '').trim() || null;
    }

    extractStoreSkuNumber() {
      const el = document.querySelector('[data-testid="store-sku"], .product-info-bar__detail--sku');
      return el?.textContent?.replace(/Store SKU\s*#?\s*/i, '').trim() || null;
    }

    extractSpecifications() {
      const specs = {};
      const specItems = document.querySelectorAll('.specifications__content .specification, [data-testid="specifications"] li');
      specItems.forEach(item => {
        const label = item.querySelector('.specification__name')?.textContent?.trim();
        const value = item.querySelector('.specification__value')?.textContent?.trim();
        if (label && value) specs[label] = value;
      });
      return Object.keys(specs).length ? specs : null;
    }

    extractAvailability() {
      const availEl = document.querySelector('[data-testid="fulfillment-message"], .fulfillment-options__message');
      if (!availEl) return 'unknown';
      
      const text = availEl.textContent.toLowerCase();
      if (text.includes('in stock') || text.includes('available')) return 'in_stock';
      if (text.includes('out of stock') || text.includes('unavailable')) return 'out_of_stock';
      if (text.includes('limited')) return 'limited';
      return 'unknown';
    }

    async extractFromListing() {
      const products = [];
      const cards = document.querySelectorAll('[data-testid="product-pod"], .product-pod');

      cards.forEach((card, index) => {
        const product = {
          platform: this.platform,
          scrapedAt: new Date().toISOString(),
          source: 'listing'
        };

        // Title
        const titleEl = card.querySelector('[data-testid="product-title"] a, .product-pod__title a');
        product.title = titleEl?.textContent?.trim() || `Home Depot Product ${index + 1}`;
        product.url = titleEl?.href;

        // Price
        const priceEl = card.querySelector('[data-testid="price-format"]');
        product.price = parseFloat(priceEl?.textContent?.replace(/[^0-9.]/g, '')) || 0;

        // Image
        const imgEl = card.querySelector('img');
        product.image = imgEl?.src || imgEl?.dataset.src;

        // Rating
        const ratingEl = card.querySelector('.stars-rating');
        product.rating = parseFloat(ratingEl?.getAttribute('data-rating')) || 0;

        // Brand
        const brandEl = card.querySelector('[data-testid="product-brand"]');
        product.brand = brandEl?.textContent?.trim();

        if (product.title && product.url) {
          products.push(product);
        }
      });

      return products;
    }
  }

  window.DropCraftHomeDepotExtractor = HomeDepotExtractor;
  window.__dcPlatformExtractor = new HomeDepotExtractor();
})();
