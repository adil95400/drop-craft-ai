/**
 * Shopopti+ - Professional Import Overlay (AutoDS-like)
 * 1-Click import with store selector and product status
 * Version 1.0.0
 */

(function() {
  'use strict';

  if (window.__shopoptiImportOverlayLoaded) return;
  window.__shopoptiImportOverlayLoaded = true;

  const CONFIG = {
    API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
    APP_URL: 'https://shopopti.io'
  };

  class ImportOverlay {
    constructor() {
      this.overlay = null;
      this.isOpen = false;
      this.productData = null;
      this.stores = [];
      this.selectedStore = null;
      this.selectedStatus = 'draft';
      this.token = null;
      this.userPlan = 'starter';
      this.importRules = null;
      
      this.init();
    }

    async init() {
      await this.loadUserData();
      this.injectStyles();
      this.createOverlay();
      this.bindEvents();
      this.setupMessageListener();
    }

    async loadUserData() {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.get(['extensionToken', 'userStores', 'userPlan', 'defaultStore', 'importRules'], (result) => {
            this.token = result.extensionToken;
            this.stores = result.userStores || [];
            this.userPlan = result.userPlan || 'starter';
            this.selectedStore = result.defaultStore || null;
            this.importRules = result.importRules || this.getDefaultRules();
            resolve();
          });
        } else {
          resolve();
        }
      });
    }

    getDefaultRules() {
      return {
        pricing: {
          enabled: true,
          markupType: 'percentage',
          markupValue: 30,
          roundToNearest: 0.99
        },
        defaultCategory: null,
        defaultTags: [],
        defaultStatus: 'draft',
        currency: 'EUR'
      };
    }

    injectStyles() {
      if (document.querySelector('#shopopti-overlay-styles')) return;

      const style = document.createElement('style');
      style.id = 'shopopti-overlay-styles';
      style.textContent = `
        .sho-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }

        .sho-overlay.open {
          opacity: 1;
          visibility: visible;
        }

        .sho-modal {
          background: #1a1a2e;
          border-radius: 16px;
          width: 90%;
          max-width: 520px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          transform: scale(0.9) translateY(20px);
          transition: transform 0.3s ease;
        }

        .sho-overlay.open .sho-modal {
          transform: scale(1) translateY(0);
        }

        .sho-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .sho-modal-title {
          display: flex;
          align-items: center;
          gap: 12px;
          color: white;
          font-size: 18px;
          font-weight: 600;
        }

        .sho-modal-title-icon {
          font-size: 24px;
        }

        .sho-modal-close {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          transition: background 0.2s;
        }

        .sho-modal-close:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .sho-modal-body {
          padding: 24px;
          overflow-y: auto;
          max-height: calc(90vh - 160px);
        }

        .sho-product-preview {
          display: flex;
          gap: 16px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          margin-bottom: 24px;
        }

        .sho-product-image {
          width: 100px;
          height: 100px;
          border-radius: 8px;
          object-fit: cover;
          background: rgba(255, 255, 255, 0.1);
        }

        .sho-product-info {
          flex: 1;
          min-width: 0;
        }

        .sho-product-title {
          color: white;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .sho-product-price {
          color: #10b981;
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .sho-product-meta {
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          display: flex;
          gap: 12px;
        }

        .sho-product-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          background: rgba(102, 126, 234, 0.2);
          border-radius: 4px;
          color: #a5b4fc;
          font-size: 11px;
        }

        .sho-section {
          margin-bottom: 20px;
        }

        .sho-section-title {
          color: rgba(255, 255, 255, 0.7);
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
        }

        .sho-store-selector {
          display: grid;
          gap: 8px;
        }

        .sho-store-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid transparent;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .sho-store-option:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .sho-store-option.selected {
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.1);
        }

        .sho-store-option input {
          display: none;
        }

        .sho-store-radio {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sho-store-option.selected .sho-store-radio {
          border-color: #667eea;
          background: #667eea;
        }

        .sho-store-radio::after {
          content: '';
          width: 6px;
          height: 6px;
          background: white;
          border-radius: 50%;
          opacity: 0;
        }

        .sho-store-option.selected .sho-store-radio::after {
          opacity: 1;
        }

        .sho-store-info {
          flex: 1;
        }

        .sho-store-name {
          color: white;
          font-size: 14px;
          font-weight: 500;
        }

        .sho-store-domain {
          color: rgba(255, 255, 255, 0.5);
          font-size: 12px;
        }

        .sho-store-default {
          padding: 2px 8px;
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          font-size: 10px;
          border-radius: 4px;
          font-weight: 600;
        }

        .sho-status-selector {
          display: flex;
          gap: 8px;
        }

        .sho-status-btn {
          flex: 1;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid transparent;
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .sho-status-btn:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .sho-status-btn.selected {
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.1);
          color: white;
        }

        .sho-rules-preview {
          padding: 16px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .sho-rule-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .sho-rule-item:last-child {
          border-bottom: none;
        }

        .sho-rule-label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 13px;
        }

        .sho-rule-value {
          color: white;
          font-size: 13px;
          font-weight: 500;
        }

        .sho-rule-value.highlight {
          color: #10b981;
        }

        .sho-modal-footer {
          padding: 16px 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          gap: 12px;
        }

        .sho-btn {
          flex: 1;
          padding: 14px 24px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .sho-btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
        }

        .sho-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .sho-btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: white;
        }

        .sho-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .sho-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .sho-btn-loading {
          display: none;
        }

        .sho-btn.loading .sho-btn-loading {
          display: inline-block;
          animation: spin 1s linear infinite;
        }

        .sho-btn.loading .sho-btn-text {
          display: none;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .sho-import-success {
          text-align: center;
          padding: 40px 20px;
        }

        .sho-success-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }

        .sho-success-title {
          color: #10b981;
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .sho-success-message {
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          margin-bottom: 24px;
        }

        .sho-success-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .sho-empty-stores {
          text-align: center;
          padding: 24px;
          color: rgba(255, 255, 255, 0.6);
        }

        .sho-empty-stores-icon {
          font-size: 48px;
          margin-bottom: 12px;
          opacity: 0.5;
        }

        .sho-link {
          color: #667eea;
          text-decoration: none;
        }

        .sho-link:hover {
          text-decoration: underline;
        }
      `;
      document.head.appendChild(style);
    }

    createOverlay() {
      this.overlay = document.createElement('div');
      this.overlay.className = 'sho-overlay';
      this.overlay.innerHTML = this.getOverlayHTML();
      document.body.appendChild(this.overlay);
    }

    getOverlayHTML() {
      return `
        <div class="sho-modal">
          <div class="sho-modal-header">
            <div class="sho-modal-title">
              <span class="sho-modal-title-icon">🚀</span>
              <span>Import vers Shopopti+</span>
            </div>
            <button class="sho-modal-close" id="sho-close">×</button>
          </div>
          <div class="sho-modal-body" id="sho-body">
            <!-- Dynamic content -->
          </div>
          <div class="sho-modal-footer" id="sho-footer">
            <button class="sho-btn sho-btn-secondary" id="sho-cancel">Annuler</button>
            <button class="sho-btn sho-btn-primary" id="sho-import">
              <span class="sho-btn-loading">⏳</span>
              <span class="sho-btn-text">Importer maintenant</span>
            </button>
          </div>
        </div>
      `;
    }

    bindEvents() {
      this.overlay.querySelector('#sho-close').addEventListener('click', () => this.close());
      this.overlay.querySelector('#sho-cancel').addEventListener('click', () => this.close());
      this.overlay.querySelector('#sho-import').addEventListener('click', () => this.executeImport());
      
      // Close on backdrop click
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) this.close();
      });

      // ESC key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) this.close();
      });
    }

    setupMessageListener() {
      window.addEventListener('message', (event) => {
        if (event.source !== window) return;
        
        if (event.data.type === 'SHOPOPTI_OPEN_IMPORT_OVERLAY') {
          this.open(event.data.product);
        }
      });

      // Also listen for custom event
      window.addEventListener('shopopti:open-import', (e) => {
        this.open(e.detail);
      });
    }

    open(productData) {
      this.productData = productData;
      this.renderContent();
      this.overlay.classList.add('open');
      this.isOpen = true;
    }

    close() {
      this.overlay.classList.remove('open');
      this.isOpen = false;
    }

    renderContent() {
      const body = this.overlay.querySelector('#sho-body');
      
      if (!this.token) {
        body.innerHTML = this.getNotConnectedHTML();
        return;
      }

      body.innerHTML = `
        ${this.getProductPreviewHTML()}
        ${this.getStoreSelectionHTML()}
        ${this.getStatusSelectionHTML()}
        ${this.getRulesPreviewHTML()}
      `;

      this.bindContentEvents();
    }

    getNotConnectedHTML() {
      return `
        <div class="sho-empty-stores">
          <div class="sho-empty-stores-icon">🔐</div>
          <p>Connectez-vous à Shopopti+ pour importer des produits</p>
          <br>
          <a href="${CONFIG.APP_URL}/extensions/chrome" target="_blank" class="sho-link">
            Obtenir ma clé d'extension →
          </a>
        </div>
      `;
    }

    getProductPreviewHTML() {
      const p = this.productData || {};
      const image = p.images?.[0] || p.image || '';
      const price = parseFloat(p.price) || 0;
      const variantsCount = p.variants?.length || 0;
      const imagesCount = p.images?.length || 0;

      return `
        <div class="sho-product-preview">
          <img src="${image}" class="sho-product-image" alt="" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23334155%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 font-size=%2240%22 text-anchor=%22middle%22 fill=%22%2364748b%22>📦</text></svg>'">
          <div class="sho-product-info">
            <div class="sho-product-title">${p.title || 'Produit'}</div>
            <div class="sho-product-price">${price.toFixed(2)} ${p.currency || '€'}</div>
            <div class="sho-product-meta">
              <span class="sho-product-badge">📷 ${imagesCount} images</span>
              ${variantsCount > 1 ? `<span class="sho-product-badge">🎨 ${variantsCount} variantes</span>` : ''}
              <span class="sho-product-badge">${p.platform || 'Web'}</span>
            </div>
          </div>
        </div>
      `;
    }

    getStoreSelectionHTML() {
      if (this.stores.length === 0) {
        return `
          <div class="sho-section">
            <div class="sho-section-title">Boutique de destination</div>
            <div class="sho-empty-stores">
              <p>Aucune boutique connectée</p>
              <a href="${CONFIG.APP_URL}/stores" target="_blank" class="sho-link">Connecter une boutique →</a>
            </div>
          </div>
        `;
      }

      // If only one store, auto-select it
      if (this.stores.length === 1) {
        this.selectedStore = this.stores[0].id;
      }

      return `
        <div class="sho-section">
          <div class="sho-section-title">Boutique de destination</div>
          <div class="sho-store-selector">
            ${this.stores.map(store => `
              <label class="sho-store-option ${this.selectedStore === store.id ? 'selected' : ''}" data-store-id="${store.id}">
                <input type="radio" name="store" value="${store.id}" ${this.selectedStore === store.id ? 'checked' : ''}>
                <div class="sho-store-radio"></div>
                <div class="sho-store-info">
                  <div class="sho-store-name">${store.name || 'Ma boutique'}</div>
                  <div class="sho-store-domain">${store.domain || store.platform}</div>
                </div>
                ${store.isDefault ? '<span class="sho-store-default">Par défaut</span>' : ''}
              </label>
            `).join('')}
          </div>
        </div>
      `;
    }

    getStatusSelectionHTML() {
      return `
        <div class="sho-section">
          <div class="sho-section-title">Statut du produit</div>
          <div class="sho-status-selector">
            <button class="sho-status-btn ${this.selectedStatus === 'draft' ? 'selected' : ''}" data-status="draft">
              📝 Brouillon
            </button>
            <button class="sho-status-btn ${this.selectedStatus === 'active' ? 'selected' : ''}" data-status="active">
              ✅ Publier
            </button>
          </div>
        </div>
      `;
    }

    getRulesPreviewHTML() {
      const rules = this.importRules || this.getDefaultRules();
      const originalPrice = parseFloat(this.productData?.price) || 0;
      const markup = rules.pricing?.markupValue || 30;
      const finalPrice = originalPrice * (1 + markup / 100);

      return `
        <div class="sho-section">
          <div class="sho-section-title">Règles automatiques appliquées</div>
          <div class="sho-rules-preview">
            <div class="sho-rule-item">
              <span class="sho-rule-label">Prix de vente</span>
              <span class="sho-rule-value highlight">${finalPrice.toFixed(2)} € (+${markup}%)</span>
            </div>
            <div class="sho-rule-item">
              <span class="sho-rule-label">Devise</span>
              <span class="sho-rule-value">${rules.currency || 'EUR'}</span>
            </div>
            ${rules.defaultCategory ? `
              <div class="sho-rule-item">
                <span class="sho-rule-label">Catégorie</span>
                <span class="sho-rule-value">${rules.defaultCategory}</span>
              </div>
            ` : ''}
            ${rules.defaultTags?.length > 0 ? `
              <div class="sho-rule-item">
                <span class="sho-rule-label">Tags</span>
                <span class="sho-rule-value">${rules.defaultTags.join(', ')}</span>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    bindContentEvents() {
      // Store selection
      this.overlay.querySelectorAll('.sho-store-option').forEach(option => {
        option.addEventListener('click', () => {
          this.overlay.querySelectorAll('.sho-store-option').forEach(o => o.classList.remove('selected'));
          option.classList.add('selected');
          this.selectedStore = option.dataset.storeId;
        });
      });

      // Status selection
      this.overlay.querySelectorAll('.sho-status-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.overlay.querySelectorAll('.sho-status-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          this.selectedStatus = btn.dataset.status;
        });
      });
    }

    async executeImport() {
      const importBtn = this.overlay.querySelector('#sho-import');
      importBtn.classList.add('loading');
      importBtn.disabled = true;

      try {
        // Apply rules to product
        const enrichedProduct = this.applyImportRules(this.productData);

        // Call API
        const response = await this.sendImportRequest(enrichedProduct);

        if (response.success) {
          this.showSuccess(response);
        } else {
          this.showError(response.error || 'Erreur lors de l\'import');
        }
      } catch (error) {
        console.error('[Shopopti+] Import error:', error);
        this.showError(error.message);
      } finally {
        importBtn.classList.remove('loading');
        importBtn.disabled = false;
      }
    }

    applyImportRules(product) {
      const rules = this.importRules || this.getDefaultRules();
      const enriched = { ...product };

      // Apply pricing markup
      if (rules.pricing?.enabled && enriched.price) {
        const originalPrice = parseFloat(enriched.price);
        const markup = rules.pricing.markupValue || 30;
        
        if (rules.pricing.markupType === 'percentage') {
          enriched.salePrice = originalPrice * (1 + markup / 100);
        } else {
          enriched.salePrice = originalPrice + markup;
        }

        // Round to nearest
        if (rules.pricing.roundToNearest) {
          const nearest = rules.pricing.roundToNearest;
          enriched.salePrice = Math.ceil(enriched.salePrice) - (1 - nearest);
        }

        enriched.costPrice = originalPrice;
      }

      // Apply default category
      if (rules.defaultCategory && !enriched.category) {
        enriched.category = rules.defaultCategory;
      }

      // Apply default tags
      if (rules.defaultTags?.length > 0) {
        enriched.tags = [...(enriched.tags || []), ...rules.defaultTags];
      }

      // Apply currency
      enriched.currency = rules.currency || 'EUR';

      // Apply status
      enriched.status = this.selectedStatus;

      // Add store reference
      enriched.targetStore = this.selectedStore;

      return enriched;
    }

    async sendImportRequest(product) {
      const response = await fetch(`${CONFIG.API_URL}/extension-sync-realtime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': this.token
        },
        body: JSON.stringify({
          action: 'import_products',
          products: [product],
          options: {
            targetStore: this.selectedStore,
            status: this.selectedStatus,
            applyRules: true
          }
        })
      });

      return await response.json();
    }

    showSuccess(response) {
      const body = this.overlay.querySelector('#sho-body');
      const footer = this.overlay.querySelector('#sho-footer');

      body.innerHTML = `
        <div class="sho-import-success">
          <div class="sho-success-icon">✅</div>
          <div class="sho-success-title">Import réussi!</div>
          <div class="sho-success-message">
            Votre produit a été importé dans Shopopti+
          </div>
          <div class="sho-success-actions">
            <a href="${CONFIG.APP_URL}/products" target="_blank" class="sho-btn sho-btn-secondary">
              Voir mes produits
            </a>
            <button class="sho-btn sho-btn-primary" id="sho-close-success">
              Fermer
            </button>
          </div>
        </div>
      `;

      footer.style.display = 'none';

      body.querySelector('#sho-close-success').addEventListener('click', () => {
        this.close();
        footer.style.display = 'flex';
      });

      // Save to history
      this.saveToHistory(this.productData);
    }

    showError(message) {
      alert(`❌ Erreur: ${message}`);
    }

    saveToHistory(product) {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['importHistory'], (result) => {
          const history = result.importHistory || [];
          history.unshift({
            name: product.title,
            image: product.images?.[0],
            platform: product.platform,
            timestamp: new Date().toISOString()
          });
          chrome.storage.local.set({ importHistory: history.slice(0, 50) });
        });
      }
    }
  }

  // Initialize
  window.ShopoptiImportOverlay = new ImportOverlay();

})();
