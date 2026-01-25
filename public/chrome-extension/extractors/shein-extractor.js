/**
 * ShopOpti+ Shein Extractor v5.1.0
 * High-fidelity extraction for Shein product pages
 * Extracts: Images, Variants (color/size), Videos, Reviews, Specifications
 */

(function() {
  'use strict';

  if (window.__shopoptiSheinExtractorLoaded) return;
  window.__shopoptiSheinExtractorLoaded = true;

  class SheinExtractor {
    constructor() {
      this.platform = 'shein';
      this.productId = this.extractProductId();
      this.pageData = null;
    }

    /**
     * Extract product ID from URL
     */
    extractProductId() {
      const patterns = [
        /-p-(\d+)\.html/,
        /goods_id=(\d+)/,
        /\/p-(\d+)/
      ];

      for (const pattern of patterns) {
        const match = window.location.href.match(pattern);
        if (match) return match[1];
      }

      return null;
    }

    /**
     * Try to get page data from window objects
     */
    getPageData() {
      if (this.pageData) return this.pageData;

      // Try common Shein data objects
      const dataKeys = ['productIntroData', 'goodsDetailv2Info', '__INITIAL_DATA__', 'gbProductInfo'];

      for (const key of dataKeys) {
        if (window[key]) {
          this.pageData = window[key];
          return this.pageData;
        }
      }

      // Parse from script tags
      const scripts = document.querySelectorAll('script:not([src])');
      for (const script of scripts) {
        const content = script.textContent;
        
        // productIntroData pattern
        const productMatch = content.match(/productIntroData\s*=\s*(\{[\s\S]*?\});/);
        if (productMatch) {
          try {
            this.pageData = JSON.parse(productMatch[1]);
            return this.pageData;
          } catch (e) {}
        }

        // __INITIAL_DATA__ pattern
        const initialMatch = content.match(/__INITIAL_DATA__\s*=\s*(\{[\s\S]*?\});/);
        if (initialMatch) {
          try {
            this.pageData = JSON.parse(initialMatch[1]);
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
      console.log('[ShopOpti+ Shein] Starting extraction, Product ID:', this.productId);

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
        platform: 'shein',
        extractedAt: new Date().toISOString(),
        ...basicInfo,
        ...pricing,
        images,
        videos,
        variants,
        reviews,
        specifications
      };

      console.log('[ShopOpti+ Shein] Extraction complete:', {
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
      if (this.pageData?.detail) {
        const detail = this.pageData.detail;
        return {
          title: detail.goods_name || detail.productName || this.extractTitleFromDOM(),
          brand: 'SHEIN',
          description: detail.description || detail.goods_desc || this.extractDescriptionFromDOM(),
          sku: detail.goods_sn || detail.sku || this.productId,
          category: detail.cat_id || detail.categoryId || ''
        };
      }

      return {
        title: this.extractTitleFromDOM(),
        brand: 'SHEIN',
        description: this.extractDescriptionFromDOM(),
        sku: this.productId
      };
    }

    extractTitleFromDOM() {
      const selectors = [
        '.product-intro__head-name',
        '[class*="product-name"]',
        '.goods-title',
        'h1[class*="title"]',
        'h1'
      ];

      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el?.textContent?.trim()) {
          return el.textContent.trim();
        }
      }

      return document.title.split('|')[0].trim();
    }

    extractDescriptionFromDOM() {
      const selectors = [
        '.product-intro__description',
        '[class*="description"]',
        '.goods-desc'
      ];

      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el?.textContent?.trim()) {
          return el.textContent.trim().substring(0, 5000);
        }
      }

      return '';
    }

    /**
     * Extract pricing
     */
    async extractPricing() {
      let price = 0;
      let originalPrice = null;
      let currency = 'EUR';

      // From page data
      if (this.pageData?.detail?.retailPrice) {
        price = parseFloat(this.pageData.detail.retailPrice.amount || this.pageData.detail.retailPrice);
        if (this.pageData.detail.salePrice) {
          const salePrice = parseFloat(this.pageData.detail.salePrice.amount || this.pageData.detail.salePrice);
          if (salePrice < price) {
            originalPrice = price;
            price = salePrice;
          }
        }
      }

      // DOM fallback
      if (price === 0) {
        const priceSelectors = [
          '.product-intro__head-price .from',
          '[class*="price"] [class*="current"]',
          '.goods-price',
          '[class*="sale-price"]'
        ];

        for (const sel of priceSelectors) {
          const el = document.querySelector(sel);
          if (el?.textContent) {
            price = this.parsePrice(el.textContent);
            if (price > 0) break;
          }
        }

        // Original price
        const originalSelectors = ['[class*="origin-price"]', '[class*="del-price"]', 'del', 's'];
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
      }

      // Currency detection
      const currencyEl = document.querySelector('[class*="currency"]');
      if (currencyEl?.textContent) {
        if (currencyEl.textContent.includes('€')) currency = 'EUR';
        else if (currencyEl.textContent.includes('$')) currency = 'USD';
        else if (currencyEl.textContent.includes('£')) currency = 'GBP';
      }

      return { price, originalPrice, currency };
    }

    parsePrice(priceStr) {
      if (!priceStr) return 0;
      const clean = priceStr.replace(/[€$£¥\s]/g, '').replace(',', '.').trim();
      const match = clean.match(/[\d.]+/);
      return match ? parseFloat(match[0]) : 0;
    }

    /**
     * Extract images
     */
    async extractImages() {
      const images = new Set();

      // From page data
      if (this.pageData?.detail?.goods_imgs) {
        Object.values(this.pageData.detail.goods_imgs).forEach(imgList => {
          if (Array.isArray(imgList)) {
            imgList.forEach(img => {
              const url = typeof img === 'string' ? img : img.origin_image || img.url;
              if (url) images.add(this.normalizeImageUrl(url));
            });
          }
        });
      }

      // From gallery
      if (this.pageData?.goods_imgs?.detail_image) {
        this.pageData.goods_imgs.detail_image.forEach(img => {
          images.add(this.normalizeImageUrl(img.origin_image || img));
        });
      }

      // From DOM
      const imageSelectors = [
        '.product-intro__thumbs-item img',
        '[class*="goods-gallery"] img',
        '.swiper-slide img',
        '[class*="carousel"] img'
      ];

      for (const sel of imageSelectors) {
        document.querySelectorAll(sel).forEach(img => {
          const src = img.dataset?.src || img.src;
          if (src && (src.includes('shein') || src.includes('ltwebstatic'))) {
            images.add(this.normalizeImageUrl(src));
          }
        });
      }

      // Main image
      const mainImg = document.querySelector('.product-intro__main-image img, [class*="main-image"] img');
      if (mainImg) {
        images.add(this.normalizeImageUrl(mainImg.dataset?.src || mainImg.src));
      }

      return Array.from(images).filter(url => url && url.includes('http')).slice(0, 30);
    }

    normalizeImageUrl(src) {
      if (!src) return null;

      // Ensure HTTPS
      if (src.startsWith('//')) src = 'https:' + src;

      // Get high-res version (remove thumbnail suffix)
      src = src.replace(/_thumbnail_\d+x\d+/, '');
      src = src.replace(/\?.*$/, '');

      return src;
    }

    /**
     * Extract product videos
     */
    async extractVideos() {
      const videos = [];

      // From page data
      if (this.pageData?.detail?.video) {
        const video = this.pageData.detail.video;
        videos.push({
          url: video.url || video,
          type: 'mp4',
          platform: 'shein',
          thumbnail: video.cover || null
        });
      }

      // From video elements
      document.querySelectorAll('video source, video').forEach(el => {
        const src = el.src || el.querySelector('source')?.src;
        if (src && !videos.some(v => v.url === src)) {
          videos.push({ url: src, type: 'mp4', platform: 'shein' });
        }
      });

      return videos.slice(0, 10);
    }

    /**
     * Extract product variants (color, size)
     */
    async extractVariants() {
      const variants = [];

      // From page data - Colors
      if (this.pageData?.detail?.multiColor || this.pageData?.attrList) {
        const colors = this.pageData.detail.multiColor || this.pageData.attrList?.color || [];
        colors.forEach(color => {
          variants.push({
            id: color.goods_id?.toString() || color.id,
            title: color.goods_color_name || color.name || color.value,
            type: 'color',
            image: color.color_image ? this.normalizeImageUrl(color.color_image) : null,
            available: true
          });
        });
      }

      // From page data - Sizes
      if (this.pageData?.detail?.attrSizeList || this.pageData?.sizeList) {
        const sizes = this.pageData.detail.attrSizeList || this.pageData.sizeList || [];
        sizes.forEach(size => {
          variants.push({
            id: size.attr_id?.toString() || size.id,
            title: size.attr_value || size.name || size.size,
            type: 'size',
            available: size.stock > 0 || !size.is_soldout
          });
        });
      }

      // DOM fallback - Colors
      if (variants.filter(v => v.type === 'color').length === 0) {
        document.querySelectorAll('[class*="color-item"], [class*="product-intro__color"] li').forEach(item => {
          const img = item.querySelector('img');
          const title = item.getAttribute('aria-label') || item.getAttribute('title');
          
          if (title || img) {
            variants.push({
              id: `color_${variants.length}`,
              title: title || 'Color',
              type: 'color',
              image: img?.src ? this.normalizeImageUrl(img.src) : null,
              available: !item.className.includes('disabled')
            });
          }
        });
      }

      // DOM fallback - Sizes
      if (variants.filter(v => v.type === 'size').length === 0) {
        document.querySelectorAll('[class*="size-item"], [class*="product-intro__size"] li').forEach(item => {
          const title = item.textContent?.trim();
          
          if (title) {
            variants.push({
              id: `size_${variants.length}`,
              title: title,
              type: 'size',
              available: !item.className.includes('disabled') && !item.className.includes('soldout')
            });
          }
        });
      }

      return variants;
    }

    /**
     * Extract product reviews
     */
    async extractReviews() {
      const reviews = [];

      // Rating summary from page data
      if (this.pageData?.detail?.comment_info) {
        const info = this.pageData.detail.comment_info;
        reviews.push({
          type: 'summary',
          averageRating: parseFloat(info.comment_rank || info.averageRating || 0),
          totalCount: parseInt(info.comment_num || info.totalCount || 0)
        });
      }

      // From DOM
      const ratingEl = document.querySelector('[class*="rate-score"], [class*="rating-score"]');
      const countEl = document.querySelector('[class*="comment-num"], [class*="review-count"]');
      
      if (ratingEl && reviews.length === 0) {
        reviews.push({
          type: 'summary',
          averageRating: parseFloat(ratingEl.textContent?.match(/[\d.]+/)?.[0]) || 0,
          totalCount: parseInt(countEl?.textContent?.match(/[\d,]+/)?.[0]?.replace(',', '')) || 0
        });
      }

      // Individual reviews
      document.querySelectorAll('[class*="comment-item"], [class*="review-item"]').forEach(reviewEl => {
        const review = {
          author: reviewEl.querySelector('[class*="user-name"]')?.textContent?.trim() || 'Anonymous',
          rating: this.extractReviewRating(reviewEl),
          content: reviewEl.querySelector('[class*="comment-content"], [class*="review-content"]')?.textContent?.trim() || '',
          date: reviewEl.querySelector('[class*="comment-time"], [class*="date"]')?.textContent?.trim() || '',
          size: reviewEl.querySelector('[class*="size-info"]')?.textContent?.trim() || '',
          images: []
        };

        // Review images
        reviewEl.querySelectorAll('img').forEach(img => {
          if (img.src && (img.src.includes('shein') || img.src.includes('ltwebstatic'))) {
            review.images.push(this.normalizeImageUrl(img.src));
          }
        });

        if (review.content) {
          reviews.push(review);
        }
      });

      return reviews.slice(0, 50);
    }

    extractReviewRating(el) {
      const starEl = el.querySelector('[class*="rate-star"], [class*="star"]');
      if (starEl) {
        const filledStars = starEl.querySelectorAll('[class*="icon-star-fill"], [class*="filled"]').length;
        if (filledStars > 0) return filledStars;
      }
      
      const ratingText = el.querySelector('[class*="rating"]')?.textContent;
      const match = ratingText?.match(/[\d.]+/);
      if (match) return parseFloat(match[0]);
      
      return 5;
    }

    /**
     * Extract product specifications
     */
    async extractSpecifications() {
      const specs = {};

      // From page data
      if (this.pageData?.detail?.productDetails) {
        this.pageData.detail.productDetails.forEach(detail => {
          specs[detail.attr_name] = detail.attr_value;
        });
      }

      // DOM fallback
      document.querySelectorAll('[class*="description"] li, [class*="details"] li').forEach(el => {
        const text = el.textContent?.trim();
        const colonIndex = text?.indexOf(':');
        if (colonIndex > 0) {
          specs[text.substring(0, colonIndex).trim()] = text.substring(colonIndex + 1).trim();
        }
      });

      return specs;
    }
  }

  // Export to global scope
  window.ShopOptiSheinExtractor = SheinExtractor;
  console.log('[ShopOpti+] Shein Extractor v5.1.0 loaded');

})();
