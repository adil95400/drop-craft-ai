/**
 * Cdiscount Platform Extractor
 * Extracts product data from Cdiscount.com pages
 */

class CdiscountExtractor {
  constructor() {
    this.platform = 'cdiscount';
    this.supportedDomains = ['cdiscount.com', 'www.cdiscount.com'];
  }

  isSupported() {
    return this.supportedDomains.some(domain => window.location.hostname.includes(domain));
  }

  async extractProduct() {
    console.log('[Cdiscount] Starting extraction...');
    
    const data = {
      platform: this.platform,
      url: window.location.href,
      title: null,
      price: null,
      originalPrice: null,
      currency: 'EUR',
      images: [],
      videos: [],
      description: null,
      sku: null,
      variants: [],
      seller: null,
      rating: null,
      reviews: null,
      brand: null,
      category: null,
      delivery: null,
      inStock: true
    };

    try {
      // Try multiple extraction strategies
      await this.extractFromStructuredData(data);
      await this.extractFromDataLayer(data);
      await this.extractFromDOM(data);
      
      console.log('[Cdiscount] Extracted:', data);
      return data;
    } catch (error) {
      console.error('[Cdiscount] Extraction error:', error);
      return data;
    }
  }

  async extractFromStructuredData(data) {
    // JSON-LD structured data
    const ldScripts = document.querySelectorAll('script[type="application/ld+json"]');
    
    for (const script of ldScripts) {
      try {
        const json = JSON.parse(script.textContent);
        
        if (json['@type'] === 'Product' || (Array.isArray(json) && json[0]?.['@type'] === 'Product')) {
          const product = Array.isArray(json) ? json[0] : json;
          
          data.title = product.name;
          data.description = product.description;
          data.brand = product.brand?.name || product.brand;
          data.sku = product.sku || product.productID || product.gtin13;
          
          // Images
          if (product.image) {
            const images = Array.isArray(product.image) ? product.image : [product.image];
            data.images = images.map(img => typeof img === 'string' ? img : img.url);
          }
          
          // Price from offers
          if (product.offers) {
            const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
            data.price = parseFloat(offer.price);
            data.currency = offer.priceCurrency || 'EUR';
            data.inStock = offer.availability?.includes('InStock') ?? true;
          }
          
          // Rating
          if (product.aggregateRating) {
            data.rating = parseFloat(product.aggregateRating.ratingValue);
            data.reviews = parseInt(product.aggregateRating.reviewCount);
          }
        }
      } catch (e) {
        // Invalid JSON, continue
      }
    }
  }

  async extractFromDataLayer(data) {
    // Google Tag Manager dataLayer
    if (window.dataLayer) {
      for (const entry of window.dataLayer) {
        if (entry.ecommerce?.detail?.products) {
          const product = entry.ecommerce.detail.products[0];
          if (!data.title && product.name) data.title = product.name;
          if (!data.price && product.price) data.price = parseFloat(product.price);
          if (!data.brand && product.brand) data.brand = product.brand;
          if (!data.category && product.category) data.category = product.category;
          if (!data.sku && product.id) data.sku = product.id;
        }
      }
    }

    // Cdiscount-specific product data
    if (window.TC_VARS) {
      if (!data.title && window.TC_VARS.product_name) data.title = window.TC_VARS.product_name;
      if (!data.price && window.TC_VARS.product_unitprice_ati) {
        data.price = parseFloat(window.TC_VARS.product_unitprice_ati);
      }
      if (!data.sku && window.TC_VARS.product_id) data.sku = window.TC_VARS.product_id;
    }
  }

