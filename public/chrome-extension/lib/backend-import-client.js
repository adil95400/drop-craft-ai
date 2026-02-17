/**
 * ShopOpti+ Backend Import Client v1.0
 * 
 * BACKEND-FIRST ARCHITECTURE
 * - Extension sends ONLY: URL + platform guess + options
 * - All extraction/normalization happens on the backend
 * - Returns job_id for progressive tracking
 * 
 * Headers sent:
 * - X-Extension-Id: Extension identifier
 * - X-Extension-Version: Current version
 * - X-Request-Id: Unique request UUID for anti-replay
 * - X-Idempotency-Key: For write operation deduplication
 */

;(function() {
  'use strict';

  if (window.__shopoptiBackendImportClientLoaded) return;
  window.__shopoptiBackendImportClientLoaded = true;

  const EXTENSION_ID = 'shopopti-extension-chrome';
  const EXTENSION_VERSION = '6.0.0';
  const GATEWAY_URL = 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1/extension-gateway';

  // Response codes that require specific UI handling
  const RESPONSE_CODES = {
    VERSION_OUTDATED: 426,
    QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
    RATE_LIMITED: 429,
    UNAUTHORIZED: 401,
    REPLAY_DETECTED: 409,
  };

  /**
   * Backend Import Client - Minimal extraction, maximum backend delegation
   */
  class BackendImportClient {
    constructor() {
      this.debugMode = false;
      this._token = null;
      this._loadDebugMode();
    }

    /**
     * Load debug mode from storage
     */
    async _loadDebugMode() {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          const result = await chrome.storage.local.get(['debugMode']);
          this.debugMode = result.debugMode || false;
        }
      } catch (e) {
        // Silent fail
      }
    }

    /**
     * Enable/disable debug mode
     */
    async setDebugMode(enabled) {
      this.debugMode = enabled;
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ debugMode: enabled });
      }
      console.log(`[BackendImportClient] Debug mode: ${enabled ? 'ON' : 'OFF'}`);
    }

    /**
     * Generate UUID for X-Request-Id
     */
    _generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }

    /**
     * Generate idempotency key for write operations
     */
    _generateIdempotencyKey(action, url) {
      const hash = this._simpleHash(url + action + Date.now().toString());
      return `${action}-${hash}-${Date.now().toString(36)}`;
    }

    /**
     * Simple hash function
     */
    _simpleHash(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash).toString(36);
    }

    /**
     * Get auth token from storage
     */
    async _getToken() {
      if (this._token) return this._token;
      
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          const result = await chrome.storage.local.get(['extensionToken']);
          this._token = result.extensionToken || null;
        }
      } catch (e) {
        console.error('[BackendImportClient] Failed to get token:', e);
      }
      
      return this._token;
    }

    /**
     * Detect platform from URL
     */
    detectPlatform(url) {
      const patterns = {
        aliexpress: /aliexpress\.(com|us|ru|fr)/i,
        amazon: /amazon\.(com|fr|de|co\.uk|es|it|ca|co\.jp|com\.au)/i,
        ebay: /ebay\.(com|fr|de|co\.uk)/i,
        temu: /temu\.com/i,
        shein: /shein\.(com|fr)/i,
        shopify: /\.myshopify\.com|\/products\//i,
        etsy: /etsy\.com/i,
        walmart: /walmart\.com/i,
        cdiscount: /cdiscount\.com/i,
        fnac: /fnac\.com/i,
        rakuten: /rakuten\.(com|fr)/i,
        banggood: /banggood\.com/i,
        dhgate: /dhgate\.com/i,
        wish: /wish\.com/i,
        cjdropshipping: /cjdropshipping\.com/i,
        homedepot: /homedepot\.com/i,
        tiktok_shop: /tiktok\.com\/.*shop/i,
      };

      for (const [platform, pattern] of Object.entries(patterns)) {
        if (pattern.test(url)) {
          return platform;
        }
      }

      return 'unknown';
    }

    /**
     * Build standard headers for gateway requests
     */
    _buildHeaders(requestId, idempotencyKey = null) {
      const headers = {
        'Content-Type': 'application/json',
        'X-Extension-Id': EXTENSION_ID,
        'X-Extension-Version': EXTENSION_VERSION,
        'X-Request-Id': requestId,
      };

      if (idempotencyKey) {
        headers['X-Idempotency-Key'] = idempotencyKey;
      }

      return headers;
    }

    /**
     * Log for debug mode
     */
    _debugLog(label, data) {
      if (this.debugMode) {
        console.group(`[BackendImportClient] ${label}`);
        console.log(JSON.stringify(data, null, 2));
        console.groupEnd();
      }
    }

    /**
     * MAIN IMPORT METHOD - Send URL to backend for progressive import
     * 
     * @param {string} sourceUrl - Product URL
     * @param {Object} options - Import options
     * @returns {Promise<Object>} - { ok, job_id, status, error, code }
     */
    async importProduct(sourceUrl, options = {}) {
      const requestId = this._generateUUID();
      const idempotencyKey = this._generateIdempotencyKey('IMPORT_PROGRESSIVE', sourceUrl);
      const platform = this.detectPlatform(sourceUrl);
      const token = await this._getToken();

      const payload = {
        action: 'IMPORT_PROGRESSIVE',
        version: EXTENSION_VERSION,
        payload: {
          source_url: sourceUrl,
          platform: platform,
          options: {
            enrich_with_ai: options.enrichWithAI || false,
            import_reviews: options.importReviews || false,
            review_limit: options.reviewLimit || 50,
            target_stores: options.targetStores || [],
            language: options.language || 'fr',
            auto_publish: options.autoPublish || false,
          },
        },
        metadata: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          referrer: document.referrer || null,
        },
      };

      const headers = this._buildHeaders(requestId, idempotencyKey);
      if (token) {
        headers['X-Extension-Token'] = token;
      }

      this._debugLog('REQUEST PAYLOAD', { url: GATEWAY_URL, headers, payload });

      try {
        const response = await fetch(GATEWAY_URL, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        this._debugLog('RESPONSE', { status: response.status, data });

        // Handle specific status codes
        return this._handleResponse(response, data, sourceUrl);

      } catch (error) {
        this._debugLog('ERROR', { message: error.message });
        
        return {
          ok: false,
          code: 'NETWORK_ERROR',
          message: error.message || 'Erreur réseau',
          requestId,
        };
      }
    }

    /**
     * Handle gateway response with specific codes
     */
    _handleResponse(response, data, sourceUrl) {
      // 426 - Version outdated, force update
      if (response.status === 426) {
        return {
          ok: false,
          code: 'VERSION_OUTDATED',
          message: data.message || 'Mise à jour requise',
          updateUrl: data.details?.updateUrl || null,
          minVersion: data.details?.minVersion || null,
          forceUpdate: true,
        };
      }

      // 429 - Rate limited
      if (response.status === 429) {
        return {
          ok: false,
          code: 'RATE_LIMITED',
          message: data.message || 'Limite de requêtes atteinte',
          retryAfter: data.details?.retryAfter || 60,
        };
      }

      // 401 - Unauthorized
      if (response.status === 401) {
        return {
          ok: false,
          code: 'UNAUTHORIZED',
          message: data.message || 'Authentification requise',
          requiresAuth: true,
        };
      }

      // 409 - Replay or in-progress
      if (response.status === 409) {
        return {
          ok: false,
          code: data.code || 'CONFLICT',
          message: data.message,
        };
      }

      // Quota exceeded (in response body)
      if (data.code === 'QUOTA_EXCEEDED') {
        return {
          ok: false,
          code: 'QUOTA_EXCEEDED',
          message: data.message || 'Quota d\'imports épuisé',
          upgradeUrl: data.details?.upgradeUrl || '/pricing',
          currentPlan: data.details?.plan || 'free',
          limit: data.details?.limit || 0,
          used: data.details?.used || 0,
        };
      }

      // Success
      if (data.ok || data.success) {
        return {
          ok: true,
          job_id: data.data?.job_id || data.job_id,
          status: data.data?.status || 'received',
          message: 'Import lancé',
        };
      }

      // Generic error
      return {
        ok: false,
        code: data.code || 'UNKNOWN_ERROR',
        message: data.message || 'Erreur inconnue',
      };
    }

    /**
     * Check job status
     */
    async getJobStatus(jobId) {
      const requestId = this._generateUUID();
      const token = await this._getToken();

      const payload = {
        action: 'JOB_STATUS',
        version: EXTENSION_VERSION,
        payload: { job_id: jobId },
      };

      const headers = this._buildHeaders(requestId);
      if (token) {
        headers['X-Extension-Token'] = token;
      }

      this._debugLog('JOB STATUS REQUEST', { jobId, payload });

      try {
        const response = await fetch(GATEWAY_URL, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        this._debugLog('JOB STATUS RESPONSE', { status: response.status, data });

        if (data.ok || data.success) {
          return {
            ok: true,
            job: data.data?.job || data.job,
            product: data.data?.product || data.product,
          };
        }

        return {
          ok: false,
          code: data.code || 'JOB_NOT_FOUND',
          message: data.message || 'Job non trouvé',
        };

      } catch (error) {
        return {
          ok: false,
          code: 'NETWORK_ERROR',
          message: error.message,
        };
      }
    }

    /**
     * Import reviews separately
     */
    async importReviews(productId, sourceUrl, options = {}) {
      const requestId = this._generateUUID();
      const idempotencyKey = this._generateIdempotencyKey('IMPORT_REVIEWS', productId + sourceUrl);
      const token = await this._getToken();

      const payload = {
        action: 'IMPORT_REVIEWS',
        version: EXTENSION_VERSION,
        payload: {
          product_id: productId,
          source_url: sourceUrl,
          limit: options.limit || 50,
        },
      };

      const headers = this._buildHeaders(requestId, idempotencyKey);
      if (token) {
        headers['X-Extension-Token'] = token;
      }

      this._debugLog('IMPORT REVIEWS REQUEST', payload);

      try {
        const response = await fetch(GATEWAY_URL, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        this._debugLog('IMPORT REVIEWS RESPONSE', { status: response.status, data });

        return this._handleResponse(response, data, sourceUrl);

      } catch (error) {
        return {
          ok: false,
          code: 'NETWORK_ERROR',
          message: error.message,
        };
      }
    }
  }

  // Export singleton
  window.BackendImportClient = new BackendImportClient();

  console.log('[ShopOpti+] BackendImportClient v1.1 loaded - Backend-first architecture');

})();
