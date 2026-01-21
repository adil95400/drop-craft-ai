/**
 * Multi-Store Manager
 * Enables importing products to multiple stores simultaneously
 */

class MultiStoreManager {
  constructor() {
    this.stores = [];
    this.selectedStores = [];
    this.apiEndpoint = null;
    this.authToken = null;
    this.initialized = false;
  }

  async initialize(config = {}) {
    this.apiEndpoint = config.apiEndpoint || 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1';
    this.authToken = config.authToken;
    
    await this.fetchStores();
    this.initialized = true;
    
    console.log('[MultiStore] Initialized with', this.stores.length, 'stores');
  }

  async fetchStores() {
    try {
      const response = await fetch(`${this.apiEndpoint}/list-user-stores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      this.stores = result.stores || [];
      
      // If no stores from API, try to get from local storage
      if (this.stores.length === 0) {
        const cached = localStorage.getItem('dc_user_stores');
        if (cached) {
          this.stores = JSON.parse(cached);
        }
      } else {
        // Cache stores locally
        localStorage.setItem('dc_user_stores', JSON.stringify(this.stores));
      }
      
      return this.stores;
    } catch (error) {
      console.error('[MultiStore] Failed to fetch stores:', error);
      
      // Fallback to cached stores
      const cached = localStorage.getItem('dc_user_stores');
      if (cached) {
        this.stores = JSON.parse(cached);
      }
      
      return this.stores;
    }
  }

  getStores() {
    return this.stores;
  }

  getSelectedStores() {
    return this.selectedStores;
  }

  selectStore(storeId) {
    if (!this.selectedStores.includes(storeId)) {
      this.selectedStores.push(storeId);
    }
  }

  deselectStore(storeId) {
    this.selectedStores = this.selectedStores.filter(id => id !== storeId);
  }

  toggleStore(storeId) {
    if (this.selectedStores.includes(storeId)) {
      this.deselectStore(storeId);
    } else {
      this.selectStore(storeId);
    }
  }

  selectAllStores() {
    this.selectedStores = this.stores.map(s => s.id);
  }

  clearSelection() {
    this.selectedStores = [];
  }

  async importToSelectedStores(products) {
    if (this.selectedStores.length === 0) {
      return { success: false, error: 'No stores selected' };
    }

    const results = {
      total: this.selectedStores.length,
      successful: 0,
      failed: 0,
      details: []
    };

    // Import to each selected store in parallel
    const importPromises = this.selectedStores.map(async (storeId) => {
      const store = this.stores.find(s => s.id === storeId);
      if (!store) {
        return { storeId, success: false, error: 'Store not found' };
      }

      try {
        const response = await fetch(`${this.apiEndpoint}/import-to-store`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.authToken}`
          },
          body: JSON.stringify({
            storeId,
            storePlatform: store.platform,
            products: Array.isArray(products) ? products : [products]
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        return {
          storeId,
          storeName: store.name,
          success: true,
          imported: result.imported || products.length
        };
      } catch (error) {
        return {
          storeId,
          storeName: store.name,
          success: false,
          error: error.message
        };
      }
    });

    const importResults = await Promise.all(importPromises);
    
    importResults.forEach(result => {
      results.details.push(result);
      if (result.success) {
        results.successful++;
      } else {
        results.failed++;
      }
    });

    return results;
  }

