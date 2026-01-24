// ============================================
// ShopOpti+ Chrome Extension - Content Script v4.3.16
// PROFESSIONAL UI - Inspired by Fnac, Cdiscount, eBay
// 100% CSP-SAFE - Pure Content Script Mode
// Works on Amazon, AliExpress, and all 25+ platforms
// ADVANCED EXTRACTION: Images, Videos, Prices, Stock, 
// Descriptions, Tracking, Brands, Specs, Shipping, Variants
// FIXED: Professional buttons with states (success/error/loading)
// FIXED: Bulk import with counter + progress tracking
// ============================================

(function () {
  'use strict';

  // Prevent multiple injections
  if (window.__shopOptiCSVersion === '4.3.16') return;
  window.__shopOptiCSVersion = '4.3.16';

  console.log('[ShopOpti+] Content script v4.3.16 initializing (Professional UI)...');

  // ============================================
  // PERF: debounce helper for MutationObserver
  // ============================================
  function debounce(fn, wait = 350) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  // ============================================
  // CHROME API SAFETY CHECK
  // ============================================
  function isChromeRuntimeAvailable() {
    try {
      return !!(typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id && chrome.runtime.sendMessage);
    } catch (e) {
      return false;
    }
  }

  async function safeSendMessage(message) {
    if (!isChromeRuntimeAvailable()) {
      console.warn('[ShopOpti+] Extension context invalidated - please reload the page');
      throw new Error('Extension déconnectée. Rechargez la page (F5).');
    }
    
    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            console.error('[ShopOpti+] Runtime error:', chrome.runtime.lastError);
            reject(new Error('Extension déconnectée. Rechargez la page.'));
          } else {
            resolve(response);
          }
        });
      } catch (e) {
        reject(new Error('Extension déconnectée. Rechargez la page.'));
      }
    });
  }

  // ============================================
  // CONFIGURATION v4.3.16
  // ============================================
  const CONFIG = {
    VERSION: '4.3.16',
    BRAND: 'ShopOpti+',
    SUPPORTED_PLATFORMS: [
      'amazon', 'aliexpress', 'alibaba', 'temu', 'shein', 'shopify', 
      'ebay', 'etsy', 'walmart', 'cjdropshipping', 'banggood', 'dhgate', 
      'wish', 'cdiscount', 'fnac', 'rakuten', 'costco', 'homedepot', 
      'lowes', 'target', 'bestbuy', 'wayfair', 'overstock', 'newegg',
      'zalando', 'asos', 'manomano', 'darty', 'boulanger', 'leroymerlin'
    ]
  };

  // ============================================
  // PLATFORM DETECTION - ENHANCED v4.3.16
  // ============================================
  function detectPlatform() {
    const hostname = window.location.hostname.toLowerCase();
    
    if (hostname.includes('amazon')) return 'amazon';
    if (hostname.includes('aliexpress')) return 'aliexpress';
    if (hostname.includes('alibaba')) return 'alibaba';
    if (hostname.includes('temu')) return 'temu';
    if (hostname.includes('shein')) return 'shein';
    if (hostname.includes('ebay')) return 'ebay';
    if (hostname.includes('etsy')) return 'etsy';
    if (hostname.includes('walmart')) return 'walmart';
    if (hostname.includes('cjdropshipping')) return 'cjdropshipping';
    if (hostname.includes('banggood')) return 'banggood';
    if (hostname.includes('dhgate')) return 'dhgate';
    if (hostname.includes('wish')) return 'wish';
    if (hostname.includes('cdiscount')) return 'cdiscount';
    if (hostname.includes('fnac')) return 'fnac';
    if (hostname.includes('rakuten')) return 'rakuten';
    if (hostname.includes('costco')) return 'costco';
    if (hostname.includes('homedepot')) return 'homedepot';
    if (hostname.includes('lowes')) return 'lowes';
    if (hostname.includes('target')) return 'target';
    if (hostname.includes('bestbuy')) return 'bestbuy';
    if (hostname.includes('wayfair')) return 'wayfair';
    
    // Shopify detection
    if (document.querySelector('meta[name="shopify-checkout-api-token"]') ||
        document.querySelector('link[href*="cdn.shopify.com"]') ||
        hostname.includes('myshopify') ||
        window.Shopify) {
      return 'shopify';
    }
    
    return 'unknown';
  }

  // ============================================
  // PRODUCT PAGE DETECTION - ENHANCED v4.3.16
  // ============================================
  function isProductPage() {
    const url = window.location.href;
    const platform = detectPlatform();
    
    const patterns = {
      amazon: /\/(dp|gp\/product|product)\/[A-Z0-9]+/i,
      aliexpress: /\/item\/|\/i\/|\/_p\//i,
      alibaba: /\/product-detail\//i,
      temu: /\/[a-z0-9_-]+-g-\d+\.html|goods\.html\?|\/goods\.html/i,
      shein: /\/-p-\d+\.html|\?goods_id=|\/product-p-/i,
      ebay: /\/itm\/\d+|\/p\/\d+|\/itm\//i,
      etsy: /\/listing\//i,
      walmart: /\/ip\/\d+|\/product\//i,
      shopify: /\/products\//i,
      // Cdiscount: /f-NUMBERS-PRODUCT_ID.html OR /v-XXX OR .html with mpos/mpid
      cdiscount: /\/f-\d+-[a-z0-9]+\.html|\/v-\d+|mpid=|\/fp\/|\/dp\/|[?#]mpos=/i,
      fnac: /\/a\d+\//i,
      rakuten: /\/product\/|\/offer\/|\/ss_\d+/i,
      costco: /\.product\.\d+\.html/i,
      homedepot: /\/p\/\d+/i,
      lowes: /\/pd\//i,
      target: /\/-\/A-\d+/i,
      bestbuy: /\/skuId=/i,
      wayfair: /\.html\?piid=/i,
      banggood: /\/-p-\d+\.html/i,
      dhgate: /\/product\/\d+\.html/i,
      wish: /\/product\//i,
      cjdropshipping: /\/product-detail\//i
    };
    
    // Check specific platform pattern
    if (patterns[platform]?.test(url)) return true;
    
    // Generic product page detection via URL structure
    if (url.includes('/product') || url.includes('/products/') || url.includes('/item/')) {
      return true;
    }
    
    // DOM-based fallback: if title and price selectors exist, it's likely a product page
    const hasTitleSelector = !!document.querySelector('h1, [itemprop="name"], .product-title');
    const hasPriceSelector = !!document.querySelector('[itemprop="price"], .fpPrice, .prdtPrSt, .a-price, .product-price');
    if (hasTitleSelector && hasPriceSelector) {
      console.log('[ShopOpti+] Product page detected via DOM fallback');
      return true;
    }
    
    return false;
  }

  // ============================================
  // LISTING PAGE DETECTION - ENHANCED v4.3.16
  // ============================================
  function isListingPage() {
    const url = window.location.href;
    const platform = detectPlatform();
    
    const listingPatterns = {
      amazon: /\/gp\/bestsellers|\/gp\/new-releases|\/gp\/movers-and-shakers|\/gp\/most-wished-for|\/gp\/top-|\/s\?|\/s\/|\/b\?|\/b\/|\?k=|\/zgbs\/|\/stores\/|\/slp\/|\/browse\/|\/new-releases\//i,
      aliexpress: /\/category\/|\/wholesale|\/w\/|\/af\/|\/gcp\/|\/store\/|\/mall\//i,
      temu: /\/channel\/|\/search_result|\/goods|\/mall\/|[?&]filter_/i,
      shein: /\/category\/|\/[a-z]+-c-\d+|pdsearch|\/pdsearch\//i,
      ebay: /\/b\/|\/sch\/|\/e\/|\/str\//i,
      walmart: /\/search\/|\/browse\/|\/shop\//i,
      etsy: /\/search\?|\/c\/|\/shop\//i,
      cdiscount: /\/search\/|\/browse\/|\/lp\/|\/mpid\/|[?&]keyword=/i,
      fnac: /\/[a-z]+-\d+\/|\/recherche\/|\/c\d+\//i,
      rakuten: /\/search\/|\/category\/|\/s\//i,
      costco: /\/search/i,
      homedepot: /\/b\/|\/s\//i,
      lowes: /\/search|\/pl\//i,
      target: /\/s\?|\/c\//i,
      bestbuy: /\/site\/searchpage|\/site\/.*\/pcmcat/i,
      wayfair: /\/sb\d|\/keyword=/i
    };
    
    // Check specific platform listing pattern
    if (listingPatterns[platform]?.test(url)) return true;
    
    // Count product cards to determine if listing page
    const productCardSelectors = [
      '[data-asin]', '.s-result-item', '.product-card', '.product-item',
      '.goods-item', '[class*="GoodsItem"]', '.s-item', '.list-item',
      '[data-component-type="s-search-result"]', '.prdtBloc', '.c-productCard',
      '.product-list__item', '.v2-listing-card', '[data-product-id]'
    ];
    
    for (const selector of productCardSelectors) {
      const cards = document.querySelectorAll(selector);
      if (cards.length >= 4) {
        console.log(`[ShopOpti+] Detected listing page with ${cards.length} product cards (${selector})`);
        return true;
      }
    }
    
    return false;
  }

  // ============================================
  // DATA EXTRACTION (Pure DOM - No CSP Issues)
  // ============================================
  function extractProductData() {
    const platform = detectPlatform();
    console.log('[ShopOpti+] Extracting data for platform:', platform);

    const extractors = {
      amazon: extractAmazonData,
      aliexpress: extractAliExpressData,
      shopify: extractShopifyData,
      temu: extractTemuData,
      ebay: extractEbayData,
      shein: extractSheinData,
      etsy: extractEtsyData,
      cdiscount: extractCdiscountData,
      walmart: extractWalmartData,
      fnac: extractFnacData
    };

    const extractor = extractors[platform] || extractGenericData;
    const data = extractor();
    
    data.platform = platform;
    data.source_url = window.location.href;
    data.extracted_at = new Date().toISOString();
    
    console.log('[ShopOpti+] Extracted data:', data);
    return data;
  }

  function extractAmazonData() {
    const data = {
      title: '',
      price: 0,
      currency: 'EUR',
      description: '',
      images: [],
      variants: [],
      rating: null,
      reviews_count: 0,
      asin: '',
      sku: '',
      brand: '',
      category: ''
    };

    // Title
    const titleEl = document.querySelector('#productTitle, #title, .product-title-word-break');
    data.title = titleEl?.textContent?.trim() || '';

    // ASIN from URL or page
    const asinMatch = window.location.href.match(/\/dp\/([A-Z0-9]+)/i) ||
                      window.location.href.match(/\/gp\/product\/([A-Z0-9]+)/i);
    data.asin = asinMatch?.[1] || document.querySelector('[data-asin]')?.dataset?.asin || '';
    data.sku = data.asin;

    // Brand
    const brandEl = document.querySelector('#bylineInfo, .po-brand .a-span9 .a-size-base, a#bylineInfo');
    if (brandEl) {
      data.brand = brandEl.textContent?.replace(/^(Marque|Brand|Visit the|Visiter la boutique)\s*:?\s*/i, '').trim() || '';
    }

    // Price - comprehensive selectors
    const priceSelectors = [
      '.a-price .a-offscreen',
      '#priceblock_ourprice',
      '#priceblock_dealprice', 
      '#priceblock_saleprice',
      '.apexPriceToPay .a-offscreen',
      '#corePrice_feature_div .a-offscreen',
      '.priceToPay .a-offscreen',
      '[data-a-color="price"] .a-offscreen',
      '.reinventPricePriceToPayMargin .a-offscreen',
      '#apex_desktop .a-price .a-offscreen'
    ];
    
    for (const selector of priceSelectors) {
      const priceEl = document.querySelector(selector);
      if (priceEl) {
        const priceText = priceEl.textContent?.trim() || '';
        const priceMatch = priceText.match(/[\d,.]+/);
        if (priceMatch) {
          data.price = parseFloat(priceMatch[0].replace(',', '.'));
          if (priceText.includes('$')) data.currency = 'USD';
          else if (priceText.includes('£')) data.currency = 'GBP';
          else if (priceText.includes('€')) data.currency = 'EUR';
          break;
        }
      }
    }

    // Description - Enhanced
    const descParts = [];
    const bulletList = document.querySelector('#feature-bullets ul');
    if (bulletList) {
      bulletList.querySelectorAll('li span.a-list-item').forEach(li => {
        const text = li.textContent?.trim();
        if (text && !text.includes('›')) descParts.push('• ' + text);
      });
    }
    const productDesc = document.querySelector('#productDescription p, #productDescription_feature_div');
    if (productDesc) {
      descParts.push(productDesc.textContent?.trim());
    }
    data.description = descParts.join('\n\n').slice(0, 5000) || '';

    // Images - Enhanced high-res extraction with DEDUPLICATION
    const imageElements = document.querySelectorAll('#altImages img, #imageBlock img, .imgTagWrapper img, .a-dynamic-image, #landingImage, #imgBlkFront, [data-old-hires], li.image img, #main-image-container img, .image-wrapper img');
    const imageSet = new Set();
    const seenHashes = new Set();
    
    function normalizeAmazonImage(src) {
      if (!src) return null;
      // Remove size transforms to get original high-res
      let normalized = src
        .replace(/\._[A-Z]{2}\d+_\./, '._SL1500_.')
        .replace(/\._S[XY]\d+_\./, '._SL1500_.')
        .replace(/_AC_US\d+_/, '_AC_SL1500_')
        .replace(/_AC_S[XY]\d+_/, '_AC_SL1500_')
        .replace(/_SS\d+_/, '_SL1500_')
        .replace(/_SR\d+,\d+_/, '_SL1500_')
        .replace(/_CR\d+,\d+,\d+,\d+_/, '')
        .replace(/\?.*$/, '');
      return normalized;
    }
    
    function getImageHash(src) {
      // Extract unique image identifier to detect duplicates
      const match = src.match(/\/([A-Z0-9]+)\._/i) || src.match(/\/I\/([^.]+)/);
      return match ? match[1] : src.substring(src.lastIndexOf('/'), src.lastIndexOf('.'));
    }
    
    imageElements.forEach(img => {
      let src = img.dataset?.oldHires || img.dataset?.aHires || img.src || '';
      if (src && !src.includes('sprite') && !src.includes('transparent') && !src.includes('grey-pixel') && !src.includes('blank') && !src.includes('icon') && !src.includes('logo')) {
        const normalized = normalizeAmazonImage(src);
        const hash = getImageHash(normalized);
        
        // Deduplicate by hash
        if (!seenHashes.has(hash) && (normalized.includes('images/I/') || normalized.includes('images-amazon.com')) && normalized.includes('http')) {
          seenHashes.add(hash);
          imageSet.add(normalized);
        }
      }
    });

    // Check for data-zoom-image attributes
    document.querySelectorAll('[data-zoom-image]').forEach(el => {
      const zoomSrc = el.getAttribute('data-zoom-image');
      if (zoomSrc && zoomSrc.includes('http')) {
        const normalized = normalizeAmazonImage(zoomSrc);
        const hash = getImageHash(normalized);
        if (!seenHashes.has(hash)) {
          seenHashes.add(hash);
          imageSet.add(normalized);
        }
      }
    });
    
    data.images = Array.from(imageSet).filter(url => url && url.length > 20).slice(0, 20);

    // Rating
    const ratingEl = document.querySelector('#acrPopover .a-icon-alt, .a-icon-star .a-icon-alt, [data-action="a-popover"] .a-icon-alt');
    if (ratingEl) {
      const ratingMatch = ratingEl.textContent?.match(/[\d,.]+/);
      data.rating = ratingMatch ? parseFloat(ratingMatch[0].replace(',', '.')) : null;
    }

    // Reviews count
    const reviewsEl = document.querySelector('#acrCustomerReviewText, #averageCustomerReviews_feature_div .a-size-base');
    if (reviewsEl) {
      const countMatch = reviewsEl.textContent?.match(/[\d\s,.]+/);
      data.reviews_count = countMatch ? parseInt(countMatch[0].replace(/[\s.,]/g, '')) : 0;
    }

    // Variants - Enhanced extraction
    const sizeVariants = document.querySelectorAll('#variation_size_name li:not(.swatchUnavailable), #twister-plus-inline-twister-card li');
    sizeVariants.forEach(v => {
      const text = v.querySelector('.a-button-text, .a-size-base')?.textContent?.trim();
      if (text && text.length < 50) {
        data.variants.push({ type: 'size', name: text, available: !v.classList.contains('swatchUnavailable') });
      }
    });
    
    const colorVariants = document.querySelectorAll('#variation_color_name li, #variation-color li');
    colorVariants.forEach(v => {
      const text = v.querySelector('.a-button-text, img')?.getAttribute('alt') || v.querySelector('.a-button-text')?.textContent?.trim();
      if (text && text.length < 50) {
        const imgEl = v.querySelector('img');
        data.variants.push({ 
          type: 'color', 
          name: text, 
          image: imgEl?.src?.replace(/\._[A-Z]{2}\d+_\./, '._SL1500_.'),
          available: !v.classList.contains('swatchUnavailable') 
        });
      }
    });

    const styleVariants = document.querySelectorAll('#variation_style_name li');
    styleVariants.forEach(v => {
      const text = v.querySelector('.a-button-text, img')?.getAttribute('alt') || v.querySelector('.a-button-text')?.textContent?.trim();
      if (text && text.length < 50) {
        data.variants.push({ type: 'style', name: text, available: !v.classList.contains('swatchUnavailable') });
      }
    });

    console.log('[ShopOpti+] Amazon data extracted:', data.title, '| Images:', data.images.length, '| Variants:', data.variants.length);
    return data;
  }

  function extractAliExpressData() {
    const data = {
      title: '',
      price: 0,
      currency: 'EUR',
      description: '',
      images: [],
      variants: [],
      rating: null,
      reviews_count: 0,
      orders_count: 0,
      sku: ''
    };

    // Title - multiple selectors for different AliExpress layouts
    const titleSelectors = [
      'h1[data-pl="product-title"]',
      '.product-title-text',
      '[class*="product-title"]',
      '.title--wrap--UUHae_g h1',
      'h1'
    ];
    for (const selector of titleSelectors) {
      const el = document.querySelector(selector);
      if (el?.textContent?.trim()) {
        data.title = el.textContent.trim();
        break;
      }
    }

    // Price - multiple strategies
    const priceSelectors = [
      '[class*="price--current"]',
      '.product-price-value',
      '.uniform-banner-box-price',
      '[class*="Price"] span',
      '.es--wrap--erdmPRe .es--char--',
      '[data-spm="price"]'
    ];
    for (const selector of priceSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        const priceMatch = el.textContent?.match(/[\d,.]+/);
        if (priceMatch) {
          data.price = parseFloat(priceMatch[0].replace(',', '.'));
          break;
        }
      }
    }

    // SKU/Item ID from URL
    const skuMatch = window.location.href.match(/\/(\d+)\.html/) || 
                     window.location.href.match(/item\/(\d+)/);
    data.sku = skuMatch?.[1] || '';

    // Images - Enhanced extraction with DEDUPLICATION for AliExpress
    const imageElements = document.querySelectorAll(
      '.images-view-item img, ' +
      '.slider--img--item img, ' +
      '[class*="gallery"] img, ' +
      '.product-img img, ' +
      '.image-view--previewBox--SyecEnE img, ' +
      '[class*="slider"] img, ' +
      '[class*="magnifier"] img, ' +
      '.pdp-info-left img'
    );
    const imageSet = new Set();
    const seenHashes = new Set();
    
    function normalizeAliImage(src) {
      if (!src) return null;
      let normalized = src
        .replace(/_\d+x\d+\./g, '.')
        .replace(/\.jpg_\d+x\d+\.jpg/g, '.jpg')
        .replace(/_\d+x\d+\.jpg/g, '.jpg')
        .replace(/_\d+x\d+\.png/g, '.png')
        .replace(/\?.*$/, '')
        .replace(/_Q\d+\.jpg/, '.jpg');
      if (normalized.startsWith('//')) normalized = 'https:' + normalized;
      return normalized;
    }
    
    function getAliImageHash(src) {
      const match = src.match(/\/([^/]+)\.(jpg|png|webp)/i);
      return match ? match[1] : src.substring(src.lastIndexOf('/'));
    }
    
    imageElements.forEach(img => {
      let src = img.src || img.dataset?.src || img.getAttribute('data-src');
      if (src && !src.includes('placeholder') && !src.includes('icon') && !src.includes('logo') && !src.includes('sprite')) {
        const normalized = normalizeAliImage(src);
        const hash = getAliImageHash(normalized);
        
        if (!seenHashes.has(hash) && (normalized.includes('alicdn.com') || normalized.includes('cbu01.alicdn')) && normalized.includes('http')) {
          seenHashes.add(hash);
          imageSet.add(normalized);
        }
      }
    });
    
    data.images = Array.from(imageSet).filter(url => url && url.length > 20).slice(0, 20);

    // Rating
    const ratingEl = document.querySelector('[class*="rating"] strong, .overview-rating-average, [class*="star"] span');
    if (ratingEl) {
      const ratingMatch = ratingEl.textContent?.match(/[\d,.]+/);
      data.rating = ratingMatch ? parseFloat(ratingMatch[0].replace(',', '.')) : null;
    }

    // Reviews count
    const reviewsEl = document.querySelector('[class*="reviews"] span, [class*="Reviews"]');
    if (reviewsEl) {
      const countMatch = reviewsEl.textContent?.match(/(\d+)/);
      data.reviews_count = countMatch ? parseInt(countMatch[1]) : 0;
    }

    // Orders count
    const ordersEl = document.querySelector('[class*="trade"], [class*="sold"], [class*="orders"]');
    if (ordersEl) {
      const ordersMatch = ordersEl.textContent?.match(/(\d+)/);
      data.orders_count = ordersMatch ? parseInt(ordersMatch[1]) : 0;
    }

    // Variants
    const skuContainers = document.querySelectorAll('[class*="sku-property"], [class*="sku-item"], .sku-property-item');
    skuContainers.forEach(container => {
      const propertyName = container.querySelector('[class*="sku-title"], .sku-property-text')?.textContent?.trim() || 'Option';
      const items = container.querySelectorAll('[class*="sku-property-item"], [class*="image-view--wrap"], img[class*="sku"]');
      
      items.forEach(item => {
        const text = item.getAttribute('title') || item.textContent?.trim() || item.getAttribute('alt');
        if (text && text.length < 100) {
          const imgEl = item.tagName === 'IMG' ? item : item.querySelector('img');
          let img = imgEl?.src;
          if (img) {
            img = img.replace(/_\d+x\d+\./g, '.');
            if (img.startsWith('//')) img = 'https:' + img;
          }
          data.variants.push({ 
            type: propertyName.toLowerCase().includes('color') ? 'color' : 'option',
            name: text,
            image: img
          });
        }
      });
    });

    // Description
    const descEl = document.querySelector('[class*="product-description"], [class*="desc-content"], #product-description');
    data.description = descEl?.textContent?.trim().slice(0, 3000) || '';

    console.log('[ShopOpti+] AliExpress data extracted:', data.title, '| Images:', data.images.length, '| Variants:', data.variants.length);
    return data;
  }

  function extractTemuData() {
    const data = {
      title: '',
      price: 0,
      currency: 'EUR',
      images: [],
      variants: []
    };

    const titleEl = document.querySelector('h1, [class*="ProductTitle"], [class*="title"]');
    data.title = titleEl?.textContent?.trim() || '';

    const priceEl = document.querySelector('[class*="price" i], [class*="Price" i]');
    if (priceEl) {
      const priceMatch = priceEl.textContent?.match(/[\d,.]+/);
      data.price = priceMatch ? parseFloat(priceMatch[0].replace(',', '.')) : 0;
    }

    document.querySelectorAll('img[src*="img.kwcdn.com"]').forEach(img => {
      if (img.src && !img.src.includes('avatar')) {
        data.images.push(img.src);
      }
    });

    return data;
  }

  function extractSheinData() {
    const data = {
      title: '',
      price: 0,
      currency: 'EUR',
      images: [],
      variants: []
    };

    const titleEl = document.querySelector('.product-intro__head-name, h1');
    data.title = titleEl?.textContent?.trim() || '';

    const priceEl = document.querySelector('.product-intro__head-price, [class*="price"]');
    if (priceEl) {
      const priceMatch = priceEl.textContent?.match(/[\d,.]+/);
      data.price = priceMatch ? parseFloat(priceMatch[0].replace(',', '.')) : 0;
    }

    document.querySelectorAll('.product-intro__thumbs-item img, .crop-image-container img').forEach(img => {
      if (img.src) {
        data.images.push(img.src.replace(/_thumbnail_\d+x\d+/, ''));
      }
    });

    return data;
  }

  function extractEbayData() {
    const data = {
      title: '',
      price: 0,
      currency: 'EUR',
      images: []
    };

    data.title = document.querySelector('h1.x-item-title__mainTitle, .it-ttl')?.textContent?.trim() || '';
    
    const priceEl = document.querySelector('.x-price-primary, #prcIsum');
    if (priceEl) {
      const priceMatch = priceEl.textContent?.match(/[\d,.]+/);
      data.price = priceMatch ? parseFloat(priceMatch[0].replace(',', '.')) : 0;
    }

    document.querySelectorAll('.ux-image-carousel img, .img-wrapper img').forEach(img => {
      if (img.src) {
        data.images.push(img.src.replace('/s-l64', '/s-l1600').replace('/s-l300', '/s-l1600'));
      }
    });

    return data;
  }

  function extractEtsyData() {
    const data = {
      title: '',
      price: 0,
      currency: 'EUR',
      images: [],
      description: ''
    };

    data.title = document.querySelector('h1[data-buy-box-listing-title], h1')?.textContent?.trim() || '';
    
    const priceEl = document.querySelector('[data-buy-box-region="price"] .currency-value, .wt-text-title-larger');
    if (priceEl) {
      const priceMatch = priceEl.textContent?.match(/[\d,.]+/);
      data.price = priceMatch ? parseFloat(priceMatch[0].replace(',', '.')) : 0;
    }

    document.querySelectorAll('.listing-page-image-carousel-component img, .carousel-image img').forEach(img => {
      if (img.src) {
        data.images.push(img.src.replace(/il_\d+x\d+/, 'il_fullxfull'));
      }
    });

    return data;
  }

  function extractCdiscountData() {
    const data = {
      title: '',
      price: 0,
      currency: 'EUR',
      images: [],
      variants: [],
      description: '',
      sku: '',
      brand: ''
    };

    // Title - multiple selectors for different Cdiscount page layouts
    const titleSelectors = [
      'h1.fpDesCol',
      '.fpTMain h1',
      '[itemprop="name"]',
      'h1[class*="Title"]',
      '.product-title h1',
      'h1'
    ];
    for (const sel of titleSelectors) {
      const el = document.querySelector(sel);
      if (el?.textContent?.trim()) {
        data.title = el.textContent.trim();
        break;
      }
    }

    // Brand extraction
    const brandEl = document.querySelector('[itemprop="brand"] [itemprop="name"], .fpBrand, a[href*="marque-"]');
    if (brandEl) {
      data.brand = brandEl.textContent?.trim() || brandEl.getAttribute('content') || '';
    }

    // SKU from URL
    const skuMatch = window.location.href.match(/\/f-(\d+-[a-z0-9]+)\.html/i) ||
                     window.location.href.match(/mpid[=:]([a-z0-9]+)/i);
    data.sku = skuMatch?.[1] || '';
    
    // Price - comprehensive selectors
    const priceSelectors = [
      '[itemprop="price"]',
      '.fpPrice',
      '.prdtPrSt',
      '.priceContainer .price',
      '[class*="Price"]:not([class*="old"]):not([class*="strike"])',
      '.currentPrice',
      '.fpPriceMain'
    ];
    for (const sel of priceSelectors) {
      const priceEl = document.querySelector(sel);
      if (priceEl) {
        const content = priceEl.getAttribute('content');
        if (content) {
          data.price = parseFloat(content);
          break;
        }
        const priceMatch = priceEl.textContent?.match(/(\d+)[,.](\d{2})/);
        if (priceMatch) {
          data.price = parseFloat(`${priceMatch[1]}.${priceMatch[2]}`);
          break;
        }
      }
    }

    // Images - comprehensive selectors with high-res normalization
    const imageSelectors = [
      '.fpGal img',
      '.fpViImg img',
      '[itemprop="image"]',
      '.productMainPicture img',
      '.fpImgz img',
      '.carouselProduct img',
      '.product-image img',
      'img[data-large]',
      '.fpMedia img'
    ];
    const seenImages = new Set();
    for (const sel of imageSelectors) {
      document.querySelectorAll(sel).forEach(img => {
        let src = img.getAttribute('data-large') || 
                  img.getAttribute('data-zoom') || 
                  img.getAttribute('data-src') ||
                  img.src;
        if (src && !src.includes('placeholder') && !src.includes('transparent') && !src.includes('1x1')) {
          // Normalize to high-res
          src = src.replace(/_ML\d*\./, '_ML.').replace(/_\d+x\d+\./, '.');
          if (src.startsWith('//')) src = 'https:' + src;
          if (!seenImages.has(src) && src.includes('http')) {
            seenImages.add(src);
            data.images.push(src);
          }
        }
      });
    }

    // Variants - color/size options
    const variantContainers = document.querySelectorAll('[class*="variation"], [class*="Variation"], .fpVar, [data-variation]');
    variantContainers.forEach(container => {
      const items = container.querySelectorAll('li, button, a[data-value], span[data-value]');
      items.forEach(item => {
        const text = item.textContent?.trim() || item.getAttribute('data-value') || item.getAttribute('title');
        if (text && text.length < 50 && !item.classList.contains('selected')) {
          data.variants.push({ type: 'option', name: text });
        }
      });
    });

    // Description
    const descEl = document.querySelector('[itemprop="description"], .fpDescTxt, .productDescription, #fpDescContent');
    if (descEl) {
      data.description = descEl.textContent?.trim().slice(0, 3000) || '';
    }

    // Rating
    const ratingEl = document.querySelector('[itemprop="ratingValue"], .fpRat, .rating-value');
    if (ratingEl) {
      const ratingMatch = ratingEl.textContent?.match(/[\d,.]+/) || [ratingEl.getAttribute('content')];
      data.rating = ratingMatch?.[0] ? parseFloat(ratingMatch[0].replace(',', '.')) : null;
    }

    // Reviews count
    const reviewsEl = document.querySelector('[itemprop="reviewCount"], .fpRatCount, .reviews-count');
    if (reviewsEl) {
      const countMatch = reviewsEl.textContent?.match(/\d+/) || [reviewsEl.getAttribute('content')];
      data.reviews_count = countMatch?.[0] ? parseInt(countMatch[0]) : 0;
    }

    console.log('[ShopOpti+] Cdiscount data extracted:', data.title, '| Images:', data.images.length, '| Variants:', data.variants.length);
    return data;
  }

  function extractWalmartData() {
    const data = {
      title: '',
      price: 0,
      currency: 'USD',
      images: [],
      variants: []
    };

    data.title = document.querySelector('h1[itemprop="name"], h1')?.textContent?.trim() || '';
    
    const priceEl = document.querySelector('[itemprop="price"], [data-testid="price"]');
    if (priceEl) {
      const priceMatch = priceEl.textContent?.match(/[\d,.]+/);
      data.price = priceMatch ? parseFloat(priceMatch[0].replace(',', '.')) : 0;
    }

    document.querySelectorAll('[data-testid="media-thumbnail"] img, .prod-hero-image img').forEach(img => {
      if (img.src && !img.src.includes('placeholder')) {
        data.images.push(img.src);
      }
    });

    return data;
  }

  function extractFnacData() {
    const data = {
      title: '',
      price: 0,
      currency: 'EUR',
      images: [],
      variants: []
    };

    data.title = document.querySelector('h1.f-productHeader-Title, .Product-title')?.textContent?.trim() || '';
    
    const priceEl = document.querySelector('.f-priceBox-price, .userPrice, [itemprop="price"]');
    if (priceEl) {
      const priceMatch = priceEl.textContent?.match(/[\d,.]+/);
      data.price = priceMatch ? parseFloat(priceMatch[0].replace(',', '.')) : 0;
    }

    document.querySelectorAll('.f-productVisuals-mainMedia img, .f-productGallery img').forEach(img => {
      if (img.src && !img.src.includes('placeholder')) {
        data.images.push(img.src);
      }
    });

    return data;
  }

  function extractShopifyData() {
    const data = {
      title: '',
      price: 0,
      currency: 'EUR',
      description: '',
      images: [],
      variants: []
    };

    // Try JSON-LD first
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of jsonLdScripts) {
      try {
        const parsed = JSON.parse(script.textContent);
        const product = parsed['@type'] === 'Product' ? parsed : 
                       parsed['@graph']?.find(i => i['@type'] === 'Product');
        if (product) {
          data.title = product.name || '';
          data.description = product.description || '';
          if (product.offers) {
            const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
            data.price = parseFloat(offer.price) || 0;
            data.currency = offer.priceCurrency || 'EUR';
          }
          if (product.image) {
            data.images = Array.isArray(product.image) ? product.image : [product.image];
          }
          break;
        }
      } catch (e) {}
    }

    // Fallback to DOM
    if (!data.title) {
      data.title = document.querySelector('.product-title, .product__title, h1')?.textContent?.trim() || '';
    }

    return data;
  }

  function extractGenericData() {
    const data = {
      title: document.querySelector('h1, .product-title, [class*="title"]')?.textContent?.trim() || document.title,
      price: 0,
      currency: 'EUR',
      description: '',
      images: []
    };

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) data.title = ogTitle.content;

    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) data.images.push(ogImage.content);

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) data.description = ogDescription.content;

    const priceElements = document.querySelectorAll('[class*="price"]');
    for (const el of priceElements) {
      const priceMatch = el.textContent?.match(/[\d,.]+/);
      if (priceMatch) {
        data.price = parseFloat(priceMatch[0].replace(',', '.'));
        break;
      }
    }

    return data;
  }

  // ============================================
  // UI CREATION - PROFESSIONAL v4.3.16
  // Inspired by Fnac, Cdiscount, eBay, AliExpress
  // ============================================
  function addStyles() {
    if (document.getElementById('shopopti-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'shopopti-styles';
    style.textContent = `
      @keyframes shopoptiSpin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes shopoptiPulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.85; transform: scale(0.98); }
      }
      @keyframes shopoptiSlideIn {
        from { transform: translateX(120%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes shopoptiFadeIn {
        from { opacity: 0; transform: scale(0.95) translateY(8px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      @keyframes shopoptiShake {
        0%, 100% { transform: translateX(0); }
        20%, 60% { transform: translateX(-4px); }
        40%, 80% { transform: translateX(4px); }
      }
      @keyframes shopoptiBounce {
        0%, 100% { transform: scale(1); }
        30% { transform: scale(1.08); }
        60% { transform: scale(0.98); }
      }
      @keyframes shopoptiCounterPop {
        0% { transform: scale(1); }
        50% { transform: scale(1.25); }
        100% { transform: scale(1); }
      }
      
      /* ==========================================
         MAIN IMPORT BUTTON - Cdiscount Style
         ========================================== */
      #shopopti-import-btn {
        position: fixed !important;
        bottom: 24px !important;
        right: 24px !important;
        z-index: 2147483647 !important;
        padding: 14px 24px !important;
        background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #7c3aed 100%) !important;
        background-size: 200% 200% !important;
        color: white !important;
        border: none !important;
        border-radius: 50px !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif !important;
        font-size: 14px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 10px !important;
        box-shadow: 0 4px 20px rgba(124, 58, 237, 0.45), 0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.15) !important;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        animation: shopoptiFadeIn 0.4s ease !important;
        letter-spacing: 0.3px !important;
        min-width: 220px !important;
        white-space: nowrap !important;
        text-shadow: 0 1px 2px rgba(0,0,0,0.12) !important;
      }
      #shopopti-import-btn:hover {
        transform: translateY(-3px) scale(1.02) !important;
        box-shadow: 0 8px 30px rgba(124, 58, 237, 0.55), 0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2) !important;
        background-position: 100% 0 !important;
      }
      #shopopti-import-btn:active {
        transform: scale(0.98) !important;
      }
      #shopopti-import-btn.loading {
        opacity: 0.9 !important;
        cursor: wait !important;
        animation: shopoptiPulse 1.5s ease-in-out infinite !important;
      }
      #shopopti-import-btn.success {
        background: linear-gradient(135deg, #10b981 0%, #34d399 50%, #10b981 100%) !important;
        animation: shopoptiBounce 0.5s ease !important;
      }
      #shopopti-import-btn.error {
        background: linear-gradient(135deg, #ef4444 0%, #f87171 50%, #ef4444 100%) !important;
        animation: shopoptiShake 0.4s ease !important;
      }
      #shopopti-import-btn:disabled {
        pointer-events: none !important;
      }
      
      /* ==========================================
         BULK IMPORT BUTTON - Fnac/eBay Style
         ========================================== */
      #shopopti-bulk-btn {
        position: fixed !important;
        bottom: 24px !important;
        right: 24px !important;
        z-index: 2147483647 !important;
        padding: 12px 20px 12px 18px !important;
        background: linear-gradient(135deg, #10b981 0%, #34d399 100%) !important;
        color: white !important;
        border: none !important;
        border-radius: 50px !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif !important;
        font-size: 14px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        box-shadow: 0 4px 20px rgba(16, 185, 129, 0.45), 0 2px 8px rgba(0,0,0,0.12) !important;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        animation: shopoptiFadeIn 0.4s ease !important;
        white-space: nowrap !important;
        text-shadow: 0 1px 2px rgba(0,0,0,0.1) !important;
      }
      #shopopti-bulk-btn:hover {
        transform: translateY(-3px) scale(1.03) !important;
        box-shadow: 0 8px 30px rgba(16, 185, 129, 0.55), 0 4px 12px rgba(0,0,0,0.15) !important;
      }
      #shopopti-bulk-btn.loading {
        opacity: 0.85 !important;
        cursor: wait !important;
      }
      #shopopti-bulk-btn.success {
        background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%) !important;
      }
      .shopopti-bulk-counter {
        background: white !important;
        color: #059669 !important;
        padding: 4px 10px !important;
        border-radius: 20px !important;
        font-size: 13px !important;
        font-weight: 700 !important;
        min-width: 24px !important;
        text-align: center !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
        transition: transform 0.2s ease !important;
      }
      .shopopti-bulk-counter.updated {
        animation: shopoptiCounterPop 0.3s ease !important;
      }
      
      /* ==========================================
         LISTING BUTTONS - Compact Cards
         ========================================== */
      .shopopti-listing-btn {
        position: absolute !important;
        top: 8px !important;
        right: 8px !important;
        z-index: 999999 !important;
        padding: 8px 14px !important;
        background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%) !important;
        color: white !important;
        border: 2px solid rgba(255,255,255,0.9) !important;
        border-radius: 8px !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        font-size: 11px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        display: flex !important;
        align-items: center !important;
        gap: 5px !important;
        box-shadow: 0 2px 10px rgba(124, 58, 237, 0.45), 0 1px 4px rgba(0,0,0,0.15) !important;
        transition: all 0.2s ease !important;
        opacity: 1 !important;
        visibility: visible !important;
        animation: shopoptiFadeIn 0.3s ease !important;
        text-shadow: 0 1px 1px rgba(0,0,0,0.12) !important;
        white-space: nowrap !important;
      }
      .shopopti-listing-btn:hover {
        transform: scale(1.08) translateY(-2px) !important;
        box-shadow: 0 6px 20px rgba(124, 58, 237, 0.5), 0 2px 8px rgba(0,0,0,0.2) !important;
      }
      .shopopti-listing-btn.success {
        background: linear-gradient(135deg, #10b981 0%, #34d399 100%) !important;
        animation: shopoptiBounce 0.4s ease !important;
      }
      .shopopti-listing-btn.loading {
        opacity: 0.85 !important;
        cursor: wait !important;
      }
      .shopopti-listing-btn.selected {
        background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%) !important;
      }
      
      /* ==========================================
         TOAST NOTIFICATIONS - Professional
         ========================================== */
      .shopopti-toast {
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        padding: 14px 20px !important;
        border-radius: 12px !important;
        font-size: 14px !important;
        font-weight: 500 !important;
        color: white !important;
        z-index: 2147483647 !important;
        animation: shopoptiSlideIn 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important;
        max-width: 360px !important;
        display: flex !important;
        align-items: center !important;
        gap: 12px !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        box-shadow: 0 10px 40px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.15) !important;
        backdrop-filter: blur(8px) !important;
        border: 1px solid rgba(255,255,255,0.1) !important;
      }
      .shopopti-toast.success {
        background: linear-gradient(135deg, #10b981 0%, #34d399 100%) !important;
      }
      .shopopti-toast.error {
        background: linear-gradient(135deg, #ef4444 0%, #f87171 100%) !important;
      }
      .shopopti-toast.loading {
        background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%) !important;
      }
      .shopopti-toast.warning {
        background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%) !important;
      }
    `;
    document.head.appendChild(style);
  }

  function createImportButton() {
    const existing = document.getElementById('shopopti-import-btn');
    if (existing) existing.remove();

    const button = document.createElement('button');
    button.id = 'shopopti-import-btn';
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7,10 12,15 17,10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      <span>Importer dans ShopOpti+</span>
    `;

    button.addEventListener('click', handleImportClick);
    document.body.appendChild(button);
    console.log('[ShopOpti+] Import button created (v4.3.16 Pro)');
  }

  function updateButtonState(state, message) {
    const button = document.getElementById('shopopti-import-btn');
    if (!button) return;

    button.className = '';
    
    switch (state) {
      case 'loading':
        button.classList.add('loading');
        button.innerHTML = `
          <span style="width:16px;height:16px;border:2px solid white;border-top-color:transparent;border-radius:50%;animation:shopoptiSpin 1s linear infinite;"></span>
          <span>${message || 'Import en cours...'}</span>
        `;
        button.disabled = true;
        break;
      case 'success':
        button.classList.add('success');
        button.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20,6 9,17 4,12"/>
          </svg>
          <span>${message || 'Importé avec succès !'}</span>
        `;
        button.disabled = true;
        setTimeout(() => updateButtonState('idle'), 3000);
        break;
      case 'error':
        button.classList.add('error');
        button.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <span>${message || 'Erreur'}</span>
        `;
        button.disabled = false;
        setTimeout(() => updateButtonState('idle'), 4000);
        break;
      default:
        button.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7,10 12,15 17,10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span>Importer dans ShopOpti+</span>
        `;
        button.disabled = false;
    }
  }

  function showToast(message, type = 'loading') {
    const existing = document.querySelector('.shopopti-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `shopopti-toast ${type}`;
    
    let icon = '⏳';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), type === 'loading' ? 10000 : 3000);
  }

  // ============================================
  // IMPORT HANDLER
  // ============================================
  async function handleImportClick() {
    console.log('[ShopOpti+] Import clicked');
    
    if (!isChromeRuntimeAvailable()) {
      updateButtonState('error', 'Rechargez la page (F5)');
      return;
    }
    
    // Only allow on product pages for the “full import” flow
    if (!isProductPage()) {
      updateButtonState('error', 'Ouvrez une page produit (pas une liste)');
      return;
    }

    updateButtonState('loading', 'Import complet...');

    try {
      // Local extraction is best-effort only (some sites block/obfuscate DOM).
      // We always rely on backend scraping for the real import.
      const productData = (() => {
        try {
          return extractProductData();
        } catch (e) {
          return { source_url: window.location.href };
        }
      })();

      const url = productData?.source_url || window.location.href;

      // Full import: Product + Variants (server-side) + Reviews (page context)
      const response = await safeSendMessage({
        type: 'IMPORT_PRODUCT_WITH_REVIEWS',
        url,
        reviewLimit: 80
      });

      console.log('[ShopOpti+] Import response:', response);

      if (response?.success) {
        const variantCount = response.variantCount ?? response.product?.variantCount ?? 0;
        const reviewCount = response.reviews?.count ?? 0;
        updateButtonState('success', `Importé (Var: ${variantCount} | Avis: ${reviewCount})`);
      } else {
        throw new Error(response?.error || 'Échec de l\'import');
      }
    } catch (error) {
      console.error('[ShopOpti+] Import error:', error);
      // Never fail silently: provide actionable context.
      const msg = (error && typeof error.message === 'string' && error.message.trim())
        ? error.message
        : 'Erreur inconnue (ouvrez la console pour détails)';
      updateButtonState('error', msg);
    }
  }

  // ============================================
  // MESSAGE LISTENER
  // ============================================
  if (isChromeRuntimeAvailable()) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('[ShopOpti+] Message received:', message.type);
      
      switch (message.type) {
        case 'GET_PRODUCT_DATA':
          const data = extractProductData();
          sendResponse({ success: true, data });
          break;
          
        case 'PING':
          sendResponse({ success: true, version: CONFIG.VERSION });
          break;
          
        case 'TRIGGER_IMPORT':
          handleImportClick();
          sendResponse({ success: true });
          break;
          
        case 'GET_ALL_PRODUCT_URLS':
          const urls = getAllProductUrls();
          sendResponse({ success: true, urls });
          break;
          
        case 'SHOW_REVIEWS_PANEL':
          showReviewsPanel(message.autoExtract);
          sendResponse({ success: true });
          break;
          
        case 'EXTRACT_REVIEWS':
          const reviews = extractReviewsFromDOM(message.config);
          sendResponse({ success: true, reviews, count: reviews.length });
          break;
          
        case 'EXTRACT_PRODUCT_AND_REVIEWS':
          const productData = extractProductData();
          const productReviews = extractReviewsFromDOM({ maxReviews: message.maxReviews || 50 });
          sendResponse({ 
            success: true, 
            product: productData, 
            reviews: productReviews,
            productCount: 1,
            reviewCount: productReviews.length 
          });
          break;
          
        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
      
      return true;
    });
  }

  // Get all product URLs from current page
  function getAllProductUrls() {
    const platform = detectPlatform();
    const urls = [];
    
    const linkSelectors = {
      amazon: ['a[href*="/dp/"]', 'a[href*="/gp/product/"]'],
      aliexpress: ['a[href*="/item/"]', 'a[href*="/i/"]'],
      ebay: ['a[href*="/itm/"]'],
      temu: ['a[href*="-g-"]'],
      shopify: ['a[href*="/products/"]'],
      etsy: ['a[href*="/listing/"]'],
      cdiscount: ['a[href*="/f-"]', 'a[href*="/fp/"]'],
      fnac: ['a[href*="/a"]'],
      walmart: ['a[href*="/ip/"]'],
      shein: ['a[href*="-p-"]']
    };
    
    const selectors = linkSelectors[platform] || [];
    const seen = new Set();
    
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(link => {
        const url = link.href;
        if (url && !seen.has(url) && !url.includes('#') && !url.includes('review')) {
          seen.add(url);
          urls.push(url);
        }
      });
    });
    
    console.log(`[ShopOpti+] Found ${urls.length} product URLs`);
    return urls.slice(0, 50);
  }
  
  // Show reviews extraction panel
  function showReviewsPanel(autoExtract = false) {
    let panel = document.getElementById('shopopti-reviews-panel');
    if (panel) {
      panel.remove();
      return;
    }
    
    panel = document.createElement('div');
    panel.id = 'shopopti-reviews-panel';
    panel.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      width: 360px;
      max-height: 80vh;
      background: linear-gradient(135deg, #0f172a, #1e293b);
      border: 1px solid rgba(0, 212, 255, 0.3);
      border-radius: 16px;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #f8fafc;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
      overflow: hidden;
    `;
    
    panel.innerHTML = `
      <div style="padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 20px;">⭐</span>
            <span style="font-weight: 600;">ShopOpti+ Avis</span>
          </div>
          <button id="shopopti-close-reviews" style="background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 20px;">&times;</button>
        </div>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 8px;">Extraire et importer les avis clients</p>
      </div>
      <div style="padding: 16px;">
        <div style="display: flex; gap: 8px; margin-bottom: 16px;">
          <button id="shopopti-extract-reviews" style="flex: 1; padding: 12px; background: linear-gradient(135deg, #00d4ff, #7c3aed); color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer;">
            📥 Extraire les avis
          </button>
        </div>
        <div id="shopopti-reviews-list" style="max-height: 400px; overflow-y: auto;">
          <p style="text-align: center; color: #64748b; padding: 20px;">Cliquez sur "Extraire" pour détecter les avis</p>
        </div>
        <div id="shopopti-reviews-actions" style="display: none; margin-top: 12px;">
          <button id="shopopti-import-reviews" style="width: 100%; padding: 12px; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer;">
            ✅ Importer vers ShopOpti
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(panel);
    
    document.getElementById('shopopti-close-reviews').addEventListener('click', () => panel.remove());
    document.getElementById('shopopti-extract-reviews').addEventListener('click', () => handleExtractReviews(panel));
    
    if (autoExtract) {
      setTimeout(() => handleExtractReviews(panel), 500);
    }
  }
  
  function handleExtractReviews(panel) {
    const listEl = panel.querySelector('#shopopti-reviews-list');
    const actionsEl = panel.querySelector('#shopopti-reviews-actions');
    
    listEl.innerHTML = '<p style="text-align: center; color: #00d4ff; padding: 20px;">⏳ Extraction en cours...</p>';
    
    setTimeout(() => {
      const reviews = extractReviewsFromDOM({ maxReviews: 50 });
      
      if (reviews.length === 0) {
        listEl.innerHTML = '<p style="text-align: center; color: #f59e0b; padding: 20px;">⚠️ Aucun avis trouvé sur cette page</p>';
        return;
      }
      
      listEl.innerHTML = reviews.slice(0, 10).map((r, i) => `
        <div style="padding: 12px; background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.05);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-weight: 500; font-size: 13px;">${r.author || 'Anonymous'}</span>
            <span style="color: #fbbf24; font-size: 12px;">${'⭐'.repeat(r.rating || 5)}</span>
          </div>
          <p style="font-size: 12px; color: #94a3b8; line-height: 1.4;">${(r.content || '').substring(0, 120)}...</p>
        </div>
      `).join('') + `<p style="text-align: center; color: #10b981; margin-top: 12px;">✅ ${reviews.length} avis détectés</p>`;
      
      actionsEl.style.display = 'block';
      window.__shopoptiExtractedReviews = reviews;
      
      document.getElementById('shopopti-import-reviews').addEventListener('click', async () => {
        try {
          const response = await safeSendMessage({
            type: 'IMPORT_REVIEWS',
            config: { reviews: window.__shopoptiExtractedReviews }
          });
          
          if (response?.success) {
            listEl.innerHTML = '<p style="text-align: center; color: #10b981; padding: 20px;">✅ Avis importés avec succès!</p>';
            actionsEl.style.display = 'none';
          }
        } catch (error) {
          listEl.innerHTML = '<p style="text-align: center; color: #ef4444; padding: 20px;">❌ Erreur: ' + error.message + '</p>';
        }
      });
    }, 1000);
  }
  
  // DOM-based review extraction - Enhanced for all platforms v4.3.16
  function extractReviewsFromDOM(config) {
    const reviews = [];
    const maxReviews = config?.maxReviews || 50;
    const platform = detectPlatform();
    
    console.log('[ShopOpti+] Extracting reviews for platform:', platform);
    
    if (platform === 'amazon') {
      const reviewElements = document.querySelectorAll('[data-hook="review"], .review, .a-section.review, #cm_cr-review_list .review');
      
      reviewElements.forEach((element, index) => {
        if (index >= maxReviews) return;
        
        let rating = 5;
        const ratingEl = element.querySelector('[data-hook="review-star-rating"] .a-icon-alt, .a-icon-star .a-icon-alt, .review-rating .a-icon-alt');
        if (ratingEl) {
          const match = ratingEl.textContent?.match(/(\d[.,]?\d?)/);
          if (match) rating = parseFloat(match[1].replace(',', '.'));
        }
        
        const contentEl = element.querySelector('[data-hook="review-body"] span, .review-text-content span, .review-text span');
        const content = contentEl?.textContent?.trim() || '';
        
        const authorEl = element.querySelector('[data-hook="review-author"], .a-profile-name');
        const author = authorEl?.textContent?.trim() || 'Amazon Customer';
        
        const dateEl = element.querySelector('[data-hook="review-date"]');
        const dateText = dateEl?.textContent?.trim() || '';
        let date = null;
        const dateMatch = dateText.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
        if (dateMatch) {
          date = new Date(`${dateMatch[2]} ${dateMatch[1]}, ${dateMatch[3]}`).toISOString();
        }
        
        const titleEl = element.querySelector('[data-hook="review-title"] span:not(.a-icon-alt), .review-title span');
        const title = titleEl?.textContent?.trim() || '';
        
        const verified = !!element.querySelector('[data-hook="avp-badge"], .avp-badge');
        
        const images = [];
        element.querySelectorAll('[data-hook="review-image-tile"] img, .review-image-tile img').forEach(img => {
          if (img.src && !img.src.includes('sprite') && !img.src.includes('transparent')) {
            images.push(img.src.replace(/\._[A-Z]{2}\d+_\./, '._SL500_.'));
          }
        });
        
        let helpfulVotes = 0;
        const helpfulEl = element.querySelector('[data-hook="helpful-vote-statement"]');
        if (helpfulEl) {
          const helpfulMatch = helpfulEl.textContent?.match(/(\d+)/);
          if (helpfulMatch) helpfulVotes = parseInt(helpfulMatch[1]);
        }
        
        if (content.length > 10) {
          reviews.push({ 
            rating, 
            content, 
            title,
            author, 
            date, 
            verified, 
            images, 
            helpful_votes: helpfulVotes,
            platform: 'amazon' 
          });
        }
      });
      
    } else if (platform === 'aliexpress') {
      const reviewElements = document.querySelectorAll('.feedback-item, [class*="review-item"], [class*="feedback"], .buyer-review');
      
      reviewElements.forEach((element, index) => {
        if (index >= maxReviews) return;
        
        let rating = 5;
        const starContainer = element.querySelector('[class*="star-view"], .star-view');
        if (starContainer) {
          const fullStars = starContainer.querySelectorAll('span[class*="full"], .star-active, [class*="starFull"]');
          if (fullStars.length > 0) rating = Math.min(5, fullStars.length);
        }
        
        const contentEl = element.querySelector('[class*="buyer-feedback"], [class*="review-content"], .feedback-text');
        const content = contentEl?.textContent?.trim() || '';
        
        const authorEl = element.querySelector('[class*="user-name"], [class*="buyer-name"]');
        const author = authorEl?.textContent?.trim() || 'AliExpress Buyer';
        
        const dateEl = element.querySelector('[class*="feedback-time"], [class*="review-date"]');
        const date = dateEl?.textContent?.trim() || null;
        
        const countryEl = element.querySelector('[class*="user-country"], [class*="country"]');
        const country = countryEl?.textContent?.trim() || null;
        
        const variantEl = element.querySelector('[class*="sku-info"], [class*="specs"]');
        const variant = variantEl?.textContent?.trim() || null;
        
        const images = [];
        element.querySelectorAll('img[class*="pic"], img[src*="feedback"], [class*="review-image"] img').forEach(img => {
          if (img.src && !img.src.includes('placeholder') && !img.src.includes('icon')) {
            let src = img.src;
            if (src.startsWith('//')) src = 'https:' + src;
            images.push(src.replace(/_\d+x\d+\./g, '.'));
          }
        });
        
        if (content.length > 5) {
          reviews.push({ 
            rating, 
            content, 
            author, 
            date,
            country,
            variant,
            images, 
            platform: 'aliexpress' 
          });
        }
      });
      
    } else if (platform === 'shopify') {
      const reviewSelectors = [
        '.jdgm-rev',
        '.loox-review',
        '.yotpo-review',
        '.spr-review',
        '.stamped-review',
        '.product-review',
        '[data-review-id]'
      ];
      
      let reviewElements = [];
      for (const selector of reviewSelectors) {
        const els = document.querySelectorAll(selector);
        if (els.length > 0) {
          reviewElements = els;
          break;
        }
      }
      
      reviewElements.forEach((element, index) => {
        if (index >= maxReviews) return;
        
        let rating = 5;
        const starCount = element.querySelectorAll('.jdgm-star.jdgm--on, [class*="filled-star"], .star-on, [class*="star"][class*="full"]').length;
        if (starCount > 0) rating = Math.min(5, starCount);
        
        const contentEl = element.querySelector('.jdgm-rev__body, .loox-review-body, .yotpo-review-content, .spr-review-content-body, [class*="review-text"], [class*="review-body"]');
        const content = contentEl?.textContent?.trim() || '';
        
        const authorEl = element.querySelector('.jdgm-rev__author, .loox-review-author, .yotpo-user-name, .spr-review-header-byline, [class*="author"]');
        const author = authorEl?.textContent?.trim() || 'Customer';
        
        const dateEl = element.querySelector('.jdgm-rev__timestamp, .loox-review-date, .yotpo-review-date, .spr-review-header-date, [class*="date"]');
        const date = dateEl?.textContent?.trim() || null;
        
        const images = [];
        element.querySelectorAll('.jdgm-rev__media img, .loox-review-image img, [class*="review-image"] img').forEach(img => {
          if (img.src && !img.src.includes('placeholder')) {
            images.push(img.src);
          }
        });
        
        if (content.length > 10) {
          reviews.push({ 
            rating, 
            content, 
            author,
            date, 
            images, 
            platform: 'shopify' 
          });
        }
      });
      
    } else if (platform === 'temu') {
      const reviewElements = document.querySelectorAll('[class*="review-item"], [class*="ReviewItem"], [class*="comment-item"]');
      
      reviewElements.forEach((element, index) => {
        if (index >= maxReviews) return;
        
        let rating = 5;
        const ratingText = element.querySelector('[class*="rating"], [class*="star"]')?.textContent;
        if (ratingText) {
          const match = ratingText.match(/(\d)/);
          if (match) rating = parseInt(match[1]);
        }
        
        const contentEl = element.querySelector('[class*="content"], [class*="text"]');
        const content = contentEl?.textContent?.trim() || '';
        
        const authorEl = element.querySelector('[class*="user"], [class*="name"]');
        const author = authorEl?.textContent?.trim() || 'Temu Buyer';
        
        const images = [];
        element.querySelectorAll('img[src*="img.kwcdn"]').forEach(img => {
          images.push(img.src);
        });
        
        if (content.length > 5) {
          reviews.push({ rating, content, author, images, platform: 'temu' });
        }
      });
      
    } else if (platform === 'ebay') {
      const reviewElements = document.querySelectorAll('.review-item, [data-testid="review"]');
      
      reviewElements.forEach((element, index) => {
        if (index >= maxReviews) return;
        
        let rating = 5;
        const starsEl = element.querySelector('[class*="star"]');
        if (starsEl) {
          const fullStars = starsEl.querySelectorAll('[class*="full"]').length;
          if (fullStars > 0) rating = fullStars;
        }
        
        const contentEl = element.querySelector('[class*="review-text"], [class*="content"]');
        const content = contentEl?.textContent?.trim() || '';
        
        const authorEl = element.querySelector('[class*="reviewer"], [class*="author"]');
        const author = authorEl?.textContent?.trim() || 'eBay Buyer';
        
        if (content.length > 10) {
          reviews.push({ rating, content, author, platform: 'ebay' });
        }
      });
      
    } else if (platform === 'etsy') {
      const reviewElements = document.querySelectorAll('.review-item, [data-review-id]');
      
      reviewElements.forEach((element, index) => {
        if (index >= maxReviews) return;
        
        let rating = 5;
        const starsInput = element.querySelector('input[name="rating"]');
        if (starsInput) rating = parseInt(starsInput.value) || 5;
        
        const contentEl = element.querySelector('[class*="review-content"], p');
        const content = contentEl?.textContent?.trim() || '';
        
        const authorEl = element.querySelector('[class*="reviewer-name"], a[href*="/people/"]');
        const author = authorEl?.textContent?.trim() || 'Etsy Buyer';
        
        const images = [];
        element.querySelectorAll('img[src*="etsystatic"]').forEach(img => {
          if (!img.src.includes('icon')) images.push(img.src);
        });
        
        if (content.length > 10) {
          reviews.push({ rating, content, author, images, platform: 'etsy' });
        }
      });
      
    } else {
      // Generic extraction for unknown platforms
      const selectors = [
        '[data-hook="review"]', 
        '.review-item', 
        '.review', 
        '.customer-review', 
        '[class*="review-card"]',
        '[class*="ReviewCard"]',
        '.feedback-item',
        '[class*="testimonial"]'
      ];
      let reviewElements = [];
      
      for (const selector of selectors) {
        reviewElements = document.querySelectorAll(selector);
        if (reviewElements.length > 0) break;
      }
      
      reviewElements.forEach((element, index) => {
        if (index >= maxReviews) return;
        
        const contentEl = element.querySelector('[class*="content"], [class*="text"], [class*="body"], p');
        const content = contentEl?.textContent?.trim() || '';
        
        let rating = 5;
        const starEls = element.querySelectorAll('[class*="star"][class*="full"], [class*="star"][class*="active"], .star-filled');
        if (starEls.length > 0) rating = Math.min(5, starEls.length);
        
        if (content.length > 10) {
          reviews.push({
            rating,
            content,
            author: element.querySelector('[class*="author"], [class*="name"], [class*="user"]')?.textContent?.trim() || 'Anonymous',
            platform: platform
          });
        }
      });
    }
    
    console.log(`[ShopOpti+] Extracted ${reviews.length} reviews`);
    return reviews;
  }

  // ============================================
  // SPA NAVIGATION DETECTION
  // ============================================
  let lastUrl = window.location.href;
  
  function checkUrlChange() {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      console.log('[ShopOpti+] URL changed, re-initializing...');
      setTimeout(init, 500);
    }
  }

  const urlObserver = new MutationObserver(checkUrlChange);
  urlObserver.observe(document.body, { childList: true, subtree: true });

  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    setTimeout(checkUrlChange, 100);
  };
  
  history.replaceState = function(...args) {
    originalReplaceState.apply(this, args);
    setTimeout(checkUrlChange, 100);
  };

  window.addEventListener('popstate', () => setTimeout(checkUrlChange, 100));

  // ============================================
  // LISTING PAGE BUTTONS - EXTENDED SELECTORS v4.3.16 ULTRA
  // ============================================
  function createListingButtons() {
    const platform = detectPlatform();
    
    // ULTRA Extended selectors for ALL 25+ platforms
    const selectors = {
      amazon: [
        '.zg-grid-general-faceout',
        '.zg-item-immersion',
        'div[id^="gridItemRoot"]',
        '.p13n-sc-uncoverable-faceout',
        '.p13n-asin',
        '[data-component-type="s-search-result"]',
        '.s-result-item[data-asin]',
        '.sg-col-inner .s-result-item',
        '.octopus-pc-item',
        '.a-carousel-card',
        '[data-asin]:not([data-asin=""])',
        '.s-main-slot .s-result-item',
        '.AdHolder',
        '[data-index]'
      ],
      aliexpress: [
        '.list-item',
        '.product-item',
        '.search-item-card-wrapper-gallery',
        '[data-widget-cid*="product"]',
        '.product-snippet',
        '[class*="product-card"]',
        '[class*="ProductCard"]',
        '[class*="SearchResultList"] > div',
        '[class*="manhattan--container"]',
        '.JIIxO'
      ],
      temu: [
        '[data-testid="goods-item"]',
        '.goods-item',
        '[class*="GoodsItem"]',
        '[data-goods-id]',
        '[class*="productCard"]',
        '[class*="_2BPmm"]',
        '.ProductList__item'
      ],
      ebay: [
        '.s-item',
        '.srp-river-result',
        '[data-testid="listing-card"]',
        '.srp-results .s-item',
        '[data-testid="item-card"]',
        '.b-list__items_nofooter li',
        '[data-viewport]'
      ],
      cdiscount: [
        '.prdtBloc',
        '.c-productCard',
        '[data-product-id]',
        '.prdtBImg',
        '.c-product',
        '.product-item',
        '.lpProduct',
        '[class*="ProductCard"]'
      ],
      shein: [
        '.product-list__item',
        '.S-product-item',
        '[data-expose-id]',
        '.goods-item',
        '[class*="productCard"]',
        '.product-item',
        '[class*="productItem"]'
      ],
      walmart: [
        '.search-result-gridview-item',
        '[data-item-id]',
        '.product-card',
        '[data-testid="list-view"]',
        '[data-automation-id="product"]',
        '.mb1.ph1'
      ],
      etsy: [
        '.v2-listing-card',
        '.listing-link',
        '[data-listing-id]',
        '.js-merch-stash-check-listing',
        '.wt-grid__item-xs-6'
      ],
      fnac: [
        '.Article-item',
        '.ProductCard',
        '.product-item',
        '[data-product]',
        '.Carousel-item',
        '.f-nCarousel__item'
      ],
      rakuten: [
        '.product-card',
        '.search-product-card',
        '[data-product-id]',
        '.dls-product-card'
      ],
      target: [
        '[data-test="product-grid"] div',
        '.ProductCardWrapper',
        '[data-test="product-card"]'
      ],
      bestbuy: [
        '.sku-item',
        '[data-sku-id]',
        '.product-item'
      ],
      wayfair: [
        '[data-enzyme-id="ProductCard"]',
        '.ProductCard',
        '.browse-product'
      ],
      newegg: [
        '.item-cell',
        '.item-container'
      ],
      zalando: [
        '[data-testid="productTile"]',
        '.cat_articleContain'
      ],
      asos: [
        '.productTile',
        '[data-auto-id="productTile"]'
      ],
      manomano: [
        '.ProductCard',
        '[data-product-id]'
      ],
      darty: [
        '.product-tile',
        '.product-item'
      ],
      boulanger: [
        '.product-item',
        '[data-product-code]'
      ]
    };
    
    const platformSelectors = selectors[platform];
    if (!platformSelectors) return;
    
    const productElements = document.querySelectorAll(platformSelectors.join(', '));
    console.log(`[ShopOpti+] Found ${productElements.length} products on listing page (${platform})`);
    
    let addedCount = 0;
    productElements.forEach((element) => {
      if (element.querySelector('.shopopti-listing-btn')) return;
      
      let url = null;
      
      // Platform-specific URL extraction
      if (platform === 'amazon') {
        const linkSelectors = [
          'a.a-link-normal[href*="/dp/"]',
          'a[href*="/dp/"]',
          'a[href*="/gp/product/"]',
          'h2 a'
        ];
        
        for (const selector of linkSelectors) {
          const link = element.querySelector(selector);
          if (link?.href && (link.href.includes('/dp/') || link.href.includes('/gp/product/'))) {
            url = link.href;
            break;
          }
        }
        
        if (!url) {
          const asin = element.getAttribute('data-asin') || element.querySelector('[data-asin]')?.getAttribute('data-asin');
          if (asin) {
            url = `https://www.amazon.${window.location.hostname.split('.').pop()}/dp/${asin}`;
          }
        }
      } else if (platform === 'cdiscount') {
        const link = element.querySelector('a[href*="/f-"], a[href*="/fp/"], a[href*="/dp/"]');
        url = link?.href;
      } else if (platform === 'ebay') {
        const link = element.querySelector('a[href*="/itm/"]');
        url = link?.href;
      } else if (platform === 'etsy') {
        const link = element.querySelector('a[href*="/listing/"]');
        url = link?.href;
      } else if (platform === 'shein') {
        const link = element.querySelector('a[href*="-p-"]');
        url = link?.href;
      } else if (platform === 'walmart') {
        const link = element.querySelector('a[href*="/ip/"]');
        url = link?.href;
      } else if (platform === 'fnac') {
        const link = element.querySelector('a[href*="/a"]');
        url = link?.href;
      } else {
        const link = element.querySelector('a[href*="/item/"], a[href*="/product"], a[href]');
        url = link?.href;
      }
      
      if (!url) return;
      
      const computedStyle = window.getComputedStyle(element);
      if (computedStyle.position === 'static') {
        element.style.position = 'relative';
      }
      
      const btn = document.createElement('button');
      btn.className = 'shopopti-listing-btn';
      btn.dataset.url = url;
      btn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7,10 12,15 17,10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <span>Import</span>
      `;
      
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        btn.classList.add('loading');
        btn.innerHTML = `<span style="width:10px;height:10px;border:2px solid white;border-top-color:transparent;border-radius:50%;animation:shopoptiSpin 1s linear infinite;"></span>`;
        
        try {
          if (!isChromeRuntimeAvailable()) {
            throw new Error('Extension déconnectée.');
          }
          
          const response = await safeSendMessage({
            type: 'IMPORT_FROM_URL',
            url: url
          });
          
          if (response?.success) {
            btn.classList.remove('loading');
            btn.classList.add('success');
            btn.innerHTML = `
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
              <span>OK!</span>
            `;
          } else {
            throw new Error(response?.error || 'Échec');
          }
        } catch (error) {
          console.error('[ShopOpti+] Import error:', error);
          btn.classList.remove('loading');
          btn.innerHTML = `<span>❌</span>`;
          
          setTimeout(() => {
            btn.innerHTML = `
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span>Import</span>
            `;
          }, 2000);
        }
      });
      
      element.appendChild(btn);
      addedCount++;
    });
    
    if (addedCount > 0) {
      console.log(`[ShopOpti+] Added ${addedCount} import buttons`);
      const counter = document.querySelector('.shopopti-bulk-counter');
      if (counter) {
        const allButtons = document.querySelectorAll('.shopopti-listing-btn');
        counter.textContent = allButtons.length;
      }
    }
  }

  // ============================================
  // BULK IMPORT BUTTON - Fnac/eBay Professional Style
  // ============================================
  function createBulkImportButton() {
    if (document.getElementById('shopopti-bulk-btn')) return;
    
    const button = document.createElement('button');
    button.id = 'shopopti-bulk-btn';
    button.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
      </svg>
      <span>Import en masse</span>
      <span class="shopopti-bulk-counter">0</span>
    `;
    
    // Update counter when products are found
    function updateCounter() {
      const allButtons = document.querySelectorAll('.shopopti-listing-btn');
      const counter = button.querySelector('.shopopti-bulk-counter');
      const newCount = allButtons.length;
      const oldCount = parseInt(counter.textContent) || 0;
      
      if (newCount !== oldCount) {
        counter.textContent = newCount;
        counter.classList.add('updated');
        setTimeout(() => counter.classList.remove('updated'), 300);
      }
    }
    
    // Observe DOM changes to update counter
    const counterObserver = new MutationObserver(() => updateCounter());
    setTimeout(() => {
      counterObserver.observe(document.body, { childList: true, subtree: true });
      updateCounter();
    }, 500);
    
    button.addEventListener('click', async () => {
      const allButtons = document.querySelectorAll('.shopopti-listing-btn:not(.success)');
      const totalCount = allButtons.length;
      
      if (totalCount === 0) {
        showToast('Aucun produit à importer', 'warning');
        return;
      }
      
      // Confirm for large imports
      if (totalCount > 10) {
        if (!confirm(`Importer ${totalCount} produits ? Cette opération peut prendre quelques minutes.`)) {
          return;
        }
      }
      
      button.classList.add('loading');
      button.querySelector('span:not(.shopopti-bulk-counter)').textContent = 'Import en cours...';
      
      showToast(`Import de ${totalCount} produits en cours...`, 'loading');
      
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < allButtons.length; i++) {
        const btn = allButtons[i];
        btn.click();
        
        // Wait for import to complete
        await new Promise(r => setTimeout(r, 1800));
        
        if (btn.classList.contains('success')) {
          successCount++;
        } else {
          errorCount++;
        }
        
        // Update counter during import
        const counter = button.querySelector('.shopopti-bulk-counter');
        counter.textContent = `${successCount}/${totalCount}`;
      }
      
      button.classList.remove('loading');
      button.querySelector('span:not(.shopopti-bulk-counter)').textContent = 'Import en masse';
      
      if (successCount === totalCount) {
        button.classList.add('success');
        showToast(`✅ ${successCount} produits importés avec succès !`, 'success');
      } else if (successCount > 0) {
        showToast(`${successCount}/${totalCount} produits importés (${errorCount} erreurs)`, 'warning');
      } else {
        showToast(`❌ Échec de l'import (${errorCount} erreurs)`, 'error');
      }
      
      // Reset button after delay
      setTimeout(() => {
        button.classList.remove('success');
        updateCounter();
      }, 3000);
    });
    
    document.body.appendChild(button);
    console.log('[ShopOpti+] Bulk import button created (v4.3.16 Pro - Fnac/eBay style)');
  }

  // ============================================
  // INITIALIZATION v4.3.16 - ULTRA ROBUST
  // ============================================
  function init() {
    const platform = detectPlatform();
    console.log('[ShopOpti+] v4.3.16 ULTRA PRO - Detected platform:', platform);

    if (!CONFIG.SUPPORTED_PLATFORMS.includes(platform) && platform !== 'unknown') {
      console.log('[ShopOpti+] Platform not supported');
      return;
    }

    addStyles();

    if (isProductPage()) {
      console.log('[ShopOpti+] Product page detected - Creating import button');
      createImportButton();
    } else if (isListingPage()) {
      console.log('[ShopOpti+] Listing page detected - Creating listing buttons');
      createBulkImportButton();
      createListingButtons();
      
      // Watch for dynamically loaded products with faster detection
      const observer = new MutationObserver(
        debounce(() => {
          createListingButtons();
        }, 300) // Faster response
      );
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      console.log('[ShopOpti+] Page type not detected, checking for product cards...');
      // Try to detect listing page by product cards with multiple retries
      let retryCount = 0;
      const maxRetries = 10;
      
      const checkInterval = setInterval(() => {
        retryCount++;
        
        if (isListingPage()) {
          console.log(`[ShopOpti+] Listing page detected on retry ${retryCount}`);
          clearInterval(checkInterval);
          createBulkImportButton();
          createListingButtons();
          
          const observer = new MutationObserver(
            debounce(() => createListingButtons(), 300)
          );
          observer.observe(document.body, { childList: true, subtree: true });
        } else if (isProductPage()) {
          console.log(`[ShopOpti+] Product page detected on retry ${retryCount}`);
          clearInterval(checkInterval);
          createImportButton();
        } else if (retryCount >= maxRetries) {
          console.log('[ShopOpti+] Max retries reached, stopping detection');
          clearInterval(checkInterval);
        }
      }, 1000);
    }
  }

  // ============================================
  // MESSAGE LISTENER FOR POPUP COMMUNICATION
  // ============================================
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'PING') {
      sendResponse({ success: true, version: CONFIG.VERSION });
      return true;
    }
    
    if (message.type === 'GET_PRODUCT_DATA') {
      try {
        if (!isProductPage()) {
          sendResponse({ success: false, error: 'Not a product page' });
          return true;
        }
        
        const productData = extractProductData();
        sendResponse({ 
          success: true, 
          product: {
            title: productData.title || productData.name,
            price: productData.price,
            image: productData.images?.[0] || productData.image,
            images: productData.images,
            description: productData.description,
            sku: productData.sku,
            variants: productData.variants,
            platform: productData.platform,
            url: window.location.href
          }
        });
      } catch (error) {
        console.error('[ShopOpti+] Error extracting product data:', error);
        sendResponse({ success: false, error: error.message });
      }
      return true;
    }
    
    return false;
  });

  // Wait for DOM - immediate init with backup
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 200));
  } else {
    setTimeout(init, 200); // Faster init
  }

  // Reinit on page load for dynamic content
  window.addEventListener('load', () => setTimeout(init, 500));

})();
