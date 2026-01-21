/**
 * TikTok Shop Platform Extractor
 * Extracts product data from TikTok Shop pages
 */

class TikTokShopExtractor {
  constructor() {
    this.platform = 'tiktok-shop';
    this.supportedDomains = ['shop.tiktok.com', 'seller.tiktok.com', 'tiktokshop.com'];
  }

  isSupported() {
    return this.supportedDomains.some(domain => window.location.hostname.includes(domain));
  }

  async extractProduct() {
    console.log('[TikTok Shop] Starting extraction...');
    
    const data = {
      platform: this.platform,
      url: window.location.href,
      title: null,
      price: null,
      originalPrice: null,
      currency: 'USD',
      images: [],
      videos: [],
      description: null,
      sku: null,
      variants: [],
      seller: null,
      rating: null,
      reviews: null,
      sales: null
    };

    try {
      // Try multiple extraction strategies
      await this.extractFromNextData(data);
      await this.extractFromDOM(data);
      await this.extractFromScripts(data);
      
      console.log('[TikTok Shop] Extracted:', data);
      return data;
    } catch (error) {
      console.error('[TikTok Shop] Extraction error:', error);
      return data;
    }
  }

  async extractFromNextData(data) {
    // TikTok often uses Next.js __NEXT_DATA__
    const nextDataScript = document.querySelector('#__NEXT_DATA__');
    if (!nextDataScript) return;

    try {
      const nextData = JSON.parse(nextDataScript.textContent);
      const pageProps = nextData?.props?.pageProps;
      
      if (pageProps?.productDetail) {
        const product = pageProps.productDetail;
        data.title = product.title || product.name;
        data.price = this.parsePrice(product.price || product.salePrice);
        data.originalPrice = this.parsePrice(product.originalPrice || product.marketPrice);
        data.description = product.description;
        data.sku = product.skuId || product.productId;
        data.seller = product.sellerName || product.shopName;
        data.rating = product.rating;
        data.reviews = product.reviewCount;
        data.sales = product.soldCount;
        
        if (product.images) {
          data.images = product.images.map(img => this.cleanImageUrl(img.url || img));
        }
        
        if (product.video?.url) {
          data.videos.push(product.video.url);
        }
        
        if (product.skus || product.variants) {
          data.variants = (product.skus || product.variants).map(v => ({
            id: v.skuId || v.id,
            title: v.title || v.name,
            price: this.parsePrice(v.price),
            sku: v.skuCode || v.sku,
            stock: v.stock || v.inventory,
            options: v.options || v.properties
          }));
        }
      }
    } catch (e) {
      console.log('[TikTok Shop] __NEXT_DATA__ parse failed:', e);
    }
  }

  async extractFromDOM(data) {
    // Title
    if (!data.title) {
      const titleEl = document.querySelector(
        '[data-e2e="product-title"], .product-title, h1[class*="title"], .pdp-title'
      );
      data.title = titleEl?.textContent?.trim();
    }

    // Price
    if (!data.price) {
      const priceEl = document.querySelector(
        '[data-e2e="product-price"], .product-price, [class*="price-current"], .pdp-price'
      );
      if (priceEl) {
        data.price = this.parsePrice(priceEl.textContent);
      }
    }

    // Images
    if (data.images.length === 0) {
      const imgEls = document.querySelectorAll(
        '[data-e2e="product-image"] img, .product-gallery img, [class*="carousel"] img, .pdp-image img'
      );
      imgEls.forEach(img => {
        const src = img.src || img.dataset.src;
        if (src && !src.includes('placeholder')) {
          data.images.push(this.cleanImageUrl(src));
        }
      });
    }

    // Videos
    if (data.videos.length === 0) {
      const videoEls = document.querySelectorAll('video source, video[src]');
      videoEls.forEach(video => {
        const src = video.src || video.dataset.src;
        if (src) data.videos.push(src);
      });
    }

    // Description
    if (!data.description) {
      const descEl = document.querySelector(
        '[data-e2e="product-description"], .product-description, [class*="description"]'
      );
      data.description = descEl?.textContent?.trim()?.substring(0, 2000);
    }

    // Seller
    if (!data.seller) {
      const sellerEl = document.querySelector(
        '[data-e2e="seller-name"], .seller-name, [class*="shop-name"]'
      );
      data.seller = sellerEl?.textContent?.trim();
    }

    // Rating & Reviews
    if (!data.rating) {
      const ratingEl = document.querySelector('[data-e2e="product-rating"], [class*="rating"]');
      if (ratingEl) {
        const match = ratingEl.textContent.match(/[\d.]+/);
        if (match) data.rating = parseFloat(match[0]);
      }
    }

    // Variants from DOM
    if (data.variants.length === 0) {
      const variantGroups = document.querySelectorAll('[data-e2e="sku-selector"], [class*="sku-item"]');
      variantGroups.forEach((group, idx) => {
        const options = group.querySelectorAll('[data-e2e="sku-option"], button, [class*="option"]');
        options.forEach(opt => {
          data.variants.push({
            id: `variant-${idx}-${opt.textContent?.trim()}`,
            title: opt.textContent?.trim(),
            selected: opt.classList.contains('selected') || opt.classList.contains('active')
          });
        });
      });
    }
  }

