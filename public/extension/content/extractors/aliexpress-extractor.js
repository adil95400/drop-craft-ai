/**
 * ShopOpti+ Pro v7 - AliExpress Extractor Module
 * Extracts products, HD images, videos, reviews, and multi-variants from AliExpress
 */
;(function() {
  'use strict';

  class AliExpressExtractor {
    constructor() {
      this.platform = 'aliexpress';
    }

    async extract() {
      const product = {};

      // Try __NEXT_DATA__ / runParams first (most reliable)
      const scriptData = this._extractFromScriptData();
      if (scriptData) Object.assign(product, scriptData);

      // Fallback: DOM extraction
      if (!product.title) {
        product.title = this._extractTitle();
      }
      if (!product.price || product.price === 0) {
        product.price = this._extractPrice();
      }

      // HD Images
      if (!product.images || product.images.length === 0) {
        product.images = this._extractHDImages();
      }

      // Videos
      product.videos = product.videos || this._extractVideos();

      // Variants
      if (!product.variants || product.variants.length === 0) {
        product.variants = this._extractVariants();
      }

      // Reviews
      product.reviews = this._extractReviews();

      // Category
      product.category = product.category || this._extractCategory();

      // Description
      if (!product.description) {
        const descFrame = document.querySelector('#product-description iframe, .product-description');
        product.description = descFrame?.textContent?.trim()?.substring(0, 2000) || '';
      }

      product.platform = this.platform;
      product.url = window.location.href;
      product.extracted_at = new Date().toISOString();

      return product;
    }

    _extractFromScriptData() {
      try {
        // Method 1: __NEXT_DATA__
        const nextData = document.querySelector('#__NEXT_DATA__');
        if (nextData) {
          const data = JSON.parse(nextData.textContent);
          const pageData = data?.props?.pageProps?.data || data?.props?.pageProps;
          if (pageData) return this._parsePageData(pageData);
        }

        // Method 2: runParams in script tags
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
          const text = script.textContent;
          if (text.includes('runParams') || text.includes('actionModule') || text.includes('skuModule')) {
            const runMatch = text.match(/data:\s*({.+})\s*[,;]/s);
            if (runMatch) {
              try {
                const data = JSON.parse(runMatch[1]);
                return this._parsePageData(data);
              } catch {}
            }
          }
        }
      } catch (e) {
        console.log('[AliExpress Extractor] Script data extraction failed:', e.message);
      }
      return null;
    }

    _parsePageData(data) {
      const product = {};
      
      // Title
      product.title = data.titleModule?.subject || data.productInfoComponent?.subject || '';

      // Price
      const priceModule = data.priceModule || data.priceComponent;
      if (priceModule) {
        product.price = parseFloat(priceModule.minAmount?.value || priceModule.formatedActivityPrice?.replace(/[^\d.]/g, '') || priceModule.formatedPrice?.replace(/[^\d.]/g, '') || 0);
        product.original_price = parseFloat(priceModule.maxAmount?.value || priceModule.formatedPrice?.replace(/[^\d.]/g, '') || 0);
        product.currency = priceModule.minAmount?.currency || 'USD';
      }

      // Images
      const imageModule = data.imageModule || data.imageComponent;
      if (imageModule?.imagePathList) {
        product.images = imageModule.imagePathList.map(url => {
          let hd = url.replace(/_\d+x\d+\./g, '.').replace(/\?.*$/g, '');
          if (!hd.startsWith('http')) hd = 'https:' + hd;
          return hd;
        });
      }

      // Videos
      if (imageModule?.videoUid || imageModule?.videoUrl) {
        product.videos = [{ type: 'product', url: imageModule.videoUrl || '', uid: imageModule.videoUid }];
      }

      // Variants (SKU module)
      const skuModule = data.skuModule || data.skuComponent;
      if (skuModule?.productSKUPropertyList) {
        product.variants = [];
        skuModule.productSKUPropertyList.forEach(prop => {
          const propName = prop.skuPropertyName || 'Option';
          (prop.skuPropertyValues || []).forEach(val => {
            product.variants.push({
              type: propName,
              name: val.propertyValueDisplayName || val.propertyValueName || '',
              image: val.skuPropertyImagePath ? (val.skuPropertyImagePath.startsWith('http') ? val.skuPropertyImagePath : 'https:' + val.skuPropertyImagePath) : null,
              id: val.propertyValueId
            });
          });
        });
      }

      // Brand & Store
      const storeModule = data.storeModule || data.storeComponent;
      product.brand = storeModule?.storeName || '';
      product.store_url = storeModule?.storeURL || '';

      // Rating
      const feedbackModule = data.titleModule || data.feedbackComponent;
      product.rating = feedbackModule?.feedbackRating?.averageStar || null;
      product.review_count = feedbackModule?.feedbackRating?.totalValidNum || 0;

      // Category
      product.category = data.crossLinkModule?.breadCrumbPathList?.map(b => b.name).join(' > ') || '';

      return product;
    }

    _extractTitle() {
      const selectors = ['h1[data-pl="product-title"]', '.product-title-text', 'h1.product-title', 'h1'];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el?.textContent?.trim()) return el.textContent.trim();
      }
      return '';
    }

    _extractPrice() {
      const selectors = [
        '.product-price-value', '[class*="uniform-banner-box-price"]',
        '.es--wrap--erdmPRe .es--char--ygDsJMW', '.product-price-current'
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

    _extractHDImages() {
      const images = new Set();

      // Thumbnail gallery → HD
      const thumbs = document.querySelectorAll('.slider--img--D7MJNPZ, .images-view-item img, [class*="slider"] img');
      thumbs.forEach(img => {
        let src = img.src || img.dataset.src || '';
        if (src) {
          src = src.replace(/_\d+x\d+\./g, '.').replace(/\?.*$/g, '');
          if (!src.startsWith('http')) src = 'https:' + src;
          images.add(src);
        }
      });

      return [...images].filter(u => u.includes('alicdn') || u.startsWith('https://')).slice(0, 30);
    }

    _extractVideos() {
      const videos = [];
      const videoEls = document.querySelectorAll('video source, [class*="video"] video');
      videoEls.forEach(el => {
        const src = el.src || el.querySelector('source')?.src;
        if (src) videos.push({ type: 'product', url: src });
      });
      return videos.slice(0, 5);
    }

    _extractVariants() {
      const variants = [];
      const groups = document.querySelectorAll('.sku-property-list, [class*="sku-property"]');
      
      groups.forEach(group => {
        const label = group.closest('[class*="sku-item"]')?.querySelector('[class*="sku-title"]')?.textContent?.trim() || 'Option';
        const items = group.querySelectorAll('[class*="sku-property-item"], .sku-property-image');
        
        items.forEach(item => {
          const name = item.title || item.textContent?.trim() || '';
          const img = item.querySelector('img')?.src;
          if (name) {
            variants.push({
              type: label.replace(':', ''),
              name: name.substring(0, 100),
              image: img ? (img.startsWith('http') ? img : 'https:' + img) : null
            });
          }
        });
      });

      return variants.slice(0, 100);
    }

    _extractReviews() {
      const reviews = [];
      const reviewEls = document.querySelectorAll('[class*="review--item"], .feedback-item');
      
      reviewEls.forEach(el => {
        const author = el.querySelector('[class*="review--name"], .user-name')?.textContent?.trim();
        const ratingEl = el.querySelector('[class*="review--star"], .star-view');
        const body = el.querySelector('[class*="review--content"], .buyer-feedback span')?.textContent?.trim();
        const date = el.querySelector('[class*="review--time"], .r-time')?.textContent?.trim();
        const images = Array.from(el.querySelectorAll('[class*="review--img"] img, .r-photo img'))
          .map(img => img.src).filter(Boolean);

        if (body) {
          reviews.push({
            author: author || 'Acheteur',
            rating: ratingEl ? (ratingEl.querySelectorAll('[class*="star--active"]').length || 5) : null,
            body: body.substring(0, 1000),
            date,
            images: images.slice(0, 5),
            country: el.querySelector('[class*="review--country"], .user-country')?.textContent?.trim()
          });
        }
      });

      return reviews.slice(0, 20);
    }

    _extractCategory() {
      const breadcrumbs = document.querySelectorAll('.breadcrumb--item a, [class*="breadcrumb"] a');
      return Array.from(breadcrumbs).map(a => a.textContent.trim()).filter(Boolean).join(' > ') || null;
    }
  }

  if (typeof window !== 'undefined') {
    window.AliExpressExtractor = AliExpressExtractor;
    if (window.ExtractorRegistry) window.ExtractorRegistry.register('aliexpress', AliExpressExtractor);
  }
})();
