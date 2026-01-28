/**
 * ShopOpti+ Amazon Extractor v5.7.0
 * High-fidelity extraction for Amazon product pages
 * Extends BaseExtractor - Extracts: Images, Variants, Videos, Reviews, Specifications
 */

(function() {
  'use strict';

  if (window.__shopoptiAmazonExtractorLoaded) return;
  window.__shopoptiAmazonExtractorLoaded = true;

  const BaseExtractor = window.ShopOptiBaseExtractor;

  class AmazonExtractor extends (BaseExtractor || Object) {
    constructor() {
      if (BaseExtractor) super();
      this.platform = 'amazon';
      this.version = '5.7.0';
      this.asin = this.extractASIN();
      this.seenImageHashes = new Set();
      this.interceptedData = {};
      this.setupNetworkInterception();
    }

    /**
     * Setup network interception for SPA data capture
     */
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

      // XHR interception
      const originalXHROpen = XMLHttpRequest.prototype.open;
      const originalXHRSend = XMLHttpRequest.prototype.send;
      
      XMLHttpRequest.prototype.open = function(method, url) {
        this._shopoptiUrl = url;
        return originalXHROpen.apply(this, arguments);
      };

      XMLHttpRequest.prototype.send = function() {
        this.addEventListener('load', function() {
          if (self.isRelevantRequest(this._shopoptiUrl)) {
            try {
              const data = JSON.parse(this.responseText);
              self.processInterceptedData(this._shopoptiUrl, data);
            } catch (e) {}
          }
        });
        return originalXHRSend.apply(this, arguments);
      };
    }

    isRelevantRequest(url) {
      if (!url) return false;
      return url.includes('/api/') || 
             url.includes('product') || 
             url.includes('reviews') ||
             url.includes('images');
    }

    processInterceptedData(url, data) {
      if (url.includes('review')) {
        this.interceptedData.reviews = data;
      } else if (url.includes('image')) {
        this.interceptedData.images = data;
      } else {
        this.interceptedData.product = data;
      }
    }

    /**
     * Extract ASIN from URL or page
     */
    extractASIN() {
      const urlMatch = window.location.href.match(/\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})/i);
      if (urlMatch) return urlMatch[1];

      const asinInput = document.querySelector('input[name="ASIN"], input[name="asin"]');
      if (asinInput?.value) return asinInput.value;

      const productEl = document.querySelector('[data-asin]');
      if (productEl?.dataset?.asin) return productEl.dataset.asin;

      return null;
    }

    /**
     * Get platform identifier
     */
    getPlatform() {
      return 'amazon';
    }

    /**
     * Get external product ID
     */
    getExternalId() {
      return this.asin;
    }

    /**
     * Main extraction method - implements BaseExtractor contract
     */
    async extractComplete() {
      console.log('[ShopOpti+ Amazon v5.7.0] Starting extraction, ASIN:', this.asin);

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
        external_id: this.asin,
        url: window.location.href,
        platform: 'amazon',
        version: this.version,
        extractedAt: new Date().toISOString(),
        ...basicInfo,
        ...pricing,
        images,
        videos,
        variants,
        reviews,
        specifications
      };

      console.log('[ShopOpti+ Amazon v5.7.0] Extraction complete:', {
        title: productData.title?.substring(0, 50),
        images: images.length,
        videos: videos.length,
        variants: variants.length,
        reviews: reviews.length
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

      // Title with multiple fallbacks
      const titleSelectors = [
        '#productTitle',
        '#title span',
        'h1.product-title-word-break',
        '[data-feature-name="title"] span',
        'h1[data-automation-id="product-title"]'
      ];
      let title = '';
      for (const sel of titleSelectors) {
        const el = document.querySelector(sel);
        if (el?.textContent?.trim()) {
          title = el.textContent.trim();
          break;
        }
      }

      // Brand with cleanup
      const brandSelectors = [
        '#bylineInfo',
        'a#bylineInfo',
        '.po-brand .po-break-word',
        '[data-brand]',
        '#brand'
      ];
      let brand = '';
      for (const sel of brandSelectors) {
        const el = document.querySelector(sel);
        if (el?.textContent?.trim()) {
          brand = el.textContent
            .replace(/^(Visit the|Marque\s*:|Brand:?|Store:?)\s*/i, '')
            .trim();
          break;
        }
      }

      // Description with multiple sources
      const descriptionSelectors = [
        '#feature-bullets ul',
        '#productDescription',
        '#aplus',
        '#aplus_feature_div',
        '[data-a-feature-name="productDescription"]'
      ];
      let description = '';
      for (const sel of descriptionSelectors) {
        const el = document.querySelector(sel);
        if (el?.textContent?.trim()) {
          description = el.textContent.trim().substring(0, 5000);
          break;
        }
      }

      // SKU / Model number from details
      const detailsTable = document.querySelector(
        '#productDetails_detailBullets_sections1, #detailBullets_feature_div, #productDetails_techSpec_section_1'
      );
      let sku = '';
      if (detailsTable) {
        const rows = detailsTable.querySelectorAll('tr, li');
        for (const row of rows) {
          const text = row.textContent.toLowerCase();
          if (text.includes('model number') || text.includes('numéro de modèle') || text.includes('asin')) {
            const value = row.querySelector('td:last-child, span:last-child');
            if (value && !sku) {
              sku = value.textContent.trim();
            }
          }
        }
      }

      return { title, brand, description, sku: sku || this.asin };
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
                brand: typeof item.brand === 'string' ? item.brand : item.brand?.name || '',
                sku: item.sku || item.mpn || ''
              };
            }
          }
        } catch (e) {}
      }
      return {};
    }

    /**
     * Extract pricing with multiple strategies
     */
    async extractPricing() {
      const priceStrategies = [
        () => document.querySelector('#corePrice_feature_div .a-offscreen, #corePrice_feature_div .a-price .a-offscreen')?.textContent,
        () => document.querySelector('#priceblock_ourprice, #priceblock_dealprice, #priceblock_saleprice')?.textContent,
        () => document.querySelector('.a-price[data-a-color="price"] .a-offscreen')?.textContent,
        () => document.querySelector('#newBuyBoxPrice, #price_inside_buybox')?.textContent,
        () => document.querySelector('.a-price .a-offscreen')?.textContent,
        () => document.querySelector('[data-a-color="price"] .a-offscreen')?.textContent
      ];

      let price = 0;
      for (const strategy of priceStrategies) {
        const priceText = strategy();
        if (priceText) {
          price = this.parsePrice(priceText);
          if (price > 0) break;
        }
      }

      // Original price
      const originalPriceSelectors = [
        '.a-text-strike .a-offscreen',
        '.a-price[data-a-strike] .a-offscreen',
        '#listPrice',
        '.a-text-price .a-offscreen',
        '[data-a-strike="true"] .a-offscreen'
      ];
      let originalPrice = null;
      for (const sel of originalPriceSelectors) {
        const el = document.querySelector(sel);
        if (el?.textContent) {
          const op = this.parsePrice(el.textContent);
          if (op > price) {
            originalPrice = op;
            break;
          }
        }
      }

      const currency = this.detectCurrency();
      return { price, originalPrice, currency };
    }

    parsePrice(priceStr) {
      if (!priceStr) return 0;
      let clean = priceStr.replace(/[€$£¥₹₽\s]/gi, '').replace(/EUR|USD|GBP/gi, '').trim();
      
      // Handle European format (1.234,56)
      if (/^\d{1,3}([.\s]\d{3})*,\d{2}$/.test(clean)) {
        clean = clean.replace(/[.\s]/g, '').replace(',', '.');
      } else if (clean.includes(',') && !clean.includes('.')) {
        clean = clean.replace(',', '.');
      }
      
      return parseFloat(clean) || 0;
    }

    detectCurrency() {
      const currencyMap = {
        'amazon.fr': 'EUR', 'amazon.de': 'EUR', 'amazon.it': 'EUR', 'amazon.es': 'EUR',
        'amazon.com': 'USD', 'amazon.co.uk': 'GBP', 'amazon.ca': 'CAD',
        'amazon.co.jp': 'JPY', 'amazon.in': 'INR', 'amazon.com.mx': 'MXN',
        'amazon.com.br': 'BRL', 'amazon.com.au': 'AUD'
      };
      
      for (const [domain, currency] of Object.entries(currencyMap)) {
        if (window.location.hostname.includes(domain)) return currency;
      }
      return 'EUR';
    }

    /**
     * Extract HIGH-RESOLUTION images with ASIN filtering
     */
    async extractImages() {
      const images = new Set();

      // Strategy 1: altImages with data attributes (highest quality)
      document.querySelectorAll('#altImages img, #imageBlock img, #imgTagWrapperId img').forEach(img => {
        const hiRes = img.dataset?.oldHires || img.dataset?.aHires || img.dataset?.zoom;
        if (hiRes) {
          const normalized = this.normalizeImageUrl(hiRes);
          if (this.isValidAmazonImage(normalized)) {
            images.add(normalized);
          }
        }
      });

      // Strategy 2: Main image
      const mainImage = document.querySelector('#landingImage, #imgBlkFront, #main-image');
      if (mainImage) {
        const src = mainImage.dataset?.oldHires || mainImage.dataset?.aHires || mainImage.src;
        const normalized = this.normalizeImageUrl(src);
        if (this.isValidAmazonImage(normalized)) {
          images.add(normalized);
        }
      }

      // Strategy 3: Parse from JavaScript data
      try {
        const scripts = document.querySelectorAll('script:not([src])');
        for (const script of scripts) {
          const content = script.textContent;
          
          // colorImages object
          const colorImagesMatch = content.match(/colorImages['"]\s*:\s*\{['"]initial['"]\s*:\s*\[([\s\S]*?)\]/);
          if (colorImagesMatch) {
            const hiResMatches = colorImagesMatch[1].matchAll(/hiRes["']?\s*:\s*["']([^"']+)["']/g);
            for (const match of hiResMatches) {
              const normalized = this.normalizeImageUrl(match[1]);
              if (this.isValidAmazonImage(normalized)) {
                images.add(normalized);
              }
            }
          }

          // imageGalleryData
          const galleryMatch = content.match(/imageGalleryData["']?\s*:\s*\[([^\]]+)\]/s);
          if (galleryMatch) {
            const mainUrlMatches = galleryMatch[1].matchAll(/mainUrl["']?\s*:\s*["']([^"']+)["']/g);
            for (const match of mainUrlMatches) {
              const normalized = this.normalizeImageUrl(match[1]);
              if (this.isValidAmazonImage(normalized)) {
                images.add(normalized);
              }
            }
          }
        }
      } catch (e) {
        console.warn('[ShopOpti+ Amazon] Script parsing error:', e);
      }

      // Strategy 4: A+ content images
      document.querySelectorAll('#aplus img, .aplus-module img, #aplus3p_feature_div img').forEach(img => {
        const src = img.dataset?.src || img.src;
        if (src && src.includes('images-amazon') && !src.includes('transparent-pixel')) {
          const normalized = this.normalizeImageUrl(src);
          if (this.isValidAmazonImage(normalized)) {
            images.add(normalized);
          }
        }
      });

      // Filter by ASIN if available
      let finalImages = Array.from(images);
      if (this.asin) {
        const asinFiltered = finalImages.filter(url => url.includes(this.asin));
        if (asinFiltered.length >= 2) {
          finalImages = asinFiltered;
        }
      }

      // Deduplicate by hash
      finalImages = finalImages.filter(url => {
        const hash = this.getImageHash(url);
        if (this.seenImageHashes.has(hash)) return false;
        this.seenImageHashes.add(hash);
        return true;
      });

      return finalImages.slice(0, 30);
    }

    normalizeImageUrl(src) {
      if (!src) return null;
      
      // Force high resolution
      src = src.replace(/\._[A-Z]{2}[\d_,]+_\./, '._AC_SL1500_.');
      src = src.replace(/\._[A-Z]{2}\d+_\./, '._AC_SL1500_.');
      src = src.replace(/\._S[XY]\d+_\./, '._AC_SL1500_.');
      src = src.replace(/\._U[SXYL]\d+_\./, '._AC_SL1500_.');
      
      // Remove query params
      src = src.split('?')[0];
      
      return src;
    }

    isValidAmazonImage(url) {
      if (!url) return false;
      if (!url.includes('images-amazon') && !url.includes('m.media-amazon')) return false;
      if (url.includes('transparent-pixel') || url.includes('sprite') || url.includes('icon')) return false;
      if (url.includes('loading') || url.includes('placeholder') || url.includes('grey-pixel')) return false;
      return true;
    }

    getImageHash(url) {
      const match = url.match(/\/([A-Z0-9]{10,})\./i);
      return match ? match[1] : url;
    }

    /**
     * Extract product videos
     */
    async extractVideos() {
      const videos = [];

      try {
        const scripts = document.querySelectorAll('script:not([src])');
        for (const script of scripts) {
          const content = script.textContent;
          
          // VideoUrl pattern
          const videoMatches = content.matchAll(/["']?videoUrl["']?\s*:\s*["']([^"']+\.mp4[^"']*)["']/gi);
          for (const match of videoMatches) {
            const url = match[1].replace(/\\u002F/g, '/').replace(/\\/g, '');
            if (!videos.some(v => v.url === url)) {
              videos.push({ url, type: 'mp4', platform: 'amazon' });
            }
          }

          // HLS streams
          const hlsMatches = content.matchAll(/["']?url["']?\s*:\s*["']([^"']+\.m3u8[^"']*)["']/gi);
          for (const match of hlsMatches) {
            const url = match[1].replace(/\\u002F/g, '/').replace(/\\/g, '');
            if (!videos.some(v => v.url === url)) {
              videos.push({ url, type: 'hls', platform: 'amazon' });
            }
          }
        }

        // Video elements
        document.querySelectorAll('video source').forEach(source => {
          if (source.src && !videos.some(v => v.url === source.src)) {
            videos.push({ url: source.src, type: 'mp4', platform: 'amazon' });
          }
        });

        // Video thumbnails
        document.querySelectorAll('[data-video-url]').forEach(el => {
          const url = el.dataset.videoUrl;
          if (url && !videos.some(v => v.url === url)) {
            videos.push({ url, type: 'mp4', platform: 'amazon' });
          }
        });

      } catch (e) {
        console.warn('[ShopOpti+ Amazon] Video extraction error:', e);
      }

      return videos.slice(0, 10);
    }

    /**
     * Extract product variants (color, size, etc.)
     */
    async extractVariants() {
      const variants = [];

      try {
        const scripts = document.querySelectorAll('script:not([src])');
        for (const script of scripts) {
          const content = script.textContent;

          // dimensionValuesDisplayData
          const dimensionMatch = content.match(/dimensionValuesDisplayData["']?\s*:\s*(\{[^}]+\})/s);
          if (dimensionMatch) {
            try {
              const dimData = JSON.parse(dimensionMatch[1].replace(/'/g, '"'));
              for (const [asin, values] of Object.entries(dimData)) {
                if (Array.isArray(values) && values.length > 0) {
                  variants.push({
                    id: asin,
                    title: values.join(' - '),
                    options: values,
                    available: true
                  });
                }
              }
            } catch (e) {}
          }

          // asinVariationValues
          const asinVariationMatch = content.match(/asinVariationValues["']?\s*:\s*(\{[\s\S]*?\n\s*\})/);
          if (asinVariationMatch && variants.length === 0) {
            try {
              const varData = JSON.parse(asinVariationMatch[1]);
              for (const [asin, data] of Object.entries(varData)) {
                variants.push({
                  id: asin,
                  title: data.color || data.size || data.title || asin,
                  options: [data.color, data.size].filter(Boolean),
                  available: data.availability !== 'OUT_OF_STOCK'
                });
              }
            } catch (e) {}
          }
        }

        // DOM fallback
        if (variants.length === 0) {
          // Size options
          const sizeSelect = document.querySelector('#native_dropdown_selected_size_name, #size_name_');
          if (sizeSelect) {
            sizeSelect.querySelectorAll('option').forEach(opt => {
              if (opt.value && opt.value !== '-1') {
                variants.push({
                  id: opt.value,
                  title: opt.textContent.trim(),
                  type: 'size',
                  available: !opt.className.includes('unavailable')
                });
              }
            });
          }

          // Color swatches
          document.querySelectorAll('#variation_color_name li, #color_name_ li').forEach(li => {
            const asin = li.dataset.asin || li.querySelector('[data-asin]')?.dataset.asin;
            const title = li.getAttribute('title') || li.querySelector('img')?.alt;
            if (asin && title) {
              variants.push({
                id: asin,
                title: title.replace('Click to select', '').trim(),
                type: 'color',
                available: !li.className.includes('unavailable')
              });
            }
          });
        }

      } catch (e) {
        console.warn('[ShopOpti+ Amazon] Variant extraction error:', e);
      }

      return variants;
    }

    /**
     * Extract product reviews
     */
    async extractReviews() {
      const reviews = [];

      try {
        // Rating summary
        const ratingEl = document.querySelector('[data-hook="rating-out-of-text"], #acrPopover, .a-icon-star-medium');
        const rating = ratingEl?.textContent?.match(/(\d[.,]\d)/)?.[1]?.replace(',', '.') || null;
        
        const countEl = document.querySelector('#acrCustomerReviewText, [data-hook="total-review-count"]');
        const countMatch = countEl?.textContent?.match(/[\d\s,.]+/);
        const reviewCount = countMatch ? parseInt(countMatch[0].replace(/[\s,.]/g, '')) : 0;

        if (rating || reviewCount) {
          reviews.push({
            type: 'summary',
            averageRating: parseFloat(rating) || 0,
            totalCount: reviewCount
          });
        }

        // Individual reviews
        document.querySelectorAll('[data-hook="review"]').forEach(reviewEl => {
          const authorEl = reviewEl.querySelector('.a-profile-name');
          const ratingEl = reviewEl.querySelector('[data-hook="review-star-rating"], .a-icon-star');
          const titleEl = reviewEl.querySelector('[data-hook="review-title"] span:last-child');
          const contentEl = reviewEl.querySelector('[data-hook="review-body"] span');
          const dateEl = reviewEl.querySelector('[data-hook="review-date"]');
          
          const review = {
            author: authorEl?.textContent?.trim() || 'Anonymous',
            rating: parseInt(ratingEl?.className?.match(/a-star-(\d)/)?.[1]) || 5,
            title: titleEl?.textContent?.trim() || '',
            content: contentEl?.textContent?.trim() || '',
            date: dateEl?.textContent?.trim() || '',
            images: [],
            verified: !!reviewEl.querySelector('[data-hook="avp-badge"]')
          };

          // Review images
          reviewEl.querySelectorAll('[data-hook="review-image-tile"] img').forEach(img => {
            if (img.src && this.isValidAmazonImage(img.src)) {
              review.images.push(this.normalizeImageUrl(img.src));
            }
          });

          if (review.content || review.title) {
            reviews.push(review);
          }
        });

      } catch (e) {
        console.warn('[ShopOpti+ Amazon] Review extraction error:', e);
      }

      return reviews.slice(0, 50);
    }

    /**
     * Extract product specifications
     */
    async extractSpecifications() {
      const specs = {};

      try {
        // Product details table
        document.querySelectorAll('#productDetails_detailBullets_sections1 tr, #productDetails_techSpec_section_1 tr').forEach(row => {
          const th = row.querySelector('th');
          const td = row.querySelector('td');
          if (th && td) {
            const key = th.textContent.trim().replace(/\s+/g, ' ');
            const value = td.textContent.trim().replace(/\s+/g, ' ');
            if (key && value) {
              specs[key] = value;
            }
          }
        });

        // Technical details
        document.querySelectorAll('#technicalSpecifications_section_1 tr').forEach(row => {
          const cells = row.querySelectorAll('th, td');
          if (cells.length >= 2) {
            specs[cells[0].textContent.trim()] = cells[1].textContent.trim();
          }
        });

        // Detail bullets
        document.querySelectorAll('#detailBullets_feature_div li span').forEach(span => {
          const text = span.textContent?.trim();
          const colonIndex = text?.indexOf(':');
          if (colonIndex > 0) {
            specs[text.substring(0, colonIndex).trim()] = text.substring(colonIndex + 1).trim();
          }
        });

      } catch (e) {
        console.warn('[ShopOpti+ Amazon] Specifications extraction error:', e);
      }

      return specs;
    }
  }

  // Register with ExtractorRegistry
  if (window.ExtractorRegistry) {
    window.ExtractorRegistry.register('amazon', AmazonExtractor);
  }

  window.AmazonExtractor = AmazonExtractor;
  window.ShopOptiAmazonExtractor = AmazonExtractor;
  console.log('[ShopOpti+] Amazon Extractor v5.7.0 loaded');
})();
