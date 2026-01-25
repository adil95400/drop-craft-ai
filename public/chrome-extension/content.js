// ============================================
// ShopOpti+ Chrome Extension - Content Script v5.6.0
// SECURITY HARDENED - XSS Prevention, Safe DOM
// AutoDS-Style Button Injection for 45+ Platforms
// Bulk Import V5 + Multi-Store + Ads Spy Integration
// ============================================

(function () {
  'use strict';

  // Prevent multiple injections
  if (window.__shopOptiCSVersion === '5.6.0') return;
  window.__shopOptiCSVersion = '5.6.0';

  console.log('[ShopOpti+] Content script v5.6.0 initializing...');

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

  function waitForOverlay(timeout = 5000) {
    return waitForModule('AdvancedImportOverlay', timeout);
  }

  function waitForBulkImport(timeout = 5000) {
    return waitForModule('ShopOptiBulkImportV5', timeout);
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
    VERSION: '5.6.0',
    BRAND: 'ShopOpti+',
    API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
    APP_URL: 'https://shopopti.io',
    MAX_BULK_IMPORT: 100,
    PLATFORMS: [
      'amazon', 'aliexpress', 'alibaba', 'temu', 'shein', 'shopify', 
      'ebay', 'etsy', 'walmart', 'cjdropshipping', 'banggood', 'dhgate', 
      'wish', 'cdiscount', 'fnac', 'rakuten', 'costco', 'homedepot', 
      'lowes', 'target', 'bestbuy', 'wayfair', 'overstock', 'newegg',
      'zalando', 'asos', 'manomano', 'darty', 'boulanger', 'leroymerlin',
      '1688', 'taobao', 'lightinthebox', 'made-in-china'
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
      'boulanger': 'boulanger', 'leroymerlin': 'leroymerlin', 'myshopify': 'shopify',
      '1688': '1688', 'taobao': 'taobao', 'lightinthebox': 'lightinthebox',
      'made-in-china': 'made-in-china'
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
      rakuten: /\/product\//i,
      '1688': /\/offer\/\d+\.html/i,
      taobao: /\/item\.htm\?id=/i,
      alibaba: /\/product-detail\//i,
      banggood: /\/-p-\d+\.html/i,
      dhgate: /\/product\/\d+\.html/i
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
  // AUTODS-STYLE INLINE BUTTON INJECTION (Product Pages)
  // ============================================
  function getAddToCartButtonContainer(platform) {
    // Platform-specific selectors for Add to Cart button containers
    const containerSelectors = {
      amazon: '#add-to-cart-button, #buy-now-button, .a-button-stack, #addToCart, .buybox-tab-content',
      aliexpress: '[class*="add-to-cart"], [class*="buy-now"], .product-action, .comet-v2-btn-important',
      temu: '[class*="AddCart"], [class*="add-to-bag"], .goods-detail-actions',
      shein: '.product-intro__add, [class*="add-to-bag"], .j-add-to-cart',
      ebay: '#binBtn_btn, .x-bin-action, .vi-VR-cvipBtnsLi',
      etsy: '.wt-pt-xs-3 button, [data-add-to-cart], .add-to-cart-form',
      walmart: '[data-automation="add-to-cart"], .prod-ProductCTA',
      shopify: '.product-form__cart-submit, [name="add"], .add-to-cart',
      cdiscount: '.fpBuyBoxBtnContainer, .jsBuyBtn',
      fnac: '.f-buyBox-cta, .f-addToCartForm',
      rakuten: '.add-to-cart-btn',
      default: '[class*="add-to-cart"], [class*="buy-now"], .product-actions, .product__add-to-cart'
    };

    const selector = containerSelectors[platform] || containerSelectors.default;
    
    // Try multiple selectors
    const selectors = selector.split(',').map(s => s.trim());
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el.closest('div, form, section') || el.parentElement || el;
    }
    
    return null;
  }

  function injectInlineImportButton() {
    if (document.querySelector('.shopopti-inline-import-btn')) return;
    if (!isProductPage()) return;

    const platform = detectPlatform();
    console.log('[ShopOpti+] Injecting AutoDS-style inline button for:', platform);

    const container = getAddToCartButtonContainer(platform);
    
    // Create inline button wrapper (AutoDS style - directly above/below Add to Cart)
    const wrapper = Security.createElement('div', {
      className: 'shopopti-inline-wrapper',
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginTop: '12px',
        marginBottom: '12px',
        width: '100%'
      }
    });

    // Main Import Button (AutoDS style)
    const importBtn = Security.createElement('button', {
      className: 'shopopti-inline-import-btn',
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        width: '100%',
        padding: '14px 24px',
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        fontSize: '15px',
        fontWeight: '700',
        cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(255,255,255,0.1) inset',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        textTransform: 'none',
        letterSpacing: '0.3px'
      }
    });

    // Button content with logo
    importBtn.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
      <span>Import to ShopOpti+</span>
    `;
    
    // Hover effects
    importBtn.addEventListener('mouseenter', () => {
      importBtn.style.transform = 'translateY(-2px) scale(1.01)';
      importBtn.style.boxShadow = '0 8px 30px rgba(99, 102, 241, 0.5), 0 0 0 1px rgba(255,255,255,0.15) inset';
    });
    
    importBtn.addEventListener('mouseleave', () => {
      importBtn.style.transform = 'translateY(0) scale(1)';
      importBtn.style.boxShadow = '0 4px 20px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(255,255,255,0.1) inset';
    });

    // Click handler
    importBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      importBtn.disabled = true;
      importBtn.innerHTML = `
        <svg class="shopopti-spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10" stroke-dasharray="62.83" stroke-dashoffset="15"/>
        </svg>
        <span>Extraction en cours...</span>
      `;
      
      try {
        const productData = await extractProductData();
        
        if (window.AdvancedImportOverlay) {
          const overlay = new window.AdvancedImportOverlay();
          overlay.open(productData);
        } else {
          const response = await safeSendMessage({
            type: 'OPEN_IMPORT_OVERLAY',
            url: window.location.href,
            productData
          });
          
          if (response?.success) {
            await waitForOverlay();
            const overlay = new window.AdvancedImportOverlay();
            overlay.open(productData);
          } else {
            throw new Error(response?.error || 'Failed to open import');
          }
        }
        
        importBtn.innerHTML = `
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          <span>Import to ShopOpti+</span>
        `;
      } catch (error) {
        console.error('[ShopOpti+] Import error:', error);
        importBtn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <span>Erreur - Réessayer</span>
        `;
        importBtn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        
        setTimeout(() => {
          importBtn.innerHTML = `
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            <span>Import to ShopOpti+</span>
          `;
          importBtn.style.background = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)';
        }, 2500);
      } finally {
        importBtn.disabled = false;
      }
    });

    // Quick action bar (AutoDS style)
    const quickActions = Security.createElement('div', {
      className: 'shopopti-quick-actions',
      style: {
        display: 'flex',
        gap: '6px',
        width: '100%'
      }
    });

    // Quick Import (1-click, no overlay)
    const quickImportBtn = createQuickActionButton('⚡', 'Import rapide', 'Importer directement', async () => {
      quickImportBtn.disabled = true;
      quickImportBtn.querySelector('span').textContent = '...';
      
      try {
        const response = await safeSendMessage({
          type: 'IMPORT_FROM_URL',
          url: window.location.href
        });
        
        if (response?.success) {
          quickImportBtn.querySelector('span').textContent = '✓';
          quickImportBtn.style.background = 'rgba(16, 185, 129, 0.15)';
          quickImportBtn.style.borderColor = 'rgba(16, 185, 129, 0.4)';
          showToast('Produit importé avec succès!', 'success');
        } else {
          throw new Error(response?.error);
        }
      } catch (error) {
        showToast(error.message || 'Erreur d\'import', 'error');
      } finally {
        setTimeout(() => {
          quickImportBtn.querySelector('span').textContent = 'Import rapide';
          quickImportBtn.style.background = '';
          quickImportBtn.style.borderColor = '';
          quickImportBtn.disabled = false;
        }, 2000);
      }
    });

    // Add to Monitoring
    const monitorBtn = createQuickActionButton('📊', 'Surveiller', 'Surveiller le prix', async () => {
      try {
        const response = await safeSendMessage({
          type: 'ADD_TO_MONITORING',
          url: window.location.href
        });
        
        if (response?.success) {
          showToast('Produit ajouté à la surveillance!', 'success');
          monitorBtn.querySelector('span').textContent = '✓ Surveillé';
        }
      } catch (error) {
        showToast(error.message, 'error');
      }
    });

    // Find Suppliers
    const suppliersBtn = createQuickActionButton('🔍', 'Fournisseurs', 'Rechercher fournisseurs', async () => {
      try {
        const productData = await extractProductData();
        const response = await safeSendMessage({
          type: 'SEARCH_ALL_SUPPLIERS',
          query: productData.title,
          options: { limit: 20 }
        });
        
        if (response?.success) {
          showToast(`${response.suppliers?.length || 0} fournisseurs trouvés`, 'success');
        }
      } catch (error) {
        showToast(error.message, 'error');
      }
    });

    quickActions.appendChild(quickImportBtn);
    quickActions.appendChild(monitorBtn);
    quickActions.appendChild(suppliersBtn);

    wrapper.appendChild(importBtn);
    wrapper.appendChild(quickActions);

    // Insert button
    if (container) {
      // Insert after the add to cart container
      container.parentNode.insertBefore(wrapper, container.nextSibling);
      console.log('[ShopOpti+] Inline button injected after Add to Cart');
    } else {
      // Fallback: Fixed position button
      injectFloatingImportButton();
    }

    // Inject spinner animation styles
    injectAnimationStyles();
  }

  function createQuickActionButton(icon, label, title, onClick) {
    const btn = Security.createElement('button', {
      className: 'shopopti-quick-btn',
      title: title,
      style: {
        flex: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        padding: '10px 12px',
        background: 'rgba(99, 102, 241, 0.1)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        borderRadius: '8px',
        color: '#a5b4fc',
        fontSize: '12px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }
    });

    btn.innerHTML = `<span>${label}</span>`;
    
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(99, 102, 241, 0.2)';
      btn.style.borderColor = 'rgba(99, 102, 241, 0.5)';
    });
    
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'rgba(99, 102, 241, 0.1)';
      btn.style.borderColor = 'rgba(99, 102, 241, 0.3)';
    });
    
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });
    
    return btn;
  }

  function injectAnimationStyles() {
    if (document.querySelector('#shopopti-animations')) return;
    
    const style = document.createElement('style');
    style.id = 'shopopti-animations';
    style.textContent = `
      @keyframes shopopti-spin {
        to { transform: rotate(360deg); }
      }
      .shopopti-spinner {
        animation: shopopti-spin 1s linear infinite;
      }
      @keyframes shopopti-slide-in {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes shopopti-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      .shopopti-inline-import-btn:disabled {
        cursor: wait !important;
      }
    `;
    document.head.appendChild(style);
  }

  // ============================================
  // FLOATING IMPORT BUTTON (Fallback)
  // ============================================
  function injectFloatingImportButton() {
    if (document.querySelector('.shopopti-import-btn')) return;
    if (!isProductPage()) return;
    
    const platform = detectPlatform();
    console.log('[ShopOpti+] Injecting floating button for platform:', platform);
    
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
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '14px',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(255,255,255,0.1) inset',
        transition: 'all 0.3s ease'
      }
    }, '⚡ Import ShopOpti+');
    
    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(-2px) scale(1.02)';
      btn.style.boxShadow = '0 12px 40px rgba(99, 102, 241, 0.5)';
    });
    
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translateY(0) scale(1)';
      btn.style.boxShadow = '0 8px 32px rgba(99, 102, 241, 0.4)';
    });
    
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      const originalText = btn.textContent;
      btn.textContent = '⏳ Chargement...';
      
      try {
        const productData = await extractProductData();
        
        if (window.AdvancedImportOverlay) {
          const overlay = new window.AdvancedImportOverlay();
          overlay.open(productData);
          btn.textContent = originalText;
          btn.disabled = false;
        } else {
          const response = await safeSendMessage({
            type: 'OPEN_IMPORT_OVERLAY',
            url: window.location.href,
            productData
          });
          
          if (response?.success) {
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
          btn.style.background = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)';
          btn.disabled = false;
        }, 2000);
      }
    });
    
    container.appendChild(btn);
    document.body.appendChild(container);
    
    console.log('[ShopOpti+] Floating import button injected successfully');
  }

  // ============================================
  // LISTING PAGE BUTTONS (AutoDS style - on cards)
  // ============================================
  function injectListingButtons() {
    if (!isListingPage()) return;
    
    const platform = detectPlatform();
    
    // Inject bulk selection floating action bar
    injectBulkActionBar();
    
    const cardSelectors = {
      amazon: '[data-asin]:not([data-asin=""]):not(.shopopti-processed)',
      aliexpress: '.list-item:not(.shopopti-processed), [class*="product-card"]:not(.shopopti-processed), .search-card-item:not(.shopopti-processed)',
      cdiscount: '.prdtBloc:not(.shopopti-processed), .lpProduct:not(.shopopti-processed)',
      temu: '[class*="goods-item"]:not(.shopopti-processed), [class*="ProductCard"]:not(.shopopti-processed)',
      shein: '[class*="product-item"]:not(.shopopti-processed), .product-card:not(.shopopti-processed)',
      ebay: '.s-item:not(.shopopti-processed)',
      etsy: '.listing-link:not(.shopopti-processed), [data-listing-id]:not(.shopopti-processed)',
      walmart: '[data-item-id]:not(.shopopti-processed)',
      default: '[data-product-id]:not(.shopopti-processed), .product-card:not(.shopopti-processed), .product-item:not(.shopopti-processed)'
    };
    
    const selector = cardSelectors[platform] || cardSelectors.default;
    const cards = document.querySelectorAll(selector);
    
    let injectedCount = 0;
    
    cards.forEach((card, index) => {
      card.classList.add('shopopti-processed');
      
      // Extract product ID
      const productId = card.dataset?.asin || 
                        card.dataset?.productId || 
                        card.dataset?.itemId ||
                        card.dataset?.listingId ||
                        card.querySelector('a[href*="/dp/"]')?.href?.match(/\/dp\/([A-Z0-9]+)/i)?.[1] ||
                        `product_${index}_${Date.now()}`;
      
      // Create action container (AutoDS-style overlay on hover)
      const actionOverlay = Security.createElement('div', {
        className: 'shopopti-card-overlay',
        style: {
          position: 'absolute',
          top: '8px',
          right: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          zIndex: '100',
          opacity: '0',
          transform: 'translateX(10px)',
          transition: 'all 0.2s ease'
        }
      });
      
      // Make card position relative if needed
      const cardPosition = window.getComputedStyle(card).position;
      if (cardPosition === 'static') {
        card.style.position = 'relative';
      }
      
      // Selection checkbox (circular, AutoDS style)
      const checkbox = Security.createElement('div', {
        className: 'shopopti-select-circle',
        dataset: { productId },
        style: {
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.9)',
          border: '2px solid white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          transition: 'all 0.2s',
          color: 'white',
          fontSize: '14px',
          fontWeight: '700'
        }
      }, '');
      
      checkbox.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const isSelected = BulkSelectionState.selectedProducts.has(productId);
        const productData = extractQuickDataFromCard(card, platform);
        
        if (isSelected) {
          BulkSelectionState.remove(productId);
          checkbox.textContent = '';
          checkbox.style.background = 'rgba(99, 102, 241, 0.9)';
        } else {
          BulkSelectionState.add(productId, { ...productData, productId });
          checkbox.textContent = '✓';
          checkbox.style.background = '#10b981';
        }
      });
      
      // Quick import button
      const quickBtn = Security.createElement('button', {
        className: 'shopopti-card-quick-btn',
        title: 'Import 1-clic',
        style: {
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          border: '2px solid white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          color: 'white',
          fontSize: '12px',
          transition: 'all 0.2s'
        }
      }, '⚡');
      
      quickBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const link = card.querySelector('a[href*="/dp/"], a[href*="/item/"], a[href*="/itm/"], a[href*="/products/"], a[href*="/i/"], a[href*="/listing/"]');
        if (!link) {
          showToast('Lien produit introuvable', 'error');
          return;
        }
        
        quickBtn.textContent = '...';
        quickBtn.disabled = true;
        
        try {
          const response = await safeSendMessage({
            type: 'IMPORT_FROM_URL',
            url: link.href
          });
          
          if (response?.success) {
            quickBtn.textContent = '✓';
            quickBtn.style.background = '#10b981';
            showToast('Produit importé!', 'success');
          } else {
            throw new Error(response?.error);
          }
        } catch (error) {
          quickBtn.textContent = '✗';
          quickBtn.style.background = '#ef4444';
          showToast(error.message || 'Erreur', 'error');
        }
        
        setTimeout(() => {
          quickBtn.textContent = '⚡';
          quickBtn.style.background = 'linear-gradient(135deg, #6366f1, #8b5cf6)';
          quickBtn.disabled = false;
        }, 2000);
      });
      
      actionOverlay.appendChild(checkbox);
      actionOverlay.appendChild(quickBtn);
      card.appendChild(actionOverlay);
      
      // Show overlay on hover
      card.addEventListener('mouseenter', () => {
        actionOverlay.style.opacity = '1';
        actionOverlay.style.transform = 'translateX(0)';
      });
      
      card.addEventListener('mouseleave', () => {
        actionOverlay.style.opacity = '0';
        actionOverlay.style.transform = 'translateX(10px)';
      });
      
      injectedCount++;
    });
    
    if (injectedCount > 0) {
      console.log('[ShopOpti+] Injected', injectedCount, 'listing overlays (AutoDS style)');
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
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: '2147483647',
        display: 'none',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 20px',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        borderRadius: '20px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset',
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
        minWidth: '32px',
        height: '32px',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        borderRadius: '50%',
        color: 'white',
        fontSize: '14px',
        fontWeight: '700'
      }
    }, '0');
    
    // Label
    const label = Security.createElement('span', {
      style: { color: 'white', fontSize: '14px', fontWeight: '500' }
    }, 'produits sélectionnés');
    
    // Bulk import button
    const importBtn = Security.createElement('button', {
      className: 'shopopti-bulk-import-btn',
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 20px',
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '700',
        cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
      }
    }, '🚀 Import en masse');
    
    importBtn.addEventListener('click', async () => {
      const count = BulkSelectionState.count();
      if (count === 0) return;
      
      importBtn.disabled = true;
      importBtn.textContent = '⏳ Préparation...';
      
      try {
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
        padding: '10px 14px',
        background: 'rgba(255,255,255,0.1)',
        color: 'white',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '10px',
        fontSize: '13px',
        fontWeight: '600',
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
          
          // Update checkbox UI
          const checkbox = card.querySelector('.shopopti-select-circle');
          if (checkbox) {
            checkbox.textContent = '✓';
            checkbox.style.background = '#10b981';
          }
        }
      });
    });
    
    // Clear button
    const clearBtn = Security.createElement('button', {
      style: {
        padding: '10px 14px',
        background: 'rgba(239,68,68,0.2)',
        color: '#fca5a5',
        border: 'none',
        borderRadius: '10px',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer'
      }
    }, '✕ Effacer');
    
    clearBtn.addEventListener('click', () => {
      BulkSelectionState.clear();
      
      // Reset all checkbox UIs
      document.querySelectorAll('.shopopti-select-circle').forEach(checkbox => {
        checkbox.textContent = '';
        checkbox.style.background = 'rgba(99, 102, 241, 0.9)';
      });
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
    const link = card.querySelector('a[href*="/dp/"], a[href*="/item/"], a[href*="/itm/"], a[href*="/products/"], a[href*="/i/"], a[href*="/listing/"]');
    const titleEl = card.querySelector('h2, h3, .s-line-clamp-2, [class*="title"], .listing-title');
    const priceEl = card.querySelector('[class*="price"], .a-offscreen, .currency');
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
      info: 'linear-gradient(135deg, #6366f1, #8b5cf6)'
    };
    
    const icons = {
      success: '✓',
      error: '✗',
      info: 'ℹ'
    };
    
    const toast = Security.createElement('div', {
      className: 'shopopti-toast',
      style: {
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: '2147483647',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '14px 20px',
        background: colors[type] || colors.info,
        color: 'white',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '600',
        boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
        animation: 'shopopti-slide-in 0.3s ease-out',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }
    });
    
    toast.innerHTML = `<span>${icons[type]}</span> ${Security.sanitizeText(message)}`;
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3500);
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
      aliexpress: 'h1[data-pl="product-title"], .product-title, [class*="ProductTitle"]',
      cdiscount: '.fpDesCol h1, [itemprop="name"]',
      ebay: 'h1.x-item-title__mainTitle',
      temu: '[class*="goods-name"], h1[class*="Title"]',
      shein: '.product-intro__head-name, [class*="product-name"]',
      default: 'h1, [itemprop="name"]'
    };
    
    const titleEl = document.querySelector(titleSelectors[platform] || titleSelectors.default);
    data.title = Security.sanitizeText(titleEl?.textContent?.trim() || '');
    
    // Price
    const priceSelectors = {
      amazon: '.a-price .a-offscreen, #priceblock_ourprice, .priceToPay',
      aliexpress: '[class*="price-current"], .product-price, [class*="Price__price"]',
      cdiscount: '.fpPrice, [itemprop="price"]',
      ebay: '[data-testid="x-price-primary"], .x-price-primary',
      temu: '[class*="goods-price"], [class*="Price__value"]',
      shein: '.product-intro__head-price, [class*="original-price"]',
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
      amazon: '#altImages img, #imageBlock img, #landingImage',
      aliexpress: '[class*="slider"] img, [class*="gallery"] img, [class*="ImageGallery"] img',
      cdiscount: '.fpImgLnk img, .fpGalImg img',
      ebay: '.ux-image-carousel img, [data-testid="ux-image-carousel"] img',
      temu: '[class*="goods-gallery"] img, [class*="ImageView"] img',
      shein: '.product-intro__thumbs img, [class*="crop-image-container"] img',
      default: '.product-gallery img, .product-image img'
    };
    
    const seenHashes = new Set();
    const images = [];
    
    document.querySelectorAll(imageSelectors[platform] || imageSelectors.default).forEach(img => {
      let src = img.dataset?.oldHires || img.dataset?.src || img.dataset?.lazySrc || img.src;
      if (!src || src.includes('sprite') || src.includes('placeholder') || src.includes('grey-pixel') || src.includes('blank')) return;
      
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
  if (isChromeRuntimeAvailable()) {
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
      
      if (message.type === 'OVERLAY_SCRIPT_INJECTED') {
        console.log('[ShopOpti+] Import overlay V2 script injected');
        sendResponse({ success: true });
        return true;
      }
      
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
  }

  // ============================================
  // MUTATION OBSERVER (Debounced)
  // ============================================
  const debouncedInject = debounce(() => {
    injectInlineImportButton();
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
    console.log('[ShopOpti+] Synced with shopopti.io - v' + CONFIG.VERSION);
    
    // Inject animation styles first
    injectAnimationStyles();
    
    // Initial injection
    injectInlineImportButton();
    injectListingButtons();
    
    // Start observer for dynamic content
    startObserver();
    
    // Retry injection for SPAs (some sites load content dynamically)
    let retries = 0;
    const retryInterval = setInterval(() => {
      if (retries >= 15 || document.querySelector('.shopopti-inline-import-btn, .shopopti-import-btn')) {
        clearInterval(retryInterval);
        return;
      }
      injectInlineImportButton();
      injectListingButtons();
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
