/**
 * ShopOpti+ Gateway Client v2.0
 * 
 * Unified client for ALL extension ↔ backend communication.
 * Features:
 * - Automatic header injection (X-Request-Id, X-Extension-Id, X-Extension-Version, X-Idempotency-Key)
 * - IndexedDB queue for offline/retry scenarios
 * - Exponential backoff with jitter
 * - Standardized error handling
 * - Badge updates for pending actions
 */

const ShopOptiGateway = {
  VERSION: '2.1.0',
  EXTENSION_VERSION: '5.8.1',
  EXTENSION_ID: 'shopopti-extension',
  
  // Gateway configuration
  config: {
    gatewayUrl: null, // Set dynamically
    maxRetries: 3,
    baseRetryDelay: 1000,
    maxRetryDelay: 30000,
    requestTimeout: 30000,
  },
  
  // Current token
  _token: null,
  _tokenExpiry: null,
  
  // Debug mode flag
  debugMode: false,
  
  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  
  async init() {
    // Get gateway URL from storage or environment
    const stored = await this._getFromStorage('gateway_config');
    if (stored?.gatewayUrl) {
      this.config.gatewayUrl = stored.gatewayUrl;
    } else {
      // Default to Supabase function URL
      this.config.gatewayUrl = 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1/extension-gateway';
    }
    
    // Load token
    const tokenData = await this._getFromStorage('extension_token');
    if (tokenData?.token) {
      this._token = tokenData.token;
      this._tokenExpiry = tokenData.expiresAt ? new Date(tokenData.expiresAt) : null;
    }
    
    // Load debug mode setting
    const debugSetting = await this._getFromStorage('debugMode');
    this.debugMode = debugSetting || false;
    
    // Initialize IndexedDB
    await this._initDB();
    
    // Process any pending actions
    this._processPendingQueue();
    
    console.log('[Gateway] Initialized v' + this.VERSION + (this.debugMode ? ' (DEBUG MODE)' : ''));
    return true;
  },
  
  /**
   * Enable/disable debug mode - logs all payloads and responses
   */
  async setDebugMode(enabled) {
    this.debugMode = enabled;
    await this._setInStorage('debugMode', enabled);
    console.log(`[Gateway] Debug mode: ${enabled ? 'ON' : 'OFF'}`);
  },
  
  /**
   * Debug log helper - only logs if debugMode is enabled
   */
  _debugLog(label, data) {
    if (!this.debugMode) return;
    
    console.group(`[Gateway DEBUG] ${label}`);
    try {
      console.log(JSON.stringify(data, null, 2));
    } catch (e) {
      console.log(data);
    }
    console.groupEnd();
  },
  
  // ==========================================================================
  // MAIN API
  // ==========================================================================
  
  /**
   * Call the gateway with an action
   * @param {string} action - Action type (e.g., 'IMPORT_PRODUCT', 'AI_OPTIMIZE_TITLE')
   * @param {object} payload - Action payload
   * @param {object} options - Additional options
   * @returns {Promise<{ok: boolean, data?: any, error?: string, code?: string}>}
   */
  async callGateway(action, payload = {}, options = {}) {
    const {
      requiresIdempotency = this._isWriteAction(action),
      metadata = {},
      skipQueue = false,
    } = options;
    
    const requestId = this._generateUUID();
    const idempotencyKey = requiresIdempotency ? this._generateIdempotencyKey(action, payload) : null;
    
    const request = {
      action,
      payload,
      requestId,
      idempotencyKey,
      metadata: {
        ...metadata,
        platform: await this._detectPlatform(),
        url: window.location?.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      },
      createdAt: Date.now(),
      retryCount: 0,
    };
    
    try {
      const response = await this._executeRequest(request);
      return response;
    } catch (error) {
      console.error('[Gateway] Request failed:', error);
      
      // Queue for retry if not skipped and retryable
      if (!skipQueue && this._isRetryableError(error)) {
        await this._queueRequest(request);
        return {
          ok: false,
          code: 'QUEUED',
          message: 'Request queued for retry',
          requestId,
        };
      }
      
      return {
        ok: false,
        code: error.code || 'NETWORK_ERROR',
        message: error.message || 'Request failed',
        requestId,
      };
    }
  },
  
  /**
   * Shorthand methods for common actions
   */
  async importProduct(product, metadata = {}) {
    return this.callGateway('IMPORT_PRODUCT', { product }, { metadata });
  },
  
  async importBulk(products, metadata = {}) {
    return this.callGateway('IMPORT_BULK', { products }, { metadata });
  },
  
  async optimizeTitle(product, language = 'fr') {
    return this.callGateway('AI_OPTIMIZE_TITLE', { product, language });
  },
  
  async optimizeDescription(product, language = 'fr') {
    return this.callGateway('AI_OPTIMIZE_DESCRIPTION', { product, language });
  },
  
  async optimizeFull(product, language = 'fr') {
    return this.callGateway('AI_OPTIMIZE_FULL', { product, language });
  },
  
  async generateSEO(product, language = 'fr') {
    return this.callGateway('AI_GENERATE_SEO', { product, language });
  },
  
  async checkVersion() {
    return this.callGateway('CHECK_VERSION', {}, { skipQueue: true });
  },
  
  async checkQuota() {
    return this.callGateway('CHECK_QUOTA', {}, { skipQueue: true });
  },
  
  async getSettings() {
    return this.callGateway('GET_SETTINGS', {}, { skipQueue: true });
  },
  
  async logAction(actionType, actionStatus, details = {}) {
    return this.callGateway('LOG_ACTION', {
      action_type: actionType,
      action_status: actionStatus,
      ...details,
    }, { requiresIdempotency: false, skipQueue: true });
  },
  
  // ==========================================================================
  // TOKEN MANAGEMENT
  // ==========================================================================
  
  async setToken(token, expiresAt = null, refreshToken = null) {
    this._token = token;
    this._tokenExpiry = expiresAt ? new Date(expiresAt) : null;
    
    await this._setInStorage('extension_token', {
      token,
      expiresAt,
      refreshToken,
      savedAt: new Date().toISOString(),
    });
    
    return true;
  },
  
  async getToken() {
    // Check if token needs refresh
    if (this._tokenExpiry && new Date() > new Date(this._tokenExpiry.getTime() - 5 * 60 * 1000)) {
      await this._refreshToken();
    }
    return this._token;
  },
  
  async clearToken() {
    this._token = null;
    this._tokenExpiry = null;
    await this._removeFromStorage('extension_token');
  },
  
  async _refreshToken() {
    const stored = await this._getFromStorage('extension_token');
    if (!stored?.refreshToken) {
      console.warn('[Gateway] No refresh token available');
      return false;
    }
    
    try {
      const response = await this.callGateway('AUTH_REFRESH_TOKEN', {
        refreshToken: stored.refreshToken,
      }, { skipQueue: true });
      
      if (response.ok && response.data?.token) {
        await this.setToken(response.data.token, response.data.expiresAt, stored.refreshToken);
        return true;
      }
    } catch (error) {
      console.error('[Gateway] Token refresh failed:', error);
    }
    
    return false;
  },
  
  // ==========================================================================
  // REQUEST EXECUTION
  // ==========================================================================
  
  async _executeRequest(request) {
    const token = await this.getToken();
    
    const headers = {
      'Content-Type': 'application/json',
      'X-Request-Id': request.requestId,
      'X-Extension-Id': this.EXTENSION_ID,
      'X-Extension-Version': this.EXTENSION_VERSION,
    };
    
    if (token) {
      headers['X-Extension-Token'] = token;
    }
    
    if (request.idempotencyKey) {
      headers['X-Idempotency-Key'] = request.idempotencyKey;
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeout);
    
    const requestBody = {
      action: request.action,
      version: this.EXTENSION_VERSION,
      payload: request.payload,
      metadata: request.metadata,
    };
    
    // DEBUG: Log outgoing request
    this._debugLog('REQUEST', {
      url: this.config.gatewayUrl,
      headers: { ...headers, 'X-Extension-Token': headers['X-Extension-Token'] ? '[REDACTED]' : undefined },
      body: requestBody,
    });
    
    try {
      const response = await fetch(this.config.gatewayUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      // DEBUG: Log response
      this._debugLog('RESPONSE', {
        status: response.status,
        statusText: response.statusText,
        data,
      });
      
      // Handle specific status codes
      if (response.status === 401) {
        // Token invalid, clear and notify
        await this.clearToken();
        return { ok: false, code: 'UNAUTHORIZED', message: data.message || 'Authentication required' };
      }
      
      if (response.status === 426) {
        // Update required
        return { ok: false, code: 'VERSION_OUTDATED', message: data.message, ...data.details };
      }
      
      if (response.status === 429) {
        // Rate limited
        const error = new Error(data.message || 'Rate limit exceeded');
        error.code = 'QUOTA_EXCEEDED';
        error.retryAfter = data.details?.retryAfter || 60;
        throw error;
      }
      
      if (response.status === 409) {
        // Replay or in-progress
        return { ok: false, code: data.code, message: data.message };
      }
      
      return data;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      // DEBUG: Log error
      this._debugLog('ERROR', {
        message: error.message,
        code: error.code,
        name: error.name,
      });
      
      if (error.name === 'AbortError') {
        const timeoutError = new Error('Request timeout');
        timeoutError.code = 'TIMEOUT';
        throw timeoutError;
      }
      
      throw error;
    }
  },
  
  // ==========================================================================
  // OFFLINE QUEUE (IndexedDB)
  // ==========================================================================
  
  _db: null,
  
  async _initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ShopOptiGateway', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this._db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('pending_actions')) {
          const store = db.createObjectStore('pending_actions', { keyPath: 'requestId' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('action', 'action', { unique: false });
        }
      };
    });
  },
  
  async _queueRequest(request) {
    if (!this._db) await this._initDB();
    
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction('pending_actions', 'readwrite');
      const store = tx.objectStore('pending_actions');
      
      const queuedRequest = {
        ...request,
        queuedAt: Date.now(),
        nextRetryAt: Date.now() + this._calculateBackoff(request.retryCount),
      };
      
      const req = store.put(queuedRequest);
      req.onsuccess = () => {
        this._updateBadge();
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  },
  
  async _getPendingRequests() {
    if (!this._db) await this._initDB();
    
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction('pending_actions', 'readonly');
      const store = tx.objectStore('pending_actions');
      const req = store.getAll();
      
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },
  
  async _removeFromQueue(requestId) {
    if (!this._db) await this._initDB();
    
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction('pending_actions', 'readwrite');
      const store = tx.objectStore('pending_actions');
      const req = store.delete(requestId);
      
      req.onsuccess = () => {
        this._updateBadge();
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  },
  
  async _processPendingQueue() {
    const pending = await this._getPendingRequests();
    const now = Date.now();
    
    for (const request of pending) {
      // Skip if not ready for retry
      if (request.nextRetryAt && request.nextRetryAt > now) {
        continue;
      }
      
      // Skip if max retries exceeded
      if (request.retryCount >= this.config.maxRetries) {
        console.warn('[Gateway] Max retries exceeded for', request.requestId);
        await this._removeFromQueue(request.requestId);
        continue;
      }
      
      try {
        const response = await this._executeRequest({
          ...request,
          requestId: this._generateUUID(), // New request ID for retry
        });
        
        if (response.ok || !this._isRetryableError({ code: response.code })) {
          await this._removeFromQueue(request.requestId);
        } else {
          // Update retry count and reschedule
          request.retryCount++;
          request.nextRetryAt = now + this._calculateBackoff(request.retryCount);
          await this._queueRequest(request);
        }
      } catch (error) {
        if (this._isRetryableError(error)) {
          request.retryCount++;
          request.nextRetryAt = now + this._calculateBackoff(request.retryCount);
          await this._queueRequest(request);
        } else {
          await this._removeFromQueue(request.requestId);
        }
      }
    }
    
    // Schedule next check
    setTimeout(() => this._processPendingQueue(), 30000);
  },
  
  async _updateBadge() {
    try {
      const pending = await this._getPendingRequests();
      const count = pending.length;
      
      if (typeof chrome !== 'undefined' && chrome.action) {
        if (count > 0) {
          chrome.action.setBadgeText({ text: count.toString() });
          chrome.action.setBadgeBackgroundColor({ color: '#f59e0b' });
        } else {
          chrome.action.setBadgeText({ text: '' });
        }
      }
    } catch (error) {
      // Ignore badge errors
    }
  },
  
  // ==========================================================================
  // UTILITIES
  // ==========================================================================
  
  _generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },
  
  _generateIdempotencyKey(action, payload) {
    // Create a stable key based on action and payload
    const payloadStr = JSON.stringify(payload);
    let hash = 0;
    for (let i = 0; i < payloadStr.length; i++) {
      const char = payloadStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `${action}-${Math.abs(hash).toString(36)}-${Date.now().toString(36)}`;
  },
  
  _isWriteAction(action) {
    const writeActions = [
      'IMPORT_PRODUCT',
      'IMPORT_BULK',
      'AI_OPTIMIZE_TITLE',
      'AI_OPTIMIZE_DESCRIPTION',
      'AI_OPTIMIZE_FULL',
      'AI_GENERATE_SEO',
      'AI_GENERATE_TAGS',
      'SYNC_STOCK',
      'SYNC_PRICE',
    ];
    return writeActions.includes(action);
  },
  
  _isRetryableError(error) {
    const retryableCodes = ['TIMEOUT', 'NETWORK_ERROR', 'QUOTA_EXCEEDED', 'INTERNAL'];
    return retryableCodes.includes(error?.code);
  },
  
  _calculateBackoff(retryCount) {
    const delay = Math.min(
      this.config.baseRetryDelay * Math.pow(2, retryCount),
      this.config.maxRetryDelay
    );
    // Add jitter (±25%)
    const jitter = delay * 0.25 * (Math.random() * 2 - 1);
    return Math.floor(delay + jitter);
  },
  
  async _detectPlatform() {
    const hostname = window.location?.hostname || '';
    
    const platforms = {
      'amazon': /amazon\./,
      'aliexpress': /aliexpress\./,
      'ebay': /ebay\./,
      'temu': /temu\./,
      'shein': /shein\./,
      'etsy': /etsy\./,
      'walmart': /walmart\./,
      'shopify': /\.myshopify\./,
    };
    
    for (const [platform, pattern] of Object.entries(platforms)) {
      if (pattern.test(hostname)) return platform;
    }
    
    return 'unknown';
  },
  
  // Chrome storage helpers
  async _getFromStorage(key) {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get([key], (result) => resolve(result[key] || null));
      } else {
        try {
          const value = localStorage.getItem(`shopopti_${key}`);
          resolve(value ? JSON.parse(value) : null);
        } catch {
          resolve(null);
        }
      }
    });
  },
  
  async _setInStorage(key, value) {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ [key]: value }, () => resolve());
      } else {
        try {
          localStorage.setItem(`shopopti_${key}`, JSON.stringify(value));
        } catch {}
        resolve();
      }
    });
  },
  
  async _removeFromStorage(key) {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.remove([key], () => resolve());
      } else {
        try {
          localStorage.removeItem(`shopopti_${key}`);
        } catch {}
        resolve();
      }
    });
  },
  
  // ==========================================================================
  // QUEUE STATUS
  // ==========================================================================
  
  async getQueueStatus() {
    const pending = await this._getPendingRequests();
    return {
      count: pending.length,
      actions: pending.map(r => ({
        requestId: r.requestId,
        action: r.action,
        createdAt: r.createdAt,
        retryCount: r.retryCount,
        nextRetryAt: r.nextRetryAt,
      })),
    };
  },
  
  async clearQueue() {
    if (!this._db) await this._initDB();
    
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction('pending_actions', 'readwrite');
      const store = tx.objectStore('pending_actions');
      const req = store.clear();
      
      req.onsuccess = () => {
        this._updateBadge();
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  },
};

// Auto-initialize
if (typeof window !== 'undefined') {
  window.ShopOptiGateway = ShopOptiGateway;
  ShopOptiGateway.init().catch(console.error);
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ShopOptiGateway;
}
