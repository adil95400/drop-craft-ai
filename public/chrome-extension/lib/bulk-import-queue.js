/**
 * ShopOpti+ Bulk Import Queue v5.7.0
 * Manages bulk import with queue, progress tracking, and summary
 */

(function() {
  'use strict';

  const QUEUE_STATES = {
    IDLE: 'idle',
    PROCESSING: 'processing',
    PAUSED: 'paused',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  };

  class BulkImportQueue {
    constructor() {
      this.queue = [];
      this.state = QUEUE_STATES.IDLE;
      this.results = {
        total: 0,
        successful: 0,
        failed: 0,
        skipped: 0,
        products: [],
        errors: []
      };
      this.config = {
        concurrency: 2,
        retryAttempts: 3,
        delayBetween: 500
      };
      this.eventListeners = {};
      this.activeProcesses = new Set();
    }

    /**
     * Add URLs to queue
     */
    addToQueue(urls) {
      if (!Array.isArray(urls)) urls = [urls];
      
      const newItems = urls.map((url, index) => ({
        id: `item_${Date.now()}_${index}`,
        url: url.trim(),
        status: 'pending',
        attempts: 0,
        addedAt: new Date().toISOString()
      }));

      this.queue.push(...newItems);
      this.results.total = this.queue.length;
      
      this.emit('queue_updated', { 
        added: newItems.length, 
        total: this.queue.length 
      });

      return newItems;
    }

    /**
     * Remove item from queue
     */
    removeFromQueue(itemId) {
      const index = this.queue.findIndex(item => item.id === itemId);
      if (index > -1) {
        this.queue.splice(index, 1);
        this.results.total = this.queue.length;
        this.emit('queue_updated', { removed: 1, total: this.queue.length });
        return true;
      }
      return false;
    }

    /**
     * Clear entire queue
     */
    clearQueue() {
      const count = this.queue.length;
      this.queue = [];
      this.results.total = 0;
      this.emit('queue_updated', { cleared: count });
    }

    /**
     * Start processing queue
     */
    async start(options = {}) {
      if (this.state === QUEUE_STATES.PROCESSING) {
        console.warn('[BulkQueue] Already processing');
        return;
      }

      Object.assign(this.config, options);
      this.state = QUEUE_STATES.PROCESSING;
      this.emit('state_change', { state: this.state });

      const pendingItems = this.queue.filter(item => item.status === 'pending');
      
      while (pendingItems.length > 0 && this.state === QUEUE_STATES.PROCESSING) {
        // Process up to concurrency limit
        const batch = [];
        
        while (batch.length < this.config.concurrency && pendingItems.length > 0) {
          const item = pendingItems.shift();
          if (item) {
            batch.push(this.processItem(item));
          }
        }

        if (batch.length > 0) {
          await Promise.all(batch);
        }

        // Small delay between batches
        if (pendingItems.length > 0 && this.state === QUEUE_STATES.PROCESSING) {
          await this.sleep(this.config.delayBetween);
        }
      }

      if (this.state === QUEUE_STATES.PROCESSING) {
        this.state = QUEUE_STATES.COMPLETED;
        this.emit('state_change', { state: this.state });
        this.emit('completed', this.getSummary());
      }
    }

    /**
     * Pause processing
     */
    pause() {
      if (this.state === QUEUE_STATES.PROCESSING) {
        this.state = QUEUE_STATES.PAUSED;
        this.emit('state_change', { state: this.state });
      }
    }

    /**
     * Resume processing
     */
    resume() {
      if (this.state === QUEUE_STATES.PAUSED) {
        this.start();
      }
    }

    /**
     * Cancel processing
     */
    cancel() {
      this.state = QUEUE_STATES.CANCELLED;
      this.emit('state_change', { state: this.state });
    }

    /**
     * Process single item
     */
    async processItem(item) {
      item.status = 'processing';
      item.attempts++;
      this.emit('item_start', { item });

      try {
        let result;

        // Use pipeline if available
        if (window.ShopOptiPipeline) {
          result = await window.ShopOptiPipeline.processUrl(item.url, {
            skipConfirmation: true
          });
        } else if (window.ShopOptiAPI) {
          result = await window.ShopOptiAPI.importFromUrl(item.url);
          result = { success: true, product: result };
        } else {
          throw new Error('No import API available');
        }

        if (result.success) {
          item.status = 'completed';
          item.result = result.product;
          this.results.successful++;
          this.results.products.push({
            url: item.url,
            product: result.product
          });
        } else {
          throw new Error(result.error || 'Import failed');
        }

      } catch (error) {
        // Retry logic
        if (item.attempts < this.config.retryAttempts) {
          item.status = 'pending';
          console.log(`[BulkQueue] Retry ${item.attempts}/${this.config.retryAttempts} for ${item.url}`);
          // Will be picked up in next batch
        } else {
          item.status = 'failed';
          item.error = error.message;
          this.results.failed++;
          this.results.errors.push({
            url: item.url,
            error: error.message,
            attempts: item.attempts
          });
        }
      }

      this.emit('item_complete', { 
        item, 
        progress: this.getProgress() 
      });

      this.emit('progress', this.getProgress());
    }

    /**
     * Get current progress
     */
    getProgress() {
      const processed = this.results.successful + this.results.failed + this.results.skipped;
      const total = this.results.total;
      
      return {
        processed,
        total,
        percentage: total > 0 ? Math.round((processed / total) * 100) : 0,
        successful: this.results.successful,
        failed: this.results.failed,
        skipped: this.results.skipped,
        pending: this.queue.filter(item => item.status === 'pending').length,
        processing: this.queue.filter(item => item.status === 'processing').length
      };
    }

    /**
     * Get final summary
     */
    getSummary() {
      return {
        state: this.state,
        total: this.results.total,
        successful: this.results.successful,
        failed: this.results.failed,
        skipped: this.results.skipped,
        successRate: this.results.total > 0 
          ? Math.round((this.results.successful / this.results.total) * 100) 
          : 0,
        products: this.results.products,
        errors: this.results.errors,
        queue: this.queue.map(item => ({
          url: item.url,
          status: item.status,
          attempts: item.attempts,
          error: item.error
        }))
      };
    }

    /**
     * Reset queue and results
     */
    reset() {
      this.queue = [];
      this.state = QUEUE_STATES.IDLE;
      this.results = {
        total: 0,
        successful: 0,
        failed: 0,
        skipped: 0,
        products: [],
        errors: []
      };
      this.emit('reset', {});
    }

    // Event system
    on(event, callback) {
      if (!this.eventListeners[event]) {
        this.eventListeners[event] = [];
      }
      this.eventListeners[event].push(callback);
    }

    off(event, callback) {
      if (this.eventListeners[event]) {
        this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
      }
    }

    emit(event, data) {
      if (this.eventListeners[event]) {
        this.eventListeners[event].forEach(callback => {
          try {
            callback(data);
          } catch (e) {
            console.error('[BulkQueue] Event handler error:', e);
          }
        });
      }
    }

    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  }

  // Singleton
  const queue = new BulkImportQueue();

  // Export
  if (typeof window !== 'undefined') {
    window.ShopOptiBulkQueue = queue;
    window.BulkImportQueue = BulkImportQueue;
  }

  console.log('[ShopOpti+] BulkImportQueue v5.7.0 loaded');
})();
