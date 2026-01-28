/**
 * ShopOpti+ DHgate Extractor v5.7.0
 * High-fidelity extraction for DHgate product pages
 * Wholesale B2B focused with bulk pricing tiers
 */

(function() {
  'use strict';

  if (window.__shopoptiDHgateExtractorLoaded) return;
  window.__shopoptiDHgateExtractorLoaded = true;

  class DHgateExtractor {
    constructor() {
      this.platform = 'dhgate';
      this.productId = this.extractProductId();
    }

    extractProductId() {
      const patterns = [
        /product\/(\d+)\.html/i,
        /\/(\d{9,})\.html/,
        /itemcode[=:](\d+)/i
      ];
      
      for (const pattern of patterns) {
        const match = window.location.href.match(pattern);
        if (match) return match[1];
      }
      return null;
    }

    async extractComplete() {
      console.log('[ShopOpti+ DHgate] Starting extraction for product:', this.productId);

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
        platform: 'dhgate',
        extractedAt: new Date().toISOString(),
        ...basicInfo,
        ...pricing,
        images,
        videos: await this.extractVideos(),
        variants,
        reviews,
        specifications: await this.extractSpecifications(),
        bulkPricing: await this.extractBulkPricing(),
        seller: await this.extractSellerInfo()
      };
    }

    async extractBasicInfo() {
      const title = document.querySelector('.product-name h1, .goodsTitle, [class*="ProductName"]')?.textContent?.trim() || '';
      
      let description = '';
      const descEl = document.querySelector('.product-description, .goodsDesc, [class*="Description"]');
      if (descEl) {
        description = descEl.textContent?.trim()?.substring(0, 8000) || '';
      }

      return {
        title,
        brand: document.querySelector('.product-brand, .goodsBrand')?.textContent?.trim() || '',
        description,
        sku: document.querySelector('.product-sku, .goodsSku')?.textContent?.replace(/Item#:\s*/i, '')?.trim() || this.productId
      };
    }

    async extractPricing() {
      let price = 0;
      let originalPrice = null;
      let currency = 'USD';
      let minOrder = 1;

      const priceEl = document.querySelector('.product-price .now, .goodsPrice .current, [class*="CurrentPrice"]');
      if (priceEl) {
        const parsed = this.parsePrice(priceEl.textContent || '');
        price = parsed.price;
        currency = parsed.currency;
      }

      const originalEl = document.querySelector('.product-price .was, .goodsPrice .origin, [class*="OriginalPrice"], del');
      if (originalEl) {
        const parsed = this.parsePrice(originalEl.textContent || '');
        if (parsed.price > price) originalPrice = parsed.price;
      }

      // Minimum order
      const moqEl = document.querySelector('.min-order, .goodsMoq, [class*="MinOrder"]');
      if (moqEl) {
        const moqMatch = moqEl.textContent?.match(/\d+/);
        if (moqMatch) minOrder = parseInt(moqMatch[0]);
      }

      return { price, originalPrice, currency, minOrder };
    }

    parsePrice(str) {
      if (!str) return { price: 0, currency: 'USD' };
      
      let currency = 'USD';
      if (str.includes('€')) currency = 'EUR';
      else if (str.includes('£')) currency = 'GBP';
      
      const clean = str.replace(/[$€£\sUS]/g, '').replace(',', '.').trim();
      const match = clean.match(/[\d.]+/);
      
      return { price: parseFloat(match?.[0] || 0), currency };
    }

    async extractImages() {
      const images = new Set();

      // Main gallery
      document.querySelectorAll('.product-gallery img, .goodsGallery img, [class*="Gallery"] img').forEach(img => {
        let src = img.dataset.src || img.dataset.original || img.src;
        if (src) {
          src = src.replace(/_\d+x\d+/, '').replace(/small/, 'large');
          if (src.startsWith('//')) src = 'https:' + src;
          if (!src.includes('placeholder')) images.add(src);
        }
      });

      // Thumbnails
      document.querySelectorAll('.product-thumbs img, .goodsThumbs img').forEach(img => {
        let src = img.dataset.src || img.dataset.original || img.src;
        if (src) {
          src = src.replace(/_\d+x\d+/, '').replace(/small/, 'large');
          if (src.startsWith('//')) src = 'https:' + src;
          images.add(src);
        }
      });

      return Array.from(images).filter(url => url?.includes('http')).slice(0, 50);
    }

    async extractVideos() {
      const videos = [];

      document.querySelectorAll('video source, video[src]').forEach(el => {
        const src = el.src || el.getAttribute('src');
        if (src) {
          videos.push({
            url: src.startsWith('//') ? 'https:' + src : src,
            type: 'product',
            source: 'dhgate'
          });
        }
      });

      return videos.slice(0, 10);
    }

    async extractVariants() {
      const variants = [];

      // Color/Size options
      document.querySelectorAll('.product-variant-item, .goodsOption, [class*="VariantItem"]').forEach((item, idx) => {
        const title = item.getAttribute('title') || item.getAttribute('data-value') || item.textContent?.trim();
        const img = item.querySelector('img')?.src;
        const type = item.closest('[class*="color"]') ? 'color' : 
                     item.closest('[class*="size"]') ? 'size' : 'option';
        
        if (title) {
          variants.push({
            id: item.dataset.id || item.dataset.optionId || `var_${idx}`,
            title,
            type,
            image: img?.startsWith('//') ? 'https:' + img : img,
            available: !item.classList.contains('disabled') && !item.classList.contains('soldout')
          });
        }
      });

      return variants;
    }

    async extractReviews() {
      const reviews = [];

      // Summary
      const ratingEl = document.querySelector('.product-rating-score, .goodsRating, [class*="RatingValue"]');
      const countEl = document.querySelector('.product-rating-count, .goodsReviews, [class*="ReviewCount"]');
      
      if (ratingEl) {
        reviews.push({
          type: 'summary',
          averageRating: parseFloat(ratingEl.textContent?.replace(',', '.') || 0),
          totalCount: parseInt(countEl?.textContent?.match(/\d+/)?.[0] || 0)
        });
      }

      // Individual reviews
      document.querySelectorAll('.review-item, .customer-review, [class*="ReviewItem"]').forEach(reviewEl => {
        const author = reviewEl.querySelector('.review-author, .reviewer-name')?.textContent?.trim() || 'Anonymous';
        const stars = reviewEl.querySelectorAll('.star-filled, .star-on').length;
        const content = reviewEl.querySelector('.review-content, .review-text')?.textContent?.trim() || '';
        const date = reviewEl.querySelector('.review-date, .review-time')?.textContent?.trim() || '';
        
        const images = [];
        reviewEl.querySelectorAll('.review-images img').forEach(img => {
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

      return specs;
    }

    async extractBulkPricing() {
      const tiers = [];

      document.querySelectorAll('.bulk-price-tier, .price-tier, [class*="BulkPrice"]').forEach(tierEl => {
        const qty = tierEl.querySelector('.tier-qty, .quantity, [class*="Quantity"]')?.textContent?.trim();
        const price = tierEl.querySelector('.tier-price, .unit-price, [class*="Price"]')?.textContent?.trim();
        
        if (qty && price) {
          const qtyMatch = qty.match(/(\d+)(?:\s*[-–]\s*(\d+))?/);
          tiers.push({
            minQty: qtyMatch ? parseInt(qtyMatch[1]) : 1,
            maxQty: qtyMatch?.[2] ? parseInt(qtyMatch[2]) : null,
            price: this.parsePrice(price).price
          });
        }
      });

      return tiers;
    }

    async extractSellerInfo() {
      const seller = {
        name: '',
        rating: 0,
        transactions: 0,
        positiveFeedback: ''
      };

      seller.name = document.querySelector('.seller-name, .store-name a, [class*="SellerName"]')?.textContent?.trim() || '';
      
      const ratingEl = document.querySelector('.seller-rating, .store-rating, [class*="SellerRating"]');
      if (ratingEl) {
        seller.rating = parseFloat(ratingEl.textContent?.match(/[\d.]+/)?.[0] || 0);
      }

      const transEl = document.querySelector('.seller-transactions, .store-sales, [class*="Transactions"]');
      if (transEl) {
        const transMatch = transEl.textContent?.match(/[\d,]+/);
        seller.transactions = transMatch ? parseInt(transMatch[0].replace(/,/g, '')) : 0;
      }

      const feedbackEl = document.querySelector('.seller-feedback, .positive-feedback, [class*="Feedback"]');
      if (feedbackEl) {
        seller.positiveFeedback = feedbackEl.textContent?.match(/[\d.]+%/)?.[0] || '';
      }

      return seller;
    }
  }

  // Register with ExtractorRegistry
  if (window.ExtractorRegistry) {
    window.ExtractorRegistry.register('dhgate', DHgateExtractor);
  }

  window.DHgateExtractor = DHgateExtractor;
})();
