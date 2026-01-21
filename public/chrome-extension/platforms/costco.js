/**
 * Drop Craft AI - Costco Platform Extractor
 * Extracts product data from costco.com
 */

(function() {
  'use strict';

  if (window.__dcCostcoLoaded) return;
  window.__dcCostcoLoaded = true;

  class CostcoExtractor {
    constructor() {
      this.platform = 'costco';
    }

    async extractProduct() {
      const data = {
        platform: this.platform,
        url: window.location.href,
        scrapedAt: new Date().toISOString()
      };

      // Try JSON-LD
      const ldData = this.extractFromJsonLD();
      if (ldData) Object.assign(data, ldData);

      // DOM extraction
      const domData = this.extractFromDOM();
      Object.assign(data, { ...domData, ...data });

      // Costco specific
      data.itemNumber = this.extractItemNumber();
      data.specifications = this.extractSpecifications();
      data.memberPrice = this.extractMemberPrice();
      data.availability = this.extractAvailability();
      data.shippingInfo = this.extractShippingInfo();

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
      const titleEl = document.querySelector('h1[itemprop="name"], .product-title, h1.product-h1-container');
      if (titleEl) data.title = titleEl.textContent.trim();

      // Price
      const priceEl = document.querySelector('.price, [data-automation="item-price"]');
      if (priceEl) {
        const priceText = priceEl.textContent.replace(/[^0-9.]/g, '');
        data.price = parseFloat(priceText) || 0;
      }

      // Images
      data.images = [];
      const imgEls = document.querySelectorAll('.product-image-viewer img, .thumbnail-images img, [data-automation="main-image"] img');
      imgEls.forEach(img => {
        let src = img.src || img.dataset.src;
        if (src) {
          // Get high-res version by removing resize params
          src = src.replace(/\?.*/, '').replace(/_\d+\./g, '.');
          if (!data.images.includes(src)) data.images.push(src);
        }
      });
      if (data.images.length) data.image = data.images[0];

      // Rating
      const ratingEl = document.querySelector('[itemprop="ratingValue"], .ratings-average');
      if (ratingEl) {
        data.rating = parseFloat(ratingEl.textContent || ratingEl.content) || 0;
      }

      // Review count
      const reviewEl = document.querySelector('[itemprop="reviewCount"], .ratings-count');
      if (reviewEl) {
        data.reviewCount = parseInt(reviewEl.textContent.replace(/[^0-9]/g, '')) || 0;
      }

      // Brand
      const brandEl = document.querySelector('[itemprop="brand"], .product-brand');
      if (brandEl) data.brand = brandEl.textContent.trim();

      // Description
      const descEl = document.querySelector('[itemprop="description"], .product-description');
      if (descEl) data.description = descEl.textContent.trim().substring(0, 2000);

      return data;
    }

    extractItemNumber() {
      const el = document.querySelector('.product-code, [data-automation="item-code"]');
      if (!el) return null;
      const match = el.textContent.match(/\d+/);
      return match ? match[0] : null;
    }

    extractMemberPrice() {
      const el = document.querySelector('.member-price, [data-automation="member-price"]');
      if (!el) return null;
      return parseFloat(el.textContent.replace(/[^0-9.]/g, '')) || null;
    }

    extractSpecifications() {
      const specs = {};
      const rows = document.querySelectorAll('.product-specs tr, .specifications-table tr');
      
      rows.forEach(row => {
        const cells = row.querySelectorAll('td, th');
        if (cells.length >= 2) {
          const label = cells[0].textContent.trim();
          const value = cells[1].textContent.trim();
          if (label && value) specs[label] = value;
        }
      });

      return Object.keys(specs).length ? specs : null;
    }

    extractAvailability() {
      const availEl = document.querySelector('.inventory-message, [data-automation="availability"]');
      if (!availEl) return 'unknown';
      
      const text = availEl.textContent.toLowerCase();
      if (text.includes('in stock') || text.includes('available')) return 'in_stock';
      if (text.includes('out of stock') || text.includes('sold out')) return 'out_of_stock';
      if (text.includes('limited')) return 'limited';
      if (text.includes('warehouse only')) return 'warehouse_only';
      return 'unknown';
    }

    extractShippingInfo() {
      const shippingEl = document.querySelector('.delivery-message, [data-automation="shipping-info"]');
      if (!shippingEl) return null;
      
      return {
        message: shippingEl.textContent.trim(),
        freeShipping: shippingEl.textContent.toLowerCase().includes('free'),
        estimatedDelivery: null
      };
    }

    async extractFromListing() {
      const products = [];
      const cards = document.querySelectorAll('.product-tile, [data-automation="product-tile"]');

      cards.forEach((card, index) => {
        const product = {
          platform: this.platform,
          scrapedAt: new Date().toISOString(),
          source: 'listing'
        };

        // Title & URL
        const titleEl = card.querySelector('.description a, [data-automation="product-title"] a');
        product.title = titleEl?.textContent?.trim() || `Costco Product ${index + 1}`;
        product.url = titleEl?.href;

        // Price
        const priceEl = card.querySelector('.price, [data-automation="price"]');
        product.price = parseFloat(priceEl?.textContent?.replace(/[^0-9.]/g, '')) || 0;

        // Image
        const imgEl = card.querySelector('img[data-automation="product-image"], .product-img img');
        product.image = imgEl?.src || imgEl?.dataset.src;

        // Rating
        const ratingEl = card.querySelector('.ratings');
        if (ratingEl) {
          const stars = ratingEl.querySelectorAll('.filled, .star-filled').length;
          product.rating = stars || 0;
        }

        if (product.title && product.url) {
          products.push(product);
        }
      });

      return products;
    }
  }

  window.DropCraftCostcoExtractor = CostcoExtractor;
  window.__dcPlatformExtractor = new CostcoExtractor();
})();
