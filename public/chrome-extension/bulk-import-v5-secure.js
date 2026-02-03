// ============================================================================
// SHOPOPTI+ - BULK IMPORT v5.8.1 (XSS-SECURE)
// Professional multi-product import with secure DOM construction
// ============================================================================

(function() {
  'use strict';

  const CONFIG = {
    API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
    MAX_SELECTION: 50,
    IMPORT_DELAY: 800
  };

  // Secure DOM helper
  const DOM = {
    create(tag, props = {}, ...children) {
      const el = document.createElement(tag);
      Object.entries(props).forEach(([key, value]) => {
        if (key === 'className') el.className = value;
        else if (key === 'id') el.id = value;
        else if (key === 'style' && typeof value === 'object') Object.assign(el.style, value);
        else if (key === 'dataset') Object.entries(value).forEach(([k, v]) => el.dataset[k] = v);
        else if (key.startsWith('on') && typeof value === 'function') {
          el.addEventListener(key.slice(2).toLowerCase(), value);
        }
        else el.setAttribute(key, value);
      });
      children.flat().forEach(child => {
        if (child instanceof Node) el.appendChild(child);
        else if (child != null) el.appendChild(document.createTextNode(String(child)));
      });
      return el;
    },
    text: (t) => document.createTextNode(String(t || '')),
    clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }
  };

  // Platform configurations
  const PLATFORMS = {
    aliexpress: {
      name: 'AliExpress',
      productCard: '[data-product-card], .search-card-item, .product-card',
      selectors: {
        title: '.multi--titleText--nXeOvyr, h1.product-title-text, [class*="title"]',
        price: '.multi--price-sale--U-S0jtj, .product-price-value',
        image: 'img[src*="alicdn"]',
        link: 'a[href*="/item/"]'
      }
    },
    amazon: {
      name: 'Amazon',
      productCard: '[data-asin]:not([data-asin=""]), .s-result-item[data-asin]',
      selectors: {
        title: 'h2 a span, .a-link-normal .a-text-normal',
        price: '.a-price .a-offscreen, .a-price-whole',
        image: '.s-image, .s-product-image-container img',
        link: 'h2 a, a.a-link-normal[href*="/dp/"]'
      }
    },
    temu: {
      name: 'Temu',
      productCard: '[data-testid="product-card"], .ProductCard, [class*="productCard"]',
      selectors: {
        title: '[data-testid="product-title"], [class*="title"]',
        price: '[data-testid="price"], [class*="price"]',
        image: 'img[src*="temu"]',
        link: 'a[href*="/goods/"]'
      }
    },
    ebay: {
      name: 'eBay',
      productCard: '.s-item, .srp-results li',
      selectors: {
        title: '.s-item__title',
        price: '.s-item__price',
        image: '.s-item__image img',
        link: '.s-item__link'
      }
    }
  };

  class ShopOptiBulkImport {
    constructor() {
      this.selectedProducts = new Map();
      this.isActive = false;
      this.platform = this.detectPlatform();
      this.platformConfig = PLATFORMS[this.platform] || PLATFORMS.aliexpress;
      this.stores = [];
      this.selectedStores = [];
    }

    detectPlatform() {
      const host = window.location.hostname.toLowerCase();
      if (host.includes('aliexpress')) return 'aliexpress';
      if (host.includes('amazon')) return 'amazon';
      if (host.includes('temu')) return 'temu';
      if (host.includes('ebay')) return 'ebay';
      return 'aliexpress';
    }

    async init() {
      console.log(`[ShopOpti+ Bulk] Initializing on ${this.platformConfig.name}...`);
      this.injectStyles();
      this.injectUI();
      this.bindEvents();
      await this.loadStores();
      this.injectQuickImportButtons();
      this.observeNewProducts();
    }

    injectStyles() {
      const style = DOM.create('style', {}, `
        .shopopti-activate {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 12px 20px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          font-weight: 600;
          z-index: 2147483647;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
          transition: all 0.3s ease;
        }
        .shopopti-activate:hover { transform: scale(1.05); }
        .shopopti-activate.hidden { display: none; }
        
        .shopopti-fab {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: linear-gradient(145deg, #1e1b4b, #312e81);
          border-radius: 16px;
          padding: 16px;
          z-index: 2147483647;
          display: none;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          min-width: 200px;
        }
        .shopopti-fab.visible { display: flex; }
        
        .shopopti-fab-count { text-align: center; color: white; }
        .shopopti-fab-badge {
          display: inline-block;
          background: #6366f1;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 18px;
        }
        .shopopti-fab-text { font-size: 12px; color: #a5b4fc; }
        
        .shopopti-fab-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .shopopti-fab-btn {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          font-size: 12px;
          transition: all 0.2s;
        }
        .shopopti-fab-btn-primary { background: #6366f1; color: white; }
        .shopopti-fab-btn-secondary { background: #1e1b4b; color: #a5b4fc; border: 1px solid #4338ca; }
        .shopopti-fab-btn-stores { background: #059669; color: white; }
        .shopopti-fab-btn-danger { background: #dc2626; color: white; min-width: auto; flex: 0; }
        
        .shopopti-selection-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: transparent;
          border: 3px dashed transparent;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          z-index: 100;
        }
        .shopopti-selection-overlay:hover {
          background: rgba(99, 102, 241, 0.1);
          border-color: rgba(99, 102, 241, 0.5);
        }
        .shopopti-selection-overlay.selected {
          background: rgba(99, 102, 241, 0.15);
          border: 3px solid #6366f1;
        }
        
        .shopopti-checkbox {
          position: absolute;
          top: 8px;
          left: 8px;
          width: 28px;
          height: 28px;
          background: white;
          border: 2px solid #d1d5db;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          color: transparent;
          transition: all 0.2s;
        }
        .shopopti-selection-overlay.selected .shopopti-checkbox {
          background: #6366f1;
          border-color: #6366f1;
          color: white;
        }
        
        .shopopti-order-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 24px;
          height: 24px;
          background: #6366f1;
          border-radius: 50%;
          display: none;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          font-weight: 700;
        }
        .shopopti-selection-overlay.selected .shopopti-order-badge { display: flex; }
        
        .shopopti-quick-import {
          position: absolute;
          bottom: 8px;
          right: 8px;
          padding: 6px 12px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 600;
          z-index: 101;
          opacity: 0;
          transition: all 0.2s;
        }
        .shopopti-selectable:hover .shopopti-quick-import,
        *[data-asin]:hover .shopopti-quick-import { opacity: 1; }
        .shopopti-quick-import.success { background: #10b981; }
        .shopopti-quick-import.error { background: #ef4444; }
        
        .shopopti-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 2147483647;
        }
        .shopopti-modal-overlay.active { display: flex; }
        
        .shopopti-modal {
          background: linear-gradient(145deg, #1e1b4b, #312e81);
          border-radius: 20px;
          width: 90%;
          max-width: 500px;
          color: white;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
        }
        
        .shopopti-modal-header {
          padding: 20px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.2);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .shopopti-modal-title { font-size: 18px; font-weight: 700; }
        .shopopti-modal-close {
          background: rgba(239, 68, 68, 0.2);
          border: none;
          color: #fca5a5;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 18px;
        }
        
        .shopopti-progress { padding: 20px; }
        .shopopti-progress-bar {
          height: 8px;
          background: rgba(99, 102, 241, 0.2);
          border-radius: 4px;
          overflow: hidden;
        }
        .shopopti-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #8b5cf6);
          width: 0%;
          transition: width 0.3s;
        }
        .shopopti-progress-text {
          text-align: center;
          margin-top: 8px;
          font-size: 13px;
          color: #a5b4fc;
        }
        
        .shopopti-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding: 0 20px 20px;
        }
        .shopopti-stat { text-align: center; }
        .shopopti-stat-value { font-size: 28px; font-weight: 700; }
        .shopopti-stat-value.success { color: #10b981; }
        .shopopti-stat-value.error { color: #ef4444; }
        .shopopti-stat-value.pending { color: #f59e0b; }
        .shopopti-stat-label { font-size: 11px; color: #a5b4fc; }
        
        .shopopti-current-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          background: rgba(0, 0, 0, 0.2);
          margin: 0 20px 20px;
          border-radius: 12px;
        }
        .shopopti-current-img { width: 48px; height: 48px; border-radius: 8px; object-fit: cover; }
        .shopopti-current-info { flex: 1; }
        .shopopti-current-title { font-weight: 600; font-size: 13px; }
        .shopopti-current-status { font-size: 11px; color: #a5b4fc; }
        
        .shopopti-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(99, 102, 241, 0.3);
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        .shopopti-modal-footer {
          padding: 16px 20px;
          border-top: 1px solid rgba(99, 102, 241, 0.2);
          text-align: center;
        }
        .shopopti-modal-btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }
        .shopopti-modal-btn-cancel { background: rgba(99, 102, 241, 0.2); color: #a5b4fc; }
        .shopopti-modal-btn-import { background: #6366f1; color: white; }
        
        .shopopti-stores-list { max-height: 300px; overflow-y: auto; padding: 16px 20px; }
        .shopopti-store-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          margin-bottom: 8px;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.2s;
        }
        .shopopti-store-item:hover { background: rgba(99, 102, 241, 0.1); }
        .shopopti-store-item.selected { border-color: #6366f1; background: rgba(99, 102, 241, 0.15); }
        .shopopti-store-icon { font-size: 24px; }
        .shopopti-store-name { font-weight: 600; }
        .shopopti-store-platform { font-size: 11px; color: #a5b4fc; }
        
        .shopopti-no-stores { text-align: center; padding: 40px 20px; color: #a5b4fc; }
        .shopopti-no-stores-icon { font-size: 48px; margin-bottom: 16px; }
        
        .shopopti-toast {
          position: fixed;
          bottom: 100px;
          left: 50%;
          transform: translateX(-50%);
          padding: 12px 24px;
          border-radius: 8px;
          color: white;
          font-weight: 500;
          z-index: 2147483648;
          display: flex;
          align-items: center;
          gap: 8px;
          animation: slideUp 0.3s ease;
        }
        .shopopti-toast.success { background: #10b981; }
        .shopopti-toast.error { background: #ef4444; }
        .shopopti-toast.info { background: #3b82f6; }
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `);
      document.head.appendChild(style);
    }

    injectUI() {
      // Activate button
      const activateBtn = DOM.create('button', { className: 'shopopti-activate', id: 'shopopti-activate' },
        DOM.create('span', { style: { fontSize: '20px' } }, '📦'),
        DOM.create('span', {}, 'Sélection Multiple')
      );
      document.body.appendChild(activateBtn);

      // FAB
      const fab = DOM.create('div', { className: 'shopopti-fab', id: 'shopopti-fab' },
        DOM.create('div', { className: 'shopopti-fab-count' },
          DOM.create('span', { className: 'shopopti-fab-badge', id: 'shopopti-count' }, '0'),
          DOM.create('span', { className: 'shopopti-fab-text' }, 'produit(s)')
        ),
        DOM.create('div', { className: 'shopopti-fab-actions' },
          DOM.create('button', { className: 'shopopti-fab-btn shopopti-fab-btn-secondary', id: 'shopopti-select-all' }, '☑️ Tout'),
          DOM.create('button', { className: 'shopopti-fab-btn shopopti-fab-btn-stores', id: 'shopopti-stores-btn' }, '🏪 Boutiques'),
          DOM.create('button', { className: 'shopopti-fab-btn shopopti-fab-btn-primary', id: 'shopopti-import' }, '🚀 Importer'),
          DOM.create('button', { className: 'shopopti-fab-btn shopopti-fab-btn-danger', id: 'shopopti-clear' }, '✕')
        )
      );
      document.body.appendChild(fab);

      // Import modal
      const modal = this.createImportModal();
      document.body.appendChild(modal);

      // Store modal
      const storeModal = this.createStoreModal();
      document.body.appendChild(storeModal);
    }

    createImportModal() {
      const overlay = DOM.create('div', { className: 'shopopti-modal-overlay', id: 'shopopti-modal' });
      const modal = DOM.create('div', { className: 'shopopti-modal' },
        // Header
        DOM.create('div', { className: 'shopopti-modal-header' },
          DOM.create('div', { className: 'shopopti-modal-title' }, '📦 Import en cours'),
          DOM.create('button', { className: 'shopopti-modal-close', id: 'shopopti-modal-close' }, '✕')
        ),
        // Progress
        DOM.create('div', { className: 'shopopti-progress' },
          DOM.create('div', { className: 'shopopti-progress-bar' },
            DOM.create('div', { className: 'shopopti-progress-fill', id: 'shopopti-progress-fill' })
          ),
          DOM.create('div', { className: 'shopopti-progress-text', id: 'shopopti-progress-text' }, 'Préparation...')
        ),
        // Stats
        DOM.create('div', { className: 'shopopti-stats-grid' },
          DOM.create('div', { className: 'shopopti-stat' },
            DOM.create('div', { className: 'shopopti-stat-value success', id: 'shopopti-success' }, '0'),
            DOM.create('div', { className: 'shopopti-stat-label' }, 'Réussis')
          ),
          DOM.create('div', { className: 'shopopti-stat' },
            DOM.create('div', { className: 'shopopti-stat-value error', id: 'shopopti-error' }, '0'),
            DOM.create('div', { className: 'shopopti-stat-label' }, 'Échoués')
          ),
          DOM.create('div', { className: 'shopopti-stat' },
            DOM.create('div', { className: 'shopopti-stat-value pending', id: 'shopopti-pending' }, '0'),
            DOM.create('div', { className: 'shopopti-stat-label' }, 'En attente')
          )
        ),
        // Current item
        DOM.create('div', { className: 'shopopti-current-item', id: 'shopopti-current', style: { display: 'none' } },
          DOM.create('img', { className: 'shopopti-current-img', id: 'shopopti-current-img', src: '', alt: '' }),
          DOM.create('div', { className: 'shopopti-current-info' },
            DOM.create('div', { className: 'shopopti-current-title', id: 'shopopti-current-title' }, '-'),
            DOM.create('div', { className: 'shopopti-current-status' }, 'Import en cours...')
          ),
          DOM.create('div', { className: 'shopopti-spinner' })
        ),
        // Footer
        DOM.create('div', { className: 'shopopti-modal-footer', id: 'shopopti-modal-footer', style: { display: 'none' } },
          DOM.create('button', { className: 'shopopti-modal-btn shopopti-modal-btn-cancel', id: 'shopopti-modal-done' }, 'Fermer')
        )
      );
      overlay.appendChild(modal);
      return overlay;
    }

    createStoreModal() {
      const overlay = DOM.create('div', { className: 'shopopti-modal-overlay', id: 'shopopti-store-modal' });
      const modal = DOM.create('div', { className: 'shopopti-modal' },
        // Header
        DOM.create('div', { className: 'shopopti-modal-header' },
          DOM.create('div', { className: 'shopopti-modal-title' }, '🏪 Sélection des boutiques'),
          DOM.create('button', { className: 'shopopti-modal-close', id: 'shopopti-store-close' }, '✕')
        ),
        // Stores section
        DOM.create('div', { className: 'shopopti-stores-section' },
          DOM.create('div', { className: 'shopopti-stores-header', style: { padding: '16px 20px', display: 'flex', justifyContent: 'space-between' } },
            DOM.create('span', { style: { fontWeight: '600' } }, 'Boutiques connectées'),
            DOM.create('div', { style: { display: 'flex', gap: '8px' } },
              DOM.create('button', { className: 'shopopti-fab-btn shopopti-fab-btn-secondary', id: 'shopopti-stores-all', style: { padding: '6px 12px' } }, 'Tout'),
              DOM.create('button', { className: 'shopopti-fab-btn shopopti-fab-btn-secondary', id: 'shopopti-stores-none', style: { padding: '6px 12px' } }, 'Aucun')
            )
          ),
          DOM.create('div', { className: 'shopopti-stores-list', id: 'shopopti-stores-list' },
            DOM.create('div', { className: 'shopopti-no-stores' },
              DOM.create('div', { className: 'shopopti-no-stores-icon' }, '⏳'),
              DOM.create('div', {}, 'Chargement...')
            )
          )
        ),
        // Footer
        DOM.create('div', { className: 'shopopti-modal-footer', style: { display: 'flex', gap: '12px', justifyContent: 'flex-end' } },
          DOM.create('button', { className: 'shopopti-modal-btn shopopti-modal-btn-cancel', id: 'shopopti-store-cancel' }, 'Annuler'),
          DOM.create('button', { className: 'shopopti-modal-btn shopopti-modal-btn-import', id: 'shopopti-store-confirm' },
            'Confirmer (',
            DOM.create('span', { id: 'shopopti-store-count' }, '0'),
            ')'
          )
        )
      );
      overlay.appendChild(modal);
      return overlay;
    }

    bindEvents() {
      document.getElementById('shopopti-activate')?.addEventListener('click', () => this.activate());
      document.getElementById('shopopti-select-all')?.addEventListener('click', () => this.selectAll());
      document.getElementById('shopopti-import')?.addEventListener('click', () => this.startImport());
      document.getElementById('shopopti-clear')?.addEventListener('click', () => this.clearSelection());
      document.getElementById('shopopti-stores-btn')?.addEventListener('click', () => this.showStoreModal());
      document.getElementById('shopopti-modal-close')?.addEventListener('click', () => this.closeModal());
      document.getElementById('shopopti-modal-done')?.addEventListener('click', () => this.closeModal());
      document.getElementById('shopopti-store-close')?.addEventListener('click', () => this.closeStoreModal());
      document.getElementById('shopopti-store-cancel')?.addEventListener('click', () => this.closeStoreModal());
      document.getElementById('shopopti-store-confirm')?.addEventListener('click', () => this.confirmStoreSelection());
      document.getElementById('shopopti-stores-all')?.addEventListener('click', () => this.selectAllStores());
      document.getElementById('shopopti-stores-none')?.addEventListener('click', () => this.deselectAllStores());
    }

    activate() {
      this.isActive = true;
      document.getElementById('shopopti-activate')?.classList.add('hidden');
      this.injectSelectionOverlays();
    }

    deactivate() {
      this.isActive = false;
      document.getElementById('shopopti-activate')?.classList.remove('hidden');
      document.getElementById('shopopti-fab')?.classList.remove('visible');
      document.querySelectorAll('.shopopti-selection-overlay').forEach(el => el.remove());
      document.querySelectorAll('.shopopti-selectable').forEach(el => el.classList.remove('shopopti-selectable'));
    }

    injectSelectionOverlays() {
      const cards = document.querySelectorAll(this.platformConfig.productCard);
      
      cards.forEach((card, index) => {
        if (card.querySelector('.shopopti-selection-overlay')) return;
        
        const computed = window.getComputedStyle(card);
        if (computed.position === 'static') card.style.position = 'relative';
        card.classList.add('shopopti-selectable');
        
        const overlay = DOM.create('div', { className: 'shopopti-selection-overlay', dataset: { index } },
          DOM.create('div', { className: 'shopopti-checkbox' }, '✓'),
          DOM.create('div', { className: 'shopopti-order-badge' })
        );
        
        overlay.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.toggleSelection(card, overlay);
        });
        
        card.appendChild(overlay);
      });
    }

    toggleSelection(card, overlay) {
      const productId = this.getProductId(card);
      
      if (this.selectedProducts.has(productId)) {
        this.selectedProducts.delete(productId);
        overlay.classList.remove('selected');
      } else {
        if (this.selectedProducts.size >= CONFIG.MAX_SELECTION) {
          this.showToast(`Maximum ${CONFIG.MAX_SELECTION} produits`, 'error');
          return;
        }
        const productData = this.extractProductData(card);
        this.selectedProducts.set(productId, productData);
        overlay.classList.add('selected');
      }
      
      this.updateUI();
    }

    selectAll() {
      const cards = document.querySelectorAll(this.platformConfig.productCard);
      cards.forEach(card => {
        if (this.selectedProducts.size >= CONFIG.MAX_SELECTION) return;
        const productId = this.getProductId(card);
        if (!this.selectedProducts.has(productId)) {
          const productData = this.extractProductData(card);
          this.selectedProducts.set(productId, productData);
          card.querySelector('.shopopti-selection-overlay')?.classList.add('selected');
        }
      });
      this.updateUI();
    }

    clearSelection() {
      this.selectedProducts.clear();
      document.querySelectorAll('.shopopti-selection-overlay.selected').forEach(el => el.classList.remove('selected'));
      this.updateUI();
    }

    updateUI() {
      const count = this.selectedProducts.size;
      const fab = document.getElementById('shopopti-fab');
      const countEl = document.getElementById('shopopti-count');
      
      if (count > 0) {
        fab?.classList.add('visible');
        if (countEl) countEl.textContent = String(count);
      } else {
        fab?.classList.remove('visible');
      }
      
      let order = 1;
      document.querySelectorAll('.shopopti-selection-overlay.selected .shopopti-order-badge').forEach(badge => {
        badge.textContent = String(order++);
      });
    }

    getProductId(card) {
      const asin = card.dataset.asin;
      if (asin) return `amazon_${asin}`;
      const productId = card.dataset.productId || card.dataset.itemId;
      if (productId) return `${this.platform}_${productId}`;
      const link = card.querySelector(this.platformConfig.selectors.link)?.href;
      if (link) return `url_${btoa(link).slice(0, 32)}`;
      return `card_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }

    extractProductData(card) {
      const selectors = this.platformConfig.selectors;
      const getText = (selector) => {
        if (!selector) return '';
        return card.querySelector(selector)?.textContent?.trim() || '';
      };
      
      const priceText = getText(selectors.price);
      const priceMatch = priceText.match(/[\d,.]+/);
      const price = priceMatch ? parseFloat(priceMatch[0].replace(',', '.')) : 0;
      
      let image = '';
      const imgEl = card.querySelector(selectors.image);
      if (imgEl) {
        image = imgEl.src || imgEl.dataset.src || '';
        image = this.normalizeImageUrl(image);
      }
      
      const linkEl = card.querySelector(selectors.link);
      const url = linkEl?.href || window.location.href;
      
      return {
        title: getText(selectors.title),
        price,
        image,
        images: [image].filter(Boolean),
        url,
        source_url: url,
        platform: this.platform,
        source: 'chrome_extension_bulk',
        orders: getText(selectors.orders),
        rating: getText(selectors.rating),
        extractedAt: Date.now()
      };
    }

    normalizeImageUrl(url) {
      if (!url) return '';
      if (url.includes('amazon') || url.includes('m.media-amazon')) {
        return url.replace(/\._[A-Z][A-Z][0-9]+_/, '').replace(/\._[^.]+_\./, '.');
      }
      if (url.includes('alicdn')) {
        return url.replace(/_\d+x\d+/, '').replace(/\.jpg_\d+x\d+/, '.jpg');
      }
      return url;
    }

    injectQuickImportButtons() {
      const cards = document.querySelectorAll(this.platformConfig.productCard);
      cards.forEach(card => {
        if (card.querySelector('.shopopti-quick-import')) return;
        
        const computed = window.getComputedStyle(card);
        if (computed.position === 'static') card.style.position = 'relative';
        
        const btn = DOM.create('button', { className: 'shopopti-quick-import' }, '⚡ Import');
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          await this.quickImport(card, btn);
        });
        
        card.appendChild(btn);
      });
    }

    async quickImport(card, btn) {
      btn.disabled = true;
      DOM.clear(btn);
      btn.appendChild(DOM.text('⏳'));
      
      try {
        const token = await this.getToken();
        if (!token) throw new Error('Non connecté');
        
        let productData = this.extractProductData(card);
        
        if (window.ShopOptiCoreExtractor) {
          const extractor = new window.ShopOptiCoreExtractor();
          const extracted = await extractor.extractFromUrl(productData.url);
          if (extracted) productData = { ...productData, ...extracted };
        }
        
        // Check offline queue
        if (!navigator.onLine && window.ShopOptiOfflineQueue) {
          await window.ShopOptiOfflineQueue.add(productData);
          btn.className = 'shopopti-quick-import info';
          DOM.clear(btn);
          btn.appendChild(DOM.text('📴'));
          this.showToast('Ajouté à la file hors ligne', 'info');
          return;
        }
        
        const response = await fetch(`${CONFIG.API_URL}/extension-sync-realtime`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-extension-token': token
          },
          body: JSON.stringify({ action: 'import_products', products: [productData] })
        });
        
        const result = await response.json();
        
        if (response.ok && (result.imported > 0 || result.success)) {
          btn.className = 'shopopti-quick-import success';
          DOM.clear(btn);
          btn.appendChild(DOM.text('✓'));
          this.showToast('Produit importé!', 'success');
        } else {
          throw new Error(result.error || 'Erreur import');
        }
      } catch (error) {
        btn.className = 'shopopti-quick-import error';
        DOM.clear(btn);
        btn.appendChild(DOM.text('✕'));
        this.showToast(error.message, 'error');
        
        setTimeout(() => {
          btn.className = 'shopopti-quick-import';
          DOM.clear(btn);
          btn.appendChild(DOM.text('⚡ Import'));
          btn.disabled = false;
        }, 2000);
      }
    }

    async showStoreModal() {
      document.getElementById('shopopti-store-modal')?.classList.add('active');
      await this.loadStores();
      this.renderStoreList();
    }

    closeStoreModal() {
      document.getElementById('shopopti-store-modal')?.classList.remove('active');
    }

    async loadStores() {
      try {
        const token = await this.getToken();
        if (!token) return;
        
        const response = await fetch(`${CONFIG.API_URL}/extension-sync-realtime`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-extension-token': token
          },
          body: JSON.stringify({ action: 'get_stores' })
        });
        
        if (response.ok) {
          const data = await response.json();
          this.stores = data.stores || [];
          if (this.stores.length > 0 && this.selectedStores.length === 0) {
            this.selectedStores = [this.stores[0].id];
          }
        }
      } catch (e) {
        console.error('[ShopOpti+ Bulk] Failed to load stores:', e);
      }
    }

    renderStoreList() {
      const list = document.getElementById('shopopti-stores-list');
      if (!list) return;
      
      DOM.clear(list);
      
      if (this.stores.length === 0) {
        list.appendChild(
          DOM.create('div', { className: 'shopopti-no-stores' },
            DOM.create('div', { className: 'shopopti-no-stores-icon' }, '🔌'),
            DOM.create('div', {}, 'Aucune boutique connectée'),
            DOM.create('div', { style: { fontSize: '12px', marginTop: '8px' } }, 
              'Connectez une boutique dans ShopOpti pour synchroniser vos produits'
            )
          )
        );
        return;
      }
      
      const icons = { shopify: '🟢', woocommerce: '🟣', prestashop: '🔵', ebay: '🟡', amazon: '🟠' };
      
      this.stores.forEach(store => {
        const isSelected = this.selectedStores.includes(store.id);
        const icon = icons[store.platform?.toLowerCase()] || '🏪';
        
        const item = DOM.create('div', {
          className: `shopopti-store-item ${isSelected ? 'selected' : ''}`,
          dataset: { storeId: store.id }
        },
          DOM.create('span', { className: 'shopopti-store-icon' }, icon),
          DOM.create('div', {},
            DOM.create('div', { className: 'shopopti-store-name' }, store.name),
            DOM.create('div', { className: 'shopopti-store-platform' }, store.platform)
          )
        );
        
        item.addEventListener('click', () => this.toggleStore(store.id, item));
        list.appendChild(item);
      });
      
      this.updateStoreCount();
    }

    toggleStore(storeId, element) {
      const index = this.selectedStores.indexOf(storeId);
      if (index > -1) {
        this.selectedStores.splice(index, 1);
        element.classList.remove('selected');
      } else {
        this.selectedStores.push(storeId);
        element.classList.add('selected');
      }
      this.updateStoreCount();
    }

    selectAllStores() {
      this.selectedStores = this.stores.map(s => s.id);
      document.querySelectorAll('.shopopti-store-item').forEach(el => el.classList.add('selected'));
      this.updateStoreCount();
    }

    deselectAllStores() {
      this.selectedStores = [];
      document.querySelectorAll('.shopopti-store-item').forEach(el => el.classList.remove('selected'));
      this.updateStoreCount();
    }

    updateStoreCount() {
      const countEl = document.getElementById('shopopti-store-count');
      if (countEl) countEl.textContent = String(this.selectedStores.length);
    }

    confirmStoreSelection() {
      this.closeStoreModal();
      this.showToast(`${this.selectedStores.length} boutique(s) sélectionnée(s)`, 'success');
    }

    async startImport() {
      if (this.selectedProducts.size === 0) {
        this.showToast('Aucun produit sélectionné', 'error');
        return;
      }

      const modal = document.getElementById('shopopti-modal');
      modal?.classList.add('active');
      
      const products = Array.from(this.selectedProducts.values());
      let success = 0, error = 0;
      
      const progressFill = document.getElementById('shopopti-progress-fill');
      const progressText = document.getElementById('shopopti-progress-text');
      const successEl = document.getElementById('shopopti-success');
      const errorEl = document.getElementById('shopopti-error');
      const pendingEl = document.getElementById('shopopti-pending');
      const currentItem = document.getElementById('shopopti-current');
      const currentImg = document.getElementById('shopopti-current-img');
      const currentTitle = document.getElementById('shopopti-current-title');
      
      if (pendingEl) pendingEl.textContent = String(products.length);
      if (currentItem) currentItem.style.display = 'flex';
      
      const token = await this.getToken();
      
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const percent = ((i + 1) / products.length) * 100;
        
        if (progressFill) progressFill.style.width = `${percent}%`;
        if (progressText) progressText.textContent = `Importation ${i + 1}/${products.length}...`;
        if (currentImg) currentImg.src = product.image || '';
        if (currentTitle) currentTitle.textContent = product.title?.substring(0, 50) || 'Produit';
        
        try {
          // Check offline
          if (!navigator.onLine && window.ShopOptiOfflineQueue) {
            await window.ShopOptiOfflineQueue.add(product);
            success++;
          } else {
            const response = await fetch(`${CONFIG.API_URL}/extension-sync-realtime`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-extension-token': token
              },
              body: JSON.stringify({
                action: 'import_products',
                products: [product],
                storeIds: this.selectedStores
              })
            });
            
            const result = await response.json();
            if (response.ok && (result.imported > 0 || result.success)) {
              success++;
            } else {
              throw new Error(result.error || 'Failed');
            }
          }
        } catch (e) {
          error++;
          console.error('[ShopOpti+ Bulk] Import error:', e);
        }
        
        if (successEl) successEl.textContent = String(success);
        if (errorEl) errorEl.textContent = String(error);
        if (pendingEl) pendingEl.textContent = String(products.length - i - 1);
        
        await new Promise(r => setTimeout(r, CONFIG.IMPORT_DELAY));
      }
      
      if (progressText) progressText.textContent = 'Import terminé!';
      if (currentItem) currentItem.style.display = 'none';
      
      const footer = document.getElementById('shopopti-modal-footer');
      if (footer) footer.style.display = 'block';
      
      this.clearSelection();
    }

    closeModal() {
      document.getElementById('shopopti-modal')?.classList.remove('active');
    }

    async getToken() {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.get(['extensionToken'], (result) => resolve(result.extensionToken));
        } else {
          resolve(localStorage.getItem('extension_token'));
        }
      });
    }

    observeNewProducts() {
      const observer = new MutationObserver(() => {
        if (this.isActive) this.injectSelectionOverlays();
        this.injectQuickImportButtons();
      });
      
      observer.observe(document.body, { childList: true, subtree: true });
    }

    showToast(message, type = 'info') {
      const toast = DOM.create('div', { className: `shopopti-toast ${type}` },
        DOM.create('span', {}, type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'),
        DOM.create('span', {}, message)
      );
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }
  }

  // Initialize
  const bulkImport = new ShopOptiBulkImport();
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => bulkImport.init());
  } else {
    bulkImport.init();
  }
  
  window.ShopOptiBulkImport = bulkImport;
  console.log('[ShopOpti+] BulkImport v5.8.0 (XSS-Secure) loaded');
})();
