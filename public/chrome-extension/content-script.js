// ============================================
// ShopOpti+ Content Injector v5.6.7 - PROFESSIONAL EDITION
// 100% AutoDS/Cartifind Feature Parity
// Supports: Amazon, AliExpress, eBay, Temu, Shein, Shopify, 30+ platforms
// ============================================

(function() {
  'use strict';
  
  const VERSION = '5.6.7';
  const INJECTED_CLASS = 'shopopti-injected';
  
  // ============================================
  // PLATFORM DETECTION (COMPREHENSIVE)
  // ============================================
  
  function detectPlatform() {
    const hostname = window.location.hostname.toLowerCase();
    const url = window.location.href.toLowerCase();
    
    // Major platforms
    if (hostname.includes('amazon.')) return 'amazon';
    if (hostname.includes('aliexpress.')) return 'aliexpress';
    if (hostname.includes('ebay.')) return 'ebay';
    if (hostname.includes('temu.com')) return 'temu';
    if (hostname.includes('shein.')) return 'shein';
    
    // French marketplaces
    if (hostname.includes('cdiscount.com')) return 'cdiscount';
    if (hostname.includes('fnac.com')) return 'fnac';
    if (hostname.includes('rakuten.')) return 'rakuten';
    if (hostname.includes('darty.com')) return 'darty';
    if (hostname.includes('boulanger.com')) return 'boulanger';
    if (hostname.includes('manomano.')) return 'manomano';
    if (hostname.includes('leroymerlin.')) return 'leroymerlin';
    
    // US retailers
    if (hostname.includes('walmart.com')) return 'walmart';
    if (hostname.includes('target.com')) return 'target';
    if (hostname.includes('bestbuy.com')) return 'bestbuy';
    if (hostname.includes('homedepot.com')) return 'homedepot';
    if (hostname.includes('costco.com')) return 'costco';
    
    // Global platforms
    if (hostname.includes('etsy.com')) return 'etsy';
    if (hostname.includes('wish.com')) return 'wish';
    if (hostname.includes('banggood.com')) return 'banggood';
    if (hostname.includes('dhgate.com')) return 'dhgate';
    if (hostname.includes('cjdropshipping.com')) return 'cjdropshipping';
    if (hostname.includes('1688.com')) return '1688';
    if (hostname.includes('taobao.com')) return 'taobao';
    
    // Shopify detection (must be last)
    if (url.includes('/products/')) return 'shopify';
    if (typeof window.Shopify !== 'undefined') return 'shopify';
    if (hostname.includes('.myshopify.com')) return 'shopify';
    
    return null;
  }
  
  function isProductPage() {
    const url = window.location.href;
    const patterns = [
      /\/dp\/[A-Z0-9]+/i,              // Amazon
      /\/item\/\d+\.html/i,            // AliExpress
      /\/itm\/\d+/i,                   // eBay
      /\/products?\//i,                 // Shopify, generic
      /\/gp\/product\//i,              // Amazon alt
      /\/goods\.html/i,                // Temu
      /\/product-detail/i,             // Shein
      /\/p\//i,                        // Various
      /\/product\//i                   // Generic
    ];
    return patterns.some(p => p.test(url));
  }
  
  // ============================================
  // IMPORT BUTTON - AUTODS PROFESSIONAL STYLE
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
    
    // Quick import click handler
    mainBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await handleQuickImport(mainBtn, type === 'bulk' ? productUrl : window.location.href);
    });
    
    container.appendChild(mainBtn);
    
    // Add dropdown for advanced options (only on product pages)
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
        <div class="shopopti-divider"></div>
        <button class="shopopti-dropdown-item" data-action="suppliers">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          Trouver fournisseurs
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
          
          if (action === 'quick') await handleQuickImport(mainBtn, url);
          else if (action === 'advanced') await handleAdvancedImport(url);
          else if (action === 'reviews') await handleImportWithReviews(mainBtn, url);
          else if (action === 'suppliers') await handleFindSuppliers(url);
        });
      });
      
      container.appendChild(dropdownBtn);
      container.appendChild(dropdown);
      
      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) dropdown.classList.add('hidden');
      });
    }
    
    return container;
  }
  
  // ============================================
  // IMPORT HANDLERS
  // ============================================
  
  async function handleQuickImport(button, url) {
    setButtonLoading(button, true);
    
    try {
      const response = await sendMessage({
        type: 'IMPORT_FROM_URL',
        url,
        options: { autoOptimize: true, extractReviews: true, extractVariants: true }
      });
      
      if (response.success) {
        setButtonSuccess(button);
        showToast(`✓ Produit importé!${response.productId ? ` (ID: ${response.productId.substring(0, 8)}...)` : ''}`, 'success');
        sendMessage({ type: 'PRODUCT_IMPORTED', productId: response.productId });
      } else {
        throw new Error(response.error || 'Import échoué');
      }
    } catch (error) {
      console.error('[ShopOpti+] Import error:', error);
      setButtonError(button);
      showToast(error.message || 'Erreur lors de l\'import', 'error');
      setTimeout(() => resetButton(button), 3000);
    }
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
        showToast(`✓ Produit + ${response.reviewsCount || response.reviews?.count || 0} avis importés!`, 'success');
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
  
  async function handleFindSuppliers(url) {
    try {
      await sendMessage({
        type: 'FIND_SUPPLIERS',
        productData: { url }
      });
      showToast('🔍 Recherche de fournisseurs lancée...', 'info');
    } catch (error) {
      showToast('Erreur: ' + error.message, 'error');
    }
  }
  
  // ============================================
  // BUTTON STATE HELPERS
  // ============================================
  
  function setButtonLoading(button, loading, text = 'Import...') {
    const btn = button.querySelector ? button.querySelector('.shopopti-main-btn') || button : button;
    btn.disabled = loading;
    if (loading) {
      btn.innerHTML = `<span class="shopopti-spinner"></span><span class="shopopti-btn-text">${text}</span>`;
    }
  }
  
  function setButtonSuccess(button) {
    const btn = button.querySelector ? button.querySelector('.shopopti-main-btn') || button : button;
    btn.classList.add('shopopti-success');
    btn.innerHTML = `<span class="shopopti-icon-check">✓</span><span class="shopopti-btn-text">Importé!</span>`;
  }
  
  function setButtonError(button) {
    const btn = button.querySelector ? button.querySelector('.shopopti-main-btn') || button : button;
    btn.classList.add('shopopti-error');
    btn.innerHTML = `<span class="shopopti-icon-error">✗</span><span class="shopopti-btn-text">Erreur</span>`;
  }
  
  function resetButton(button, text = 'Import ShopOpti+') {
    const btn = button.querySelector ? button.querySelector('.shopopti-main-btn') || button : button;
    btn.disabled = false;
    btn.classList.remove('shopopti-success', 'shopopti-error');
    btn.innerHTML = `
      <svg class="shopopti-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      <span class="shopopti-btn-text">${text}</span>
    `;
  }
  
  // ============================================
  // MESSAGING HELPER
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
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
  
  // ============================================
  // PROFESSIONAL STYLES (AUTODS/CARTIFIND)
  // ============================================
  
  function injectStyles() {
    if (document.getElementById('shopopti-pro-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'shopopti-pro-styles';
    styles.textContent = `
      /* ========================================
         SHOPOPTI+ PROFESSIONAL UI v5.6.7
         AutoDS/Cartifind-quality styling
      ======================================== */
      
      :root {
        --shopopti-primary: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
        --shopopti-success: linear-gradient(135deg, #10b981 0%, #059669 100%);
        --shopopti-error: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        --shopopti-dark: linear-gradient(180deg, #1e1e2e 0%, #0f0f1a 100%);
        --shopopti-shadow: 0 4px 15px rgba(99, 102, 241, 0.35);
        --shopopti-shadow-lg: 0 8px 30px rgba(99, 102, 241, 0.45);
        --shopopti-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      }
      
      /* Import Button Container */
      .shopopti-import-container {
        display: inline-flex;
        position: relative;
        z-index: 9999;
        font-family: var(--shopopti-font);
      }
      
      /* Main Import Button */
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
      
      .shopopti-import-btn:hover::before {
        left: 100%;
      }
      
      .shopopti-import-btn:hover {
        transform: translateY(-2px);
        box-shadow: var(--shopopti-shadow-lg), inset 0 0 0 1px rgba(255,255,255,0.15);
      }
      
      .shopopti-import-btn:active {
        transform: translateY(0);
      }
      
      .shopopti-import-btn:disabled {
        opacity: 0.8;
        cursor: wait;
        transform: none;
      }
      
      .shopopti-import-btn.shopopti-success {
        background: var(--shopopti-success);
        box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35);
      }
      
      .shopopti-import-btn.shopopti-error {
        background: var(--shopopti-error);
        box-shadow: 0 4px 15px rgba(239, 68, 68, 0.35);
      }
      
      /* Main button with dropdown */
      .shopopti-main-btn {
        border-radius: 10px 0 0 10px;
      }
      
      .shopopti-dropdown-btn {
        padding: 10px 12px;
        border-radius: 0 10px 10px 0;
        border-left: 1px solid rgba(255,255,255,0.2);
      }
      
      .shopopti-import-container:not(:has(.shopopti-dropdown-btn)) .shopopti-main-btn {
        border-radius: 10px;
      }
      
      /* Icons */
      .shopopti-icon {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }
      
      .shopopti-icon-sm {
        width: 12px;
        height: 12px;
      }
      
      /* Spinner */
      .shopopti-spinner {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255,255,255,0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: shopopti-spin 0.8s linear infinite;
      }
      
      @keyframes shopopti-spin {
        to { transform: rotate(360deg); }
      }
      
      /* Dropdown Menu */
      .shopopti-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 8px;
        background: var(--shopopti-dark);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 12px;
        padding: 8px;
        min-width: 220px;
        box-shadow: 0 15px 40px rgba(0,0,0,0.5);
        z-index: 10000;
      }
      
      .shopopti-dropdown.hidden {
        display: none;
      }
      
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
      
      .shopopti-dropdown-item svg {
        width: 16px;
        height: 16px;
        opacity: 0.7;
      }
      
      .shopopti-dropdown-item:hover {
        background: rgba(99, 102, 241, 0.15);
        color: #a5b4fc;
      }
      
      .shopopti-dropdown-item:hover svg {
        opacity: 1;
      }
      
      .shopopti-divider {
        height: 1px;
        background: rgba(255,255,255,0.1);
        margin: 6px 0;
      }
      
      /* Bulk Checkbox */
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
      
      .shopopti-checkbox:hover {
        border-color: #8b5cf6;
        transform: scale(1.1);
      }
      
      .shopopti-checkbox.selected {
        background: #8b5cf6;
        border-color: #8b5cf6;
        color: white;
      }
      
      .shopopti-checkbox.selected::after {
        content: '✓';
      }
      
      .shopopti-checkbox.imported {
        background: #10b981;
        border-color: #10b981;
        color: white;
      }
      
      /* Floating Bulk Action Bar */
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
        box-shadow: 0 15px 50px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05);
        z-index: 999999;
        animation: shopopti-slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: var(--shopopti-font);
      }
      
      @keyframes shopopti-slideUp {
        from { transform: translateY(100px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      
      .shopopti-floating-bar .count {
        color: white;
        font-size: 15px;
        font-weight: 600;
      }
      
      .shopopti-floating-bar .count span {
        color: #a5b4fc;
        font-size: 24px;
        font-weight: 700;
        margin-right: 4px;
      }
      
      /* Toast Notifications */
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
      
      .shopopti-toast.show {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      
      .shopopti-toast-success { 
        background: linear-gradient(135deg, #10b981, #059669);
      }
      
      .shopopti-toast-error { 
        background: linear-gradient(135deg, #ef4444, #dc2626);
      }
      
      .shopopti-toast-info { 
        background: linear-gradient(135deg, #3b82f6, #2563eb);
      }
      
      /* Card overlay styling */
      [data-shopopti-card] {
        position: relative;
      }
      
      /* Platform-specific adjustments */
      .shopopti-amazon-btn {
        margin-top: 12px;
        width: fit-content;
      }
      
      .shopopti-aliexpress-btn {
        margin-top: 12px;
      }
      
      .shopopti-ebay-btn {
        margin-top: 12px;
      }
      
      .shopopti-temu-btn {
        margin-top: 12px;
      }
      
      .shopopti-shein-btn {
        margin-top: 12px;
      }
    `;
    
    document.head.appendChild(styles);
  }
  
  // ============================================
  // PLATFORM-SPECIFIC INJECTORS
  // ============================================
  
  const platformInjectors = {
    amazon: {
      productSelectors: ['#add-to-cart-button', '#buy-now-button', '#buybox', '#rightCol', '#desktop_buybox', '.a-button-stack'],
      cardSelectors: ['[data-asin]:not([data-shopopti-card])', '.s-result-item:not([data-shopopti-card])'],
      linkPattern: /\/dp\/([A-Z0-9]+)/i,
      extractUrl: (card) => {
        const link = card.querySelector('a[href*="/dp/"]');
        return link ? new URL(link.href, window.location.origin).href : null;
      }
    },
    aliexpress: {
      productSelectors: ['.product-action', '.product-action-main', '.action--container', '.product-info', '[class*="AddCart"]'],
      cardSelectors: ['.search-item-card:not([data-shopopti-card])', '.list-item:not([data-shopopti-card])', '[data-pl-id]:not([data-shopopti-card])'],
      linkPattern: /\/item\/(\d+)\.html/i,
      extractUrl: (card) => {
        const link = card.querySelector('a[href*="/item/"]');
        return link ? link.href : null;
      }
    },
    ebay: {
      productSelectors: ['#binBtn_btn', '#is498i498', '.ux-call-to-action', '#mainContent .x-bin-action'],
      cardSelectors: ['.s-item:not([data-shopopti-card])', '.srp-results .s-item__wrapper:not([data-shopopti-card])'],
      linkPattern: /\/itm\/(\d+)/i,
      extractUrl: (card) => {
        const link = card.querySelector('a[href*="/itm/"]');
        return link ? link.href : null;
      }
    },
    temu: {
      productSelectors: ['[class*="AddToCart"]', '[class*="buy-button"]', '[class*="action-bar"]'],
      cardSelectors: ['[class*="goods-container"]:not([data-shopopti-card])', '[class*="product-card"]:not([data-shopopti-card])'],
      linkPattern: /\/goods\.html/i,
      extractUrl: (card) => {
        const link = card.querySelector('a[href*="goods.html"]');
        return link ? link.href : null;
      }
    },
    shein: {
      productSelectors: ['[class*="add-cart"]', '[class*="product-intro"]', '.product-action'],
      cardSelectors: ['[class*="product-card"]:not([data-shopopti-card])', '[class*="goods-item"]:not([data-shopopti-card])'],
      linkPattern: /\/product-detail/i,
      extractUrl: (card) => {
        const link = card.querySelector('a[href*="product"]');
        return link ? link.href : null;
      }
    },
    shopify: {
      productSelectors: ['[type="submit"][name="add"]', '.product-form__submit', '.add-to-cart', '#AddToCart', '.product__add-to-cart'],
      cardSelectors: ['.product-card:not([data-shopopti-card])', '[class*="product-item"]:not([data-shopopti-card])'],
      linkPattern: /\/products\//i,
      extractUrl: (card) => {
        const link = card.querySelector('a[href*="/products/"]');
        return link ? link.href : null;
      }
    }
  };
  
  function injectProductPageButton(platform) {
    const config = platformInjectors[platform] || platformInjectors.shopify;
    
    // Check if already injected
    if (document.querySelector(`.shopopti-${platform}-btn`)) return;
    
    let targetElement = null;
    for (const selector of config.productSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        targetElement = el;
        break;
      }
    }
    
    if (targetElement) {
      const button = createImportButton('single');
      button.classList.add(`shopopti-${platform}-btn`);
      
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'margin: 12px 0; display: flex;';
      wrapper.appendChild(button);
      
      if (targetElement.nextSibling) {
        targetElement.parentNode.insertBefore(wrapper, targetElement.nextSibling);
      } else {
        targetElement.parentNode.appendChild(wrapper);
      }
      
      console.log(`[ShopOpti+] Product button injected for ${platform}`);
    } else {
      console.log(`[ShopOpti+] No target found for ${platform} product page`);
    }
  }
  
  function injectCategoryPageCheckboxes(platform) {
    const config = platformInjectors[platform] || platformInjectors.shopify;
    
    let cards = [];
    for (const selector of config.cardSelectors) {
      const found = document.querySelectorAll(selector);
      if (found.length > 0) {
        cards = Array.from(found).filter(card => {
          const hasLink = config.extractUrl(card);
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
      
      const productUrl = config.extractUrl(card);
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
      console.log(`[ShopOpti+] Injected ${injectedCount} bulk checkboxes for ${platform}`);
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
        <button class="shopopti-import-btn" style="background:#64748b" id="shopopti-clear">
          Annuler
        </button>
      `;
      
      document.getElementById('shopopti-bulk-import')?.addEventListener('click', bulkImportSelected);
      document.getElementById('shopopti-clear')?.addEventListener('click', clearSelection);
    } else {
      if (floatingBar) {
        floatingBar.remove();
        floatingBar = null;
      }
    }
  }
  
  async function bulkImportSelected() {
    const selected = document.querySelectorAll('.shopopti-checkbox.selected');
    const urls = Array.from(selected).map(cb => cb.dataset.productUrl).filter(Boolean);
    
    if (urls.length === 0) {
      showToast('Aucun produit sélectionné', 'error');
      return;
    }
    
    const btn = document.getElementById('shopopti-bulk-import');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="shopopti-spinner"></span> Import ${urls.length}...`;
    }
    
    let success = 0;
    let errors = 0;
    
    for (const url of urls) {
      try {
        const response = await sendMessage({
          type: 'IMPORT_FROM_URL',
          url
        });
        
        if (response.success) {
          success++;
          const checkbox = document.querySelector(`.shopopti-checkbox[data-product-url="${CSS.escape(url)}"]`);
          if (checkbox) {
            checkbox.classList.remove('selected');
            checkbox.classList.add('imported');
          }
        } else {
          errors++;
        }
      } catch (e) {
        errors++;
      }
      
      await new Promise(r => setTimeout(r, 500));
    }
    
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `
        <svg class="shopopti-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Importer tout
      `;
    }
    
    showToast(`${success} importé(s), ${errors} erreur(s)`, success > 0 ? 'success' : 'error');
    updateBulkSelection();
  }
  
  function clearSelection() {
    document.querySelectorAll('.shopopti-checkbox.selected').forEach(cb => {
      cb.classList.remove('selected');
    });
    updateBulkSelection();
  }
  
  // ============================================
  // MAIN INJECTION LOGIC
  // ============================================
  
  function injectButtons() {
    const platform = detectPlatform();
    if (!platform) return;
    
    if (isProductPage()) {
      injectProductPageButton(platform);
    } else {
      injectCategoryPageCheckboxes(platform);
    }
  }
  
  // ============================================
  // AUTHENTICATION CHECK
  // ============================================
  
  async function checkAuthStatus() {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ type: 'CHECK_AUTH_STATUS' }, (response) => {
          if (chrome.runtime.lastError) {
            console.log('[ShopOpti+] Auth check error:', chrome.runtime.lastError.message);
            resolve(false);
            return;
          }
          resolve(response?.authenticated === true);
        });
      } catch (error) {
        console.log('[ShopOpti+] Auth check failed:', error);
        resolve(false);
      }
    });
  }
  
  // ============================================
  // INITIALIZATION
  // ============================================
  
  async function init() {
    console.log(`[ShopOpti+] Content Injector v${VERSION} initializing...`);
    
    const platform = detectPlatform();
    if (!platform) {
      console.log('[ShopOpti+] Unsupported platform, skipping injection');
      return;
    }
    
    console.log(`[ShopOpti+] Detected platform: ${platform}`);
    
    // Check authentication
    const isAuthenticated = await checkAuthStatus();
    
    if (!isAuthenticated) {
      console.log('[ShopOpti+] Not authenticated - buttons will not be injected');
      injectStyles();
      showToast('ShopOpti+: Connectez-vous pour activer l\'import', 'info');
      return;
    }
    
    console.log('[ShopOpti+] Authenticated - proceeding with injection');
    
    injectStyles();
    injectButtons();
    
    // Watch for dynamic content (SPA, infinite scroll)
    const observer = new MutationObserver((mutations) => {
      let shouldReinject = false;
      
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1) {
              const el = node;
              if (el.querySelector && (
                el.querySelector('[data-asin]') ||
                el.querySelector('.s-result-item') ||
                el.querySelector('.search-item-card') ||
                el.querySelector('[class*="product-card"]')
              )) {
                shouldReinject = true;
                break;
              }
            }
          }
        }
        if (shouldReinject) break;
      }
      
      if (shouldReinject) {
        setTimeout(injectButtons, 500);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('[ShopOpti+] Content Injector ready');
  }
  
  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();