  async extractFromScripts(data) {
    // Look for embedded product data in scripts
    const scripts = document.querySelectorAll('script:not([src])');
    
    for (const script of scripts) {
      const content = script.textContent;
      if (!content) continue;

      // Look for product JSON patterns
      const patterns = [
        /"product"\s*:\s*(\{[^}]+\})/,
        /window\.__PRODUCT__\s*=\s*(\{.+?\});/,
        /"itemInfo"\s*:\s*(\{[^}]+\})/
      ];

      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match) {
          try {
            const productData = JSON.parse(match[1]);
            if (!data.title && productData.title) data.title = productData.title;
            if (!data.price && productData.price) data.price = this.parsePrice(productData.price);
            if (!data.sku && productData.id) data.sku = productData.id;
          } catch (e) {
            // Invalid JSON, skip
          }
        }
      }
    }
  }

  parsePrice(priceStr) {
    if (!priceStr) return null;
    if (typeof priceStr === 'number') return priceStr;
    
    const cleaned = priceStr.toString().replace(/[^0-9.,]/g, '');
    const normalized = cleaned.replace(',', '.');
    return parseFloat(normalized) || null;
  }

  cleanImageUrl(url) {
    if (!url) return null;
    // Remove TikTok image size parameters to get highest quality
    return url.replace(/~\w+_\d+x\d+/, '').replace(/\?.*$/, '');
  }

  async extractReviews(options = {}) {
    const { minRating = 1, withPhotos = false, limit = 50 } = options;
    const reviews = [];

    // Try to find review elements
    const reviewEls = document.querySelectorAll(
      '[data-e2e="review-item"], .review-item, [class*="review-card"]'
    );

    reviewEls.forEach((el, idx) => {
      if (idx >= limit) return;

      const review = {
        id: `tiktok-review-${idx}`,
        platform: this.platform,
        rating: null,
        text: null,
        author: null,
        date: null,
        photos: [],
        videos: [],
        helpful: 0,
        verified: false
      };

      // Rating
      const stars = el.querySelectorAll('[class*="star-filled"], .star.active');
      review.rating = stars.length || null;

      // Text
      const textEl = el.querySelector('[data-e2e="review-text"], .review-text, [class*="content"]');
      review.text = textEl?.textContent?.trim();

      // Author
      const authorEl = el.querySelector('[data-e2e="reviewer-name"], .reviewer-name');
      review.author = authorEl?.textContent?.trim();

      // Date
      const dateEl = el.querySelector('[data-e2e="review-date"], .review-date, time');
      review.date = dateEl?.textContent?.trim() || dateEl?.getAttribute('datetime');

      // Photos
      const photoEls = el.querySelectorAll('[data-e2e="review-image"] img, .review-photo img');
      photoEls.forEach(img => {
        if (img.src) review.photos.push(img.src);
      });

      // Videos
      const videoEls = el.querySelectorAll('video');
      videoEls.forEach(video => {
        if (video.src) review.videos.push(video.src);
      });

      // Apply filters
      if (review.rating >= minRating) {
        if (!withPhotos || review.photos.length > 0 || review.videos.length > 0) {
          reviews.push(review);
        }
      }
    });

    return reviews;
  }
}

// Export for use
window.TikTokShopExtractor = TikTokShopExtractor;
