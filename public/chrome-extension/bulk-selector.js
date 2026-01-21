/**
 * Drop Craft AI - Bulk Product Selector v4.0
 * Advanced multi-product selection on listing pages
 * Similar to AutoDS bulk import functionality
 */

(function() {
  'use strict';

  if (window.__dropCraftBulkSelectorLoaded) return;
  window.__dropCraftBulkSelectorLoaded = true;

  const CONFIG = {
    API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
    APP_URL: 'https://shopopti.io',
    MAX_SELECTION: 100,
    PLATFORMS: {
      'aliexpress': {
        listingPage: ['/wholesale', '/category', 'SearchText=', '/w/', '/gcp/'],
        productCard: '.search-item-card-wrapper-gallery, .list--gallery--34TropR, [data-widget-type="search"], .search-card-item, .product-snippet, [class*="SearchProduct"], [class*="gallery-card"], [class*="list--galley"]',
        productPage: ['/item/', '/i/'],
        title: '.multi--titleText--nXeOvyr, .manhattan--titleText--WccHjR6, h1, [class*="title"], .title--wrap--UUHae_g h1',
        price: '.multi--price-sale--U-S0jtj, .manhattan--price-sale--1CCSZfK, [class*="price-current"], [class*="price-sale"]',
        image: '.images--imageWindow--1Z-J9gn img, .manhattan--image--2R6Y3dg img, .slider--img--K6MIH9z img, img[src*="ae0"]',
        link: 'a[href*="/item/"], a[href*="/i/"]',
        orders: '.multi--trade--Ktbl2jB, .manhattan--trade--29OoFSY, [class*="sold"]',
        rating: '.multi--starIconContainer--2tNYp3F, [class*="rating"]'
      },
      'amazon': {
        listingPage: ['/s?', '/s/', 'keywords='],
        productCard: '[data-component-type="s-search-result"], .s-result-item',
        productPage: ['/dp/', '/gp/product/'],
        title: 'h2 span, .s-title-instructions-style span',
        price: '.a-price-whole, .a-offscreen',
        image: '.s-image, img.s-image',
        link: 'a.a-link-normal[href*="/dp/"], a[href*="/dp/"]',
        orders: '.a-size-base.s-underline-text',
        rating: '.a-icon-alt'
      },
      'temu': {
        listingPage: ['/search_result', '/channel/', '/category/'],
        productCard: '._2BUQJ_w2, [data-testid="goods-item"], [class*="ProductCard"]',
        productPage: ['/goods/', '/product/'],
        title: '._2G7NFXUf, ._1VOXlKK6, [class*="ProductTitle"]',
        price: '._2RL5rSJD, ._3-xKlY6e, [class*="Price"]',
        image: '._3tKlrXZ8 img, img[src*="temu"]',
        link: 'a',
        orders: '[class*="sold"]',
        rating: '[class*="rating"]'
      },
      'ebay': {
        listingPage: ['/sch/', '/b/', 'LH_BIN='],
        productCard: '.s-item, [data-view*="mi:"], .srp-results .s-item__wrapper',
        productPage: ['/itm/'],
        title: '.s-item__title, h3.s-item__title',
        price: '.s-item__price',
        image: '.s-item__image img',
        link: '.s-item__link, a.s-item__link',
        orders: '.s-item__quantitySold',
        rating: ''
      },
      'walmart': {
        listingPage: ['/search?', '/browse/'],
        productCard: '[data-testid="list-view"], [data-item-id]',
        productPage: ['/ip/'],
        title: '[class*="product-title"], span[data-automation-id="product-title"]',
        price: '[data-automation-id="product-price"] span, [class*="price"]',
        image: 'img[data-testid*="image"], img[loading="lazy"]',
        link: 'a[link-identifier]',
        orders: '',
        rating: ''
      },
      'etsy': {
        listingPage: ['/search?', '/c/'],
        productCard: '[data-search-results] .v2-listing-card',
        productPage: ['/listing/'],
        title: 'h3',
        price: 'span[class*="price"]',
        image: 'img',
        link: 'a',
        orders: '',
        rating: ''
      }
    }
  };

  class DropCraftBulkSelector {
    constructor() {
      this.platform = null;
      this.selectors = null;
      this.selectedProducts = new Map();
      this.isActive = false;
      this.selectionOrder = [];
      
      this.detectPlatform();
      if (this.platform && this.isListingPage()) {
        this.injectUI();
        this.bindEvents();
      }
    }

    detectPlatform() {
      const hostname = window.location.hostname.toLowerCase();
      for (const [key, config] of Object.entries(CONFIG.PLATFORMS)) {
        if (hostname.includes(key)) {
          this.platform = key;
          this.selectors = config;
          return;
        }
      }
    }

    isListingPage() {
      if (!this.selectors?.listingPage) return false;
      const url = window.location.href;
      return this.selectors.listingPage.some(indicator => url.includes(indicator));
    }

    isProductPage() {
      if (!this.selectors?.productPage) return false;
      const url = window.location.href;
      return this.selectors.productPage.some(indicator => url.includes(indicator));
    }

    async getToken() {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.get(['extensionToken'], (result) => {
            resolve(result.extensionToken || null);
          });
        } else {
          resolve(null);
        }
      });
    }

    injectUI() {
      const style = document.createElement('style');
      style.id = 'dc-bulk-selector-styles';
      style.textContent = `
        /* Floating Action Bar */
        .dc-bulk-fab {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #1e1e2e 0%, #2d2d3d 100%);
          border: 1px solid rgba(102, 126, 234, 0.4);
          border-radius: 20px;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          z-index: 10000;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }
        
        .dc-bulk-fab.visible {
          opacity: 1;
          visibility: visible;
        }
        
        .dc-bulk-fab-count {
          display: flex;
          align-items: center;
          gap: 10px;
          color: white;
        }
        
        .dc-bulk-fab-badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 6px 14px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 16px;
          min-width: 40px;
          text-align: center;
        }
        
        .dc-bulk-fab-text {
          font-size: 14px;
          color: #94a3b8;
        }
        
        .dc-bulk-fab-actions {
          display: flex;
          gap: 10px;
        }
        
        .dc-bulk-fab-btn {
          padding: 10px 20px;
          border-radius: 12px;
          border: none;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .dc-bulk-fab-btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .dc-bulk-fab-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        
        .dc-bulk-fab-btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }
        
        .dc-bulk-fab-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
        }
        
        .dc-bulk-fab-btn-danger {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }
        
        .dc-bulk-fab-btn-danger:hover {
          background: rgba(239, 68, 68, 0.3);
        }
        
        /* Activation Button */
        .dc-bulk-activate {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 16px 24px;
          border-radius: 16px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 6px 30px rgba(102, 126, 234, 0.5);
          z-index: 10000;
          transition: all 0.3s ease;
        }
        
        .dc-bulk-activate:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 40px rgba(102, 126, 234, 0.6);
        }
        
        .dc-bulk-activate.hidden {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
        }
        
        .dc-bulk-activate-icon {
          font-size: 20px;
        }
        
        /* Product Card Selection */
        .dc-bulk-selectable {
          position: relative !important;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .dc-bulk-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: transparent;
          border: 3px solid transparent;
          border-radius: 12px;
          cursor: pointer;
          z-index: 100;
          transition: all 0.2s ease;
        }
        
        .dc-bulk-overlay:hover {
          background: rgba(102, 126, 234, 0.1);
          border-color: rgba(102, 126, 234, 0.5);
        }
        
        .dc-bulk-overlay.selected {
          background: rgba(102, 126, 234, 0.15);
          border-color: #667eea;
        }
        
        .dc-bulk-selectable.selected {
          transform: scale(1.02);
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.4);
        }
        
        .dc-bulk-checkbox {
          position: absolute;
          top: 12px;
          left: 12px;
          width: 28px;
          height: 28px;
          background: rgba(30, 30, 46, 0.95);
          border: 2px solid rgba(102, 126, 234, 0.6);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: transparent;
          font-size: 16px;
          font-weight: bold;
          transition: all 0.2s ease;
          z-index: 101;
        }
        
        .dc-bulk-overlay.selected .dc-bulk-checkbox {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: transparent;
          color: white;
        }
        
        .dc-bulk-order-badge {
          position: absolute;
          bottom: 12px;
          left: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          z-index: 101;
          opacity: 0;
          transform: scale(0);
          transition: all 0.2s ease;
        }
        
        .dc-bulk-overlay.selected .dc-bulk-order-badge {
          opacity: 1;
          transform: scale(1);
        }
        
        .dc-bulk-quick-import {
          position: absolute;
          top: 12px;
          right: 12px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          opacity: 0;
          transform: translateY(-8px);
          transition: all 0.2s ease;
          z-index: 101;
        }
        
        .dc-bulk-overlay:hover .dc-bulk-quick-import {
          opacity: 1;
          transform: translateY(0);
        }
        
        /* Stats Header */
        .dc-bulk-stats-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: linear-gradient(135deg, #1e1e2e 0%, #2d2d3d 100%);
          border-bottom: 1px solid rgba(102, 126, 234, 0.3);
          padding: 12px 24px;
          display: none;
          justify-content: space-between;
          align-items: center;
          z-index: 10001;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        .dc-bulk-stats-bar.active {
          display: flex;
        }
        
        .dc-bulk-stats-left {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        
        .dc-bulk-stat {
          text-align: center;
        }
        
        .dc-bulk-stat-value {
          color: white;
          font-size: 18px;
          font-weight: 700;
        }
        
        .dc-bulk-stat-label {
          color: #64748b;
          font-size: 10px;
          text-transform: uppercase;
        }
        
        .dc-bulk-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          color: white;
          font-weight: 700;
        }
        
        .dc-bulk-logo-icon {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }
        
        /* Import Modal */
        .dc-bulk-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 100000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        .dc-bulk-modal.active {
          display: flex;
        }
        
        .dc-bulk-modal-content {
          background: linear-gradient(135deg, #1e1e2e 0%, #2d2d3d 100%);
          border: 1px solid rgba(102, 126, 234, 0.3);
          border-radius: 24px;
          padding: 32px;
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          overflow-y: auto;
        }
        
        .dc-bulk-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .dc-bulk-modal-title {
          color: white;
          font-size: 24px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .dc-bulk-modal-close {
          background: none;
          border: none;
          color: #64748b;
          font-size: 24px;
          cursor: pointer;
        }
        
        .dc-bulk-modal-close:hover {
          color: #ef4444;
        }
        
        .dc-bulk-progress {
          margin-bottom: 24px;
        }
        
        .dc-bulk-progress-bar {
          width: 100%;
          height: 12px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          overflow: hidden;
        }
        
        .dc-bulk-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          width: 0%;
          transition: width 0.3s ease;
        }
        
        .dc-bulk-progress-text {
          color: #94a3b8;
          font-size: 14px;
          margin-top: 8px;
          text-align: center;
        }
        
        .dc-bulk-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .dc-bulk-stats-item {
          background: rgba(255, 255, 255, 0.05);
          padding: 16px;
          border-radius: 12px;
          text-align: center;
        }
        
        .dc-bulk-stats-item-value {
          font-size: 28px;
          font-weight: 700;
          color: white;
        }
        
        .dc-bulk-stats-item-value.success { color: #10b981; }
        .dc-bulk-stats-item-value.error { color: #ef4444; }
        .dc-bulk-stats-item-value.pending { color: #f59e0b; }
        
        .dc-bulk-stats-item-label {
          color: #64748b;
          font-size: 12px;
          margin-top: 4px;
        }
        
        .dc-bulk-current-item {
          display: flex;
          align-items: center;
          gap: 16px;
          background: rgba(255, 255, 255, 0.05);
          padding: 16px;
          border-radius: 12px;
        }
        
        .dc-bulk-current-img {
          width: 64px;
          height: 64px;
          border-radius: 8px;
          object-fit: cover;
        }
        
        .dc-bulk-current-info {
          flex: 1;
        }
        
        .dc-bulk-current-title {
          color: white;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 4px;
        }
        
        .dc-bulk-current-status {
          color: #64748b;
          font-size: 12px;
        }
        
        .dc-bulk-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid rgba(102, 126, 234, 0.3);
          border-top-color: #667eea;
          border-radius: 50%;
          animation: dc-spin 1s linear infinite;
        }
        
        @keyframes dc-spin {
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);

      // Create activation button
      const activateBtn = document.createElement('button');
      activateBtn.className = 'dc-bulk-activate';
      activateBtn.id = 'dc-bulk-activate';
      activateBtn.innerHTML = `
        <span class="dc-bulk-activate-icon">📦</span>
        <span>Sélection Multiple</span>
      `;
      document.body.appendChild(activateBtn);

      // Create floating action bar
      const fab = document.createElement('div');
      fab.className = 'dc-bulk-fab';
      fab.id = 'dc-bulk-fab';
      fab.innerHTML = `
        <div class="dc-bulk-fab-count">
          <span class="dc-bulk-fab-badge" id="dc-bulk-count">0</span>
          <span class="dc-bulk-fab-text">produit(s) sélectionné(s)</span>
        </div>
        <div class="dc-bulk-fab-actions">
          <button class="dc-bulk-fab-btn dc-bulk-fab-btn-secondary" id="dc-bulk-select-all">
            ☑️ Tout sélectionner
          </button>
          <button class="dc-bulk-fab-btn dc-bulk-fab-btn-primary" id="dc-bulk-import">
            🚀 Importer
          </button>
          <button class="dc-bulk-fab-btn dc-bulk-fab-btn-danger" id="dc-bulk-clear">
            ✕
          </button>
        </div>
      `;
      document.body.appendChild(fab);

      // Create import modal
      const modal = document.createElement('div');
      modal.className = 'dc-bulk-modal';
      modal.id = 'dc-bulk-modal';
      modal.innerHTML = `
        <div class="dc-bulk-modal-content">
          <div class="dc-bulk-modal-header">
            <div class="dc-bulk-modal-title">
              📦 Import en cours
            </div>
            <button class="dc-bulk-modal-close" id="dc-bulk-modal-close">✕</button>
          </div>
          <div class="dc-bulk-progress">
            <div class="dc-bulk-progress-bar">
              <div class="dc-bulk-progress-fill" id="dc-bulk-progress-fill"></div>
            </div>
            <div class="dc-bulk-progress-text" id="dc-bulk-progress-text">Préparation...</div>
          </div>
          <div class="dc-bulk-stats-grid">
            <div class="dc-bulk-stats-item">
              <div class="dc-bulk-stats-item-value success" id="dc-bulk-success">0</div>
              <div class="dc-bulk-stats-item-label">Réussis</div>
            </div>
            <div class="dc-bulk-stats-item">
              <div class="dc-bulk-stats-item-value error" id="dc-bulk-error">0</div>
              <div class="dc-bulk-stats-item-label">Échoués</div>
            </div>
            <div class="dc-bulk-stats-item">
              <div class="dc-bulk-stats-item-value pending" id="dc-bulk-pending">0</div>
              <div class="dc-bulk-stats-item-label">En attente</div>
            </div>
          </div>
          <div class="dc-bulk-current-item" id="dc-bulk-current" style="display: none;">
            <img class="dc-bulk-current-img" id="dc-bulk-current-img" src="" alt="">
            <div class="dc-bulk-current-info">
              <div class="dc-bulk-current-title" id="dc-bulk-current-title">-</div>
              <div class="dc-bulk-current-status">Import en cours...</div>
            </div>
            <div class="dc-bulk-spinner"></div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    bindEvents() {
      document.getElementById('dc-bulk-activate')?.addEventListener('click', () => this.activate());
      document.getElementById('dc-bulk-select-all')?.addEventListener('click', () => this.selectAll());
      document.getElementById('dc-bulk-import')?.addEventListener('click', () => this.importSelected());
      document.getElementById('dc-bulk-clear')?.addEventListener('click', () => this.clearSelection());
      document.getElementById('dc-bulk-modal-close')?.addEventListener('click', () => this.closeModal());

      // Listen for messages from other components
      window.addEventListener('message', (event) => {
        if (event.data.type === 'ACTIVATE_BULK_SELECTOR') {
          this.activate();
        }
      });
      
      // Also inject import buttons on listing pages immediately
      this.injectImportButtons();
    }

    // NEW: Inject import buttons on every product card (catalog pages)
    injectImportButtons() {
      if (!this.platform || !this.isListingPage()) return;
      
      const cards = document.querySelectorAll(this.selectors.productCard);
      
      cards.forEach((card, index) => {
        if (card.querySelector('.dc-quick-import-btn')) return;
        
        // Make container relative if needed
        const computedStyle = window.getComputedStyle(card);
        if (computedStyle.position === 'static') {
          card.style.position = 'relative';
        }
        
        const btn = document.createElement('button');
        btn.className = 'dc-quick-import-btn';
        btn.innerHTML = '📥 Import';
        btn.style.cssText = `
          position: absolute;
          top: 8px;
          right: 8px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          z-index: 1000;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 4px;
        `;
        
        btn.addEventListener('mouseenter', () => {
          btn.style.transform = 'translateY(-2px)';
          btn.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.5)';
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.transform = 'translateY(0)';
          btn.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.4)';
        });
        
        btn.onclick = async (e) => {
          e.preventDefault();
          e.stopPropagation();
          await this.quickImportFromCard(card, index);
        };
        
        card.appendChild(btn);
      });
      
      // Observe for new products (infinite scroll)
      if (!this.buttonObserver) {
        this.buttonObserver = new MutationObserver(() => {
          this.injectImportButtons();
        });
        
        this.buttonObserver.observe(document.body, {
          childList: true,
          subtree: true
        });
      }
    }

    async quickImportFromCard(card, index) {
      const productData = this.extractProductData(card);
      const btn = card.querySelector('.dc-quick-import-btn');
      
      if (btn) {
        btn.innerHTML = '⏳';
        btn.disabled = true;
      }
      
      this.showToast('Import en cours...', 'info');
      
      try {
        const token = await this.getToken();
        
        const response = await fetch(`${CONFIG.API_URL}/extension-sync-realtime`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(token && { 'x-extension-token': token })
          },
          body: JSON.stringify({
            action: 'import_products',
            products: [{
              title: productData.title,
              name: productData.title,
              price: productData.price || 0,
              image: productData.image || '',
              imageUrl: productData.image || '',
              images: productData.images || [],
              url: productData.url || window.location.href,
              source: 'chrome_extension_catalog',
              platform: this.platform,
              orders: productData.orders || '',
              rating: productData.rating || ''
            }]
          })
        });
        
        const result = await response.json();
        
        if (response.ok && (result.imported > 0 || result.success)) {
          if (btn) {
            btn.innerHTML = '✅';
            btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
          }
          this.showToast(`✓ "${productData.title.substring(0, 30)}..." importé!`, 'success');
        } else {
          throw new Error(result.error || 'Erreur');
        }
      } catch (error) {
        if (btn) {
          btn.innerHTML = '❌';
          btn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        }
        this.showToast('Erreur lors de l\'import: ' + error.message, 'error');
        
        // Reset button after 2s
        setTimeout(() => {
          if (btn) {
            btn.innerHTML = '📥 Import';
            btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            btn.disabled = false;
          }
        }, 2000);
      }
    }

    activate() {
      this.isActive = true;
      
      // Hide activate button, show FAB
      document.getElementById('dc-bulk-activate')?.classList.add('hidden');
      document.getElementById('dc-bulk-fab')?.classList.add('visible');
      
      // Add overlays to all product cards
      this.injectOverlays();
      
      this.showToast('Mode sélection activé - Cliquez sur les produits', 'info');
    }

    deactivate() {
      this.isActive = false;
      
      document.getElementById('dc-bulk-activate')?.classList.remove('hidden');
      document.getElementById('dc-bulk-fab')?.classList.remove('visible');
      
      // Remove overlays
      document.querySelectorAll('.dc-bulk-overlay').forEach(el => el.remove());
      document.querySelectorAll('.dc-bulk-selectable').forEach(el => {
        el.classList.remove('dc-bulk-selectable', 'selected');
      });
      
      this.clearSelection();
    }

    injectOverlays() {
      const cards = document.querySelectorAll(this.selectors.productCard);
      
      cards.forEach((card, index) => {
        if (card.querySelector('.dc-bulk-overlay')) return;
        
        card.classList.add('dc-bulk-selectable');
        if (getComputedStyle(card).position === 'static') {
          card.style.position = 'relative';
        }
        
        const overlay = document.createElement('div');
        overlay.className = 'dc-bulk-overlay';
        overlay.dataset.index = index;
        overlay.innerHTML = `
          <div class="dc-bulk-checkbox">✓</div>
          <button class="dc-bulk-quick-import">⚡ Import rapide</button>
          <div class="dc-bulk-order-badge"></div>
        `;
        
        overlay.addEventListener('click', (e) => {
          if (e.target.classList.contains('dc-bulk-quick-import')) {
            e.stopPropagation();
            this.quickImport(card, index);
          } else {
            this.toggleSelection(card, index, overlay);
          }
        });
        
        card.appendChild(overlay);
      });
    }

    toggleSelection(card, index, overlay) {
      const productId = `product_${this.platform}_${index}`;
      
      if (this.selectedProducts.has(productId)) {
        this.selectedProducts.delete(productId);
        this.selectionOrder = this.selectionOrder.filter(id => id !== productId);
        overlay.classList.remove('selected');
        card.classList.remove('selected');
      } else {
        if (this.selectedProducts.size >= CONFIG.MAX_SELECTION) {
          this.showToast(`Maximum ${CONFIG.MAX_SELECTION} produits`, 'warning');
          return;
        }
        
        const productData = this.extractProductData(card);
        this.selectedProducts.set(productId, productData);
        this.selectionOrder.push(productId);
        overlay.classList.add('selected');
        card.classList.add('selected');
      }
      
      this.updateUI();
    }

    async quickImport(card, index) {
      const productData = this.extractProductData(card);
      
      this.showToast('Import rapide en cours...', 'info');
      
      try {
        await this.sendToAPI([productData]);
        this.showToast(`✓ "${productData.title.substring(0, 30)}..." importé!`, 'success');
      } catch (error) {
        this.showToast('Erreur lors de l\'import', 'error');
      }
    }

    extractProductData(card) {
      const getElement = (selector) => {
        if (!selector) return null;
        const selectors = selector.split(',').map(s => s.trim());
        for (const sel of selectors) {
          const el = card.querySelector(sel);
          if (el) return el;
        }
        return null;
      };
      
      const getText = (sel) => getElement(sel)?.textContent?.trim() || '';
      const getImage = (sel) => {
        const el = getElement(sel);
        return el?.src || el?.dataset?.src || '';
      };
      const getLink = (sel) => getElement(sel)?.href || window.location.href;
      
      const getAllImages = () => {
        const imgs = [];
        card.querySelectorAll('img').forEach(img => {
          const src = img.src || img.dataset.src;
          if (src && !imgs.includes(src)) imgs.push(src);
        });
        return imgs;
      };
      
      const priceText = getText(this.selectors.price);
      const price = this.parsePrice(priceText);
      
      return {
        title: getText(this.selectors.title) || 'Produit sans titre',
        price: price,
        priceText: priceText,
        image: getImage(this.selectors.image),
        images: getAllImages(),
        url: getLink(this.selectors.link),
        orders: getText(this.selectors.orders),
        rating: getText(this.selectors.rating),
        platform: this.platform,
        scrapedAt: new Date().toISOString(),
        source: 'bulk_selector'
      };
    }

    parsePrice(text) {
      if (!text) return 0;
      const cleaned = text.replace(/[^\d.,]/g, '').replace(',', '.');
      const match = cleaned.match(/[\d.]+/);
      return match ? parseFloat(match[0]) : 0;
    }

    selectAll() {
      const cards = document.querySelectorAll(this.selectors.productCard);
      let added = 0;
      
      cards.forEach((card, index) => {
        if (this.selectedProducts.size >= CONFIG.MAX_SELECTION) return;
        
        const productId = `product_${this.platform}_${index}`;
        if (!this.selectedProducts.has(productId)) {
          const overlay = card.querySelector('.dc-bulk-overlay');
          if (overlay) {
            const productData = this.extractProductData(card);
            this.selectedProducts.set(productId, productData);
            this.selectionOrder.push(productId);
            overlay.classList.add('selected');
            card.classList.add('selected');
            added++;
          }
        }
      });
      
      this.updateUI();
      this.showToast(`${added} produit(s) ajouté(s)`, 'success');
    }

    clearSelection() {
      this.selectedProducts.clear();
      this.selectionOrder = [];
      
      document.querySelectorAll('.dc-bulk-overlay.selected').forEach(el => {
        el.classList.remove('selected');
      });
      document.querySelectorAll('.dc-bulk-selectable.selected').forEach(el => {
        el.classList.remove('selected');
      });
      
      this.updateUI();
    }

    updateUI() {
      const count = this.selectedProducts.size;
      
      document.getElementById('dc-bulk-count').textContent = count;
      
      // Update order badges
      this.selectionOrder.forEach((productId, idx) => {
        const index = productId.split('_').pop();
        const overlay = document.querySelector(`.dc-bulk-overlay[data-index="${index}"]`);
        if (overlay) {
          const badge = overlay.querySelector('.dc-bulk-order-badge');
          if (badge) badge.textContent = idx + 1;
        }
      });
    }

    async importSelected() {
      if (this.selectedProducts.size === 0) {
        this.showToast('Aucun produit sélectionné', 'warning');
        return;
      }
      
      const products = Array.from(this.selectedProducts.values());
      this.showModal();
      
      try {
        await this.sendToAPI(products);
        this.showToast(`✓ ${products.length} produit(s) importé(s)!`, 'success');
        this.clearSelection();
        this.deactivate();
      } catch (error) {
        this.showToast('Erreur lors de l\'import', 'error');
      }
    }

    async sendToAPI(products) {
      const total = products.length;
      let success = 0;
      let failed = 0;
      
      const token = await this.getToken();
      
      document.getElementById('dc-bulk-pending').textContent = total;
      document.getElementById('dc-bulk-current').style.display = 'flex';
      
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        
        // Update current item
        document.getElementById('dc-bulk-current-title').textContent = product.title.substring(0, 50) + '...';
        document.getElementById('dc-bulk-current-img').src = product.image || '';
        document.getElementById('dc-bulk-progress-text').textContent = `Import ${i + 1} / ${total}`;
        document.getElementById('dc-bulk-progress-fill').style.width = `${((i + 1) / total) * 100}%`;
        
        try {
          // Use extension-sync-realtime with token for authenticated import
          const response = await fetch(`${CONFIG.API_URL}/extension-sync-realtime`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(token && { 'x-extension-token': token })
            },
            body: JSON.stringify({
              action: 'import_products',
              products: [{
                title: product.title,
                name: product.title,
                price: product.price || 0,
                image: product.image || '',
                imageUrl: product.image || '',
                images: product.images || [],
                url: product.url || window.location.href,
                source: 'chrome_extension_bulk',
                platform: this.platform,
                orders: product.orders || '',
                rating: product.rating || ''
              }]
            })
          });
          
          const result = await response.json();
          
          if (response.ok && (result.imported > 0 || result.success)) {
            success++;
          } else {
            failed++;
          }
        } catch (e) {
          failed++;
        }
        
        document.getElementById('dc-bulk-success').textContent = success;
        document.getElementById('dc-bulk-error').textContent = failed;
        document.getElementById('dc-bulk-pending').textContent = total - success - failed;
        
        // Small delay between requests
        await new Promise(r => setTimeout(r, 150));
      }
      
      document.getElementById('dc-bulk-current').style.display = 'none';
      document.getElementById('dc-bulk-progress-text').textContent = 'Import terminé!';
    }

    showModal() {
      document.getElementById('dc-bulk-modal')?.classList.add('active');
    }

    closeModal() {
      document.getElementById('dc-bulk-modal')?.classList.remove('active');
    }

    showToast(message, type = 'info') {
      const toast = document.createElement('div');
      toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 
                      type === 'error' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' :
                      type === 'warning' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' :
                      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
        color: white;
        padding: 14px 24px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        z-index: 100001;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.3s ease-out;
      `;
      toast.textContent = message;
      
      const styleSheet = document.createElement('style');
      styleSheet.textContent = `@keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }`;
      document.head.appendChild(styleSheet);
      
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }
  }

  window.DropCraftBulkSelector = DropCraftBulkSelector;
  new DropCraftBulkSelector();
})();
