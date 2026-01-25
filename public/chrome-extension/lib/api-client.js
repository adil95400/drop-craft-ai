// ============================================
// ShopOpti+ API Client v5.6.3
// Handles all backend API calls with authentication
// ============================================

const ShopOptiAPI = {
  API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
  
  /**
   * Get auth headers from ShopOptiAuth
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (typeof ShopOptiAuth !== 'undefined' && ShopOptiAuth.token) {
      headers['x-extension-token'] = ShopOptiAuth.token;
    }
    
    return headers;
  },
  
  /**
   * Make authenticated API request
   */
  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.API_URL}/${endpoint}`;
    
    const response = await fetch(url, {
      method: options.method || 'POST',
      headers: {
        ...this.getHeaders(),
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `Request failed: ${response.status}`);
    }
    
    return data;
  },
  
  // ============================================
  // PRODUCT IMPORT APIs
  // ============================================
  
  /**
   * Import product from URL (uses Firecrawl)
   */
  async importFromUrl(url, options = {}) {
    return this.request('extension-scraper', {
      body: {
        action: 'scrape_and_import',
        url,
        options: {
          includeReviews: options.includeReviews || false,
          includeVideos: options.includeVideos !== false,
          includeVariants: options.includeVariants !== false,
          targetStores: options.targetStores || []
        }
      }
    });
  },
  
  /**
   * Bulk import products
   */
  async bulkImport(products, options = {}) {
    return this.request('bulk-import-products', {
      body: {
        products,
        options: {
          skipDuplicates: options.skipDuplicates !== false,
          enrichWithAI: options.enrichWithAI || false,
          targetStores: options.targetStores || []
        }
      }
    });
  },
  
  /**
   * Import reviews for a product
   */
  async importReviews(productId, reviews, options = {}) {
    return this.request('import-reviews', {
      body: {
        action: 'import',
        productId,
        reviews,
        options: {
          translate: options.translate || false,
          targetLanguage: options.targetLanguage || 'fr',
          filterFake: options.filterFake !== false
        }
      }
    });
  },
  
  // ============================================
  // SYNC APIs
  // ============================================
  
  /**
   * Get sync status
   */
  async getSyncStatus() {
    return this.request('extension-sync-realtime', {
      body: { action: 'sync_status' }
    });
  },
  
  /**
   * Sync products to stores
   */
  async syncToStores(productIds, storeIds) {
    return this.request('extension-sync-realtime', {
      body: {
        action: 'sync_products',
        productIds,
        storeIds
      }
    });
  },
  
  /**
   * Sync stock levels
   */
  async syncStock(productIds) {
    return this.request('extension-sync-stock', {
      body: {
        action: 'sync',
        productIds
      }
    });
  },
  
  // ============================================
  // STORE APIs
  // ============================================
  
  /**
   * Get user's connected stores
   */
  async getStores() {
    return this.request('list-user-stores', {
      body: { action: 'list' }
    });
  },
  
  // ============================================
  // MONITORING APIs
  // ============================================
  
  /**
   * Add product to price monitoring
   */
  async addToMonitoring(productData) {
    return this.request('price-monitor', {
      body: {
        action: 'add',
        product: productData
      }
    });
  },
  
  /**
   * Get monitoring status
   */
  async getMonitoringStatus() {
    return this.request('price-monitor', {
      body: { action: 'status' }
    });
  },
  
  // ============================================
  // ADS SPY APIs
  // ============================================
  
  /**
   * Search viral ads
   */
  async searchAds(platform, query, options = {}) {
    return this.request('ads-spy', {
      body: {
        action: 'search',
        platform,
        query,
        limit: options.limit || 20,
        page: options.page || 1
      }
    });
  },
  
  /**
   * Get trending products from ads
   */
  async getTrendingProducts(platform, limit = 20) {
    return this.request('ads-spy', {
      body: {
        action: 'trending',
        platform,
        limit
      }
    });
  }
};

// Export
if (typeof window !== 'undefined') {
  window.ShopOptiAPI = ShopOptiAPI;
}
