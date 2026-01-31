// ============================================
// ShopOpti+ Storage Manager v5.7.2
// TTL-based storage with automatic cleanup
// Prevents storage bloat from caches and history
// ============================================

const ShopOptiStorage = {
  VERSION: '5.7.2',
  
  // Storage quotas (in items, not bytes)
  QUOTAS: {
    importHistory: 100,
    monitoredProducts: 50,
    cachedProducts: 200,
    notifications: 50,
    searchHistory: 30,
    adsSaves: 100
  },
  
  // TTL in milliseconds
  TTL: {
    cachedProducts: 24 * 60 * 60 * 1000,      // 24 hours
    extractionCache: 60 * 60 * 1000,           // 1 hour
    sessionData: 7 * 24 * 60 * 60 * 1000,      // 7 days
    notifications: 30 * 24 * 60 * 60 * 1000,   // 30 days
    importHistory: 90 * 24 * 60 * 60 * 1000,   // 90 days
    monitoredProducts: null                     // No expiry
  },
  
  // Last cleanup timestamp
  lastCleanup: null,
  
  // Cleanup interval (1 hour)
  CLEANUP_INTERVAL: 60 * 60 * 1000,
  
  /**
   * Initialize storage manager
   */
  async init() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await this._get(['_storageMetadata']);
      const metadata = result._storageMetadata || {};
      this.lastCleanup = metadata.lastCleanup;
      
      // Run cleanup if needed
      if (this.shouldCleanup()) {
        await this.cleanup();
      }
    }
    
    return this;
  },
  
  /**
   * Check if cleanup should run
   */
  shouldCleanup() {
    if (!this.lastCleanup) return true;
    return Date.now() - this.lastCleanup > this.CLEANUP_INTERVAL;
  },
  
  /**
   * Get item(s) from storage
   */
  async _get(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, resolve);
    });
  },
  
  /**
   * Set item(s) in storage
   */
  async _set(items) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(items, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  },
  
  /**
   * Remove item(s) from storage
   */
  async _remove(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.remove(keys, resolve);
    });
  },
  
  /**
   * Store item with TTL
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @param {number|null} ttl - TTL in ms (null = no expiry)
   */
  async set(key, value, ttl = null) {
    const item = {
      value,
      storedAt: Date.now(),
      expiresAt: ttl ? Date.now() + ttl : null
    };
    
    await this._set({ [key]: item });
  },
  
  /**
   * Get item, checking TTL
   * @param {string} key - Storage key
   * @returns {any|null}
   */
  async get(key) {
    const result = await this._get([key]);
    const item = result[key];
    
    if (!item) return null;
    
    // Check if it's a wrapped item with metadata
    if (item.storedAt !== undefined) {
      // Check expiry
      if (item.expiresAt && Date.now() > item.expiresAt) {
        await this._remove([key]);
        return null;
      }
      return item.value;
    }
    
    // Legacy item without wrapper
    return item;
  },
  
  /**
   * Add to array with quota enforcement
   * @param {string} key - Storage key for array
   * @param {any} item - Item to add
   * @param {number} maxItems - Maximum items to keep
   * @param {boolean} prepend - Add to beginning (default: true)
   */
  async addToArray(key, item, maxItems = 100, prepend = true) {
    const result = await this._get([key]);
    let arr = result[key] || [];
    
    // Unwrap if needed
    if (arr.value) arr = arr.value;
    if (!Array.isArray(arr)) arr = [];
    
    // Add timestamp if not present
    if (typeof item === 'object' && !item.timestamp) {
      item.timestamp = Date.now();
    }
    
    // Add item
    if (prepend) {
      arr.unshift(item);
    } else {
      arr.push(item);
    }
    
    // Enforce quota
    if (arr.length > maxItems) {
      arr = arr.slice(0, maxItems);
    }
    
    await this._set({ [key]: arr });
    return arr;
  },
  
  /**
   * Store in cache with TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - TTL in ms
   */
  async cache(key, value, ttl = this.TTL.extractionCache) {
    const cacheKey = `_cache_${key}`;
    await this.set(cacheKey, value, ttl);
  },
  
  /**
   * Get from cache
   * @param {string} key - Cache key
   */
  async getCache(key) {
    return this.get(`_cache_${key}`);
  },
  
  /**
   * Clear specific cache
   * @param {string} key - Cache key
   */
  async clearCache(key) {
    await this._remove([`_cache_${key}`]);
  },
  
  /**
   * Run cleanup - remove expired items and enforce quotas
   */
  async cleanup() {
    console.log('[ShopOpti+] Running storage cleanup...');
    
    const now = Date.now();
    const toRemove = [];
    
    // Get all storage
    const allData = await this._get(null);
    
    for (const [key, value] of Object.entries(allData)) {
      // Skip metadata
      if (key.startsWith('_')) continue;
      
      // Check wrapped items for expiry
      if (value && value.expiresAt && value.expiresAt < now) {
        toRemove.push(key);
        continue;
      }
      
      // Check cache items
      if (key.startsWith('_cache_') && value && value.expiresAt && value.expiresAt < now) {
        toRemove.push(key);
        continue;
      }
    }
    
    // Remove expired items
    if (toRemove.length > 0) {
      await this._remove(toRemove);
      console.log(`[ShopOpti+] Removed ${toRemove.length} expired items`);
    }
    
    // Enforce array quotas
    for (const [key, maxItems] of Object.entries(this.QUOTAS)) {
      const result = await this._get([key]);
      let arr = result[key];
      
      if (Array.isArray(arr) && arr.length > maxItems) {
        arr = arr.slice(0, maxItems);
        await this._set({ [key]: arr });
        console.log(`[ShopOpti+] Trimmed ${key} to ${maxItems} items`);
      }
    }
    
    // Update metadata
    this.lastCleanup = now;
    await this._set({
      _storageMetadata: {
        lastCleanup: now,
        version: this.VERSION
      }
    });
    
    console.log('[ShopOpti+] Storage cleanup complete');
  },
  
  /**
   * Get storage usage stats
   */
  async getStats() {
    return new Promise((resolve) => {
      chrome.storage.local.getBytesInUse(null, (bytesInUse) => {
        chrome.storage.local.get(null, (items) => {
          resolve({
            bytesUsed: bytesInUse,
            bytesFormatted: this.formatBytes(bytesInUse),
            itemCount: Object.keys(items).length,
            quotaStatus: this.QUOTAS
          });
        });
      });
    });
  },
  
  /**
   * Format bytes to human readable
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
  
  /**
   * Clear all non-essential data (keep settings & auth)
   */
  async clearCaches() {
    const allData = await this._get(null);
    const toRemove = [];
    
    const protectedKeys = [
      'extensionToken', 'userPlan', 'user', 'settings',
      'featureFlags', 'loggerSettings', '_storageMetadata'
    ];
    
    for (const key of Object.keys(allData)) {
      if (!protectedKeys.includes(key) && 
          (key.startsWith('_cache_') || 
           key === 'cachedProducts' || 
           key === 'extractionCache')) {
        toRemove.push(key);
      }
    }
    
    if (toRemove.length > 0) {
      await this._remove(toRemove);
    }
    
    return toRemove.length;
  }
};

// Auto-initialize
ShopOptiStorage.init();

// Export
if (typeof window !== 'undefined') {
  window.ShopOptiStorage = ShopOptiStorage;
  window.Storage = ShopOptiStorage;
}
