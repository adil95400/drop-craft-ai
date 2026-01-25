/**
 * ShopOpti+ Core Extractor v5.0
 * Unified extraction engine with platform-specific optimizations
 * Extracts: Title, Description, Brand, Price, Stock, Shipping, Variants, Images, Videos, Reviews, Specifications
 */

class ShopOptiCoreExtractor {
  constructor() {
    this.platform = this.detectPlatform();
    this.productData = null;
    this.seenImageHashes = new Set();
  }

  detectPlatform() {
    const hostname = window.location.hostname.toLowerCase();
    
    const platforms = {
      'aliexpress': ['aliexpress'],
      'amazon': ['amazon'],
      'ebay': ['ebay'],
      'temu': ['temu'],
      'walmart': ['walmart'],
      'etsy': ['etsy'],
      'cdiscount': ['cdiscount'],
      'fnac': ['fnac'],
      'rakuten': ['rakuten'],
      'shein': ['shein'],
      'alibaba': ['alibaba', '1688'],
      'shopify': ['myshopify'],
      'target': ['target'],
      'bestbuy': ['bestbuy'],
      'newegg': ['newegg'],
      'banggood': ['banggood'],
      'dhgate': ['dhgate'],
      'wish': ['wish'],
      'cjdropshipping': ['cjdropshipping'],
      'homedepot': ['homedepot'],
      'lowes': ['lowes'],
      'costco': ['costco']
    };

    for (const [platform, patterns] of Object.entries(platforms)) {
      if (patterns.some(p => hostname.includes(p))) {
        return platform;
      }
    }
    
    // Shopify detection
    if (document.querySelector('meta[name="shopify-checkout-api-token"]') ||
        document.querySelector('link[href*="cdn.shopify.com"]') ||
        window.Shopify) {
      return 'shopify';
    }
    
    return 'generic';
  }

  /**
   * Main extraction method - returns complete product data
   */
  async extractComplete() {
    console.log('[ShopOpti+ Extractor] Starting extraction for:', this.platform);

    const [
      basicInfo,
      pricing,
      stock,
      shipping,
      images,
      videos,
      variants,
      reviews,
      specifications
    ] = await Promise.all([
      this.extractBasicInfo(),
      this.extractPricing(),
      this.extractStock(),
      this.extractShipping(),
      this.extractImages(),
      this.extractVideos(),
      this.extractVariants(),
      this.extractReviews(50), // Default limit
      this.extractSpecifications()
    ]);

    this.productData = {
      url: window.location.href,
      platform: this.platform,
      extractedAt: new Date().toISOString(),
      ...basicInfo,
      ...pricing,
      ...stock,
      ...shipping,
      images,
      videos,
      variants,
      reviews,
      specifications
    };

    console.log('[ShopOpti+ Extractor] Extraction complete:', {
      title: this.productData.title?.substring(0, 50),
      price: this.productData.price,
      images: images.length,
      variants: variants.length,
      reviews: reviews.length
    });

    return this.productData;
  }

  // ==================== BASIC INFO ====================
  
  async extractBasicInfo() {
    // Try JSON-LD first (most reliable)
    const jsonLD = this.extractFromJsonLD();
    if (jsonLD.title) return jsonLD;

    // Try OpenGraph
    const og = this.extractFromOpenGraph();
    if (og.title) return og;

    // DOM fallback with platform-specific selectors
    return this.extractBasicFromDOM();
  }

