// ============================================
// ShopOpti+ Chrome Extension - Content Script v5.2.0
// SECURITY HARDENED - XSS Prevention, Safe DOM
// Modular Platform Detection for 30+ Platforms
// Bulk Import V5 + Multi-Store Integration
// Enhanced Collection Page Detection
// ============================================

(function () {
  'use strict';

  // Prevent multiple injections
  if (window.__shopOptiCSVersion === '5.2.1') return;
  window.__shopOptiCSVersion = '5.2.1';

  console.log('[ShopOpti+] Content script v5.2.1 initializing...');

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
  // WAIT FOR MODULE TO LOAD
  // ============================================
  function waitForModule(moduleName, timeout = 5000) {
    return new Promise((resolve, reject) => {
      if (window[moduleName]) {
        resolve(window[moduleName]);
        return;
      }
      
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (window[moduleName]) {
          clearInterval(checkInterval);
          resolve(window[moduleName]);
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error(`Module ${moduleName} failed to load`));
        }
      }, 100);
    });
  }

  function waitForOverlay(timeout = 8000) {
    return new Promise((resolve, reject) => {
      if (window.AdvancedImportOverlay) {
        resolve(window.AdvancedImportOverlay);
        return;
      }
      
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (window.AdvancedImportOverlay) {
          clearInterval(checkInterval);
          resolve(window.AdvancedImportOverlay);
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          // Try to inject it manually
          injectOverlayScript().then(() => {
            if (window.AdvancedImportOverlay) {
              resolve(window.AdvancedImportOverlay);
            } else {
              reject(new Error('Module AdvancedImportOverlay failed to load'));
            }
          }).catch(reject);
        }
      }, 100);
    });
  }

  function waitForBulkImport(timeout = 8000) {
    return new Promise((resolve, reject) => {
      if (window.ShopOptiBulkImportV5) {
        resolve(window.ShopOptiBulkImportV5);
        return;
      }
      
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (window.ShopOptiBulkImportV5) {
          clearInterval(checkInterval);
          resolve(window.ShopOptiBulkImportV5);
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          // Try to inject it manually  
          injectBulkImportScript().then(() => {
            if (window.ShopOptiBulkImportV5) {
              resolve(window.ShopOptiBulkImportV5);
            } else {
              reject(new Error('Module ShopOptiBulkImportV5 failed to load'));
            }
          }).catch(reject);
        }
      }, 100);
    });
  }
  
  // Dynamic script injection helpers - simplified for content script context
  async function injectOverlayScript() {
    if (window.__shopoptiImportOverlayV2Loaded) return true;
    
    return new Promise((resolve, reject) => {
      try {
        // Request background to inject the script
        chrome.runtime.sendMessage({ type: 'INJECT_OVERLAY_SCRIPT' }, (response) => {
          if (chrome.runtime.lastError) {
            // Fallback: try direct injection via web_accessible_resources
            const scriptUrl = chrome.runtime.getURL('import-overlay-v2.js');
            const script = document.createElement('script');
            script.src = scriptUrl;
            script.onload = () => {
              console.log('[ShopOpti+] Import overlay V2 loaded via fallback');
              resolve(true);
            };
            script.onerror = () => reject(new Error('Failed to load import-overlay-v2.js'));
            document.head.appendChild(script);
          } else {
            resolve(response?.success || false);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }
  
  async function injectBulkImportScript() {
    if (window.__shopopti_bulk_v5_loaded) return true;
    
    return new Promise((resolve, reject) => {
      try {
        // Request background to inject the script
        chrome.runtime.sendMessage({ type: 'INJECT_BULK_SCRIPT' }, (response) => {
          if (chrome.runtime.lastError) {
            // Fallback: try direct injection via web_accessible_resources
            const scriptUrl = chrome.runtime.getURL('bulk-import-v5.js');
            const script = document.createElement('script');
            script.src = scriptUrl;
            script.onload = () => {
              console.log('[ShopOpti+] Bulk import V5 loaded via fallback');
              resolve(true);
            };
            script.onerror = () => reject(new Error('Failed to load bulk-import-v5.js'));
            document.head.appendChild(script);
          } else {
            resolve(response?.success || false);
          }
        });
      } catch (e) {
        reject(e);
      }
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
    VERSION: '5.2.1',
    BRAND: 'ShopOpti+',
    MAX_BULK_IMPORT: 100,
    PLATFORMS: [
      'amazon', 'aliexpress', 'alibaba', 'temu', 'shein', 'shopify', 
      'ebay', 'etsy', 'walmart', 'cjdropshipping', 'banggood', 'dhgate', 
      'wish', 'cdiscount', 'fnac', 'rakuten', 'costco', 'homedepot', 
      'lowes', 'target', 'bestbuy', 'wayfair', 'overstock', 'newegg',
      'zalando', 'asos', 'manomano', 'darty', 'boulanger', 'leroymerlin'
    ]
  };
  
  // Bulk selection state
  const BulkSelectionState = {
    selectedProducts: new Map(),
    isBulkMode: false,
    
    add(productId, data) {
      if (this.selectedProducts.size >= CONFIG.MAX_BULK_IMPORT) {
        console.warn(`[ShopOpti+] Max bulk selection reached (${CONFIG.MAX_BULK_IMPORT})`);
        return false;
      }
      this.selectedProducts.set(productId, data);
      this.updateUI();
      return true;
    },
    
    remove(productId) {
      this.selectedProducts.delete(productId);
      this.updateUI();
    },
    
    toggle(productId, data) {
      if (this.selectedProducts.has(productId)) {
        this.remove(productId);
      } else {
        this.add(productId, data);
      }
    },
    
    clear() {
      this.selectedProducts.clear();
      this.updateUI();
    },
    
    getAll() {
      return Array.from(this.selectedProducts.values());
    },
    
    count() {
      return this.selectedProducts.size;
    },
    
    updateUI() {
      // Update floating action bar
      const fab = document.querySelector('.shopopti-bulk-fab');
      if (fab) {
        const count = this.count();
        const countBadge = fab.querySelector('.shopopti-bulk-count');
        if (countBadge) {
          countBadge.textContent = count.toString();
          fab.style.display = count > 0 ? 'flex' : 'none';
        }
      }
      
      // Update selection indicators on cards
      document.querySelectorAll('.shopopti-select-checkbox').forEach(checkbox => {
        const productId = checkbox.dataset.productId;
        checkbox.checked = this.selectedProducts.has(productId);
      });
    }
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
    const pathname = window.location.pathname;
    const platform = detectPlatform();
    
    const patterns = {
      amazon: /\/gp\/bestsellers|\/s\?|\/s\/|\/b\?|\/b\/|keywords=|node=/i,
      aliexpress: /\/category\/|\/wholesale|SearchText=|\/af\//i,
      temu: /\/channel\/|\/search_result|\/category\//i,
      shein: /\/category\/|pdsearch|\/Women\/|\/Men\/|\/Kids\//i,
      ebay: /\/b\/|\/sch\/|_nkw=/i,
      walmart: /\/search\/|\/browse\/|\/cp\//i,
      etsy: /\/search\?|\/c\/|\/market\//i,
      cdiscount: /\/search|\/browse|\/l-\d+|\/c-\d+/i,
      fnac: /\/SearchResult|\/n\d+\//i,
      shopify: /\/collections\/|\/search\?|\/search\/|type=|vendor=/i
    };
    
    // Check URL patterns first
    if (patterns[platform]?.test(url)) {
      console.log('[ShopOpti+] Listing page detected via URL pattern for', platform);
      return true;
    }
    
    // Shopify collections detection
    if (platform === 'shopify') {
      if (pathname.includes('/collections/') || 
          pathname.includes('/search') ||
          document.querySelector('.collection-products, .product-grid, [data-collection]')) {
        console.log('[ShopOpti+] Shopify collection page detected');
        return true;
      }
    }
    
    // Universal product card detection - extended selectors
    const cardSelectors = [
      // Amazon
      '[data-asin]:not([data-asin=""])', '.s-result-item', '.a-section.a-spacing-base',
      // AliExpress
      '.search-item-card-wrapper-gallery', '[data-widget-type="search"]', '.product-snippet',
      // Shopify
      '.product-card', '.collection-product', '.grid__item.product', '[data-product-card]',
      '.product-grid-item', '.product-list-item', '.collection__products .product',
      // Generic
      '[class*="product-card"]', '[data-product-id]', '[data-product]',
      '.product-item', '.listing-card', '.goods-item', '.product-box'
    ];
    
    for (const sel of cardSelectors) {
      const count = document.querySelectorAll(sel).length;
      if (count >= 3) {
        console.log('[ShopOpti+] Listing page detected via', sel, '(', count, 'items)');
        return true;
      }
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
        
        // Try to inject and use overlay directly
        try {
          await injectOverlayScript();
          // Wait a bit for initialization
          await new Promise(r => setTimeout(r, 200));
        } catch (e) {
          console.log('[ShopOpti+] Overlay script injection attempt:', e.message);
        }
        
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
            await waitForOverlay(5000);
            if (window.AdvancedImportOverlay) {
              const overlay = new window.AdvancedImportOverlay();
              overlay.open(productData);
            }
            btn.textContent = originalText;
            btn.disabled = false;
          } else {
            throw new Error(response?.error || 'Impossible d\'ouvrir l\'assistant d\'import');
          }
        }
      } catch (error) {
        console.error('[ShopOpti+] Import error:', error);
        btn.textContent = '✗ Erreur';
        btn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        
        showToast(error.message || 'Erreur d\'import', 'error');
        
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
    
    // Inject bulk selection floating action bar
    injectBulkActionBar();
    
    const cardSelectors = {
      amazon: '[data-asin]:not([data-asin=""]):not(.shopopti-processed), .s-result-item:not(.shopopti-processed)',
      aliexpress: '.list-item:not(.shopopti-processed), [class*="product-card"]:not(.shopopti-processed), .product-snippet:not(.shopopti-processed), .search-item-card-wrapper-gallery:not(.shopopti-processed)',
      cdiscount: '.prdtBloc:not(.shopopti-processed), .lpProduct:not(.shopopti-processed), [data-productid]:not(.shopopti-processed)',
      temu: '[class*="goods-item"]:not(.shopopti-processed), [class*="ProductCard"]:not(.shopopti-processed)',
      shein: '[class*="product-item"]:not(.shopopti-processed), .S-product-item:not(.shopopti-processed)',
      ebay: '.s-item:not(.shopopti-processed):not(.s-item__pl-on-bottom)',
      shopify: '.product-card:not(.shopopti-processed), .grid__item:not(.shopopti-processed):has(a[href*="/products/"]), .collection-product:not(.shopopti-processed), [data-product-card]:not(.shopopti-processed), .product-grid-item:not(.shopopti-processed), .product-item:not(.shopopti-processed):has(a[href*="/products/"])',
      fnac: '.Article-item:not(.shopopti-processed), .product-list-item:not(.shopopti-processed)',
      default: '[data-product-id]:not(.shopopti-processed), .product-card:not(.shopopti-processed), [data-product]:not(.shopopti-processed)'
    };
    
    const selector = cardSelectors[platform] || cardSelectors.default;
    let cards = [];
    
    // Try platform-specific selector first
    try {
      cards = Array.from(document.querySelectorAll(selector));
    } catch (e) {
      // Fallback for browsers that don't support :has()
      cards = Array.from(document.querySelectorAll(cardSelectors.default));
    }
    
    // If no cards found with specific selector, try alternative detection for Shopify
    if (cards.length === 0 && platform === 'shopify') {
      const allLinks = document.querySelectorAll('a[href*="/products/"]:not(.shopopti-processed)');
      const processedParents = new Set();
      
      allLinks.forEach(link => {
        const productCard = link.closest('.product, .card, [class*="product"], [class*="grid__item"], article');
        if (productCard && !processedParents.has(productCard) && !productCard.classList.contains('shopopti-processed')) {
          processedParents.add(productCard);
          cards.push(productCard);
        }
      });
    }
    
    let injectedCount = 0;
    
    cards.forEach((card, index) => {
      card.classList.add('shopopti-processed');
      
      // Extract product ID
      const productId = card.dataset?.asin || 
                        card.dataset?.productId || 
                        card.querySelector('a[href*="/dp/"]')?.href?.match(/\/dp\/([A-Z0-9]+)/i)?.[1] ||
                        `product_${index}_${Date.now()}`;
      
      // Create action container
      const actionContainer = Security.createElement('div', {
        className: 'shopopti-card-actions',
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginTop: '8px',
          flexWrap: 'wrap'
        }
      });
      
      // Selection checkbox for bulk import
      const checkboxWrapper = Security.createElement('label', {
        className: 'shopopti-select-label',
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          cursor: 'pointer',
          fontSize: '11px',
          color: '#6b7280'
        }
      });
      
      const checkbox = Security.createElement('input', {
        className: 'shopopti-select-checkbox',
        type: 'checkbox',
        dataset: { productId }
      });
      
      checkbox.addEventListener('change', () => {
        const productData = extractQuickDataFromCard(card, platform);
        BulkSelectionState.toggle(productId, { ...productData, productId });
      });
      
      checkboxWrapper.appendChild(checkbox);
      checkboxWrapper.appendChild(document.createTextNode('Sélect.'));
      
      // Quick import button
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
          opacity: '1',
          transition: 'all 0.2s'
        }
      }, '⚡ Import');
      
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const link = card.querySelector('a[href*="/dp/"], a[href*="/item/"], a[href*="/itm/"], a[href*="/products/"], a[href*="/i/"]');
        if (!link) {
          showToast('Impossible de trouver le lien du produit', 'error');
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
            showToast('Produit importé avec succès!', 'success');
          } else {
            throw new Error(response?.error);
          }
        } catch (error) {
          btn.textContent = '✗';
          btn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
          showToast(error.message || 'Erreur d\'import', 'error');
        }
        
        setTimeout(() => {
          btn.textContent = '⚡ Import';
          btn.style.background = 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
          btn.disabled = false;
        }, 2000);
      });
      
      actionContainer.appendChild(checkboxWrapper);
      actionContainer.appendChild(btn);
      
      // Find container
      const buttonContainer = card.querySelector('.s-item__info, .product-info, .prdtBILTit') || card;
      buttonContainer.appendChild(actionContainer);
      injectedCount++;
    });
    
    if (injectedCount > 0) {
      console.log('[ShopOpti+] Injected', injectedCount, 'listing buttons with bulk selection');
    }
  }
  
  // ============================================
  // BULK ACTION FLOATING BAR
  // ============================================
  function injectBulkActionBar() {
    if (document.querySelector('.shopopti-bulk-fab')) return;
    
    const fab = Security.createElement('div', {
      className: 'shopopti-bulk-fab',
      style: {
        position: 'fixed',
        bottom: '80px',
        right: '20px',
        zIndex: '2147483647',
        display: 'none',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 16px',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }
    });
    
    // Count badge
    const countBadge = Security.createElement('span', {
      className: 'shopopti-bulk-count',
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '28px',
        height: '28px',
        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
        borderRadius: '50%',
        color: 'white',
        fontSize: '13px',
        fontWeight: '700'
      }
    }, '0');
    
    // Label
    const label = Security.createElement('span', {
      style: { color: 'white', fontSize: '13px' }
    }, 'sélectionné(s)');
    
    // Bulk import button
    const importBtn = Security.createElement('button', {
      className: 'shopopti-bulk-import-btn',
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '10px 16px',
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer'
      }
    }, '🚀 Import en masse');
    
    importBtn.addEventListener('click', async () => {
      const count = BulkSelectionState.count();
      if (count === 0) return;
      
      importBtn.disabled = true;
      importBtn.textContent = '⏳ Préparation...';
      
      try {
        // Request bulk import module injection
        const response = await safeSendMessage({
          type: 'OPEN_BULK_IMPORT_UI',
          products: BulkSelectionState.getAll()
        });
        
        if (response?.success) {
          await waitForBulkImport();
          const bulkUI = new window.ShopOptiBulkImportV5();
          bulkUI.open(BulkSelectionState.getAll());
        } else {
          throw new Error(response?.error || 'Failed to open bulk import');
        }
      } catch (error) {
        showToast(error.message || 'Erreur', 'error');
      } finally {
        importBtn.disabled = false;
        importBtn.textContent = '🚀 Import en masse';
      }
    });
    
    // Select all button
    const selectAllBtn = Security.createElement('button', {
      style: {
        padding: '8px 12px',
        background: 'rgba(255,255,255,0.1)',
        color: 'white',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '8px',
        fontSize: '12px',
        cursor: 'pointer'
      }
    }, '☑ Tout');
    
    selectAllBtn.addEventListener('click', () => {
      const cards = document.querySelectorAll('.shopopti-processed');
      const platform = detectPlatform();
      
      cards.forEach((card, index) => {
        if (BulkSelectionState.count() >= CONFIG.MAX_BULK_IMPORT) return;
        
        const productId = card.dataset?.asin || 
                          card.dataset?.productId || 
                          `product_${index}_${Date.now()}`;
        
        if (!BulkSelectionState.selectedProducts.has(productId)) {
          const productData = extractQuickDataFromCard(card, platform);
          BulkSelectionState.add(productId, { ...productData, productId });
        }
      });
    });
    
    // Clear button
    const clearBtn = Security.createElement('button', {
      style: {
        padding: '8px 12px',
        background: 'rgba(239,68,68,0.2)',
        color: '#fca5a5',
        border: 'none',
        borderRadius: '8px',
        fontSize: '12px',
        cursor: 'pointer'
      }
    }, '✕');
    
    clearBtn.addEventListener('click', () => {
      BulkSelectionState.clear();
    });
    
    fab.appendChild(countBadge);
    fab.appendChild(label);
    fab.appendChild(selectAllBtn);
    fab.appendChild(importBtn);
    fab.appendChild(clearBtn);
    
    document.body.appendChild(fab);
  }
  
  // ============================================
  // QUICK DATA EXTRACTION FROM CARD
  // ============================================
  function extractQuickDataFromCard(card, platform) {
    const link = card.querySelector('a[href*="/dp/"], a[href*="/item/"], a[href*="/itm/"], a[href*="/products/"], a[href*="/i/"]');
    const titleEl = card.querySelector('h2, h3, .s-line-clamp-2, [class*="title"]');
    const priceEl = card.querySelector('[class*="price"], .a-offscreen');
    const imageEl = card.querySelector('img');
    
    let price = 0;
    if (priceEl) {
      const priceText = priceEl.textContent || '';
      const match = priceText.match(/[\d,.]+/);
      if (match) price = parseFloat(match[0].replace(',', '.'));
    }
    
    return {
      title: Security.sanitizeText(titleEl?.textContent?.trim() || 'Produit'),
      price,
      image: imageEl?.src || imageEl?.dataset?.src || '',
      url: link?.href || '',
      platform
    };
  }
  
  // ============================================
  // TOAST NOTIFICATIONS
  // ============================================
  function showToast(message, type = 'info') {
    const existing = document.querySelector('.shopopti-toast');
    if (existing) existing.remove();
    
    const colors = {
      success: 'linear-gradient(135deg, #10b981, #059669)',
      error: 'linear-gradient(135deg, #ef4444, #dc2626)',
      info: 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
    };
    
    const toast = Security.createElement('div', {
      className: 'shopopti-toast',
      style: {
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: '2147483647',
        padding: '12px 20px',
        background: colors[type] || colors.info,
        color: 'white',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        animation: 'shopopti-slide-in 0.3s ease-out'
      }
    }, message);
    
    // Add animation keyframes
    if (!document.querySelector('#shopopti-toast-styles')) {
      const style = document.createElement('style');
      style.id = 'shopopti-toast-styles';
      style.textContent = `
        @keyframes shopopti-slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
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
