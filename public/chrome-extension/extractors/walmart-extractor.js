/**
 * ShopOpti+ Walmart Extractor v5.7.0
 * High-fidelity extraction for Walmart product pages
 * US Market - Extracts: Images, Variants, Reviews, Specifications
 */

(function() {
  'use strict';

  if (window.__shopoptiWalmartExtractorLoaded) return;
  window.__shopoptiWalmartExtractorLoaded = true;

  class WalmartExtractor {
    constructor() {
      this.platform = 'walmart';
      this.productId = this.extractProductId();
      this.pageData = null;
    }

    /**
     * Extract product ID from URL
     */
    extractProductId() {
      // Pattern: /ip/PRODUCTNAME/123456789
      const match = window.location.href.match(/\/ip\/[^\/]+\/(\d+)/i);
      if (match) return match[1];

      // Alternative pattern
      const altMatch = window.location.href.match(/\/ip\/(\d+)/i);
      if (altMatch) return altMatch[1];

      return null;
    }

    /**
     * Try to get page data from window objects
     */
    getPageData() {
      if (this.pageData) return this.pageData;

      // Try window.__PRELOADED_STATE__
      if (window.__PRELOADED_STATE__) {
        this.pageData = window.__PRELOADED_STATE__;
        return this.pageData;
      }

      // Try parsing from scripts
      const scripts = document.querySelectorAll('script:not([src])');
      for (const script of scripts) {
        const content = script.textContent;
        
        const stateMatch = content.match(/__PRELOADED_STATE__\s*=\s*(\{[\s\S]*?\});/);
        if (stateMatch) {
          try {
            this.pageData = JSON.parse(stateMatch[1]);
            return this.pageData;
          } catch (e) {}
        }
      }

      return null;
    }

    /**
     * Main extraction method
     */
    async extractComplete() {
      console.log('[ShopOpti+ Walmart] Starting extraction, Product ID:', this.productId);

      this.getPageData();

      const [basicInfo, pricing, images, videos, variants, reviews, specifications] = await Promise.all([
        this.extractBasicInfo(),
        this.extractPricing(),
        this.extractImages(),
        this.extractVideos(),
        this.extractVariants(),
        this.extractReviews(),
        this.extractSpecifications()
      ]);

      const productData = {
        external_id: this.productId,
        url: window.location.href,
        platform: 'walmart',
        extractedAt: new Date().toISOString(),
        ...basicInfo,
        ...pricing,
        images,
        videos,
        variants,
        reviews,
        specifications
      };

      console.log('[ShopOpti+ Walmart] Extraction complete:', {
        title: productData.title?.substring(0, 50),
        images: images.length,
        variants: variants.length
      });

      return productData;
    }

    /**
     * Extract basic product info
     */
    async extractBasicInfo() {
      // From page data
      if (this.pageData?.product?.products?.[this.productId]) {
        const product = this.pageData.product.products[this.productId];
        return {
          title: product.name || '',
          brand: product.brand || '',
          description: product.shortDescription || product.detailedDescription || '',
          sku: product.usItemId || this.productId
        };
      }

      // JSON-LD fallback
      const jsonLD = this.extractFromJsonLD();
      if (jsonLD.title) return jsonLD;

      // DOM fallback - 2025 selectors
      const titleSelectors = [
        '[itemprop="name"]',
        'h1[class*="prod-title"]',
        'h1.prod-ProductTitle',
        '[data-testid="product-title"]',
        'h1[data-automation-id="product-title"]',
        '[class*="ProductTitle"] h1'
      ];
      let titleEl = null;
      for (const sel of titleSelectors) {
        titleEl = document.querySelector(sel);
        if (titleEl?.textContent?.trim()) break;
      }
      
      const brandSelectors = [
        '[itemprop="brand"]',
        '[class*="brand-link"]',
        '.prod-brandName',
        '[data-testid="product-brand"]',
        '[class*="ProductBrand"] a'
      ];
      let brandEl = null;
      for (const sel of brandSelectors) {
        brandEl = document.querySelector(sel);
        if (brandEl?.textContent?.trim()) break;
      }
      
      const descSelectors = [
        '[itemprop="description"]',
        '.about-desc',
        '.prod-ProductDescription',
        '[data-testid="product-description"]',
        '[class*="ProductDescription"]'
      ];
      let descEl = null;
      for (const sel of descSelectors) {
        descEl = document.querySelector(sel);
        if (descEl?.textContent?.trim()) break;
      }

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
          const items = Array.isArray(data) ? data : [data];
          
          for (const item of items) {
            if (item['@type'] === 'Product') {
              return {
                title: item.name || '',
                description: item.description || '',
                sku: item.sku || item.productID || '',
                brand: typeof item.brand === 'string' ? item.brand : item.brand?.name || ''
              };
            }
          }
        } catch (e) {}
      }
      
      return {};
    }

    /**
     * Extract pricing
     */
    async extractPricing() {
      let price = 0;
      let originalPrice = null;
      const currency = 'USD';

      // From page data
      if (this.pageData?.product?.products?.[this.productId]) {
        const product = this.pageData.product.products[this.productId];
        const priceInfo = product.priceInfo || product.price || {};
        
        price = parseFloat(priceInfo.currentPrice?.price || priceInfo.priceRange?.minPrice || 0);
        originalPrice = parseFloat(priceInfo.wasPrice?.price || priceInfo.listPrice?.price || 0);
        
        if (originalPrice <= price) originalPrice = null;
      }

      // DOM fallback - 2025 selectors
      if (price === 0) {
        const priceSelectors = [
          '[itemprop="price"]',
          '[data-testid="price-wrap"] [class*="price"]',
          '.price-characteristic',
          '.prod-PriceHero span',
          '[data-testid="current-price"]',
          '[class*="CurrentPrice"]',
          '[data-automation-id="product-price"] span'
        ];

        for (const sel of priceSelectors) {
          const el = document.querySelector(sel);
          if (el) {
            price = this.parsePrice(el.textContent || el.getAttribute('content') || '');
            if (price > 0) break;
          }
        }

        // Original price - 2025 selectors
        const originalSelectors = [
          '.price-old',
          'del.price',
          '[class*="strike"]',
          '[class*="was-price"]',
          '[data-testid="list-price"]',
          '[class*="ComparePrice"]'
        ];
        for (const sel of originalSelectors) {
          const el = document.querySelector(sel);
          if (el) {
            const op = this.parsePrice(el.textContent || '');
            if (op > price) {
              originalPrice = op;
              break;
            }
          }
        }
      }

      return { price, originalPrice, currency };
    }

    parsePrice(priceStr) {
      if (!priceStr) return 0;
      let clean = priceStr.replace(/[$,\s]/g, '').trim();
      const match = clean.match(/[\d.]+/);
      return match ? parseFloat(match[0]) : 0;
    }

    /**
     * Extract images
     */
    async extractImages() {
      const images = new Set();

      // From page data
      if (this.pageData?.product?.products?.[this.productId]) {
        const product = this.pageData.product.products[this.productId];
        const imageEntities = product.imageInfo?.allImages || product.images || [];
        
        imageEntities.forEach(img => {
          const url = img.url || img.large || img;
          if (url && typeof url === 'string') {
            images.add(this.normalizeImageUrl(url));
          }
        });
      }

      // DOM extraction - 2025 selectors
      const imageSelectors = [
        '[data-testid="hero-image"] img',
        '.prod-hero-image img',
        '[class*="carousel"] img',
        '[itemprop="image"]',
        '[data-testid="media-thumbnail"] img',
        '[data-automation-id="product-image"] img',
        '[class*="ProductImage"] img'
      ];

      for (const sel of imageSelectors) {
        document.querySelectorAll(sel).forEach(img => {
          const src = img.dataset?.src || img.dataset?.lazy || img.src;
          if (src && this.isValidImage(src)) {
            images.add(this.normalizeImageUrl(src));
          }
        });
      }

      // Thumbnails - 2025 selectors
      const thumbSelectors = [
        '[data-testid="vertical-carousel"] img',
        '.prod-alt-image img',
        '[data-testid="media-carousel"] img',
        '[class*="ImageCarousel"] img'
      ];
      
      for (const sel of thumbSelectors) {
        document.querySelectorAll(sel).forEach(img => {
          const src = img.dataset?.src || img.dataset?.lazy || img.src;
          if (src && this.isValidImage(src)) {
            images.add(this.normalizeImageUrl(src));
          }
        });
      }

      return Array.from(images).filter(url => url && url.includes('http')).slice(0, 30);
    }

    normalizeImageUrl(src) {
      if (!src) return null;
      
      // Get high-res version
      src = src.replace(/\/\d+x\d+\//, '/2000x2000/');
      src = src.replace(/\?.*$/, ''); // Remove query params
      
      return src;
    }

    isValidImage(src) {
      if (!src) return false;
      if (src.includes('pixel') || src.includes('blank') || src.includes('spacer')) return false;
      if (src.includes('icon') || src.includes('logo')) return false;
      return true;
    }

    /**
     * Extract videos
     */
    async extractVideos() {
      const videos = [];

      // From page data
      if (this.pageData?.product?.products?.[this.productId]) {
        const product = this.pageData.product.products[this.productId];
        const videoAssets = product.videoAssets || product.videos || [];
        
        videoAssets.forEach(video => {
          const url = video.url || video.versions?.[0]?.url;
          if (url) {
            videos.push({
              url,
              type: 'mp4',
              platform: 'walmart',
              thumbnail: video.thumbnail || null
            });
          }
        });
      }

      // DOM video elements
      document.querySelectorAll('video source, video[src]').forEach(el => {
        const src = el.src || el.querySelector('source')?.src;
        if (src && !videos.some(v => v.url === src)) {
          videos.push({ url: src, type: 'mp4', platform: 'walmart' });
        }
      });

      return videos.slice(0, 10);
    }

    /**
     * Extract variants
     */
    async extractVariants() {
      const variants = [];

      // From page data
      if (this.pageData?.product?.products?.[this.productId]) {
        const product = this.pageData.product.products[this.productId];
        const variantCriteria = product.variantCriteria || [];
        
        variantCriteria.forEach(criterion => {
          const type = criterion.name || criterion.id;
          const options = criterion.variantList || [];
          
          options.forEach(opt => {
            variants.push({
              id: opt.id || opt.products?.[0],
              title: opt.name || opt.value,
              type: type,
              available: opt.status !== 'OUT_OF_STOCK',
              image: opt.image ? this.normalizeImageUrl(opt.image) : null
            });
          });
        });
      }

      // DOM fallback
      if (variants.length === 0) {
        // Size/Color swatches
        document.querySelectorAll('[data-testid="variant-tile"], [class*="variant-item"]').forEach(item => {
          const title = item.getAttribute('title') || item.textContent?.trim();
          const id = item.dataset?.variantId || item.dataset?.value;
          const img = item.querySelector('img');
          
          if (title) {
            variants.push({
              id: id || `var_${variants.length}`,
              title: title,
              image: img?.src ? this.normalizeImageUrl(img.src) : null,
              available: !item.className.includes('disabled') && !item.className.includes('unavailable')
            });
          }
        });
      }

      return variants;
    }

    /**
     * Extract reviews
     */
    async extractReviews() {
      const reviews = [];

      // Rating summary from page data
      if (this.pageData?.product?.products?.[this.productId]) {
        const product = this.pageData.product.products[this.productId];
        const reviewsInfo = product.reviews || {};
        
        reviews.push({
          type: 'summary',
          averageRating: parseFloat(reviewsInfo.averageOverallRating || 0),
          totalCount: parseInt(reviewsInfo.totalReviewCount || 0)
        });
      }

      // DOM extraction for individual reviews
      document.querySelectorAll('[data-testid="review"], .review-item, [class*="customer-review"]').forEach(reviewEl => {
        const review = {
          author: reviewEl.querySelector('[class*="author"], .reviewer-name')?.textContent?.trim() || 'Anonymous',
          rating: this.extractReviewRating(reviewEl),
          content: reviewEl.querySelector('[class*="review-text"], .review-body')?.textContent?.trim() || '',
          title: reviewEl.querySelector('[class*="review-title"], .review-heading')?.textContent?.trim() || '',
          date: reviewEl.querySelector('[class*="review-date"], time')?.textContent?.trim() || '',
          images: [],
          helpful: this.extractHelpfulCount(reviewEl)
        };

        // Review images
        reviewEl.querySelectorAll('img[src*="reviews"]').forEach(img => {
          if (img.src) {
            review.images.push(img.src);
          }
        });

        if (review.content) {
          reviews.push(review);
        }
      });

      return reviews.slice(0, 50);
    }

    extractReviewRating(el) {
      const ratingEl = el.querySelector('[class*="star"], [class*="rating"]');
      if (ratingEl) {
        const ariaLabel = ratingEl.getAttribute('aria-label');
        if (ariaLabel) {
          const match = ariaLabel.match(/([\d.]+)/);
          if (match) return parseFloat(match[1]);
        }
        
        const classMatch = ratingEl.className.match(/rating-(\d)/);
        if (classMatch) return parseInt(classMatch[1]);
      }
      return 5;
    }

    extractHelpfulCount(el) {
      const helpfulEl = el.querySelector('[class*="helpful"]');
      if (helpfulEl) {
        const match = helpfulEl.textContent?.match(/(\d+)/);
        if (match) return parseInt(match[1]);
      }
      return 0;
    }

    /**
     * Extract specifications
     */
    async extractSpecifications() {
      const specifications = {};

      // From page data
      if (this.pageData?.product?.products?.[this.productId]) {
        const product = this.pageData.product.products[this.productId];
        const specs = product.productAttributes || product.specifications || {};
        
        Object.assign(specifications, specs);
      }

      // DOM extraction
      document.querySelectorAll('[data-testid="product-specification"] tr, .prod-spec-row').forEach(row => {
        const cells = row.querySelectorAll('td, th');
        if (cells.length >= 2) {
          const key = cells[0].textContent?.trim();
          const value = cells[1].textContent?.trim();
          if (key && value) {
            specifications[key] = value;
          }
        }
      });

      // Key-value list items
      document.querySelectorAll('.about-item, [class*="spec-item"]').forEach(item => {
        const keyEl = item.querySelector('.about-item-title, [class*="spec-label"]');
        const valueEl = item.querySelector('.about-item-value, [class*="spec-value"]');
        
        if (keyEl && valueEl) {
          specifications[keyEl.textContent.trim()] = valueEl.textContent.trim();
        }
      });

      return specifications;
    }
  }

  // Register with ExtractorRegistry if available
  if (window.ExtractorRegistry) {
    window.ExtractorRegistry.register('walmart', WalmartExtractor);
  }

  // Export
  window.WalmartExtractor = WalmartExtractor;

})();
