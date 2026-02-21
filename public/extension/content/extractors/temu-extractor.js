/**
 * ShopOpti+ Pro v7 - Temu Extractor Module
 * Extracts products, images, videos, reviews from Temu
 */
;(function() {
  'use strict';

  class TemuExtractor {
    constructor() {
      this.platform = 'temu';
    }

    async extract() {
      const product = {};

      // Try SSR / __NEXT_DATA__
      const ssrData = this._extractFromSSR();
      if (ssrData) Object.assign(product, ssrData);

      if (!product.title) {
        product.title = document.querySelector('h1[class*="goods-title"], [class*="ProductTitle"], h1')?.textContent?.trim() || '';
      }
      if (!product.price) product.price = this._extractPrice();
      if (!product.images || product.images.length === 0) product.images = this._extractImages();

      product.videos = this._extractVideos();
      product.variants = product.variants || this._extractVariants();
      product.reviews = this._extractReviews();

      product.brand = document.querySelector('[class*="store-name"], [class*="shop-name"]')?.textContent?.trim() || 'Temu';
      product.category = this._extractCategory();
      product.description = document.querySelector('[class*="goods-desc"], [class*="product-desc"]')?.textContent?.trim()?.substring(0, 2000) || '';

      product.platform = this.platform;
      product.url = window.location.href;
      product.extracted_at = new Date().toISOString();

      return product;
    }

    _extractFromSSR() {
      try {
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
          const text = script.textContent;
          if (text.includes('rawData') || text.includes('goodsData') || text.includes('__NEXT_DATA__')) {
            const patterns = [
              /window\.__rawData\s*=\s*({.+?});/s,
              /window\.__NEXT_DATA__\s*=\s*({.+?});/s
            ];
            for (const p of patterns) {
              const match = text.match(p);
              if (match) {
                const data = JSON.parse(match[1]);
                const goods = data?.store?.goods || data?.props?.pageProps?.goods;
                if (goods) {
                  return {
                    title: goods.goodsName || goods.title,
                    price: parseFloat(goods.minNormalPrice || goods.price || 0) / 100,
                    images: (goods.hdThumbUrl || goods.imageList || []).map(u => typeof u === 'string' ? u : u.url).filter(Boolean),
                    variants: (goods.skuList || []).map(s => ({
                      name: s.specName || s.title || '',
                      price: s.price ? parseFloat(s.price) / 100 : null,
                      stock: s.stock,
                      image: s.image || null
                    }))
                  };
                }
              }
            }
          }
        }
      } catch {}
      return null;
    }

    _extractPrice() {
      const selectors = [
        '[class*="goods-price"] [class*="value"]', '[class*="price-current"]',
        '[class*="Price"] span', '.price'
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
      document.querySelectorAll('[class*="goods-gallery"] img, [class*="swiper-slide"] img, [class*="carousel"] img').forEach(img => {
        const src = img.src || img.dataset.src;
        if (src && src.startsWith('http')) {
          images.add(src.replace(/_thumbnail_\d+/g, '').replace(/\?.*$/g, ''));
        }
      });
      return [...images].slice(0, 30);
    }

    _extractVideos() {
      const videos = [];
      document.querySelectorAll('video').forEach(el => {
        const src = el.src || el.querySelector('source')?.src;
        if (src) videos.push({ type: 'product', url: src, poster: el.poster || null });
      });
      return videos.slice(0, 5);
    }

    _extractVariants() {
      const variants = [];
      document.querySelectorAll('[class*="sku-selector"], [class*="spec-list"]').forEach(group => {
        const label = group.querySelector('[class*="spec-title"], [class*="label"]')?.textContent?.trim() || 'Option';
        group.querySelectorAll('[class*="spec-item"], [class*="sku-item"], button').forEach(item => {
          const name = item.textContent?.trim() || item.title;
          const img = item.querySelector('img')?.src;
          if (name && name.length < 100) {
            variants.push({ type: label, name, image: img || null });
          }
        });
      });
      return variants.slice(0, 100);
    }

    _extractReviews() {
      const reviews = [];
      document.querySelectorAll('[class*="review-item"], [class*="comment-item"]').forEach(el => {
        const author = el.querySelector('[class*="user-name"]')?.textContent?.trim();
        const body = el.querySelector('[class*="review-content"], [class*="comment-text"]')?.textContent?.trim();
        const images = Array.from(el.querySelectorAll('[class*="review-img"] img')).map(i => i.src).filter(Boolean);

        if (body) {
          reviews.push({
            author: author || 'Temu User',
            body: body.substring(0, 1000),
            images: images.slice(0, 5)
          });
        }
      });
      return reviews.slice(0, 20);
    }

    _extractCategory() {
      const breadcrumbs = document.querySelectorAll('[class*="breadcrumb"] a');
      return Array.from(breadcrumbs).map(a => a.textContent.trim()).filter(Boolean).join(' > ') || null;
    }
  }

  if (typeof window !== 'undefined') {
    window.TemuExtractor = TemuExtractor;
    if (window.ExtractorRegistry) window.ExtractorRegistry.register('temu', TemuExtractor);
  }
})();
