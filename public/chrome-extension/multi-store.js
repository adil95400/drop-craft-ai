// Multi-Store Import Module v1.0
// Import products to multiple stores simultaneously - AutoDS parity feature

(function() {
  'use strict';

  const MultiStoreManager = {
    stores: [],
    selectedStores: [],
    API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',

    // Initialize by loading stores from storage
    async init() {
      await this.loadStores();
      return this;
    },

    // Load connected stores from chrome storage
    async loadStores() {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.get(['connectedStores', 'selectedStoreIds'], (result) => {
            this.stores = result.connectedStores || [];
            this.selectedStores = result.selectedStoreIds || [];
            resolve(this.stores);
          });
        } else {
          resolve([]);
        }
      });
    },

    // Save stores to storage
    async saveStores() {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.set({
            connectedStores: this.stores,
            selectedStoreIds: this.selectedStores
          }, resolve);
        } else {
          resolve();
        }
      });
    },

    // Add a new store connection
    async addStore(storeData) {
      const store = {
        id: `store_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: storeData.name,
        platform: storeData.platform, // shopify, woocommerce, etc.
        domain: storeData.domain,
        credentials: storeData.credentials,
        connected_at: new Date().toISOString(),
        last_sync_at: null,
        product_count: 0,
        status: 'active'
      };

      this.stores.push(store);
      await this.saveStores();
      
      return store;
    },

    // Remove a store
    async removeStore(storeId) {
      this.stores = this.stores.filter(s => s.id !== storeId);
      this.selectedStores = this.selectedStores.filter(id => id !== storeId);
      await this.saveStores();
    },

    // Toggle store selection for import
    toggleStoreSelection(storeId) {
      const index = this.selectedStores.indexOf(storeId);
      if (index > -1) {
        this.selectedStores.splice(index, 1);
      } else {
        this.selectedStores.push(storeId);
      }
      this.saveStores();
      return this.selectedStores;
    },

    // Select all stores
    selectAllStores() {
      this.selectedStores = this.stores.map(s => s.id);
      this.saveStores();
      return this.selectedStores;
    },

    // Deselect all stores
    deselectAllStores() {
      this.selectedStores = [];
      this.saveStores();
      return this.selectedStores;
    },

    // Get selected stores
    getSelectedStores() {
      return this.stores.filter(s => this.selectedStores.includes(s.id));
    },

    // Import product to multiple stores
    async importToMultipleStores(productData, token) {
      const selectedStores = this.getSelectedStores();
      
      if (selectedStores.length === 0) {
        return { success: false, error: 'Aucune boutique sélectionnée' };
      }

      const results = {
        successful: [],
        failed: [],
        total: selectedStores.length
      };

      // Import to each store in parallel
      const importPromises = selectedStores.map(async (store) => {
        try {
          const response = await fetch(`${this.API_URL}/extension-sync-realtime`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-extension-token': token
            },
            body: JSON.stringify({
              action: 'import_products',
              products: [productData],
              store_id: store.id,
              store_platform: store.platform
            })
          });

          if (response.ok) {
            const data = await response.json();
            results.successful.push({
              store,
              imported: data.imported || 1,
              product_id: data.product_ids?.[0]
            });
          } else {
            const error = await response.json().catch(() => ({}));
            results.failed.push({
              store,
              error: error.message || `HTTP ${response.status}`
            });
          }
        } catch (error) {
          results.failed.push({
            store,
            error: error.message || 'Erreur réseau'
          });
        }
      });

      await Promise.all(importPromises);

      // Update last sync times
      results.successful.forEach(result => {
        const store = this.stores.find(s => s.id === result.store.id);
        if (store) {
          store.last_sync_at = new Date().toISOString();
          store.product_count = (store.product_count || 0) + 1;
        }
      });
      await this.saveStores();

      return {
        success: results.failed.length === 0,
        results
      };
    },

    // Sync product updates to all stores
    async syncProductToStores(productId, updates, token) {
      const selectedStores = this.getSelectedStores();
      
      const syncPromises = selectedStores.map(async (store) => {
        try {
          const response = await fetch(`${this.API_URL}/extension-sync-realtime`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-extension-token': token
            },
            body: JSON.stringify({
              action: 'sync_product',
              product_id: productId,
              updates,
              store_id: store.id
            })
          });

          return {
            store,
            success: response.ok
          };
        } catch (error) {
          return {
            store,
            success: false,
            error: error.message
          };
        }
      });

      return Promise.all(syncPromises);
    },

    // Create UI for store selector
    createStoreSelectorUI() {
      const container = document.createElement('div');
      container.className = 'dc-multi-store-selector';
      container.innerHTML = `
        <div class="dc-store-selector-header">
          <h4>📦 Importer vers</h4>
          <div class="dc-store-actions">
            <button class="dc-store-btn dc-select-all">Tout</button>
            <button class="dc-store-btn dc-deselect-all">Aucun</button>
          </div>
        </div>
        <div class="dc-store-list">
          ${this.stores.length === 0 ? 
            '<div class="dc-no-stores">Aucune boutique connectée. <a href="#" class="dc-add-store-link">Ajouter</a></div>' :
            this.stores.map(store => `
              <label class="dc-store-item ${this.selectedStores.includes(store.id) ? 'selected' : ''}">
                <input type="checkbox" 
                       class="dc-store-checkbox" 
                       data-store-id="${store.id}"
                       ${this.selectedStores.includes(store.id) ? 'checked' : ''}>
                <span class="dc-store-icon">${this.getPlatformIcon(store.platform)}</span>
                <div class="dc-store-info">
                  <span class="dc-store-name">${store.name}</span>
                  <span class="dc-store-domain">${store.domain}</span>
                </div>
                <span class="dc-store-badge ${store.status}">${store.product_count || 0}</span>
              </label>
            `).join('')
          }
        </div>
        <div class="dc-store-summary">
          <span class="dc-selected-count">${this.selectedStores.length} boutique(s) sélectionnée(s)</span>
        </div>
      `;

      // Bind events
      container.querySelectorAll('.dc-store-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          this.toggleStoreSelection(e.target.dataset.storeId);
          this.updateSelectorUI(container);
        });
      });

      container.querySelector('.dc-select-all')?.addEventListener('click', () => {
        this.selectAllStores();
        this.updateSelectorUI(container);
      });

      container.querySelector('.dc-deselect-all')?.addEventListener('click', () => {
        this.deselectAllStores();
        this.updateSelectorUI(container);
      });

      return container;
    },

    // Update selector UI
    updateSelectorUI(container) {
      container.querySelectorAll('.dc-store-item').forEach(item => {
        const checkbox = item.querySelector('.dc-store-checkbox');
        item.classList.toggle('selected', checkbox.checked);
      });

      const countEl = container.querySelector('.dc-selected-count');
      if (countEl) {
        countEl.textContent = `${this.selectedStores.length} boutique(s) sélectionnée(s)`;
      }
    },

    // Get platform icon
    getPlatformIcon(platform) {
      const icons = {
        'shopify': '🛍️',
        'woocommerce': '🛒',
        'prestashop': '🏪',
        'magento': '🔶',
        'bigcommerce': '📦',
        'squarespace': '⬛',
        'wix': '✨',
        'etsy': '🎨',
        'amazon': '📦',
        'ebay': '🏷️'
      };
      return icons[platform] || '🏪';
    }
  };

  // Export for use in other modules
  window.MultiStoreManager = MultiStoreManager;

  // Initialize on load
  MultiStoreManager.init();

})();
