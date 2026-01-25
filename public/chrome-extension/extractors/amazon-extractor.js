/**
 * ShopOpti+ Amazon Extractor v5.1.0
 * High-fidelity extraction for Amazon product pages
 * Extracts: Images (ASIN-filtered, high-res), Variants, Videos, Reviews, Specifications
 */

(function() {
  'use strict';

  if (window.__shopoptiAmazonExtractorLoaded) return;
  window.__shopoptiAmazonExtractorLoaded = true;

  class AmazonExtractor {
    constructor() {
      this.platform = 'amazon';
      this.asin = this.extractASIN();
      this.seenImageHashes = new Set();
    }

    /**
     * Extract ASIN from URL or page
     */
    extractASIN() {
      // From URL
      const urlMatch = window.location.href.match(/\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})/i);
      if (urlMatch) return urlMatch[1];

      // From page elements
      const asinInput = document.querySelector('input[name="ASIN"], input[name="asin"]');
      if (asinInput?.value) return asinInput.value;

      // From data attributes
      const productEl = document.querySelector('[data-asin]');
      if (productEl?.dataset?.asin) return productEl.dataset.asin;

      return null;
    }

    /**
     * Main extraction method
     */
    async extractComplete() {
      console.log('[ShopOpti+ Amazon] Starting extraction, ASIN:', this.asin);

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
        extractedAt: new Date().toISOString(),
        ...basicInfo,
        ...pricing,
        images,
        videos,
        variants,
        reviews,
        specifications
      };

      console.log('[ShopOpti+ Amazon] Extraction complete:', {
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
      // Title
      const titleEl = document.querySelector('#productTitle, #title span, h1.product-title-word-break');
      const title = titleEl?.textContent?.trim() || '';

      // Brand
      const brandSelectors = ['#bylineInfo', 'a#bylineInfo', '.po-brand .po-break-word', '[data-brand]'];
      let brand = '';
      for (const sel of brandSelectors) {
        const el = document.querySelector(sel);
        if (el?.textContent?.trim()) {
          brand = el.textContent.replace(/^(Visit the|Marque\s*:|Brand:?)\s*/i, '').trim();
          break;
        }
      }

      // Description
      const descriptionSelectors = ['#feature-bullets ul', '#productDescription', '#aplus'];
      let description = '';
      for (const sel of descriptionSelectors) {
        const el = document.querySelector(sel);
        if (el?.textContent?.trim()) {
          description = el.textContent.trim().substring(0, 5000);
          break;
        }
      }

      // SKU / Model number
      const detailsTable = document.querySelector('#productDetails_detailBullets_sections1, #detailBullets_feature_div');
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

    /**
     * Extract pricing with multiple strategies
     */
    async extractPricing() {
      const priceStrategies = [
        // Strategy 1: Core price feature div
        () => {
          const priceEl = document.querySelector('#corePrice_feature_div .a-offscreen, #corePrice_feature_div .a-price .a-offscreen');
          return priceEl?.textContent;
        },
        // Strategy 2: Price block
        () => {
          const priceEl = document.querySelector('#priceblock_ourprice, #priceblock_dealprice, #priceblock_saleprice');
          return priceEl?.textContent;
        },
        // Strategy 3: Apex price
        () => {
          const priceEl = document.querySelector('.a-price[data-a-color="price"] .a-offscreen');
          return priceEl?.textContent;
        },
        // Strategy 4: Buy box price
        () => {
          const priceEl = document.querySelector('#newBuyBoxPrice, #price_inside_buybox');
          return priceEl?.textContent;
        },
        // Strategy 5: Regular a-price
        () => {
          const priceEl = document.querySelector('.a-price .a-offscreen');
          return priceEl?.textContent;
        }
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
        '.a-text-price .a-offscreen'
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

      // Currency detection
      const currency = this.detectCurrency();

      return { price, originalPrice, currency };
    }

    parsePrice(priceStr) {
      if (!priceStr) return 0;
      let clean = priceStr.replace(/[€$£¥₹₽\s]/gi, '').replace(/EUR|USD|GBP/gi, '').trim();
      
      // Handle formats
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
        'amazon.co.jp': 'JPY', 'amazon.in': 'INR'
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
      document.querySelectorAll('#altImages img, #imageBlock img').forEach(img => {
        const hiRes = img.dataset?.oldHires || img.dataset?.aHires;
        if (hiRes) {
          const normalized = this.normalizeImageUrl(hiRes);
          if (this.isValidAmazonImage(normalized)) {
            images.add(normalized);
          }
        }
      });

      // Strategy 2: Main image
      const mainImage = document.querySelector('#landingImage, #imgBlkFront');
      if (mainImage) {
        const src = mainImage.dataset?.oldHires || mainImage.dataset?.aHires || mainImage.src;
        const normalized = this.normalizeImageUrl(src);
        if (this.isValidAmazonImage(normalized)) {
          images.add(normalized);
        }
      }

      // Strategy 3: Color images from JavaScript
      try {
        const scripts = document.querySelectorAll('script:not([src])');
        for (const script of scripts) {
          const content = script.textContent;
          
          // Parse colorImages object
          const colorImagesMatch = content.match(/colorImages['"]\s*:\s*(\{[^}]+\}|\[[^\]]+\])/s);
          if (colorImagesMatch) {
            const colorImagesStr = colorImagesMatch[0];
            const hiResMatches = colorImagesStr.matchAll(/hiRes["']?\s*:\s*["']([^"']+)["']/g);
            for (const match of hiResMatches) {
              const normalized = this.normalizeImageUrl(match[1]);
              if (this.isValidAmazonImage(normalized)) {
                images.add(normalized);
              }
            }
          }

          // Parse imageGalleryData
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
      document.querySelectorAll('#aplus img, .aplus-module img').forEach(img => {
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
      if (url.includes('loading') || url.includes('placeholder')) return false;
      return true;
    }

    getImageHash(url) {
      // Extract core image identifier
      const match = url.match(/\/([A-Z0-9]{10,})\./i);
      return match ? match[1] : url;
    }

    /**
     * Extract product videos
     */
    async extractVideos() {
      const videos = [];

      try {
        // Strategy 1: Video player data
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

        // Strategy 2: Video elements
        document.querySelectorAll('video source').forEach(source => {
          if (source.src && !videos.some(v => v.url === source.src)) {
            videos.push({ url: source.src, type: 'mp4', platform: 'amazon' });
          }
        });

        // Strategy 3: Video thumbnails (extract video ID)
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
        // Strategy 1: Twister data from scripts
        const scripts = document.querySelectorAll('script:not([src])');
        for (const script of scripts) {
          const content = script.textContent;

          // dimensionValuesDisplayData
          const dimensionMatch = content.match(/dimensionValuesDisplayData["']?\s*:\s*(\{[^}]+\})/s);
          if (dimensionMatch) {
            try {
              // Parse dimension data
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

        // Strategy 2: DOM-based extraction
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

        // Individual reviews
        document.querySelectorAll('[data-hook="review"]').forEach(reviewEl => {
          const review = {
            author: reviewEl.querySelector('.a-profile-name')?.textContent?.trim() || 'Anonymous',
            rating: parseFloat(reviewEl.querySelector('[data-hook="review-star-rating"] .a-icon-alt')?.textContent?.match(/(\d[.,]?\d?)/)?.[1]?.replace(',', '.')) || 0,
            title: reviewEl.querySelector('[data-hook="review-title"] span:last-child')?.textContent?.trim() || '',
            content: reviewEl.querySelector('[data-hook="review-body"] span')?.textContent?.trim() || '',
            date: reviewEl.querySelector('[data-hook="review-date"]')?.textContent?.trim() || '',
            verified: !!reviewEl.querySelector('[data-hook="avp-badge"]'),
            helpful: parseInt(reviewEl.querySelector('[data-hook="helpful-vote-statement"]')?.textContent?.match(/\d+/)?.[0]) || 0
          };

          // Review images
          const images = [];
          reviewEl.querySelectorAll('[data-hook="review-image-tile"] img').forEach(img => {
            if (img.src && !img.src.includes('sprite')) {
              images.push(img.src.replace(/\._[A-Z]{2}\d+_\./, '._SL500_.'));
            }
          });
          review.images = images;

          if (review.content || review.title) {
            reviews.push(review);
          }
        });

        // Add summary as first item
        if (rating) {
          reviews.unshift({
            type: 'summary',
            averageRating: parseFloat(rating),
            totalCount: reviewCount,
            distribution: this.extractRatingDistribution()
          });
        }

      } catch (e) {
        console.warn('[ShopOpti+ Amazon] Review extraction error:', e);
      }

      return reviews.slice(0, 50);
    }

    extractRatingDistribution() {
      const distribution = {};
      document.querySelectorAll('#histogramTable tr, .a-histogram-row').forEach(row => {
        const stars = row.querySelector('.a-text-right, td:first-child')?.textContent?.match(/(\d)/)?.[1];
        const percent = row.querySelector('.a-nowrap, td:last-child')?.textContent?.match(/(\d+)%/)?.[1];
        if (stars && percent) {
          distribution[stars] = parseInt(percent);
        }
      });
      return distribution;
    }

    /**
     * Extract product specifications
     */
    async extractSpecifications() {
      const specs = {};

      try {
        // Product details table
        document.querySelectorAll('#productDetails_detailBullets_sections1 tr, #prodDetails tr').forEach(row => {
          const key = row.querySelector('th')?.textContent?.trim();
          const value = row.querySelector('td')?.textContent?.trim();
          if (key && value) {
            specs[key] = value;
          }
        });

        // Detail bullets
        document.querySelectorAll('#detailBullets_feature_div li, #productDetails_techSpec_section_1 tr').forEach(el => {
          const text = el.textContent?.trim();
          const colonIndex = text?.indexOf(':');
          if (colonIndex > 0) {
            const key = text.substring(0, colonIndex).trim();
            const value = text.substring(colonIndex + 1).trim();
            if (key && value) {
              specs[key] = value;
            }
          }
        });

        // Technical specs
        document.querySelectorAll('#tech-specs-desktop tr, .tech-spec-table tr').forEach(row => {
          const key = row.querySelector('th, td:first-child')?.textContent?.trim();
          const value = row.querySelector('td:last-child')?.textContent?.trim();
          if (key && value && key !== value) {
            specs[key] = value;
          }
        });

      } catch (e) {
        console.warn('[ShopOpti+ Amazon] Specs extraction error:', e);
      }

      return specs;
    }
  }

  // Export to global scope
  window.ShopOptiAmazonExtractor = AmazonExtractor;
  console.log('[ShopOpti+] Amazon Extractor v5.1.0 loaded');

})();
