// ============================================
// ShopOpti+ Chrome Extension - Content Script v4.4.0
// SECURITY HARDENED - XSS Prevention, Safe DOM
// Universal Catalog Detection for 30+ platforms
// ============================================

(function () {
  'use strict';

  // Prevent multiple injections
  if (window.__shopOptiCSVersion === '4.4.0') return;
  window.__shopOptiCSVersion = '4.4.0';

  console.log('[ShopOpti+] Content script v4.4.0 initializing (Security Hardened)...');

  // ============================================
  // SECURITY MODULE (inline for content script)
  // ============================================
  const Security = {
    sanitizeText(text) {
      if (!text || typeof text !== 'string') return '';
      const div = document.createElement('div');
      div.textContent = text;
      return div.textContent;
    },

    createElement(tag, attributes = {}, textContent = null) {
      const el = document.createElement(tag);
      
      for (const [key, value] of Object.entries(attributes)) {
        if (key.startsWith('on') || key === 'innerHTML' || key === 'outerHTML') {
          console.warn('[ShopOpti+ Security] Blocked dangerous attribute:', key);
          continue;
        }
        
        if (key === 'className') {
          el.className = value;
        } else if (key === 'dataset') {
          for (const [dataKey, dataValue] of Object.entries(value)) {
            el.dataset[dataKey] = this.sanitizeText(String(dataValue));
          }
        } else if (key === 'style' && typeof value === 'object') {
          Object.assign(el.style, value);
        } else {
          el.setAttribute(key, this.sanitizeText(String(value)));
        }
      }
      
      if (textContent !== null) {
        el.textContent = textContent;
      }
      
      return el;
    },

    createSvgElement(svgContent) {
      const template = document.createElement('template');
      template.innerHTML = svgContent.trim();
      return template.content.firstChild;
    }
  };

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
  // CONFIGURATION v4.4.0
  // ============================================
  const CONFIG = {
    VERSION: '4.4.0',
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
  // PLATFORM DETECTION
  // ============================================
  function detectPlatform() {
    const hostname = window.location.hostname.toLowerCase();
    
    const platformMap = {
      'amazon': 'amazon', 'aliexpress': 'aliexpress', 'alibaba': 'alibaba',
      'temu': 'temu', 'shein': 'shein', 'ebay': 'ebay', 'etsy': 'etsy',
      'walmart': 'walmart', 'cjdropshipping': 'cjdropshipping',
      'banggood': 'banggood', 'dhgate': 'dhgate', 'wish': 'wish',
      'cdiscount': 'cdiscount', 'fnac': 'fnac', 'rakuten': 'rakuten',
      'costco': 'costco', 'homedepot': 'homedepot', 'lowes': 'lowes',
      'target': 'target', 'bestbuy': 'bestbuy', 'wayfair': 'wayfair',
      'overstock': 'overstock', 'newegg': 'newegg', 'zalando': 'zalando',
      'asos': 'asos', 'manomano': 'manomano', 'darty': 'darty',
      'boulanger': 'boulanger', 'leroymerlin': 'leroymerlin'
    };
    
    for (const [key, platform] of Object.entries(platformMap)) {
      if (hostname.includes(key)) return platform;
    }
    
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
  // PRODUCT PAGE DETECTION
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
    
    if (patterns[platform]?.test(url)) return true;
    if (url.includes('/product') || url.includes('/products/') || url.includes('/item/')) return true;
    
    const hasTitleSelector = !!document.querySelector('h1, [itemprop="name"], .product-title');
    const hasPriceSelector = !!document.querySelector('[itemprop="price"], .fpPrice, .prdtPrSt, .a-price, .product-price');
    
    return hasTitleSelector && hasPriceSelector;
  }

  // ============================================
  // LISTING PAGE DETECTION (Universal Amazon-style)
  // ============================================
  function isListingPage() {
    const url = window.location.href;
    const platform = detectPlatform();
    
    const listingPatterns = {
      amazon: /\/gp\/bestsellers|\/gp\/new-releases|\/s\?|\/s\/|\/b\?|\/b\/|\?k=|\/zgbs\/|\/stores\/|ref=|node=|keywords=/i,
      aliexpress: /\/category\/|\/wholesale|\/w\/|\/af\/|SearchText=|catId=/i,
      temu: /\/channel\/|\/search_result|\/mall\/|search_key=|\/[a-z]+-c-\d+/i,
      shein: /\/category\/|\/[a-z]+-c-\d+|pdsearch/i,
      ebay: /\/b\/|\/sch\/|\/e\/|_nkw=|_dcat=/i,
      walmart: /\/search\/|\/browse\/|\/shop\/|query=/i,
      etsy: /\/search\?|\/c\/|\/shop\/|\/market\//i,
      cdiscount: /\/search|\/browse|\/lp\/|[?&]keyword=|\/l-\d+|\/r-|\/clp\/|produits/i,
      fnac: /\/[a-z]+-\d+\/|\/recherche\/|\/c\d+\//i,
      rakuten: /\/search\/|\/category\/|\/s\//i,
      costco: /\/search|\.product-list/i,
      homedepot: /\/b\/|\/s\/|\/N-/i,
      lowes: /\/search|\/pl\//i,
      target: /\/s\?|\/c\/|searchTerm=/i,
      bestbuy: /\/site\/searchpage|\/site\/.*\/pcmcat/i,
      wayfair: /\/sb\d|\/keyword=/i
    };
    
    if (listingPatterns[platform]?.test(url)) return true;
    
    // Universal product card detection
    const productCardSelectors = [
      '[data-asin]:not([data-asin=""])', '.s-result-item',
      '.list-item', '[class*="product-card"]', '[class*="ProductCard"]',
      '.prdtBloc', '.c-productCard', '[data-product-id]', '.lpProduct',
      '.Article-item', '[data-testid="goods-item"]', '.goods-item',
      '.s-item', '.v2-listing-card', '.product-card', '.product-item'
    ];
    
    for (const selector of productCardSelectors) {
      try {
        if (document.querySelectorAll(selector).length >= 3) return true;
      } catch (e) {}
    }
    
    return false;
  }

  // ============================================
  // DATA EXTRACTION (Safe DOM methods)
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
      cdiscount: extractCdiscountData,
      walmart: extractWalmartData,
      fnac: extractFnacData
    };

    const extractor = extractors[platform] || extractGenericData;
    const data = extractor();
    
    data.platform = platform;
    data.source_url = window.location.href;
    data.extracted_at = new Date().toISOString();
    
    return data;
  }

  function extractAmazonData() {
    const data = {
      title: '', price: 0, currency: 'EUR', description: '',
      images: [], variants: [], rating: null, reviews_count: 0,
      asin: '', sku: '', brand: '', category: ''
    };

    data.title = Security.sanitizeText(document.querySelector('#productTitle, #title')?.textContent?.trim() || '');
    
    const asinMatch = window.location.href.match(/\/dp\/([A-Z0-9]+)/i) ||
                      window.location.href.match(/\/gp\/product\/([A-Z0-9]+)/i);
    data.asin = asinMatch?.[1] || document.querySelector('[data-asin]')?.dataset?.asin || '';
    data.sku = data.asin;

    const brandEl = document.querySelector('#bylineInfo, a#bylineInfo');
    if (brandEl) {
      data.brand = Security.sanitizeText(brandEl.textContent?.replace(/^(Marque|Brand|Visit the)\s*:?\s*/i, '').trim() || '');
    }

    const priceSelectors = [
      '.a-price .a-offscreen', '#priceblock_ourprice', '#priceblock_dealprice',
      '.apexPriceToPay .a-offscreen', '#corePrice_feature_div .a-offscreen'
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
          break;
        }
      }
    }

    const descParts = [];
    const bulletList = document.querySelector('#feature-bullets ul');
    if (bulletList) {
      bulletList.querySelectorAll('li span.a-list-item').forEach(li => {
        const text = Security.sanitizeText(li.textContent?.trim());
        if (text && !text.includes('›')) descParts.push('• ' + text);
      });
    }
    data.description = descParts.join('\n\n').slice(0, 5000);

    // Images with deduplication
    const imageElements = document.querySelectorAll('#altImages img, #imageBlock img, .a-dynamic-image');
    const imageSet = new Set();
    const seenHashes = new Set();
    
    function normalizeAmazonImage(src) {
      if (!src) return null;
      return src.replace(/\._[A-Z]{2}\d+_\./, '._SL1500_.').replace(/\?.*$/, '');
    }
    
    function getImageHash(src) {
      const match = src.match(/\/([A-Z0-9]+)\._/i) || src.match(/\/I\/([^.]+)/);
      return match ? match[1] : src.substring(src.lastIndexOf('/'));
    }
    
    imageElements.forEach(img => {
      let src = img.dataset?.oldHires || img.dataset?.aHires || img.src || '';
      if (src && !src.includes('sprite') && !src.includes('transparent') && !src.includes('grey-pixel')) {
        const normalized = normalizeAmazonImage(src);
        const hash = getImageHash(normalized);
        
        if (!seenHashes.has(hash) && normalized?.includes('http')) {
          seenHashes.add(hash);
          imageSet.add(normalized);
        }
      }
    });
    
    data.images = Array.from(imageSet).filter(url => url && url.length > 20).slice(0, 20);

    const ratingEl = document.querySelector('#acrPopover .a-icon-alt, .a-icon-star .a-icon-alt');
    if (ratingEl) {
      const ratingMatch = ratingEl.textContent?.match(/[\d,.]+/);
      data.rating = ratingMatch ? parseFloat(ratingMatch[0].replace(',', '.')) : null;
    }

    const reviewsEl = document.querySelector('#acrCustomerReviewText');
    if (reviewsEl) {
      const countMatch = reviewsEl.textContent?.match(/[\d\s,.]+/);
      data.reviews_count = countMatch ? parseInt(countMatch[0].replace(/[\s.,]/g, '')) : 0;
    }

    return data;
  }

  function extractAliExpressData() {
    const data = {
      title: '', price: 0, currency: 'EUR', description: '',
      images: [], variants: [], rating: null, reviews_count: 0,
      sku: '', brand: ''
    };

    data.title = Security.sanitizeText(
      document.querySelector('h1[data-pl="product-title"], .product-title, h1')?.textContent?.trim() || ''
    );

    const priceEl = document.querySelector('[class*="product-price-value"], .uniform-banner-box-price, [class*="Price"]');
    if (priceEl) {
      const priceText = priceEl.textContent?.trim() || '';
      const priceMatch = priceText.match(/[\d,.]+/);
      if (priceMatch) {
        data.price = parseFloat(priceMatch[0].replace(',', '.'));
      }
    }

    const imageElements = document.querySelectorAll('[class*="slider"] img, .images-view img, [class*="gallery"] img');
    const imageSet = new Set();
    
    imageElements.forEach(img => {
      let src = img.dataset?.src || img.src || '';
      if (src && !src.includes('placeholder')) {
        src = src.replace(/_\d+x\d+\w*\./, '_800x800.').replace(/\?.*$/, '');
        if (src.includes('http')) imageSet.add(src);
      }
    });
    
    data.images = Array.from(imageSet).slice(0, 20);

    return data;
  }

  function extractShopifyData() {
    const data = {
      title: '', price: 0, currency: 'USD', description: '',
      images: [], variants: [], rating: null, reviews_count: 0, sku: '', brand: ''
    };

    data.title = Security.sanitizeText(document.querySelector('h1, .product-title, .product__title')?.textContent?.trim() || '');

    const priceEl = document.querySelector('[class*="price"] [class*="money"], .product-price, .price');
    if (priceEl) {
      const priceText = priceEl.textContent?.trim() || '';
      const priceMatch = priceText.match(/[\d,.]+/);
      if (priceMatch) {
        data.price = parseFloat(priceMatch[0].replace(',', '.'));
      }
    }

    const imageElements = document.querySelectorAll('.product__media img, .product-single__photo img, [class*="ProductImage"] img');
    const imageSet = new Set();
    
    imageElements.forEach(img => {
      let src = img.dataset?.src || img.src || '';
      if (src && !src.includes('placeholder')) {
        src = src.replace(/_(small|medium|large|grande|pico|icon)\./, '_1024x1024.');
        if (src.startsWith('//')) src = 'https:' + src;
        if (src.includes('http')) imageSet.add(src);
      }
    });
    
    data.images = Array.from(imageSet).slice(0, 20);

    return data;
  }

  function extractCdiscountData() {
    const data = {
      title: '', price: 0, currency: 'EUR', description: '',
      images: [], variants: [], rating: null, reviews_count: 0, sku: '', brand: ''
    };

    data.title = Security.sanitizeText(
      document.querySelector('.fpDesCol h1, .fpTMain h1, [itemprop="name"]')?.textContent?.trim() || ''
    );

    const priceEl = document.querySelector('.fpPrice, .prdtPrSt, [itemprop="price"]');
    if (priceEl) {
      const priceText = priceEl.textContent?.trim() || priceEl.getAttribute('content') || '';
      const priceMatch = priceText.match(/[\d,.]+/);
      if (priceMatch) {
        data.price = parseFloat(priceMatch[0].replace(',', '.'));
      }
    }

    const imageElements = document.querySelectorAll('.fpImgLnk img, .fpGalImg img, [itemprop="image"]');
    const imageSet = new Set();
    
    imageElements.forEach(img => {
      let src = img.dataset?.src || img.src || img.getAttribute('content') || '';
      if (src && !src.includes('placeholder') && src.includes('http')) {
        imageSet.add(src);
      }
    });
    
    data.images = Array.from(imageSet).slice(0, 20);

    return data;
  }

  function extractTemuData() {
    const data = {
      title: '', price: 0, currency: 'EUR', description: '',
      images: [], variants: [], rating: null, reviews_count: 0, sku: '', brand: ''
    };

    data.title = Security.sanitizeText(
      document.querySelector('h1, [class*="ProductTitle"]')?.textContent?.trim() || ''
    );

    const priceEl = document.querySelector('[class*="price"], [class*="Price"]');
    if (priceEl) {
      const priceText = priceEl.textContent?.trim() || '';
      const priceMatch = priceText.match(/[\d,.]+/);
      if (priceMatch) {
        data.price = parseFloat(priceMatch[0].replace(',', '.'));
      }
    }

    return data;
  }

  function extractEbayData() {
    const data = {
      title: '', price: 0, currency: 'EUR', description: '',
      images: [], variants: [], rating: null, reviews_count: 0, sku: '', brand: ''
    };

    data.title = Security.sanitizeText(
      document.querySelector('h1.x-item-title__mainTitle, h1[itemprop="name"]')?.textContent?.trim() || ''
    );

    const priceEl = document.querySelector('[itemprop="price"], .x-price-primary');
    if (priceEl) {
      const priceText = priceEl.textContent?.trim() || priceEl.getAttribute('content') || '';
      const priceMatch = priceText.match(/[\d,.]+/);
      if (priceMatch) {
        data.price = parseFloat(priceMatch[0].replace(',', '.'));
      }
    }

    return data;
  }

  function extractWalmartData() {
    const data = {
      title: '', price: 0, currency: 'USD', description: '',
      images: [], variants: [], rating: null, reviews_count: 0, sku: '', brand: ''
    };

    data.title = Security.sanitizeText(
      document.querySelector('h1[itemprop="name"], h1')?.textContent?.trim() || ''
    );

    const priceEl = document.querySelector('[itemprop="price"], [data-testid="price"]');
    if (priceEl) {
      const priceText = priceEl.textContent?.trim() || priceEl.getAttribute('content') || '';
      const priceMatch = priceText.match(/[\d,.]+/);
      if (priceMatch) {
        data.price = parseFloat(priceMatch[0].replace(',', '.'));
      }
    }

    return data;
  }

  function extractFnacData() {
    const data = {
      title: '', price: 0, currency: 'EUR', description: '',
      images: [], variants: [], rating: null, reviews_count: 0, sku: '', brand: ''
    };

    data.title = Security.sanitizeText(
      document.querySelector('h1.f-productHeader-Title, h1[itemprop="name"]')?.textContent?.trim() || ''
    );

    const priceEl = document.querySelector('.f-priceBox-price, [itemprop="price"]');
    if (priceEl) {
      const priceText = priceEl.textContent?.trim() || priceEl.getAttribute('content') || '';
      const priceMatch = priceText.match(/[\d,.]+/);
      if (priceMatch) {
        data.price = parseFloat(priceMatch[0].replace(',', '.'));
      }
    }

    return data;
  }

  function extractGenericData() {
    const data = {
      title: '', price: 0, currency: 'EUR', description: '',
      images: [], variants: [], rating: null, reviews_count: 0, sku: '', brand: ''
    };

    data.title = Security.sanitizeText(
      document.querySelector('h1, [itemprop="name"], .product-title')?.textContent?.trim() || ''
    );

    const priceEl = document.querySelector('[itemprop="price"], .price, [class*="price"]');
    if (priceEl) {
      const priceText = priceEl.textContent?.trim() || priceEl.getAttribute('content') || '';
      const priceMatch = priceText.match(/[\d,.]+/);
      if (priceMatch) {
        data.price = parseFloat(priceMatch[0].replace(',', '.'));
      }
    }

    const imageElements = document.querySelectorAll('[itemprop="image"], .product-image img, .gallery img');
    const imageSet = new Set();
    
    imageElements.forEach(img => {
      const src = img.src || img.getAttribute('content') || '';
      if (src && src.includes('http')) imageSet.add(src);
    });
    
    data.images = Array.from(imageSet).slice(0, 10);

    return data;
  }

  // ============================================
  // TOAST NOTIFICATIONS (Safe DOM)
  // ============================================
  function showToast(message, type = 'info') {
    const existingToast = document.getElementById('shopopti-toast');
    if (existingToast) existingToast.remove();
    
    const colors = {
      success: '#10b981', error: '#ef4444',
      warning: '#f59e0b', info: '#3b82f6', loading: '#6366f1'
    };
    
    const toast = Security.createElement('div', {
      id: 'shopopti-toast',
      style: {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '8px',
        color: 'white',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        fontWeight: '500',
        zIndex: '2147483647',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        backgroundColor: colors[type] || colors.info,
        transition: 'all 0.3s ease'
      }
    }, Security.sanitizeText(message));
    
    document.body.appendChild(toast);
    
    if (type !== 'loading') {
      setTimeout(() => toast.remove(), 4000);
    }
  }

  // ============================================
  // STYLES INJECTION
  // ============================================
  function addStyles() {
    if (document.getElementById('shopopti-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'shopopti-styles';
    style.textContent = `
      @keyframes shopoptiSpin {
        to { transform: rotate(360deg); }
      }
      
      @keyframes shopoptiPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      
      .shopopti-import-btn {
        position: fixed !important;
        bottom: 20px !important;
        right: 20px !important;
        z-index: 2147483646 !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        padding: 12px 20px !important;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
        color: white !important;
        border: none !important;
        border-radius: 12px !important;
        font-family: system-ui, -apple-system, sans-serif !important;
        font-size: 14px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4) !important;
        transition: all 0.2s ease !important;
        opacity: 1 !important;
        visibility: visible !important;
      }
      
      .shopopti-import-btn:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5) !important;
      }
      
      .shopopti-import-btn.loading {
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%) !important;
        pointer-events: none !important;
      }
      
      .shopopti-import-btn.success {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
      }
      
      .shopopti-import-btn.error {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
      }
      
      .shopopti-listing-btn {
        position: absolute !important;
        top: 8px !important;
        right: 8px !important;
        z-index: 1000 !important;
        display: flex !important;
        align-items: center !important;
        gap: 4px !important;
        padding: 6px 10px !important;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
        color: white !important;
        border: none !important;
        border-radius: 6px !important;
        font-family: system-ui, sans-serif !important;
        font-size: 11px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
        transition: all 0.15s ease !important;
        opacity: 1 !important;
        visibility: visible !important;
      }
      
      .shopopti-listing-btn:hover {
        transform: scale(1.05) !important;
      }
      
      .shopopti-listing-btn.loading {
        background: #6366f1 !important;
      }
      
      .shopopti-listing-btn.success {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
      }
      
      #shopopti-bulk-btn {
        position: fixed !important;
        bottom: 80px !important;
        right: 20px !important;
        z-index: 2147483646 !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        padding: 12px 16px !important;
        background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%) !important;
        color: white !important;
        border: none !important;
        border-radius: 12px !important;
        font-family: system-ui, sans-serif !important;
        font-size: 13px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        box-shadow: 0 4px 14px rgba(139, 92, 246, 0.4) !important;
      }
      
      #shopopti-bulk-btn:hover {
        transform: translateY(-2px) !important;
      }
      
      #shopopti-bulk-btn.loading {
        animation: shopoptiPulse 1s ease-in-out infinite !important;
      }
      
      #shopopti-bulk-btn.success {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
      }
      
      .shopopti-bulk-counter {
        background: rgba(255,255,255,0.2) !important;
        padding: 2px 8px !important;
        border-radius: 10px !important;
        font-size: 11px !important;
      }
      
      .shopopti-bulk-counter.updated {
        animation: shopoptiPulse 0.3s ease !important;
      }
    `;
    
    document.head.appendChild(style);
  }

  // ============================================
  // IMPORT BUTTON (Product Page) - Safe DOM
  // ============================================
  function createImportButton() {
    if (document.getElementById('shopopti-main-import-btn')) return;
    
    const btn = Security.createElement('button', {
      id: 'shopopti-main-import-btn',
      className: 'shopopti-import-btn'
    });
    
    // Create SVG icon
    const svg = Security.createSvgElement(`
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7,10 12,15 17,10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    `);
    
    const text = Security.createElement('span', {}, 'Importer dans ShopOpti');
    
    btn.appendChild(svg);
    btn.appendChild(text);
    
    btn.addEventListener('click', async () => {
      btn.classList.add('loading');
      btn.querySelector('span').textContent = 'Import en cours...';
      
      try {
        const productData = extractProductData();
        
        const response = await safeSendMessage({
          type: 'IMPORT_PRODUCT_WITH_REVIEWS',
          url: window.location.href,
          reviewLimit: 50
        });
        
        if (response?.success) {
          btn.classList.remove('loading');
          btn.classList.add('success');
          btn.querySelector('span').textContent = '✓ Importé !';
          showToast('Produit importé avec succès !', 'success');
        } else {
          throw new Error(response?.error || 'Échec de l\'import');
        }
      } catch (error) {
        console.error('[ShopOpti+] Import error:', error);
        btn.classList.remove('loading');
        btn.classList.add('error');
        btn.querySelector('span').textContent = 'Erreur';
        showToast(error.message || 'Erreur lors de l\'import', 'error');
        
        setTimeout(() => {
          btn.classList.remove('error');
          btn.querySelector('span').textContent = 'Importer dans ShopOpti';
        }, 3000);
      }
    });
    
    document.body.appendChild(btn);
    console.log('[ShopOpti+] Import button created (v4.4.0 Security Hardened)');
  }

  // ============================================
  // LISTING BUTTONS (Catalog Pages) - Safe DOM
  // ============================================
  function createListingButtons() {
    const platform = detectPlatform();
    
    const selectors = {
      amazon: ['[data-asin]:not([data-asin=""])', '.s-result-item', '.zg-grid-general-faceout'],
      aliexpress: ['.list-item', '[class*="product-card"]', '[class*="ProductCard"]'],
      cdiscount: ['.prdtBloc', '.c-productCard', '[data-product-id]', '.lpProduct', '.jsPrdtItem'],
      fnac: ['.Article-item', '.ProductCard', '.f-productCard'],
      temu: ['[data-testid="goods-item"]', '.goods-item', '[data-goods-id]'],
      ebay: ['.s-item', '.srp-river-result'],
      shein: ['.product-list__item', '.S-product-item'],
      etsy: ['.v2-listing-card', '[data-listing-id]'],
      walmart: ['.search-result-gridview-item', '[data-item-id]']
    };
    
    const platformSelectors = selectors[platform];
    if (!platformSelectors) return;
    
    const productElements = document.querySelectorAll(platformSelectors.join(', '));
    let addedCount = 0;
    
    productElements.forEach((element) => {
      if (element.querySelector('.shopopti-listing-btn')) return;
      
      let url = null;
      
      // Platform-specific URL extraction
      if (platform === 'amazon') {
        const link = element.querySelector('a[href*="/dp/"], a[href*="/gp/product/"]');
        url = link?.href;
        if (!url) {
          const asin = element.getAttribute('data-asin') || element.querySelector('[data-asin]')?.getAttribute('data-asin');
          if (asin) url = `https://www.amazon.${window.location.hostname.split('.').pop()}/dp/${asin}`;
        }
      } else if (platform === 'cdiscount') {
        const cdiscountSelectors = ['a[href*="/f-"]', 'a[href*="/fp/"]', 'a.lpLnkP', 'a[href*=".html"]'];
        for (const sel of cdiscountSelectors) {
          const link = element.querySelector(sel);
          if (link?.href?.includes('cdiscount.com')) { url = link.href; break; }
        }
      } else {
        const genericLink = element.querySelector('a[href*="/product"], a[href*="/item/"], a[href]');
        url = genericLink?.href;
      }
      
      if (!url) return;
      
      const computedStyle = window.getComputedStyle(element);
      if (computedStyle.position === 'static') {
        element.style.position = 'relative';
      }
      
      const btn = Security.createElement('button', {
        className: 'shopopti-listing-btn',
        dataset: { url: url }
      });
      
      const svg = Security.createSvgElement(`
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7,10 12,15 17,10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      `);
      
      const text = Security.createElement('span', {}, 'Import');
      
      btn.appendChild(svg);
      btn.appendChild(text);
      
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        btn.classList.add('loading');
        btn.textContent = '';
        const spinner = Security.createElement('span', {
          style: {
            width: '10px', height: '10px',
            border: '2px solid white', borderTopColor: 'transparent',
            borderRadius: '50%', animation: 'shopoptiSpin 1s linear infinite'
          }
        });
        btn.appendChild(spinner);
        
        try {
          const response = await safeSendMessage({
            type: 'IMPORT_FROM_URL',
            url: url
          });
          
          if (response?.success) {
            btn.classList.remove('loading');
            btn.classList.add('success');
            btn.textContent = '';
            
            const checkSvg = Security.createSvgElement(`
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
            `);
            const okText = Security.createElement('span', {}, 'OK!');
            btn.appendChild(checkSvg);
            btn.appendChild(okText);
          } else {
            throw new Error(response?.error || 'Échec');
          }
        } catch (error) {
          console.error('[ShopOpti+] Import error:', error);
          btn.classList.remove('loading');
          btn.textContent = '❌';
          
          setTimeout(() => {
            btn.textContent = '';
            const svg = Security.createSvgElement(`
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            `);
            const text = Security.createElement('span', {}, 'Import');
            btn.appendChild(svg);
            btn.appendChild(text);
          }, 2000);
        }
      });
      
      element.appendChild(btn);
      addedCount++;
    });
    
    if (addedCount > 0) {
      console.log(`[ShopOpti+] Added ${addedCount} import buttons`);
    }
  }

  // ============================================
  // BULK IMPORT BUTTON - Safe DOM
  // ============================================
  function createBulkImportButton() {
    if (document.getElementById('shopopti-bulk-btn')) return;
    
    const button = Security.createElement('button', { id: 'shopopti-bulk-btn' });
    
    const svg = Security.createSvgElement(`
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
      </svg>
    `);
    
    const text = Security.createElement('span', {}, 'Import en masse');
    const counter = Security.createElement('span', { className: 'shopopti-bulk-counter' }, '0');
    
    button.appendChild(svg);
    button.appendChild(text);
    button.appendChild(counter);
    
    function updateCounter() {
      const allButtons = document.querySelectorAll('.shopopti-listing-btn');
      const newCount = allButtons.length;
      counter.textContent = String(newCount);
    }
    
    const counterObserver = new MutationObserver(debounce(updateCounter, 500));
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
      
      if (totalCount > 10 && !confirm(`Importer ${totalCount} produits ?`)) return;
      
      button.classList.add('loading');
      text.textContent = 'Import en cours...';
      showToast(`Import de ${totalCount} produits...`, 'loading');
      
      let successCount = 0;
      
      for (let i = 0; i < allButtons.length; i++) {
        allButtons[i].click();
        await new Promise(r => setTimeout(r, 1800));
        if (allButtons[i].classList.contains('success')) successCount++;
        counter.textContent = `${successCount}/${totalCount}`;
      }
      
      button.classList.remove('loading');
      text.textContent = 'Import en masse';
      
      if (successCount > 0) {
        button.classList.add('success');
        showToast(`✅ ${successCount}/${totalCount} produits importés`, 'success');
        setTimeout(() => {
          button.classList.remove('success');
          updateCounter();
        }, 3000);
      }
    });
    
    document.body.appendChild(button);
    console.log('[ShopOpti+] Bulk import button created (v4.4.0 Security Hardened)');
  }

  // ============================================
  // INITIALIZATION
  // ============================================
  function init() {
    const platform = detectPlatform();
    console.log('[ShopOpti+] v4.4.0 Security Hardened - Platform:', platform);

    if (!CONFIG.SUPPORTED_PLATFORMS.includes(platform) && platform !== 'unknown') {
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
      
      const observer = new MutationObserver(debounce(() => createListingButtons(), 300));
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      // Retry detection for dynamic content
      let retryCount = 0;
      const checkInterval = setInterval(() => {
        retryCount++;
        
        if (isListingPage()) {
          clearInterval(checkInterval);
          createBulkImportButton();
          createListingButtons();
          
          const observer = new MutationObserver(debounce(() => createListingButtons(), 300));
          observer.observe(document.body, { childList: true, subtree: true });
        } else if (isProductPage()) {
          clearInterval(checkInterval);
          createImportButton();
        } else if (retryCount >= 10) {
          clearInterval(checkInterval);
        }
      }, 1000);
    }
  }

  // ============================================
  // MESSAGE LISTENER
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
            title: productData.title,
            price: productData.price,
            image: productData.images?.[0],
            images: productData.images,
            description: productData.description,
            sku: productData.sku,
            variants: productData.variants,
            platform: productData.platform,
            url: window.location.href
          }
        });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      return true;
    }
    
    return false;
  });

  // Start initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 200));
  } else {
    setTimeout(init, 200);
  }
  
  window.addEventListener('load', () => setTimeout(init, 500));

})();
