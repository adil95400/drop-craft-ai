// ============================================
// ShopOpti+ Import Queue Manager v5.0
// Robust queue with retry, throttling, progress
// ============================================

const ShopOptiImportQueue = {
  VERSION: '5.0.0',
  
  // ============================================
  // CONFIGURATION
  // ============================================
  CONFIG: {
    MAX_CONCURRENT: 3,           // Max parallel imports
    BATCH_SIZE: 10,              // Products per batch
    THROTTLE_DELAY: 200,         // ms between batches
    RETRY_ATTEMPTS: 3,           // Max retries per product
    RETRY_DELAY: 1000,           // ms between retries
    MAX_QUEUE_SIZE: 100,         // Max products in queue
    API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1'
  },

  // ============================================
  // STATE
  // ============================================
  queue: [],
  processing: false,
  paused: false,
  cancelled: false,
  
  stats: {
    total: 0,
    completed: 0,
    successful: 0,
    failed: 0,
    pending: 0,
    retrying: 0
  },
  
  currentBatch: [],
  listeners: new Set(),
  
  // ============================================
  // PUBLIC API
  // ============================================
  
  /**
   * Add products to the import queue
   * @param {Array} products - Products to import
   * @param {Object} options - Import options
   * @returns {Object} Queue status
   */
  add(products, options = {}) {
    if (!Array.isArray(products)) {
      products = [products];
    }
    
    // Enforce queue limit
    const availableSlots = this.CONFIG.MAX_QUEUE_SIZE - this.queue.length;
    if (availableSlots <= 0) {
      return { 
        success: false, 
        error: `Queue pleine (max ${this.CONFIG.MAX_QUEUE_SIZE} produits)`,
        queued: 0
      };
    }
    
    const toAdd = products.slice(0, availableSlots);
    
    toAdd.forEach((product, index) => {
      this.queue.push({
        id: `import_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`,
        product,
        options,
        status: 'pending',
        attempts: 0,
        error: null,
        addedAt: Date.now()
      });
    });
    
    this.stats.total += toAdd.length;
    this.stats.pending += toAdd.length;
    
    this.emit('queue:updated', this.getStatus());
    
    return {
      success: true,
      queued: toAdd.length,
      dropped: products.length - toAdd.length,
      total: this.queue.length
    };
  },
  
  /**
   * Start processing the queue
   * @param {string} token - Auth token
   * @param {Array} stores - Target stores
   * @returns {Promise} Resolves when queue is empty
   */
  async start(token, stores = []) {
    if (this.processing) {
      console.warn('[ImportQueue] Already processing');
      return this.getStatus();
    }
    
    if (this.queue.length === 0) {
      return { success: false, error: 'Queue vide' };
    }
    
    this.processing = true;
    this.paused = false;
    this.cancelled = false;
    this.token = token;
    this.stores = stores;
    
    this.emit('queue:started', this.getStatus());
    
    try {
      await this.processQueue();
      this.emit('queue:completed', this.getStatus());
    } catch (error) {
      console.error('[ImportQueue] Processing error:', error);
      this.emit('queue:error', { error: error.message, status: this.getStatus() });
    } finally {
      this.processing = false;
    }
    
    return this.getStatus();
  },
  
  /**
   * Pause queue processing
   */
  pause() {
    this.paused = true;
    this.emit('queue:paused', this.getStatus());
  },
  
  /**
   * Resume queue processing
   */
  resume() {
    if (!this.processing) {
      console.warn('[ImportQueue] Not processing, use start() instead');
      return;
    }
    this.paused = false;
    this.emit('queue:resumed', this.getStatus());
  },
  
  /**
   * Cancel all pending imports
   */
  cancel() {
    this.cancelled = true;
    this.queue = this.queue.filter(item => item.status !== 'pending');
    this.stats.pending = 0;
    this.emit('queue:cancelled', this.getStatus());
  },
  
  /**
   * Clear the entire queue
   */
  clear() {
    this.queue = [];
    this.resetStats();
    this.emit('queue:cleared', this.getStatus());
  },
  
  /**
   * Get current queue status
   */
  getStatus() {
    return {
      processing: this.processing,
      paused: this.paused,
      cancelled: this.cancelled,
      stats: { ...this.stats },
      queueLength: this.queue.length,
      currentBatch: this.currentBatch.length,
      progress: this.stats.total > 0 
        ? Math.round((this.stats.completed / this.stats.total) * 100) 
        : 0
    };
  },
  
  // ============================================
  // INTERNAL PROCESSING
  // ============================================
  
  async processQueue() {
    while (this.queue.length > 0 && !this.cancelled) {
      // Wait if paused
      if (this.paused) {
        await this.sleep(500);
        continue;
      }
      
      // Get next batch
      const pendingItems = this.queue.filter(item => 
        item.status === 'pending' || item.status === 'retry'
      );
      
      if (pendingItems.length === 0) break;
      
      // Take batch
      this.currentBatch = pendingItems.slice(0, this.CONFIG.BATCH_SIZE);
      
      // Process batch in parallel (limited concurrency)
      const chunks = this.chunkArray(this.currentBatch, this.CONFIG.MAX_CONCURRENT);
      
      for (const chunk of chunks) {
        if (this.cancelled) break;
        
        await Promise.all(chunk.map(item => this.processItem(item)));
        
        // Throttle between chunks
        await this.sleep(this.CONFIG.THROTTLE_DELAY);
      }
      
      this.currentBatch = [];
      this.emit('batch:completed', this.getStatus());
    }
  },
  
  async processItem(item) {
    item.status = 'processing';
    item.attempts++;
    
    this.emit('item:processing', { item, status: this.getStatus() });
    
    try {
      const result = await this.importProduct(item.product, item.options);
      
      if (result.success) {
        item.status = 'completed';
        item.result = result;
        this.stats.successful++;
        this.stats.completed++;
        this.stats.pending--;
        
        this.emit('item:success', { item, result, status: this.getStatus() });
      } else {
        throw new Error(result.error || 'Import failed');
      }
    } catch (error) {
      console.error('[ImportQueue] Item error:', error);
      
      if (item.attempts < this.CONFIG.RETRY_ATTEMPTS) {
        // Schedule retry
        item.status = 'retry';
        item.error = error.message;
        this.stats.retrying++;
        
        this.emit('item:retry', { item, error: error.message, status: this.getStatus() });
        
        await this.sleep(this.CONFIG.RETRY_DELAY * item.attempts);
      } else {
        // Max retries reached
        item.status = 'failed';
        item.error = error.message;
        this.stats.failed++;
        this.stats.completed++;
        this.stats.pending--;
        
        this.emit('item:failed', { item, error: error.message, status: this.getStatus() });
      }
    }
    
    // Remove completed/failed items from queue
    if (item.status === 'completed' || item.status === 'failed') {
      const index = this.queue.findIndex(q => q.id === item.id);
      if (index > -1) {
        this.queue.splice(index, 1);
      }
    }
  },
  
  async importProduct(product, options = {}) {
    const stores = this.stores.length > 0 ? this.stores : [{ id: 'default' }];
    const results = { success: true, storeResults: [] };
    
    // Import to each selected store
    for (const store of stores) {
      try {
        const payload = {
          action: 'import_products',
          products: [this.normalizeProduct(product)],
          store_id: store.id,
          store_platform: store.platform,
          options: {
            auto_optimize: options.auto_optimize || false,
            auto_publish: options.auto_publish || false,
            apply_pricing_rules: options.apply_pricing_rules || false,
            pricing_rules: options.pricing_rules || null
          }
        };
        
        const response = await this.fetchWithRetry(
          `${this.CONFIG.API_URL}/extension-sync-realtime`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-extension-token': this.token
            },
            body: JSON.stringify(payload)
          }
        );
        
        const data = await response.json();
        
        results.storeResults.push({
          store,
          success: response.ok && (data.imported > 0 || data.success),
          data
        });
        
        if (!response.ok) {
          results.success = false;
        }
      } catch (error) {
        results.storeResults.push({
          store,
          success: false,
          error: error.message
        });
        results.success = false;
      }
    }
    
    // Consider success if at least one store succeeded
    results.success = results.storeResults.some(r => r.success);
    
    return results;
  },
  
  normalizeProduct(product) {
    return {
      title: product.title || product.name || '',
      name: product.title || product.name || '',
      description: product.description || '',
      price: parseFloat(product.price) || 0,
      cost_price: parseFloat(product.costPrice || product.cost_price) || 0,
      compare_at_price: parseFloat(product.compareAtPrice || product.compare_at_price) || 0,
      sku: product.sku || '',
      barcode: product.barcode || product.gtin || '',
      image: product.image || product.imageUrl || '',
      imageUrl: product.image || product.imageUrl || '',
      images: product.images || [],
      videos: product.videos || [],
      url: product.url || product.source_url || '',
      source_url: product.url || product.source_url || '',
      source: product.source || 'chrome_extension_bulk',
      platform: product.platform || '',
      category: product.category || '',
      brand: product.brand || '',
      variants: product.variants || [],
      specifications: product.specifications || {},
      shipping: product.shipping || {},
      reviews: product.reviews || [],
      rating: product.rating || null,
      orders: product.orders || '',
      stock: product.stock || null,
      external_id: product.external_id || product.id || null
    };
  },
  
  async fetchWithRetry(url, options, retries = 2) {
    for (let i = 0; i <= retries; i++) {
      try {
        const response = await fetch(url, options);
        return response;
      } catch (error) {
        if (i === retries) throw error;
        await this.sleep(500 * (i + 1));
      }
    }
  },
  
  // ============================================
  // EVENT SYSTEM
  // ============================================
  
  on(event, callback) {
    this.listeners.add({ event, callback });
    return () => this.off(event, callback);
  },
  
  off(event, callback) {
    this.listeners.forEach(listener => {
      if (listener.event === event && listener.callback === callback) {
        this.listeners.delete(listener);
      }
    });
  },
  
  emit(event, data) {
    this.listeners.forEach(listener => {
      if (listener.event === event) {
        try {
          listener.callback(data);
        } catch (e) {
          console.error('[ImportQueue] Listener error:', e);
        }
      }
    });
  },
  
  // ============================================
  // UTILITIES
  // ============================================
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },
  
  resetStats() {
    this.stats = {
      total: 0,
      completed: 0,
      successful: 0,
      failed: 0,
      pending: 0,
      retrying: 0
    };
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ShopOptiImportQueue;
}
