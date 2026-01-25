/**
 * ShopOpti+ eBay Extractor v5.1.0
 * High-fidelity extraction for eBay product pages
 * Extracts: Images, Variants, Videos, Reviews, Specifications
 */

(function() {
  'use strict';

  if (window.__shopoptiEbayExtractorLoaded) return;
  window.__shopoptiEbayExtractorLoaded = true;

  class EbayExtractor {
    constructor() {
      this.platform = 'ebay';
      this.itemId = this.extractItemId();
    }

    /**
     * Extract item ID from URL
     */
    extractItemId() {
      const patterns = [
        /\/itm\/(\d+)/,
        /\/p\/(\d+)/,
        /item=(\d+)/,
        /itemId=(\d+)/
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
      console.log('[ShopOpti+ eBay] Starting extraction, Item ID:', this.itemId);

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
        external_id: this.itemId,
        url: window.location.href,
        platform: 'ebay',
        extractedAt: new Date().toISOString(),
        ...basicInfo,
        ...pricing,
        images,
        videos,
        variants,
        reviews,
        specifications
      };

      console.log('[ShopOpti+ eBay] Extraction complete:', {
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
      // JSON-LD
      const jsonLD = this.extractFromJsonLD();
      if (jsonLD.title) return jsonLD;

      // DOM extraction
      const titleSelectors = [
        'h1.x-item-title__mainTitle',
        '[data-testid="x-item-title"]',
        '#itemTitle',
        'h1[itemprop="name"]'
      ];

      let title = '';
      for (const sel of titleSelectors) {
        const el = document.querySelector(sel);
        if (el?.textContent?.trim()) {
          title = el.textContent.replace(/^Details about\s*/i, '').trim();
          break;
        }
      }

      // Brand/Seller
      const brandSelectors = [
        '[data-testid="x-store-info"] a',
        '.x-sellercard-atf__info a',
        '[class*="seller-info"] a'
      ];
      let brand = '';
      for (const sel of brandSelectors) {
        const el = document.querySelector(sel);
        if (el?.textContent?.trim()) {
          brand = el.textContent.trim();
          break;
        }
      }

      // Description
      let description = '';
      const descFrame = document.querySelector('#desc_ifr, #description iframe');
      if (descFrame) {
        try {
          const frameDoc = descFrame.contentDocument || descFrame.contentWindow?.document;
          description = frameDoc?.body?.textContent?.trim()?.substring(0, 5000) || '';
        } catch (e) {}
      }
      if (!description) {
        const descEl = document.querySelector('#viTabs_0_is, [itemprop="description"]');
        description = descEl?.textContent?.trim()?.substring(0, 5000) || '';
      }

      // SKU / MPN
      let sku = this.itemId;
      const skuEl = document.querySelector('[class*="item-id"], [data-testid="x-item-number"]');
      if (skuEl) {
        sku = skuEl.textContent?.match(/\d+/)?.[0] || this.itemId;
      }

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
      let currency = 'EUR';

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
              currency = offers.priceCurrency || 'EUR';
              break;
            }
          }
        } catch (e) {}
      }

      // DOM fallback
      if (price === 0) {
        const priceSelectors = [
          '[data-testid="x-price-primary"] .ux-textspans',
          '[itemprop="price"]',
          '#prcIsum',
          '.x-price-primary'
        ];

        for (const sel of priceSelectors) {
          const el = document.querySelector(sel);
          if (el) {
            price = this.parsePrice(el.textContent || el.getAttribute('content') || '');
            if (price > 0) break;
          }
        }
      }

      // Original price
      const originalSelectors = ['[data-testid="x-price-secondary"]', '.x-price-secondary', '[class*="original-price"]'];
      for (const sel of originalSelectors) {
        const el = document.querySelector(sel);
        if (el?.textContent) {
          const op = this.parsePrice(el.textContent);
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
      let clean = priceStr.replace(/[€$£¥\s]/g, '').replace('EUR', '').replace('USD', '').trim();
      
      // Handle European format
      if (/^\d{1,3}([.\s]\d{3})*,\d{2}$/.test(clean)) {
        clean = clean.replace(/[.\s]/g, '').replace(',', '.');
      } else if (clean.includes(',') && !clean.includes('.')) {
        clean = clean.replace(',', '.');
      }
      
      return parseFloat(clean) || 0;
    }

    /**
     * Extract images
     */
    async extractImages() {
      const images = new Set();

      // Main carousel images
      document.querySelectorAll('.ux-image-carousel img, [data-testid="ux-image-carousel"] img').forEach(img => {
        const src = img.dataset?.src || img.dataset?.zoom || img.src;
        if (src) {
          images.add(this.normalizeImageUrl(src));
        }
      });

      // Thumbnail images
      document.querySelectorAll('[class*="thumb"] img, .x-photos-thumb img').forEach(img => {
        const src = img.dataset?.src || img.src;
        if (src) {
          images.add(this.normalizeImageUrl(src));
        }
      });

      // Main large image
      const mainImg = document.querySelector('#icImg, .ux-image-filmstrip-image img');
      if (mainImg) {
        images.add(this.normalizeImageUrl(mainImg.dataset?.src || mainImg.src));
      }

      // From JSON-LD
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent);
          const items = Array.isArray(data) ? data : [data];
          for (const item of items) {
            if (item['@type'] === 'Product' && item.image) {
              const imgs = Array.isArray(item.image) ? item.image : [item.image];
              imgs.forEach(img => {
                const src = typeof img === 'string' ? img : img.url;
                if (src) images.add(this.normalizeImageUrl(src));
              });
            }
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
      src = src.replace(/s-l\d+/g, 's-l1600');
      src = src.replace(/\$_\d+/g, '$_57');

      // Remove query params for dedup
      src = src.split('?')[0];

      return src;
    }

    /**
     * Extract product videos
     */
    async extractVideos() {
      const videos = [];

      // Video elements
      document.querySelectorAll('video source, video').forEach(el => {
        const src = el.src || el.querySelector('source')?.src;
        if (src && !videos.some(v => v.url === src)) {
          videos.push({ url: src, type: 'mp4', platform: 'ebay' });
        }
      });

      // YouTube embeds
      document.querySelectorAll('iframe[src*="youtube"]').forEach(iframe => {
        const src = iframe.src;
        if (src) {
          videos.push({ url: src, type: 'youtube', platform: 'ebay' });
        }
      });

      return videos.slice(0, 10);
    }

    /**
     * Extract product variants
     */
    async extractVariants() {
      const variants = [];

      // Variation selectors
      document.querySelectorAll('[data-testid*="select"] select option, #msku-sel-1 option').forEach(option => {
        if (option.value && option.value !== '-1') {
          variants.push({
            id: option.value,
            title: option.textContent.trim(),
            available: !option.disabled
          });
        }
      });

      // Buttons/swatches
      document.querySelectorAll('.x-variation-value, [class*="variation-item"]').forEach(item => {
        const title = item.getAttribute('aria-label') || item.textContent?.trim();
        const img = item.querySelector('img');
        
        if (title) {
          variants.push({
            id: `var_${variants.length}`,
            title: title,
            image: img?.src ? this.normalizeImageUrl(img.src) : null,
            available: !item.className.includes('unavailable')
          });
        }
      });

      return variants;
    }

    /**
     * Extract product reviews
     */
    async extractReviews() {
      const reviews = [];

      // Rating summary
      const ratingEl = document.querySelector('[class*="star-rating"], [itemprop="ratingValue"]');
      const countEl = document.querySelector('[class*="reviews-count"], [itemprop="reviewCount"]');
      
      if (ratingEl || countEl) {
        reviews.push({
          type: 'summary',
          averageRating: parseFloat(ratingEl?.textContent?.match(/[\d.]+/)?.[0] || ratingEl?.getAttribute('content')) || 0,
          totalCount: parseInt(countEl?.textContent?.match(/[\d,]+/)?.[0]?.replace(',', '') || countEl?.getAttribute('content')) || 0
        });
      }

      // Individual reviews
      document.querySelectorAll('[class*="review-item"], [data-testid*="review"]').forEach(reviewEl => {
        const review = {
          author: reviewEl.querySelector('[class*="reviewer"], [class*="user"]')?.textContent?.trim() || 'Anonymous',
          rating: this.extractReviewRating(reviewEl),
          content: reviewEl.querySelector('[class*="review-text"], [class*="content"]')?.textContent?.trim() || '',
          date: reviewEl.querySelector('[class*="date"], time')?.textContent?.trim() || ''
        };

        if (review.content) {
          reviews.push(review);
        }
      });

      return reviews.slice(0, 50);
    }

    extractReviewRating(el) {
      const starEl = el.querySelector('[class*="star-rating"]');
      if (starEl) {
        const ariaLabel = starEl.getAttribute('aria-label');
        const match = ariaLabel?.match(/(\d[.,]?\d?)/);
        if (match) return parseFloat(match[1].replace(',', '.'));
      }
      return 5;
    }

    /**
     * Extract product specifications
     */
    async extractSpecifications() {
      const specs = {};

      // Item specifics table
      document.querySelectorAll('[data-testid="ux-labels-values"] .ux-labels-values__labels-content, .itemAttr tr').forEach(row => {
        const keyEl = row.querySelector('.ux-labels-values__labels, th');
        const valueEl = row.querySelector('.ux-labels-values__values, td');
        
        if (keyEl && valueEl) {
          const key = keyEl.textContent.trim().replace(/:\s*$/, '');
          const value = valueEl.textContent.trim();
          if (key && value) {
            specs[key] = value;
          }
        }
      });

      // Item specifics list
      document.querySelectorAll('.x-item-specifics li, [class*="item-specifics"] li').forEach(li => {
        const text = li.textContent?.trim();
        const colonIndex = text?.indexOf(':');
        if (colonIndex > 0) {
          specs[text.substring(0, colonIndex).trim()] = text.substring(colonIndex + 1).trim();
        }
      });

      return specs;
    }
  }

  // Export to global scope
  window.ShopOptiEbayExtractor = EbayExtractor;
  console.log('[ShopOpti+] eBay Extractor v5.1.0 loaded');

})();
