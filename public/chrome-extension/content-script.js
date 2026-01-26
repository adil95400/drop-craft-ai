// ============================================
// ShopOpti+ Content Injector v5.6.6
// Injects import buttons on product and category pages
// ============================================

(function() {
  'use strict';
  
  const VERSION = '5.6.6';
  const INJECTED_CLASS = 'shopopti-injected';
  
  // Platform detection
  function detectPlatform() {
    const hostname = window.location.hostname.toLowerCase();
    
    if (hostname.includes('amazon.')) return 'amazon';
    if (hostname.includes('aliexpress.')) return 'aliexpress';
    if (hostname.includes('ebay.')) return 'ebay';
    if (hostname.includes('temu.com')) return 'temu';
    if (hostname.includes('shein.')) return 'shein';
    if (hostname.includes('cdiscount.com')) return 'cdiscount';
    if (hostname.includes('fnac.com')) return 'fnac';
    if (hostname.includes('walmart.com')) return 'walmart';
    if (hostname.includes('etsy.com')) return 'etsy';
    if (hostname.includes('banggood.com')) return 'banggood';
    if (hostname.includes('dhgate.com')) return 'dhgate';
    if (hostname.includes('wish.com')) return 'wish';
    if (window.location.pathname.includes('/products/')) return 'shopify';
    if (typeof window.Shopify !== 'undefined') return 'shopify';
    
    return null;
  }
  
  // Create import button - Professional AutoDS style
  function createImportButton(type = 'single', productUrl = null) {
    const button = document.createElement('button');
    button.className = `shopopti-import-btn shopopti-import-${type} ${INJECTED_CLASS}`;
    
    if (type === 'bulk' && productUrl) {
      button.dataset.productUrl = productUrl;
    }
    
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      <span>${type === 'bulk' ? 'Import' : 'Import ShopOpti+'}</span>
    `;
    
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const urlToImport = type === 'bulk' ? button.dataset.productUrl : window.location.href;
      
      button.disabled = true;
      button.innerHTML = `<span class="shopopti-spinner"></span> Import en cours...`;
      
      try {
        // First check auth
        const authStatus = await new Promise((resolve) => {
          chrome.runtime.sendMessage({ type: 'CHECK_AUTH_STATUS' }, (response) => {
            resolve(response?.authenticated === true);
          });
        });
        
        if (!authStatus) {
          throw new Error('Veuillez vous connecter via l\'extension popup');
        }
        
        const response = await chrome.runtime.sendMessage({
          type: 'IMPORT_FROM_URL',
          url: urlToImport,
          options: {
            autoOptimize: true,
            extractReviews: true,
            extractVariants: true
          }
        });
        
        if (response.success) {
          button.innerHTML = `<span>✓</span> Importé!`;
          button.classList.add('shopopti-success');
          showNotification(`Produit importé avec succès!${response.productId ? ` (ID: ${response.productId.substring(0, 8)}...)` : ''}`, 'success');
          
          // Update badge via background
          chrome.runtime.sendMessage({ type: 'PRODUCT_IMPORTED', productId: response.productId });
        } else {
          throw new Error(response.error || 'Import échoué');
        }
      } catch (error) {
        console.error('[ShopOpti+] Import error:', error);
        button.innerHTML = `<span>✗</span> Erreur`;
        button.classList.add('shopopti-error');
        showNotification(error.message || 'Erreur lors de l\'import', 'error');
        
        // Reset button after error
        setTimeout(() => {
          button.disabled = false;
          button.classList.remove('shopopti-error');
          button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>${type === 'bulk' ? 'Import' : 'Import ShopOpti+'}</span>
          `;
        }, 3000);
      }
    });
    
    return button;
  }
  
  // Create advanced import button with options modal
  function createAdvancedImportButton() {
    const container = document.createElement('div');
    container.className = 'shopopti-advanced-import-container';
    
    const mainBtn = document.createElement('button');
    mainBtn.className = 'shopopti-import-btn shopopti-import-main';
    mainBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      <span>Import ShopOpti+</span>
    `;
    
    const dropdownBtn = document.createElement('button');
    dropdownBtn.className = 'shopopti-import-btn shopopti-import-dropdown';
    dropdownBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`;
    
    const dropdown = document.createElement('div');
    dropdown.className = 'shopopti-dropdown-menu hidden';
    dropdown.innerHTML = `
      <button class="shopopti-dropdown-item" data-action="import-quick">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        Import rapide
      </button>
      <button class="shopopti-dropdown-item" data-action="import-advanced">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        Import avec options
      </button>
      <button class="shopopti-dropdown-item" data-action="import-reviews">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        Import + Avis
      </button>
      <div class="shopopti-dropdown-divider"></div>
      <button class="shopopti-dropdown-item" data-action="find-suppliers">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        Trouver fournisseurs
      </button>
    `;
    
    container.appendChild(mainBtn);
    container.appendChild(dropdownBtn);
    container.appendChild(dropdown);
    
    // Event handlers
    mainBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await handleQuickImport(mainBtn);
    });
    
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
        if (action === 'import-quick') await handleQuickImport(mainBtn);
        if (action === 'import-advanced') await handleAdvancedImport();
        if (action === 'import-reviews') await handleImportWithReviews(mainBtn);
        if (action === 'find-suppliers') await handleFindSuppliers();
      });
    });
    
    // Close dropdown on click outside
    document.addEventListener('click', () => dropdown.classList.add('hidden'));
    
    return container;
  }
  
  async function handleQuickImport(button) {
    button.disabled = true;
    button.innerHTML = `<span class="shopopti-spinner"></span> Import...`;
    
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'IMPORT_FROM_URL',
        url: window.location.href
      });
      
      if (response.success) {
        button.innerHTML = `<span>✓</span> Importé!`;
        showNotification('Produit importé avec succès!', 'success');
        chrome.runtime.sendMessage({ type: 'PRODUCT_IMPORTED', productId: response.productId });
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      button.innerHTML = `<span>✗</span> Erreur`;
      showNotification(error.message, 'error');
      setTimeout(() => resetButton(button), 3000);
    }
  }
  
  async function handleAdvancedImport() {
    try {
      await chrome.runtime.sendMessage({
        type: 'OPEN_IMPORT_OVERLAY',
        productData: { url: window.location.href }
      });
    } catch (error) {
      showNotification('Erreur: ' + error.message, 'error');
    }
  }
  
  async function handleImportWithReviews(button) {
    button.disabled = true;
    button.innerHTML = `<span class="shopopti-spinner"></span> Import + Avis...`;
    
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'IMPORT_PRODUCT_WITH_REVIEWS',
        url: window.location.href,
        reviewLimit: 50
      });
      
      if (response.success) {
        button.innerHTML = `<span>✓</span> Importé!`;
        showNotification(`Produit + ${response.reviewsCount || 0} avis importés!`, 'success');
        chrome.runtime.sendMessage({ type: 'PRODUCT_IMPORTED', productId: response.productId });
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      button.innerHTML = `<span>✗</span> Erreur`;
      showNotification(error.message, 'error');
      setTimeout(() => resetButton(button), 3000);
    }
  }
  
  async function handleFindSuppliers() {
    try {
      await chrome.runtime.sendMessage({
        type: 'FIND_SUPPLIERS',
        productData: { url: window.location.href }
      });
      showNotification('Recherche de fournisseurs lancée...', 'info');
    } catch (error) {
      showNotification('Erreur: ' + error.message, 'error');
    }
  }
  
  function resetButton(button) {
    button.disabled = false;
    button.classList.remove('shopopti-error', 'shopopti-success');
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      <span>Import ShopOpti+</span>
    `;
  }
  
  // Show notification toast
  function showNotification(message, type = 'info') {
    const existing = document.querySelector('.shopopti-toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = `shopopti-toast shopopti-toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
  
  // Inject styles - Professional AutoDS-like design
  function injectStyles() {
    if (document.getElementById('shopopti-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'shopopti-styles';
    styles.textContent = `
      /* Main Import Button - AutoDS Professional Style */
      .shopopti-import-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 18px;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
        color: white;
        border: none;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 15px rgba(99, 102, 241, 0.35), 0 0 0 1px rgba(255,255,255,0.1) inset;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        position: relative;
        overflow: hidden;
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
        box-shadow: 0 8px 25px rgba(99, 102, 241, 0.45), 0 0 0 1px rgba(255,255,255,0.15) inset;
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
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35);
      }
      
      .shopopti-import-btn.shopopti-error {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        box-shadow: 0 4px 15px rgba(239, 68, 68, 0.35);
      }
      
      /* Advanced Import Container */
      .shopopti-advanced-import-container {
        display: inline-flex;
        position: relative;
        z-index: 9999;
      }
      
      .shopopti-import-main {
        border-radius: 10px 0 0 10px;
      }
      
      .shopopti-import-dropdown {
        padding: 10px 12px;
        border-radius: 0 10px 10px 0;
        border-left: 1px solid rgba(255,255,255,0.2);
      }
      
      .shopopti-dropdown-menu {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 8px;
        background: linear-gradient(180deg, #1e1e2e 0%, #181825 100%);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 12px;
        padding: 8px;
        min-width: 200px;
        box-shadow: 0 15px 40px rgba(0,0,0,0.4);
        z-index: 10000;
      }
      
      .shopopti-dropdown-menu.hidden {
        display: none;
      }
      
      .shopopti-dropdown-item {
        display: flex;
        align-items: center;
        gap: 10px;
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
      }
      
      .shopopti-dropdown-item:hover {
        background: rgba(99, 102, 241, 0.15);
        color: #a5b4fc;
      }
      
      .shopopti-dropdown-divider {
        height: 1px;
        background: rgba(255,255,255,0.1);
        margin: 6px 0;
      }
      
      /* Bulk Import Button */
      .shopopti-import-bulk {
        padding: 6px 12px;
        font-size: 11px;
        border-radius: 8px;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
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
      
      /* Floating Action Bar - AutoDS Style */
      .shopopti-floating-bar {
        position: fixed;
        bottom: 24px;
        right: 24px;
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px 24px;
        background: linear-gradient(135deg, #1e1e2e 0%, #0f0f1a 100%);
        border: 1px solid rgba(99, 102, 241, 0.3);
        border-radius: 16px;
        box-shadow: 0 15px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset;
        z-index: 999999;
        animation: shopopti-slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      @keyframes shopopti-slideUp {
        from { transform: translateY(100px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      
      .shopopti-floating-bar .count {
        color: white;
        font-size: 15px;
        font-weight: 600;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .shopopti-floating-bar .count span {
        color: #a5b4fc;
        font-size: 24px;
        font-weight: 700;
        margin-right: 4px;
      }
      
      .shopopti-checkbox {
        position: absolute;
        top: 8px;
        left: 8px;
        width: 22px;
        height: 22px;
        background: white;
        border: 2px solid #d1d5db;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        z-index: 9998;
        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      }
      
      .shopopti-checkbox:hover {
        border-color: #f97316;
      }
      
      .shopopti-checkbox.selected {
        background: #f97316;
        border-color: #f97316;
      }
      
      .shopopti-checkbox.selected::after {
        content: '✓';
        color: white;
        font-size: 12px;
        font-weight: bold;
      }
      
      .shopopti-toast {
        position: fixed;
        bottom: 80px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        color: white;
        z-index: 9999999;
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.3s ease;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .shopopti-toast.show {
        opacity: 1;
        transform: translateY(0);
      }
      
      .shopopti-toast-success { background: #22c55e; }
      .shopopti-toast-error { background: #ef4444; }
      .shopopti-toast-info { background: #3b82f6; }
      
      /* Amazon specific positioning */
      .shopopti-amazon-product-btn {
        margin-top: 12px;
        width: fit-content;
      }
      
      /* Product card overlay */
      [data-shopopti-card] {
        position: relative;
      }
    `;
    document.head.appendChild(styles);
  }
  
  // ============================================
  // AMAZON INJECTION
  // ============================================
  
  function injectAmazonProductPage() {
    // Check if already injected
    if (document.querySelector(`.shopopti-amazon-product-btn`)) return;
    
    // Find buy box or add to cart section
    const targets = [
      '#add-to-cart-button',
      '#buy-now-button',
      '#buybox',
      '#rightCol',
      '#desktop_buybox',
      '.a-button-stack'
    ];
    
    let targetElement = null;
    for (const selector of targets) {
      const el = document.querySelector(selector);
      if (el) {
        targetElement = el;
        break;
      }
    }
    
    if (targetElement) {
      const button = createImportButton('single');
      button.classList.add('shopopti-amazon-product-btn');
      
      // Insert after the target
      if (targetElement.parentNode) {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'margin: 12px 0; display: flex;';
        wrapper.appendChild(button);
        
        if (targetElement.nextSibling) {
          targetElement.parentNode.insertBefore(wrapper, targetElement.nextSibling);
        } else {
          targetElement.parentNode.appendChild(wrapper);
        }
      }
      
      console.log('[ShopOpti+] Product import button injected');
    }
  }
  
  function injectAmazonCategoryPage() {
    // Find all product cards
    const cardSelectors = [
      '[data-asin]:not([data-shopopti-card])',
      '.s-result-item:not([data-shopopti-card])',
      '.sg-col-inner:not([data-shopopti-card])',
      '.a-section.a-spacing-base:not([data-shopopti-card])'
    ];
    
    let cards = [];
    for (const selector of cardSelectors) {
      const found = document.querySelectorAll(selector);
      if (found.length > 0) {
        cards = Array.from(found).filter(card => {
          // Must have a link and image
          const hasLink = card.querySelector('a[href*="/dp/"]');
          const hasImage = card.querySelector('img[src*="images"]');
          const asin = card.getAttribute('data-asin');
          return (hasLink || asin) && hasImage;
        });
        break;
      }
    }
    
    cards.forEach(card => {
      if (card.hasAttribute('data-shopopti-card')) return;
      card.setAttribute('data-shopopti-card', 'true');
      
      // Make card relative if not already
      const computed = window.getComputedStyle(card);
      if (computed.position === 'static') {
        card.style.position = 'relative';
      }
      
      // Add checkbox for bulk selection
      const checkbox = document.createElement('div');
      checkbox.className = 'shopopti-checkbox';
      checkbox.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        checkbox.classList.toggle('selected');
        updateBulkSelection();
      });
      
      // Store product URL on the checkbox
      const link = card.querySelector('a[href*="/dp/"]');
      if (link) {
        checkbox.dataset.productUrl = new URL(link.href, window.location.origin).href;
      }
      
      card.appendChild(checkbox);
    });
    
    console.log(`[ShopOpti+] Injected ${cards.length} bulk checkboxes`);
  }
  
  // ============================================
  // ALIEXPRESS INJECTION
  // ============================================
  
  function injectAliExpressProductPage() {
    if (document.querySelector('.shopopti-aliexpress-btn')) return;
    
    const targets = [
      '.product-action',
      '.product-action-main',
      '.action--container',
      '.product-info',
      '.add-to-cart-button'
    ];
    
    let targetElement = null;
    for (const selector of targets) {
      const el = document.querySelector(selector);
      if (el) {
        targetElement = el;
        break;
      }
    }
    
    if (targetElement) {
      const button = createImportButton('single');
      button.classList.add('shopopti-aliexpress-btn');
      button.style.marginTop = '12px';
      
      targetElement.parentNode?.insertBefore(button, targetElement.nextSibling);
      console.log('[ShopOpti+] AliExpress import button injected');
    }
  }
  
  function injectAliExpressCategoryPage() {
    const cards = document.querySelectorAll('.search-item-card:not([data-shopopti-card]), .list-item:not([data-shopopti-card]), [data-pl-id]:not([data-shopopti-card])');
    
    cards.forEach(card => {
      card.setAttribute('data-shopopti-card', 'true');
      card.style.position = 'relative';
      
      const checkbox = document.createElement('div');
      checkbox.className = 'shopopti-checkbox';
      
      const link = card.querySelector('a[href*="/item/"]');
      if (link) {
        checkbox.dataset.productUrl = link.href;
      }
      
      checkbox.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        checkbox.classList.toggle('selected');
        updateBulkSelection();
      });
      
      card.appendChild(checkbox);
    });
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
        floatingBar.innerHTML = `
          <span class="count">${count} produit(s) sélectionné(s)</span>
          <button class="shopopti-import-btn" id="shopopti-bulk-import-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Importer tout
          </button>
          <button class="shopopti-import-btn" style="background:#64748b" id="shopopti-clear-btn">
            Annuler
          </button>
        `;
        document.body.appendChild(floatingBar);
        
        document.getElementById('shopopti-bulk-import-btn').addEventListener('click', bulkImportSelected);
        document.getElementById('shopopti-clear-btn').addEventListener('click', clearSelection);
      } else {
        floatingBar.querySelector('.count').textContent = `${count} produit(s) sélectionné(s)`;
      }
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
      showNotification('Aucun produit sélectionné', 'error');
      return;
    }
    
    const btn = document.getElementById('shopopti-bulk-import-btn');
    btn.disabled = true;
    btn.innerHTML = `<span class="shopopti-spinner"></span> Import ${urls.length}...`;
    
    let success = 0;
    let errors = 0;
    
    for (const url of urls) {
      try {
        const response = await chrome.runtime.sendMessage({
          type: 'IMPORT_FROM_URL',
          url
        });
        
        if (response.success) {
          success++;
          // Mark as imported
          const checkbox = document.querySelector(`.shopopti-checkbox[data-product-url="${url}"]`);
          if (checkbox) {
            checkbox.classList.remove('selected');
            checkbox.classList.add('imported');
            checkbox.innerHTML = '✓';
            checkbox.style.background = '#22c55e';
            checkbox.style.borderColor = '#22c55e';
            checkbox.style.color = 'white';
          }
        } else {
          errors++;
        }
      } catch (e) {
        errors++;
      }
      
      // Small delay between imports
      await new Promise(r => setTimeout(r, 500));
    }
    
    btn.disabled = false;
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      Importer tout
    `;
    
    showNotification(`${success} importé(s), ${errors} erreur(s)`, success > 0 ? 'success' : 'error');
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
    
    const url = window.location.href;
    const isProductPage = url.includes('/dp/') || 
                          url.includes('/item/') || 
                          url.includes('/products/') ||
                          url.includes('/gp/product/') ||
                          url.includes('/itm/');
    
    if (isProductPage) {
      // Product page injection
      if (platform === 'amazon') injectAmazonProductPage();
      if (platform === 'aliexpress') injectAliExpressProductPage();
    } else {
      // Category/search page injection
      if (platform === 'amazon') injectAmazonCategoryPage();
      if (platform === 'aliexpress') injectAliExpressCategoryPage();
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
  
  // Perform injection after auth verification
  function performInjection(platform) {
    console.log(`[ShopOpti+] Detected platform: ${platform}`);
    
    injectStyles();
    
    // Initial injection
    injectButtons();
    
    // Watch for dynamic content
    const observer = new MutationObserver((mutations) => {
      let shouldReinject = false;
      
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1) {
              const el = node;
              if (el.matches && (
                el.matches('[data-asin]') ||
                el.matches('.s-result-item') ||
                el.matches('.search-item-card') ||
                el.querySelector?.('[data-asin]') ||
                el.querySelector?.('.s-result-item')
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
  
  // Initialize with auth check
  async function init() {
    console.log(`[ShopOpti+] Content Injector v${VERSION} initializing...`);
    
    const platform = detectPlatform();
    if (!platform) {
      console.log('[ShopOpti+] Unsupported platform, skipping injection');
      return;
    }
    
    // Check authentication before injecting buttons
    console.log('[ShopOpti+] Checking authentication status...');
    const isAuthenticated = await checkAuthStatus();
    
    if (!isAuthenticated) {
      console.log('[ShopOpti+] Not authenticated - buttons will not be injected');
      console.log('[ShopOpti+] Please log in via the extension popup to enable import buttons');
      
      // Show subtle notification to user
      injectStyles();
      showNotification('ShopOpti+: Veuillez vous connecter pour activer l\'import', 'info');
      return;
    }
    
    console.log('[ShopOpti+] Authenticated - proceeding with injection');
    performInjection(platform);
  }
  
  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();
