/**
 * ShopOpti+ Cdiscount Extractor v5.7.0
 * High-fidelity extraction for Cdiscount product pages
 * Marché français - Extracts: Images, Variants, Reviews, Specifications
 */

(function() {
  'use strict';

  if (window.__shopoptiCdiscountExtractorLoaded) return;
  window.__shopoptiCdiscountExtractorLoaded = true;

  class CdiscountExtractor {
    constructor() {
      this.platform = 'cdiscount';
      this.productId = this.extractProductId();
    }

    /**
     * Extract product ID from URL
     */
    extractProductId() {
      // Pattern: /f-XXX-XXXXX.html or /fp/XXXXX.html
      const patterns = [
        /\/f-\d+-([a-z0-9]+)\.html/i,
        /\/fp\/([a-z0-9]+)\.html/i,
        /productid=([a-z0-9]+)/i
      ];

      for (const pattern of patterns) {
        const match = window.location.href.match(pattern);
        if (match) return match[1];
      }

      return null;
    }

    /**
     * Main extraction method
     */
    async extractComplete() {
      console.log('[ShopOpti+ Cdiscount] Starting extraction, Product ID:', this.productId);

      const [basicInfo, pricing, images, variants, reviews, specifications] = await Promise.all([
        this.extractBasicInfo(),
        this.extractPricing(),
        this.extractImages(),
        this.extractVariants(),
        this.extractReviews(),
        this.extractSpecifications()
      ]);

      const productData = {
        external_id: this.productId,
        url: window.location.href,
        platform: 'cdiscount',
        extractedAt: new Date().toISOString(),
        ...basicInfo,
        ...pricing,
        images,
        videos: [], // Cdiscount rarely has videos
        variants,
        reviews,
        specifications
      };

      console.log('[ShopOpti+ Cdiscount] Extraction complete:', {
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
      // Try JSON-LD first
      const jsonLD = this.extractFromJsonLD();
      if (jsonLD.title) return jsonLD;

      // DOM fallback
      const titleSelectors = [
        '.fpDesCol h1',
        '.fpTMain h1',
        '[itemprop="name"]',
        'h1.product-title',
        '.prdtBlocFamily h1'
      ];

      let title = '';
      for (const sel of titleSelectors) {
        const el = document.querySelector(sel);
        if (el?.textContent?.trim()) {
          title = el.textContent.trim();
          break;
        }
      }

      // Brand
      const brandSelectors = [
        '.fpBrandName',
        '[itemprop="brand"]',
        '.prdtBILogo img',
        '.fpBrandLnk'
      ];

      let brand = '';
      for (const sel of brandSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          brand = el.textContent?.trim() || el.alt || el.title || '';
          if (brand) break;
        }
      }

      // Description
      const descSelectors = [
        '.fpDesc',
        '[itemprop="description"]',
        '.fpDescTxt',
        '#fpDesc'
      ];

      let description = '';
      for (const sel of descSelectors) {
        const el = document.querySelector(sel);
        if (el?.textContent?.trim()) {
          description = el.textContent.trim().substring(0, 5000);
          break;
        }
      }

      // SKU
      const sku = document.querySelector('[itemprop="sku"]')?.content || 
                  document.querySelector('[data-sku]')?.dataset?.sku ||
                  this.productId || '';

      return { title, brand, description, sku };
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
      const currency = 'EUR';

      // JSON-LD pricing
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent);
          const items = Array.isArray(data) ? data : [data];
          
          for (const item of items) {
            if (item['@type'] === 'Product' && item.offers) {
              const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
              price = parseFloat(offers.price) || 0;
              if (price > 0) break;
            }
          }
        } catch (e) {}
      }

      // DOM fallback
      if (price === 0) {
        const priceSelectors = [
          '.fpPrice',
          '.priceContainer .price',
          '[itemprop="price"]',
          '.prdtPrice',
          '.fpPriceRes'
        ];

        for (const sel of priceSelectors) {
          const el = document.querySelector(sel);
          if (el) {
            price = this.parsePrice(el.textContent || el.getAttribute('content') || '');
            if (price > 0) break;
          }
        }
      }

      // Original/crossed price
      const originalSelectors = [
        '.fpStrikePrc',
        '.priceOld',
        '.prdtPriceStrike',
        'del.price'
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

      return { price, originalPrice, currency };
    }

    parsePrice(priceStr) {
      if (!priceStr) return 0;
      // French format: 1 234,56 €
      let clean = priceStr.replace(/[€\s]/g, '').replace(/\u00a0/g, '').trim();
      clean = clean.replace(/\./g, '').replace(',', '.');
      return parseFloat(clean) || 0;
    }

    /**
     * Extract images
     */
    async extractImages() {
      const images = new Set();

      // Main product images
      const imageSelectors = [
        '.fpImgLnk img',
        '.fpGalImg img',
        '[itemprop="image"]',
        '.prdtBImg img',
        '#fpZone img',
        '.fpMainImg img'
      ];

      for (const sel of imageSelectors) {
        document.querySelectorAll(sel).forEach(img => {
          const src = img.dataset?.src || img.dataset?.lazySrc || img.src;
          if (src && this.isValidImage(src)) {
            images.add(this.normalizeImageUrl(src));
          }
        });
      }

      // Thumbnails
      document.querySelectorAll('.fpGalThbs img, .prdtBImgTh img').forEach(img => {
        const src = img.dataset?.src || img.src;
        if (src && this.isValidImage(src)) {
          images.add(this.normalizeImageUrl(src));
        }
      });

      // JSON-LD images
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent);
          if (data['@type'] === 'Product' && data.image) {
            const imgs = Array.isArray(data.image) ? data.image : [data.image];
            imgs.forEach(img => {
              const url = typeof img === 'string' ? img : img.url;
              if (url) images.add(this.normalizeImageUrl(url));
            });
          }
        } catch (e) {}
      }

      return Array.from(images).filter(url => url && url.includes('http')).slice(0, 30);
    }

    normalizeImageUrl(src) {
      if (!src) return null;
      
      // Ensure HTTPS
      if (src.startsWith('//')) src = 'https:' + src;
      
      // Get high-res version
      src = src.replace(/_TH\./, '_MED.');
      src = src.replace(/_S\./, '_L.');
      src = src.replace(/\/s\//, '/l/');
      
      return src;
    }

    isValidImage(src) {
      if (!src) return false;
      if (src.includes('pixel') || src.includes('blank') || src.includes('spacer')) return false;
      if (src.includes('logo') || src.includes('icon')) return false;
      return true;
    }

    /**
     * Extract variants
     */
    async extractVariants() {
      const variants = [];

      // Size/Color selectors
      const variantContainers = [
        '.fpSelList',
        '.prdtBVar',
        '[class*="variation"]',
        '.fpColors'
      ];

      for (const containerSel of variantContainers) {
        document.querySelectorAll(`${containerSel} li, ${containerSel} option`).forEach(item => {
          const title = item.textContent?.trim() || item.getAttribute('title') || item.value;
          const id = item.dataset?.variantId || item.dataset?.value || item.value;
          
          if (title && title !== '-') {
            variants.push({
              id: id || `var_${variants.length}`,
              title: title,
              available: !item.className.includes('disabled') && !item.disabled,
              image: null
            });
          }
        });
      }

      // Color swatches with images
      document.querySelectorAll('.fpColorItem, .prdtBColor').forEach(item => {
        const img = item.querySelector('img');
        const title = item.getAttribute('title') || img?.alt;
        
        if (title) {
          variants.push({
            id: item.dataset?.colorId || `color_${variants.length}`,
            title: title,
            type: 'color',
            image: img?.src ? this.normalizeImageUrl(img.src) : null,
            available: !item.className.includes('disabled')
          });
        }
      });

      return variants;
    }

    /**
     * Extract reviews
     */
    async extractReviews() {
      const reviews = [];

      // Rating summary
      const ratingEl = document.querySelector('[itemprop="ratingValue"], .prdtBIRating, .fpRating');
      const countEl = document.querySelector('[itemprop="reviewCount"], .prdtBIReviewNb, .fpReviewCount');

      if (ratingEl || countEl) {
        reviews.push({
          type: 'summary',
          averageRating: parseFloat(ratingEl?.textContent?.replace(',', '.') || ratingEl?.content || 0),
          totalCount: parseInt(countEl?.textContent?.match(/\d+/)?.[0] || countEl?.content || 0)
        });
      }

      // Individual reviews
      document.querySelectorAll('.fpReview, .prdtBIReviewItem, .reviewItem').forEach(reviewEl => {
        const review = {
          author: reviewEl.querySelector('.reviewAuthor, .fpReviewAuthor')?.textContent?.trim() || 'Anonyme',
          rating: this.extractReviewRating(reviewEl),
          content: reviewEl.querySelector('.reviewContent, .fpReviewTxt, .reviewText')?.textContent?.trim() || '',
          date: reviewEl.querySelector('.reviewDate, .fpReviewDate')?.textContent?.trim() || '',
          title: reviewEl.querySelector('.reviewTitle, .fpReviewTitle')?.textContent?.trim() || '',
          images: []
        };

        // Review images
        reviewEl.querySelectorAll('img:not([class*="star"])').forEach(img => {
          if (img.src && !img.src.includes('avatar') && !img.src.includes('icon')) {
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
      const starEl = el.querySelector('[class*="star"], .rating');
      if (starEl) {
        // Check width-based rating
        const style = starEl.getAttribute('style');
        const widthMatch = style?.match(/width:\s*(\d+)%/);
        if (widthMatch) {
          return Math.round(parseInt(widthMatch[1]) / 20);
        }
        
        // Check class-based rating
        const classMatch = starEl.className.match(/star(\d)/);
        if (classMatch) {
          return parseInt(classMatch[1]);
        }
      }
      return 5;
    }

    /**
     * Extract specifications
     */
    async extractSpecifications() {
      const specifications = {};

      // Technical specifications table
      const specTables = document.querySelectorAll('.fpTechSpecs table, .prdtBDesc table, [class*="specification"] table');
      
      specTables.forEach(table => {
        table.querySelectorAll('tr').forEach(row => {
          const cells = row.querySelectorAll('td, th');
          if (cells.length >= 2) {
            const key = cells[0].textContent?.trim();
            const value = cells[1].textContent?.trim();
            if (key && value) {
              specifications[key] = value;
            }
          }
        });
      });

      // Key-value pairs in lists
      document.querySelectorAll('.fpDescFeat li, .prdtBDescItem').forEach(item => {
        const text = item.textContent?.trim();
        const colonIndex = text?.indexOf(':');
        if (colonIndex > 0) {
          const key = text.substring(0, colonIndex).trim();
          const value = text.substring(colonIndex + 1).trim();
          if (key && value) {
            specifications[key] = value;
          }
        }
      });

      return specifications;
    }
  }

  // Register with ExtractorRegistry if available
  if (window.ExtractorRegistry) {
    window.ExtractorRegistry.register('cdiscount', CdiscountExtractor);
  }

  // Export
  window.CdiscountExtractor = CdiscountExtractor;

})();