  extractFromJsonLD() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent);
        const items = Array.isArray(data) ? data : [data];
        
        for (const item of items) {
          if (item['@type'] === 'Product') {
            return {
              title: this.cleanText(item.name || ''),
              description: this.cleanText(item.description || ''),
              sku: item.sku || item.productID || '',
              gtin: item.gtin || item.gtin13 || item.gtin12 || '',
              mpn: item.mpn || '',
              brand: typeof item.brand === 'string' ? item.brand : item.brand?.name || ''
            };
          }
        }
      } catch (e) {}
    }
    
    return {};
  }

  extractFromOpenGraph() {
    const getMeta = (property) => {
      const el = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
      return el?.content || '';
    };

    return {
      title: getMeta('og:title') || getMeta('twitter:title'),
      description: getMeta('og:description') || getMeta('twitter:description') || getMeta('description')
    };
  }

  extractBasicFromDOM() {
    const platformSelectors = {
      amazon: {
        title: ['#productTitle', '#title'],
        brand: ['#bylineInfo', 'a#bylineInfo'],
        description: ['#feature-bullets ul', '#productDescription']
      },
      aliexpress: {
        title: ['h1[data-pl="product-title"]', '.product-title', 'h1'],
        brand: ['.store-name', '[class*="store-name"]'],
        description: ['.product-description', '[class*="description"]']
      },
      cdiscount: {
        title: ['.fpDesCol h1', '.fpTMain h1', '[itemprop="name"]'],
        brand: ['.fpBrandName', '[itemprop="brand"]'],
        description: ['.fpDesc', '[itemprop="description"]']
      },
      ebay: {
        title: ['h1.x-item-title__mainTitle', '[data-testid="x-item-title"]'],
        brand: ['[data-testid="x-store-info"] a'],
        description: ['#desc_wrapper', '.d-item-description']
      },
      default: {
        title: ['h1[itemprop="name"]', 'h1.product-title', 'h1'],
        brand: ['[itemprop="brand"]', '.brand', '.vendor'],
        description: ['[itemprop="description"]', '.product-description', '#description']
      }
    };

    const selectors = platformSelectors[this.platform] || platformSelectors.default;
    
    let title = '';
    for (const sel of selectors.title) {
      const el = document.querySelector(sel);
      if (el?.textContent?.trim()) {
        title = this.cleanText(el.textContent);
        break;
      }
    }

    let brand = '';
    for (const sel of selectors.brand) {
      const el = document.querySelector(sel);
      if (el?.textContent?.trim()) {
        brand = this.cleanText(el.textContent).replace(/^(par|by|marque|brand|visit)\s*/i, '');
        break;
      }
    }

    let description = '';
    for (const sel of selectors.description) {
      const el = document.querySelector(sel);
      if (el?.textContent?.trim()) {
        description = el.textContent.trim().substring(0, 5000);
        break;
      }
    }

    return { title, brand, description };
  }

  // ==================== PRICING ====================
  
  async extractPricing() {
    // JSON-LD pricing
    const jsonLD = this.extractPriceFromJsonLD();
    if (jsonLD.price) return jsonLD;

    // DOM pricing
    return this.extractPriceFromDOM();
  }

  extractPriceFromJsonLD() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent);
        const items = Array.isArray(data) ? data : [data];
        
        for (const item of items) {
          if (item['@type'] === 'Product' && item.offers) {
            const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
            return {
              price: parseFloat(offers.price) || 0,
              originalPrice: parseFloat(offers.highPrice) || null,
              currency: offers.priceCurrency || 'EUR'
            };
          }
        }
      } catch (e) {}
    }
    
    return {};
  }

  extractPriceFromDOM() {
    const priceSelectors = {
      amazon: ['#priceblock_ourprice', '#priceblock_dealprice', '.a-price .a-offscreen', '#corePrice_feature_div .a-offscreen'],
      aliexpress: ['.product-price-current', '[class*="price-current"]', '.uniform-banner-box-price'],
      cdiscount: ['.fpPrice', '.priceContainer .price', '[itemprop="price"]'],
      ebay: ['[data-testid="x-price-primary"] .ux-textspans', '[itemprop="price"]'],
      default: ['[itemprop="price"]', '.price', '[class*="price"]']
    };

    const selectors = priceSelectors[this.platform] || priceSelectors.default;
    
    let price = 0;
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        price = this.parsePrice(el.textContent || el.getAttribute('content') || '');
        if (price > 0) break;
      }
    }

    // Original price
    const originalPriceSelectors = ['.a-text-strike', '.originalPrice', '.was-price', '.old-price', 'del', 's.price'];
    let originalPrice = null;
    for (const sel of originalPriceSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const op = this.parsePrice(el.textContent || '');
        if (op > price) {
          originalPrice = op;
          break;
        }
      }
    }

    return { price, originalPrice, currency: this.detectCurrency() };
  }

  parsePrice(priceStr) {
    if (!priceStr || typeof priceStr !== 'string') return 0;
    
    let clean = priceStr.replace(/[€$£¥₹₽CHF\s]/gi, '').replace(/EUR|USD|GBP/gi, '').trim();
    
    // European format: 1.234,56
    if (/^\d{1,3}([\s.]\d{3})*,\d{2}$/.test(clean)) {
      clean = clean.replace(/[\s.]/g, '').replace(',', '.');
    } else if (clean.includes(',') && !clean.includes('.')) {
      clean = clean.replace(',', '.');
    } else if (clean.includes(',') && clean.includes('.')) {
      clean = clean.replace(/\./g, '').replace(',', '.');
    }
    
    return parseFloat(clean) || 0;
  }

  detectCurrency() {
    const currencyEl = document.querySelector('[itemprop="priceCurrency"], [data-currency]');
    if (currencyEl) {
      return currencyEl.getAttribute('content') || currencyEl.getAttribute('data-currency') || 'EUR';
    }
    
    const pageText = document.body.innerText.substring(0, 5000);
    if (pageText.includes('$') || pageText.includes('USD')) return 'USD';
    if (pageText.includes('£') || pageText.includes('GBP')) return 'GBP';
    return 'EUR';
  }

  // ==================== STOCK ====================
  
  async extractStock() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent);
        const items = Array.isArray(data) ? data : [data];
        
        for (const item of items) {
          if (item['@type'] === 'Product' && item.offers) {
            const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
            const availability = offers.availability || '';
            
            return {
              stockStatus: this.mapAvailability(availability),
              stockQuantity: null,
              inStock: availability.includes('InStock')
            };
          }
        }
      } catch (e) {}
    }
    
    return this.extractStockFromDOM();
  }

  mapAvailability(availability) {
    const lower = availability.toLowerCase();
    if (lower.includes('instock')) return 'in_stock';
    if (lower.includes('outofstock')) return 'out_of_stock';
    if (lower.includes('preorder')) return 'preorder';
    if (lower.includes('limited')) return 'low_stock';
    return 'unknown';
  }

  extractStockFromDOM() {
    const stockIndicators = {
      in_stock: ['en stock', 'in stock', 'disponible', 'available', 'add to cart'],
      out_of_stock: ['rupture', 'out of stock', 'épuisé', 'unavailable', 'sold out'],
      low_stock: ['limité', 'limited', 'few left', 'plus que', 'only']
    };

    const pageText = document.body.innerText.toLowerCase().substring(0, 10000);
    
    for (const [status, keywords] of Object.entries(stockIndicators)) {
      if (keywords.some(k => pageText.includes(k))) {
        return {
          stockStatus: status,
          stockQuantity: null,
          inStock: status !== 'out_of_stock'
        };
      }
    }

    // Check add to cart button
    const addToCartBtn = document.querySelector('#add-to-cart-button, [data-testid="add-to-cart"], .add-to-cart');
    if (addToCartBtn && !addToCartBtn.disabled) {
      return { stockStatus: 'in_stock', stockQuantity: null, inStock: true };
    }

    return { stockStatus: 'unknown', stockQuantity: null, inStock: null };
  }

  // ==================== SHIPPING ====================
  
  async extractShipping() {
    const shippingSelectors = {
      amazon: ['#delivery-message', '#deliveryBlockMessage', '.a-delivery-message'],
      aliexpress: ['[class*="shipping"]', '[class*="delivery"]'],
      cdiscount: ['.fpDelivery', '.deliveryInfos'],
      default: ['[class*="shipping"]', '[class*="delivery"]', '[class*="livraison"]']
    };

    const selectors = shippingSelectors[this.platform] || shippingSelectors.default;
    
    let shippingInfo = '';
    let freeShipping = false;
    let deliveryTime = '';

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el?.textContent?.trim()) {
        shippingInfo = this.cleanText(el.textContent).substring(0, 500);
        freeShipping = /free|gratuit|livraison offerte|0[,.]00/i.test(shippingInfo);
        
        const deliveryMatch = shippingInfo.match(/(\d+)\s*[-à]\s*(\d+)\s*(jours?|days?|semaines?|weeks?)/i);
        if (deliveryMatch) {
          deliveryTime = deliveryMatch[0];
        }
        break;
      }
    }

    return { shippingInfo, freeShipping, deliveryTime, shippingCost: freeShipping ? 0 : null };
  }

  // ==================== IMAGES ====================
  
  async extractImages() {
    const images = new Set();
    
    // Platform-specific image selectors
    const imageSelectors = {
      amazon: ['#altImages img', '#imageBlock img', '.a-dynamic-image', '#landingImage'],
      aliexpress: ['[class*="slider"] img', '.images-view img', '[class*="gallery"] img'],
      cdiscount: ['.fpImgLnk img', '.fpGalImg img', '[itemprop="image"]'],
      ebay: ['.ux-image-carousel img', '[data-testid="ux-image-carousel"] img'],
      default: ['[itemprop="image"]', '.product-gallery img', '.product-image img', '.gallery img']
    };

    const selectors = imageSelectors[this.platform] || imageSelectors.default;
    
    for (const sel of selectors) {
      document.querySelectorAll(sel).forEach(img => {
        const src = this.normalizeImageUrl(img.dataset?.oldHires || img.dataset?.aHires || img.dataset?.src || img.src);
        if (src && !this.isDuplicateImage(src)) {
          images.add(src);
        }
      });
    }

    // Also check JSON-LD
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (item['@type'] === 'Product' && item.image) {
            const imgs = Array.isArray(item.image) ? item.image : [item.image];
            imgs.forEach(img => {
              const src = typeof img === 'string' ? img : img.url;
              if (src && !this.isDuplicateImage(src)) {
                images.add(this.normalizeImageUrl(src));
              }
            });
          }
        }
      } catch (e) {}
    }

    return Array.from(images).filter(url => url && url.includes('http')).slice(0, 50);
  }

  normalizeImageUrl(src) {
    if (!src) return null;
    
    // Amazon: Get high-res version
    if (src.includes('amazon')) {
      src = src.replace(/\._[A-Z]{2}\d+_\./, '._SL1500_.');
    }
    
    // AliExpress: Get 800x800 version
    if (src.includes('alicdn') || src.includes('aliexpress')) {
      src = src.replace(/_\d+x\d+\w*\./, '_800x800.');
    }
    
    // Shopify: Get 1024 version
    if (src.includes('shopify') || src.includes('cdn.shopify')) {
      src = src.replace(/_(small|medium|large|grande|pico|icon)\./, '_1024x1024.');
    }
    
    // Remove query params for deduplication
    src = src.replace(/\?.*$/, '');
    
    // Ensure HTTPS
    if (src.startsWith('//')) src = 'https:' + src;
    
    return src;
  }

  isDuplicateImage(src) {
    const hash = this.getImageHash(src);
    if (this.seenImageHashes.has(hash)) return true;
    this.seenImageHashes.add(hash);
    return false;
  }

  getImageHash(src) {
    // Extract unique identifier from URL
    const match = src.match(/\/([A-Z0-9]{10,})[\._]/i) || src.match(/\/I\/([^.]+)/);
    return match ? match[1] : src.substring(src.lastIndexOf('/'));
  }

  // ==================== VIDEOS ====================
  
  async extractVideos() {
    const videos = new Set();
    
    // Direct video elements
    document.querySelectorAll('video source, video').forEach(el => {
      const src = el.src || el.querySelector('source')?.src;
      if (src && this.isValidVideoUrl(src)) {
        videos.add(src);
      }
    });

    // Search in scripts for video URLs
    const videoPatterns = [
      /"videoUrl"\s*:\s*"([^"]+)"/g,
      /"video_url"\s*:\s*"([^"]+)"/g,
      /"playUrl"\s*:\s*"([^"]+)"/g,
      /https?:\/\/[^"'\s]+\.mp4[^"'\s]*/g,
      /https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/g
    ];

    document.querySelectorAll('script').forEach(script => {
      const content = script.textContent || '';
      videoPatterns.forEach(pattern => {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          const url = match[1] || match[0];
          if (this.isValidVideoUrl(url)) {
            videos.add(this.cleanUrl(url));
          }
        }
      });
    });

    // Check iframes
    document.querySelectorAll('iframe[src*="video"], iframe[src*="player"], iframe[src*="youtube"]').forEach(iframe => {
      if (iframe.src) videos.add(iframe.src);
    });

    return Array.from(videos).slice(0, 20);
  }

  isValidVideoUrl(url) {
    if (!url) return false;
    const invalidPatterns = [/analytics/i, /tracking/i, /pixel/i, /ads\./i, /\.gif$/i, /\.png$/i];
    if (invalidPatterns.some(p => p.test(url))) return false;
    return /\.(mp4|webm|m3u8|mov)/i.test(url) || /video|player/i.test(url);
  }

  // ==================== VARIANTS ====================
  
  async extractVariants() {
    const variants = [];
    
    // Try JSON-LD first
    const jsonLDVariants = this.extractVariantsFromJsonLD();
    if (jsonLDVariants.length > 0) return jsonLDVariants;

    // Platform-specific extraction
    switch (this.platform) {
      case 'amazon':
        return this.extractAmazonVariants();
      case 'aliexpress':
        return this.extractAliExpressVariants();
      case 'shopify':
        return this.extractShopifyVariants();
      default:
        return this.extractGenericVariants();
    }
  }

  extractVariantsFromJsonLD() {
    const variants = [];
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent);
        const items = Array.isArray(data) ? data : [data];
        
        for (const item of items) {
          if (item['@type'] === 'Product' && item.offers) {
            const offers = Array.isArray(item.offers) ? item.offers : [item.offers];
            offers.forEach((offer, i) => {
              variants.push({
                sku: offer.sku || `variant-${i}`,
                price: parseFloat(offer.price) || 0,
                available: offer.availability?.includes('InStock') ?? true,
                options: {}
              });
            });
          }
        }
      } catch (e) {}
    }
    
    return variants;
  }

  extractAmazonVariants() {
    const variants = [];
    
    // Look for twister data in scripts
    document.querySelectorAll('script').forEach(script => {
      const content = script.textContent || '';
      try {
        const dimensionMatch = content.match(/dimensionToAsinMap\s*[:=]\s*(\{[\s\S]*?\})\s*[,;]/);
        if (dimensionMatch) {
          const map = JSON.parse(dimensionMatch[1]);
          Object.entries(map).forEach(([key, asin]) => {
            variants.push({
              sku: asin,
              title: key,
              options: { variant: key },
              available: true
            });
          });
        }
      } catch (e) {}
    });

    // DOM fallback
    if (variants.length === 0) {
      document.querySelectorAll('#twister .a-row').forEach(row => {
        row.querySelectorAll('li[data-defaultasin]').forEach(li => {
          variants.push({
            sku: li.dataset.defaultasin,
            title: li.title || '',
            available: !li.classList.contains('unavailable'),
            image: li.querySelector('img')?.src
          });
        });
      });
    }

    return variants;
  }

  extractAliExpressVariants() {
    const variants = [];
    
    document.querySelectorAll('script').forEach(script => {
      const content = script.textContent || '';
      try {
        const skuMatch = content.match(/"skuPriceList"\s*:\s*(\[[\s\S]*?\])/);
        if (skuMatch) {
          const skuList = JSON.parse(skuMatch[1]);
          skuList.forEach(sku => {
            variants.push({
              sku: sku.skuIdStr || sku.skuId,
              price: sku.skuVal?.actSkuCalPrice || sku.skuVal?.skuCalPrice,
              stock: sku.skuVal?.availQuantity || 0,
              available: (sku.skuVal?.availQuantity || 0) > 0
            });
          });
        }
      } catch (e) {}
    });

    return variants;
  }

  extractShopifyVariants() {
    const variants = [];
    
    // Try window.ShopifyAnalytics or similar
    if (window.ShopifyAnalytics?.meta?.product?.variants) {
      window.ShopifyAnalytics.meta.product.variants.forEach(v => {
        variants.push({
          sku: v.sku || v.id,
          title: v.name || v.title,
          price: v.price / 100,
          available: v.available,
          options: v.options || {}
        });
      });
    }

    // Try /products/*.json endpoint
    const productPath = window.location.pathname.match(/\/products\/([^/]+)/);
    if (productPath && variants.length === 0) {
      // This would require a fetch, so skip for now
    }

    return variants;
  }

  extractGenericVariants() {
    const variants = [];
    
    // Look for variant selectors
    document.querySelectorAll('select[name*="variant"], select[name*="size"], select[name*="color"]').forEach(select => {
      select.querySelectorAll('option:not([disabled])').forEach(option => {
        if (option.value) {
          variants.push({
            sku: option.value,
            title: option.textContent.trim(),
            available: true
          });
        }
      });
    });

    return variants;
  }

  // ==================== REVIEWS ====================
  
  async extractReviews(limit = 50) {
    const reviews = [];
    
    const reviewSelectors = {
      amazon: {
        container: '#cm_cr-review_list',
        item: '[data-hook="review"]',
        author: '.a-profile-name',
        rating: '.review-rating span',
        content: '[data-hook="review-body"] span',
        date: '[data-hook="review-date"]',
        verified: '.avp-badge'
      },
      aliexpress: {
        container: '.feedback-list',
        item: '.feedback-item',
        author: '.user-name',
        rating: '.star-view',
        content: '.buyer-feedback',
        date: '.feedback-time',
        verified: '.buyer-verified'
      },
      cdiscount: {
        container: '.js-rv-list',
        item: '.rv-list__item',
        author: '.rv-author',
        rating: '.rv-rating',
        content: '.rv-text',
        date: '.rv-date',
        verified: '.verified'
      },
      default: {
        container: '[class*="review"]',
        item: '[class*="review-item"], [class*="review "]',
        author: '[class*="author"], [class*="name"]',
        rating: '[class*="rating"], [class*="star"]',
        content: '[class*="content"], [class*="text"], [class*="body"]',
        date: '[class*="date"]',
        verified: '[class*="verified"]'
      }
    };

    const config = reviewSelectors[this.platform] || reviewSelectors.default;
    
    const container = document.querySelector(config.container);
    if (!container) return reviews;

    container.querySelectorAll(config.item).forEach((item, i) => {
      if (i >= limit) return;
      
      const author = item.querySelector(config.author)?.textContent?.trim() || 'Anonymous';
      const ratingEl = item.querySelector(config.rating);
      const rating = this.parseRating(ratingEl);
      const content = item.querySelector(config.content)?.textContent?.trim() || '';
      const date = item.querySelector(config.date)?.textContent?.trim() || '';
      const verified = !!item.querySelector(config.verified);

      // Extract images
      const images = [];
      item.querySelectorAll('img').forEach(img => {
        if (img.src && img.src.includes('http') && !img.src.includes('avatar')) {
          images.push(img.src);
        }
      });

      if (content || rating) {
        reviews.push({
          author: this.cleanText(author),
          rating,
          content: this.cleanText(content).substring(0, 5000),
          date,
          verified,
          images: images.slice(0, 10)
        });
      }
    });

    return reviews;
  }

  parseRating(el) {
    if (!el) return 5;
    const text = el.textContent || el.getAttribute('aria-label') || '';
    const match = text.match(/(\d[.,]?\d?)/);
    return match ? Math.min(5, Math.max(1, parseFloat(match[1].replace(',', '.')))) : 5;
  }

  // ==================== SPECIFICATIONS ====================
  
  async extractSpecifications() {
    const specs = {};
    
    const specSelectors = {
      amazon: ['#productDetails_techSpec_section_1 tr', '#prodDetails tr', '.a-keyvalue tr'],
      aliexpress: ['.product-specs tr', '[class*="specification"] tr'],
      cdiscount: ['.fpDesc tr', '.fpSpecTbl tr'],
      default: ['[class*="specification"] tr', '[class*="specs"] tr', 'table tr']
    };

    const selectors = specSelectors[this.platform] || specSelectors.default;
    
    for (const sel of selectors) {
      document.querySelectorAll(sel).forEach(row => {
        const cells = row.querySelectorAll('td, th');
        if (cells.length >= 2) {
          const key = this.cleanText(cells[0].textContent);
          const value = this.cleanText(cells[1].textContent);
          if (key && value && key.length < 100 && value.length < 500) {
            specs[key] = value;
          }
        }
      });
      if (Object.keys(specs).length > 0) break;
    }

    return specs;
  }

  // ==================== UTILITIES ====================
  
  cleanText(text) {
    if (!text || typeof text !== 'string') return '';
    return text.replace(/\s+/g, ' ').trim();
  }

  cleanUrl(url) {
    if (!url) return '';
    return url.replace(/\\u002F/g, '/').replace(/\\/g, '');
  }
}

// Export
if (typeof window !== 'undefined') {
  window.ShopOptiCoreExtractor = ShopOptiCoreExtractor;
}
