/**
 * ShopOpti+ Pro v7 - TikTok Shop Extractor Module
 * Extracts products, videos, reviews from TikTok Shop
 */
;(function() {
  'use strict';

  class TikTokExtractor {
    constructor() {
      this.platform = 'tiktok';
    }

    async extract() {
      const product = {};

      // Try SSR data first
      const ssrData = this._extractFromSSRData();
      if (ssrData) Object.assign(product, ssrData);

      // DOM fallback
      if (!product.title) product.title = this._extractTitle();
      if (!product.price) product.price = this._extractPrice();
      if (!product.images || product.images.length === 0) product.images = this._extractImages();

      product.videos = this._extractVideos();
      product.variants = product.variants || this._extractVariants();
      product.reviews = this._extractReviews();
      product.brand = product.brand || document.querySelector('[class*="shop-name"], [data-e2e="shop-name"]')?.textContent?.trim() || '';
      product.category = this._extractCategory();
      product.description = product.description || document.querySelector('[class*="product-desc"], [data-e2e="product-desc"]')?.textContent?.trim()?.substring(0, 2000) || '';

      product.platform = this.platform;
      product.url = window.location.href;
      product.extracted_at = new Date().toISOString();

      return product;
    }

    _extractFromSSRData() {
      try {
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
          const text = script.textContent;
          if (text.includes('__INIT_PROPS__') || text.includes('productDetail') || text.includes('__NEXT_DATA__')) {
            // Try multiple data patterns
            const patterns = [
              /window\.__INIT_PROPS__\s*=\s*({.+});/s,
              /window\.__NEXT_DATA__\s*=\s*({.+});/s,
              /"productDetail"\s*:\s*({.+?})\s*[,}]/s
            ];
            
            for (const pattern of patterns) {
              const match = text.match(pattern);
              if (match) {
                try {
                  const data = JSON.parse(match[1]);
                  return this._parseSSRData(data);
                } catch {}
              }
            }
          }
        }
      } catch {}
      return null;
    }

    _parseSSRData(data) {
      const product = {};
      const detail = data?.pageProps?.productDetail || data?.productDetail || data;
      
      if (detail?.title) product.title = detail.title;
      if (detail?.price) {
        product.price = parseFloat(detail.price.salePrice || detail.price.originalPrice || 0) / 100;
        product.original_price = parseFloat(detail.price.originalPrice || 0) / 100;
      }
      if (detail?.images) {
        product.images = detail.images.map(img => typeof img === 'string' ? img : img.url).filter(Boolean);
      }
      if (detail?.skus) {
        product.variants = detail.skus.map(sku => ({
          name: sku.title || sku.name || '',
          price: sku.price ? parseFloat(sku.price) / 100 : null,
          stock: sku.stock,
          sku_id: sku.skuId,
          image: sku.image || null
        }));
      }
      if (detail?.shopName) product.brand = detail.shopName;
      if (detail?.description) product.description = detail.description.substring(0, 2000);

      return product;
    }

    _extractTitle() {
      const selectors = [
        '[data-e2e="product-title"]', 'h1[class*="product-title"]',
        '.product-title', 'h1', '[class*="ProductTitle"]'
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el?.textContent?.trim()) return el.textContent.trim();
      }
      return '';
    }

    _extractPrice() {
      const selectors = [
        '[data-e2e="product-price"]', '[class*="product-price"]',
        '[class*="Price"] span', '.price-current'
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) {
          const match = el.textContent.match(/([\d.,]+)/);
          if (match) return parseFloat(match[1].replace(',', '.'));
        }
      }
      return 0;
    }

    _extractImages() {
      const images = new Set();
      const imgEls = document.querySelectorAll(
        '[class*="product-image"] img, [class*="gallery"] img, [class*="swiper"] img, [data-e2e="product-image"] img'
      );
      imgEls.forEach(img => {
        const src = img.src || img.dataset.src;
        if (src && src.startsWith('http') && !src.includes('avatar')) images.add(src);
      });
      return [...images].slice(0, 30);
    }

    _extractVideos() {
      const videos = [];

      // TikTok video elements
      const videoEls = document.querySelectorAll('video');
      videoEls.forEach(el => {
        const src = el.src || el.querySelector('source')?.src;
        if (src) videos.push({ type: 'product', url: src, poster: el.poster || null });
      });

      // TikTok video URLs in data
      try {
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
          const matches = script.textContent.matchAll(/"(https:\/\/[^"]*(?:video|\.mp4)[^"]*)"/g);
          for (const m of matches) {
            if (!videos.some(v => v.url === m[1])) {
              videos.push({ type: 'tiktok', url: m[1] });
            }
          }
        }
      } catch {}

      return videos.slice(0, 10);
    }

    _extractVariants() {
      const variants = [];
      const groups = document.querySelectorAll('[class*="sku-selector"], [class*="variant-group"], [data-e2e="sku-selector"]');
      
      groups.forEach(group => {
        const label = group.querySelector('[class*="label"], [class*="title"]')?.textContent?.trim() || 'Option';
        const items = group.querySelectorAll('[class*="sku-item"], [class*="variant-item"], button[class*="option"]');
        
        items.forEach(item => {
          const name = item.textContent?.trim() || item.title || '';
          const img = item.querySelector('img')?.src;
          if (name) {
            variants.push({ type: label, name: name.substring(0, 100), image: img || null });
          }
        });
      });

      return variants.slice(0, 100);
    }

    _extractReviews() {
      const reviews = [];
      const reviewEls = document.querySelectorAll('[class*="review-item"], [data-e2e="review-item"]');
      
      reviewEls.forEach(el => {
        const author = el.querySelector('[class*="user-name"], [class*="reviewer"]')?.textContent?.trim();
        const body = el.querySelector('[class*="review-content"], [class*="comment-text"]')?.textContent?.trim();
        const ratingEl = el.querySelector('[class*="star-rating"], [class*="rating"]');
        const images = Array.from(el.querySelectorAll('[class*="review-image"] img'))
          .map(img => img.src).filter(Boolean);
        const videoEl = el.querySelector('[class*="review-video"] video');

        if (body) {
          reviews.push({
            author: author || 'TikTok User',
            body: body.substring(0, 1000),
            rating: ratingEl ? (ratingEl.querySelectorAll('[class*="active"], [class*="filled"]').length || null) : null,
            images: images.slice(0, 5),
            video: videoEl?.src || null,
            source: 'tiktok_shop'
          });
        }
      });

      return reviews.slice(0, 20);
    }

    _extractCategory() {
      const breadcrumbs = document.querySelectorAll('[class*="breadcrumb"] a, nav a');
      return Array.from(breadcrumbs).map(a => a.textContent.trim()).filter(t => t && t !== 'Home').join(' > ') || null;
    }
  }

  if (typeof window !== 'undefined') {
    window.TikTokExtractor = TikTokExtractor;
    if (window.ExtractorRegistry) window.ExtractorRegistry.register('tiktok', TikTokExtractor);
  }
})();
