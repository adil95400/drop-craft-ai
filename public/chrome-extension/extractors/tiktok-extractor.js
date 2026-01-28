/**
 * ShopOpti+ - TikTok Shop Extractor Module v5.7.0
 * Complete product extraction with videos, variants, and reviews from TikTok Shop
 */

(function() {
  'use strict';

  const VERSION = '5.7.0';
  const PLATFORM = 'tiktok_shop';

  class TikTokShopExtractor {
    constructor() {
      this.productData = null;
      this.variants = [];
      this.videos = [];
      this.reviews = [];
      this.initialized = false;
    }

    /**
     * Check if current page is TikTok Shop
     */
    static isSupported() {
      const hostname = window.location.hostname.toLowerCase();
      return hostname.includes('tiktok.com/shop') || 
             hostname.includes('seller.tiktok.com') ||
             hostname.includes('shop.tiktok.com') ||
             window.location.pathname.includes('/product/');
    }

    /**
     * Detect if we're on a product page
     */
    isProductPage() {
      const url = window.location.href.toLowerCase();
      return url.includes('/product/') || 
             url.includes('/view/') ||
             document.querySelector('[data-e2e="product-detail"]') !== null;
    }

    /**
     * Main extraction method
     */
    async extract() {
      if (!this.isProductPage()) {
        console.log('[TikTok Extractor] Not a product page');
        return null;
      }

      console.log('[TikTok Extractor] Starting extraction...');

      try {
        // Extract from multiple sources
        const scriptData = this.extractFromScripts();
        const domData = this.extractFromDOM();
        const jsonLdData = this.extractJsonLD();
        
        // Merge all data sources
        this.productData = this.mergeData(scriptData, domData, jsonLdData);
        
        // Extract variants
        this.variants = await this.extractVariants();
        
        // Extract videos
        this.videos = await this.extractVideos();
        
        // Extract reviews
        this.reviews = await this.extractReviews();

        // Build final product object
        const product = this.buildProduct();
        
        console.log('[TikTok Extractor] Extraction complete:', product.title);
        return product;
      } catch (error) {
        console.error('[TikTok Extractor] Extraction failed:', error);
        return null;
      }
    }

    /**
     * Extract data from page scripts
     */
    extractFromScripts() {
      const data = {
        title: null,
        description: null,
        price: null,
        originalPrice: null,
        currency: 'USD',
        images: [],
        sku: null,
        productId: null,
        sellerId: null,
        stock: null,
        category: null,
        brand: null,
        specs: {}
      };

      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        const content = script.textContent || '';
        
        // Look for product data in __INITIAL_STATE__ or similar
        const patterns = [
          /__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});/,
          /window\.__DATA__\s*=\s*(\{[\s\S]*?\});/,
          /window\.productData\s*=\s*(\{[\s\S]*?\});/,
          /"productDetail"\s*:\s*(\{[\s\S]*?\})\s*,/,
          /"product"\s*:\s*(\{[\s\S]*?\})\s*,/
        ];

        for (const pattern of patterns) {
          const match = content.match(pattern);
          if (match) {
            try {
              const parsed = JSON.parse(match[1]);
              this.parseScriptData(parsed, data);
            } catch (e) {
              // Try to extract specific fields
              this.extractFieldsFromScript(content, data);
            }
          }
        }

        // Direct field extraction
        this.extractFieldsFromScript(content, data);
      }

      return data;
    }

    /**
     * Parse structured script data
     */
    parseScriptData(obj, data) {
      if (!obj) return;

      // Recursive search for product data
      const searchKeys = ['product', 'productDetail', 'item', 'goods'];
      
      for (const key of searchKeys) {
        if (obj[key]) {
          const product = obj[key];
          data.title = data.title || product.title || product.name || product.productName;
          data.description = data.description || product.description || product.desc;
          data.price = data.price || product.price || product.salePrice || product.currentPrice;
          data.originalPrice = data.originalPrice || product.originalPrice || product.marketPrice;
          data.productId = data.productId || product.id || product.productId || product.itemId;
          data.sku = data.sku || product.sku || product.skuId;
          data.stock = data.stock || product.stock || product.quantity || product.availableQuantity;
          data.category = data.category || product.category || product.categoryName;
          data.brand = data.brand || product.brand || product.brandName;
          
          // Extract images
          if (product.images && Array.isArray(product.images)) {
            data.images.push(...product.images.map(img => typeof img === 'string' ? img : img.url || img.src));
          }
          if (product.mainImages && Array.isArray(product.mainImages)) {
            data.images.push(...product.mainImages.map(img => typeof img === 'string' ? img : img.url || img.urlList?.[0]));
          }
        }
      }

      // Check nested structures
      if (obj.data) this.parseScriptData(obj.data, data);
      if (obj.props) this.parseScriptData(obj.props, data);
      if (obj.pageProps) this.parseScriptData(obj.pageProps, data);
    }

    /**
     * Extract individual fields from script content
     */
    extractFieldsFromScript(content, data) {
      const patterns = {
        title: [/"title"\s*:\s*"([^"]+)"/g, /"productName"\s*:\s*"([^"]+)"/g, /"name"\s*:\s*"([^"]+)"/g],
        description: [/"description"\s*:\s*"([^"]+)"/g, /"desc"\s*:\s*"([^"]+)"/g],
        price: [/"price"\s*:\s*"?(\d+\.?\d*)"?/g, /"salePrice"\s*:\s*"?(\d+\.?\d*)"?/g],
        productId: [/"productId"\s*:\s*"([^"]+)"/g, /"id"\s*:\s*"(\d+)"/g],
        images: [/"imageUrl"\s*:\s*"([^"]+)"/g, /https:\/\/[^"'\s]+\.(?:jpg|jpeg|png|webp)[^"'\s]*/gi]
      };

      for (const [field, fieldPatterns] of Object.entries(patterns)) {
        if (!data[field] || (Array.isArray(data[field]) && data[field].length === 0)) {
          for (const pattern of fieldPatterns) {
            const matches = content.matchAll(pattern);
            for (const match of matches) {
              const value = match[1] || match[0];
              if (field === 'images') {
                if (!data.images.includes(value) && this.isValidImageUrl(value)) {
                  data.images.push(value);
                }
              } else if (field === 'price') {
                data[field] = parseFloat(value);
              } else {
                data[field] = data[field] || this.cleanText(value);
              }
            }
          }
        }
      }
    }

    /**
     * Extract data from DOM elements
     */
    extractFromDOM() {
      const data = {
        title: null,
        description: null,
        price: null,
        originalPrice: null,
        images: [],
        rating: null,
        reviewCount: null
      };

      // Title selectors
      const titleSelectors = [
        '[data-e2e="product-title"]',
        '.product-title',
        'h1[class*="title"]',
        '.pdp-title',
        '[class*="ProductTitle"]'
      ];
      for (const sel of titleSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          data.title = this.cleanText(el.textContent);
          break;
        }
      }

      // Price selectors
      const priceSelectors = [
        '[data-e2e="product-price"]',
        '.product-price',
        '[class*="Price"] [class*="current"]',
        '.pdp-price',
        '[class*="SalePrice"]'
      ];
      for (const sel of priceSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          data.price = this.extractPrice(el.textContent);
          break;
        }
      }

      // Original price
      const originalPriceSelectors = [
        '[class*="original-price"]',
        '[class*="Price"] [class*="origin"]',
        '.line-through',
        'del',
        's'
      ];
      for (const sel of originalPriceSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          data.originalPrice = this.extractPrice(el.textContent);
          break;
        }
      }

      // Images
      const imageSelectors = [
        '[data-e2e="product-image"] img',
        '.product-image img',
        '[class*="gallery"] img',
        '[class*="ImageGallery"] img',
        '.pdp-image img'
      ];
      document.querySelectorAll(imageSelectors.join(', ')).forEach(img => {
        const src = img.src || img.dataset.src || img.getAttribute('data-lazy-src');
        if (src && this.isValidImageUrl(src)) {
          data.images.push(this.getHighResImage(src));
        }
      });

      // Rating
      const ratingEl = document.querySelector('[class*="rating"], [class*="star"], [data-e2e="rating"]');
      if (ratingEl) {
        const ratingText = ratingEl.textContent || ratingEl.getAttribute('aria-label');
        const ratingMatch = ratingText?.match(/(\d+\.?\d*)/);
        if (ratingMatch) data.rating = parseFloat(ratingMatch[1]);
      }

      // Review count
      const reviewCountEl = document.querySelector('[class*="review-count"], [data-e2e="review-count"]');
      if (reviewCountEl) {
        const countMatch = reviewCountEl.textContent?.match(/(\d+)/);
        if (countMatch) data.reviewCount = parseInt(countMatch[1]);
      }

      // Description
      const descSelectors = [
        '[data-e2e="product-description"]',
        '.product-description',
        '[class*="Description"]',
        '.pdp-description'
      ];
      for (const sel of descSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          data.description = this.cleanText(el.textContent);
          break;
        }
      }

      return data;
    }

    /**
     * Extract JSON-LD structured data
     */
    extractJsonLD() {
      const data = {
        title: null,
        description: null,
        price: null,
        currency: null,
        images: [],
        sku: null,
        brand: null
      };

      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          const json = JSON.parse(script.textContent);
          const products = Array.isArray(json) ? json : [json];
          
          for (const item of products) {
            if (item['@type'] === 'Product') {
              data.title = item.name;
              data.description = item.description;
              data.sku = item.sku;
              data.brand = item.brand?.name || item.brand;
              
              if (item.image) {
                const imgs = Array.isArray(item.image) ? item.image : [item.image];
                data.images.push(...imgs);
              }
              
              if (item.offers) {
                const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
                data.price = parseFloat(offer.price);
                data.currency = offer.priceCurrency;
              }
            }
          }
        } catch (e) {
          // Ignore parse errors
        }
      }

      return data;
    }

    /**
     * Extract product variants
     */
    async extractVariants() {
      const variants = [];

      // Extract from scripts
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        const content = script.textContent || '';
        
        const skuPatterns = [
          /"skuList"\s*:\s*(\[[\s\S]*?\])/,
          /"variants"\s*:\s*(\[[\s\S]*?\])/,
          /"skus"\s*:\s*(\[[\s\S]*?\])/
        ];

        for (const pattern of skuPatterns) {
          const match = content.match(pattern);
          if (match) {
            try {
              const skuList = JSON.parse(match[1]);
              for (const sku of skuList) {
                variants.push({
                  id: sku.skuId || sku.id,
                  sku: sku.sku || sku.skuCode,
                  price: sku.price || sku.salePrice,
                  originalPrice: sku.originalPrice || sku.marketPrice,
                  stock: sku.stock || sku.quantity || 0,
                  options: sku.specs || sku.attributes || [],
                  image: sku.image || sku.imageUrl,
                  available: (sku.stock || sku.quantity || 0) > 0
                });
              }
            } catch (e) {}
          }
        }
      }

      // Extract from DOM if no variants found
      if (variants.length === 0) {
        const optionGroups = [];
        
        const optionContainers = document.querySelectorAll('[class*="sku-item"], [class*="variant"], [class*="option-group"]');
        optionContainers.forEach(container => {
          const titleEl = container.querySelector('[class*="title"], [class*="label"]');
          const valueEls = container.querySelectorAll('[class*="value"], [class*="option"], button');
          
          if (titleEl && valueEls.length > 0) {
            const groupName = this.cleanText(titleEl.textContent);
            const values = Array.from(valueEls).map(el => ({
              name: el.textContent?.trim() || el.getAttribute('aria-label'),
              image: el.querySelector('img')?.src,
              selected: el.classList.contains('selected') || el.getAttribute('aria-selected') === 'true'
            })).filter(v => v.name);
            
            if (groupName && values.length > 0) {
              optionGroups.push({ name: groupName, values });
            }
          }
        });

        // Generate combinations if we have option groups
        if (optionGroups.length > 0) {
          this.generateVariantCombinations(optionGroups, variants);
        }
      }

      return variants;
    }

    /**
     * Generate variant combinations from option groups
     */
    generateVariantCombinations(optionGroups, variants, current = {}, index = 0) {
      if (index === optionGroups.length) {
        variants.push({
          id: `var-${Date.now()}-${variants.length}`,
          sku: this.generateSku(current),
          options: { ...current },
          available: true
        });
        return;
      }

      const group = optionGroups[index];
      for (const value of group.values) {
        this.generateVariantCombinations(
          optionGroups,
          variants,
          { ...current, [group.name]: value.name },
          index + 1
        );
      }
    }

    /**
     * Generate SKU from variant options
     */
    generateSku(options) {
      return Object.values(options)
        .map(v => v.replace(/\s+/g, '-').toUpperCase())
        .join('-');
    }

    /**
     * Extract product videos
     */
    async extractVideos() {
      const videos = [];
      const seenUrls = new Set();

      // Direct video elements
      document.querySelectorAll('video').forEach(video => {
        const src = video.src || video.querySelector('source')?.src;
        if (src && !seenUrls.has(src) && this.isValidVideoUrl(src)) {
          seenUrls.add(src);
          videos.push({
            url: src,
            type: 'product',
            source: 'video-element',
            thumbnail: video.poster
          });
        }
      });

      // Extract from scripts
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        const content = script.textContent || '';
        
        const videoPatterns = [
          /"videoUrl"\s*:\s*"([^"]+)"/g,
          /"video"\s*:\s*"([^"]+\.mp4[^"]*)"/g,
          /"playUrl"\s*:\s*"([^"]+)"/g,
          /https?:\/\/[^"'\s]+\.mp4[^"'\s]*/g,
          /https?:\/\/[^"'\s]+v\d+[^"'\s]*\.mp4[^"'\s]*/g
        ];

        for (const pattern of videoPatterns) {
          const matches = content.matchAll(pattern);
          for (const match of matches) {
            const url = match[1] || match[0];
            if (!seenUrls.has(url) && this.isValidVideoUrl(url)) {
              seenUrls.add(url);
              videos.push({
                url: this.cleanUrl(url),
                type: 'product',
                source: 'script'
              });
            }
          }
        }
      }

      // Look for video thumbnails/players
      document.querySelectorAll('[class*="video-player"], [class*="VideoPlayer"], [data-e2e*="video"]').forEach(player => {
        const dataUrl = player.dataset.src || player.dataset.video || player.dataset.url;
        if (dataUrl && !seenUrls.has(dataUrl)) {
          seenUrls.add(dataUrl);
          videos.push({
            url: dataUrl,
            type: 'product',
            source: 'player'
          });
        }
      });

      return videos;
    }

    /**
     * Extract product reviews
     */
    async extractReviews() {
      const reviews = [];

      // TikTok Shop review selectors
      const reviewContainers = document.querySelectorAll(
        '[class*="review-item"], [class*="ReviewItem"], [data-e2e*="review"], [class*="comment-item"]'
      );

      reviewContainers.forEach(container => {
        try {
          const review = {
            author: null,
            rating: null,
            content: null,
            date: null,
            images: [],
            videos: [],
            verified: false,
            helpful: 0
          };

          // Author
          const authorEl = container.querySelector('[class*="user-name"], [class*="author"], [class*="nickname"]');
          if (authorEl) review.author = this.cleanText(authorEl.textContent);

          // Rating
          const ratingEl = container.querySelector('[class*="star"], [class*="rating"]');
          if (ratingEl) {
            const starCount = ratingEl.querySelectorAll('[class*="filled"], [class*="active"]').length;
            review.rating = starCount || this.extractRating(ratingEl.textContent);
          }

          // Content
          const contentEl = container.querySelector('[class*="content"], [class*="text"], [class*="comment"]');
          if (contentEl) review.content = this.cleanText(contentEl.textContent);

          // Date
          const dateEl = container.querySelector('[class*="date"], [class*="time"]');
          if (dateEl) review.date = this.cleanText(dateEl.textContent);

          // Images
          container.querySelectorAll('[class*="review-image"] img, [class*="photo"] img').forEach(img => {
            const src = img.src || img.dataset.src;
            if (src && this.isValidImageUrl(src)) {
              review.images.push(this.getHighResImage(src));
            }
          });

          // Videos
          container.querySelectorAll('[class*="video"] video, [data-video-url]').forEach(video => {
            const src = video.src || video.dataset.videoUrl;
            if (src) review.videos.push(src);
          });

          // Verified
          review.verified = container.querySelector('[class*="verified"]') !== null;

          if (review.content || review.images.length > 0) {
            reviews.push(review);
          }
        } catch (e) {
          console.warn('[TikTok Extractor] Review extraction error:', e);
        }
      });

      // Extract from scripts for more reviews
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        const content = script.textContent || '';
        
        try {
          const reviewMatch = content.match(/"reviews"\s*:\s*(\[[\s\S]*?\])/);
          if (reviewMatch) {
            const scriptReviews = JSON.parse(reviewMatch[1]);
            for (const r of scriptReviews) {
              if (!reviews.some(existing => existing.content === r.content || existing.author === r.userName)) {
                reviews.push({
                  author: r.userName || r.author || r.nickname,
                  rating: r.rating || r.score,
                  content: r.content || r.text || r.comment,
                  date: r.createTime || r.date,
                  images: r.images || [],
                  videos: r.videos || [],
                  verified: r.verified || false
                });
              }
            }
          }
        } catch (e) {}
      }

      return reviews;
    }

    /**
     * Merge data from multiple sources
     */
    mergeData(scriptData, domData, jsonLdData) {
      const merged = {
        title: scriptData.title || domData.title || jsonLdData.title,
        description: scriptData.description || domData.description || jsonLdData.description,
        price: scriptData.price || domData.price || jsonLdData.price,
        originalPrice: scriptData.originalPrice || domData.originalPrice,
        currency: scriptData.currency || jsonLdData.currency || 'USD',
        images: [...new Set([...scriptData.images, ...domData.images, ...jsonLdData.images])].filter(Boolean),
        sku: scriptData.sku || jsonLdData.sku,
        productId: scriptData.productId || this.extractProductIdFromUrl(),
        stock: scriptData.stock,
        category: scriptData.category,
        brand: scriptData.brand || jsonLdData.brand,
        rating: domData.rating,
        reviewCount: domData.reviewCount,
        sellerId: scriptData.sellerId,
        specs: scriptData.specs
      };

      return merged;
    }

    /**
     * Build final product object
     */
    buildProduct() {
      return {
        platform: PLATFORM,
        source: 'tiktok_shop',
        url: window.location.href,
        productId: this.productData.productId,
        externalId: this.productData.productId,
        
        // Basic info
        title: this.productData.title,
        description: this.productData.description,
        
        // Pricing
        price: this.productData.price,
        originalPrice: this.productData.originalPrice,
        currency: this.productData.currency,
        discount: this.calculateDiscount(this.productData.price, this.productData.originalPrice),
        
        // Media
        images: this.productData.images,
        mainImage: this.productData.images[0],
        videos: this.videos,
        
        // Variants
        variants: this.variants,
        hasVariants: this.variants.length > 0,
        variantCount: this.variants.length,
        
        // Stock & SKU
        sku: this.productData.sku,
        stock: this.productData.stock,
        inStock: this.productData.stock > 0,
        
        // Reviews
        reviews: this.reviews,
        reviewCount: this.productData.reviewCount || this.reviews.length,
        rating: this.productData.rating,
        
        // Seller info
        sellerId: this.productData.sellerId,
        sellerName: this.productData.sellerName,
        
        // Category
        category: this.productData.category,
        brand: this.productData.brand,
        
        // Metadata
        extractedAt: new Date().toISOString(),
        extractorVersion: VERSION
      };
    }

    // Utility methods
    cleanText(text) {
      return text?.trim().replace(/\s+/g, ' ') || null;
    }

    cleanUrl(url) {
      try {
        return url.replace(/\\u002F/g, '/').replace(/\\/g, '');
      } catch (e) {
        return url;
      }
    }

    extractPrice(text) {
      const match = text?.match(/[\d,]+\.?\d*/);
      return match ? parseFloat(match[0].replace(',', '')) : null;
    }

    extractRating(text) {
      const match = text?.match(/(\d+\.?\d*)/);
      return match ? parseFloat(match[1]) : null;
    }

    calculateDiscount(price, originalPrice) {
      if (!price || !originalPrice || originalPrice <= price) return 0;
      return Math.round((1 - price / originalPrice) * 100);
    }

    extractProductIdFromUrl() {
      const match = window.location.href.match(/\/product\/(\d+)|\/view\/(\d+)|id=(\d+)/);
      return match ? (match[1] || match[2] || match[3]) : null;
    }

    isValidImageUrl(url) {
      if (!url) return false;
      const invalidPatterns = [/analytics/, /tracking/, /pixel/, /beacon/, /\.gif$/, /1x1/, /spacer/];
      return !invalidPatterns.some(p => p.test(url)) && url.length > 20;
    }

    isValidVideoUrl(url) {
      if (!url) return false;
      const validPatterns = [/\.mp4/i, /\.webm/i, /\.m3u8/i, /video/i];
      const invalidPatterns = [/analytics/, /tracking/, /ads\./];
      return validPatterns.some(p => p.test(url)) && !invalidPatterns.some(p => p.test(url));
    }

    getHighResImage(url) {
      // TikTok image URL optimization
      return url
        .replace(/\/\d+x\d+\//, '/720x720/')
        .replace(/_\d+x\d+/, '_720x720')
        .replace(/=\d+x\d+/, '=720x720');
    }
  }

  // Export for use in content script
  window.TikTokShopExtractor = TikTokShopExtractor;
  
  // Auto-initialize if on TikTok Shop
  if (TikTokShopExtractor.isSupported()) {
    console.log(`[ShopOpti+] TikTok Shop Extractor v${VERSION} loaded`);
  }

})();