  // Create the multi-store selection UI
  createStoreSelectionUI() {
    const container = document.createElement('div');
    container.id = 'dc-multi-store-panel';
    container.innerHTML = `
      <style>
        #dc-multi-store-panel {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 400px;
          max-height: 500px;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          z-index: 2147483647;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #fff;
          overflow: hidden;
        }
        
        .dc-ms-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .dc-ms-title {
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .dc-ms-close {
          background: none;
          border: none;
          color: #888;
          cursor: pointer;
          font-size: 20px;
          padding: 4px;
        }
        
        .dc-ms-close:hover {
          color: #fff;
        }
        
        .dc-ms-body {
          padding: 16px 20px;
          max-height: 350px;
          overflow-y: auto;
        }
        
        .dc-ms-select-all {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          margin-bottom: 12px;
          cursor: pointer;
        }
        
        .dc-ms-select-all:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .dc-ms-stores {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .dc-ms-store {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .dc-ms-store:hover {
          background: rgba(255, 255, 255, 0.08);
        }
        
        .dc-ms-store.selected {
          background: rgba(34, 197, 94, 0.15);
          border-color: rgba(34, 197, 94, 0.4);
        }
        
        .dc-ms-store-checkbox {
          width: 20px;
          height: 20px;
          border-radius: 5px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .dc-ms-store.selected .dc-ms-store-checkbox {
          background: #22c55e;
          border-color: #22c55e;
        }
        
        .dc-ms-store-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }
        
        .dc-ms-store-info {
          flex: 1;
          min-width: 0;
        }
        
        .dc-ms-store-name {
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .dc-ms-store-platform {
          font-size: 12px;
          color: #888;
        }
        
        .dc-ms-footer {
          display: flex;
          gap: 12px;
          padding: 16px 20px;
          background: rgba(255, 255, 255, 0.03);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .dc-ms-btn {
          flex: 1;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }
        
        .dc-ms-btn-cancel {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }
        
        .dc-ms-btn-cancel:hover {
          background: rgba(255, 255, 255, 0.15);
        }
        
        .dc-ms-btn-import {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: #fff;
        }
        
        .dc-ms-btn-import:hover {
          opacity: 0.9;
        }
        
        .dc-ms-btn-import:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .dc-ms-empty {
          text-align: center;
          padding: 40px 20px;
          color: #888;
        }
        
        .dc-ms-empty-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }
        
        .dc-ms-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          z-index: 2147483646;
        }
      </style>
      
      <div class="dc-ms-overlay"></div>
      <div class="dc-ms-header">
        <span class="dc-ms-title">
          🏪 Importer vers plusieurs boutiques
        </span>
        <button class="dc-ms-close" title="Fermer">×</button>
      </div>
      <div class="dc-ms-body">
        ${this.stores.length > 0 ? `
          <div class="dc-ms-select-all">
            <input type="checkbox" id="dc-ms-select-all-cb" />
            <label for="dc-ms-select-all-cb">Tout sélectionner (${this.stores.length} boutiques)</label>
          </div>
          <div class="dc-ms-stores">
            ${this.stores.map(store => this.renderStoreItem(store)).join('')}
          </div>
        ` : `
          <div class="dc-ms-empty">
            <div class="dc-ms-empty-icon">🔌</div>
            <div>Aucune boutique connectée</div>
            <div style="font-size: 12px; margin-top: 8px;">
              Connectez vos boutiques dans le dashboard ShopOpti+
            </div>
          </div>
        `}
      </div>
      <div class="dc-ms-footer">
        <button class="dc-ms-btn dc-ms-btn-cancel">Annuler</button>
        <button class="dc-ms-btn dc-ms-btn-import" ${this.stores.length === 0 ? 'disabled' : ''}>
          Importer (<span id="dc-ms-count">0</span> sélectionnées)
        </button>
      </div>
    `;

    // Event listeners
    setTimeout(() => {
      const overlay = container.querySelector('.dc-ms-overlay');
      const closeBtn = container.querySelector('.dc-ms-close');
      const cancelBtn = container.querySelector('.dc-ms-btn-cancel');
      const selectAllCb = container.querySelector('#dc-ms-select-all-cb');
      const storeItems = container.querySelectorAll('.dc-ms-store');
      const countSpan = container.querySelector('#dc-ms-count');

      const updateCount = () => {
        if (countSpan) {
          countSpan.textContent = this.selectedStores.length;
        }
        storeItems.forEach(item => {
          const storeId = item.dataset.storeId;
          item.classList.toggle('selected', this.selectedStores.includes(storeId));
        });
        if (selectAllCb) {
          selectAllCb.checked = this.selectedStores.length === this.stores.length;
        }
      };

      const close = () => {
        container.remove();
      };

      overlay?.addEventListener('click', close);
      closeBtn?.addEventListener('click', close);
      cancelBtn?.addEventListener('click', close);

      selectAllCb?.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.selectAllStores();
        } else {
          this.clearSelection();
        }
        updateCount();
      });

      storeItems.forEach(item => {
        item.addEventListener('click', () => {
          const storeId = item.dataset.storeId;
          this.toggleStore(storeId);
          updateCount();
        });
      });

      updateCount();
    }, 0);

    return container;
  }

  renderStoreItem(store) {
    const platformIcons = {
      shopify: '🟢',
      woocommerce: '🟣',
      prestashop: '🔵',
      magento: '🟠',
      bigcommerce: '⚪',
      wix: '⚫',
      amazon: '📦',
      ebay: '🔴',
      etsy: '🧡'
    };

    const icon = platformIcons[store.platform?.toLowerCase()] || '🏪';
    const isSelected = this.selectedStores.includes(store.id);

    return `
      <div class="dc-ms-store ${isSelected ? 'selected' : ''}" data-store-id="${store.id}">
        <div class="dc-ms-store-checkbox">
          ${isSelected ? '✓' : ''}
        </div>
        <div class="dc-ms-store-icon" style="background: ${store.color || 'rgba(255,255,255,0.1)'}">
          ${icon}
        </div>
        <div class="dc-ms-store-info">
          <div class="dc-ms-store-name">${store.name || store.domain || 'Boutique'}</div>
          <div class="dc-ms-store-platform">${store.platform || 'E-commerce'}</div>
        </div>
      </div>
    `;
  }

  // Show the multi-store selection modal
  async showSelectionModal(products, onImport) {
    if (!this.initialized) {
      await this.initialize({ authToken: this.authToken });
    }

    const modal = this.createStoreSelectionUI();
    document.body.appendChild(modal);

    return new Promise((resolve) => {
      const importBtn = modal.querySelector('.dc-ms-btn-import');
      
      importBtn?.addEventListener('click', async () => {
        if (this.selectedStores.length === 0) {
          alert('Veuillez sélectionner au moins une boutique');
          return;
        }

        importBtn.disabled = true;
        importBtn.textContent = 'Import en cours...';

        try {
          const results = await this.importToSelectedStores(products);
          
          if (onImport) {
            onImport(results);
          }
          
          modal.remove();
          resolve(results);
        } catch (error) {
          console.error('[MultiStore] Import failed:', error);
          importBtn.disabled = false;
          importBtn.textContent = 'Réessayer';
          resolve({ success: false, error: error.message });
        }
      });

      // Close button resolves with null
      const closeActions = modal.querySelectorAll('.dc-ms-close, .dc-ms-btn-cancel, .dc-ms-overlay');
      closeActions.forEach(el => {
        el.addEventListener('click', () => resolve(null));
      });
    });
  }
}

// Export for use
window.MultiStoreManager = MultiStoreManager;
