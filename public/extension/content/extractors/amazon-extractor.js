/**
 * ShopOpti+ Pro v7 - Amazon Extractor Module
 * Extracts products, HD images, videos, reviews, and multi-variants from Amazon
 */
;(function() {
  'use strict';

  class AmazonExtractor {
    constructor() {
      this.platform = 'amazon';
    }

    async extract() {
      const product = {};

      // Title
      const titleEl = document.querySelector('#productTitle') || document.querySelector('#title');
      product.title = titleEl?.textContent?.trim() || '';

      // Price
      product.price = this._extractPrice();

      // Images (HD)
      product.images = this._extractHDImages();

      // Videos
      product.videos = this._extractVideos();

      // Variants (size, color, style)
      product.variants = this._extractVariants();

      // Reviews
      product.reviews = this._extractReviews();

      // Brand
      const brandEl = document.querySelector('#bylineInfo') || document.querySelector('.po-brand .a-span9 .a-size-base');
      product.brand = brandEl?.textContent?.replace(/^(Marque|Brand|Visit the|Visiter la boutique)\s*/i, '').trim() || '';

      // Category (breadcrumb)
      product.category = this._extractCategory();

      // Rating
      const ratingEl = document.querySelector('#acrPopover .a-icon-alt') || document.querySelector('[data-action="acrStar498"] .a-icon-alt');
      if (ratingEl) {
        const match = ratingEl.textContent.match(/([\d.,]+)/);
        product.rating = match ? parseFloat(match[1].replace(',', '.')) : null;
      }

      // Review count
      const reviewCountEl = document.querySelector('#acrCustomerReviewText');
      if (reviewCountEl) {
        const match = reviewCountEl.textContent.match(/([\d.,]+)/);
        product.review_count = match ? parseInt(match[1].replace(/[.,\s]/g, '')) : 0;
      }

      // ASIN
      const asinEl = document.querySelector('[data-asin]') || document.querySelector('#ASIN');
      product.sku = asinEl?.value || asinEl?.dataset?.asin || this._extractASIN();

      // Description
      const descEl = document.querySelector('#productDescription') || document.querySelector('#feature-bullets');
      product.description = descEl?.textContent?.trim()?.substring(0, 2000) || '';

      // Bullet points
      const bullets = document.querySelectorAll('#feature-bullets li .a-list-item');
      if (bullets.length > 0) {
        product.bullet_points = Array.from(bullets).map(b => b.textContent.trim()).filter(Boolean).slice(0, 10);
      }

      product.platform = this.platform;
      product.url = window.location.href;
      product.extracted_at = new Date().toISOString();

      return product;
    }

    _extractPrice() {
      const selectors = [
        '.a-price .a-offscreen',
        '#priceblock_ourprice',
        '#priceblock_dealprice',
        '#corePrice_feature_div .a-offscreen',
        '.apexPriceToPay .a-offscreen',
        '#price_inside_buybox',
        '#newBuyBoxPrice'
      ];

      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) {
          const text = el.textContent.trim();
          const match = text.match(/([\d.,]+)/);
          if (match) return parseFloat(match[1].replace(',', '.'));
        }
      }
      return 0;
    }

    _extractHDImages() {
      const images = new Set();

      // Method 1: Amazon image data from script
      try {
        const scripts = document.querySelectorAll('script[type="text/javascript"]');
        for (const script of scripts) {
          const content = script.textContent;
          if (content.includes('ImageBlockATF') || content.includes('colorImages')) {
            const matches = content.matchAll(/"hiRes"\s*:\s*"([^"]+)"/g);
            for (const m of matches) images.add(m[1]);
            const largeMatches = content.matchAll(/"large"\s*:\s*"([^"]+)"/g);
            for (const m of largeMatches) images.add(m[1]);
          }
        }
      } catch {}

      // Method 2: Thumbnail strip → HD conversion
      const thumbs = document.querySelectorAll('#altImages .a-button-thumbnail img, #imageBlock img');
      thumbs.forEach(img => {
        let src = img.src || img.dataset.oldHires || '';
        if (src && !src.includes('sprite') && !src.includes('grey-pixel')) {
          src = src.replace(/_AC_[A-Z]{2}\d+_/g, '_AC_SL1500_')
                   .replace(/_S[XY]\d+_/g, '_SL1500_')
                   .replace(/_US\d+_/g, '_SL1500_');
          images.add(src);
        }
      });

      // Method 3: Main image
      const mainImg = document.querySelector('#landingImage, #imgBlkFront, #main-image');
      if (mainImg) {
        let src = mainImg.dataset.oldHires || mainImg.dataset.aLargeUri || mainImg.src;
        if (src) images.add(src.replace(/_AC_[A-Z]{2}\d+_/g, '_AC_SL1500_'));
      }

      return [...images].filter(u => u.startsWith('http') && !u.includes('sprite')).slice(0, 30);
    }

    _extractVideos() {
      const videos = [];

      // Amazon video player data
      try {
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
          const text = script.textContent;
          if (text.includes('videoUrl') || text.includes('VIDEO_URL')) {
            const matches = text.matchAll(/"(https:\/\/[^"]*\.mp4[^"]*)"/g);
            for (const m of matches) {
              if (!videos.includes(m[1])) videos.push(m[1]);
            }
          }
        }
      } catch {}

      // Video thumbnails as fallback indicators
      const videoThumbs = document.querySelectorAll('[class*="video"] img, .vse-video-thumbnail img');
      videoThumbs.forEach(el => {
        const poster = el.src || el.dataset.src;
        if (poster && !videos.some(v => v.includes('poster'))) {
          videos.push({ type: 'poster', url: poster });
        }
      });

      return videos.slice(0, 10);
    }

    _extractVariants() {
      const variants = [];

      // Color/Size/Style selectors
      const variantSections = document.querySelectorAll('#variation_color_name, #variation_size_name, #variation_style_name, [id^="variation_"]');
      
      variantSections.forEach(section => {
        const label = section.querySelector('.a-form-label, .a-row label')?.textContent?.trim()?.replace(':', '') || 'Option';
        const options = section.querySelectorAll('li:not(.swatchUnavailable) .a-button-text, select option');
        
        options.forEach(opt => {
          const name = opt.textContent?.trim() || opt.title?.trim();
          if (name && name.length > 0 && name !== 'Sélectionner') {
            const img = opt.closest('li')?.querySelector('img');
            variants.push({
              type: label,
              name: name.substring(0, 100),
              image: img?.src?.replace(/_AC_[A-Z]{2}\d+_/g, '_AC_SL1500_') || null,
              available: !opt.closest('li')?.classList?.contains('swatchUnavailable')
            });
          }
        });
      });

      // Twister JS data
      try {
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
          if (script.textContent.includes('dimensionValuesDisplayData')) {
            const match = script.textContent.match(/dimensionValuesDisplayData\s*:\s*(\{[^}]+\})/);
            if (match) {
              const data = JSON.parse(match[1]);
              Object.entries(data).forEach(([asin, values]) => {
                if (Array.isArray(values)) {
                  variants.push({ sku: asin, values, type: 'twister' });
                }
              });
            }
          }
        }
      } catch {}

      return variants.slice(0, 100);
    }

    _extractReviews() {
      const reviews = [];

      const reviewEls = document.querySelectorAll('[data-hook="review"]');
      reviewEls.forEach(el => {
        const author = el.querySelector('[data-hook="review-author"] span, .a-profile-name')?.textContent?.trim();
        const rating = el.querySelector('[data-hook="review-star-rating"] .a-icon-alt, .review-rating .a-icon-alt')?.textContent;
        const title = el.querySelector('[data-hook="review-title"] span:last-child, .review-title')?.textContent?.trim();
        const body = el.querySelector('[data-hook="review-body"] span, .review-text')?.textContent?.trim();
        const date = el.querySelector('[data-hook="review-date"]')?.textContent?.trim();
        const verified = !!el.querySelector('[data-hook="avp-badge"], .a-color-state');
        const images = Array.from(el.querySelectorAll('[data-hook="review-image-tile"] img, .review-image-tile-section img'))
          .map(img => img.src?.replace(/_AC_[A-Z]{2}\d+_/g, '_AC_SL1500_'))
          .filter(Boolean);

        if (author || body) {
          reviews.push({
            author: author || 'Anonyme',
            rating: rating ? parseFloat(rating.match(/([\d.,]+)/)?.[1]?.replace(',', '.') || '0') : null,
            title: title?.substring(0, 200),
            body: body?.substring(0, 1000),
            date,
            verified,
            images: images.slice(0, 5)
          });
        }
      });

      return reviews.slice(0, 20);
    }

    _extractCategory() {
      const breadcrumbs = document.querySelectorAll('#wayfinding-breadcrumbs_container a, .a-breadcrumb a');
      const cats = Array.from(breadcrumbs).map(a => a.textContent.trim()).filter(Boolean);
      return cats.length > 0 ? cats.join(' > ') : null;
    }

    _extractASIN() {
      const url = window.location.href;
      const match = url.match(/\/dp\/([A-Z0-9]{10})/) || url.match(/\/gp\/product\/([A-Z0-9]{10})/);
      return match ? match[1] : '';
    }
  }

  // Register with ExtractorRegistry
  if (typeof window !== 'undefined') {
    window.AmazonExtractor = AmazonExtractor;
    if (window.ExtractorRegistry) window.ExtractorRegistry.register('amazon', AmazonExtractor);
  }
})();
