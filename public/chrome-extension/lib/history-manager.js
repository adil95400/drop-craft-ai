/**
 * ShopOpti+ Import History Manager v5.7.0
 * Track imports per store with detailed history
 */

const ShopOptiHistoryManager = {
  VERSION: '5.7.0',
  MAX_HISTORY_ITEMS: 500,

  /**
   * Initialize history from storage
   */
  async init() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get(['importHistory', 'historyByStore']);
      this.history = result.importHistory || [];
      this.historyByStore = result.historyByStore || {};
    }
    return this;
  },

  /**
   * Add import to history
   */
  async addImport(importData) {
    const entry = {
      id: `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      title: importData.title || 'Unknown Product',
      url: importData.url || importData.source_url || '',
      platform: importData.platform || 'unknown',
      price: importData.price || 0,
      image: importData.images?.[0] || importData.image_url || '',
      sku: importData.sku || '',
      status: importData.status || 'completed',
      storeId: importData.storeId || null,
      storeName: importData.storeName || null,
      error: importData.error || null,
      productId: importData.productId || null,
      variants: importData.variants?.length || 0,
      images: importData.images?.length || 0,
      reviews: importData.reviews?.length || 0
    };

    // Add to global history
    this.history = this.history || [];
    this.history.unshift(entry);
    
    // Trim if too large
    if (this.history.length > this.MAX_HISTORY_ITEMS) {
      this.history = this.history.slice(0, this.MAX_HISTORY_ITEMS);
    }

    // Add to store-specific history
    if (entry.storeId) {
      this.historyByStore = this.historyByStore || {};
      if (!this.historyByStore[entry.storeId]) {
        this.historyByStore[entry.storeId] = [];
      }
      this.historyByStore[entry.storeId].unshift(entry);
      
      // Trim per-store history
      if (this.historyByStore[entry.storeId].length > 100) {
        this.historyByStore[entry.storeId] = this.historyByStore[entry.storeId].slice(0, 100);
      }
    }

    // Save to storage
    await this.save();

    return entry;
  },

  /**
   * Get all history
   */
  getHistory(options = {}) {
    const { limit = 50, offset = 0, storeId = null, platform = null, status = null } = options;
    
    let filtered = this.history || [];

    if (storeId) {
      filtered = filtered.filter(h => h.storeId === storeId);
    }
    if (platform) {
      filtered = filtered.filter(h => h.platform === platform);
    }
    if (status) {
      filtered = filtered.filter(h => h.status === status);
    }

    return {
      items: filtered.slice(offset, offset + limit),
      total: filtered.length,
      hasMore: offset + limit < filtered.length
    };
  },

  /**
   * Get history for specific store
   */
  getStoreHistory(storeId, options = {}) {
    const { limit = 50, offset = 0 } = options;
    const storeHistory = this.historyByStore?.[storeId] || [];
    
    return {
      items: storeHistory.slice(offset, offset + limit),
      total: storeHistory.length,
      hasMore: offset + limit < storeHistory.length
    };
  },

  /**
   * Get import statistics
   */
  getStats(options = {}) {
    const { storeId = null, days = 30 } = options;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    let filtered = (this.history || []).filter(h => 
      new Date(h.timestamp) >= cutoffDate
    );

    if (storeId) {
      filtered = filtered.filter(h => h.storeId === storeId);
    }

    const stats = {
      total: filtered.length,
      successful: filtered.filter(h => h.status === 'completed').length,
      failed: filtered.filter(h => h.status === 'failed' || h.status === 'error').length,
      byPlatform: {},
      byStore: {},
      byDay: {},
      totalValue: 0
    };

    filtered.forEach(h => {
      // By platform
      stats.byPlatform[h.platform] = (stats.byPlatform[h.platform] || 0) + 1;
      
      // By store
      if (h.storeName) {
        stats.byStore[h.storeName] = (stats.byStore[h.storeName] || 0) + 1;
      }
      
      // By day
      const day = h.timestamp.split('T')[0];
      stats.byDay[day] = (stats.byDay[day] || 0) + 1;
      
      // Total value
      if (h.price) {
        stats.totalValue += parseFloat(h.price) || 0;
      }
    });

    return stats;
  },

  /**
   * Search history
   */
  search(query, options = {}) {
    const { limit = 20 } = options;
    const queryLower = query.toLowerCase();
    
    return (this.history || [])
      .filter(h => 
        h.title?.toLowerCase().includes(queryLower) ||
        h.sku?.toLowerCase().includes(queryLower) ||
        h.platform?.toLowerCase().includes(queryLower) ||
        h.storeName?.toLowerCase().includes(queryLower)
      )
      .slice(0, limit);
  },

  /**
   * Delete import from history
   */
  async deleteImport(importId) {
    this.history = (this.history || []).filter(h => h.id !== importId);
    
    // Also remove from store histories
    Object.keys(this.historyByStore || {}).forEach(storeId => {
      this.historyByStore[storeId] = this.historyByStore[storeId].filter(h => h.id !== importId);
    });

    await this.save();
  },

  /**
   * Clear all history
   */
  async clearHistory(options = {}) {
    const { storeId = null } = options;
    
    if (storeId) {
      this.history = (this.history || []).filter(h => h.storeId !== storeId);
      delete this.historyByStore[storeId];
    } else {
      this.history = [];
      this.historyByStore = {};
    }

    await this.save();
  },

  /**
   * Get recent failed imports for retry
   */
  getFailedImports(limit = 10) {
    return (this.history || [])
      .filter(h => h.status === 'failed' || h.status === 'error')
      .slice(0, limit);
  },

  /**
   * Update import status
   */
  async updateStatus(importId, newStatus, additionalData = {}) {
    const entry = (this.history || []).find(h => h.id === importId);
    if (entry) {
      entry.status = newStatus;
      entry.updatedAt = new Date().toISOString();
      Object.assign(entry, additionalData);
      await this.save();
    }
    return entry;
  },

  /**
   * Save to storage
   */
  async save() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({
        importHistory: this.history,
        historyByStore: this.historyByStore
      });
    }
  },

  /**
   * Export history to CSV
   */
  exportToCSV(options = {}) {
    if (typeof ShopOptiCSVExporter !== 'undefined') {
      return ShopOptiCSVExporter.exportHistory(this.history || [], options);
    }
    console.warn('[ShopOpti+] CSV Exporter not loaded');
    return null;
  }
};

// Export
if (typeof window !== 'undefined') {
  window.ShopOptiHistoryManager = ShopOptiHistoryManager;
}
