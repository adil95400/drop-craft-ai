/**
 * ShopOpti+ Shopify Extractor v5.7.0
 * High-fidelity extraction for any Shopify store
 * Extends BaseExtractor - Uses Shopify's JSON API for reliable data capture
 */

(function() {
  'use strict';

  if (window.__shopoptiShopifyExtractorLoaded) return;
  window.__shopoptiShopifyExtractorLoaded = true;

  const BaseExtractor = window.ShopOptiBaseExtractor;

  class ShopifyExtractor extends (BaseExtractor || Object) {
    constructor() {
      if (BaseExtractor) super();
      this.platform = 'shopify';
      this.version = '5.7.0';
      this.productHandle = this.extractProductHandle();
      this.productData = null;
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
      return url.includes('/products/') || 
             url.includes('product.json') ||
             url.includes('/cart/') ||
             url.includes('reviews');
    }

    processInterceptedData(url, data) {
      if (url.includes('review')) {
        this.interceptedData.reviews = data;
      } else if (url.includes('.json')) {
        if (data.product) {
          this.productData = data.product;
        }
        this.interceptedData.product = data;
      }
    }

    extractProductHandle() {
      const match = window.location.pathname.match(/\/products\/([^/?#]+)/);
      return match ? match[1] : null;
    }

    getPlatform() {
      return 'shopify';
    }

    getExternalId() {
      return this.productData?.id?.toString() || this.productHandle;
    }

    async extractComplete() {
      console.log('[ShopOpti+ Shopify v5.7.0] Starting extraction for product:', this.productHandle);

      // Fetch product JSON from Shopify API
      await this.fetchProductData();

      const [basicInfo, pricing, images, variants, reviews] = await Promise.all([
        this.extractBasicInfo(),
        this.extractPricing(),
        this.extractImages(),
        this.extractVariants(),
        this.extractReviews()
      ]);

      return {
        external_id: this.productData?.id?.toString() || this.productHandle,
        url: window.location.href,
        platform: 'shopify',
        storeDomain: window.location.hostname,
        version: this.version,
        extractedAt: new Date().toISOString(),
        ...basicInfo,
        ...pricing,
        images,
        videos: await this.extractVideos(),
        variants,
        reviews,
        metafields: await this.extractMetafields(),
        specifications: {}
      };
    }

    async fetchProductData() {
      if (this.productData) return;

      try {
        // Try the JSON API endpoint
        const response = await fetch(`${window.location.origin}/products/${this.productHandle}.json`);
        if (response.ok) {
          const data = await response.json();
          this.productData = data.product;
          return;
        }
      } catch (e) {}

      // Fallback: extract from page scripts
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        const content = script.textContent || '';
        
        if (content.includes('"product":') || content.includes('ShopifyAnalytics.meta.product')) {
          try {
            // Various patterns for product data
            const patterns = [
              /"product"\s*:\s*(\{[\s\S]+?\})\s*[,}]/,
              /var\s+meta\s*=\s*(\{[\s\S]*?"product"[\s\S]*?\});/,
              /ShopifyAnalytics\.meta\.product\s*=\s*(\{[\s\S]*?\});/
            ];

            for (const pattern of patterns) {
              const match = content.match(pattern);
              if (match) {
                try {
                  this.productData = JSON.parse(match[1]);
                  if (this.productData) return;
                } catch (e) {}
              }
            }
          } catch (e) {}
        }

        // Product JSON-LD
        if (script.type === 'application/ld+json') {
          try {
            const ldData = JSON.parse(content);
            if (ldData['@type'] === 'Product') {
              this.productData = {
                title: ldData.name,
                description: ldData.description,
                vendor: ldData.brand?.name,
                images: ldData.image ? (Array.isArray(ldData.image) ? ldData.image.map(i => ({ src: i })) : [{ src: ldData.image }]) : [],
                variants: ldData.offers ? [{
                  price: ldData.offers.price,
                  available: ldData.offers.availability?.includes('InStock')
                }] : []
              };
            }
          } catch (e) {}
        }
      }
    }

    async extractBasicInfo() {
      if (this.productData) {
        return {
          title: this.productData.title || '',
          brand: this.productData.vendor || '',
          description: this.productData.body_html?.replace(/<[^>]+>/g, ' ').trim() || '',
          sku: this.productData.variants?.[0]?.sku || '',
          tags: this.productData.tags || [],
          productType: this.productData.product_type || ''
        };
      }

      // DOM fallback - 2025 selectors
      const titleSelectors = [
        'h1.product-title',
        'h1[class*="product"]',
        '.product__title',
        '[data-product-title]',
        '[class*="ProductTitle"]'
      ];
      let title = '';
      for (const sel of titleSelectors) {
        const el = document.querySelector(sel);
        if (el?.textContent?.trim()) {
          title = el.textContent.trim();
          break;
        }
      }
      
      const brandSelectors = [
        '.product__vendor',
        '[class*="vendor"]',
        '[data-product-vendor]',
        '[class*="ProductVendor"]'
      ];
      let brand = '';
      for (const sel of brandSelectors) {
        const el = document.querySelector(sel);
        if (el?.textContent?.trim()) {
          brand = el.textContent.trim();
          break;
        }
      }
      
      const descSelectors = [
        '.product-description',
        '.product__description',
        '[class*="description"]',
        '[data-product-description]'
      ];
      let description = '';
      for (const sel of descSelectors) {
        const descEl = document.querySelector(sel);
        if (descEl?.textContent?.trim()) {
          description = descEl.textContent.trim().substring(0, 8000);
          break;
        }
      }

      return {
        title,
        brand,
        description,
        sku: document.querySelector('[class*="sku"], [data-product-sku]')?.textContent?.trim() || ''
      };
    }

    async extractPricing() {
      let price = 0;
      let originalPrice = null;
      let currency = 'EUR';

      if (this.productData?.variants?.length > 0) {
        const variant = this.productData.variants[0];
        // Handle both cents (Shopify API) and dollars (some themes)
        const rawPrice = parseFloat(variant.price);
        price = rawPrice > 1000 ? rawPrice / 100 : rawPrice;
        
        if (variant.compare_at_price) {
          const rawCompare = parseFloat(variant.compare_at_price);
          const comparePrice = rawCompare > 1000 ? rawCompare / 100 : rawCompare;
          if (comparePrice > price) originalPrice = comparePrice;
        }
      } else {
        const priceEl = document.querySelector('.product__price, .price__regular, [class*="price"]:not([class*="compare"])');
        if (priceEl) {
          const parsed = this.parsePrice(priceEl.textContent || '');
          price = parsed.price;
          currency = parsed.currency;
        }

        const compareEl = document.querySelector('.product__price--compare, .price__compare, [class*="compare"]');
        if (compareEl) {
          const parsed = this.parsePrice(compareEl.textContent || '');
          if (parsed.price > price) originalPrice = parsed.price;
        }
      }

      // Detect currency from meta or page
      const currencyMeta = document.querySelector('meta[itemprop="priceCurrency"]');
      if (currencyMeta) {
        currency = currencyMeta.getAttribute('content') || currency;
      }

      return { price, originalPrice, currency };
    }

    parsePrice(str) {
      if (!str) return { price: 0, currency: 'EUR' };
      
      let currency = 'EUR';
      if (str.includes('$') || str.includes('USD')) currency = 'USD';
      else if (str.includes('£') || str.includes('GBP')) currency = 'GBP';
      else if (str.includes('CAD')) currency = 'CAD';
      
      const clean = str.replace(/[€$£\s,CAD]/g, '').trim();
      const match = clean.match(/[\d.]+/);
      
      return { price: parseFloat(match?.[0] || 0), currency };
    }

    async extractImages() {
      const images = new Set();

      if (this.productData?.images) {
        this.productData.images.forEach(img => {
          let src = img.src || img;
          if (src) {
            // Get highest resolution
            src = src.replace(/_(pico|icon|thumb|small|compact|medium|large|grande|original|1024x1024|2048x2048)\./, '.');
            src = src.replace(/\?v=\d+/, '');
            images.add(src);
          }
        });
      }

      // Gallery images
      const gallerySelectors = [
        '.product__media img',
        '.product-gallery img',
        '[class*="gallery"] img',
        '[data-product-media-type="image"] img',
        '.product__photos img',
        '.product-single__media img'
      ];

      for (const sel of gallerySelectors) {
        document.querySelectorAll(sel).forEach(img => {
          let src = img.dataset.src || img.src;
          if (src) {
            src = src.replace(/_(pico|icon|thumb|small|compact|medium|large|grande|original|1024x1024|2048x2048)\./, '.');
            if (!src.includes('placeholder')) images.add(src);
          }
        });
      }

      // Featured image
      const featuredImg = document.querySelector('.product__media-item--featured img, .product-featured-image');
      if (featuredImg) {
        let src = featuredImg.dataset.src || featuredImg.src;
        if (src) {
          src = src.replace(/_(pico|icon|thumb|small|compact|medium|large|grande|original|1024x1024|2048x2048)\./, '.');
          images.add(src);
        }
      }

      return Array.from(images).filter(url => url?.includes('http') || url?.includes('//')).slice(0, 50);
    }

    async extractVideos() {
      const videos = [];

      // Shopify hosted videos
      document.querySelectorAll('[data-product-media-type="video"] source, .product-video source').forEach(source => {
        const src = source.src || source.getAttribute('src');
        if (src) {
          videos.push({
            url: src,
            type: 'product',
            source: 'shopify'
          });
        }
      });

      // External videos (YouTube, Vimeo)
      document.querySelectorAll('[data-product-media-type="external_video"] iframe, .product-video iframe').forEach(iframe => {
        const src = iframe.src;
        if (src) {
          videos.push({
            url: src,
            type: 'external',
            source: src.includes('youtube') ? 'youtube' : src.includes('vimeo') ? 'vimeo' : 'unknown'
          });
        }
      });

      return videos.slice(0, 10);
    }

    async extractVariants() {
      const variants = [];

      if (this.productData?.variants) {
        this.productData.variants.forEach(variant => {
          const rawPrice = parseFloat(variant.price);
          const price = rawPrice > 1000 ? rawPrice / 100 : rawPrice;
          
          let compareAtPrice = null;
          if (variant.compare_at_price) {
            const rawCompare = parseFloat(variant.compare_at_price);
            compareAtPrice = rawCompare > 1000 ? rawCompare / 100 : rawCompare;
          }

          variants.push({
            id: variant.id?.toString(),
            title: variant.title,
            sku: variant.sku,
            price: price,
            compareAtPrice: compareAtPrice,
            available: variant.available,
            options: [variant.option1, variant.option2, variant.option3].filter(Boolean),
            image: variant.featured_image?.src
          });
        });
      } else {
        // DOM fallback
        document.querySelectorAll('.product__variant-picker option, select[name*="option"] option').forEach((opt, idx) => {
          if (opt.value) {
            variants.push({
              id: opt.value || `var_${idx}`,
              title: opt.textContent?.trim() || '',
              available: !opt.disabled
            });
          }
        });

        // Swatch/button variants
        document.querySelectorAll('[data-option-value], .product__variant-button').forEach((item, idx) => {
          const title = item.getAttribute('data-option-value') || item.textContent?.trim();
          if (title) {
            variants.push({
              id: `btn_${idx}`,
              title,
              available: !item.classList.contains('disabled') && !item.hasAttribute('disabled')
            });
          }
        });
      }

      return variants;
    }

    async extractReviews() {
      const reviews = [];

      // Many Shopify stores use apps like Judge.me, Yotpo, Loox, etc.
      const reviewAppSelectors = {
        'judgeme': { 
          container: '.jdgm-rev', 
          author: '.jdgm-rev__author', 
          body: '.jdgm-rev__body',
          rating: '[data-rating]',
          date: '.jdgm-rev__timestamp'
        },
        'yotpo': {
          container: '.yotpo-review',
          author: '.yotpo-user-name',
          body: '.content-review',
          rating: '.sr-only',
          date: '.yotpo-review-date'
        },
        'loox': {
          container: '.loox-review',
          author: '.loox-review-author',
          body: '.loox-review-content',
          rating: '.loox-rating',
          date: '.loox-review-date'
        },
        'stamped': {
          container: '.stamped-review',
          author: '.author',
          body: '.stamped-review-content-body',
          rating: '[data-rating]',
          date: '.created'
        }
      };

      // Rating summary
      const ratingEl = document.querySelector('[class*="rating"] [class*="average"], .jdgm-prev-badge__stars, .yotpo-stars, .stamped-badge');
      const countEl = document.querySelector('[class*="review-count"], .jdgm-prev-badge__text, .yotpo-reviews-num');
      
      if (ratingEl) {
        const ratingAttr = ratingEl.getAttribute('data-rating') || ratingEl.getAttribute('data-score');
        const rating = ratingAttr ? parseFloat(ratingAttr) : 
          (ratingEl.querySelectorAll('.filled, .on, [class*="full"]').length || 0);
        const count = parseInt(countEl?.textContent?.match(/\d+/)?.[0] || 0);
        
        reviews.push({
          type: 'summary',
          averageRating: rating,
          totalCount: count
        });
      }

      // Extract reviews from various apps
      for (const [appName, selectors] of Object.entries(reviewAppSelectors)) {
        document.querySelectorAll(selectors.container).forEach(reviewEl => {
          const author = reviewEl.querySelector(selectors.author)?.textContent?.trim() || 'Anonymous';
          const starsEl = reviewEl.querySelector(selectors.rating);
          const stars = starsEl?.getAttribute('data-rating') || 
            starsEl?.querySelectorAll('.filled, .on, [class*="full"]').length || 5;
          const content = reviewEl.querySelector(selectors.body)?.textContent?.trim() || '';
          const date = reviewEl.querySelector(selectors.date)?.textContent?.trim() || '';
          
          const images = [];
          reviewEl.querySelectorAll('[class*="photo"] img, [class*="image"] img').forEach(img => {
            const src = img.src || img.dataset.src;
            if (src) images.push(src);
          });

          if (content) {
            reviews.push({
              author,
              rating: parseInt(stars) || 5,
              content,
              date,
              images,
              source: appName
            });
          }
        });
      }

      return reviews.slice(0, 100);
    }

    async extractMetafields() {
      const metafields = {};

      // Try to get metafields from product data
      if (this.productData?.metafields) {
        this.productData.metafields.forEach(mf => {
          metafields[`${mf.namespace}.${mf.key}`] = mf.value;
        });
      }

      return metafields;
    }
  }

  // Register with ExtractorRegistry
  if (window.ExtractorRegistry) {
    window.ExtractorRegistry.register('shopify', ShopifyExtractor);
  }

  window.ShopifyExtractor = ShopifyExtractor;
  window.ShopOptiShopifyExtractor = ShopifyExtractor;
  console.log('[ShopOpti+] Shopify Extractor v5.7.0 loaded');
})();