  async extractFromDOM(data) {
    // Title
    if (!data.title) {
      const titleEl = document.querySelector(
        'h1[itemprop="name"], .fpDesCol h1, [data-testid="product-title"], .prdtTit'
      );
      data.title = titleEl?.textContent?.trim();
    }

    // Price
    if (!data.price) {
      const priceEl = document.querySelector(
        '[itemprop="price"], .fpPrice .price, [data-testid="price"], .prdtPrice'
      );
      if (priceEl) {
        const priceText = priceEl.getAttribute('content') || priceEl.textContent;
        data.price = this.parsePrice(priceText);
      }
    }

    // Original price (crossed out)
    if (!data.originalPrice) {
      const originalEl = document.querySelector(
        '.fpPriBrut, .oldPrice, [class*="crossed"], .prdtPriceOld'
      );
      if (originalEl) {
        data.originalPrice = this.parsePrice(originalEl.textContent);
      }
    }

    // Images
    if (data.images.length === 0) {
      // Main product images
      const imgSelectors = [
        '#fpImgMain img',
        '.fpMainImg img',
        '[data-testid="product-image"] img',
        '.prdtImg img',
        '.fpMedia img'
      ];
      
      for (const selector of imgSelectors) {
        const imgs = document.querySelectorAll(selector);
        imgs.forEach(img => {
          const src = img.src || img.dataset.src || img.dataset.lazySrc;
          if (src && !src.includes('placeholder') && !src.includes('loading')) {
            data.images.push(this.cleanImageUrl(src));
          }
        });
      }

      // Thumbnail gallery
      const thumbs = document.querySelectorAll('.fpThumb img, .prdtThumb img, [data-testid="thumb"] img');
      thumbs.forEach(thumb => {
        const src = thumb.dataset.zoom || thumb.dataset.large || thumb.src;
        if (src) {
          const highRes = this.cleanImageUrl(src);
          if (!data.images.includes(highRes)) {
            data.images.push(highRes);
          }
        }
      });
    }

    // Videos
    if (data.videos.length === 0) {
      const videoEls = document.querySelectorAll('video source, video[src], iframe[src*="youtube"], iframe[src*="vimeo"]');
      videoEls.forEach(el => {
        const src = el.src || el.getAttribute('src');
        if (src) data.videos.push(src);
      });
    }

    // Description
    if (!data.description) {
      const descEl = document.querySelector(
        '[itemprop="description"], .fpDescTxt, [data-testid="description"], .prdtDesc'
      );
      data.description = descEl?.textContent?.trim()?.substring(0, 2000);
    }

    // Seller
    if (!data.seller) {
      const sellerEl = document.querySelector(
        '.fpSeller a, [data-testid="seller-name"], .mkpSlrName'
      );
      data.seller = sellerEl?.textContent?.trim();
    }

    // Brand
    if (!data.brand) {
      const brandEl = document.querySelector(
        '[itemprop="brand"], .fpBrand, [data-testid="brand"]'
      );
      data.brand = brandEl?.textContent?.trim();
    }

    // Rating
    if (!data.rating) {
      const ratingEl = document.querySelector(
        '[itemprop="ratingValue"], .fpRating, [data-testid="rating"]'
      );
      if (ratingEl) {
        const content = ratingEl.getAttribute('content') || ratingEl.textContent;
        data.rating = parseFloat(content?.replace(',', '.'));
      }
    }

    // Reviews count
    if (!data.reviews) {
      const reviewsEl = document.querySelector(
        '[itemprop="reviewCount"], .fpReviewCount, [data-testid="review-count"]'
      );
      if (reviewsEl) {
        const match = reviewsEl.textContent?.match(/(\d+)/);
        if (match) data.reviews = parseInt(match[1]);
      }
    }

    // Variants
    if (data.variants.length === 0) {
      await this.extractVariants(data);
    }

    // Delivery info
    const deliveryEl = document.querySelector(
      '.fpDelivery, [data-testid="delivery"], .prdtDlvInfo'
    );
    if (deliveryEl) {
      data.delivery = deliveryEl.textContent?.trim();
    }

    // Stock status
    const stockEl = document.querySelector(
      '.fpStock, [data-testid="stock"], .prdtStock'
    );
    if (stockEl) {
      const stockText = stockEl.textContent?.toLowerCase();
      data.inStock = !stockText?.includes('rupture') && !stockText?.includes('indisponible');
    }
  }

