/**
 * ShopOpti+ CJ Dropshipping Extractor v5.7.0
 * High-fidelity extraction for CJ Dropshipping product pages
 * B2B focused with supplier pricing and MOQ support
 */

(function() {
  'use strict';

  if (window.__shopoptiCJExtractorLoaded) return;
  window.__shopoptiCJExtractorLoaded = true;

  class CJDropshippingExtractor {
    constructor() {
      this.platform = 'cjdropshipping';
      this.productId = this.extractProductId();
    }

    extractProductId() {
      const patterns = [
        /product-detail\/(\d+)/i,
        /productId[=:](\d+)/i,
        /\/p-(\d+)/i
      ];
      
      for (const pattern of patterns) {
        const match = window.location.href.match(pattern);
        if (match) return match[1];
      }
      return null;
    }

    async extractComplete() {
      console.log('[ShopOpti+ CJ] Starting extraction for product:', this.productId);

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
        platform: 'cjdropshipping',
        extractedAt: new Date().toISOString(),
        ...basicInfo,
        ...pricing,
        images,
        videos: await this.extractVideos(),
        variants,
        reviews,
        specifications: await this.extractSpecifications(),
        shipping: await this.extractShipping(),
        supplier: await this.extractSupplierInfo()
      };
    }

    async extractBasicInfo() {
      const title = document.querySelector('.product-info-name, h1.product-title, .goods-name')?.textContent?.trim() || '';
      
      let description = '';
      const descEl = document.querySelector('.product-description, .goods-desc, [class*="Description"]');
      if (descEl) {
        description = descEl.textContent?.trim()?.substring(0, 8000) || '';
      }

      const categoryEl = document.querySelector('.product-category, .breadcrumb');
      const category = categoryEl?.textContent?.trim() || '';

      return {
        title,
        brand: 'CJ Dropshipping',
        description,
        sku: document.querySelector('.product-sku, .goods-sku')?.textContent?.replace(/SKU:\s*/i, '')?.trim() || this.productId,
        category
      };
    }

    async extractPricing() {
      let price = 0;
      let originalPrice = null;
      let currency = 'USD';
      let moq = 1;

      // CJ price
      const priceEl = document.querySelector('.product-price-value, .goods-price .current, .cj-price');
      if (priceEl) {
        const parsed = this.parsePrice(priceEl.textContent || '');
        price = parsed.price;
        currency = parsed.currency;
      }

      // Market/retail price
      const marketEl = document.querySelector('.product-price-origin, .goods-price .origin, .market-price');
      if (marketEl) {
        const parsed = this.parsePrice(marketEl.textContent || '');
        if (parsed.price > price) originalPrice = parsed.price;
      }

      // MOQ (Minimum Order Quantity)
      const moqEl = document.querySelector('.product-moq, .min-order, [class*="moq"]');
      if (moqEl) {
        const moqMatch = moqEl.textContent?.match(/\d+/);
        if (moqMatch) moq = parseInt(moqMatch[0]);
      }

      return { price, originalPrice, currency, moq };
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

      // Main gallery
      document.querySelectorAll('.product-gallery img, .goods-gallery img, [class*="ProductImage"] img').forEach(img => {
        let src = img.dataset.src || img.dataset.original || img.src;
        if (src) {
          // Get high resolution
          src = src.replace(/_\d+x\d+/, '').replace(/thumb/, 'original');
          if (src.startsWith('//')) src = 'https:' + src;
          if (!src.includes('placeholder')) images.add(src);
        }
      });

      // Thumbnails
      document.querySelectorAll('.product-thumbs img, .goods-thumbs img').forEach(img => {
        let src = img.dataset.src || img.dataset.original || img.src;
        if (src) {
          src = src.replace(/_\d+x\d+/, '').replace(/thumb/, 'original');
          if (src.startsWith('//')) src = 'https:' + src;
          images.add(src);
        }
      });

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
            source: 'cjdropshipping'
          });
        }
      });

      return videos.slice(0, 10);
    }

    async extractVariants() {
      const variants = [];

      // CJ variant structure
      document.querySelectorAll('.product-variant-item, .sku-item, [class*="VariantOption"]').forEach((item, idx) => {
        const title = item.getAttribute('title') || item.textContent?.trim();
        const img = item.querySelector('img')?.src;
        const priceEl = item.querySelector('.variant-price, .sku-price');
        const price = priceEl ? this.parsePrice(priceEl.textContent || '').price : null;
        const stock = item.querySelector('.variant-stock, .sku-stock')?.textContent?.match(/\d+/)?.[0];
        
        if (title) {
          variants.push({
            id: item.dataset.skuId || `var_${idx}`,
            title,
            image: img,
            price,
            stock: stock ? parseInt(stock) : null,
            available: !item.classList.contains('disabled') && !item.classList.contains('soldout')
          });
        }
      });

      // Select dropdowns
      document.querySelectorAll('select[class*="variant"] option, select[class*="sku"] option').forEach((opt, idx) => {
        if (opt.value && opt.value !== '0') {
          variants.push({
            id: opt.value || `select_${idx}`,
            title: opt.textContent?.trim() || '',
            available: !opt.disabled
          });
        }
      });

      return variants;
    }

    async extractReviews() {
      const reviews = [];

      // Summary
      const ratingEl = document.querySelector('.product-rating-score, .goods-rating-value');
      const countEl = document.querySelector('.product-rating-count, .goods-rating-count');
      
      if (ratingEl) {
        reviews.push({
          type: 'summary',
          averageRating: parseFloat(ratingEl.textContent?.replace(',', '.') || 0),
          totalCount: parseInt(countEl?.textContent?.match(/\d+/)?.[0] || 0)
        });
      }

      // Individual reviews
      document.querySelectorAll('.review-item, .product-review-item').forEach(reviewEl => {
        const author = reviewEl.querySelector('.review-author, .reviewer-name')?.textContent?.trim() || 'Anonymous';
        const stars = reviewEl.querySelectorAll('.star-filled, .star-on').length;
        const content = reviewEl.querySelector('.review-content, .review-text')?.textContent?.trim() || '';
        const date = reviewEl.querySelector('.review-date, .review-time')?.textContent?.trim() || '';
        
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

      document.querySelectorAll('.product-specs tr, .goods-specs-item, [class*="Specification"] [class*="Row"]').forEach(row => {
        const key = row.querySelector('td:first-child, .spec-label, [class*="Label"]')?.textContent?.trim();
        const value = row.querySelector('td:last-child, .spec-value, [class*="Value"]')?.textContent?.trim();
        if (key && value && key !== value) specs[key] = value;
      });

      // Weight and dimensions (important for dropshipping)
      const weightEl = document.querySelector('[class*="weight"]');
      if (weightEl) {
        const weight = weightEl.textContent?.trim();
        if (weight) specs['Weight'] = weight;
      }

      const dimensionsEl = document.querySelector('[class*="dimension"], [class*="size"]');
      if (dimensionsEl) {
        const dimensions = dimensionsEl.textContent?.trim();
        if (dimensions) specs['Dimensions'] = dimensions;
      }

      return specs;
    }

    async extractShipping() {
      const shipping = {
        methods: [],
        processingTime: '',
        freeShipping: false
      };

      // Shipping methods
      document.querySelectorAll('.shipping-method-item, .logistics-item').forEach(item => {
        const name = item.querySelector('.method-name, .logistics-name')?.textContent?.trim();
        const time = item.querySelector('.delivery-time, .logistics-time')?.textContent?.trim();
        const cost = item.querySelector('.shipping-cost, .logistics-price')?.textContent?.trim();
        
        if (name) {
          const method = { name, deliveryTime: time || '', cost: cost || '' };
          shipping.methods.push(method);
          
          if (cost?.toLowerCase().includes('free') || cost === '0' || cost === '$0.00') {
            shipping.freeShipping = true;
          }
        }
      });

      // Processing time
      const processingEl = document.querySelector('.processing-time, .handle-time');
      if (processingEl) {
        shipping.processingTime = processingEl.textContent?.trim() || '';
      }

      return shipping;
    }

    async extractSupplierInfo() {
      return {
        name: 'CJ Dropshipping',
        type: 'dropshipping',
        fulfillmentService: true
      };
    }
  }

  // Register with ExtractorRegistry
  if (window.ExtractorRegistry) {
    window.ExtractorRegistry.register('cjdropshipping', CJDropshippingExtractor);
  }

  window.CJDropshippingExtractor = CJDropshippingExtractor;
})();
