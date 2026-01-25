// ============================================
// ShopOpti+ Store Manager v5.0
// Centralized multi-store connection management
// ============================================

const ShopOptiStoreManager = {
  VERSION: '5.0.0',
  
  // ============================================
  // CONFIGURATION
  // ============================================
  CONFIG: {
    API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    SYNC_INTERVAL: 60 * 1000 // 1 minute
  },

  // ============================================
  // STATE
  // ============================================
  stores: [],
  selectedStoreIds: [],
  lastFetch: 0,
  initialized: false,
  syncInterval: null,
  
  // Platform metadata
  PLATFORMS: {
    shopify: { icon: '🟢', name: 'Shopify', color: '#96bf48' },
    woocommerce: { icon: '🟣', name: 'WooCommerce', color: '#9b5c8f' },
    prestashop: { icon: '🔵', name: 'PrestaShop', color: '#df0067' },
    magento: { icon: '🟠', name: 'Magento', color: '#f26322' },
    bigcommerce: { icon: '⚪', name: 'BigCommerce', color: '#34313f' },
    wix: { icon: '⚫', name: 'Wix', color: '#0c6efc' },
    squarespace: { icon: '⬛', name: 'Squarespace', color: '#000000' },
    amazon: { icon: '📦', name: 'Amazon', color: '#ff9900', type: 'marketplace' },
    ebay: { icon: '🔴', name: 'eBay', color: '#e53238', type: 'marketplace' },
    etsy: { icon: '🧡', name: 'Etsy', color: '#f56400', type: 'marketplace' },
    'tiktok-shop': { icon: '🎵', name: 'TikTok Shop', color: '#00f2ea', type: 'marketplace' }
  },

  // ============================================
  // INITIALIZATION
  // ============================================
  
  async init(token) {
    if (this.initialized) return this;
    
    this.token = token;
    
    // Load from cache first
    await this.loadFromCache();
    
    // Then fetch fresh data
    await this.fetchStores();
    
    // Start auto-sync
    this.startAutoSync();
    
    this.initialized = true;
    console.log('[StoreManager] Initialized with', this.stores.length, 'stores');
    
    return this;
  },
  
  // ============================================
  // STORE FETCHING
  // ============================================
  
  async fetchStores(force = false) {
    // Use cache if fresh enough
    if (!force && Date.now() - this.lastFetch < this.CONFIG.CACHE_DURATION) {
      return this.stores;
    }
    
    try {
      const response = await fetch(`${this.CONFIG.API_URL}/list-user-stores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({})
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.stores) {
        this.stores = result.stores.map(store => this.enrichStore(store));
        this.lastFetch = Date.now();
        await this.saveToCache();
      }
      
      return this.stores;
    } catch (error) {
      console.error('[StoreManager] Fetch error:', error);
      
      // Return cached stores on error
      return this.stores;
    }
  },
  
  enrichStore(store) {
    const platformInfo = this.PLATFORMS[store.platform?.toLowerCase()] || {};
    
    return {
      ...store,
      icon: platformInfo.icon || '🏪',
      platformName: platformInfo.name || store.platform || 'Unknown',
      color: store.color || platformInfo.color || '#6366f1',
      type: platformInfo.type || 'store',
      displayName: store.name || store.domain || platformInfo.name || 'Boutique',
      isConnected: store.status === 'connected' || store.connection_status === 'connected',
      productCount: store.productCount || store.product_count || 0
    };
  },
  
  // ============================================
  // STORE SELECTION
  // ============================================
  
  getStores(filter = {}) {
    let filtered = [...this.stores];
    
    if (filter.type) {
      filtered = filtered.filter(s => s.type === filter.type);
    }
    
    if (filter.platform) {
      filtered = filtered.filter(s => s.platform === filter.platform);
    }
    
    if (filter.connected !== undefined) {
      filtered = filtered.filter(s => s.isConnected === filter.connected);
    }
    
    return filtered;
  },
  
  getSelectedStores() {
    return this.stores.filter(s => this.selectedStoreIds.includes(s.id));
  },
  
  selectStore(storeId) {
    if (!this.selectedStoreIds.includes(storeId)) {
      this.selectedStoreIds.push(storeId);
      this.saveToCache();
    }
  },
  
  deselectStore(storeId) {
    this.selectedStoreIds = this.selectedStoreIds.filter(id => id !== storeId);
    this.saveToCache();
  },
  
  toggleStore(storeId) {
    if (this.selectedStoreIds.includes(storeId)) {
      this.deselectStore(storeId);
    } else {
      this.selectStore(storeId);
    }
    return this.selectedStoreIds;
  },
  
  selectAll() {
    this.selectedStoreIds = this.stores.map(s => s.id);
    this.saveToCache();
    return this.selectedStoreIds;
  },
  
  deselectAll() {
    this.selectedStoreIds = [];
    this.saveToCache();
    return this.selectedStoreIds;
  },
  
  isSelected(storeId) {
    return this.selectedStoreIds.includes(storeId);
  },
  
  // ============================================
  // IMPORT OPERATIONS
  // ============================================
  
  async importToStores(products, options = {}) {
    const selectedStores = this.getSelectedStores();
    
    if (selectedStores.length === 0) {
      return { 
        success: false, 
        error: 'Aucune boutique sélectionnée',
        results: [] 
      };
    }
    
    const results = {
      success: true,
      total: selectedStores.length,
      successful: 0,
      failed: 0,
      storeResults: []
    };
    
    // Process stores in parallel
    const importPromises = selectedStores.map(async (store) => {
      try {
        const response = await fetch(`${this.CONFIG.API_URL}/import-to-store`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
          },
          body: JSON.stringify({
            storeId: store.id,
            storePlatform: store.platform,
            products: Array.isArray(products) ? products : [products],
            options
          })
        });
        
        const result = await response.json();
        
        const storeResult = {
          store,
          success: response.ok && result.success !== false,
          imported: result.imported || (Array.isArray(products) ? products.length : 1),
          data: result
        };
        
        if (storeResult.success) {
          results.successful++;
          
          // Update store product count
          const storeIndex = this.stores.findIndex(s => s.id === store.id);
          if (storeIndex > -1) {
            this.stores[storeIndex].productCount += storeResult.imported;
            this.stores[storeIndex].lastSync = new Date().toISOString();
          }
        } else {
          results.failed++;
          storeResult.error = result.error || 'Import failed';
        }
        
        return storeResult;
      } catch (error) {
        results.failed++;
        return {
          store,
          success: false,
          error: error.message
        };
      }
    });
    
    results.storeResults = await Promise.all(importPromises);
    results.success = results.successful > 0;
    
    // Save updated store data
    await this.saveToCache();
    
    return results;
  },
  
  async syncProductToStores(productId, updates) {
    const selectedStores = this.getSelectedStores();
    
    const syncPromises = selectedStores.map(async (store) => {
      try {
        const response = await fetch(`${this.CONFIG.API_URL}/sync-product-to-store`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
          },
          body: JSON.stringify({
            storeId: store.id,
            productId,
            updates
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
  
  // ============================================
  // CACHE MANAGEMENT
  // ============================================
  
  async loadFromCache() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['shopopti_stores', 'shopopti_selected_stores'], (result) => {
          if (result.shopopti_stores) {
            this.stores = result.shopopti_stores;
          }
          if (result.shopopti_selected_stores) {
            this.selectedStoreIds = result.shopopti_selected_stores;
          }
          resolve();
        });
      } else {
        // Fallback to localStorage
        try {
          const stores = localStorage.getItem('shopopti_stores');
          const selected = localStorage.getItem('shopopti_selected_stores');
          if (stores) this.stores = JSON.parse(stores);
          if (selected) this.selectedStoreIds = JSON.parse(selected);
        } catch (e) {
          console.warn('[StoreManager] Cache load error:', e);
        }
        resolve();
      }
    });
  },
  
  async saveToCache() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({
          shopopti_stores: this.stores,
          shopopti_selected_stores: this.selectedStoreIds
        }, resolve);
      } else {
        try {
          localStorage.setItem('shopopti_stores', JSON.stringify(this.stores));
          localStorage.setItem('shopopti_selected_stores', JSON.stringify(this.selectedStoreIds));
        } catch (e) {
          console.warn('[StoreManager] Cache save error:', e);
        }
        resolve();
      }
    });
  },
  
  // ============================================
  // AUTO-SYNC
  // ============================================
  
  startAutoSync() {
    if (this.syncInterval) return;
    
    this.syncInterval = setInterval(() => {
      if (navigator.onLine) {
        this.fetchStores(true);
      }
    }, this.CONFIG.SYNC_INTERVAL);
    
    // Listen for online/offline
    window.addEventListener('online', () => this.fetchStores(true));
  },
  
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  },
  
  // ============================================
  // UI HELPERS
  // ============================================
  
  createStoreCard(store, options = {}) {
    const isSelected = this.isSelected(store.id);
    const { showCheckbox = true, showBadge = true, onClick } = options;
    
    const card = document.createElement('div');
    card.className = `shopopti-store-card ${isSelected ? 'selected' : ''}`;
    card.dataset.storeId = store.id;
    
    card.innerHTML = `
      ${showCheckbox ? `
        <div class="shopopti-store-checkbox">
          ${isSelected ? '✓' : ''}
        </div>
      ` : ''}
      <div class="shopopti-store-icon" style="background: ${store.color}">
        ${store.icon}
      </div>
      <div class="shopopti-store-info">
        <div class="shopopti-store-name">${this.escapeHtml(store.displayName)}</div>
        <div class="shopopti-store-platform">${store.platformName}</div>
      </div>
      ${showBadge ? `
        <div class="shopopti-store-badge" style="background: ${store.isConnected ? '#22c55e' : '#64748b'}">
          ${store.productCount}
        </div>
      ` : ''}
    `;
    
    if (onClick) {
      card.addEventListener('click', () => onClick(store, isSelected));
    }
    
    return card;
  },
  
  getStoreListStyles() {
    return `
      .shopopti-store-card {
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
      
      .shopopti-store-card:hover {
        background: rgba(255, 255, 255, 0.08);
      }
      
      .shopopti-store-card.selected {
        background: rgba(34, 197, 94, 0.15);
        border-color: rgba(34, 197, 94, 0.4);
      }
      
      .shopopti-store-checkbox {
        width: 20px;
        height: 20px;
        border-radius: 5px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: transparent;
        flex-shrink: 0;
      }
      
      .shopopti-store-card.selected .shopopti-store-checkbox {
        background: #22c55e;
        border-color: #22c55e;
        color: white;
      }
      
      .shopopti-store-icon {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        flex-shrink: 0;
      }
      
      .shopopti-store-info {
        flex: 1;
        min-width: 0;
      }
      
      .shopopti-store-name {
        font-size: 14px;
        font-weight: 500;
        color: white;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .shopopti-store-platform {
        font-size: 12px;
        color: #888;
      }
      
      .shopopti-store-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        color: white;
      }
    `;
  },
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ShopOptiStoreManager;
}
