/**
 * ShopOpti+ Bulk Import State Machine v5.7.0
 * Robust state management with local persistence
 * Ensures 100% reliability for bulk imports
 */

(function() {
  'use strict';

  if (window.__shopoptiBulkStateMachineLoaded) return;
  window.__shopoptiBulkStateMachineLoaded = true;

  /**
   * State definitions
   */
  const STATES = {
    IDLE: 'idle',
    LOADING: 'loading',
    READY: 'ready',
    PROCESSING: 'processing',
    PAUSED: 'paused',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
  };

  /**
   * Valid state transitions
   */
  const TRANSITIONS = {
    [STATES.IDLE]: [STATES.LOADING, STATES.READY],
    [STATES.LOADING]: [STATES.READY, STATES.FAILED],
    [STATES.READY]: [STATES.PROCESSING, STATES.CANCELLED],
    [STATES.PROCESSING]: [STATES.PAUSED, STATES.COMPLETED, STATES.FAILED, STATES.CANCELLED],
    [STATES.PAUSED]: [STATES.PROCESSING, STATES.CANCELLED],
    [STATES.COMPLETED]: [STATES.IDLE],
    [STATES.FAILED]: [STATES.IDLE, STATES.READY],
    [STATES.CANCELLED]: [STATES.IDLE]
  };

  /**
   * Item states
   */
  const ITEM_STATES = {
    PENDING: 'pending',
    EXTRACTING: 'extracting',
    VALIDATING: 'validating',
    IMPORTING: 'importing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    SKIPPED: 'skipped',
    RETRYING: 'retrying'
  };

  /**
   * Storage key for persistence
   */
  const STORAGE_KEY = 'shopopti_bulk_import_state';

  /**
   * BulkImportStateMachine class
   */
  class BulkImportStateMachine {
    constructor() {
      this.version = '5.7.0';
      this.state = STATES.IDLE;
      this.items = [];
      this.results = this.createEmptyResults();
      this.config = {
        concurrency: 2,
        maxRetries: 3,
        retryDelayMs: 2000,
        delayBetweenItemsMs: 500,
        autoSaveInterval: 5000,
        persistToStorage: true
      };
      this.listeners = new Map();
      this.activeOperations = new Set();
      this.abortController = null;
      this.autoSaveTimer = null;

      // Try to restore from storage
      this.restoreFromStorage();
    }

    /**
     * Create empty results object
     */
    createEmptyResults() {
      return {
        total: 0,
        completed: 0,
        failed: 0,
        skipped: 0,
        successRate: 0,
        startedAt: null,
        completedAt: null,
        duration: 0,
        products: [],
        errors: []
      };
    }

    /**
     * Validate state transition
     */
    canTransitionTo(newState) {
      const allowedTransitions = TRANSITIONS[this.state] || [];
      return allowedTransitions.includes(newState);
    }

    /**
     * Transition to new state
     */
    transitionTo(newState, metadata = {}) {
      if (!this.canTransitionTo(newState)) {
        console.warn(`[BulkStateMachine] Invalid transition: ${this.state} -> ${newState}`);
        return false;
      }

      const previousState = this.state;
      this.state = newState;

      console.log(`[BulkStateMachine] State: ${previousState} -> ${newState}`);
      
      this.emit('state_change', {
        previous: previousState,
        current: newState,
        metadata
      });

      // Auto-save on significant state changes
      if (this.config.persistToStorage) {
        this.saveToStorage();
      }

      return true;
    }

    /**
     * Add URLs to import queue
     */
    addItems(urls) {
      if (!Array.isArray(urls)) urls = [urls];
      
      const now = new Date().toISOString();
      const newItems = urls
        .map(url => url?.trim())
        .filter(url => url && url.startsWith('http'))
        .filter(url => !this.items.some(item => item.url === url)) // Prevent duplicates
        .map((url, index) => ({
          id: `item_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
          url,
          state: ITEM_STATES.PENDING,
          attempts: 0,
          maxAttempts: this.config.maxRetries,
          createdAt: now,
          updatedAt: now,
          error: null,
          result: null,
          qualityScore: null,
          extractionTime: null
        }));

      this.items.push(...newItems);
      this.results.total = this.items.length;

      this.emit('items_added', {
        count: newItems.length,
        total: this.items.length,
        items: newItems
      });

      if (this.state === STATES.IDLE && this.items.length > 0) {
        this.transitionTo(STATES.READY);
      }

      return newItems;
    }

    /**
     * Remove item from queue
     */
    removeItem(itemId) {
      const index = this.items.findIndex(item => item.id === itemId);
      if (index === -1) return false;

      const item = this.items[index];
      if (item.state === ITEM_STATES.EXTRACTING || item.state === ITEM_STATES.IMPORTING) {
        console.warn('[BulkStateMachine] Cannot remove item in progress');
        return false;
      }

      this.items.splice(index, 1);
      this.results.total = this.items.length;
      
      this.emit('item_removed', { itemId, remaining: this.items.length });
      return true;
    }

    /**
     * Clear all items
     */
    clearItems() {
      if (this.state === STATES.PROCESSING) {
        console.warn('[BulkStateMachine] Cannot clear while processing');
        return false;
      }

      const count = this.items.length;
      this.items = [];
      this.results = this.createEmptyResults();
      
      this.emit('items_cleared', { cleared: count });
      this.transitionTo(STATES.IDLE);
      return true;
    }

    /**
     * Start processing
     */
    async start(options = {}) {
      if (this.state !== STATES.READY && this.state !== STATES.PAUSED) {
        console.warn(`[BulkStateMachine] Cannot start from state: ${this.state}`);
        return false;
      }

      Object.assign(this.config, options);
      this.abortController = new AbortController();
      this.results.startedAt = new Date().toISOString();
      
      this.transitionTo(STATES.PROCESSING);
      this.startAutoSave();

      try {
        await this.processQueue();
      } catch (error) {
        console.error('[BulkStateMachine] Processing error:', error);
        if (this.state === STATES.PROCESSING) {
          this.transitionTo(STATES.FAILED, { error: error.message });
        }
      }

      this.stopAutoSave();
      return true;
    }

    /**
     * Process the queue
     */
    async processQueue() {
      while (this.state === STATES.PROCESSING) {
        const pendingItems = this.items.filter(item => 
          item.state === ITEM_STATES.PENDING || item.state === ITEM_STATES.RETRYING
        );

        if (pendingItems.length === 0) {
          break;
        }

        // Process batch
        const batch = pendingItems.slice(0, this.config.concurrency);
        const promises = batch.map(item => this.processItem(item));

        await Promise.allSettled(promises);

        // Small delay between batches
        if (this.state === STATES.PROCESSING && pendingItems.length > batch.length) {
          await this.sleep(this.config.delayBetweenItemsMs);
        }
      }

      // Final state determination
      if (this.state === STATES.PROCESSING) {
        this.results.completedAt = new Date().toISOString();
        this.results.duration = new Date(this.results.completedAt) - new Date(this.results.startedAt);
        this.results.successRate = this.results.total > 0 
          ? Math.round((this.results.completed / this.results.total) * 100)
          : 0;

        this.transitionTo(STATES.COMPLETED);
        this.emit('completed', this.getReport());
      }
    }

    /**
     * Process single item
     */
    async processItem(item) {
      const startTime = Date.now();
      item.attempts++;
      item.state = ITEM_STATES.EXTRACTING;
      item.updatedAt = new Date().toISOString();

      this.emit('item_start', { item, progress: this.getProgress() });

      try {
        // Check abort signal
        if (this.abortController?.signal?.aborted) {
          throw new Error('Operation cancelled');
        }

        // Step 1: Extract
        let extractedData;
        if (window.ShopOptiPipeline) {
          const result = await window.ShopOptiPipeline.processUrl(item.url, {
            skipConfirmation: true,
            signal: this.abortController?.signal
          });
          if (!result.success) throw new Error(result.error || 'Extraction failed');
          extractedData = result.product;
        } else if (window.ShopOptiAPI) {
          extractedData = await window.ShopOptiAPI.importFromUrl(item.url);
        } else {
          throw new Error('No import API available');
        }

        // Step 2: Validate
        item.state = ITEM_STATES.VALIDATING;
        if (window.ShopOptiQualityScorer) {
          const scoreReport = window.ShopOptiQualityScorer.calculate(extractedData, extractedData.platform);
          item.qualityScore = scoreReport.score;
          
          if (!scoreReport.canImport) {
            throw new Error(`Quality score too low: ${scoreReport.score}%`);
          }
        }

        // Step 3: Import
        item.state = ITEM_STATES.IMPORTING;
        // Import is handled by the pipeline

        // Success
        item.state = ITEM_STATES.COMPLETED;
        item.result = extractedData;
        item.extractionTime = Date.now() - startTime;
        item.updatedAt = new Date().toISOString();

        this.results.completed++;
        this.results.products.push({
          url: item.url,
          product: extractedData,
          qualityScore: item.qualityScore,
          extractionTime: item.extractionTime
        });

      } catch (error) {
        item.error = error.message;
        item.extractionTime = Date.now() - startTime;
        item.updatedAt = new Date().toISOString();

        // Retry logic
        if (item.attempts < item.maxAttempts && !error.message.includes('cancelled')) {
          item.state = ITEM_STATES.RETRYING;
          console.log(`[BulkStateMachine] Will retry ${item.url} (${item.attempts}/${item.maxAttempts})`);
          
          // Exponential backoff
          await this.sleep(this.config.retryDelayMs * item.attempts);
        } else {
          item.state = ITEM_STATES.FAILED;
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
     * Pause processing
     */
    pause() {
      if (this.state !== STATES.PROCESSING) return false;
      
      this.transitionTo(STATES.PAUSED);
      this.stopAutoSave();
      return true;
    }

    /**
     * Resume processing
     */
    resume() {
      if (this.state !== STATES.PAUSED) return false;
      return this.start();
    }

    /**
     * Cancel processing
     */
    cancel() {
      if (this.state !== STATES.PROCESSING && this.state !== STATES.PAUSED) return false;

      this.abortController?.abort();
      this.stopAutoSave();
      
      // Mark in-progress items as skipped
      this.items.forEach(item => {
        if (item.state === ITEM_STATES.EXTRACTING || 
            item.state === ITEM_STATES.VALIDATING || 
            item.state === ITEM_STATES.IMPORTING) {
          item.state = ITEM_STATES.SKIPPED;
          item.error = 'Cancelled by user';
          this.results.skipped++;
        }
      });

      this.transitionTo(STATES.CANCELLED);
      return true;
    }

    /**
     * Reset to initial state
     */
    reset() {
      this.cancel();
      this.items = [];
      this.results = this.createEmptyResults();
      this.transitionTo(STATES.IDLE);
      this.clearStorage();
      
      this.emit('reset', {});
    }

    /**
     * Get current progress
     */
    getProgress() {
      const processed = this.results.completed + this.results.failed + this.results.skipped;
      const pending = this.items.filter(i => i.state === ITEM_STATES.PENDING || i.state === ITEM_STATES.RETRYING).length;
      const inProgress = this.items.filter(i => 
        [ITEM_STATES.EXTRACTING, ITEM_STATES.VALIDATING, ITEM_STATES.IMPORTING].includes(i.state)
      ).length;

      return {
        state: this.state,
        processed,
        total: this.results.total,
        percentage: this.results.total > 0 ? Math.round((processed / this.results.total) * 100) : 0,
        completed: this.results.completed,
        failed: this.results.failed,
        skipped: this.results.skipped,
        pending,
        inProgress,
        successRate: this.results.total > 0 
          ? Math.round((this.results.completed / Math.max(1, processed)) * 100)
          : 0
      };
    }

    /**
     * Get detailed report
     */
    getReport() {
      return {
        version: this.version,
        state: this.state,
        config: { ...this.config, persistToStorage: undefined },
        progress: this.getProgress(),
        results: this.results,
        items: this.items.map(item => ({
          id: item.id,
          url: item.url,
          state: item.state,
          attempts: item.attempts,
          qualityScore: item.qualityScore,
          extractionTime: item.extractionTime,
          error: item.error
        }))
      };
    }

    /**
     * Get item by ID
     */
    getItem(itemId) {
      return this.items.find(item => item.id === itemId);
    }

    /**
     * Update item state manually
     */
    skipItem(itemId, reason = 'Skipped by user') {
      const item = this.getItem(itemId);
      if (!item || item.state === ITEM_STATES.COMPLETED) return false;

      item.state = ITEM_STATES.SKIPPED;
      item.error = reason;
      item.updatedAt = new Date().toISOString();
      this.results.skipped++;

      this.emit('item_skipped', { item });
      return true;
    }

    // ==================== Persistence ====================

    /**
     * Save state to local storage
     */
    saveToStorage() {
      if (!this.config.persistToStorage) return;

      try {
        const data = {
          version: this.version,
          savedAt: new Date().toISOString(),
          state: this.state,
          items: this.items,
          results: this.results,
          config: this.config
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        console.log('[BulkStateMachine] State saved to storage');
      } catch (error) {
        console.warn('[BulkStateMachine] Failed to save to storage:', error);
      }
    }

    /**
     * Restore state from local storage
     */
    restoreFromStorage() {
      if (!this.config.persistToStorage) return false;

      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return false;

        const data = JSON.parse(stored);
        
        // Check if data is still relevant (less than 24h old)
        const savedAt = new Date(data.savedAt);
        const hoursSinceLastSave = (Date.now() - savedAt) / (1000 * 60 * 60);
        
        if (hoursSinceLastSave > 24) {
          console.log('[BulkStateMachine] Stored state expired, clearing');
          this.clearStorage();
          return false;
        }

        // Only restore if there was incomplete work
        if (data.state === STATES.PROCESSING || data.state === STATES.PAUSED) {
          this.items = data.items || [];
          this.results = data.results || this.createEmptyResults();
          Object.assign(this.config, data.config || {});
          
          // Reset in-progress items to pending
          this.items.forEach(item => {
            if ([ITEM_STATES.EXTRACTING, ITEM_STATES.VALIDATING, ITEM_STATES.IMPORTING].includes(item.state)) {
              item.state = ITEM_STATES.PENDING;
            }
          });

          this.state = STATES.PAUSED; // Resume from paused state
          
          console.log(`[BulkStateMachine] Restored ${this.items.length} items from storage`);
          this.emit('restored', { items: this.items.length });
          return true;
        }
      } catch (error) {
        console.warn('[BulkStateMachine] Failed to restore from storage:', error);
        this.clearStorage();
      }

      return false;
    }

    /**
     * Clear storage
     */
    clearStorage() {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.warn('[BulkStateMachine] Failed to clear storage:', error);
      }
    }

    /**
     * Start auto-save timer
     */
    startAutoSave() {
      if (this.autoSaveTimer) return;
      
      this.autoSaveTimer = setInterval(() => {
        if (this.state === STATES.PROCESSING) {
          this.saveToStorage();
        }
      }, this.config.autoSaveInterval);
    }

    /**
     * Stop auto-save timer
     */
    stopAutoSave() {
      if (this.autoSaveTimer) {
        clearInterval(this.autoSaveTimer);
        this.autoSaveTimer = null;
      }
    }

    // ==================== Event System ====================

    /**
     * Subscribe to events
     */
    on(event, callback) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, new Set());
      }
      this.listeners.get(event).add(callback);
      return () => this.off(event, callback);
    }

    /**
     * Unsubscribe from events
     */
    off(event, callback) {
      const callbacks = this.listeners.get(event);
      if (callbacks) callbacks.delete(callback);
    }

    /**
     * Emit event
     */
    emit(event, data) {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error(`[BulkStateMachine] Event handler error for ${event}:`, error);
          }
        });
      }
    }

    // ==================== Utility ====================

    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  }

  // Singleton instance
  const stateMachine = new BulkImportStateMachine();

  // Export
  if (typeof window !== 'undefined') {
    window.ShopOptiBulkStateMachine = stateMachine;
    window.BulkImportStateMachine = BulkImportStateMachine;
    window.BULK_IMPORT_STATES = STATES;
    window.BULK_IMPORT_ITEM_STATES = ITEM_STATES;
  }

  console.log('[ShopOpti+] BulkImportStateMachine v5.7.0 loaded');

})();
