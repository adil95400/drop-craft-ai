// Drop Craft AI Chrome Extension - Content Script v4.3.5
// Professional Dropshipping Extension - PURE CONTENT SCRIPT (No Script Injection)
// CSP-SAFE: Works on Amazon, AliExpress, and all strict CSP sites
// This script runs ONLY in the content script context - no page context injection

(function () {
  'use strict';

  // Prevent multiple injections with versioned check
  if (window.__dropCraftCSVersion === '4.3.5') return;
  window.__dropCraftCSVersion = '4.3.5';

  console.log('[DropCraft] Content script v4.3.5 initializing (pure content script mode)...');

  // ============================================
  // CONFIGURATION
  // ============================================
  const CONFIG = {
    API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
    VERSION: '4.3.5',
    SUPPORTED_PLATFORMS: ['amazon', 'aliexpress', 'alibaba', 'temu', 'shein', 'shopify', 'ebay', 'etsy', 'walmart', 'cjdropshipping', 'banggood', 'dhgate', 'wish', 'gearbest', 'lightinthebox', 'cdiscount', 'fnac']
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
    
    // Shopify detection via meta tags (doesn't require page context)
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

  // ============================================
  // DATA EXTRACTION (Pure DOM - No Script Injection)
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

    // ASIN from URL or data attributes
    const asinMatch = window.location.href.match(/\/dp\/([A-Z0-9]+)/i) ||
                      window.location.href.match(/\/gp\/product\/([A-Z0-9]+)/i);
    data.asin = asinMatch?.[1] || document.querySelector('[data-asin]')?.dataset?.asin || '';

    // Price - multiple selectors for different layouts
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

    // Images - extract high-res versions
    const imageElements = document.querySelectorAll('#altImages img, #imageBlock img, .imgTagWrapper img, .a-dynamic-image');
    const imageSet = new Set();
    
    imageElements.forEach(img => {
      let src = img.src || img.dataset?.oldHires || '';
      if (src && !src.includes('sprite') && !src.includes('transparent') && !src.includes('grey-pixel')) {
        // Convert to high-res
        src = src.replace(/\._[A-Z]{2}\d+_\./, '._SL1500_.');
        src = src.replace(/\._S[XY]\d+_\./, '._SL1500_.');
        if (src.includes('images/I/') || src.includes('images-amazon.com')) {
          imageSet.add(src);
        }
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

    // Title
    const titleEl = document.querySelector('h1[data-pl="product-title"], .product-title-text, h1');
    data.title = titleEl?.textContent?.trim() || '';

    // Price
    const priceEl = document.querySelector('[class*="price--current"], .product-price-value, .uniform-banner-box-price');
    if (priceEl) {
      const priceMatch = priceEl.textContent?.match(/[\d,.]+/);
      data.price = priceMatch ? parseFloat(priceMatch[0].replace(',', '.')) : 0;
    }

    // Images
    const imageElements = document.querySelectorAll('.images-view-item img, .slider--img--item img, [class*="gallery"] img');
    const imageSet = new Set();
    
    imageElements.forEach(img => {
      let src = img.src || img.dataset?.src;
      if (src) {
        src = src.replace(/_\d+x\d+\./g, '_.');
        src = src.replace(/\.jpg_\d+x\d+\.jpg/g, '.jpg');
        if (src.startsWith('//')) src = 'https:' + src;
        if (src.includes('alicdn.com')) {
          imageSet.add(src);
        }
      }
    });
    
    data.images = Array.from(imageSet).slice(0, 10);

    // Rating
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

    // Temu has obfuscated classes, use flexible selectors
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

    // Try meta tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) data.title = ogTitle.content;

    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) data.images.push(ogImage.content);

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) data.description = ogDescription.content;

    return data;
  }

  // ============================================
  // UI CREATION (Pure DOM Manipulation - No CSP Issues)
  // ============================================
  function createImportButton() {
    // Remove existing button
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
      <span>Importer dans Drop Craft AI</span>
    `;
    
    Object.assign(button.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: '2147483647',
      padding: '14px 22px',
      backgroundColor: '#6366f1',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
      transition: 'all 0.2s ease'
    });

    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = '#4f46e5';
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.5)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = '#6366f1';
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 20px rgba(99, 102, 241, 0.4)';
    });

    button.addEventListener('click', handleImportClick);

    document.body.appendChild(button);
    console.log('[DropCraft] Import button created');
  }

  function updateButtonState(state, message) {
    const button = document.getElementById('dropcraft-import-btn');
    if (!button) return;

    const states = {
      loading: {
        html: `<span style="display:flex;align-items:center;"><span style="width:16px;height:16px;border:2px solid white;border-top-color:transparent;border-radius:50%;animation:dcSpin 1s linear infinite;margin-right:8px;"></span>${message || 'Import en cours...'}</span>`,
        bg: '#6366f1',
        disabled: true
      },
      success: {
        html: `<span style="display:flex;align-items:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:8px;"><polyline points="20,6 9,17 4,12"/></svg>${message || 'Importé !'}</span>`,
        bg: '#10b981',
        disabled: true
      },
      error: {
        html: `<span style="display:flex;align-items:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:8px;"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>${message || 'Erreur'}</span>`,
        bg: '#ef4444',
        disabled: false
      },
      idle: {
        html: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;flex-shrink:0;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><span>Importer dans Drop Craft AI</span>`,
        bg: '#6366f1',
        disabled: false
      }
    };

    const config = states[state] || states.idle;
    button.innerHTML = config.html;
    button.style.backgroundColor = config.bg;
    button.disabled = config.disabled;
    button.style.opacity = config.disabled ? '0.9' : '1';
    button.style.cursor = config.disabled ? 'wait' : 'pointer';
  }

  // Add CSS animation for spinner (injected as style element, not script)
  function addStyles() {
    if (document.getElementById('dropcraft-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'dropcraft-styles';
    style.textContent = `
      @keyframes dcSpin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  // ============================================
  // IMPORT HANDLER (Via Background Script - CSP Safe)
  // ============================================
  async function handleImportClick() {
    console.log('[DropCraft] Import clicked');
    updateButtonState('loading', 'Extraction...');

    try {
      // Extract product data from DOM (works in content script context)
      const productData = extractProductData();

      if (!productData.title) {
        throw new Error('Impossible d\'extraire les données du produit');
      }

      updateButtonState('loading', 'Import en cours...');

      // Send to background script for API call (background script can make any fetch)
      const response = await chrome.runtime.sendMessage({
        type: 'DC_IMPORT_PRODUCT',
        payload: {
          url: productData.source_url,
          productData: productData
        }
      });

      console.log('[DropCraft] Import response:', response);

      if (response?.success) {
        updateButtonState('success', 'Produit importé !');
        showToast('✅ Produit importé avec succès !', 'success');
      } else {
        throw new Error(response?.error || 'Erreur lors de l\'import');
      }

      // Reset after 3 seconds
      setTimeout(() => updateButtonState('idle'), 3000);

    } catch (error) {
      console.error('[DropCraft] Import error:', error);
      updateButtonState('error', error.message?.slice(0, 30) || 'Erreur');
      showToast(`❌ ${error.message}`, 'error');
      
      // Reset after 4 seconds
      setTimeout(() => updateButtonState('idle'), 4000);
    }
  }

  function showToast(message, type = 'info') {
    const existing = document.getElementById('dropcraft-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'dropcraft-toast';
    
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      info: '#6366f1'
    };

    Object.assign(toast.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: '2147483647',
      backgroundColor: colors[type] || colors.info,
      color: 'white',
      padding: '14px 20px',
      borderRadius: '10px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '14px',
      fontWeight: '500',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      animation: 'dcSlideIn 0.3s ease',
      maxWidth: '350px'
    });

    toast.textContent = message;
    document.body.appendChild(toast);

    // Add slide animations if not present
    if (!document.getElementById('dropcraft-toast-styles')) {
      const toastStyle = document.createElement('style');
      toastStyle.id = 'dropcraft-toast-styles';
      toastStyle.textContent = `
        @keyframes dcSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes dcSlideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(toastStyle);
    }

    setTimeout(() => {
      toast.style.animation = 'dcSlideOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // ============================================
  // INITIALIZATION
  // ============================================
  function init() {
    const platform = detectPlatform();
    console.log('[DropCraft] Platform detected:', platform);

    if (platform === 'unknown') {
      console.log('[DropCraft] Unknown platform, not initializing');
      return;
    }

    addStyles();

    // Check if product page
    if (isProductPage()) {
      console.log('[DropCraft] Product page detected, adding import button');
      // Small delay to ensure DOM is fully loaded
      setTimeout(createImportButton, 500);
    } else {
      console.log('[DropCraft] Not a product page, waiting for navigation...');
    }

    // Watch for SPA navigation
    setupNavigationObserver();
  }

  function setupNavigationObserver() {
    let lastUrl = window.location.href;

    // URL change detection
    const checkUrlChange = () => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        console.log('[DropCraft] URL changed, re-checking...');
        setTimeout(() => {
          if (isProductPage()) {
            createImportButton();
          } else {
            const btn = document.getElementById('dropcraft-import-btn');
            if (btn) btn.remove();
          }
        }, 1000);
      }
    };

    // Listen for history changes
    window.addEventListener('popstate', checkUrlChange);
    
    // Intercept pushState/replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      checkUrlChange();
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      checkUrlChange();
    };

    // Also observe DOM for dynamic content loading
    let debounceTimer = null;
    const observer = new MutationObserver(() => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (isProductPage() && !document.getElementById('dropcraft-import-btn')) {
          console.log('[DropCraft] Dynamic content detected, adding button');
          createImportButton();
        }
      }, 800);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Start initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('[DropCraft] Content script v4.3.5 loaded successfully');

})();
