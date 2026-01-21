// Drop Craft AI - Professional Product Grabber v4.0
// Multi-product selection & bulk import system

(function() {
  'use strict';

  if (window.__dropCraftGrabberLoaded) return;
  window.__dropCraftGrabberLoaded = true;

  const CONFIG = {
    API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
    MAX_SELECTION: 100,
    PLATFORMS: {
      'aliexpress': {
        productCard: '.search-item-card-wrapper-gallery, .product-snippet, ._1OUGS, [data-widget-type="product"]',
        title: 'h1, .title--wrap--Ms9Zv4A, .title, [data-pl="product-title"]',
        price: '.price--current--I3Zeidd, .product-price-current, .price, [data-pl="product-price"]',
        image: 'img.product-img, .gallery-image, img[data-role="img"]',
        link: 'a[href*="/item/"], a[href*="aliexpress.com/item"]',
        rating: '.rating-value, [class*="star"]',
        orders: '.orders-count, [class*="order"]'
      },
      'amazon': {
        productCard: '[data-component-type="s-search-result"], .s-result-item',
        title: 'h2 span, .a-text-normal',
        price: '.a-price-whole, .a-price',
        image: 'img.s-image, .s-product-image-container img',
        link: 'a.a-link-normal[href*="/dp/"]',
        rating: '.a-icon-alt',
        orders: '.a-size-base.s-underline-text'
      },
      'ebay': {
        productCard: '.s-item, .srp-results .s-item__wrapper',
        title: '.s-item__title',
        price: '.s-item__price',
        image: '.s-item__image img',
        link: '.s-item__link',
        rating: '.x-star-rating',
        orders: '.s-item__quantitySold'
      },
      'walmart': {
        productCard: '[data-item-id], .search-result-gridview-item',
        title: '[data-automation-id="product-title"], .product-title-link',
        price: '[data-automation-id="product-price"], .price-main',
        image: '[data-automation-id="product-image"] img',
        link: 'a[href*="/ip/"]',
        rating: '[data-automation-id="product-average-rating"]',
        orders: ''
      },
      'temu': {
        productCard: '[data-testid="goods-item"], ._2Q8JLHu5',
        title: '._2Q5w7Q-h, .goods-title',
        price: '._23PpXIbz, .goods-price',
        image: '._3hMReB-a img, .goods-img',
        link: 'a[href*="goods.html"]',
        rating: '',
        orders: ''
      },
      'shein': {
        productCard: '.S-product-item, .product-item',
        title: '.S-product-item__name, .product-item__title',
        price: '.S-product-item__price, .product-item__price',
        image: '.S-product-item__img img',
        link: 'a[href*="product"]',
        rating: '',
        orders: ''
      },
      '1688': {
        productCard: '.offer-list-row .sm-offer-item, .space-offer-card-box',
        title: '.offer-title, .title',
        price: '.sm-offer-priceNum, .price',
        image: '.offer-img img, .main-img',
        link: 'a[href*="offer"]',
        rating: '',
        orders: '.sale-count'
      },
      'dhgate': {
        productCard: '.gallery-item, .product-item',
        title: '.gallery-item__title, .product-title',
        price: '.gallery-item__price, .product-price',
        image: '.gallery-item__image img',
        link: 'a[href*="product"]',
        rating: '.rating',
        orders: '.orders'
      }
    }
  };

  class DropCraftGrabber {
    constructor() {
      this.isActive = false;
      this.selectedProducts = new Map();
      this.platform = null;
      this.selectors = null;
      
      this.init();
    }

    async init() {
      this.detectPlatform();
      if (this.platform) {
        this.injectStyles();
        this.createToolbar();
        this.bindGlobalEvents();
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

    injectStyles() {
      if (document.querySelector('#dc-grabber-styles')) return;
      
      const style = document.createElement('style');
      style.id = 'dc-grabber-styles';
      style.textContent = `
        /* Grabber Toolbar */
        .dc-grabber-toolbar {
          position: fixed;
          top: 70px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #1e1e2e 0%, #2d2d3d 100%);
          border: 1px solid rgba(102, 126, 234, 0.3);
          border-radius: 16px;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          z-index: 10001;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }
        
        .dc-grabber-toolbar.active {
          opacity: 1;
          visibility: visible;
        }
        
        .dc-grabber-count {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #fff;
          font-weight: 600;
          font-size: 14px;
        }
        
        .dc-grabber-count-badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 700;
          min-width: 32px;
          text-align: center;
        }
        
        .dc-grabber-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          transition: all 0.2s ease;
        }
        
        .dc-grabber-btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .dc-grabber-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        
        .dc-grabber-btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: #94a3b8;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .dc-grabber-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
          color: white;
        }
        
        .dc-grabber-btn-danger {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }
        
        .dc-grabber-btn-danger:hover {
          background: rgba(239, 68, 68, 0.3);
        }
        
        .dc-grabber-close {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 4px;
          display: flex;
          font-size: 18px;
        }
        
        .dc-grabber-close:hover {
          color: #ef4444;
        }
        
        /* Product Selection Overlay */
        .dc-grabber-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(102, 126, 234, 0.1);
          border: 2px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 100;
          pointer-events: all;
        }
        
        .dc-grabber-overlay:hover {
          background: rgba(102, 126, 234, 0.2);
          border-color: rgba(102, 126, 234, 0.5);
        }
        
        .dc-grabber-overlay.selected {
          background: rgba(102, 126, 234, 0.25);
          border-color: #667eea;
        }
        
        .dc-grabber-checkbox {
          position: absolute;
          top: 10px;
          left: 10px;
          width: 24px;
          height: 24px;
          background: rgba(30, 30, 46, 0.9);
          border: 2px solid rgba(102, 126, 234, 0.5);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: transparent;
          font-weight: bold;
          font-size: 14px;
          transition: all 0.2s ease;
        }
        
        .dc-grabber-overlay.selected .dc-grabber-checkbox {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: #667eea;
          color: white;
        }
        
        .dc-grabber-quick-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          opacity: 0;
          transform: translateY(-5px);
          transition: all 0.2s ease;
          z-index: 101;
        }
        
        .dc-grabber-overlay:hover .dc-grabber-quick-btn {
          opacity: 1;
          transform: translateY(0);
        }
        
        .dc-grabber-number {
          position: absolute;
          bottom: 10px;
          right: 10px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 12px;
          opacity: 0;
          transform: scale(0);
          transition: all 0.2s ease;
        }
        
        .dc-grabber-overlay.selected .dc-grabber-number {
          opacity: 1;
          transform: scale(1);
        }
        
        /* Progress Modal */
        .dc-import-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100000;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }
        
        .dc-import-modal.active {
          opacity: 1;
          visibility: visible;
        }
        
        .dc-import-modal-content {
          background: linear-gradient(135deg, #1e1e2e 0%, #2d2d3d 100%);
          border: 1px solid rgba(102, 126, 234, 0.3);
          border-radius: 20px;
          padding: 32px;
          width: 90%;
          max-width: 500px;
          text-align: center;
        }
        
        .dc-import-title {
          color: white;
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        
        .dc-import-subtitle {
          color: #94a3b8;
          font-size: 14px;
          margin-bottom: 24px;
        }
        
        .dc-import-progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 16px;
        }
        
        .dc-import-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          border-radius: 4px;
          width: 0%;
          transition: width 0.3s ease;
        }
        
        .dc-import-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 24px;
        }
        
        .dc-import-stat {
          background: rgba(255, 255, 255, 0.05);
          padding: 16px;
          border-radius: 12px;
        }
        
        .dc-import-stat-value {
          font-size: 24px;
          font-weight: 700;
          color: white;
        }
        
        .dc-import-stat-value.success { color: #10b981; }
        .dc-import-stat-value.error { color: #ef4444; }
        .dc-import-stat-value.pending { color: #f59e0b; }
        
        .dc-import-stat-label {
          font-size: 12px;
          color: #64748b;
          margin-top: 4px;
        }
        
        .dc-import-current {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.05);
          padding: 12px;
          border-radius: 12px;
          margin-top: 16px;
        }
        
        .dc-import-current-img {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          object-fit: cover;
        }
        
        .dc-import-current-info {
          flex: 1;
          text-align: left;
        }
        
        .dc-import-current-title {
          color: white;
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .dc-import-current-status {
          color: #64748b;
          font-size: 11px;
        }
        
        .dc-import-spinner {
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
        
        /* Activate Button */
        .dc-grabber-activate-btn {
          position: fixed;
          bottom: 100px;
          right: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
          z-index: 10000;
          transition: all 0.3s ease;
        }
        
        .dc-grabber-activate-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(102, 126, 234, 0.5);
        }
        
        .dc-grabber-activate-btn.hidden {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
        }
        
        /* Selection indicator */
        .dc-product-wrapped {
          position: relative !important;
        }
      `;
      document.head.appendChild(style);
    }

    createToolbar() {
      // Create activate button for search/listing pages
      if (this.isListingPage()) {
        const activateBtn = document.createElement('button');
        activateBtn.className = 'dc-grabber-activate-btn';
        activateBtn.id = 'dc-grabber-activate';
        activateBtn.innerHTML = `
          <span>📦</span>
          <span>Sélectionner des produits</span>
        `;
        activateBtn.onclick = () => this.activate();
        document.body.appendChild(activateBtn);
      }
      
      // Create selection toolbar (hidden by default)
      const toolbar = document.createElement('div');
      toolbar.className = 'dc-grabber-toolbar';
      toolbar.id = 'dc-grabber-toolbar';
      toolbar.innerHTML = `
        <div class="dc-grabber-count">
          <span>Sélectionnés:</span>
          <span class="dc-grabber-count-badge" id="dc-grabber-count">0</span>
        </div>
        <button class="dc-grabber-btn dc-grabber-btn-secondary" id="dc-grabber-select-all">
          ☑️ Tout sélectionner
        </button>
        <button class="dc-grabber-btn dc-grabber-btn-secondary" id="dc-grabber-select-page">
          📄 Page entière
        </button>
        <button class="dc-grabber-btn dc-grabber-btn-primary" id="dc-grabber-import">
          🚀 Importer (<span id="dc-grabber-import-count">0</span>)
        </button>
        <button class="dc-grabber-btn dc-grabber-btn-danger" id="dc-grabber-clear">
          🗑️ Effacer
        </button>
        <button class="dc-grabber-close" id="dc-grabber-close">✕</button>
      `;
      document.body.appendChild(toolbar);
      
      // Create import modal
      const modal = document.createElement('div');
      modal.className = 'dc-import-modal';
      modal.id = 'dc-import-modal';
      modal.innerHTML = `
        <div class="dc-import-modal-content">
          <div class="dc-import-title">📦 Import en cours</div>
          <div class="dc-import-subtitle" id="dc-import-subtitle">Préparation des produits...</div>
          <div class="dc-import-progress-bar">
            <div class="dc-import-progress-fill" id="dc-import-progress"></div>
          </div>
          <div class="dc-import-stats">
            <div class="dc-import-stat">
              <div class="dc-import-stat-value success" id="dc-import-success">0</div>
              <div class="dc-import-stat-label">Réussis</div>
            </div>
            <div class="dc-import-stat">
              <div class="dc-import-stat-value error" id="dc-import-failed">0</div>
              <div class="dc-import-stat-label">Échoués</div>
            </div>
            <div class="dc-import-stat">
              <div class="dc-import-stat-value pending" id="dc-import-pending">0</div>
              <div class="dc-import-stat-label">En attente</div>
            </div>
          </div>
          <div class="dc-import-current" id="dc-import-current" style="display: none;">
            <img class="dc-import-current-img" id="dc-import-current-img" src="" alt="">
            <div class="dc-import-current-info">
              <div class="dc-import-current-title" id="dc-import-current-title">-</div>
              <div class="dc-import-current-status">Import en cours...</div>
            </div>
            <div class="dc-import-spinner"></div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      
      this.bindToolbarEvents();
    }

    isListingPage() {
      const url = window.location.href.toLowerCase();
      const listingIndicators = [
        '/s?', '/s/', '/search', '/wholesale', '/category',
        'keywords=', 'q=', 'query=', '/c/', '/browse'
      ];
      return listingIndicators.some(indicator => url.includes(indicator));
    }

    bindGlobalEvents() {
      // Listen for sidebar commands
      window.addEventListener('message', (event) => {
        if (event.data.type === 'ACTIVATE_GRABBER') {
          this.activate();
        } else if (event.data.type === 'DEACTIVATE_GRABBER') {
          this.deactivate();
        }
      });
    }

    bindToolbarEvents() {
      document.getElementById('dc-grabber-select-all')?.addEventListener('click', () => this.selectAll());
      document.getElementById('dc-grabber-select-page')?.addEventListener('click', () => this.selectPage());
      document.getElementById('dc-grabber-import')?.addEventListener('click', () => this.importSelected());
      document.getElementById('dc-grabber-clear')?.addEventListener('click', () => this.clearSelection());
      document.getElementById('dc-grabber-close')?.addEventListener('click', () => this.deactivate());
    }

    activate() {
      this.isActive = true;
      
      // Hide activate button
      const activateBtn = document.getElementById('dc-grabber-activate');
      if (activateBtn) activateBtn.classList.add('hidden');
      
      // Show toolbar
      const toolbar = document.getElementById('dc-grabber-toolbar');
      if (toolbar) toolbar.classList.add('active');
      
      // Inject overlays on products
      this.injectProductOverlays();
      
      this.showToast('Mode sélection activé - Cliquez sur les produits à importer', 'info');
    }

    deactivate() {
      this.isActive = false;
      
      // Show activate button
      const activateBtn = document.getElementById('dc-grabber-activate');
      if (activateBtn) activateBtn.classList.remove('hidden');
      
      // Hide toolbar
      const toolbar = document.getElementById('dc-grabber-toolbar');
      if (toolbar) toolbar.classList.remove('active');
      
      // Remove overlays
      document.querySelectorAll('.dc-grabber-overlay').forEach(el => el.remove());
      document.querySelectorAll('.dc-product-wrapped').forEach(el => {
        el.classList.remove('dc-product-wrapped');
      });
      
      this.selectedProducts.clear();
      this.updateCount();
    }

    injectProductOverlays() {
      if (!this.selectors) return;
      
      const productCards = document.querySelectorAll(this.selectors.productCard);
      
      productCards.forEach((card, index) => {
        if (card.querySelector('.dc-grabber-overlay')) return;
        
        // Make card position relative
        card.classList.add('dc-product-wrapped');
        if (getComputedStyle(card).position === 'static') {
          card.style.position = 'relative';
        }
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'dc-grabber-overlay';
        overlay.dataset.index = index;
        overlay.innerHTML = `
          <div class="dc-grabber-checkbox">✓</div>
          <button class="dc-grabber-quick-btn">Import rapide</button>
          <div class="dc-grabber-number"></div>
        `;
        
        // Click to select
        overlay.addEventListener('click', (e) => {
          if (e.target.classList.contains('dc-grabber-quick-btn')) {
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
      const productId = `product_${index}`;
      
      if (this.selectedProducts.has(productId)) {
        this.selectedProducts.delete(productId);
        overlay.classList.remove('selected');
      } else {
        if (this.selectedProducts.size >= CONFIG.MAX_SELECTION) {
          this.showToast(`Maximum ${CONFIG.MAX_SELECTION} produits par import`, 'warning');
          return;
        }
        
        const productData = this.extractProductData(card);
        this.selectedProducts.set(productId, productData);
        overlay.classList.add('selected');
      }
      
      this.updateCount();
      this.updateSelectionNumbers();
    }

    async quickImport(card, index) {
      const productData = this.extractProductData(card);
      
      this.showToast('Import en cours...', 'info');
      
      try {
        await this.sendToAPI([productData]);
        this.showToast(`✓ "${productData.title}" importé!`, 'success');
      } catch (error) {
        this.showToast('Erreur lors de l\'import', 'error');
      }
    }

    extractProductData(card) {
      const getElement = (selectors) => {
        if (!selectors) return null;
        const selectorList = selectors.split(',').map(s => s.trim());
        for (const sel of selectorList) {
          const el = card.querySelector(sel);
          if (el) return el;
        }
        return null;
      };
      
      const getText = (selectors) => {
        const el = getElement(selectors);
        return el ? el.textContent.trim() : '';
      };
      
      const getImage = (selectors) => {
        const el = getElement(selectors);
        return el ? (el.src || el.dataset.src || el.getAttribute('data-lazy-src')) : '';
      };
      
      const getLink = (selectors) => {
        const el = getElement(selectors);
        return el ? el.href : window.location.href;
      };
      
      const priceText = getText(this.selectors.price);
      const price = this.parsePrice(priceText);
      
      return {
        title: getText(this.selectors.title) || 'Produit sans titre',
        price: price,
        priceText: priceText,
        image: getImage(this.selectors.image),
        url: getLink(this.selectors.link),
        rating: getText(this.selectors.rating),
        orders: getText(this.selectors.orders),
        platform: this.platform,
        scrapedAt: new Date().toISOString(),
        source: 'grabber_bulk'
      };
    }

    parsePrice(text) {
      if (!text) return 0;
      const match = text.match(/[\d,.\s]+/);
      if (match) {
        return parseFloat(match[0].replace(/[^\d.]/g, '').replace(',', '.')) || 0;
      }
      return 0;
    }

    updateCount() {
      const count = this.selectedProducts.size;
      const countBadge = document.getElementById('dc-grabber-count');
      const importCount = document.getElementById('dc-grabber-import-count');
      
      if (countBadge) countBadge.textContent = count;
      if (importCount) importCount.textContent = count;
    }

    updateSelectionNumbers() {
      let number = 1;
      document.querySelectorAll('.dc-grabber-overlay.selected .dc-grabber-number').forEach(el => {
        el.textContent = number++;
      });
    }

    selectAll() {
      document.querySelectorAll('.dc-grabber-overlay:not(.selected)').forEach((overlay, index) => {
        if (this.selectedProducts.size < CONFIG.MAX_SELECTION) {
          const card = overlay.parentElement;
          const productData = this.extractProductData(card);
          this.selectedProducts.set(`product_${overlay.dataset.index}`, productData);
          overlay.classList.add('selected');
        }
      });
      this.updateCount();
      this.updateSelectionNumbers();
    }

    selectPage() {
      // Select first 20 products on page
      const limit = 20;
      let count = 0;
      
      document.querySelectorAll('.dc-grabber-overlay:not(.selected)').forEach((overlay) => {
        if (count >= limit || this.selectedProducts.size >= CONFIG.MAX_SELECTION) return;
        
        const card = overlay.parentElement;
        const productData = this.extractProductData(card);
        this.selectedProducts.set(`product_${overlay.dataset.index}`, productData);
        overlay.classList.add('selected');
        count++;
      });
      
      this.updateCount();
      this.updateSelectionNumbers();
      this.showToast(`${count} produits sélectionnés`, 'success');
    }

    clearSelection() {
      this.selectedProducts.clear();
      document.querySelectorAll('.dc-grabber-overlay.selected').forEach(el => {
        el.classList.remove('selected');
      });
      this.updateCount();
      this.updateSelectionNumbers();
    }

    async importSelected() {
      if (this.selectedProducts.size === 0) {
        this.showToast('Aucun produit sélectionné', 'warning');
        return;
      }
      
      const products = Array.from(this.selectedProducts.values());
      
      // Show modal
      const modal = document.getElementById('dc-import-modal');
      if (modal) modal.classList.add('active');
      
      const subtitleEl = document.getElementById('dc-import-subtitle');
      if (subtitleEl) subtitleEl.textContent = `Import de ${products.length} produits en cours...`;
      
      this.updateImportStats(0, 0, products.length);
      this.updateProgress(10);
      
      // Show first product as preview
      if (products.length > 0) {
        this.updateCurrentProduct(products[0], 1, products.length);
      }
      
      try {
        // Use bulk import for all products at once (much faster!)
        this.updateProgress(30);
        
        const result = await this.bulkImportAll(products);
        
        this.updateProgress(100);
        this.updateImportStats(result.successful || 0, result.failed || 0, 0);
        
        // Complete with success message
        setTimeout(() => {
          if (modal) modal.classList.remove('active');
          
          if (result.successful > 0) {
            this.showToast(`✅ Import terminé: ${result.successful} réussis, ${result.failed || 0} échoués`, 'success');
          } else {
            this.showToast(`❌ Échec de l'import`, 'error');
          }
          
          this.clearSelection();
          this.deactivate();
        }, 1500);
        
      } catch (error) {
        console.error('[Grabber] Bulk import error:', error);
        
        // Fallback to individual imports
        this.showToast('Import en masse échoué, passage en mode séquentiel...', 'warning');
        await this.importSequentially(products, modal);
      }
    }

    async importSequentially(products, modal) {
      let success = 0;
      let failed = 0;
      let pending = products.length;
      
      this.updateImportStats(success, failed, pending);
      
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        
        this.updateCurrentProduct(product, i + 1, products.length);
        
        try {
          await this.sendToAPI([product]);
          success++;
        } catch (error) {
          failed++;
        }
        
        pending--;
        this.updateImportStats(success, failed, pending);
        this.updateProgress((i + 1) / products.length * 100);
        
        if (i < products.length - 1) {
          await this.sleep(300);
        }
      }
      
      setTimeout(() => {
        if (modal) modal.classList.remove('active');
        this.showToast(`Import terminé: ${success} réussis, ${failed} échoués`, success > 0 ? 'success' : 'error');
        this.clearSelection();
        this.deactivate();
      }, 1500);
    }

    updateImportStats(success, failed, pending) {
      const successEl = document.getElementById('dc-import-success');
      const failedEl = document.getElementById('dc-import-failed');
      const pendingEl = document.getElementById('dc-import-pending');
      
      if (successEl) successEl.textContent = success;
      if (failedEl) failedEl.textContent = failed;
      if (pendingEl) pendingEl.textContent = pending;
    }

    updateProgress(percent) {
      const progress = document.getElementById('dc-import-progress');
      if (progress) progress.style.width = `${percent}%`;
      
      const subtitle = document.getElementById('dc-import-subtitle');
      if (subtitle) subtitle.textContent = `${Math.round(percent)}% terminé`;
    }

    updateCurrentProduct(product, current, total) {
      const container = document.getElementById('dc-import-current');
      const img = document.getElementById('dc-import-current-img');
      const title = document.getElementById('dc-import-current-title');
      
      if (container) container.style.display = 'flex';
      if (img) img.src = product.image || '';
      if (title) title.textContent = `${current}/${total} - ${product.title}`;
    }

    async sendToAPI(products) {
      return new Promise((resolve, reject) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.get(['extensionToken'], async (result) => {
            if (!result.extensionToken) {
              reject(new Error('Non connecté'));
              return;
            }
            
            try {
              // Use bulk-import-multi for better performance
              const response = await fetch(`${CONFIG.API_URL}/bulk-import-multi`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-extension-token': result.extensionToken
                },
                body: JSON.stringify({
                  products: products.map(p => ({
                    url: p.url,
                    title: p.title,
                    name: p.title,
                    price: p.price,
                    image: p.image,
                    images: p.image ? [p.image] : [],
                    platform: p.platform,
                    source: 'chrome_extension_bulk'
                  })),
                  options: {
                    maxProducts: 50
                  }
                })
              });
              
              if (response.ok) {
                const data = await response.json();
                console.log('[Grabber] Import result:', data);
                resolve(data);
              } else {
                const errorData = await response.json().catch(() => ({}));
                reject(new Error(errorData.error || 'API Error'));
              }
            } catch (error) {
              reject(error);
            }
          });
        } else {
          reject(new Error('Chrome API not available'));
        }
      });
    }

    // New method: Bulk import all products at once (faster)
    async bulkImportAll(products) {
      return new Promise((resolve, reject) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.get(['extensionToken'], async (result) => {
            if (!result.extensionToken) {
              reject(new Error('Non connecté'));
              return;
            }
            
            try {
              const response = await fetch(`${CONFIG.API_URL}/bulk-import-multi`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-extension-token': result.extensionToken
                },
                body: JSON.stringify({
                  products: products.map(p => ({
                    url: p.url,
                    title: p.title,
                    price: p.price,
                    image: p.image,
                    images: p.image ? [p.image] : [],
                    platform: p.platform
                  })),
                  options: { maxProducts: 100 }
                })
              });
              
              const data = await response.json();
              if (response.ok) {
                resolve(data);
              } else {
                reject(new Error(data.error || 'Bulk import failed'));
              }
            } catch (error) {
              reject(error);
            }
          });
        } else {
          reject(new Error('Chrome API not available'));
        }
      });
    }

    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    showToast(message, type = 'info') {
      const colors = {
        success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        info: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      };
      
      const toast = document.createElement('div');
      toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${colors[type]};
        color: white;
        padding: 12px 24px;
        border-radius: 10px;
        font-weight: 500;
        font-size: 14px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        z-index: 100001;
        animation: dc-toast-in 0.3s ease;
      `;
      toast.textContent = message;
      
      const style = document.createElement('style');
      style.textContent = `
        @keyframes dc-toast-in {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.style.animation = 'dc-toast-in 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }
  }

  // Initialize grabber
  new DropCraftGrabber();
})();
