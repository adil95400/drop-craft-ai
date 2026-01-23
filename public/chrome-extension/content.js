// ============================================
// ShopOpti+ Chrome Extension - Content Script v4.3.10
// Professional Dropshipping Extension - 100% CSP-SAFE
// NO SCRIPT INJECTION - Pure Content Script Mode
// Works on Amazon, AliExpress, and all strict CSP sites
// ============================================

(function () {
  'use strict';

  // Prevent multiple injections
  if (window.__shopOptiCSVersion === '4.3.11') return;
  window.__shopOptiCSVersion = '4.3.11';

  console.log('[ShopOpti+] Content script v4.3.11 initializing (CSP-SAFE mode)...');

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
  // CONFIGURATION
  // ============================================
  const CONFIG = {
    VERSION: '4.3.11',
    BRAND: 'ShopOpti+',
    SUPPORTED_PLATFORMS: ['amazon', 'aliexpress', 'alibaba', 'temu', 'shein', 'shopify', 'ebay', 'etsy', 'walmart', 'cjdropshipping', 'banggood', 'dhgate', 'wish', 'cdiscount', 'fnac', 'rakuten']
  };

  // ============================================
  // PLATFORM DETECTION
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
    
    // Shopify detection
    if (document.querySelector('meta[name="shopify-checkout-api-token"]') ||
        document.querySelector('link[href*="cdn.shopify.com"]') ||
        hostname.includes('myshopify') ||
        window.Shopify) {
      return 'shopify';
    }
    
    return 'unknown';
  }

  function isProductPage() {
    const url = window.location.href;
    const platform = detectPlatform();
    
    const patterns = {
      amazon: /\/(dp|gp\/product|product)\/[A-Z0-9]+/i,
      aliexpress: /\/item\/|\/i\/|\/_p\//i,
      alibaba: /\/product-detail\//i,
      temu: /\/[a-z0-9-]+-g-\d+\.html/i,
      shein: /\/-p-\d+\.html/i,
      ebay: /\/itm\//i,
      etsy: /\/listing\//i,
      walmart: /\/ip\//i,
      shopify: /\/products\//i,
      cdiscount: /\/f-\d+|\/fp\/\d+/i,
      fnac: /\/a\d+\//i,
      rakuten: /\/product\//i
    };
    
    return patterns[platform]?.test(url) || false;
  }

  function isListingPage() {
    const url = window.location.href;
    const platform = detectPlatform();
    
    const listingPatterns = {
      amazon: /\/gp\/bestsellers|\/gp\/new-releases|\/gp\/movers-and-shakers|\/gp\/most-wished-for|\/gp\/top-|\/s\?|\/s\/|\/b\?|\/b\/|\?k=|\/zgbs\/|\/stores\/|\/slp\/|\/browse\//i,
      aliexpress: /\/category\/|\/wholesale|\/w\/|\/af\/|\/gcp\//i,
      temu: /\/channel\/|\/search_result|\/goods/i,
      shein: /\/category\/|\/[a-z]+-c-\d+|pdsearch/i,
      ebay: /\/b\/|\/sch\/|\/e\//i
    };
    
    if (platform === 'amazon') {
      const productCards = document.querySelectorAll('[data-asin], .s-result-item, .zg-grid-general-faceout, .a-carousel-card');
      if (productCards.length >= 3) return true;
    }
    
    return listingPatterns[platform]?.test(url) || false;
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
      etsy: extractEtsyData
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

    // Images - Enhanced high-res extraction
    const imageElements = document.querySelectorAll('#altImages img, #imageBlock img, .imgTagWrapper img, .a-dynamic-image, #landingImage, #imgBlkFront, [data-old-hires], li.image img');
    const imageSet = new Set();
    
    imageElements.forEach(img => {
      let src = img.dataset?.oldHires || img.dataset?.aHires || img.src || '';
      if (src && !src.includes('sprite') && !src.includes('transparent') && !src.includes('grey-pixel') && !src.includes('blank')) {
        // Convert to high-res
        src = src.replace(/\._[A-Z]{2}\d+_\./, '._SL1500_.');
        src = src.replace(/\._S[XY]\d+_\./, '._SL1500_.');
        src = src.replace(/_AC_US\d+_/, '_AC_SL1500_');
        src = src.replace(/_AC_S[XY]\d+_/, '_AC_SL1500_');
        src = src.replace(/_SS\d+_/, '_SL1500_');
        if ((src.includes('images/I/') || src.includes('images-amazon.com')) && src.includes('http')) {
          imageSet.add(src);
        }
      }
    });

    // Check for data-zoom-image attributes
    document.querySelectorAll('[data-zoom-image]').forEach(el => {
      const zoomSrc = el.getAttribute('data-zoom-image');
      if (zoomSrc && zoomSrc.includes('http')) {
        imageSet.add(zoomSrc);
      }
    });
    
    data.images = Array.from(imageSet).slice(0, 20);

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
    // Size variants
    const sizeVariants = document.querySelectorAll('#variation_size_name li:not(.swatchUnavailable), #twister-plus-inline-twister-card li');
    sizeVariants.forEach(v => {
      const text = v.querySelector('.a-button-text, .a-size-base')?.textContent?.trim();
      if (text && text.length < 50) {
        data.variants.push({ type: 'size', name: text, available: !v.classList.contains('swatchUnavailable') });
      }
    });
    
    // Color variants
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

    // Style variants
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

    // Images - Enhanced extraction
    const imageElements = document.querySelectorAll(
      '.images-view-item img, ' +
      '.slider--img--item img, ' +
      '[class*="gallery"] img, ' +
      '.product-img img, ' +
      '.image-view--previewBox--SyecEnE img, ' +
      '[class*="slider"] img'
    );
    const imageSet = new Set();
    
    imageElements.forEach(img => {
      let src = img.src || img.dataset?.src || img.getAttribute('data-src');
      if (src) {
        // Convert to high-res
        src = src.replace(/_\d+x\d+\./g, '.');
        src = src.replace(/\.jpg_\d+x\d+\.jpg/g, '.jpg');
        src = src.replace(/_\d+x\d+\.jpg/g, '.jpg');
        src = src.replace(/_\d+x\d+\.png/g, '.png');
        src = src.replace(/\?.*$/, ''); // Remove query params
        if (src.startsWith('//')) src = 'https:' + src;
        if ((src.includes('alicdn.com') || src.includes('cbu01.alicdn')) && src.includes('http')) {
          imageSet.add(src);
        }
      }
    });
    
    data.images = Array.from(imageSet).slice(0, 20);

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

    // Variants - Color/Size options
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

    // Try to find price
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
  // UI CREATION (Pure DOM - CSP Safe)
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
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      @keyframes shopoptiSlideIn {
        from { transform: translateX(120%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      #shopopti-import-btn {
        position: fixed !important;
        bottom: 24px !important;
        right: 24px !important;
        z-index: 2147483647 !important;
        padding: 14px 24px !important;
        background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%) !important;
        color: white !important;
        border: none !important;
        border-radius: 50px !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        font-size: 14px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 8px !important;
        box-shadow: 0 8px 30px rgba(0, 212, 255, 0.4) !important;
        transition: all 0.2s ease !important;
      }
      #shopopti-import-btn:hover {
        transform: translateY(-3px) scale(1.02) !important;
        box-shadow: 0 12px 40px rgba(0, 212, 255, 0.5) !important;
      }
      #shopopti-import-btn.loading {
        opacity: 0.9 !important;
        cursor: wait !important;
        animation: shopoptiPulse 1.5s ease-in-out infinite !important;
      }
      #shopopti-import-btn.success {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
      }
      #shopopti-import-btn.error {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
      }
      #shopopti-import-btn:disabled {
        pointer-events: none !important;
      }
      
      /* Bulk import button */
      #shopopti-bulk-btn {
        position: fixed !important;
        bottom: 24px !important;
        right: 24px !important;
        z-index: 2147483647 !important;
        padding: 14px 24px !important;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
        color: white !important;
        border: none !important;
        border-radius: 50px !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        font-size: 14px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        box-shadow: 0 8px 30px rgba(16, 185, 129, 0.4) !important;
        transition: all 0.2s ease !important;
      }
      #shopopti-bulk-btn:hover {
        transform: translateY(-3px) !important;
        box-shadow: 0 12px 40px rgba(16, 185, 129, 0.5) !important;
      }
      .shopopti-bulk-counter {
        background: white !important;
        color: #059669 !important;
        padding: 2px 10px !important;
        border-radius: 12px !important;
        font-size: 13px !important;
        font-weight: 700 !important;
        min-width: 24px !important;
        text-align: center !important;
      }
      
      /* Individual product buttons on listing pages */
      .shopopti-listing-btn {
        position: absolute !important;
        top: 8px !important;
        right: 8px !important;
        z-index: 10000 !important;
        padding: 6px 12px !important;
        background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%) !important;
        color: white !important;
        border: none !important;
        border-radius: 8px !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        font-size: 11px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        display: flex !important;
        align-items: center !important;
        gap: 4px !important;
        box-shadow: 0 2px 8px rgba(0, 212, 255, 0.4) !important;
        transition: all 0.2s ease !important;
        opacity: 0 !important;
      }
      .shopopti-listing-btn:hover {
        transform: scale(1.05) !important;
        opacity: 1 !important;
      }
      *:hover > .shopopti-listing-btn {
        opacity: 1 !important;
      }
      .shopopti-listing-btn.success {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
      }
      .shopopti-listing-btn.loading {
        opacity: 0.8 !important;
        cursor: wait !important;
      }
      
      /* Toast notifications */
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
        animation: shopoptiSlideIn 0.3s ease !important;
        max-width: 350px !important;
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2) !important;
      }
      .shopopti-toast.success {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
      }
      .shopopti-toast.error {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
      }
      .shopopti-toast.loading {
        background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%) !important;
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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7,10 12,15 17,10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      <span>Importer dans ShopOpti+</span>
    `;

    button.addEventListener('click', handleImportClick);
    document.body.appendChild(button);
    console.log('[ShopOpti+] Import button created');
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
    
    updateButtonState('loading', 'Extraction...');

    try {
      const productData = extractProductData();

      if (!productData.title) {
        throw new Error('Impossible d\'extraire les données du produit');
      }

      console.log('[ShopOpti+] Extracted product:', productData.title, '| Images:', productData.images?.length || 0);
      updateButtonState('loading', 'Import en cours...');

      const response = await safeSendMessage({
        type: 'IMPORT_FROM_URL',
        url: productData.source_url
      });

      console.log('[ShopOpti+] Import response:', response);

      if (response?.success) {
        updateButtonState('success', 'Produit importé !');
      } else {
        throw new Error(response?.error || 'Échec de l\'import');
      }
    } catch (error) {
      console.error('[ShopOpti+] Import error:', error);
      updateButtonState('error', error.message || 'Erreur');
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
          
        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
      
      return true;
    });
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
  // LISTING PAGE BUTTONS
  // ============================================
  function createListingButtons() {
    const platform = detectPlatform();
    
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
        '[data-asin]:not([data-asin=""])'
      ],
      aliexpress: [
        '.list-item',
        '.product-item',
        '.search-item-card-wrapper-gallery',
        '[data-widget-cid*="product"]',
        '.product-snippet'
      ],
      temu: [
        '[data-testid="goods-item"]',
        '.goods-item',
        '[class*="GoodsItem"]'
      ],
      ebay: [
        '.s-item',
        '.srp-river-result',
        '[data-testid="listing-card"]'
      ]
    };
    
    const platformSelectors = selectors[platform];
    if (!platformSelectors) return;
    
    const productElements = document.querySelectorAll(platformSelectors.join(', '));
    console.log(`[ShopOpti+] Found ${productElements.length} products on listing page`);
    
    let addedCount = 0;
    productElements.forEach((element) => {
      if (element.querySelector('.shopopti-listing-btn')) return;
      
      let url = null;
      
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
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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

  function createBulkImportButton() {
    if (document.getElementById('shopopti-bulk-btn')) return;
    
    const button = document.createElement('button');
    button.id = 'shopopti-bulk-btn';
    button.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
      </svg>
      <span>Import en masse</span>
      <span class="shopopti-bulk-counter">0</span>
    `;
    
    button.addEventListener('click', async () => {
      const allButtons = document.querySelectorAll('.shopopti-listing-btn:not(.success)');
      if (allButtons.length === 0) {
        showToast('Aucun produit à importer', 'error');
        return;
      }
      
      showToast(`Import de ${allButtons.length} produits...`, 'loading');
      
      let successCount = 0;
      for (const btn of allButtons) {
        btn.click();
        await new Promise(r => setTimeout(r, 1500));
        if (btn.classList.contains('success')) successCount++;
      }
      
      showToast(`${successCount}/${allButtons.length} produits importés`, successCount > 0 ? 'success' : 'error');
    });
    
    document.body.appendChild(button);
  }

  // ============================================
  // INITIALIZATION
  // ============================================
  function init() {
    const platform = detectPlatform();
    console.log('[ShopOpti+] Detected platform:', platform);

    if (!CONFIG.SUPPORTED_PLATFORMS.includes(platform) && platform !== 'unknown') {
      console.log('[ShopOpti+] Platform not supported');
      return;
    }

    addStyles();

    if (isProductPage()) {
      console.log('[ShopOpti+] Product page detected');
      createImportButton();
    } else if (isListingPage()) {
      console.log('[ShopOpti+] Listing page detected');
      createBulkImportButton();
      createListingButtons();
      
      // Watch for dynamically loaded products
      const observer = new MutationObserver(() => {
        createListingButtons();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 500));
  } else {
    setTimeout(init, 500);
  }

  // Reinit on page load
  window.addEventListener('load', () => setTimeout(init, 1000));

})();
