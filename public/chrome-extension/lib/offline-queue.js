// ============================================================================
// SHOPOPTI+ - OFFLINE QUEUE v1.0.0
// Offline-first import queue with automatic sync when connection restored
// ============================================================================

;(function() {
  'use strict';

  const STORAGE_KEY = 'shopopti_offline_queue';
  const SYNC_INTERVAL = 30000; // 30 seconds
  const MAX_RETRIES = 5;
  const RETRY_DELAYS = [1000, 5000, 15000, 60000, 300000]; // Progressive backoff

  /**
   * OfflineQueue - Manages offline product imports with auto-sync
   */
  class OfflineQueue {
    constructor() {
      this.queue = [];
      this.isOnline = navigator.onLine;
      this.isSyncing = false;
      this.syncTimer = null;
      this.listeners = new Set();

      this.init();
    }

    /**
     * Initialize queue and event listeners
     */
    async init() {
      // Load persisted queue
      await this.loadQueue();

      // Network status listeners
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());

      // Start sync loop
      this.startSyncLoop();

      console.log(`[ShopOpti+ Offline] Queue initialized with ${this.queue.length} pending items`);
    }

    /**
     * Load queue from storage
     */
    async loadQueue() {
      try {
        const result = await new Promise((resolve) => {
          if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get([STORAGE_KEY], resolve);
          } else {
            resolve({ [STORAGE_KEY]: localStorage.getItem(STORAGE_KEY) });
          }
        });

        const stored = result[STORAGE_KEY];
        this.queue = stored ? (typeof stored === 'string' ? JSON.parse(stored) : stored) : [];
      } catch (e) {
        console.error('[ShopOpti+ Offline] Failed to load queue:', e);
        this.queue = [];
      }
    }

    /**
     * Save queue to storage
     */
    async saveQueue() {
      try {
        const data = JSON.stringify(this.queue);
        if (typeof chrome !== 'undefined' && chrome.storage) {
          await chrome.storage.local.set({ [STORAGE_KEY]: this.queue });
        } else {
          localStorage.setItem(STORAGE_KEY, data);
        }
      } catch (e) {
        console.error('[ShopOpti+ Offline] Failed to save queue:', e);
      }
    }

    /**
     * Add item to queue
     * @param {Object} item - Product data to import
     * @param {Object} options - Import options
     * @returns {string} Queue item ID
     */
    async add(item, options = {}) {
      const queueItem = {
        id: this.generateId(),
        product: item,
        options,
        status: 'pending',
        retries: 0,
        createdAt: Date.now(),
        lastAttempt: null,
        error: null
      };

      this.queue.push(queueItem);
      await this.saveQueue();
      this.emit('added', queueItem);

      console.log(`[ShopOpti+ Offline] Added to queue: ${item.title?.substring(0, 30)}...`);

      // Attempt immediate sync if online
      if (this.isOnline && !this.isSyncing) {
        this.sync();
      }

      return queueItem.id;
    }

    /**
     * Add multiple items
     * @param {Array} items
     * @param {Object} options
     * @returns {Array<string>} Queue item IDs
     */
    async addBulk(items, options = {}) {
      const ids = [];
      for (const item of items) {
        const id = await this.add(item, options);
        ids.push(id);
      }
      return ids;
    }

    /**
     * Remove item from queue
     * @param {string} id
     */
    async remove(id) {
      const index = this.queue.findIndex(item => item.id === id);
      if (index > -1) {
        const removed = this.queue.splice(index, 1)[0];
        await this.saveQueue();
        this.emit('removed', removed);
      }
    }

    /**
     * Get queue status
     * @returns {Object}
     */
    getStatus() {
      const pending = this.queue.filter(i => i.status === 'pending').length;
      const failed = this.queue.filter(i => i.status === 'failed').length;
      const processing = this.queue.filter(i => i.status === 'processing').length;

      return {
        isOnline: this.isOnline,
        isSyncing: this.isSyncing,
        total: this.queue.length,
        pending,
        failed,
        processing,
        canSync: this.isOnline && pending > 0
      };
    }

    /**
     * Handle coming online
     */
    handleOnline() {
      this.isOnline = true;
      this.emit('online');
      console.log('[ShopOpti+ Offline] Connection restored - syncing...');
      this.sync();
    }

    /**
     * Handle going offline
     */
    handleOffline() {
      this.isOnline = false;
      this.emit('offline');
      console.log('[ShopOpti+ Offline] Connection lost - queuing imports');
    }

    /**
     * Start sync loop
     */
    startSyncLoop() {
      if (this.syncTimer) clearInterval(this.syncTimer);
      
      this.syncTimer = setInterval(() => {
        if (this.isOnline && !this.isSyncing && this.getPendingCount() > 0) {
          this.sync();
        }
      }, SYNC_INTERVAL);
    }

    /**
     * Get pending items count
     */
    getPendingCount() {
      return this.queue.filter(i => i.status === 'pending' || i.status === 'retrying').length;
    }

    /**
     * Sync queue with server
     */
    async sync() {
      if (this.isSyncing || !this.isOnline) return;

      const pendingItems = this.queue.filter(i => 
        i.status === 'pending' || i.status === 'retrying'
      );

      if (pendingItems.length === 0) return;

      this.isSyncing = true;
      this.emit('syncStart', { count: pendingItems.length });
      console.log(`[ShopOpti+ Offline] Starting sync of ${pendingItems.length} items...`);

      let successCount = 0;
      let failCount = 0;

      for (const item of pendingItems) {
        try {
          item.status = 'processing';
          item.lastAttempt = Date.now();
          await this.saveQueue();

          const result = await this.sendToServer(item);

          if (result.success) {
            // Remove from queue on success
            await this.remove(item.id);
            successCount++;
            this.emit('synced', { item, result });
          } else {
            throw new Error(result.error || 'Import failed');
          }
        } catch (error) {
          item.retries++;
          item.error = error.message;

          if (item.retries >= MAX_RETRIES) {
            item.status = 'failed';
            failCount++;
            this.emit('failed', { item, error });
          } else {
            item.status = 'retrying';
            // Schedule retry with exponential backoff
            const delay = RETRY_DELAYS[Math.min(item.retries - 1, RETRY_DELAYS.length - 1)];
            setTimeout(() => {
              if (this.isOnline) this.sync();
            }, delay);
          }
          
          await this.saveQueue();
        }
      }

      this.isSyncing = false;
      this.emit('syncComplete', { success: successCount, failed: failCount });
      console.log(`[ShopOpti+ Offline] Sync complete: ${successCount} success, ${failCount} failed`);
    }

    /**
     * Send item to server
     * @param {Object} item
     * @returns {Promise<Object>}
     */
    async sendToServer(item) {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const apiUrl = typeof CONFIG !== 'undefined' ? CONFIG.API_URL : 
                     'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1';

      const response = await fetch(`${apiUrl}/extension-sync-realtime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': token
        },
        body: JSON.stringify({
          action: 'import_products',
          products: [item.product],
          options: item.options
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return { success: true, ...result };
    }

    /**
     * Get auth token
     */
    async getToken() {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.get(['extensionToken'], (result) => {
            resolve(result.extensionToken);
          });
        } else {
          resolve(localStorage.getItem('extension_token'));
        }
      });
    }

    /**
     * Retry failed items
     */
    async retryFailed() {
      const failedItems = this.queue.filter(i => i.status === 'failed');
      
      for (const item of failedItems) {
        item.status = 'retrying';
        item.retries = 0;
        item.error = null;
      }

      await this.saveQueue();
      
      if (this.isOnline) {
        this.sync();
      }

      return failedItems.length;
    }

    /**
     * Clear all failed items
     */
    async clearFailed() {
      const beforeCount = this.queue.length;
      this.queue = this.queue.filter(i => i.status !== 'failed');
      await this.saveQueue();
      return beforeCount - this.queue.length;
    }

    /**
     * Clear entire queue
     */
    async clearAll() {
      const count = this.queue.length;
      this.queue = [];
      await this.saveQueue();
      this.emit('cleared');
      return count;
    }

    /**
     * Generate unique ID
     */
    generateId() {
      return `oq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Add event listener
     * @param {string} event
     * @param {Function} callback
     */
    on(event, callback) {
      this.listeners.add({ event, callback });
    }

    /**
     * Remove event listener
     * @param {string} event
     * @param {Function} callback
     */
    off(event, callback) {
      this.listeners.forEach(listener => {
        if (listener.event === event && listener.callback === callback) {
          this.listeners.delete(listener);
        }
      });
    }

    /**
     * Emit event
     * @param {string} event
     * @param {*} data
     */
    emit(event, data) {
      this.listeners.forEach(listener => {
        if (listener.event === event) {
          try {
            listener.callback(data);
          } catch (e) {
            console.error('[ShopOpti+ Offline] Event handler error:', e);
          }
        }
      });
    }

    /**
     * Get UI indicator element
     * @returns {HTMLElement}
     */
    createStatusIndicator() {
      const indicator = document.createElement('div');
      indicator.id = 'shopopti-offline-indicator';
      indicator.className = 'shopopti-offline-indicator';

      const updateIndicator = () => {
        const status = this.getStatus();
        
        if (!status.isOnline) {
          indicator.className = 'shopopti-offline-indicator offline';
          indicator.textContent = `📴 Hors ligne (${status.pending} en attente)`;
          indicator.style.display = 'flex';
        } else if (status.isSyncing) {
          indicator.className = 'shopopti-offline-indicator syncing';
          indicator.textContent = `🔄 Synchronisation...`;
          indicator.style.display = 'flex';
        } else if (status.pending > 0) {
          indicator.className = 'shopopti-offline-indicator pending';
          indicator.textContent = `⏳ ${status.pending} en attente`;
          indicator.style.display = 'flex';
        } else if (status.failed > 0) {
          indicator.className = 'shopopti-offline-indicator failed';
          indicator.textContent = `⚠️ ${status.failed} échoué(s)`;
          indicator.style.display = 'flex';
        } else {
          indicator.style.display = 'none';
        }
      };

      // Listen to events
      this.on('online', updateIndicator);
      this.on('offline', updateIndicator);
      this.on('added', updateIndicator);
      this.on('synced', updateIndicator);
      this.on('syncStart', updateIndicator);
      this.on('syncComplete', updateIndicator);
      this.on('failed', updateIndicator);

      // Initial state
      updateIndicator();

      return indicator;
    }
  }

  // Singleton instance
  const offlineQueue = new OfflineQueue();

  // Inject CSS for offline indicator
  const style = document.createElement('style');
  style.textContent = `
    .shopopti-offline-indicator {
      position: fixed;
      bottom: 20px;
      left: 20px;
      padding: 10px 16px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      font-weight: 500;
      z-index: 2147483647;
      display: none;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .shopopti-offline-indicator.offline {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
    }

    .shopopti-offline-indicator.syncing {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
      animation: pulse 1.5s infinite;
    }

    .shopopti-offline-indicator.pending {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
    }

    .shopopti-offline-indicator.failed {
      background: linear-gradient(135deg, #f97316, #ea580c);
      color: white;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .shopopti-offline-indicator:hover {
      transform: scale(1.05);
    }
  `;
  document.head.appendChild(style);

  // Export
  if (typeof window !== 'undefined') {
    window.ShopOptiOfflineQueue = offlineQueue;
    window.OfflineQueue = OfflineQueue;
  }

  console.log('[ShopOpti+] OfflineQueue v1.0.0 loaded');
})();
