// ============================================
// ShopOpti+ Content Injector v5.8.1 - ENTERPRISE EDITION
// PHASE 1 & 2: Atomic imports + Standardized UX Feedback
// Enterprise Gateway v2.1 Integration
// MutationObserver for SPA/infinite scroll
// Centralized selectors + Supplier search + AI content
// ALWAYS SHOW BUTTONS - Auth check on action
// Full Sync with ShopOpti SaaS via Gateway
// ============================================

(function() {
  'use strict';
  
  const VERSION = '6.0.0';
  const INJECTED_CLASS = 'shopopti-injected';
  const DEBOUNCE_MS = 300;
  const MAX_REINJECT_ATTEMPTS = 15;
  const INJECTION_RETRY_DELAY = 600;
  const API_URL = 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1';
  const APP_URL = 'https://shopopti.io';
  
  // State management
  let isInitialized = false;
  let isAuthenticated = false;
  let currentPlatform = null;
  let reinjectAttempts = 0;
  let debounceTimer = null;
  let observer = null;
  let syncedSettings = null;
  let userStores = [];
  let gatewayClient = null;
  
  // ============================================
  // CENTRALIZED SELECTORS (dynamically loaded)
  // ============================================
  
  const platformSelectors = {
    amazon: {
      productButtons: ['#addToCart', '#add-to-cart-button', '#desktop_buybox', '#buybox', '#rightCol', '#buy-now-button', '.a-button-stack', '#ppd', '#centerCol', '#productTitle'],
      cards: ['[data-asin]:not([data-shopopti-card])', '.s-result-item:not([data-shopopti-card])', '[data-component-type="s-search-result"]:not([data-shopopti-card])'],
      urlPattern: /\/dp\/([A-Z0-9]+)/i,
      extractUrl: card => {
        const link = card.querySelector('a[href*="/dp/"]');
        if (link) return new URL(link.href, window.location.origin).href;
        const asin = card.getAttribute('data-asin');
        if (asin) return `${window.location.origin}/dp/${asin}`;
        return null;
      }
    },
    aliexpress: {
      productButtons: ['.product-action', '.product-action-main', '.action--container', '[class*="AddCart"]', '.comet-v2-btn-important'],
      cards: ['.search-item-card:not([data-shopopti-card])', '[data-pl-id]:not([data-shopopti-card])', '[class*="SearchProductFeed--item"]:not([data-shopopti-card])'],
      urlPattern: /\/item\/(\d+)\.html/i,
      extractUrl: card => {
        const link = card.querySelector('a[href*="/item/"]');
        return link ? link.href : null;
      }
    },
    ebay: {
      productButtons: ['#binBtn_btn', '.ux-call-to-action', '#mainContent .x-bin-action', '[data-testid="ux-call-to-action"]'],
      cards: ['.s-item:not([data-shopopti-card])', '.srp-results .s-item__wrapper:not([data-shopopti-card])'],
      urlPattern: /\/itm\/(\d+)/i,
      extractUrl: card => {
        const link = card.querySelector('a[href*="/itm/"]');
        return link ? link.href : null;
      }
    },
    temu: {
      productButtons: ['[class*="AddToCart"]', '[class*="buy-button"]', '[class*="action-bar"]', 'button[class*="_2dQOZ"]'],
      cards: ['[class*="goods-container"]:not([data-shopopti-card])', '[class*="product-card"]:not([data-shopopti-card])'],
      urlPattern: /\/goods\.html/i,
      extractUrl: card => {
        const link = card.querySelector('a[href*="goods.html"], a[href*="g-"]');
        return link ? link.href : null;
      }
    },
    shein: {
      productButtons: ['[class*="add-cart"]', '[class*="product-intro"]', '.product-action', 'button[class*="button-buy"]'],
      cards: ['[class*="product-card"]:not([data-shopopti-card])', '[class*="goods-item"]:not([data-shopopti-card])'],
      urlPattern: /\/product-detail|-p-\d+\.html/i,
      extractUrl: card => {
        const link = card.querySelector('a[href*="product"]');
        return link ? link.href : null;
      }
    },
    shopify: {
      productButtons: ['[type="submit"][name="add"]', '.product-form__submit', '.add-to-cart', '#AddToCart', '[data-add-to-cart]'],
      cards: ['.product-card:not([data-shopopti-card])', '[class*="product-item"]:not([data-shopopti-card])'],
      urlPattern: /\/products\//i,
      extractUrl: card => {
        const link = card.querySelector('a[href*="/products/"]');
        return link ? link.href : null;
      }
    },
    cdiscount: {
      productButtons: ['#fpAddBsk', '.fpBuyBloc', '[data-qa="add-to-cart"]'],
      cards: ['.prdtBloc:not([data-shopopti-card])'],
      urlPattern: /\/f-\d+-[a-z0-9]+\.html/i,
      extractUrl: card => {
        const link = card.querySelector('a[href*=".html"]');
        return link ? link.href : null;
      }
    },
    fnac: {
      productButtons: ['.f-buyBox-cta', '[data-automation-id="add-to-cart"]'],
      cards: ['.Article-item:not([data-shopopti-card])'],
      urlPattern: /\/a\d+\//i,
      extractUrl: card => {
        const link = card.querySelector('a[href*="/a"]');
        return link ? link.href : null;
      }
    },
    etsy: {
      productButtons: ['[data-add-to-cart-button]', '.add-to-cart-button'],
      cards: ['[data-logger-id*="listing"]:not([data-shopopti-card])'],
      urlPattern: /\/listing\//i,
      extractUrl: card => {
        const link = card.querySelector('a[href*="/listing/"]');
        return link ? link.href : null;
      }
    },
    walmart: {
      productButtons: ['[data-automation-id="atc-button"]', 'button[data-testid="add-to-cart-btn"]'],
      cards: ['[data-item-id]:not([data-shopopti-card])'],
      urlPattern: /\/ip\/\d+/i,
      extractUrl: card => {
        const link = card.querySelector('a[href*="/ip/"]');
        return link ? link.href : null;
      }
    }
  };
  
  // ============================================
  // REMOTE SELECTORS INTEGRATION
  // ============================================
  
  /**
   * Merge remote selectors with local platformSelectors
   * Remote selectors take priority for new/updated values
   */
  function mergeRemoteSelectors(remoteSelectors) {
    if (!remoteSelectors || typeof remoteSelectors !== 'object') return;
    
    Object.keys(remoteSelectors).forEach(platform => {
      if (remoteSelectors[platform]) {
        // Initialize platform if not exists
        if (!platformSelectors[platform]) {
          platformSelectors[platform] = { productButtons: [], cards: [], extractUrl: () => null };
        }
        
        // Merge productButtons (remote first, then local, dedupe)
        if (remoteSelectors[platform].productButtons) {
          platformSelectors[platform].productButtons = [
            ...new Set([
              ...remoteSelectors[platform].productButtons,
              ...platformSelectors[platform].productButtons
            ])
          ];
        }
        
        // Merge cards selectors
        if (remoteSelectors[platform].cards) {
          platformSelectors[platform].cards = [
            ...new Set([
              ...remoteSelectors[platform].cards,
              ...platformSelectors[platform].cards
            ])
          ];
        }
      }
    });
    
    console.log('[ShopOpti+] Remote selectors merged successfully');
  }
  
  /**
   * Initialize remote selectors if module is available
   */
  async function initRemoteSelectors() {
    if (typeof RemoteSelectorsManager === 'undefined') {
      console.log('[ShopOpti+] RemoteSelectorsManager not available, using local selectors');
      return;
    }
    
    try {
      const remoteSelectors = await RemoteSelectorsManager.init();
      if (remoteSelectors) {
        mergeRemoteSelectors(remoteSelectors);
        console.log('[ShopOpti+] Remote selectors loaded successfully');
      }
    } catch (e) {
      console.warn('[ShopOpti+] Remote selectors failed, using local:', e.message);
    }
  }
  
  // ============================================
  // PLATFORM DETECTION
  // ============================================
  
  function detectPlatform() {
    const hostname = window.location.hostname.toLowerCase();
    const url = window.location.href.toLowerCase();
    
    const domainMap = {
      'amazon': ['amazon.com', 'amazon.fr', 'amazon.de', 'amazon.co.uk', 'amazon.es', 'amazon.it', 'amazon.ca', 'amazon.co.jp'],
      'aliexpress': ['aliexpress.com', 'aliexpress.fr', 'aliexpress.us'],
      'ebay': ['ebay.com', 'ebay.fr', 'ebay.de', 'ebay.co.uk'],
      'temu': ['temu.com'],
      'shein': ['shein.com', 'shein.fr'],
      'cdiscount': ['cdiscount.com'],
      'fnac': ['fnac.com'],
      'rakuten': ['rakuten.fr', 'rakuten.com'],
      'etsy': ['etsy.com'],
      'walmart': ['walmart.com'],
      'target': ['target.com'],
      'bestbuy': ['bestbuy.com'],
      'banggood': ['banggood.com'],
      'dhgate': ['dhgate.com'],
      'wish': ['wish.com'],
      'cjdropshipping': ['cjdropshipping.com']
    };
    
    for (const [platform, domains] of Object.entries(domainMap)) {
      if (domains.some(d => hostname.includes(d))) {
        return platform;
      }
    }
    
    // Shopify detection
    if (url.includes('/products/') || 
        document.querySelector('meta[name="shopify-checkout-api-token"]') ||
        document.querySelector('link[href*="cdn.shopify.com"]') ||
        typeof window.Shopify !== 'undefined') {
      return 'shopify';
    }
    
    return null;
  }
  
  function isProductPage() {
    const url = window.location.href;
    const patterns = [
      /\/dp\/[A-Z0-9]+/i,
      /\/item\/\d+\.html/i,
      /\/itm\/\d+/i,
      /\/products?\//i,
      /\/gp\/product\//i,
      /\/goods\.html/i,
      /g-\d+\.html/i,
      /\/product-detail/i,
      /-p-\d+\.html/i,
      /\/listing\//i,
      /\/ip\/\d+/i,
      /\/f-\d+-[a-z0-9]+\.html/i
    ];
    return patterns.some(p => p.test(url));
  }
  
  // ============================================
  // IMPORT BUTTON CREATION
  // ============================================
  
  function createImportButton(type = 'single', productUrl = null) {
    const container = document.createElement('div');
    container.className = `shopopti-import-container ${INJECTED_CLASS}`;
    
    const mainBtn = document.createElement('button');
    mainBtn.className = 'shopopti-import-btn shopopti-main-btn';
    mainBtn.innerHTML = `
      <svg class="shopopti-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      <span class="shopopti-btn-text">${type === 'bulk' ? 'Import' : 'Import ShopOpti+'}</span>
    `;
    
    if (type === 'bulk' && productUrl) {
      mainBtn.dataset.productUrl = productUrl;
    }
    
    mainBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await handleQuickImport(mainBtn, type === 'bulk' ? productUrl : window.location.href);
    });
    
    container.appendChild(mainBtn);
    
    // Add dropdown for single product pages
    if (type === 'single') {
      const dropdownBtn = document.createElement('button');
      dropdownBtn.className = 'shopopti-import-btn shopopti-dropdown-btn';
      dropdownBtn.innerHTML = `<svg class="shopopti-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`;
      
      const dropdown = document.createElement('div');
      dropdown.className = 'shopopti-dropdown hidden';
      dropdown.innerHTML = `
        <button class="shopopti-dropdown-item" data-action="quick">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          Import rapide (1-clic)
        </button>
        <button class="shopopti-dropdown-item" data-action="advanced">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          Import avec options
        </button>
        <button class="shopopti-dropdown-item" data-action="reviews">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          Import + Avis
        </button>
        <button class="shopopti-dropdown-item" data-action="ai">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 2a10 10 0 0 1 10 10"/><circle cx="12" cy="12" r="4"/></svg>
          Import + Optimisation IA
        </button>
        <div class="shopopti-divider"></div>
        <button class="shopopti-dropdown-item" data-action="suppliers">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          Trouver fournisseurs
        </button>
        <button class="shopopti-dropdown-item" data-action="compare">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          Comparer les prix
        </button>
      `;
      
      dropdownBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropdown.classList.toggle('hidden');
      });
      
      dropdown.querySelectorAll('.shopopti-dropdown-item').forEach(item => {
        item.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropdown.classList.add('hidden');
          
          const action = item.dataset.action;
          const url = window.location.href;
          
          switch (action) {
            case 'quick':
              await handleQuickImport(mainBtn, url);
              break;
            case 'advanced':
              await handleAdvancedImport(url);
              break;
            case 'reviews':
              await handleImportWithReviews(mainBtn, url);
              break;
            case 'ai':
              await handleImportWithAI(mainBtn, url);
              break;
            case 'suppliers':
              await handleFindSuppliers(url);
              break;
            case 'compare':
              await handleComparePrice(url);
              break;
          }
        });
      });
      
      container.appendChild(dropdownBtn);
      container.appendChild(dropdown);
      
      document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) dropdown.classList.add('hidden');
      });
    }
    
    return container;
  }
  
  // ============================================
  // IMPORT HANDLERS
  // ============================================
  
  async function ensureAuthenticated(forceRefresh = false) {
    if (isAuthenticated && !forceRefresh) {
      // Quick check - verify token is still valid
      try {
        const status = await sendMessage({ type: 'CHECK_AUTH_STATUS' });
        if (status?.authenticated) return true;
      } catch (e) {
        // Continue to full auth check
      }
    }
    
    // Re-check auth status with server validation
    try {
      const response = await sendMessage({ type: 'GET_AUTH_TOKEN' });
      
      if (response.authenticated && response.token) {
        isAuthenticated = true;
        return true;
      }
      
      // Token expired or invalid
      if (response.error === 'Session expirée') {
        showToast('⏰ Session expirée - Reconnexion nécessaire', 'info');
      } else {
        showToast('🔒 Connectez-vous sur ShopOpti pour importer', 'info');
      }
      
      // Open auth page
      try {
        await sendMessage({ type: 'OPEN_AUTH_PAGE' });
      } catch (e) {
        window.open(`${APP_URL}/auth/extension`, '_blank');
      }
      
      isAuthenticated = false;
      return false;
      
    } catch (error) {
      console.error('[ShopOpti+] Auth check failed:', error);
      showToast('❌ Erreur de connexion - Réessayez', 'error');
      return false;
    }
  }
  
  async function handleQuickImport(button, url) {
    // Check auth before import
    if (!await ensureAuthenticated()) {
      if (window.ShopOptiFeedback) {
        window.ShopOptiFeedback.showFeedback('auth_required');
      }
      return;
    }
    
    setButtonLoading(button, true);
    
    // Debug mode check
    let debugMode = false;
    try {
      const storage = await chrome.storage.local.get(['debugMode']);
      debugMode = storage.debugMode === true;
    } catch (e) {}
    
    try {
      // BACKEND-FIRST ARCHITECTURE: Use BackendFirstImport (no local extraction)
      if (window.BackendFirstImport) {
        if (debugMode) {
          console.log('[ShopOpti+] Using BackendFirstImport (backend-first architecture)');
          console.log('[ShopOpti+] Import URL:', url);
          console.log('[ShopOpti+] Options:', { targetStores: userStores.map(s => s.id) });
        }
        
        const result = await window.BackendFirstImport.import(url, {
          targetStores: userStores.map(s => s.id)
        }, button);
        
        if (debugMode) {
          console.log('[ShopOpti+] BackendFirstImport result:', result);
        }
        
        // Response handling is done by ImportResponseHandler
        // Check if we need to fallback to legacy
        if (result.ok) {
          syncWithSaaS('product_import_started', { jobId: result.job_id, url });
          return;
        }
        
        // FALLBACK: If backend-first failed with recoverable error, try legacy
        if (result.canFallback && (window.ShopOptiPipeline || window.ExtractionOrchestrator)) {
          console.warn('[ShopOpti+] Backend-first failed, falling back to legacy extraction');
          showToast('⚠️ Mode fallback: extraction locale', 'warning');
          
          if (debugMode) {
            console.log('[ShopOpti+] Fallback reason:', result.code, result.message);
          }
          
          // Continue to legacy fallback below...
        } else {
          // Non-recoverable error or no fallback available
          return;
        }
      } else {
        if (debugMode) {
          console.warn('[ShopOpti+] BackendFirstImport not available, using legacy');
        }
      }
      
      // LEGACY FALLBACK #1: Use ShopOptiPipeline (local extraction)
      if (window.ShopOptiPipeline) {
        if (debugMode) {
          console.log('[ShopOpti+] Using ShopOptiPipeline (legacy local extraction)');
        }
        
        if (!window.BackendFirstImport) {
          showToast('⚠️ Mode fallback: extraction locale', 'warning');
        }
        
        const result = await window.ShopOptiPipeline.processUrl(url, {
          targetStores: userStores.map(s => s.id)
        });
        
        // PHASE 1: Handle BLOCKED imports (critical data missing)
        if (result.status === 'blocked') {
          setButtonError(button);
          
          if (window.ShopOptiFeedback) {
            window.ShopOptiFeedback.importBlocked({
              criticalMissing: result.validation?.critical?.failed?.map(f => f.field) || [],
              reason: result.error
            });
          } else {
            showToast(`🚫 Import bloqué: ${result.error}`, 'error');
          }
          
          setTimeout(() => resetButton(button), 3000);
          return;
        }
        
        // PHASE 1: Handle DRAFT imports (incomplete data)
        if (result.status === 'drafted') {
          setButtonSuccess(button);
          button.querySelector('.shopopti-btn-text').textContent = 'Brouillon créé';
          
          if (window.ShopOptiFeedback) {
            window.ShopOptiFeedback.importDraft({
              reason: result.message,
              missingFields: result.validation?.missingFields || []
            });
          } else {
            showToast(`📝 ${result.message}`, 'warning');
          }
          
          syncWithSaaS('product_drafted', { productId: result.product?.id, url });
          return;
        }
        
        // Handle awaiting confirmation
        if (result.status === 'awaiting_confirmation') {
          setButtonLoading(button, false);
          
          if (window.ShopOptiPreImportDialog) {
            const confirmed = await window.ShopOptiPreImportDialog.show(
              result.product,
              result.validation
            );
            
            if (confirmed) {
              setButtonLoading(button, true);
              const importResult = await window.ShopOptiPipeline.confirmImport(result.jobId);
              
              if (importResult.success) {
                setButtonSuccess(button);
                
                if (window.ShopOptiFeedback) {
                  window.ShopOptiFeedback.importSuccess({
                    score: result.validation?.score,
                    images: result.product?.images?.length,
                    variants: result.product?.variants?.length
                  });
                } else {
                  showToast(`✓ Produit importé! (Score: ${result.validation.score}%)`, 'success');
                }
                
                syncWithSaaS('product_imported', { productId: importResult.product?.id, url });
              } else {
                throw new Error(importResult.error || 'Import échoué');
              }
            } else {
              resetButton(button);
              return;
            }
          }
        } else if (result.success) {
          // Full success - product imported
          setButtonSuccess(button);
          const productId = result.product?.id || result.product?.product_id;
          
          if (window.ShopOptiFeedback) {
            window.ShopOptiFeedback.importSuccess({
              score: result.validation?.score || 100,
              images: result.product?.images?.length,
              variants: result.product?.variants?.length
            });
          } else {
            showToast(`✓ Produit importé! (Score: ${result.validation?.score || 100}%)`, 'success');
          }
          
          sendMessage({ type: 'PRODUCT_IMPORTED', productId });
          syncWithSaaS('product_imported', { productId, url });
        } else {
          throw new Error(result.error || 'Import échoué');
        }
        return;
      }
      
      // LEGACY FALLBACK #2: Use ExtractionOrchestrator (local extraction)
      if (window.ExtractionOrchestrator) {
        console.warn('[ShopOpti+] Falling back to ExtractionOrchestrator (local extraction)');
        showToast('⚠️ Mode fallback: extraction locale', 'warning');
        
        const result = await window.ExtractionOrchestrator.extract(url, {
          targetStores: userStores.map(s => s.id)
        });
        
        const importResult = await sendProductToBackend(result.product, url);
        setButtonSuccess(button);
        
        if (window.ShopOptiFeedback) {
          window.ShopOptiFeedback.importSuccess({
            score: result.validation?.score || 100,
            images: result.product?.images?.length
          });
        } else {
          showToast(`✓ Produit importé! (Score: ${result.validation?.score || 100}%)`, 'success');
        }
        
        syncWithSaaS('product_imported', { productId: importResult.productId, url });
        return;
      }
      
      // LEGACY FALLBACK: Direct API call
      const response = await sendMessage({
        type: 'IMPORT_FROM_URL',
        url,
        options: { 
          autoOptimize: true, 
          extractReviews: true, 
          extractVariants: true,
          targetStores: userStores.map(s => s.id)
        }
      });
      
      if (response.success) {
        setButtonSuccess(button);
        
        if (window.ShopOptiFeedback) {
          window.ShopOptiFeedback.success('Produit importé avec succès', { title: 'Import réussi' });
        } else {
          showToast(`✓ Produit importé!`, 'success');
        }
        
        sendMessage({ type: 'PRODUCT_IMPORTED', productId: response.productId });
        syncWithSaaS('product_imported', { productId: response.productId, url });
      } else {
        throw new Error(response.error || 'Import échoué');
      }
      
    } catch (error) {
      console.error('[ShopOpti+] Import error:', error);
      setButtonError(button);
      
      if (window.ShopOptiFeedback) {
        window.ShopOptiFeedback.showFeedback('import_error', { message: error.message });
      } else {
        showToast(error.message || 'Erreur lors de l\'import', 'error');
      }
      
      setTimeout(() => resetButton(button), 3000);
    }
  }
  
  /**
   * Send extracted product to backend
   */
  async function sendProductToBackend(product, sourceUrl) {
    const response = await sendMessage({
      type: 'IMPORT_PRODUCT_DATA',
      productData: {
        ...product,
        source_url: sourceUrl,
        source_platform: product._meta?.platform || currentPlatform
      },
      options: {
        targetStores: userStores.map(s => s.id)
      }
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Échec de l\'envoi au backend');
    }
    
    return response;
  }
  
  async function handleAdvancedImport(url) {
    try {
      await sendMessage({
        type: 'OPEN_IMPORT_OVERLAY',
        productData: { url }
      });
    } catch (error) {
      showToast('Erreur: ' + error.message, 'error');
    }
  }
  
  async function handleImportWithReviews(button, url) {
    setButtonLoading(button, true, 'Import + Avis...');
    
    try {
      const response = await sendMessage({
        type: 'IMPORT_PRODUCT_WITH_REVIEWS',
        url,
        reviewLimit: 50
      });
      
      if (response.success) {
        setButtonSuccess(button);
        const reviewCount = response.reviewsCount || response.reviews?.count || 0;
        showToast(`✓ Produit + ${reviewCount} avis importés!`, 'success');
        sendMessage({ type: 'PRODUCT_IMPORTED', productId: response.productId || response.product?.id });
      } else {
        throw new Error(response.error || 'Import échoué');
      }
    } catch (error) {
      setButtonError(button);
      showToast(error.message, 'error');
      setTimeout(() => resetButton(button), 3000);
    }
  }
  
  async function handleImportWithAI(button, url) {
    setButtonLoading(button, true, 'Import + IA...');
    
    try {
      const response = await sendMessage({
        type: 'IMPORT_FROM_URL',
        url,
        options: { 
          autoOptimize: true, 
          aiEnhance: true,
          rewriteTitle: true,
          generateDescription: true,
          extractReviews: true,
          extractVariants: true 
        }
      });
      
      if (response.success) {
        setButtonSuccess(button);
        showToast('✓ Produit importé et optimisé par IA!', 'success');
        sendMessage({ type: 'PRODUCT_IMPORTED', productId: response.productId });
      } else {
        throw new Error(response.error || 'Import échoué');
      }
    } catch (error) {
      setButtonError(button);
      showToast(error.message, 'error');
      setTimeout(() => resetButton(button), 3000);
    }
  }
  
  async function handleFindSuppliers(url) {
    try {
      showToast('🔍 Recherche de fournisseurs...', 'info');
      await sendMessage({
        type: 'FIND_SUPPLIERS',
        productData: { url }
      });
    } catch (error) {
      showToast('Erreur: ' + error.message, 'error');
    }
  }
  
  async function handleComparePrice(url) {
    try {
      showToast('📊 Comparaison des prix...', 'info');
      await sendMessage({
        type: 'SEARCH_ALL_SUPPLIERS',
        query: document.title,
        options: { comparePrice: true, sourceUrl: url }
      });
    } catch (error) {
      showToast('Erreur: ' + error.message, 'error');
    }
  }
  
  // ============================================
  // BUTTON STATE HELPERS
  // ============================================
  
  // SECURITY: Safe DOM manipulation helpers to prevent XSS
  function createSafeElement(tag, className, textContent) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (textContent) el.textContent = textContent;
    return el;
  }
  
  function setButtonLoading(button, loading, text = 'Import...') {
    const btn = button.querySelector ? button.querySelector('.shopopti-main-btn') || button : button;
    btn.disabled = loading;
    if (loading) {
      btn.innerHTML = ''; // Clear first
      btn.appendChild(createSafeElement('span', 'shopopti-spinner'));
      btn.appendChild(createSafeElement('span', 'shopopti-btn-text', text));
    }
  }
  
  function setButtonSuccess(button) {
    const btn = button.querySelector ? button.querySelector('.shopopti-main-btn') || button : button;
    btn.classList.add('shopopti-success');
    btn.innerHTML = ''; // Clear first
    btn.appendChild(createSafeElement('span', 'shopopti-icon-check', '✓'));
    btn.appendChild(createSafeElement('span', 'shopopti-btn-text', 'Importé!'));
  }
  
  function setButtonError(button) {
    const btn = button.querySelector ? button.querySelector('.shopopti-main-btn') || button : button;
    btn.classList.add('shopopti-error');
    btn.innerHTML = ''; // Clear first
    btn.appendChild(createSafeElement('span', 'shopopti-icon-error', '✗'));
    btn.appendChild(createSafeElement('span', 'shopopti-btn-text', 'Erreur'));
  }
  
  function resetButton(button, text = 'Import ShopOpti+') {
    const btn = button.querySelector ? button.querySelector('.shopopti-main-btn') || button : button;
    btn.disabled = false;
    btn.classList.remove('shopopti-success', 'shopopti-error');
    btn.innerHTML = ''; // Clear first
    
    // SVG icon (static, safe)
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'shopopti-icon');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.innerHTML = '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>';
    
    btn.appendChild(svg);
    btn.appendChild(createSafeElement('span', 'shopopti-btn-text', text));
  }
  
  // ============================================
  // MESSAGING
  // ============================================
  
  function sendMessage(message) {
    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(response || { success: false, error: 'No response' });
        });
      } catch (error) {
        reject(error);
      }
    });
  }
  
  // ============================================
  // TOAST NOTIFICATIONS
  // ============================================
  
  function showToast(message, type = 'info') {
    const existing = document.querySelector('.shopopti-toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = `shopopti-toast shopopti-toast-${type}`;
    
    // SECURITY: Use textContent to prevent XSS injection
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    toast.appendChild(messageSpan);
    
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => toast.classList.add('show'));
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
  
  // ============================================
  // STYLES INJECTION
  // ============================================
  
  function injectStyles() {
    if (document.getElementById('shopopti-pro-styles-v570')) return;
    
    const styles = document.createElement('style');
    styles.id = 'shopopti-pro-styles-v570';
    styles.textContent = `
      :root {
        --shopopti-primary: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
        --shopopti-success: linear-gradient(135deg, #10b981 0%, #059669 100%);
        --shopopti-error: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        --shopopti-dark: linear-gradient(180deg, #1e1e2e 0%, #0f0f1a 100%);
        --shopopti-shadow: 0 4px 15px rgba(99, 102, 241, 0.35);
        --shopopti-shadow-lg: 0 8px 30px rgba(99, 102, 241, 0.45);
        --shopopti-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .shopopti-import-container {
        display: inline-flex;
        position: relative;
        z-index: 9999;
        font-family: var(--shopopti-font);
      }
      
      .shopopti-import-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 18px;
        background: var(--shopopti-primary);
        color: white;
        border: none;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: var(--shopopti-shadow), inset 0 0 0 1px rgba(255,255,255,0.1);
        font-family: var(--shopopti-font);
        position: relative;
        overflow: hidden;
        white-space: nowrap;
      }
      
      .shopopti-import-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transition: left 0.5s;
      }
      
      .shopopti-import-btn:hover::before { left: 100%; }
      .shopopti-import-btn:hover { transform: translateY(-2px); box-shadow: var(--shopopti-shadow-lg); }
      .shopopti-import-btn:active { transform: translateY(0); }
      .shopopti-import-btn:disabled { opacity: 0.8; cursor: wait; }
      .shopopti-import-btn.shopopti-success { background: var(--shopopti-success); }
      .shopopti-import-btn.shopopti-error { background: var(--shopopti-error); }
      
      .shopopti-main-btn { border-radius: 10px 0 0 10px; }
      .shopopti-dropdown-btn { padding: 10px 12px; border-radius: 0 10px 10px 0; border-left: 1px solid rgba(255,255,255,0.2); }
      .shopopti-import-container:not(:has(.shopopti-dropdown-btn)) .shopopti-main-btn { border-radius: 10px; }
      
      .shopopti-icon { width: 16px; height: 16px; flex-shrink: 0; }
      .shopopti-icon-sm { width: 12px; height: 12px; }
      
      .shopopti-spinner {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255,255,255,0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: shopopti-spin 0.8s linear infinite;
      }
      
      @keyframes shopopti-spin { to { transform: rotate(360deg); } }
      
      .shopopti-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 8px;
        background: var(--shopopti-dark);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 12px;
        padding: 8px;
        min-width: 240px;
        box-shadow: 0 15px 40px rgba(0,0,0,0.5);
        z-index: 10000;
      }
      
      .shopopti-dropdown.hidden { display: none; }
      
      .shopopti-dropdown-item {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        padding: 10px 14px;
        background: transparent;
        border: none;
        border-radius: 8px;
        color: #e2e8f0;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
        text-align: left;
        font-family: var(--shopopti-font);
      }
      
      .shopopti-dropdown-item svg { width: 16px; height: 16px; opacity: 0.7; }
      .shopopti-dropdown-item:hover { background: rgba(99, 102, 241, 0.15); color: #a5b4fc; }
      .shopopti-dropdown-item:hover svg { opacity: 1; }
      
      .shopopti-divider { height: 1px; background: rgba(255,255,255,0.1); margin: 6px 0; }
      
      .shopopti-checkbox {
        position: absolute;
        top: 8px;
        left: 8px;
        width: 24px;
        height: 24px;
        background: white;
        border: 2px solid #d1d5db;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        z-index: 9998;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        font-size: 12px;
        font-weight: bold;
      }
      
      .shopopti-checkbox:hover { border-color: #8b5cf6; transform: scale(1.1); }
      .shopopti-checkbox.selected { background: #8b5cf6; border-color: #8b5cf6; color: white; }
      .shopopti-checkbox.selected::after { content: '✓'; }
      .shopopti-checkbox.imported { background: #10b981; border-color: #10b981; }
      
      .shopopti-floating-bar {
        position: fixed;
        bottom: 24px;
        right: 24px;
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px 24px;
        background: var(--shopopti-dark);
        border: 1px solid rgba(99, 102, 241, 0.3);
        border-radius: 16px;
        box-shadow: 0 15px 50px rgba(0,0,0,0.5);
        z-index: 999999;
        animation: shopopti-slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: var(--shopopti-font);
      }
      
      @keyframes shopopti-slideUp { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      
      .shopopti-floating-bar .count { color: white; font-size: 15px; font-weight: 600; }
      .shopopti-floating-bar .count span { color: #a5b4fc; font-size: 24px; font-weight: 700; margin-right: 4px; }
      
      .shopopti-toast {
        position: fixed;
        bottom: 80px;
        right: 24px;
        padding: 14px 22px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 500;
        color: white;
        z-index: 9999999;
        opacity: 0;
        transform: translateY(20px) scale(0.95);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: var(--shopopti-font);
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .shopopti-toast.show { opacity: 1; transform: translateY(0) scale(1); }
      .shopopti-toast-success { background: linear-gradient(135deg, #10b981, #059669); }
      .shopopti-toast-error { background: linear-gradient(135deg, #ef4444, #dc2626); }
      .shopopti-toast-info { background: linear-gradient(135deg, #3b82f6, #2563eb); }
      
      [data-shopopti-card] { position: relative; }
    `;
    
    document.head.appendChild(styles);
  }
  
  // ============================================
  // INJECTION LOGIC
  // ============================================
  
  function isElementVisible(el) {
    if (!el) return false;
    // Accept elements that exist in the DOM, even if inside fixed/sticky containers
    // offsetParent is null for position:fixed elements, so we check differently
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    // Element has dimensions or is in viewport
    return rect.width > 0 || rect.height > 0 || el.offsetWidth > 0 || el.offsetHeight > 0;
  }

  function injectProductPageButton(platform) {
    const selectors = platformSelectors[platform] || platformSelectors.shopify;
    const existingBtn = document.querySelector(`.shopopti-${platform}-btn`);
    
    if (existingBtn) return;
    
    let targetElement = null;
    
    // Phase 1: Try to find a visible target element
    for (const selector of selectors.productButtons) {
      const el = document.querySelector(selector);
      if (el && isElementVisible(el)) {
        targetElement = el;
        break;
      }
    }
    
    // Phase 2: If no visible element, accept any existing element
    if (!targetElement) {
      for (const selector of selectors.productButtons) {
        const el = document.querySelector(selector);
        if (el) {
          targetElement = el;
          break;
        }
      }
    }
    
    if (!targetElement) {
      if (reinjectAttempts < MAX_REINJECT_ATTEMPTS) {
        reinjectAttempts++;
        // Progressive delay: starts at 500ms, increases for later attempts
        const delay = Math.min(500 + (reinjectAttempts * 200), 2000);
        setTimeout(() => injectProductPageButton(platform), delay);
      } else {
        // All attempts failed - inject floating fallback button
        injectFloatingFallbackButton(platform);
        
        // Report broken selector if RemoteSelectorsManager available
        if (typeof RemoteSelectorsManager !== 'undefined') {
          RemoteSelectorsManager.reportBrokenSelector(platform, 'productButtons', {
            url: window.location.href,
            selectors: selectors.productButtons
          });
        }
      }
      return;
    }
    
    const button = createImportButton('single');
    button.classList.add(`shopopti-${platform}-btn`);
    
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'margin: 12px 0; display: flex; width: 100%;';
    wrapper.appendChild(button);
    
    // Smart insertion: prefer inserting after the target element
    try {
      if (targetElement.nextSibling) {
        targetElement.parentNode.insertBefore(wrapper, targetElement.nextSibling);
      } else {
        targetElement.parentNode.appendChild(wrapper);
      }
    } catch (e) {
      // If insertion fails, try appending to parent
      try {
        targetElement.parentNode.appendChild(wrapper);
      } catch (e2) {
        console.warn(`[ShopOpti+] Could not insert button for ${platform}:`, e2);
        injectFloatingFallbackButton(platform);
        return;
      }
    }
    
    console.log(`[ShopOpti+ v${VERSION}] Button injected for ${platform}`);
    reinjectAttempts = 0;
  }
  
  // ============================================
  // FLOATING FALLBACK BUTTON (when selectors fail)
  // ============================================
  
  function injectFloatingFallbackButton(platform) {
    // Only show if we're on a product page and normal injection failed
    if (document.getElementById('shopopti-floating-import')) return;
    
    const floatingBtn = document.createElement('div');
    floatingBtn.id = 'shopopti-floating-import';
    floatingBtn.innerHTML = `
      <button class="shopopti-import-btn shopopti-main-btn shopopti-floating-main">
        <svg class="shopopti-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <span class="shopopti-btn-text">Import ShopOpti+</span>
      </button>
      <span class="shopopti-floating-hint">Bouton flottant - sélecteurs non trouvés</span>
    `;
    
    floatingBtn.style.cssText = `
      position: fixed;
      bottom: 100px;
      right: 24px;
      z-index: 9999999;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
    `;
    
    const hint = floatingBtn.querySelector('.shopopti-floating-hint');
    if (hint) {
      hint.style.cssText = `
        font-size: 11px;
        color: #94a3b8;
        background: rgba(0,0,0,0.7);
        padding: 4px 8px;
        border-radius: 4px;
        max-width: 200px;
        text-align: right;
      `;
    }
    
    floatingBtn.querySelector('.shopopti-floating-main').addEventListener('click', async () => {
      await handleQuickImport(floatingBtn.querySelector('.shopopti-floating-main'), window.location.href);
    });
    
    document.body.appendChild(floatingBtn);
    
    console.log(`[ShopOpti+ v${VERSION}] Floating fallback button injected for ${platform}`);
  }
  
  function injectCategoryPageCheckboxes(platform) {
    const selectors = platformSelectors[platform] || platformSelectors.shopify;
    
    let cards = [];
    for (const selector of selectors.cards) {
      const found = document.querySelectorAll(selector);
      if (found.length > 0) {
        cards = Array.from(found).filter(card => {
          const hasLink = selectors.extractUrl(card);
          const hasImage = card.querySelector('img');
          return hasLink && hasImage;
        });
        break;
      }
    }
    
    let injectedCount = 0;
    cards.forEach(card => {
      if (card.hasAttribute('data-shopopti-card')) return;
      card.setAttribute('data-shopopti-card', 'true');
      
      const computed = window.getComputedStyle(card);
      if (computed.position === 'static') {
        card.style.position = 'relative';
      }
      
      const checkbox = document.createElement('div');
      checkbox.className = 'shopopti-checkbox';
      
      const productUrl = selectors.extractUrl(card);
      if (productUrl) {
        checkbox.dataset.productUrl = productUrl;
      }
      
      checkbox.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        checkbox.classList.toggle('selected');
        updateBulkSelection();
      });
      
      card.appendChild(checkbox);
      injectedCount++;
    });
    
    if (injectedCount > 0) {
      console.log(`[ShopOpti+ v${VERSION}] Injected ${injectedCount} checkboxes for ${platform}`);
    }
  }
  
  // ============================================
  // BULK SELECTION
  // ============================================
  
  let floatingBar = null;
  
  function updateBulkSelection() {
    const selected = document.querySelectorAll('.shopopti-checkbox.selected');
    const count = selected.length;
    
    if (count > 0) {
      if (!floatingBar) {
        floatingBar = document.createElement('div');
        floatingBar.className = 'shopopti-floating-bar';
        document.body.appendChild(floatingBar);
      }
      
      floatingBar.innerHTML = `
        <span class="count"><span>${count}</span> produit(s)</span>
        <button class="shopopti-import-btn" id="shopopti-bulk-import">
          <svg class="shopopti-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Importer tout
        </button>
        <button class="shopopti-import-btn" style="background:#64748b" id="shopopti-clear">Annuler</button>
      `;
      
      document.getElementById('shopopti-bulk-import')?.addEventListener('click', bulkImportSelected);
      document.getElementById('shopopti-clear')?.addEventListener('click', clearSelection);
    } else if (floatingBar) {
      floatingBar.remove();
      floatingBar = null;
    }
  }
  
  async function bulkImportSelected() {
    const selected = document.querySelectorAll('.shopopti-checkbox.selected');
    const urls = Array.from(selected).map(cb => cb.dataset.productUrl).filter(Boolean);
    
    if (urls.length === 0) {
      showToast('Aucun produit sélectionné', 'error');
      return;
    }
    
    // Check auth before bulk import
    if (!await ensureAuthenticated()) {
      return;
    }
    
    const btn = document.getElementById('shopopti-bulk-import');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="shopopti-spinner"></span> Import ${urls.length}...`;
    }
    
    // Use RetryManager if available for intelligent retry
    if (typeof ShopOptiRetryManager !== 'undefined') {
      try {
        const results = await ShopOptiRetryManager.batchWithRetry(
          urls,
          async (url) => {
            const response = await sendMessage({ type: 'IMPORT_FROM_URL', url });
            if (!response.success) throw new Error(response.error || 'Import failed');
            return response;
          },
          {
            maxRetries: 3,
            concurrency: 2,
            stopOnError: false,
            onItemComplete: ({ item, result, index }) => {
              const checkbox = document.querySelector(`.shopopti-checkbox[data-product-url="${CSS.escape(item)}"]`);
              if (checkbox) {
                checkbox.classList.remove('selected');
                checkbox.classList.add(result.success ? 'imported' : 'error');
              }
              // Update button progress
              if (btn) {
                btn.innerHTML = `<span class="shopopti-spinner"></span> ${index + 1}/${urls.length}...`;
              }
            },
            onRetry: ({ attempt, errorType, delay }) => {
              console.log(`[ShopOpti+] Retry attempt ${attempt}, waiting ${delay}ms...`);
            }
          }
        );
        
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = `<svg class="shopopti-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Importer tout`;
        }
        
        showToast(`${results.succeeded} importé(s), ${results.failed} erreur(s)`, results.succeeded > 0 ? 'success' : 'error');
        updateBulkSelection();
        return;
      } catch (e) {
        console.warn('[ShopOpti+] RetryManager failed, using fallback:', e);
      }
    }
    
    // Fallback to original logic with improvements
    let success = 0, errors = 0;
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      try {
        const response = await sendMessage({ type: 'IMPORT_FROM_URL', url });
        
        if (response.success) {
          success++;
          const checkbox = document.querySelector(`.shopopti-checkbox[data-product-url="${CSS.escape(url)}"]`);
          if (checkbox) {
            checkbox.classList.remove('selected');
            checkbox.classList.add('imported');
          }
        } else {
          errors++;
          const checkbox = document.querySelector(`.shopopti-checkbox[data-product-url="${CSS.escape(url)}"]`);
          if (checkbox) checkbox.classList.add('error');
        }
      } catch (e) {
        errors++;
      }
      
      // Update progress
      if (btn) {
        btn.innerHTML = `<span class="shopopti-spinner"></span> ${i + 1}/${urls.length}...`;
      }
      
      // Dynamic delay based on error rate (slow down if errors)
      const delayMs = errors > success ? 1000 : 500;
      await new Promise(r => setTimeout(r, delayMs));
    }
    
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<svg class="shopopti-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Importer tout`;
    }
    
    showToast(`${success} importé(s), ${errors} erreur(s)`, success > 0 ? 'success' : 'error');
    updateBulkSelection();
  }
  
  function clearSelection() {
    document.querySelectorAll('.shopopti-checkbox.selected').forEach(cb => cb.classList.remove('selected'));
    updateBulkSelection();
  }
  
  // ============================================
  // MUTATION OBSERVER (SPA/Infinite Scroll)
  // ============================================
  
  function setupMutationObserver() {
    if (observer) observer.disconnect();
    
    observer = new MutationObserver((mutations) => {
      if (debounceTimer) clearTimeout(debounceTimer);
      
      debounceTimer = setTimeout(() => {
        let shouldReinject = false;
        
        // Check if important elements were added
        for (const mutation of mutations) {
          if (mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === 1) {
                const el = node;
                // Check for product cards or buy buttons
                if (el.matches && (
                  el.matches('[data-asin], .s-result-item, .search-item-card, [class*="product-card"], [class*="goods-container"]') ||
                  el.querySelector('[data-asin], .s-result-item, .search-item-card, [class*="product-card"], #add-to-cart-button, .add-to-cart')
                )) {
                  shouldReinject = true;
                  break;
                }
              }
            }
          }
          if (shouldReinject) break;
        }
        
        // Check if our button was removed
        if (!shouldReinject && currentPlatform) {
          const existingBtn = document.querySelector(`.shopopti-${currentPlatform}-btn`);
          if (isProductPage() && !existingBtn) {
            shouldReinject = true;
          }
        }
        
        if (shouldReinject) {
          injectButtons();
        }
      }, DEBOUNCE_MS);
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  // ============================================
  // URL CHANGE DETECTION (SPA Navigation)
  // ============================================
  
  let lastUrl = window.location.href;
  
  function setupUrlChangeDetection() {
    // Listen for popstate (back/forward buttons)
    window.addEventListener('popstate', handleUrlChange);
    
    // Override pushState and replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function() {
      originalPushState.apply(this, arguments);
      handleUrlChange();
    };
    
    history.replaceState = function() {
      originalReplaceState.apply(this, arguments);
      handleUrlChange();
    };
  }
  
  function handleUrlChange() {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      console.log(`[ShopOpti+ v${VERSION}] URL changed, re-initializing...`);
      
      // Reset state
      reinjectAttempts = 0;
      currentPlatform = detectPlatform();
      
      // Wait for DOM to update then reinject
      setTimeout(() => {
        injectButtons();
      }, 500);
    }
  }
  
  // ============================================
  // MAIN INJECTION - ALWAYS INJECT BUTTONS
  // ============================================
  
  function injectButtons() {
    currentPlatform = detectPlatform();
    if (!currentPlatform) return;
    
    // ALWAYS inject buttons - auth check happens on action
    if (isProductPage()) {
      injectProductPageButton(currentPlatform);
    } else {
      injectCategoryPageCheckboxes(currentPlatform);
    }
  }
  
  // ============================================
  // AUTH CHECK
  // ============================================
  
  async function checkAuthStatus() {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ type: 'CHECK_AUTH_STATUS' }, (response) => {
          if (chrome.runtime.lastError) {
            resolve(false);
            return;
          }
          resolve(response?.authenticated === true);
        });
      } catch (error) {
        resolve(false);
      }
    });
  }
  
  // ============================================
  // SAAS SYNC
  // ============================================
  
  async function syncWithSaaS(action, data = {}) {
    try {
      await sendMessage({
        type: 'SYNC_DATA',
        action,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.warn('[ShopOpti+] SaaS sync failed:', e);
    }
  }
  
  async function loadSyncedSettings() {
    try {
      const response = await sendMessage({ type: 'GET_SETTINGS' });
      if (response?.settings) {
        syncedSettings = response.settings;
      }
      
      const storesResponse = await sendMessage({ type: 'GET_USER_STORES' });
      if (storesResponse?.stores) {
        userStores = storesResponse.stores;
      }
    } catch (e) {
      console.warn('[ShopOpti+] Failed to load settings:', e);
    }
  }
  
  // ============================================
  // FLOATING SIDEBAR - Always visible
  // ============================================
  
  function createFloatingSidebar() {
    if (document.getElementById('shopopti-sidebar')) return;
    
    const sidebar = document.createElement('div');
    sidebar.id = 'shopopti-sidebar';
    sidebar.className = 'shopopti-quick-panel';
    sidebar.innerHTML = `
      <button class="shopopti-quick-btn" data-action="import" title="Import rapide">
        📦
      </button>
      <button class="shopopti-quick-btn" data-action="suppliers" title="Rechercher fournisseurs">
        🔍
      </button>
      <button class="shopopti-quick-btn" data-action="compare" title="Comparer les prix">
        💰
      </button>
      <button class="shopopti-quick-btn" data-action="dashboard" title="Tableau de bord">
        📊
      </button>
      <button class="shopopti-quick-btn" data-action="settings" title="Paramètres">
        ⚙️
      </button>
    `;
    
    sidebar.querySelectorAll('.shopopti-quick-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const action = btn.dataset.action;
        
        switch (action) {
          case 'import':
            if (isProductPage()) {
              const mainBtn = document.querySelector('.shopopti-main-btn');
              if (mainBtn) mainBtn.click();
            } else {
              showToast('Allez sur une page produit pour importer', 'info');
            }
            break;
          case 'suppliers':
            await handleFindSuppliers(window.location.href);
            break;
          case 'compare':
            await handleComparePrice(window.location.href);
            break;
          case 'dashboard':
            window.open(`${APP_URL}/dashboard`, '_blank');
            break;
          case 'settings':
            window.open(`${APP_URL}/settings`, '_blank');
            break;
        }
      });
    });
    
    document.body.appendChild(sidebar);
  }
  
  // ============================================
  // INITIALIZATION
  // ============================================
  
  async function init() {
    if (isInitialized) return;
    isInitialized = true;
    
    console.log(`[ShopOpti+] Content Injector v${VERSION} initializing...`);
    
    currentPlatform = detectPlatform();
    if (!currentPlatform) {
      console.log('[ShopOpti+] Unsupported platform');
      return;
    }
    
    console.log(`[ShopOpti+] Platform: ${currentPlatform}`);
    
    // Inject styles first - ALWAYS
    injectStyles();
    
    // Initialize Gateway Client (Enterprise v2.1)
    if (typeof ShopOptiGateway !== 'undefined') {
      gatewayClient = ShopOptiGateway;
      await gatewayClient.init().catch(e => console.warn('[ShopOpti+] Gateway init error:', e));
      console.log('[ShopOpti+] Gateway Client v2.0 initialized');
    } else {
      console.warn('[ShopOpti+] Gateway Client not available, using legacy API');
    }
    
    // Initialize remote selectors for dynamic updates (non-blocking)
    initRemoteSelectors().catch(e => console.warn('[ShopOpti+] Remote selectors init error:', e));
    
    // Check auth status (non-blocking for UI)
    isAuthenticated = await checkAuthStatus();
    console.log(`[ShopOpti+] Auth status: ${isAuthenticated ? 'connected' : 'not connected'}`);
    
    // Load synced settings if authenticated
    if (isAuthenticated) {
      await loadSyncedSettings();
    }
    
    // ALWAYS inject buttons - auth check happens on action
    injectButtons();
    
    // Create floating sidebar for quick actions
    createFloatingSidebar();
    
    // Setup observers for SPA navigation
    setupMutationObserver();
    setupUrlChangeDetection();
    
    // Show welcome message
    if (!isAuthenticated) {
      showToast('🚀 ShopOpti+ actif - Connectez-vous pour importer', 'info');
    } else {
      console.log('[ShopOpti+] Authenticated with', userStores.length, 'stores');
    }
    
    // Periodic re-injection for dynamic pages
    setInterval(() => {
      if (!document.querySelector(`.shopopti-${currentPlatform}-btn`) && isProductPage()) {
        console.log('[ShopOpti+] Re-injecting buttons...');
        injectButtons();
      }
    }, 3000);
    
    console.log(`[ShopOpti+ v${VERSION}] Ready on ${currentPlatform} with Enterprise Gateway v2.1`);
  }
  
  // Start immediately
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Use requestIdleCallback for better performance
    if ('requestIdleCallback' in window) {
      requestIdleCallback(init, { timeout: 500 });
    } else {
      setTimeout(init, 100);
    }
  }
  
})();
