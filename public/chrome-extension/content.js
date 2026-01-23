// ============================================
// Drop Craft AI Chrome Extension - Content Script v4.3.6
// Professional Dropshipping Extension - 100% CSP-SAFE
// NO SCRIPT INJECTION - Pure Content Script Mode
// Works on Amazon, AliExpress, and all strict CSP sites
// ============================================

(function () {
  'use strict';

  // Prevent multiple injections
  if (window.__dropCraftCSVersion === '4.3.7') return;
  window.__dropCraftCSVersion = '4.3.7';

  console.log('[DropCraft] Content script v4.3.7 initializing (CSP-SAFE mode)...');

  // ============================================
  // CHROME API SAFETY CHECK
  // ============================================
  function isChromeRuntimeAvailable() {
    try {
      // Check if chrome.runtime exists and is connected
      return !!(typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id && chrome.runtime.sendMessage);
    } catch (e) {
      return false;
    }
  }

  // Safe message sender with fallback
  async function safeSendMessage(message) {
    if (!isChromeRuntimeAvailable()) {
      console.warn('[DropCraft] Extension context invalidated - please reload the page');
      throw new Error('Extension déconnectée. Rechargez la page (F5).');
    }
    
    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            console.error('[DropCraft] Runtime error:', chrome.runtime.lastError);
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
    VERSION: '4.3.6',
    SUPPORTED_PLATFORMS: ['amazon', 'aliexpress', 'alibaba', 'temu', 'shein', 'shopify', 'ebay', 'etsy', 'walmart', 'cjdropshipping', 'banggood', 'dhgate', 'wish', 'cdiscount', 'fnac']
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
    
    // Shopify detection via meta tags
    if (document.querySelector('meta[name="shopify-checkout-api-token"]') ||
        document.querySelector('link[href*="cdn.shopify.com"]') ||
        hostname.includes('myshopify')) {
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
      fnac: /\/a\d+\//i
    };
    
    return patterns[platform]?.test(url) || false;
  }

  function isListingPage() {
    const url = window.location.href;
    const platform = detectPlatform();
    
    const listingPatterns = {
      amazon: /\/gp\/bestsellers|\/gp\/new-releases|\/gp\/movers-and-shakers|\/gp\/most-wished-for|\/s\?|\/s\/|\/b\?|\/b\/|\?k=/i,
      aliexpress: /\/category\/|\/wholesale|\/w\/|\/af\//i,
      temu: /\/channel\/|\/search_result/i,
      shein: /\/category\/|\/[a-z]+-c-\d+/i,
      ebay: /\/b\/|\/sch\//i
    };
    
    return listingPatterns[platform]?.test(url) || false;
  }

  // ============================================
  // DATA EXTRACTION (Pure DOM - No CSP Issues)
  // ============================================
  function extractProductData() {
    const platform = detectPlatform();
    console.log('[DropCraft] Extracting data for platform:', platform);

    const extractors = {
      amazon: extractAmazonData,
      aliexpress: extractAliExpressData,
      shopify: extractShopifyData,
      temu: extractTemuData,
      ebay: extractEbayData
    };

    const extractor = extractors[platform] || extractGenericData;
    const data = extractor();
    
    data.platform = platform;
    data.source_url = window.location.href;
    data.extracted_at = new Date().toISOString();
    
    console.log('[DropCraft] Extracted data:', data);
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
      asin: ''
    };

    // Title
    const titleEl = document.querySelector('#productTitle, #title, .product-title-word-break');
    data.title = titleEl?.textContent?.trim() || '';

    // ASIN from URL
    const asinMatch = window.location.href.match(/\/dp\/([A-Z0-9]+)/i) ||
                      window.location.href.match(/\/gp\/product\/([A-Z0-9]+)/i);
    data.asin = asinMatch?.[1] || document.querySelector('[data-asin]')?.dataset?.asin || '';

    // Price
    const priceSelectors = [
      '.a-price .a-offscreen',
      '#priceblock_ourprice',
      '#priceblock_dealprice', 
      '#priceblock_saleprice',
      '.apexPriceToPay .a-offscreen',
      '#corePrice_feature_div .a-offscreen',
      '.priceToPay .a-offscreen',
      '[data-a-color="price"] .a-offscreen'
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

    // Description
    const descEl = document.querySelector('#productDescription, #feature-bullets');
    data.description = descEl?.textContent?.trim().slice(0, 1000) || '';

    // Images - Enhanced extraction
    const imageElements = document.querySelectorAll('#altImages img, #imageBlock img, .imgTagWrapper img, .a-dynamic-image, #landingImage, #imgBlkFront');
    const imageSet = new Set();
    
    imageElements.forEach(img => {
      let src = img.src || img.dataset?.oldHires || img.dataset?.aHires || '';
      if (src && !src.includes('sprite') && !src.includes('transparent') && !src.includes('grey-pixel')) {
        // Convert to high-res
        src = src.replace(/\._[A-Z]{2}\d+_\./, '._SL1500_.');
        src = src.replace(/\._S[XY]\d+_\./, '._SL1500_.');
        src = src.replace(/_AC_US\d+_/, '_AC_SL1500_');
        src = src.replace(/_AC_S[XY]\d+_/, '_AC_SL1500_');
        if ((src.includes('images/I/') || src.includes('images-amazon.com')) && src.includes('http')) {
          imageSet.add(src);
        }
      }
    });

    // Also check for data-zoom-image attributes
    document.querySelectorAll('[data-zoom-image]').forEach(el => {
      const zoomSrc = el.getAttribute('data-zoom-image');
      if (zoomSrc && zoomSrc.includes('http')) {
        imageSet.add(zoomSrc);
      }
    });
    
    data.images = Array.from(imageSet).slice(0, 10);

    // Rating
    const ratingEl = document.querySelector('#acrPopover, .a-icon-star span, [data-action="a-popover"] .a-icon-alt');
    if (ratingEl) {
      const ratingMatch = ratingEl.textContent?.match(/[\d,.]+/);
      data.rating = ratingMatch ? parseFloat(ratingMatch[0].replace(',', '.')) : null;
    }

    // Reviews count
    const reviewsEl = document.querySelector('#acrCustomerReviewText, #averageCustomerReviews_feature_div .a-size-base');
    if (reviewsEl) {
      const countMatch = reviewsEl.textContent?.match(/[\d,.]+/);
      data.reviews_count = countMatch ? parseInt(countMatch[0].replace(/[.,]/g, '')) : 0;
    }

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
      reviews_count: 0
    };

    const titleEl = document.querySelector('h1[data-pl="product-title"], .product-title-text, h1');
    data.title = titleEl?.textContent?.trim() || '';

    const priceEl = document.querySelector('[class*="price--current"], .product-price-value, .uniform-banner-box-price');
    if (priceEl) {
      const priceMatch = priceEl.textContent?.match(/[\d,.]+/);
      data.price = priceMatch ? parseFloat(priceMatch[0].replace(',', '.')) : 0;
    }

    const imageElements = document.querySelectorAll('.images-view-item img, .slider--img--item img, [class*="gallery"] img, .product-img img');
    const imageSet = new Set();
    
    imageElements.forEach(img => {
      let src = img.src || img.dataset?.src;
      if (src) {
        // Convert to high-res
        src = src.replace(/_\d+x\d+\./g, '_.');
        src = src.replace(/\.jpg_\d+x\d+\.jpg/g, '.jpg');
        src = src.replace(/_\d+x\d+\.jpg/g, '.jpg');
        if (src.startsWith('//')) src = 'https:' + src;
        if (src.includes('alicdn.com') && src.includes('http')) {
          imageSet.add(src);
        }
      }
    });
    
    data.images = Array.from(imageSet).slice(0, 10);

    const ratingEl = document.querySelector('[class*="rating"] strong, .overview-rating-average');
    if (ratingEl) {
      const ratingMatch = ratingEl.textContent?.match(/[\d,.]+/);
      data.rating = ratingMatch ? parseFloat(ratingMatch[0].replace(',', '.')) : null;
    }

    return data;
  }

  function extractTemuData() {
    const data = {
      title: '',
      price: 0,
      currency: 'EUR',
      images: []
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

    return data;
  }

  // ============================================
  // UI CREATION (Pure DOM - CSP Safe)
  // ============================================
  function addStyles() {
    if (document.getElementById('dropcraft-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'dropcraft-styles';
    style.textContent = `
      @keyframes dcSpin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes dcPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      #dropcraft-import-btn {
        position: fixed !important;
        bottom: 20px !important;
        right: 20px !important;
        z-index: 2147483647 !important;
        padding: 14px 22px !important;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
        color: white !important;
        border: none !important;
        border-radius: 12px !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        font-size: 14px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4) !important;
        transition: all 0.2s ease !important;
      }
      #dropcraft-import-btn:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 8px 25px rgba(99, 102, 241, 0.5) !important;
      }
      #dropcraft-import-btn.loading {
        opacity: 0.9 !important;
        cursor: wait !important;
        animation: dcPulse 1.5s ease-in-out infinite !important;
      }
      #dropcraft-import-btn.success {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
      }
      #dropcraft-import-btn.error {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
      }
      #dropcraft-import-btn:disabled {
        pointer-events: none !important;
      }
      
      /* Bulk import button for listing pages */
      #dropcraft-bulk-btn {
        position: fixed !important;
        bottom: 20px !important;
        right: 20px !important;
        z-index: 2147483647 !important;
        padding: 14px 22px !important;
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
        box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4) !important;
        transition: all 0.2s ease !important;
      }
      #dropcraft-bulk-btn:hover {
        transform: translateY(-2px) scale(1.02) !important;
        box-shadow: 0 8px 25px rgba(16, 185, 129, 0.5) !important;
      }
      .dropcraft-bulk-counter {
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
      .dropcraft-listing-btn {
        position: absolute !important;
        top: 8px !important;
        right: 8px !important;
        z-index: 10000 !important;
        padding: 6px 10px !important;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
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
        box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4) !important;
        transition: all 0.2s ease !important;
        opacity: 0 !important;
      }
      .dropcraft-listing-btn:hover {
        transform: scale(1.05) !important;
        opacity: 1 !important;
      }
      *:hover > .dropcraft-listing-btn {
        opacity: 1 !important;
      }
      .dropcraft-listing-btn.success {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
      }
      .dropcraft-listing-btn.loading {
        opacity: 0.8 !important;
        cursor: wait !important;
      }
    `;
    document.head.appendChild(style);
  }

  function createImportButton() {
    const existing = document.getElementById('dropcraft-import-btn');
    if (existing) existing.remove();

    const button = document.createElement('button');
    button.id = 'dropcraft-import-btn';
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px; flex-shrink: 0;">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7,10 12,15 17,10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      <span>Importer dans Shopopti+</span>
    `;

    button.addEventListener('click', handleImportClick);
    document.body.appendChild(button);
    console.log('[DropCraft] Import button created');
  }

  function updateButtonState(state, message) {
    const button = document.getElementById('dropcraft-import-btn');
    if (!button) return;

    button.className = '';
    
    switch (state) {
      case 'loading':
        button.classList.add('loading');
        button.innerHTML = `
          <span style="width:16px;height:16px;border:2px solid white;border-top-color:transparent;border-radius:50%;animation:dcSpin 1s linear infinite;margin-right:8px;flex-shrink:0;"></span>
          <span>${message || 'Import en cours...'}</span>
        `;
        button.disabled = true;
        break;
      case 'success':
        button.classList.add('success');
        button.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:8px;flex-shrink:0;">
            <polyline points="20,6 9,17 4,12"/>
          </svg>
          <span>${message || 'Importé !'}</span>
        `;
        button.disabled = true;
        setTimeout(() => updateButtonState('idle'), 3000);
        break;
      case 'error':
        button.classList.add('error');
        button.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:8px;flex-shrink:0;">
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;flex-shrink:0;">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7,10 12,15 17,10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span>Importer dans Shopopti+</span>
        `;
        button.disabled = false;
    }
  }

  // ============================================
  // IMPORT HANDLER (Via Background Script)
  // ============================================
  async function handleImportClick() {
    console.log('[DropCraft] Import clicked');
    
    // Check extension context first
    if (!isChromeRuntimeAvailable()) {
      updateButtonState('error', 'Rechargez la page (F5)');
      console.error('[DropCraft] Extension context not available');
      return;
    }
    
    updateButtonState('loading', 'Extraction...');

    try {
      const productData = extractProductData();

      if (!productData.title) {
        throw new Error('Impossible d\'extraire les données du produit');
      }

      console.log('[DropCraft] Extracted product:', productData.title, '| Images:', productData.images?.length || 0);
      updateButtonState('loading', 'Import en cours...');

      // Send to background script for API call using safe sender
      const response = await safeSendMessage({
        type: 'DC_IMPORT_PRODUCT',
        payload: {
          url: productData.source_url,
          productData: productData
        }
      });

      console.log('[DropCraft] Import response:', response);

      if (response?.success) {
        updateButtonState('success', 'Produit importé !');
      } else {
        throw new Error(response?.error || 'Échec de l\'import');
      }
    } catch (error) {
      console.error('[DropCraft] Import error:', error);
      updateButtonState('error', error.message || 'Erreur');
    }
  }

  // ============================================
  // MESSAGE LISTENER (Communication with Background)
  // ============================================
  // Only add listener if chrome.runtime is available
  if (isChromeRuntimeAvailable()) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('[DropCraft] Message received:', message.type);
      
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
  } else {
    console.warn('[DropCraft] chrome.runtime not available - message listener not registered');
  }

  // ============================================
  // SPA NAVIGATION DETECTION
  // ============================================
  let lastUrl = window.location.href;
  
  function checkUrlChange() {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      console.log('[DropCraft] URL changed, re-initializing...');
      setTimeout(init, 500);
    }
  }

  // Monitor URL changes for SPAs
  const urlObserver = new MutationObserver(checkUrlChange);
  urlObserver.observe(document.body, { childList: true, subtree: true });

  // Also intercept history API
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
  let selectedProducts = [];

  function createListingButtons() {
    const platform = detectPlatform();
    
    // Platform-specific selectors for product items
    const selectors = {
      amazon: [
        '.zg-grid-general-faceout',           // Best sellers
        '[data-component-type="s-search-result"]', // Search results
        '.p13n-sc-uncoverable-faceout',       // Recommendations
        '.octopus-pc-item-v3',                // Category items
        '.a-carousel-card',                   // Carousel items
        '.s-result-item[data-asin]',          // Search results alt
        '[data-testid="product-card"]'        // Product cards
      ],
      aliexpress: [
        '.list-item',
        '.product-item', 
        '.search-item-card-wrapper-gallery',
        '.multi--outWrapper--SeJ8bEF'
      ],
      temu: [
        '[data-testid="goods-item"]',
        '.goods-item'
      ]
    };
    
    const platformSelectors = selectors[platform];
    if (!platformSelectors) return;
    
    const productElements = document.querySelectorAll(platformSelectors.join(', '));
    console.log(`[DropCraft] Found ${productElements.length} products on listing page`);
    
    productElements.forEach((element) => {
      if (element.querySelector('.dropcraft-listing-btn')) return;
      
      // Get product URL
      const link = element.querySelector('a[href*="/dp/"], a[href*="/item/"], a[href*="/product"]');
      const url = link?.href;
      if (!url) return;
      
      // Make container relative for positioning
      element.style.position = 'relative';
      
      // Create individual import button
      const btn = document.createElement('button');
      btn.className = 'dropcraft-listing-btn';
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
        btn.innerHTML = `
          <span style="width:10px;height:10px;border:2px solid white;border-top-color:transparent;border-radius:50%;animation:dcSpin 1s linear infinite;"></span>
        `;
        
        try {
          if (!isChromeRuntimeAvailable()) {
            throw new Error('Extension déconnectée. Rechargez la page.');
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
            throw new Error(response?.error || 'Échec de l\'import');
          }
        } catch (error) {
          console.error('[DropCraft] Import error:', error);
          btn.classList.remove('loading');
          btn.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span>Erreur</span>
          `;
          
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
    });
  }

  function createBulkImportButton() {
    if (document.getElementById('dropcraft-bulk-btn')) return;
    
    const button = document.createElement('button');
    button.id = 'dropcraft-bulk-btn';
    button.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
      </svg>
      <span>Import en masse</span>
      <span class="dropcraft-bulk-counter">0</span>
    `;
    
    button.addEventListener('click', () => {
      // Open Shopopti+ import page
      if (isChromeRuntimeAvailable()) {
        chrome.runtime.sendMessage({ type: 'OPEN_BULK_IMPORT' });
      }
    });
    
    document.body.appendChild(button);
    console.log('[DropCraft] Bulk import button created');
  }

  // ============================================
  // INITIALIZATION
  // ============================================
  function init() {
    addStyles();
    
    if (isProductPage()) {
      console.log('[DropCraft] Product page detected');
      createImportButton();
      // Remove listing buttons on product pages
      const bulkBtn = document.getElementById('dropcraft-bulk-btn');
      if (bulkBtn) bulkBtn.remove();
    } else if (isListingPage()) {
      console.log('[DropCraft] Listing page detected');
      // Remove single import button
      const existing = document.getElementById('dropcraft-import-btn');
      if (existing) existing.remove();
      // Add listing buttons
      createBulkImportButton();
      createListingButtons();
      // Re-check for new products periodically (for infinite scroll)
      setTimeout(() => createListingButtons(), 2000);
      setTimeout(() => createListingButtons(), 5000);
    } else {
      console.log('[DropCraft] Not a product or listing page');
      const existing = document.getElementById('dropcraft-import-btn');
      if (existing) existing.remove();
      const bulkBtn = document.getElementById('dropcraft-bulk-btn');
      if (bulkBtn) bulkBtn.remove();
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Also listen for scroll to inject buttons on lazy-loaded products
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      if (isListingPage()) {
        createListingButtons();
      }
    }, 500);
  });

  console.log('[DropCraft] Content script v4.3.7 initialized');
})();
