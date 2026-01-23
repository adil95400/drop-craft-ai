/**
 * ShopOpti+ Advanced Multi-Platform Extractor v5.0
 * Ultra-complete extraction: images, videos, prices, stock, description, 
 * tracking, brands, specifications, shipping, variants, ratings
 * Supports 20+ platforms with high-fidelity data capture
 */

(function() {
  'use strict';

  if (window.__shopOptiAdvancedExtractor) return;
  window.__shopOptiAdvancedExtractor = true;

  console.log('[ShopOpti+] Advanced Extractor v5.0 loading...');

  // ============================================
  // UNIFIED PRODUCT SCHEMA
  // ============================================
  const createEmptyProduct = () => ({
    // Core identifiers
    external_id: '',
    sku: '',
    gtin: '',
    upc: '',
    ean: '',
    mpn: '',
    asin: '',
    
    // Basic info
    title: '',
    description: '',
    short_description: '',
    brand: '',
    manufacturer: '',
    vendor: '',
    category: '',
    subcategory: '',
    product_type: '',
    tags: [],
    
    // Pricing
    price: 0,
    compare_at_price: null,
    cost_price: null,
    currency: 'EUR',
    price_range: null,
    bulk_pricing: [],
    
    // Stock & Availability
    stock_quantity: null,
    stock_status: 'unknown', // in_stock, out_of_stock, low_stock, preorder, backorder
    availability: true,
    min_order_quantity: 1,
    max_order_quantity: null,
    
    // Media
    images: [],
    videos: [],
    thumbnail: '',
    gallery_360: [],
    
    // Variants
    variants: [],
    options: [],
    has_variants: false,
    
    // Ratings & Reviews
    rating: null,
    rating_count: 0,
    reviews_count: 0,
    rating_distribution: null,
    
    // Shipping & Delivery
    shipping: {
      free_shipping: false,
      shipping_cost: null,
      estimated_delivery: '',
      shipping_from: '',
      ships_to: [],
      weight: null,
      weight_unit: 'kg',
      dimensions: null,
      handling_time: ''
    },
    
    // Seller/Supplier info
    seller: {
      name: '',
      id: '',
      url: '',
      rating: null,
      feedback_score: null,
      positive_feedback: null,
      store_name: '',
      location: ''
    },
    
    // Specifications
    specifications: [],
    attributes: {},
    materials: [],
    
    // SEO & Meta
    seo_title: '',
    seo_description: '',
    canonical_url: '',
    breadcrumbs: [],
    
    // Tracking & Analytics
    orders_count: 0,
    views_count: 0,
    favorites_count: 0,
    sold_count: 0,
    
    // Platform info
    platform: 'unknown',
    source_url: '',
    extracted_at: new Date().toISOString(),
    
    // Extra metadata
    condition: 'new',
    warranty: '',
    return_policy: '',
    certifications: [],
    origin_country: '',
    custom_fields: {}
  });

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  const Utils = {
    parsePrice(text, defaultCurrency = 'EUR') {
      if (!text) return { price: 0, currency: defaultCurrency };
      
      const currencyMap = {
        '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY', 
        '₹': 'INR', '₽': 'RUB', 'CHF': 'CHF', 'CAD': 'CAD',
        'AUD': 'AUD', 'CNY': 'CNY', 'BRL': 'BRL', 'MXN': 'MXN'
      };
      
      let currency = defaultCurrency;
      for (const [symbol, curr] of Object.entries(currencyMap)) {
        if (text.includes(symbol)) {
          currency = curr;
          break;
        }
      }
      
      const priceMatch = text.replace(/[^\d.,]/g, '').match(/[\d]+[.,]?\d*/);
      const price = priceMatch ? parseFloat(priceMatch[0].replace(',', '.')) : 0;
      
      return { price, currency };
    },
    
    normalizeImageUrl(url, platform = '') {
      if (!url || typeof url !== 'string') return null;
      
      let normalized = url.trim();
      
      // Fix protocol
      if (normalized.startsWith('//')) {
        normalized = 'https:' + normalized;
      }
      
      // Platform-specific high-res conversions
      if (platform === 'amazon' || normalized.includes('amazon')) {
        normalized = normalized
          .replace(/\._[A-Z]{2}\d+_\./g, '._SL1500_.')
          .replace(/_AC_US\d+_/g, '_AC_SL1500_')
          .replace(/_AC_S[XY]\d+_/g, '_AC_SL1500_')
          .replace(/_SS\d+_/g, '_SL1500_')
          .replace(/_S[XY]\d+_/g, '_SL1500_');
      }
      
      if (platform === 'aliexpress' || normalized.includes('alicdn')) {
        normalized = normalized
          .replace(/_\d+x\d+\./g, '.')
          .replace(/\.jpg_\d+x\d+\.jpg/g, '.jpg')
          .replace(/\?.*$/, '');
      }
      
      if (platform === 'ebay' || normalized.includes('ebayimg')) {
        normalized = normalized
          .replace(/\/s-l\d+/g, '/s-l1600')
          .replace(/\/s-l\d+\./g, '/s-l1600.');
      }
      
      if (platform === 'etsy' || normalized.includes('etsystatic')) {
        normalized = normalized.replace(/il_\d+x\d+/g, 'il_fullxfull');
      }
      
      if (platform === 'shein' || normalized.includes('shein')) {
        normalized = normalized.replace(/_thumbnail_\d+x\d+/g, '');
      }
      
      if (platform === 'shopify' || normalized.includes('shopify')) {
        normalized = normalized.replace(/_\d+x\d*\./g, '.');
      }
      
      // Remove tracking params
      try {
        const urlObj = new URL(normalized);
        ['ref', 'ref_', 'utm_source', 'utm_medium', 'utm_campaign', 'spm'].forEach(param => {
          urlObj.searchParams.delete(param);
        });
        normalized = urlObj.toString();
      } catch (e) {}
      
      return normalized;
    },
    
    extractJsonLd() {
      const products = [];
      document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
        try {
          const data = JSON.parse(script.textContent);
          const items = Array.isArray(data) ? data : [data];
          
          items.forEach(item => {
            if (item['@type'] === 'Product') {
              products.push(item);
            }
            if (item['@graph']) {
              item['@graph'].forEach(g => {
                if (g['@type'] === 'Product') products.push(g);
              });
            }
          });
        } catch (e) {}
      });
      return products;
    },
    
    extractOpenGraph() {
      const og = {};
      document.querySelectorAll('meta[property^="og:"], meta[property^="product:"]').forEach(meta => {
        const prop = meta.getAttribute('property').replace('og:', '').replace('product:', '');
        og[prop] = meta.content;
      });
      return og;
    },
    
    cleanText(text) {
      if (!text) return '';
      return text.replace(/\s+/g, ' ').trim();
    },
    
    parseRating(text) {
      if (!text) return null;
      const match = text.match(/(\d+[.,]?\d*)/);
      return match ? parseFloat(match[1].replace(',', '.')) : null;
    },
    
    parseNumber(text) {
      if (!text) return 0;
      const match = text.replace(/[^\d]/g, '').match(/\d+/);
      return match ? parseInt(match[0]) : 0;
    }
  };

  // ============================================
  // AMAZON ADVANCED EXTRACTOR
  // ============================================
  const AmazonExtractor = {
    extract() {
      const product = createEmptyProduct();
      product.platform = 'amazon';
      
      // ASIN
      const asinMatch = window.location.href.match(/\/dp\/([A-Z0-9]{10})/i) ||
                       window.location.href.match(/\/gp\/product\/([A-Z0-9]{10})/i);
      product.asin = asinMatch?.[1] || document.querySelector('[data-asin]')?.dataset?.asin || '';
      product.sku = product.asin;
      product.external_id = product.asin;
      
      // Title
      product.title = Utils.cleanText(
        document.querySelector('#productTitle, #title, .product-title-word-break')?.textContent
      );
      
      // Brand
      const brandEl = document.querySelector('#bylineInfo, .po-brand .a-span9, a#brand');
      if (brandEl) {
        product.brand = Utils.cleanText(brandEl.textContent)
          .replace(/^(Marque|Brand|Visit the|Visiter la boutique|Par)\s*:?\s*/i, '')
          .replace(/ Store$/i, '');
      }
      
      // Prices - comprehensive
      const priceSelectors = [
        '.a-price .a-offscreen',
        '#priceblock_ourprice',
        '#priceblock_dealprice',
        '#priceblock_saleprice',
        '.apexPriceToPay .a-offscreen',
        '#corePrice_feature_div .a-offscreen',
        '.priceToPay .a-offscreen',
        '.reinventPricePriceToPayMargin .a-offscreen',
        '#apex_desktop .a-price .a-offscreen',
        '[data-a-color="price"] .a-offscreen'
      ];
      
      for (const selector of priceSelectors) {
        const el = document.querySelector(selector);
        if (el?.textContent) {
          const { price, currency } = Utils.parsePrice(el.textContent);
          if (price > 0) {
            product.price = price;
            product.currency = currency;
            break;
          }
        }
      }
      
      // Compare at price (was price)
      const wasPrice = document.querySelector('.basisPrice .a-offscreen, .a-text-price .a-offscreen');
      if (wasPrice) {
        const { price } = Utils.parsePrice(wasPrice.textContent);
        if (price > product.price) {
          product.compare_at_price = price;
        }
      }
      
      // Stock status
      const availability = document.querySelector('#availability, #outOfStock');
      if (availability) {
        const text = availability.textContent.toLowerCase();
        if (text.includes('en stock') || text.includes('in stock')) {
          product.stock_status = 'in_stock';
          product.availability = true;
          
          const qtyMatch = text.match(/(\d+)\s*(en stock|left|disponible)/i);
          if (qtyMatch) {
            product.stock_quantity = parseInt(qtyMatch[1]);
            product.stock_status = product.stock_quantity < 10 ? 'low_stock' : 'in_stock';
          }
        } else if (text.includes('rupture') || text.includes('unavailable') || text.includes('out of stock')) {
          product.stock_status = 'out_of_stock';
          product.availability = false;
        } else if (text.includes('précommande') || text.includes('pre-order')) {
          product.stock_status = 'preorder';
        }
      }
      
      // Description (bullet points + full description)
      const descParts = [];
      document.querySelectorAll('#feature-bullets li span.a-list-item').forEach(li => {
        const text = Utils.cleanText(li.textContent);
        if (text && !text.includes('›') && text.length > 5) {
          descParts.push('• ' + text);
        }
      });
      
      const fullDesc = document.querySelector('#productDescription p, #productDescription_feature_div');
      if (fullDesc) {
        descParts.push('\n' + Utils.cleanText(fullDesc.textContent));
      }
      
      product.description = descParts.join('\n').slice(0, 8000);
      product.short_description = descParts.slice(0, 3).join(' ').slice(0, 500);
      
      // Images - High resolution
      const imageSet = new Set();
      document.querySelectorAll(
        '#altImages img, #imageBlock img, .imgTagWrapper img, ' +
        '.a-dynamic-image, #landingImage, [data-old-hires], [data-a-hires], ' +
        'li.image img, .ig-thumb-image'
      ).forEach(img => {
        const src = img.dataset?.oldHires || img.dataset?.aHires || 
                    img.dataset?.aHires || img.src;
        const normalized = Utils.normalizeImageUrl(src, 'amazon');
        if (normalized && normalized.includes('images') && 
            !normalized.includes('sprite') && !normalized.includes('grey-pixel')) {
          imageSet.add(normalized);
        }
      });
      
      // Zoom images
      document.querySelectorAll('[data-zoom-image], [data-old-hires]').forEach(el => {
        const src = el.getAttribute('data-zoom-image') || el.getAttribute('data-old-hires');
        const normalized = Utils.normalizeImageUrl(src, 'amazon');
        if (normalized) imageSet.add(normalized);
      });
      
      product.images = [...imageSet].slice(0, 25);
      product.thumbnail = product.images[0] || '';
      
      // Videos
      document.querySelectorAll('[data-video-url], video source').forEach(el => {
        const url = el.dataset?.videoUrl || el.src;
        if (url && (url.includes('.mp4') || url.includes('video'))) {
          product.videos.push({
            url,
            type: 'product_video',
            thumbnail: el.dataset?.posterUrl || null
          });
        }
      });
      
      // Rating & Reviews
      const ratingEl = document.querySelector('#acrPopover .a-icon-alt, .a-icon-star .a-icon-alt');
      product.rating = Utils.parseRating(ratingEl?.textContent);
      
      const reviewsEl = document.querySelector('#acrCustomerReviewText');
      product.reviews_count = Utils.parseNumber(reviewsEl?.textContent);
      product.rating_count = product.reviews_count;
      
      // Rating distribution
      const histogramRows = document.querySelectorAll('#histogramTable tr, .cr-widget-FocalReviews tr');
      if (histogramRows.length > 0) {
        product.rating_distribution = {};
        histogramRows.forEach(row => {
          const starMatch = row.textContent.match(/(\d)\s*(star|étoile)/i);
          const percentMatch = row.textContent.match(/(\d+)%/);
          if (starMatch && percentMatch) {
            product.rating_distribution[starMatch[1]] = parseInt(percentMatch[1]);
          }
        });
      }
      
      // Variants - Size
      document.querySelectorAll('#variation_size_name li:not(.swatchUnavailable), #twister-plus-inline-twister-card li').forEach(v => {
        const text = v.querySelector('.a-button-text, .a-size-base')?.textContent?.trim();
        if (text && text.length < 50) {
          product.variants.push({
            type: 'size',
            name: text,
            value: text,
            available: !v.classList.contains('swatchUnavailable'),
            asin: v.dataset?.asin || null
          });
        }
      });
      
      // Variants - Color
      document.querySelectorAll('#variation_color_name li, #variation-color li').forEach(v => {
        const imgEl = v.querySelector('img');
        const text = imgEl?.alt || v.querySelector('.a-button-text')?.textContent?.trim();
        if (text && text.length < 50) {
          product.variants.push({
            type: 'color',
            name: text,
            value: text,
            image: Utils.normalizeImageUrl(imgEl?.src, 'amazon'),
            available: !v.classList.contains('swatchUnavailable'),
            asin: v.dataset?.asin || null
          });
        }
      });
      
      // Variants - Style
      document.querySelectorAll('#variation_style_name li').forEach(v => {
        const text = v.querySelector('img')?.alt || v.querySelector('.a-button-text')?.textContent?.trim();
        if (text && text.length < 50) {
          product.variants.push({
            type: 'style',
            name: text,
            value: text,
            available: !v.classList.contains('swatchUnavailable')
          });
        }
      });
      
      product.has_variants = product.variants.length > 0;
      
      // Specifications (Technical Details)
      const specTables = document.querySelectorAll(
        '#productDetails_techSpec_section_1 tr, ' +
        '#productDetails_detailBullets_sections1 tr, ' +
        '.prodDetTable tr, ' +
        '#detailBullets_feature_div li'
      );
      
      specTables.forEach(row => {
        let key, value;
        if (row.tagName === 'TR') {
          key = row.querySelector('th, td:first-child')?.textContent?.trim();
          value = row.querySelector('td:last-child, td:nth-child(2)')?.textContent?.trim();
        } else {
          const text = row.textContent.split(':');
          key = text[0]?.trim();
          value = text.slice(1).join(':').trim();
        }
        
        if (key && value && key.length < 100) {
          product.specifications.push({ name: key, value });
          
          // Extract specific attributes
          const keyLower = key.toLowerCase();
          if (keyLower.includes('weight') || keyLower.includes('poids')) {
            const match = value.match(/(\d+[.,]?\d*)\s*(kg|g|lb|oz)/i);
            if (match) {
              product.shipping.weight = parseFloat(match[1].replace(',', '.'));
              product.shipping.weight_unit = match[2].toLowerCase();
            }
          }
          if (keyLower.includes('dimension')) {
            product.shipping.dimensions = value;
          }
          if (keyLower.includes('manufacturer') || keyLower.includes('fabricant')) {
            product.manufacturer = value;
          }
          if (keyLower.includes('model') || keyLower.includes('modèle')) {
            product.mpn = value;
          }
        }
      });
      
      // Category & Breadcrumbs
      document.querySelectorAll('#wayfinding-breadcrumbs_feature_div li a').forEach(a => {
        product.breadcrumbs.push({
          name: a.textContent.trim(),
          url: a.href
        });
      });
      if (product.breadcrumbs.length > 0) {
        product.category = product.breadcrumbs[product.breadcrumbs.length - 1]?.name || '';
      }
      
      // Shipping info
      const deliveryEl = document.querySelector('#deliveryBlockMessage, #mir-layout-DELIVERY_BLOCK');
      if (deliveryEl) {
        product.shipping.estimated_delivery = Utils.cleanText(deliveryEl.textContent);
        product.shipping.free_shipping = deliveryEl.textContent.toLowerCase().includes('gratuit') ||
                                          deliveryEl.textContent.toLowerCase().includes('free');
      }
      
      // Seller info
      const sellerEl = document.querySelector('#merchant-info, #sellerProfileTriggerId');
      if (sellerEl) {
        product.seller.name = Utils.cleanText(sellerEl.textContent)
          .replace(/^(Vendu par|Sold by|Ships from and sold by)\s*/i, '');
        product.seller.url = sellerEl.href || '';
      }
      
      // Best Seller Rank
      const bsrEl = document.querySelector('#SalesRank, #detailBulletsWrapper_feature_div');
      if (bsrEl?.textContent.includes('Best Seller') || bsrEl?.textContent.includes('Meilleures ventes')) {
        product.custom_fields.best_seller_rank = Utils.cleanText(bsrEl.textContent);
      }
      
      product.source_url = window.location.href;
      
      console.log('[ShopOpti+] Amazon extraction complete:', product.title, 
        '| Images:', product.images.length, 
        '| Videos:', product.videos.length,
        '| Variants:', product.variants.length,
        '| Specs:', product.specifications.length);
      
      return product;
    }
  };

  // ============================================
  // ALIEXPRESS ADVANCED EXTRACTOR
  // ============================================
  const AliExpressExtractor = {
    extract() {
      const product = createEmptyProduct();
      product.platform = 'aliexpress';
      
      // Product ID from URL
      const idMatch = window.location.href.match(/\/(\d+)\.html/) ||
                     window.location.href.match(/item\/(\d+)/);
      product.external_id = idMatch?.[1] || '';
      product.sku = product.external_id;
      
      // Title
      const titleSelectors = [
        'h1[data-pl="product-title"]',
        '.product-title-text',
        '[class*="product-title"]',
        '.title--wrap--UUHae_g h1',
        'h1'
      ];
      for (const sel of titleSelectors) {
        const el = document.querySelector(sel);
        if (el?.textContent?.trim()) {
          product.title = Utils.cleanText(el.textContent);
          break;
        }
      }
      
      // Prices
      const priceSelectors = [
        '[class*="price--current"]',
        '.product-price-value',
        '.uniform-banner-box-price',
        '[class*="Price"] span',
        '.es--wrap--erdmPRe',
        '[data-spm="price"]'
      ];
      
      for (const sel of priceSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          const { price, currency } = Utils.parsePrice(el.textContent);
          if (price > 0) {
            product.price = price;
            product.currency = currency;
            break;
          }
        }
      }
      
      // Original price
      const originalPriceEl = document.querySelector('[class*="price--original"], .product-price-del');
      if (originalPriceEl) {
        const { price } = Utils.parsePrice(originalPriceEl.textContent);
        if (price > product.price) product.compare_at_price = price;
      }
      
      // Brand / Store
      const storeEl = document.querySelector('[class*="store-name"], .shop-name a, [class*="StoreName"]');
      if (storeEl) {
        product.vendor = Utils.cleanText(storeEl.textContent);
        product.seller.name = product.vendor;
        product.seller.url = storeEl.href || '';
      }
      
      // Store rating
      const storeRatingEl = document.querySelector('[class*="store-rating"], [class*="positive-feedback"]');
      if (storeRatingEl) {
        const match = storeRatingEl.textContent.match(/(\d+[.,]?\d*)%/);
        if (match) {
          product.seller.positive_feedback = parseFloat(match[1].replace(',', '.'));
        }
      }
      
      // Images - High resolution
      const imageSet = new Set();
      document.querySelectorAll(
        '.images-view-item img, .slider--img--item img, [class*="gallery"] img, ' +
        '.product-img img, .image-view--previewBox--SyecEnE img, [class*="slider"] img, ' +
        '.sku-property-image img'
      ).forEach(img => {
        const src = img.src || img.dataset?.src || img.getAttribute('data-src');
        const normalized = Utils.normalizeImageUrl(src, 'aliexpress');
        if (normalized && normalized.includes('alicdn')) {
          imageSet.add(normalized);
        }
      });
      
      product.images = [...imageSet].slice(0, 25);
      product.thumbnail = product.images[0] || '';
      
      // Videos
      document.querySelectorAll('video source, [class*="video"] video').forEach(el => {
        const src = el.src || el.querySelector('source')?.src;
        if (src && src.includes('.mp4')) {
          product.videos.push({
            url: src.startsWith('//') ? 'https:' + src : src,
            type: 'product_video'
          });
        }
      });
      
      // Check for video thumbnail as indicator
      const videoThumb = document.querySelector('[class*="video-icon"], [class*="VideoIcon"]');
      if (videoThumb && product.videos.length === 0) {
        product.custom_fields.has_video = true;
      }
      
      // Rating
      const ratingEl = document.querySelector('[class*="rating"] strong, .overview-rating-average');
      product.rating = Utils.parseRating(ratingEl?.textContent);
      
      // Reviews count
      const reviewsEl = document.querySelector('[class*="reviews"] span, [class*="Reviews"]');
      product.reviews_count = Utils.parseNumber(reviewsEl?.textContent);
      
      // Orders count (important for dropshipping)
      const ordersEl = document.querySelector('[class*="trade"], [class*="sold"], [class*="orders"]');
      if (ordersEl) {
        product.orders_count = Utils.parseNumber(ordersEl.textContent);
        product.sold_count = product.orders_count;
      }
      
      // Variants with images
      const skuContainers = document.querySelectorAll(
        '[class*="sku-property"], [class*="sku-item"], .sku-property-item, ' +
        '[class*="skuItem"], .product-sku'
      );
      
      skuContainers.forEach(container => {
        const titleEl = container.querySelector('[class*="sku-title"], .sku-property-text, [class*="title"]');
        const propertyName = titleEl?.textContent?.trim() || 'Option';
        
        const items = container.querySelectorAll(
          '[class*="sku-property-item"], [class*="image-view--wrap"], ' +
          'img[class*="sku"], [class*="property-item"]'
        );
        
        items.forEach(item => {
          const text = item.getAttribute('title') || item.textContent?.trim() || item.getAttribute('alt');
          if (text && text.length < 100) {
            const imgEl = item.tagName === 'IMG' ? item : item.querySelector('img');
            
            product.variants.push({
              type: propertyName.toLowerCase().includes('color') || propertyName.toLowerCase().includes('couleur') 
                    ? 'color' : propertyName.toLowerCase().includes('size') || propertyName.toLowerCase().includes('taille')
                    ? 'size' : 'option',
              name: propertyName,
              value: text,
              image: Utils.normalizeImageUrl(imgEl?.src, 'aliexpress'),
              available: !item.classList.contains('disabled') && !item.classList.contains('unavailable')
            });
          }
        });
      });
      
      product.has_variants = product.variants.length > 0;
      
      // Shipping info
      const shippingEl = document.querySelector('[class*="shipping"], [class*="delivery"], .product-shipping');
      if (shippingEl) {
        const text = shippingEl.textContent;
        product.shipping.estimated_delivery = Utils.cleanText(text);
        product.shipping.free_shipping = text.toLowerCase().includes('free') || 
                                          text.toLowerCase().includes('gratuit');
        
        const fromMatch = text.match(/(from|depuis)\s+([A-Za-z\s]+)/i);
        if (fromMatch) {
          product.shipping.shipping_from = fromMatch[2].trim();
        }
      }
      
      // Description
      const descEl = document.querySelector(
        '[class*="product-description"], [class*="desc-content"], ' +
        '#product-description, .detail-desc-decorate-richtext'
      );
      product.description = Utils.cleanText(descEl?.textContent?.slice(0, 8000)) || '';
      
      // Specifications
      const specRows = document.querySelectorAll(
        '[class*="specification"] li, .product-specs li, ' +
        '.product-property li, [class*="ProductProperty"] li'
      );
      specRows.forEach(row => {
        const keyEl = row.querySelector('[class*="name"], span:first-child');
        const valueEl = row.querySelector('[class*="value"], span:last-child');
        if (keyEl && valueEl) {
          product.specifications.push({
            name: Utils.cleanText(keyEl.textContent),
            value: Utils.cleanText(valueEl.textContent)
          });
        }
      });
      
      // Category breadcrumbs
      document.querySelectorAll('.breadcrumb a, [class*="Breadcrumb"] a').forEach(a => {
        product.breadcrumbs.push({
          name: a.textContent.trim(),
          url: a.href
        });
      });
      
      product.source_url = window.location.href;
      
      console.log('[ShopOpti+] AliExpress extraction complete:', product.title,
        '| Images:', product.images.length,
        '| Videos:', product.videos.length,
        '| Variants:', product.variants.length,
        '| Orders:', product.orders_count);
      
      return product;
    }
  };

  // ============================================
  // SHOPIFY ADVANCED EXTRACTOR
  // ============================================
  const ShopifyExtractor = {
    async extract() {
      const product = createEmptyProduct();
      product.platform = 'shopify';
      
      // Try JSON API first (most reliable)
      const jsonProduct = await this.fetchProductJson();
      if (jsonProduct) {
        return this.normalizeShopifyProduct(jsonProduct, product);
      }
      
      // Fallback: JSON-LD
      const jsonLdProducts = Utils.extractJsonLd();
      if (jsonLdProducts.length > 0) {
        return this.normalizeJsonLd(jsonLdProducts[0], product);
      }
      
      // Final fallback: DOM extraction
      return this.extractFromDom(product);
    },
    
    async fetchProductJson() {
      const handle = window.location.pathname.match(/\/products\/([^\/\?]+)/)?.[1];
      if (!handle) return null;
      
      try {
        const response = await fetch(`/products/${handle}.js`);
        if (response.ok) return await response.json();
      } catch (e) {}
      
      return null;
    },
    
    normalizeShopifyProduct(data, product) {
      product.external_id = data.id?.toString() || '';
      product.title = data.title || '';
      product.description = Utils.cleanText(data.description || data.body_html || '');
      product.vendor = data.vendor || '';
      product.brand = data.vendor || '';
      product.product_type = data.product_type || '';
      product.tags = data.tags || [];
      
      // Price (Shopify prices are in cents)
      product.price = data.price ? data.price / 100 : 0;
      if (data.compare_at_price) {
        product.compare_at_price = data.compare_at_price / 100;
      }
      
      // Currency from window.Shopify
      product.currency = window.Shopify?.currency?.active || 'EUR';
      
      // Images - convert to high-res
      product.images = (data.images || []).map(img => 
        Utils.normalizeImageUrl(typeof img === 'string' ? img : img?.src, 'shopify')
      ).filter(Boolean);
      product.thumbnail = product.images[0] || '';
      
      // Videos from media
      if (data.media) {
        data.media.forEach(m => {
          if (m.media_type === 'video' || m.media_type === 'external_video') {
            product.videos.push({
              url: m.sources?.[0]?.url || m.external_id,
              type: m.media_type,
              alt: m.alt
            });
          }
        });
      }
      
      // Variants
      (data.variants || []).forEach(v => {
        product.variants.push({
          id: v.id?.toString(),
          sku: v.sku || '',
          title: v.title || 'Default',
          price: v.price / 100,
          compare_at_price: v.compare_at_price ? v.compare_at_price / 100 : null,
          available: v.available !== false,
          option1: v.option1,
          option2: v.option2,
          option3: v.option3,
          image: Utils.normalizeImageUrl(v.featured_image?.src, 'shopify'),
          inventory_quantity: v.inventory_quantity || null,
          weight: v.weight,
          weight_unit: v.weight_unit || 'kg'
        });
        
        // Set stock status based on first variant
        if (!product.stock_status || product.stock_status === 'unknown') {
          if (v.available !== false) {
            product.stock_status = 'in_stock';
            product.availability = true;
          } else {
            product.stock_status = 'out_of_stock';
            product.availability = false;
          }
        }
      });
      
      product.has_variants = product.variants.length > 1;
      product.sku = product.variants[0]?.sku || '';
      
      // Options
      product.options = (data.options || []).map(opt => ({
        name: opt.name,
        values: opt.values || []
      }));
      
      // Metadata
      product.custom_fields = {
        handle: data.handle,
        published_at: data.published_at,
        created_at: data.created_at
      };
      
      product.source_url = window.location.href;
      product.seller.store_name = window.location.hostname;
      
      return product;
    },
    
    normalizeJsonLd(data, product) {
      product.title = data.name || '';
      product.description = Utils.cleanText(data.description || '');
      product.brand = data.brand?.name || '';
      product.sku = data.sku || '';
      
      if (data.offers) {
        const offer = Array.isArray(data.offers) ? data.offers[0] : data.offers;
        product.price = parseFloat(offer.price) || 0;
        product.currency = offer.priceCurrency || 'EUR';
        product.availability = offer.availability?.includes('InStock') || false;
        product.stock_status = product.availability ? 'in_stock' : 'out_of_stock';
      }
      
      if (data.image) {
        product.images = (Array.isArray(data.image) ? data.image : [data.image])
          .map(img => Utils.normalizeImageUrl(img, 'shopify'))
          .filter(Boolean);
      }
      
      if (data.aggregateRating) {
        product.rating = parseFloat(data.aggregateRating.ratingValue) || null;
        product.reviews_count = parseInt(data.aggregateRating.reviewCount) || 0;
      }
      
      product.source_url = window.location.href;
      return product;
    },
    
    extractFromDom(product) {
      const titleSel = [
        'h1.product-title', '.product__title h1', '[data-product-title]',
        '.product-single__title', 'h1[itemprop="name"]', 'h1'
      ];
      for (const sel of titleSel) {
        const el = document.querySelector(sel);
        if (el?.textContent?.trim()) {
          product.title = Utils.cleanText(el.textContent);
          break;
        }
      }
      
      const priceSel = [
        '[data-product-price]', '.product__price', '.price--show-badge',
        '[itemprop="price"]', '.product-price'
      ];
      for (const sel of priceSel) {
        const el = document.querySelector(sel);
        if (el) {
          const { price, currency } = Utils.parsePrice(el.textContent || el.getAttribute('content'));
          if (price > 0) {
            product.price = price;
            product.currency = currency;
            break;
          }
        }
      }
      
      const imageSet = new Set();
      document.querySelectorAll(
        '.product__media img, .product-gallery img, [data-product-media] img'
      ).forEach(img => {
        const normalized = Utils.normalizeImageUrl(img.dataset?.src || img.src, 'shopify');
        if (normalized && !normalized.includes('placeholder')) {
          imageSet.add(normalized);
        }
      });
      product.images = [...imageSet].slice(0, 25);
      
      product.source_url = window.location.href;
      return product;
    }
  };

  // ============================================
  // TEMU ADVANCED EXTRACTOR
  // ============================================
  const TemuExtractor = {
    extract() {
      const product = createEmptyProduct();
      product.platform = 'temu';
      
      // Product ID from URL
      const idMatch = window.location.href.match(/-g-(\d+)\.html/);
      product.external_id = idMatch?.[1] || '';
      product.sku = product.external_id;
      
      // Title
      const titleEl = document.querySelector('h1, [class*="ProductTitle"], [class*="title"]');
      product.title = Utils.cleanText(titleEl?.textContent);
      
      // Price
      const priceEl = document.querySelector('[class*="price" i], [class*="Price" i]');
      if (priceEl) {
        const { price, currency } = Utils.parsePrice(priceEl.textContent);
        product.price = price;
        product.currency = currency;
      }
      
      // Original price
      const originalEl = document.querySelector('[class*="original-price"], [class*="del"]');
      if (originalEl) {
        const { price } = Utils.parsePrice(originalEl.textContent);
        if (price > product.price) product.compare_at_price = price;
      }
      
      // Images
      const imageSet = new Set();
      document.querySelectorAll('img[src*="img.kwcdn.com"]').forEach(img => {
        if (img.src && !img.src.includes('avatar') && !img.src.includes('icon')) {
          const normalized = img.src.replace(/_\d+\./g, '.').replace(/\?.*$/, '');
          imageSet.add(normalized);
        }
      });
      product.images = [...imageSet].slice(0, 25);
      product.thumbnail = product.images[0] || '';
      
      // Videos
      document.querySelectorAll('video source').forEach(el => {
        if (el.src && el.src.includes('.mp4')) {
          product.videos.push({ url: el.src, type: 'product_video' });
        }
      });
      
      // Sold count
      const soldEl = document.querySelector('[class*="sold"], [class*="Sold"]');
      if (soldEl) {
        product.sold_count = Utils.parseNumber(soldEl.textContent);
      }
      
      // Rating
      const ratingEl = document.querySelector('[class*="rating"], [class*="star"]');
      product.rating = Utils.parseRating(ratingEl?.textContent);
      
      // Reviews
      const reviewsEl = document.querySelector('[class*="review-count"], [class*="Reviews"]');
      product.reviews_count = Utils.parseNumber(reviewsEl?.textContent);
      
      // Variants
      document.querySelectorAll('[class*="sku-item"], [class*="option-item"]').forEach(item => {
        const text = item.textContent?.trim() || item.getAttribute('title');
        if (text && text.length < 100) {
          const imgEl = item.querySelector('img');
          product.variants.push({
            type: 'option',
            value: text,
            image: imgEl?.src
          });
        }
      });
      
      product.has_variants = product.variants.length > 0;
      
      // Shipping
      const shippingEl = document.querySelector('[class*="shipping"], [class*="delivery"]');
      if (shippingEl) {
        product.shipping.estimated_delivery = Utils.cleanText(shippingEl.textContent);
        product.shipping.free_shipping = shippingEl.textContent.toLowerCase().includes('free');
      }
      
      product.source_url = window.location.href;
      
      console.log('[ShopOpti+] Temu extraction complete:', product.title,
        '| Images:', product.images.length,
        '| Variants:', product.variants.length);
      
      return product;
    }
  };

  // ============================================
  // EBAY ADVANCED EXTRACTOR
  // ============================================
  const EbayExtractor = {
    extract() {
      const product = createEmptyProduct();
      product.platform = 'ebay';
      
      // Item ID from URL
      const idMatch = window.location.href.match(/\/itm\/(\d+)/);
      product.external_id = idMatch?.[1] || '';
      product.sku = product.external_id;
      
      // Title
      product.title = Utils.cleanText(
        document.querySelector('h1.x-item-title__mainTitle, .it-ttl, h1[itemprop="name"]')?.textContent
      );
      
      // Price
      const priceEl = document.querySelector('.x-price-primary, #prcIsum, [itemprop="price"]');
      if (priceEl) {
        const { price, currency } = Utils.parsePrice(priceEl.textContent || priceEl.getAttribute('content'));
        product.price = price;
        product.currency = currency;
      }
      
      // Images
      const imageSet = new Set();
      document.querySelectorAll(
        '.ux-image-carousel img, .img-wrapper img, [data-zoom-image], #icImg'
      ).forEach(img => {
        const src = img.dataset?.zoomImage || img.src;
        const normalized = Utils.normalizeImageUrl(src, 'ebay');
        if (normalized && !normalized.includes('placeholder')) {
          imageSet.add(normalized);
        }
      });
      product.images = [...imageSet].slice(0, 25);
      product.thumbnail = product.images[0] || '';
      
      // Condition
      const conditionEl = document.querySelector('.x-item-condition-text, #vi-itm-cond');
      if (conditionEl) {
        const text = conditionEl.textContent.toLowerCase();
        if (text.includes('new') || text.includes('neuf')) {
          product.condition = 'new';
        } else if (text.includes('used') || text.includes('occasion')) {
          product.condition = 'used';
        } else if (text.includes('refurbished') || text.includes('reconditionné')) {
          product.condition = 'refurbished';
        }
      }
      
      // Seller info
      const sellerEl = document.querySelector('.x-sellercard-atf__info a, .mbg-l a');
      if (sellerEl) {
        product.seller.name = Utils.cleanText(sellerEl.textContent);
        product.seller.url = sellerEl.href;
      }
      
      const feedbackEl = document.querySelector('.x-sellercard-atf__data-item, .mbg-l');
      if (feedbackEl) {
        const percentMatch = feedbackEl.textContent.match(/(\d+[.,]?\d*)%/);
        if (percentMatch) {
          product.seller.positive_feedback = parseFloat(percentMatch[1].replace(',', '.'));
        }
      }
      
      // Availability
      const qtyEl = document.querySelector('#qtySubTxt, .x-quantity__availability');
      if (qtyEl) {
        const text = qtyEl.textContent.toLowerCase();
        if (text.includes('available') || text.includes('disponible')) {
          product.stock_status = 'in_stock';
          product.availability = true;
          const qtyMatch = text.match(/(\d+)/);
          if (qtyMatch) product.stock_quantity = parseInt(qtyMatch[1]);
        } else if (text.includes('sold out') || text.includes('épuisé')) {
          product.stock_status = 'out_of_stock';
          product.availability = false;
        }
      }
      
      // Shipping
      const shippingEl = document.querySelector('#fshippingCost, .ux-labels-values--shipping .ux-textspans');
      if (shippingEl) {
        const text = shippingEl.textContent.toLowerCase();
        product.shipping.free_shipping = text.includes('free') || text.includes('gratuit');
        if (!product.shipping.free_shipping) {
          const { price } = Utils.parsePrice(shippingEl.textContent);
          product.shipping.shipping_cost = price;
        }
      }
      
      // Specifications
      document.querySelectorAll('.ux-layout-section-evo__item, .ux-labels-values--specifics .ux-labels-values__values-content').forEach((row, i) => {
        const label = document.querySelectorAll('.ux-labels-values--specifics .ux-labels-values__labels')?.[i];
        if (label) {
          product.specifications.push({
            name: Utils.cleanText(label.textContent),
            value: Utils.cleanText(row.textContent)
          });
        }
      });
      
      product.source_url = window.location.href;
      
      console.log('[ShopOpti+] eBay extraction complete:', product.title,
        '| Images:', product.images.length);
      
      return product;
    }
  };

  // ============================================
  // ETSY ADVANCED EXTRACTOR
  // ============================================
  const EtsyExtractor = {
    extract() {
      const product = createEmptyProduct();
      product.platform = 'etsy';
      
      // Listing ID from URL
      const idMatch = window.location.href.match(/\/listing\/(\d+)/);
      product.external_id = idMatch?.[1] || '';
      product.sku = product.external_id;
      
      // Title
      product.title = Utils.cleanText(
        document.querySelector('h1[data-buy-box-listing-title], h1')?.textContent
      );
      
      // Price
      const priceEl = document.querySelector('[data-buy-box-region="price"] .currency-value, .wt-text-title-larger');
      if (priceEl) {
        const { price, currency } = Utils.parsePrice(priceEl.textContent);
        product.price = price;
        product.currency = currency;
      }
      
      // Images
      const imageSet = new Set();
      document.querySelectorAll(
        '.listing-page-image-carousel-component img, .carousel-image img, ' +
        '[data-component="listing-page-image-carousel"] img'
      ).forEach(img => {
        const normalized = Utils.normalizeImageUrl(img.src, 'etsy');
        if (normalized && !normalized.includes('placeholder')) {
          imageSet.add(normalized);
        }
      });
      product.images = [...imageSet].slice(0, 25);
      product.thumbnail = product.images[0] || '';
      
      // Shop/Seller info
      const shopEl = document.querySelector('[data-shop-name], .shop-name-and-title-container a');
      if (shopEl) {
        product.vendor = Utils.cleanText(shopEl.textContent);
        product.seller.store_name = product.vendor;
        product.seller.url = shopEl.href;
      }
      
      // Rating
      const ratingEl = document.querySelector('[data-buy-box-region="rating"] [aria-hidden="true"]');
      product.rating = Utils.parseRating(ratingEl?.textContent);
      
      // Reviews
      const reviewsEl = document.querySelector('[data-buy-box-region="rating"] a, .reviews-total');
      product.reviews_count = Utils.parseNumber(reviewsEl?.textContent);
      
      // Description
      const descEl = document.querySelector('[data-id="description-text"], .wt-text-body-01');
      product.description = Utils.cleanText(descEl?.textContent?.slice(0, 8000)) || '';
      
      // Variants
      document.querySelectorAll('.variation-selector select option').forEach(opt => {
        if (opt.value) {
          product.variants.push({
            type: 'option',
            value: opt.textContent.trim(),
            available: !opt.disabled
          });
        }
      });
      product.has_variants = product.variants.length > 0;
      
      // Shipping
      const shippingEl = document.querySelector('[data-estimated-delivery], .estimated-delivery');
      if (shippingEl) {
        product.shipping.estimated_delivery = Utils.cleanText(shippingEl.textContent);
      }
      
      product.source_url = window.location.href;
      
      console.log('[ShopOpti+] Etsy extraction complete:', product.title,
        '| Images:', product.images.length);
      
      return product;
    }
  };

  // ============================================
  // SHEIN ADVANCED EXTRACTOR
  // ============================================
  const SheinExtractor = {
    extract() {
      const product = createEmptyProduct();
      product.platform = 'shein';
      
      // SKU from URL
      const skuMatch = window.location.href.match(/-p-(\d+)\.html/);
      product.external_id = skuMatch?.[1] || '';
      product.sku = product.external_id;
      
      // Title
      product.title = Utils.cleanText(
        document.querySelector('.product-intro__head-name, h1')?.textContent
      );
      
      // Price
      const priceEl = document.querySelector('.product-intro__head-price, [class*="price"]');
      if (priceEl) {
        const { price, currency } = Utils.parsePrice(priceEl.textContent);
        product.price = price;
        product.currency = currency;
      }
      
      // Images
      const imageSet = new Set();
      document.querySelectorAll(
        '.product-intro__thumbs-item img, .crop-image-container img, ' +
        '.product-intro__main-image img'
      ).forEach(img => {
        const normalized = Utils.normalizeImageUrl(img.src, 'shein');
        if (normalized) {
          imageSet.add(normalized);
        }
      });
      product.images = [...imageSet].slice(0, 25);
      product.thumbnail = product.images[0] || '';
      
      // Rating
      const ratingEl = document.querySelector('.product-intro__head-star-comment .rate-num');
      product.rating = Utils.parseRating(ratingEl?.textContent);
      
      // Reviews
      const reviewsEl = document.querySelector('.product-intro__head-star-comment a');
      product.reviews_count = Utils.parseNumber(reviewsEl?.textContent);
      
      // Variants - Color
      document.querySelectorAll('.product-intro__color-radio-item').forEach(item => {
        const imgEl = item.querySelector('img');
        product.variants.push({
          type: 'color',
          value: imgEl?.alt || 'Color',
          image: Utils.normalizeImageUrl(imgEl?.src, 'shein')
        });
      });
      
      // Variants - Size
      document.querySelectorAll('.product-intro__size-radio-item').forEach(item => {
        product.variants.push({
          type: 'size',
          value: item.textContent.trim(),
          available: !item.classList.contains('disabled')
        });
      });
      
      product.has_variants = product.variants.length > 0;
      product.source_url = window.location.href;
      
      console.log('[ShopOpti+] Shein extraction complete:', product.title,
        '| Images:', product.images.length);
      
      return product;
    }
  };

  // ============================================
  // WALMART ADVANCED EXTRACTOR
  // ============================================
  const WalmartExtractor = {
    extract() {
      const product = createEmptyProduct();
      product.platform = 'walmart';
      
      // Item ID from URL
      const idMatch = window.location.href.match(/\/ip\/[^\/]+\/(\d+)/);
      product.external_id = idMatch?.[1] || '';
      product.sku = product.external_id;
      
      // Try JSON-LD first
      const jsonLd = Utils.extractJsonLd();
      if (jsonLd.length > 0) {
        const data = jsonLd[0];
        product.title = data.name || '';
        product.description = Utils.cleanText(data.description || '');
        product.sku = data.sku || product.sku;
        product.brand = data.brand?.name || '';
        
        if (data.offers) {
          const offer = Array.isArray(data.offers) ? data.offers[0] : data.offers;
          product.price = parseFloat(offer.price) || 0;
          product.currency = offer.priceCurrency || 'USD';
          product.availability = offer.availability?.includes('InStock') || false;
          product.stock_status = product.availability ? 'in_stock' : 'out_of_stock';
        }
        
        if (data.image) {
          product.images = (Array.isArray(data.image) ? data.image : [data.image]).filter(Boolean);
        }
        
        if (data.aggregateRating) {
          product.rating = parseFloat(data.aggregateRating.ratingValue) || null;
          product.reviews_count = parseInt(data.aggregateRating.reviewCount) || 0;
        }
      }
      
      // DOM fallback
      if (!product.title) {
        product.title = Utils.cleanText(document.querySelector('h1[itemprop="name"], h1')?.textContent);
      }
      
      // Images from DOM
      if (product.images.length === 0) {
        document.querySelectorAll('[data-testid="hero-image"] img, .prod-hero-image img').forEach(img => {
          if (img.src && !img.src.includes('placeholder')) {
            product.images.push(img.src);
          }
        });
      }
      
      product.source_url = window.location.href;
      
      console.log('[ShopOpti+] Walmart extraction complete:', product.title);
      
      return product;
    }
  };

  // ============================================
  // GENERIC EXTRACTOR (Fallback)
  // ============================================
  const GenericExtractor = {
    extract() {
      const product = createEmptyProduct();
      product.platform = 'generic';
      
      // Try JSON-LD first
      const jsonLd = Utils.extractJsonLd();
      if (jsonLd.length > 0) {
        const data = jsonLd[0];
        product.title = data.name || '';
        product.description = Utils.cleanText(data.description || '');
        product.sku = data.sku || '';
        product.brand = data.brand?.name || '';
        product.gtin = data.gtin || data.gtin13 || data.gtin12 || '';
        product.mpn = data.mpn || '';
        
        if (data.offers) {
          const offer = Array.isArray(data.offers) ? data.offers[0] : data.offers;
          product.price = parseFloat(offer.price) || 0;
          product.currency = offer.priceCurrency || 'EUR';
          product.availability = offer.availability?.includes('InStock') || false;
          product.stock_status = product.availability ? 'in_stock' : 'out_of_stock';
        }
        
        if (data.image) {
          product.images = (Array.isArray(data.image) ? data.image : [data.image]).filter(Boolean);
        }
        
        if (data.aggregateRating) {
          product.rating = parseFloat(data.aggregateRating.ratingValue) || null;
          product.reviews_count = parseInt(data.aggregateRating.reviewCount) || 0;
        }
      }
      
      // Open Graph fallback
      const og = Utils.extractOpenGraph();
      if (!product.title && og.title) product.title = og.title;
      if (!product.description && og.description) product.description = og.description;
      if (product.images.length === 0 && og.image) product.images.push(og.image);
      if (og.price_amount) {
        const { price } = Utils.parsePrice(og.price_amount);
        if (price > 0) product.price = price;
      }
      if (og.price_currency) product.currency = og.price_currency;
      
      // DOM fallback
      if (!product.title) {
        product.title = Utils.cleanText(
          document.querySelector('h1, .product-title, [class*="title"]')?.textContent || 
          document.title
        );
      }
      
      // Find price from DOM
      if (!product.price) {
        const priceEls = document.querySelectorAll('[class*="price"], [itemprop="price"]');
        for (const el of priceEls) {
          const { price, currency } = Utils.parsePrice(el.textContent || el.getAttribute('content'));
          if (price > 0) {
            product.price = price;
            product.currency = currency;
            break;
          }
        }
      }
      
      // Find images from DOM
      if (product.images.length === 0) {
        document.querySelectorAll('[class*="gallery"] img, [class*="product"] img, main img').forEach(img => {
          if (img.src && img.src.includes('http') && !img.src.includes('placeholder') &&
              !img.src.includes('icon') && !img.src.includes('logo')) {
            product.images.push(img.src);
          }
        });
        product.images = product.images.slice(0, 20);
      }
      
      product.source_url = window.location.href;
      
      console.log('[ShopOpti+] Generic extraction complete:', product.title,
        '| Images:', product.images.length);
      
      return product;
    }
  };

  // ============================================
  // MAIN EXTRACTOR
  // ============================================
  const AdvancedExtractor = {
    detectPlatform() {
      const hostname = window.location.hostname.toLowerCase();
      
      if (hostname.includes('amazon')) return 'amazon';
      if (hostname.includes('aliexpress')) return 'aliexpress';
      if (hostname.includes('alibaba')) return 'alibaba';
      if (hostname.includes('temu')) return 'temu';
      if (hostname.includes('shein')) return 'shein';
      if (hostname.includes('ebay')) return 'ebay';
      if (hostname.includes('etsy')) return 'etsy';
      if (hostname.includes('walmart')) return 'walmart';
      if (hostname.includes('wish')) return 'wish';
      if (hostname.includes('banggood')) return 'banggood';
      if (hostname.includes('dhgate')) return 'dhgate';
      if (hostname.includes('cjdropshipping')) return 'cjdropshipping';
      if (hostname.includes('cdiscount')) return 'cdiscount';
      if (hostname.includes('fnac')) return 'fnac';
      if (hostname.includes('rakuten')) return 'rakuten';
      if (hostname.includes('costco')) return 'costco';
      if (hostname.includes('homedepot')) return 'homedepot';
      if (hostname.includes('lowes')) return 'lowes';
      if (hostname.includes('target')) return 'target';
      
      // Shopify detection
      if (document.querySelector('meta[name="shopify-checkout-api-token"]') ||
          document.querySelector('link[href*="cdn.shopify.com"]') ||
          hostname.includes('myshopify') ||
          window.Shopify) {
        return 'shopify';
      }
      
      return 'generic';
    },
    
    async extract() {
      const platform = this.detectPlatform();
      console.log('[ShopOpti+] Detected platform:', platform);
      
      const extractors = {
        amazon: AmazonExtractor,
        aliexpress: AliExpressExtractor,
        shopify: ShopifyExtractor,
        temu: TemuExtractor,
        ebay: EbayExtractor,
        etsy: EtsyExtractor,
        shein: SheinExtractor,
        walmart: WalmartExtractor
      };
      
      const extractor = extractors[platform] || GenericExtractor;
      
      try {
        const product = await extractor.extract();
        product.platform = platform;
        product.extracted_at = new Date().toISOString();
        
        // Post-processing validation
        this.validateAndEnrich(product);
        
        return product;
      } catch (error) {
        console.error('[ShopOpti+] Extraction error:', error);
        
        // Fallback to generic
        const fallback = GenericExtractor.extract();
        fallback.platform = platform;
        fallback.custom_fields.extraction_error = error.message;
        return fallback;
      }
    },
    
    validateAndEnrich(product) {
      // Ensure required fields
      if (!product.title) {
        product.title = document.title?.split('|')[0]?.trim() || 'Unknown Product';
      }
      
      // Deduplicate images
      product.images = [...new Set(product.images)].filter(Boolean);
      
      // Set thumbnail
      if (!product.thumbnail && product.images.length > 0) {
        product.thumbnail = product.images[0];
      }
      
      // Ensure valid stock status
      if (!['in_stock', 'out_of_stock', 'low_stock', 'preorder', 'backorder'].includes(product.stock_status)) {
        product.stock_status = product.availability ? 'in_stock' : 'unknown';
      }
      
      // Clean up empty arrays
      if (product.variants.length === 0) product.has_variants = false;
      
      // Ensure numeric fields
      product.price = product.price || 0;
      product.rating_count = product.rating_count || product.reviews_count || 0;
      
      return product;
    }
  };

  // Expose globally
  window.ShopOptiAdvancedExtractor = AdvancedExtractor;
  
  console.log('[ShopOpti+] Advanced Extractor v5.0 loaded successfully');

})();