  async extractVariants(data) {
    // Size variants
    const sizeEls = document.querySelectorAll(
      '.fpSize button, [data-testid="size-option"], .prdtSize button'
    );
    if (sizeEls.length > 0) {
      sizeEls.forEach(el => {
        const isAvailable = !el.classList.contains('disabled') && !el.disabled;
        data.variants.push({
          type: 'size',
          value: el.textContent?.trim(),
          available: isAvailable,
          selected: el.classList.contains('selected') || el.classList.contains('active')
        });
      });
    }

    // Color variants
    const colorEls = document.querySelectorAll(
      '.fpColor button, [data-testid="color-option"], .prdtColor button'
    );
    if (colorEls.length > 0) {
      colorEls.forEach(el => {
        const colorName = el.getAttribute('title') || el.getAttribute('aria-label') || el.textContent?.trim();
        const colorImage = el.querySelector('img')?.src;
        data.variants.push({
          type: 'color',
          value: colorName,
          image: colorImage,
          available: !el.classList.contains('disabled'),
          selected: el.classList.contains('selected') || el.classList.contains('active')
        });
      });
    }

    // Generic option selectors
    const selectEls = document.querySelectorAll('.fpOption select, [data-testid="option-select"]');
    selectEls.forEach(select => {
      const optionType = select.getAttribute('name') || select.id || 'option';
      Array.from(select.options).forEach(opt => {
        if (opt.value) {
          data.variants.push({
            type: optionType,
            value: opt.textContent?.trim(),
            available: !opt.disabled,
            selected: opt.selected
          });
        }
      });
    });
  }

  parsePrice(priceStr) {
    if (!priceStr) return null;
    if (typeof priceStr === 'number') return priceStr;
    
    // Handle French price format (1 234,56 €)
    let cleaned = priceStr.toString()
      .replace(/\s/g, '')
      .replace('€', '')
      .replace('EUR', '')
      .trim();
    
    // Convert French decimal format
    if (cleaned.includes(',')) {
      cleaned = cleaned.replace('.', '').replace(',', '.');
    }
    
    return parseFloat(cleaned) || null;
  }

  cleanImageUrl(url) {
    if (!url) return null;
    
    // Get highest resolution Cdiscount image
    // Pattern: replace size indicators like _S, _M, _L with _XL or remove them
    return url
      .replace(/_[SML]\./i, '_XL.')
      .replace(/\?.*$/, '');
  }

  async extractReviews(options = {}) {
    const { minRating = 1, withPhotos = false, limit = 50 } = options;
    const reviews = [];

    const reviewEls = document.querySelectorAll(
      '.fpReview, [data-testid="review"], .prdtReview, [itemprop="review"]'
    );

    reviewEls.forEach((el, idx) => {
      if (idx >= limit) return;

      const review = {
        id: `cdiscount-review-${idx}`,
        platform: this.platform,
        rating: null,
        text: null,
        title: null,
        author: null,
        date: null,
        photos: [],
        helpful: 0,
        verified: false
      };

      // Rating
      const ratingEl = el.querySelector('[itemprop="ratingValue"], .rating, [class*="stars"]');
      if (ratingEl) {
        review.rating = parseFloat(ratingEl.getAttribute('content') || ratingEl.textContent);
      } else {
        // Count filled stars
        const stars = el.querySelectorAll('[class*="star-full"], .starFull');
        review.rating = stars.length || null;
      }

      // Title
      const titleEl = el.querySelector('[itemprop="name"], .reviewTitle, h4');
      review.title = titleEl?.textContent?.trim();

      // Text
      const textEl = el.querySelector('[itemprop="reviewBody"], .reviewText, .reviewContent');
      review.text = textEl?.textContent?.trim();

      // Author
      const authorEl = el.querySelector('[itemprop="author"], .reviewAuthor');
      review.author = authorEl?.textContent?.trim();

      // Date
      const dateEl = el.querySelector('[itemprop="datePublished"], .reviewDate, time');
      review.date = dateEl?.getAttribute('content') || dateEl?.getAttribute('datetime') || dateEl?.textContent?.trim();

      // Photos
      const photoEls = el.querySelectorAll('.reviewPhoto img, [data-testid="review-image"] img');
      photoEls.forEach(img => {
        if (img.src) review.photos.push(img.src);
      });

      // Verified purchase
      const verifiedEl = el.querySelector('.verifiedPurchase, [data-testid="verified"]');
      review.verified = !!verifiedEl;

      // Helpful votes
      const helpfulEl = el.querySelector('.helpfulCount, [data-testid="helpful"]');
      if (helpfulEl) {
        const match = helpfulEl.textContent?.match(/(\d+)/);
        review.helpful = match ? parseInt(match[1]) : 0;
      }

      // Apply filters
      if (review.rating >= minRating) {
        if (!withPhotos || review.photos.length > 0) {
          reviews.push(review);
        }
      }
    });

    return reviews;
  }
}

// Export for use
window.CdiscountExtractor = CdiscountExtractor;
