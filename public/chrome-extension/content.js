// ============================================
// ShopOpti+ Chrome Extension - Content Script v5.0.0
// SECURITY HARDENED - XSS Prevention, Safe DOM
// Modular Platform Detection for 30+ Platforms
// ============================================

(function () {
  'use strict';

  // Prevent multiple injections
  if (window.__shopOptiCSVersion === '5.0.0') return;
  window.__shopOptiCSVersion = '5.0.0';

  console.log('[ShopOpti+] Content script v5.0.0 initializing...');

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
      const dangerousAttrs = ['innerHTML', 'outerHTML'];
      
      for (const [key, value] of Object.entries(attributes)) {
        if (key.startsWith('on') || dangerousAttrs.includes(key)) {
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
    }
  };

  // ============================================
  // DEBOUNCE UTILITY
  // ============================================
  function debounce(fn, wait = 350) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  // ============================================
  // WAIT FOR OVERLAY V2 TO LOAD
  // ============================================
  function waitForOverlay(timeout = 5000) {
    return new Promise((resolve, reject) => {
      if (window.AdvancedImportOverlay) {
        resolve();
        return;
      }
      
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (window.AdvancedImportOverlay) {
          clearInterval(checkInterval);
          resolve();
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error('Import overlay failed to load'));
        }
      }, 100);
    });
  }

  // ============================================
  // CHROME RUNTIME SAFETY
  // ============================================
  function isChromeRuntimeAvailable() {
    try {
      return !!(typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id);
    } catch (e) {
      return false;
    }
  }

  async function safeSendMessage(message) {
    if (!isChromeRuntimeAvailable()) {
      throw new Error('Extension déconnectée. Rechargez la page (F5).');
    }
    
    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
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
    VERSION: '5.0.0',
    BRAND: 'ShopOpti+',
    PLATFORMS: [
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
      'boulanger': 'boulanger', 'leroymerlin': 'leroymerlin', 'myshopify': 'shopify'
    };
    
    for (const [key, platform] of Object.entries(platformMap)) {
      if (hostname.includes(key)) return platform;
    }
    
    // Shopify detection via meta/global
    if (document.querySelector('meta[name="shopify-checkout-api-token"]') ||
        document.querySelector('link[href*="cdn.shopify.com"]') ||
        window.Shopify) {
      return 'shopify';
    }
    
    return 'unknown';
  }

  // ============================================
  // PAGE TYPE DETECTION
  // ============================================
  function isProductPage() {
    const url = window.location.href;
    const platform = detectPlatform();
    
    const patterns = {
      amazon: /\/(dp|gp\/product)\/[A-Z0-9]+/i,
      aliexpress: /\/item\/|\/i\/|\/_p\//i,
      temu: /\/[a-z0-9_-]+-g-\d+\.html|goods\.html/i,
      shein: /\/-p-\d+\.html/i,
      ebay: /\/itm\/\d+|\/p\/\d+/i,
      etsy: /\/listing\//i,
      walmart: /\/ip\/\d+/i,
      shopify: /\/products\//i,
      cdiscount: /\/f-\d+-[a-z0-9]+\.html|\/fp\/|\/dp\//i,
      fnac: /\/a\d+\//i,
      rakuten: /\/product\//i
    };
    
    if (patterns[platform]?.test(url)) return true;
    
    // Generic detection
    const hasTitle = !!document.querySelector('h1, [itemprop="name"]');
    const hasPrice = !!document.querySelector('[itemprop="price"], .price, [class*="price"]');
    
    return hasTitle && hasPrice;
  }

  function isListingPage() {
    const url = window.location.href;
    const platform = detectPlatform();
    
    const patterns = {
      amazon: /\/gp\/bestsellers|\/s\?|\/b\?|keywords=/i,
      aliexpress: /\/category\/|\/wholesale|SearchText=/i,
      temu: /\/channel\/|\/search_result/i,
      shein: /\/category\/|pdsearch/i,
      ebay: /\/b\/|\/sch\//i,
      walmart: /\/search\/|\/browse\//i,
      etsy: /\/search\?|\/c\//i,
      cdiscount: /\/search|\/browse|\/l-\d+/i
    };
    
    if (patterns[platform]?.test(url)) return true;
    
    // Universal product card detection
    const cardSelectors = [
      '[data-asin]:not([data-asin=""])', '.s-result-item',
      '[class*="product-card"]', '[data-product-id]',
      '.product-item', '.listing-card'
    ];
    
    for (const sel of cardSelectors) {
      if (document.querySelectorAll(sel).length >= 3) return true;
    }
    
    return false;
  }

  // ============================================
  // BUTTON INJECTION
  // ============================================
  function injectImportButton() {
    if (document.querySelector('.shopopti-import-btn')) return;
    if (!isProductPage()) return;
    
    const platform = detectPlatform();
    console.log('[ShopOpti+] Injecting button for platform:', platform);
    
    // Create button container
    const container = Security.createElement('div', {
      className: 'shopopti-import-container',
      style: {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: '2147483647',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }
    });
    
    // Main import button
    const btn = Security.createElement('button', {
      className: 'shopopti-import-btn',
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '14px 24px',
        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '14px',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(255,255,255,0.1) inset',
        transition: 'all 0.3s ease'
      }
    }, '⚡ Import ShopOpti+');
    
    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(-2px) scale(1.02)';
      btn.style.boxShadow = '0 12px 40px rgba(59, 130, 246, 0.5)';
    });
    
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translateY(0) scale(1)';
      btn.style.boxShadow = '0 8px 32px rgba(59, 130, 246, 0.4)';
    });
    
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      const originalText = btn.textContent;
      btn.textContent = '⏳ Chargement...';
      
      try {
        // Extract product data first
        const productData = await extractProductData();
        
        // Open Advanced Import Overlay V2
        if (window.AdvancedImportOverlay) {
          const overlay = new window.AdvancedImportOverlay();
          overlay.open(productData);
          btn.textContent = originalText;
          btn.disabled = false;
        } else {
          // Fallback: request background to inject overlay
          const response = await safeSendMessage({
            type: 'OPEN_IMPORT_OVERLAY',
            url: window.location.href,
            productData
          });
          
          if (response?.success) {
            // Wait for overlay script to load then open
            await waitForOverlay();
            const overlay = new window.AdvancedImportOverlay();
            overlay.open(productData);
            btn.textContent = originalText;
            btn.disabled = false;
          } else {
            throw new Error(response?.error || 'Failed to open import assistant');
          }
        }
      } catch (error) {
        console.error('[ShopOpti+] Import error:', error);
        btn.textContent = '✗ Erreur';
        btn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        
        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)';
          btn.disabled = false;
        }, 2000);
      }
    });
    
    container.appendChild(btn);
    document.body.appendChild(container);
    
    console.log('[ShopOpti+] Import button injected successfully');
  }

  function injectListingButtons() {
    if (!isListingPage()) return;
    
    const platform = detectPlatform();
    
    const cardSelectors = {
      amazon: '[data-asin]:not([data-asin=""]):not(.shopopti-processed)',
      aliexpress: '.list-item:not(.shopopti-processed), [class*="product-card"]:not(.shopopti-processed)',
      cdiscount: '.prdtBloc:not(.shopopti-processed), .lpProduct:not(.shopopti-processed)',
      ebay: '.s-item:not(.shopopti-processed)',
      default: '[data-product-id]:not(.shopopti-processed), .product-card:not(.shopopti-processed)'
    };
    
    const selector = cardSelectors[platform] || cardSelectors.default;
    const cards = document.querySelectorAll(selector);
    
    let injectedCount = 0;
    
    cards.forEach(card => {
      card.classList.add('shopopti-processed');
      
      // Find a good position for the button
      const buttonContainer = card.querySelector('.s-item__info, .product-info, .prdtBILTit') || card;
      
      const btn = Security.createElement('button', {
        className: 'shopopti-card-btn',
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '6px 12px',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: '600',
          cursor: 'pointer',
          marginTop: '8px',
          opacity: '1',
          transition: 'all 0.2s'
        }
      }, '⚡ Import');
      
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Get product URL from card
        const link = card.querySelector('a[href*="/dp/"], a[href*="/item/"], a[href*="/itm/"], a[href*="/products/"]');
        if (!link) {
          alert('Impossible de trouver le lien du produit');
          return;
        }
        
        btn.textContent = '⏳...';
        btn.disabled = true;
        
        try {
          const response = await safeSendMessage({
            type: 'IMPORT_FROM_URL',
            url: link.href
          });
          
          if (response?.success) {
            btn.textContent = '✓';
            btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
          } else {
            throw new Error(response?.error);
          }
        } catch (error) {
          btn.textContent = '✗';
          btn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        }
        
        setTimeout(() => {
          btn.textContent = '⚡ Import';
          btn.style.background = 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
          btn.disabled = false;
        }, 2000);
      });
      
      buttonContainer.appendChild(btn);
      injectedCount++;
    });
    
    if (injectedCount > 0) {
      console.log('[ShopOpti+] Injected', injectedCount, 'listing buttons');
    }
  }

  // ============================================
  // DATA EXTRACTION
  // ============================================
  async function extractProductData() {
    const platform = detectPlatform();
    console.log('[ShopOpti+] Extracting data for:', platform);
    
    const data = {
      title: '',
      price: 0,
      currency: 'EUR',
      description: '',
      images: [],
      variants: [],
      rating: null,
      reviews_count: 0,
      sku: '',
      brand: '',
      platform,
      source_url: window.location.href,
      extracted_at: new Date().toISOString()
    };

    // Try JSON-LD first
    const jsonLD = extractFromJsonLD();
    if (jsonLD.title) {
      Object.assign(data, jsonLD);
    } else {
      // Platform-specific extraction
      const extracted = extractFromDOM(platform);
      Object.assign(data, extracted);
    }
    
    return data;
  }

  function extractFromJsonLD() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    
    for (const script of scripts) {
      try {
        const json = JSON.parse(script.textContent);
        const items = Array.isArray(json) ? json : [json];
        
        for (const item of items) {
          if (item['@type'] === 'Product') {
            const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
            
            return {
              title: Security.sanitizeText(item.name || ''),
              description: Security.sanitizeText(item.description || ''),
              price: parseFloat(offers?.price) || 0,
              currency: offers?.priceCurrency || 'EUR',
              sku: item.sku || item.productID || '',
              brand: typeof item.brand === 'string' ? item.brand : item.brand?.name || '',
              images: Array.isArray(item.image) ? item.image : [item.image].filter(Boolean),
              rating: item.aggregateRating?.ratingValue || null,
              reviews_count: item.aggregateRating?.reviewCount || 0
            };
          }
        }
      } catch (e) {}
    }
    
    return {};
  }

  function extractFromDOM(platform) {
    const data = {};
    
    // Title
    const titleSelectors = {
      amazon: '#productTitle',
      aliexpress: 'h1[data-pl="product-title"], .product-title',
      cdiscount: '.fpDesCol h1, [itemprop="name"]',
      ebay: 'h1.x-item-title__mainTitle',
      default: 'h1, [itemprop="name"]'
    };
    
    const titleEl = document.querySelector(titleSelectors[platform] || titleSelectors.default);
    data.title = Security.sanitizeText(titleEl?.textContent?.trim() || '');
    
    // Price
    const priceSelectors = {
      amazon: '.a-price .a-offscreen, #priceblock_ourprice',
      aliexpress: '[class*="price-current"], .product-price',
      cdiscount: '.fpPrice, [itemprop="price"]',
      ebay: '[data-testid="x-price-primary"]',
      default: '[itemprop="price"], .price'
    };
    
    const priceEl = document.querySelector(priceSelectors[platform] || priceSelectors.default);
    if (priceEl) {
      const priceText = priceEl.textContent || priceEl.getAttribute('content') || '';
      const match = priceText.match(/[\d,.]+/);
      if (match) {
        data.price = parseFloat(match[0].replace(',', '.'));
      }
    }
    
    // Images with deduplication
    const imageSelectors = {
      amazon: '#altImages img, #imageBlock img',
      aliexpress: '[class*="slider"] img, [class*="gallery"] img',
      cdiscount: '.fpImgLnk img, .fpGalImg img',
      ebay: '.ux-image-carousel img',
      default: '.product-gallery img, .product-image img'
    };
    
    const seenHashes = new Set();
    const images = [];
    
    document.querySelectorAll(imageSelectors[platform] || imageSelectors.default).forEach(img => {
      let src = img.dataset?.oldHires || img.dataset?.src || img.src;
      if (!src || src.includes('sprite') || src.includes('placeholder') || src.includes('grey-pixel')) return;
      
      // Normalize URL
      if (src.includes('amazon')) {
        src = src.replace(/\._[A-Z]{2}\d+_\./, '._SL1500_.');
      }
      src = src.replace(/\?.*$/, '');
      if (src.startsWith('//')) src = 'https:' + src;
      
      // Deduplication
      const hash = src.match(/\/([A-Z0-9]{10,})[\._]/i)?.[1] || src.slice(-50);
      if (!seenHashes.has(hash) && src.includes('http')) {
        seenHashes.add(hash);
        images.push(src);
      }
    });
    
    data.images = images.slice(0, 50);
    
    return data;
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
      extractProductData().then(data => {
        sendResponse({ success: true, data });
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      return true;
    }
    
    if (message.type === 'EXTRACT_COMPLETE') {
      // Use core extractor if available
      if (window.ShopOptiCoreExtractor) {
        const extractor = new window.ShopOptiCoreExtractor();
        extractor.extractComplete().then(data => {
          sendResponse({ success: true, data });
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
      } else {
        extractProductData().then(data => {
          sendResponse({ success: true, data });
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
      }
      return true;
    }
    
    // Handle overlay script injection confirmation
    if (message.type === 'OVERLAY_SCRIPT_INJECTED') {
      console.log('[ShopOpti+] Import overlay V2 script injected');
      sendResponse({ success: true });
      return true;
    }
    
    // Handle opening overlay with pre-extracted data
    if (message.type === 'OPEN_OVERLAY_WITH_DATA') {
      waitForOverlay().then(() => {
        const overlay = new window.AdvancedImportOverlay();
        overlay.open(message.productData);
        sendResponse({ success: true });
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      return true;
    }
    
    return false;
  });

  // ============================================
  // MUTATION OBSERVER (Debounced)
  // ============================================
  const debouncedInject = debounce(() => {
    injectImportButton();
    injectListingButtons();
  }, 500);

  const observer = new MutationObserver(debouncedInject);
  
  function startObserver() {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // ============================================
  // INITIALIZATION
  // ============================================
  function init() {
    const platform = detectPlatform();
    
    if (platform === 'unknown') {
      console.log('[ShopOpti+] Unknown platform, skipping injection');
      return;
    }
    
    console.log('[ShopOpti+] Detected platform:', platform);
    
    // Initial injection
    injectImportButton();
    injectListingButtons();
    
    // Start observer for dynamic content
    startObserver();
    
    // Retry injection for SPAs
    let retries = 0;
    const retryInterval = setInterval(() => {
      if (retries >= 10 || document.querySelector('.shopopti-import-btn')) {
        clearInterval(retryInterval);
        return;
      }
      injectImportButton();
      retries++;
    }, 1000);
  }

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
