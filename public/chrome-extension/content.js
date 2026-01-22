// Drop Craft AI Chrome Extension - Content Script v4.3.2
// Professional Dropshipping Extension - CSP-Safe Version

// CRITICAL: This version uses message passing instead of script injection
// to work on sites with strict Content Security Policies (Amazon, etc.)

(function () {
  'use strict';

  // Prevent multiple injections
  if (window.__dropCraftContentScriptLoaded) return;
  window.__dropCraftContentScriptLoaded = true;

  console.log('[DropCraft] Content script v4.3.2 initializing...');

  class DropCraftContentScript {
    constructor() {
      this.isActive = false;
      this.scrapingIndicator = null;
      this.mutationObserver = null;
      this.lastInjectedAt = 0;
      this.init();
    }

    init() {
      this.setupMessageListener();
      this.setupPageMessageRelay();
      this.injectStyles();
      this.setupAutoDetection();
      this.setupDynamicContentObserver();
      
      // CSP-Safe: Use inline injection for core functionality
      this.injectCoreModules();
    }

    // NEW: Relay messages from page context to background script (CSP bypass)
    setupPageMessageRelay() {
      window.addEventListener('message', async (event) => {
        if (event.source !== window) return;
        
        const data = event.data;
        if (!data || typeof data !== 'object') return;

        // Handle fetch requests from page scripts (CSP bypass)
        if (data.type === 'DC_FETCH_API') {
          try {
            const result = await chrome.runtime.sendMessage({
              type: 'FETCH_API',
              url: data.url,
              options: data.options
            });
            
            window.postMessage({
              type: 'DC_FETCH_API_RESULT',
              requestId: data.requestId,
              success: result?.success ?? false,
              status: result?.status ?? 0,
              data: result?.data,
              error: result?.error
            }, '*');
          } catch (err) {
            window.postMessage({
              type: 'DC_FETCH_API_RESULT',
              requestId: data.requestId,
              success: false,
              status: 0,
              error: err.message
            }, '*');
          }
        }

        // Handle import requests from page
        if (data.type === 'DC_IMPORT_PRODUCT') {
          try {
            const result = await chrome.runtime.sendMessage({
              type: 'IMPORT_PRODUCT',
              product: data.product
            });
            
            window.postMessage({
              type: 'DC_IMPORT_RESULT',
              requestId: data.requestId,
              ...result
            }, '*');
          } catch (err) {
            window.postMessage({
              type: 'DC_IMPORT_RESULT',
              requestId: data.requestId,
              success: false,
              error: err.message
            }, '*');
          }
        }

        // Handle token requests
        if (data.type === 'DC_GET_TOKEN') {
          chrome.storage.local.get(['extensionToken'], (result) => {
            window.postMessage({
              type: 'DC_TOKEN_RESULT',
              requestId: data.requestId,
              token: result.extensionToken || null
            }, '*');
          });
        }

        // Handle storage requests
        if (data.type === 'DC_GET_STORAGE') {
          chrome.storage.local.get(data.keys || null, (result) => {
            window.postMessage({
              type: 'DC_STORAGE_RESULT',
              requestId: data.requestId,
              data: result
            }, '*');
          });
        }

        // Handle storage set requests
        if (data.type === 'DC_SET_STORAGE') {
          chrome.storage.local.set(data.data, () => {
            window.postMessage({
              type: 'DC_STORAGE_SET_RESULT',
              requestId: data.requestId,
              success: true
            }, '*');
          });
        }
      });

      console.log('[DropCraft] Page message relay initialized');
    }

    // CSP-Safe: Inject core modules using inline script with data
    injectCoreModules() {
      // Inject the unified module that works in page context
      const script = document.createElement('script');
      script.textContent = this.getCoreModuleCode();
      (document.head || document.documentElement).appendChild(script);
      script.remove();
      
      console.log('[DropCraft] Core modules injected');
    }

    getCoreModuleCode() {
      // This code runs in the page context and handles all extraction/UI
      return `
(function() {
  'use strict';
  
  if (window.__dropCraftCoreLoaded) return;
  window.__dropCraftCoreLoaded = true;
  
  console.log('[DropCraft] Core module v4.3.2 loaded');
  
  const CONFIG = {
    API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
    APP_URL: 'https://shopopti.io',
    PLATFORMS: {
      'aliexpress': { name: 'AliExpress', icon: '🛒', color: '#ff6a00' },
      'amazon': { name: 'Amazon', icon: '📦', color: '#ff9900' },
      'ebay': { name: 'eBay', icon: '🏷️', color: '#e53238' },
      'temu': { name: 'Temu', icon: '🎁', color: '#f97316' },
      'walmart': { name: 'Walmart', icon: '🏪', color: '#0071ce' },
      'etsy': { name: 'Etsy', icon: '🎨', color: '#f56400' },
      'cdiscount': { name: 'Cdiscount', icon: '🇫🇷', color: '#00a0e3' },
      'fnac': { name: 'Fnac', icon: '📀', color: '#e1a400' },
      'banggood': { name: 'Banggood', icon: '📱', color: '#ff6600' },
      'dhgate': { name: 'DHgate', icon: '🏭', color: '#e54d00' },
      'shein': { name: 'Shein', icon: '👗', color: '#000' }
    }
  };

  // ========== CSP-Safe Network Layer ==========
  const dcRPC = async (type, payload) => {
    const requestId = 'dc_' + Date.now() + '_' + Math.random().toString(16).slice(2);
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        window.removeEventListener('message', handler);
        reject(new Error('RPC timeout'));
      }, 20000);
      
      const handler = (event) => {
        if (event.source !== window) return;
        const data = event.data;
        if (!data || data.requestId !== requestId) return;
        
        clearTimeout(timeout);
        window.removeEventListener('message', handler);
        resolve(data);
      };
      
      window.addEventListener('message', handler);
      window.postMessage({ type, requestId, ...payload }, '*');
    });
  };

  const dcFetch = async (url, options) => {
    // Try direct fetch first
    try {
      const res = await fetch(url, options);
      const data = res.headers.get('content-type')?.includes('json') 
        ? await res.json() 
        : await res.text();
      return { ok: res.ok, status: res.status, data };
    } catch (e) {
      console.log('[DropCraft] Direct fetch failed, using proxy');
    }
    
    // Fall back to background proxy
    try {
      const result = await dcRPC('DC_FETCH_API', { url, options });
      return {
        ok: result.success,
        status: result.status || 0,
        data: result.data,
        error: result.error
      };
    } catch (e) {
      return { ok: false, status: 0, error: e.message };
    }
  };

  const getToken = async () => {
    try {
      const result = await dcRPC('DC_GET_TOKEN', {});
      return result.token;
    } catch {
      return null;
    }
  };

  // ========== Platform Detection ==========
  const detectPlatform = () => {
    const hostname = location.hostname.toLowerCase();
    for (const [key, info] of Object.entries(CONFIG.PLATFORMS)) {
      if (hostname.includes(key)) {
        return { key, ...info };
      }
    }
    if (document.querySelector('meta[name="generator"][content*="Shopify"]')) {
      return { key: 'shopify', name: 'Shopify', icon: '🛍️', color: '#96bf48' };
    }
    return null;
  };

  // ========== Product Extraction ==========
  const extractProduct = async () => {
    const platform = detectPlatform();
    if (!platform) return null;
    
    console.log('[DropCraft] Extracting product from', platform.name);
    
    let product = {
      title: '',
      description: '',
      price: 0,
      currency: 'EUR',
      images: [],
      variants: [],
      source_url: location.href,
      platform: platform.name
    };
    
    // Try JSON-LD first
    const jsonLd = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of jsonLd) {
      try {
        const data = JSON.parse(script.textContent);
        const prod = data['@type'] === 'Product' ? data : 
                    data['@graph']?.find(i => i['@type'] === 'Product');
        if (prod) {
          product.title = prod.name || product.title;
          product.description = prod.description || '';
          product.price = parseFloat(prod.offers?.price || prod.offers?.[0]?.price) || 0;
          product.currency = prod.offers?.priceCurrency || 'EUR';
          product.images = Array.isArray(prod.image) ? prod.image : [prod.image].filter(Boolean);
          product.brand = prod.brand?.name || prod.brand;
          product.rating = prod.aggregateRating?.ratingValue;
          product.reviews_count = prod.aggregateRating?.reviewCount;
        }
      } catch {}
    }
    
    // Platform-specific fallbacks
    if (!product.title) {
      product.title = 
        document.querySelector('h1')?.textContent?.trim() ||
        document.querySelector('[data-testid*="title"]')?.textContent?.trim() ||
        document.querySelector('.product-title, .pdp-title, #productTitle')?.textContent?.trim() ||
        document.title.split(' - ')[0].split(' | ')[0];
    }
    
    // Extract images if not found
    if (product.images.length === 0) {
      product.images = extractImages();
    }
    
    // Extract price if not found
    if (!product.price) {
      product.price = extractPrice();
    }
    
    return product;
  };

  const extractImages = () => {
    const images = new Set();
    
    // High-res strategies
    const selectors = [
      'img[src*="x-large"], img[data-src*="x-large"]',
      'img[src*="_AC_SL"], img[data-src*="_AC_SL"]',  // Amazon
      '.gallery img, .image-gallery img',
      '[class*="thumbnail"] img',
      'img[srcset]',
      '.pdp-image img, .product-image img'
    ];
    
    for (const sel of selectors) {
      document.querySelectorAll(sel).forEach(img => {
        let src = img.src || img.dataset.src || img.dataset.zoomImage;
        if (!src) {
          // Try srcset
          const srcset = img.srcset || img.dataset.srcset;
          if (srcset) {
            const largest = srcset.split(',').pop()?.trim().split(' ')[0];
            if (largest) src = largest;
          }
        }
        if (src && src.startsWith('http') && !src.includes('sprite') && !src.includes('icon')) {
          // Clean up Amazon URLs
          src = src.replace(/\\._.*_\\./, '._AC_SL1500_.');
          images.add(src);
        }
      });
      if (images.size >= 10) break;
    }
    
    return [...images].slice(0, 15);
  };

  const extractPrice = () => {
    const pricePatterns = [
      /([\\d\\s]+[,.]\\d{2})\\s*[€$£]/,
      /[€$£]\\s*([\\d\\s]+[,.]\\d{2})/,
      /price["\\'\\s:]+([\\d.]+)/i
    ];
    
    const priceSelectors = [
      '[class*="price" i] .a-price-whole',
      '[class*="price" i]',
      '[data-price]',
      '.product-price',
      '#priceblock_ourprice',
      '#priceblock_dealprice'
    ];
    
    for (const sel of priceSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = el.textContent || el.dataset.price || '';
        for (const pattern of pricePatterns) {
          const match = text.match(pattern);
          if (match) {
            return parseFloat(match[1].replace(/\\s/g, '').replace(',', '.'));
          }
        }
        const numMatch = text.match(/([\\d.,]+)/);
        if (numMatch) {
          return parseFloat(numMatch[1].replace(/\\s/g, '').replace(',', '.'));
        }
      }
    }
    
    return 0;
  };

  // ========== UI Components ==========
  const createImportButton = () => {
    const existingBtn = document.querySelector('.dc-import-main-btn');
    if (existingBtn) return;
    
    const platform = detectPlatform();
    if (!platform) return;
    
    const btn = document.createElement('button');
    btn.className = 'dc-import-main-btn';
    btn.innerHTML = \`
      <span class="dc-btn-icon">🚀</span>
      <span class="dc-btn-text">Importer dans Drop Craft AI</span>
    \`;
    btn.style.cssText = \`
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 14px 24px;
      border-radius: 50px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 20px rgba(102,126,234,0.4);
      transition: all 0.3s ease;
    \`;
    
    btn.onmouseenter = () => {
      btn.style.transform = 'translateY(-2px) scale(1.02)';
      btn.style.boxShadow = '0 6px 30px rgba(102,126,234,0.5)';
    };
    btn.onmouseleave = () => {
      btn.style.transform = '';
      btn.style.boxShadow = '0 4px 20px rgba(102,126,234,0.4)';
    };
    
    btn.onclick = handleImport;
    document.body.appendChild(btn);
    
    console.log('[DropCraft] Import button injected');
  };

  const showToast = (message, type = 'info') => {
    const existing = document.querySelector('.dc-toast');
    if (existing) existing.remove();
    
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      info: '#667eea',
      warning: '#f59e0b'
    };
    
    const toast = document.createElement('div');
    toast.className = 'dc-toast';
    toast.style.cssText = \`
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999999;
      background: \${colors[type] || colors.info};
      color: white;
      padding: 14px 20px;
      border-radius: 10px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      animation: dcSlideIn 0.3s ease;
      max-width: 350px;
    \`;
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'dcSlideOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  };

  // Add animation styles
  const style = document.createElement('style');
  style.textContent = \`
    @keyframes dcSlideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes dcSlideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    @keyframes dcPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
  \`;
  document.head.appendChild(style);

  // ========== Import Handler ==========
  const handleImport = async () => {
    const btn = document.querySelector('.dc-import-main-btn');
    if (btn) {
      btn.innerHTML = '<span class="dc-btn-icon" style="animation: dcPulse 1s infinite">⏳</span><span class="dc-btn-text">Import en cours...</span>';
      btn.disabled = true;
    }
    
    try {
      // Get token
      const token = await getToken();
      if (!token) {
        showToast('❌ Non connecté - Connectez-vous d\\'abord via la popup', 'error');
        if (btn) {
          btn.innerHTML = '<span class="dc-btn-icon">🚀</span><span class="dc-btn-text">Importer dans Drop Craft AI</span>';
          btn.disabled = false;
        }
        return;
      }
      
      // Extract product
      const product = await extractProduct();
      if (!product || !product.title) {
        showToast('❌ Produit non détecté sur cette page', 'error');
        if (btn) {
          btn.innerHTML = '<span class="dc-btn-icon">🚀</span><span class="dc-btn-text">Importer dans Drop Craft AI</span>';
          btn.disabled = false;
        }
        return;
      }
      
      console.log('[DropCraft] Importing product:', product.title);
      
      // Send to API via proxy
      const response = await dcFetch(CONFIG.API_URL + '/extension-sync-realtime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': token
        },
        body: JSON.stringify({
          action: 'import_products',
          products: [{
            title: product.title,
            name: product.title,
            description: product.description || '',
            price: product.price || 0,
            currency: product.currency || 'EUR',
            image_urls: product.images || [],
            source_url: product.source_url,
            platform: product.platform,
            brand: product.brand,
            rating: product.rating,
            reviews_count: product.reviews_count,
            variants: product.variants || []
          }]
        })
      });
      
      if (response.ok && response.data?.success) {
        showToast('✅ Produit importé avec succès !', 'success');
        if (btn) {
          btn.innerHTML = '<span class="dc-btn-icon">✅</span><span class="dc-btn-text">Importé !</span>';
          setTimeout(() => {
            btn.innerHTML = '<span class="dc-btn-icon">🚀</span><span class="dc-btn-text">Importer dans Drop Craft AI</span>';
            btn.disabled = false;
          }, 3000);
        }
      } else {
        const errorMsg = response.data?.error || response.error || 'Erreur inconnue';
        console.error('[DropCraft] Import failed:', errorMsg);
        showToast('❌ ' + errorMsg, 'error');
        if (btn) {
          btn.innerHTML = '<span class="dc-btn-icon">❌</span><span class="dc-btn-text">Erreur - Réessayer</span>';
          setTimeout(() => {
            btn.innerHTML = '<span class="dc-btn-icon">🚀</span><span class="dc-btn-text">Importer dans Drop Craft AI</span>';
            btn.disabled = false;
          }, 3000);
        }
      }
    } catch (error) {
      console.error('[DropCraft] Import error:', error);
      showToast('❌ Erreur: ' + error.message, 'error');
      if (btn) {
        btn.innerHTML = '<span class="dc-btn-icon">🚀</span><span class="dc-btn-text">Importer dans Drop Craft AI</span>';
        btn.disabled = false;
      }
    }
  };

  // ========== Initialization ==========
  const init = () => {
    const platform = detectPlatform();
    if (platform) {
      console.log('[DropCraft] Platform detected:', platform.name);
      
      // Inject import button after page loads
      if (document.readyState === 'complete') {
        createImportButton();
      } else {
        window.addEventListener('load', createImportButton);
      }
      
      // Also try after a delay for SPAs
      setTimeout(createImportButton, 2000);
    }
  };

  init();
})();
      `;
    }

    setupDynamicContentObserver() {
      let debounceTimer = null;
      const DEBOUNCE_MS = 1000;
      const MIN_INTERVAL_MS = 5000;

      this.mutationObserver = new MutationObserver((mutations) => {
        let significantChange = false;
        
        for (const mutation of mutations) {
          if (mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node;
                if (el.matches?.('[class*="product"], [class*="gallery"], [class*="carousel"]') ||
                    el.querySelector?.('[class*="product"], [class*="gallery"]')) {
                  significantChange = true;
                  break;
                }
              }
            }
          }
          if (significantChange) break;
        }

        if (significantChange) {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            const now = Date.now();
            if (now - this.lastInjectedAt > MIN_INTERVAL_MS) {
              this.lastInjectedAt = now;
              console.log('[DropCraft] Dynamic content detected, re-scanning...');
            }
          }, DEBOUNCE_MS);
        }
      });

      this.mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
      });

      // URL change detection for SPAs
      let lastUrl = window.location.href;
      const urlObserver = new MutationObserver(() => {
        if (window.location.href !== lastUrl) {
          lastUrl = window.location.href;
          console.log('[DropCraft] URL changed, re-initializing...');
          setTimeout(() => this.injectCoreModules(), 1500);
        }
      });
      urlObserver.observe(document, { subtree: true, childList: true });
    }

    setupMessageListener() {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        this.handleMessage(message, sender, sendResponse);
        return true;
      });
    }

    handleMessage(message, sender, sendResponse) {
      switch (message.type) {
        case 'SCRAPE_PAGE':
          this.scrapePage().then(sendResponse);
          break;
          
        case 'GET_PAGE_INFO':
          sendResponse(this.getPageInfo());
          break;
          
        case 'INJECT_ONE_CLICK_BUTTONS':
          this.injectCoreModules();
          sendResponse({ success: true });
          break;
          
        default:
          sendResponse({ success: true });
      }
    }

    injectStyles() {
      const style = document.createElement('style');
      style.textContent = `
        .dropcraft-highlight {
          outline: 2px solid #667eea !important;
          outline-offset: 2px !important;
          background: rgba(102, 126, 234, 0.1) !important;
          transition: all 0.3s ease !important;
        }
        
        .dropcraft-highlight:hover {
          outline-color: #764ba2 !important;
          background: rgba(118, 75, 162, 0.2) !important;
        }
        
        .dropcraft-indicator {
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 20px;
          border-radius: 25px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 14px;
          font-weight: 500;
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
          z-index: 10000;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .dropcraft-indicator:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(102, 126, 234, 0.4);
        }
      `;
      document.head.appendChild(style);
    }

    async scrapePage() {
      try {
        const products = await this.extractProducts();
        chrome.runtime.sendMessage({
          type: 'PRODUCTS_SCRAPED',
          products: products
        });
        return { success: true, count: products.length };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    async extractProducts() {
      // Basic extraction - full extraction happens in page context
      return [];
    }

    getPageInfo() {
      return {
        url: window.location.href,
        title: document.title,
        hostname: window.location.hostname
      };
    }

    setupAutoDetection() {
      // Auto-detection is now handled by the injected core module
    }
  }

  // Initialize
  new DropCraftContentScript();
  console.log('[DropCraft] Content script initialized');
})();
