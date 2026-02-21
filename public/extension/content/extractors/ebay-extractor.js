/**
 * ShopOpti+ Pro v7 - eBay Extractor Module
 * Extracts products, images, variants, reviews from eBay
 */
;(function() {
  'use strict';

  class EbayExtractor {
    constructor() {
      this.platform = 'ebay';
    }

    async extract() {
      const product = {};

      product.title = document.querySelector('#itemTitle .ux-textspans, .x-item-title__mainTitle span, h1[itemprop="name"]')?.textContent?.trim() || '';
      product.price = this._extractPrice();
      product.images = this._extractImages();
      product.videos = this._extractVideos();
      product.variants = this._extractVariants();
      product.reviews = this._extractReviews();

      // Seller info
      product.brand = document.querySelector('.x-sellercard-atf__info__about-seller a, [data-testid="ux-seller-section"] a')?.textContent?.trim() || '';

      // Item specifics
      const specifics = {};
      document.querySelectorAll('.ux-labels-values__labels-content span, .itemAttr tr td').forEach((el, i, arr) => {
        if (i % 2 === 0 && arr[i + 1]) {
          const key = el.textContent.trim().replace(':', '');
          const val = arr[i + 1]?.textContent?.trim();
          if (key && val) specifics[key] = val;
        }
      });
      product.specifics = specifics;
      product.brand = specifics['Brand'] || specifics['Marque'] || product.brand;

      // SKU / Item number
      const itemNum = document.querySelector('[data-testid="ux-layout-section__item-id"] span:last-child, #descItemNumber')?.textContent?.trim();
      product.sku = itemNum || '';

      // Rating
      const ratingEl = document.querySelector('[data-testid="review-stars-rating"]');
      if (ratingEl) {
        const match = ratingEl.textContent.match(/([\d.,]+)/);
        product.rating = match ? parseFloat(match[1].replace(',', '.')) : null;
      }

      // Description
      const descFrame = document.querySelector('#desc_ifr, #vi-desc-maincntr');
      product.description = descFrame?.textContent?.trim()?.substring(0, 2000) || 
        document.querySelector('[data-testid="ux-layout-section--description"]')?.textContent?.trim()?.substring(0, 2000) || '';

      product.category = this._extractCategory();
      product.platform = this.platform;
      product.url = window.location.href;
      product.extracted_at = new Date().toISOString();

      return product;
    }

    _extractPrice() {
      const selectors = [
        '.x-price-primary span[itemprop="price"]', '.x-price-primary .ux-textspans',
        '#prcIsum', '#prcIsum_bidPrice', '[data-testid="x-price-primary"] span'
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) {
          const content = el.content || el.textContent;
          const match = content?.match(/([\d.,]+)/);
          if (match) return parseFloat(match[1].replace(',', '.'));
        }
      }
      return 0;
    }

    _extractImages() {
      const images = new Set();

      // Main gallery
      const gallery = document.querySelectorAll('#vi_main_img_fs img, .ux-image-carousel img, [data-testid="ux-image-carousel"] img');
      gallery.forEach(img => {
        let src = img.src || img.dataset.src || img.dataset.zoom;
        if (src) {
          src = src.replace(/s-l\d+/g, 's-l1600').replace(/\$_\d+/g, '$_57');
          images.add(src);
        }
      });

      // Thumbnail strip
      const thumbs = document.querySelectorAll('#vi_main_img_fs .ux-image-carousel-item img, .pic-vert img');
      thumbs.forEach(img => {
        let src = img.src || '';
        src = src.replace(/s-l\d+/g, 's-l1600');
        if (src.startsWith('http')) images.add(src);
      });

      return [...images].filter(u => !u.includes('sprite') && u.startsWith('http')).slice(0, 30);
    }

    _extractVideos() {
      const videos = [];
      const videoEls = document.querySelectorAll('video source, [data-testid="video-player"] video');
      videoEls.forEach(el => {
        const src = el.src || el.querySelector('source')?.src;
        if (src) videos.push({ type: 'product', url: src });
      });
      return videos.slice(0, 5);
    }

    _extractVariants() {
      const variants = [];
      
      const variantSections = document.querySelectorAll('[data-testid="x-msku__select-box"], .msku-sel, #msku-sel-1');
      variantSections.forEach(section => {
        const label = section.closest('.vim')?.querySelector('label')?.textContent?.trim() || 
                      section.previousElementSibling?.textContent?.trim() || 'Option';
        
        if (section.tagName === 'SELECT') {
          Array.from(section.options).forEach(opt => {
            if (opt.value && opt.value !== '-1') {
              variants.push({ type: label.replace(':', ''), name: opt.textContent.trim(), available: !opt.disabled });
            }
          });
        } else {
          const buttons = section.querySelectorAll('button, [role="radio"]');
          buttons.forEach(btn => {
            const name = btn.textContent?.trim() || btn.title;
            if (name) {
              variants.push({
                type: label.replace(':', ''),
                name: name.substring(0, 100),
                selected: btn.getAttribute('aria-checked') === 'true' || btn.classList.contains('selected')
              });
            }
          });
        }
      });

      return variants.slice(0, 100);
    }

    _extractReviews() {
      const reviews = [];
      const reviewEls = document.querySelectorAll('.reviews-content .review-item, [data-testid="review-card"]');
      
      reviewEls.forEach(el => {
        const author = el.querySelector('.review-item-author, [data-testid="review-author"]')?.textContent?.trim();
        const body = el.querySelector('.review-item-content, [data-testid="review-content"]')?.textContent?.trim();
        const rating = el.querySelector('[data-testid="review-rating"]')?.textContent;

        if (body) {
          reviews.push({
            author: author || 'eBay Buyer',
            body: body.substring(0, 1000),
            rating: rating ? parseFloat(rating.match(/([\d.,]+)/)?.[1] || '0') : null
          });
        }
      });

      return reviews.slice(0, 20);
    }

    _extractCategory() {
      const breadcrumbs = document.querySelectorAll('.seo-breadcrumb-text span a, nav.breadcrumbs a');
      return Array.from(breadcrumbs).map(a => a.textContent.trim()).filter(Boolean).join(' > ') || null;
    }
  }

  if (typeof window !== 'undefined') {
    window.EbayExtractor = EbayExtractor;
    if (window.ExtractorRegistry) window.ExtractorRegistry.register('ebay', EbayExtractor);
  }
})();
