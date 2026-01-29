/**
 * ShopOpti+ Banggood Extractor v5.7.0
 * High-fidelity extraction for Banggood product pages
 * Electronics & gadgets focused with warehouse selection
 */

(function() {
  'use strict';

  if (window.__shopoptiBanggoodExtractorLoaded) return;
  window.__shopoptiBanggoodExtractorLoaded = true;

  class BanggoodExtractor {
    constructor() {
      this.platform = 'banggood';
      this.productId = this.extractProductId();
    }

    extractProductId() {
      const patterns = [
        /-p-(\d+)\.html/i,
        /products\/(\d+)/i,
        /poa-(\d+)/i
      ];
      
      for (const pattern of patterns) {
        const match = window.location.href.match(pattern);
        if (match) return match[1];
      }
      return null;
    }

    async extractComplete() {
      console.log('[ShopOpti+ Banggood] Starting extraction for product:', this.productId);

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
        platform: 'banggood',
        extractedAt: new Date().toISOString(),
        ...basicInfo,
        ...pricing,
        images,
        videos: await this.extractVideos(),
        variants,
        reviews,
        specifications: await this.extractSpecifications(),
        warehouses: await this.extractWarehouses()
      };
    }

    async extractBasicInfo() {
      // 2025 selectors for Banggood
      const titleSelectors = [
        '.product-title h1',
        '.goodsIntro_title',
        '[class*="ProductTitle"]',
        '[data-testid="product-title"]',
        'h1[class*="title"]'
      ];
      let title = '';
      for (const sel of titleSelectors) {
        const el = document.querySelector(sel);
        if (el?.textContent?.trim()) {
          title = el.textContent.trim();
          break;
        }
      }
      
      const descSelectors = [
        '.product-description',
        '.goodsIntro_content',
        '[class*="Description"]',
        '[data-testid="product-description"]'
      ];
      let description = '';
      for (const sel of descSelectors) {
        const descEl = document.querySelector(sel);
        if (descEl?.textContent?.trim()) {
          description = descEl.textContent.trim().substring(0, 8000);
          break;
        }
      }

      const brandSelectors = [
        '.product-brand a',
        '.goodsIntro_brand',
        '[class*="Brand"]',
        '[data-testid="product-brand"]'
      ];
      let brand = '';
      for (const sel of brandSelectors) {
        const el = document.querySelector(sel);
        if (el?.textContent?.trim()) {
          brand = el.textContent.trim();
          break;
        }
      }

      return {
        title,
        brand,
        description,
        sku: document.querySelector('.product-sku, .goodsIntro_sku, [data-testid="product-sku"]')?.textContent?.replace(/SKU:\s*/i, '')?.trim() || this.productId
      };
    }

    async extractPricing() {
      let price = 0;
      let originalPrice = null;
      let currency = 'USD';

      const priceEl = document.querySelector('.product-price .main-price, .goodsIntro_price .now, [class*="CurrentPrice"]');
      if (priceEl) {
        const parsed = this.parsePrice(priceEl.textContent || '');
        price = parsed.price;
        currency = parsed.currency;
      }

      const originalEl = document.querySelector('.product-price .origin-price, .goodsIntro_price .was, [class*="OriginalPrice"], del');
      if (originalEl) {
        const parsed = this.parsePrice(originalEl.textContent || '');
        if (parsed.price > price) originalPrice = parsed.price;
      }

      // Discount percentage
      const discountEl = document.querySelector('.product-discount, .goodsIntro_discount, [class*="Discount"]');
      const discount = discountEl?.textContent?.match(/(\d+)%/)?.[1];

      return { price, originalPrice, currency, discountPercent: discount ? parseInt(discount) : null };
    }

    parsePrice(str) {
      if (!str) return { price: 0, currency: 'USD' };
      
      let currency = 'USD';
      if (str.includes('€')) currency = 'EUR';
      else if (str.includes('£')) currency = 'GBP';
      
      const clean = str.replace(/[$€£\s]/g, '').replace(',', '.').trim();
      const match = clean.match(/[\d.]+/);
      
      return { price: parseFloat(match?.[0] || 0), currency };
    }

    async extractImages() {
      const images = new Set();

      // Main gallery - 2025 selectors
      const gallerySelectors = [
        '.product-gallery img',
        '.goodsIntro_gallery img',
        '[class*="Gallery"] img',
        '[data-testid="product-gallery"] img',
        '[class*="ProductImage"] img'
      ];
      
      for (const sel of gallerySelectors) {
        document.querySelectorAll(sel).forEach(img => {
          let src = img.dataset.src || img.dataset.lazy || img.dataset.original || img.src;
          if (src) {
            // Get high resolution
            src = src.replace(/_\d+x\d+/, '').replace(/thumb_/, '').replace(/_S/, '_L');
            if (src.startsWith('//')) src = 'https:' + src;
            if (!src.includes('placeholder') && !src.includes('loading')) images.add(src);
          }
        });
      }

      // Thumbnails - 2025 selectors
      const thumbSelectors = [
        '.product-thumbs img',
        '.goodsIntro_thumbs img',
        '[data-testid="thumbnail"] img',
        '[class*="Thumbnail"] img'
      ];
      
      for (const sel of thumbSelectors) {
        document.querySelectorAll(sel).forEach(img => {
          let src = img.dataset.src || img.dataset.lazy || img.dataset.original || img.src;
          if (src) {
            src = src.replace(/_\d+x\d+/, '').replace(/thumb_/, '').replace(/_S/, '_L');
            if (src.startsWith('//')) src = 'https:' + src;
            images.add(src);
          }
        });
      }

      return Array.from(images).filter(url => url?.includes('http')).slice(0, 50);
    }

    async extractVideos() {
      const videos = [];

      document.querySelectorAll('video source, video[src], [class*="video"] source').forEach(el => {
        const src = el.src || el.getAttribute('src');
        if (src) {
          videos.push({
            url: src.startsWith('//') ? 'https:' + src : src,
            type: 'product',
            source: 'banggood'
          });
        }
      });

      // YouTube embeds
      document.querySelectorAll('iframe[src*="youtube"]').forEach(iframe => {
        videos.push({
          url: iframe.src,
          type: 'external',
          source: 'youtube'
        });
      });

      return videos.slice(0, 10);
    }

    async extractVariants() {
      const variants = [];

      // Variant options
      document.querySelectorAll('.product-option-item, .goodsIntro_option, [class*="VariantItem"]').forEach((item, idx) => {
        const title = item.getAttribute('title') || item.getAttribute('data-value') || item.textContent?.trim();
        const img = item.querySelector('img')?.src;
        const priceEl = item.querySelector('.option-price, [class*="Price"]');
        const price = priceEl ? this.parsePrice(priceEl.textContent || '').price : null;
        
        if (title) {
          variants.push({
            id: item.dataset.id || item.dataset.skuId || `var_${idx}`,
            title,
            image: img,
            price,
            available: !item.classList.contains('disabled') && !item.classList.contains('soldout')
          });
        }
      });

      return variants;
    }

    async extractReviews() {
      const reviews = [];

      // Summary
      const ratingEl = document.querySelector('.product-rating-score, .goodsIntro_rating, [class*="RatingValue"]');
      const countEl = document.querySelector('.product-rating-count, .goodsIntro_reviews, [class*="ReviewCount"]');
      
      if (ratingEl) {
        reviews.push({
          type: 'summary',
          averageRating: parseFloat(ratingEl.textContent?.replace(',', '.') || 0),
          totalCount: parseInt(countEl?.textContent?.match(/\d+/)?.[0] || 0)
        });
      }

      // Individual reviews
      document.querySelectorAll('.review-item, .customer-review, [class*="ReviewItem"]').forEach(reviewEl => {
        const author = reviewEl.querySelector('.review-author, .reviewer-name, [class*="Author"]')?.textContent?.trim() || 'Anonymous';
        const stars = reviewEl.querySelectorAll('.star-filled, .star-on, [class*="Star"][class*="filled"]').length;
        const content = reviewEl.querySelector('.review-content, .review-text, [class*="Content"]')?.textContent?.trim() || '';
        const date = reviewEl.querySelector('.review-date, .review-time, [class*="Date"]')?.textContent?.trim() || '';
        
        const images = [];
        reviewEl.querySelectorAll('.review-images img, .review-photos img').forEach(img => {
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

      document.querySelectorAll('.product-specs tr, .specs-item, [class*="Specification"] tr').forEach(row => {
        const key = row.querySelector('td:first-child, th, .spec-label')?.textContent?.trim();
        const value = row.querySelector('td:last-child, .spec-value')?.textContent?.trim();
        if (key && value && key !== value) specs[key] = value;
      });

      // Package contents
      const packageEl = document.querySelector('.package-contents, [class*="Package"]');
      if (packageEl) {
        specs['Package Contents'] = packageEl.textContent?.trim() || '';
      }

      return specs;
    }

    async extractWarehouses() {
      const warehouses = [];

      document.querySelectorAll('.warehouse-item, .ship-from-item, [class*="Warehouse"]').forEach(item => {
        const name = item.querySelector('.warehouse-name, [class*="Name"]')?.textContent?.trim();
        const stock = item.querySelector('.warehouse-stock, [class*="Stock"]')?.textContent?.trim();
        const delivery = item.querySelector('.warehouse-delivery, [class*="Delivery"]')?.textContent?.trim();
        const price = item.querySelector('.warehouse-price, [class*="Price"]')?.textContent?.trim();
        
        if (name) {
          warehouses.push({
            name,
            inStock: !stock?.toLowerCase().includes('out'),
            deliveryTime: delivery || '',
            price: price || ''
          });
        }
      });

      return warehouses;
    }
  }

  // Register with ExtractorRegistry
  if (window.ExtractorRegistry) {
    window.ExtractorRegistry.register('banggood', BanggoodExtractor);
  }

  window.BanggoodExtractor = BanggoodExtractor;
})();
