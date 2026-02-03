// ============================================
// ShopOpti+ API Client v5.8.0 - GATEWAY EDITION
// Single endpoint routing for ALL extension operations
// ============================================

const ShopOptiAPI = {
  API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
  GATEWAY_ENDPOINT: 'extension-gateway',
  VERSION: '5.8.0',
  
  /**
   * Get auth headers from ShopOptiAuth
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'x-extension-version': this.VERSION
    };
    
    if (typeof ShopOptiAuth !== 'undefined' && ShopOptiAuth.token) {
      headers['x-extension-token'] = ShopOptiAuth.token;
    }
    
    return headers;
  },
  
  /**
   * UNIFIED GATEWAY REQUEST - All actions go through here
   * @param {string} action - Action name from gateway allowlist
   * @param {object} payload - Action-specific payload
   * @param {object} metadata - Optional metadata (platform, url, userAgent)
   */
  async gateway(action, payload = {}, metadata = {}) {
    const url = `${this.API_URL}/${this.GATEWAY_ENDPOINT}`;
    
    const body = {
      action,
      version: this.VERSION,
      payload,
      metadata: {
        platform: metadata.platform || this.detectCurrentPlatform(),
        url: metadata.url || (typeof window !== 'undefined' ? window.location.href : null),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        ...metadata
      }
    };
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      
      // Handle version rejection
      if (response.status === 426) {
        this.handleVersionRejection(data);
        throw new Error(`Extension update required. Minimum version: ${data.minimumVersion}`);
      }
      
      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = data.retryAfter || 60;
        throw new Error(`Rate limit exceeded. Retry in ${retryAfter} seconds.`);
      }
      
      if (!response.ok) {
        throw new Error(data.error || `Gateway error: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('[ShopOptiAPI] Gateway error:', error);
      throw error;
    }
  },
  
  /**
   * Handle version rejection - notify user
   */
  handleVersionRejection(data) {
    console.warn('[ShopOptiAPI] Extension outdated:', data);
    
    // Dispatch event for UI to show update notification
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('shopopti:update-required', {
        detail: {
          minimumVersion: data.minimumVersion,
          currentVersion: data.currentVersion,
          downloadUrl: data.downloadUrl
        }
      }));
    }
    
    // Show notification if available
    if (typeof chrome !== 'undefined' && chrome.notifications) {
      chrome.notifications.create('update-required', {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'ShopOpti+ - Mise à jour requise',
        message: `Veuillez mettre à jour vers la version ${data.minimumVersion} pour continuer à utiliser l'extension.`,
        priority: 2
      });
    }
  },
  
  /**
   * Detect current platform from URL
   */
  detectCurrentPlatform() {
    if (typeof window === 'undefined') return null;
    const url = window.location.href.toLowerCase();
    if (url.includes('amazon.')) return 'amazon';
    if (url.includes('aliexpress.')) return 'aliexpress';
    if (url.includes('ebay.')) return 'ebay';
    if (url.includes('temu.com')) return 'temu';
    if (url.includes('shein.')) return 'shein';
    if (url.includes('etsy.com')) return 'etsy';
    if (url.includes('walmart.com')) return 'walmart';
    if (url.includes('.myshopify.com')) return 'shopify';
    return 'unknown';
  },
  
  /**
   * Legacy request method - redirects to gateway
   * @deprecated Use gateway() directly
   */
  async request(endpoint, options = {}) {
    console.warn('[ShopOptiAPI] request() is deprecated. Use gateway() instead.');
    // Fallback to direct endpoint call for backward compatibility
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
  // AUTH APIs (via Gateway)
  // ============================================
  
  /**
   * Validate current token
   */
  async validateToken() {
    return this.gateway('AUTH_VALIDATE_TOKEN');
  },
  
  /**
   * Refresh token
   */
  async refreshToken(refreshToken) {
    return this.gateway('AUTH_REFRESH_TOKEN', { refreshToken });
  },
  
  /**
   * Send heartbeat
   */
  async heartbeat(info = {}) {
    return this.gateway('AUTH_HEARTBEAT', {
      version: this.VERSION,
      platform: info.platform,
      browser: info.browser
    });
  },
  
  // ============================================
  // PRODUCT IMPORT APIs (via Gateway)
  // ============================================
  
  /**
   * Import product from URL (uses Firecrawl via Gateway)
   */
  async importFromUrl(url, options = {}) {
    return this.gateway('SCRAPE_URL', {
      url,
      includeReviews: options.includeReviews || false,
      includeVideos: options.includeVideos !== false,
      includeVariants: options.includeVariants !== false,
      targetStores: options.targetStores || []
    }, { url });
  },
  
  /**
   * Import product data directly (already extracted)
   */
  async importProduct(product, options = {}) {
    return this.gateway('IMPORT_PRODUCT', {
      product,
      options: {
        targetStore: options.targetStore,
        status: options.status || 'draft',
        applyRules: options.applyRules !== false
      }
    }, { url: product.url, platform: product.platform });
  },
  
  /**
   * Bulk import products
   */
  async bulkImport(products, options = {}) {
    return this.gateway('IMPORT_BULK', {
      products,
      options: {
        skipDuplicates: options.skipDuplicates !== false,
        enrichWithAI: options.enrichWithAI || false,
        targetStores: options.targetStores || []
      }
    });
  },
  
  // ============================================
  // AI OPTIMIZATION APIs (via Gateway)
  // ============================================
  
  /**
   * Optimize product title with AI
   */
  async optimizeTitle(product, options = {}) {
    return this.gateway('AI_OPTIMIZE_TITLE', {
      product: {
        title: product.title,
        category: product.category,
        price: product.price,
        platform: product.platform
      },
      language: options.language || 'fr',
      targetMarket: options.targetMarket || 'France'
    });
  },
  
  /**
   * Optimize product description with AI
   */
  async optimizeDescription(product, options = {}) {
    return this.gateway('AI_OPTIMIZE_DESCRIPTION', {
      product: {
        title: product.title,
        description: product.description,
        price: product.price,
        category: product.category
      },
      language: options.language || 'fr'
    });
  },
  
  /**
   * Full AI optimization (title + description + SEO + tags)
   */
  async optimizeFull(product, options = {}) {
    return this.gateway('AI_OPTIMIZE_FULL', {
      product: {
        title: product.title,
        description: product.description,
        price: product.price,
        category: product.category,
        platform: product.platform
      },
      language: options.language || 'fr',
      targetMarket: options.targetMarket || 'France'
    });
  },
  
  /**
   * Generate SEO metadata
   */
  async generateSEO(product, options = {}) {
    return this.gateway('AI_GENERATE_SEO', {
      product: { title: product.title, description: product.description },
      language: options.language || 'fr'
    });
  },
  
  /**
   * Generate product tags
   */
  async generateTags(product, options = {}) {
    return this.gateway('AI_GENERATE_TAGS', {
      product: { title: product.title, category: product.category },
      language: options.language || 'fr'
    });
  },
  
  // ============================================
  // SYNC APIs (via Gateway)
  // ============================================
  
  /**
   * Sync stock levels
   */
  async syncStock(productIds) {
    return this.gateway('SYNC_STOCK', { productIds });
  },
  
  /**
   * Sync prices
   */
  async syncPrice(productIds) {
    return this.gateway('SYNC_PRICE', { productIds });
  },
  
  // ============================================
  // UTILITY APIs (via Gateway)
  // ============================================
  
  /**
   * Check for extension updates
   */
  async checkVersion() {
    return this.gateway('CHECK_VERSION');
  },
  
  /**
   * Get user settings for extension
   */
  async getSettings() {
    return this.gateway('GET_SETTINGS');
  },
  
  /**
   * Log analytics event
   */
  async logAnalytics(eventType, eventData, sourceUrl = null) {
    return this.gateway('LOG_ANALYTICS', {
      eventType,
      eventData,
      url: sourceUrl
    });
  },
  
  // ============================================
  // LEGACY METHODS (kept for backward compatibility)
  // Route through gateway where possible
  // ============================================
  
  /**
   * Import reviews for a product
   * @deprecated Use extension-gateway when reviews action is implemented
   */
  async importReviews(productId, reviews, options = {}) {
    console.warn('[ShopOptiAPI] importReviews uses legacy endpoint');
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
  
  /**
   * Get sync status
   * @deprecated Use CHECK_VERSION via gateway
   */
  async getSyncStatus() {
    console.warn('[ShopOptiAPI] getSyncStatus uses legacy endpoint');
    return this.request('extension-sync-realtime', {
      body: { action: 'sync_status' }
    });
  },
  
  /**
   * Sync products to stores
   * @deprecated Use SYNC_STOCK via gateway
   */
  async syncToStores(productIds, storeIds) {
    console.warn('[ShopOptiAPI] syncToStores uses legacy endpoint');
    return this.request('extension-sync-realtime', {
      body: {
        action: 'sync_products',
        productIds,
        storeIds
      }
    });
  },
  
  /**
   * Get user's connected stores
   * @deprecated Use GET_SETTINGS via gateway
   */
  async getStores() {
    console.warn('[ShopOptiAPI] getStores uses legacy endpoint');
    return this.request('list-user-stores', {
      body: { action: 'list' }
    });
  },
  
  /**
   * Add product to price monitoring
   * @deprecated Use extension-gateway when monitoring action is implemented
   */
  async addToMonitoring(productData) {
    console.warn('[ShopOptiAPI] addToMonitoring uses legacy endpoint');
    return this.request('price-monitor', {
      body: {
        action: 'add',
        product: productData
      }
    });
  },
  
  /**
   * Get monitoring status
   * @deprecated Use extension-gateway when monitoring action is implemented
   */
  async getMonitoringStatus() {
    console.warn('[ShopOptiAPI] getMonitoringStatus uses legacy endpoint');
    return this.request('price-monitor', {
      body: { action: 'status' }
    });
  },
  
  /**
   * Search viral ads
   * @deprecated Use extension-gateway when ads action is implemented
   */
  async searchAds(platform, query, options = {}) {
    console.warn('[ShopOptiAPI] searchAds uses legacy endpoint');
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
   * @deprecated Use extension-gateway when ads action is implemented
   */
  async getTrendingProducts(platform, limit = 20) {
    console.warn('[ShopOptiAPI] getTrendingProducts uses legacy endpoint');
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
