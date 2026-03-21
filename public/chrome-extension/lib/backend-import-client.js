/**
 * ShopOpti+ Backend Import Client v2.0
 * 
 * BACKEND-FIRST ARCHITECTURE — Connected to Product Data Engine
 * - Sends URL + platform + options to scrape-product edge function
 * - Progressive job tracking with polling
 * - Full reviews import support
 * - Quality score retrieval
 * 
 * Headers:
 * - X-Extension-Id / X-Extension-Version
 * - X-Request-Id / X-Idempotency-Key
 * - Authorization: Bearer <JWT>
 */

;(function() {
  'use strict';

  if (window.__shopoptiBackendImportClientLoaded) return;
  window.__shopoptiBackendImportClientLoaded = true;

  const EXTENSION_ID = 'shopopti-extension-chrome';
  const EXTENSION_VERSION = typeof chrome !== 'undefined' && chrome.runtime?.getManifest
    ? chrome.runtime.getManifest().version : '7.0.0';
  
  const API_BASE = 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1';
  const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzbXdja3pybXFlY3d3cnN3d3J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNjY0NDEsImV4cCI6MjA4MTc0MjQ0MX0.jhrwOY7-tKeNF54E3Ec6yRzjmTW8zJyKuE9R4rvi41I';

  // Also keep gateway URL for legacy actions
  const GATEWAY_URL = `${API_BASE}/extension-gateway`;

  const RESPONSE_CODES = {
    VERSION_OUTDATED: 426,
    QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
    RATE_LIMITED: 429,
    UNAUTHORIZED: 401,
    REPLAY_DETECTED: 409,
  };

  class BackendImportClient {
    constructor() {
      this.debugMode = false;
      this._jwtToken = null;
      this._extensionToken = null;
      this._activeJobs = new Map();
      this._loadDebugMode();
    }

    async _loadDebugMode() {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          const result = await chrome.storage.local.get(['debugMode']);
          this.debugMode = result.debugMode || false;
        }
      } catch (e) { /* Silent */ }
    }

    async setDebugMode(enabled) {
      this.debugMode = enabled;
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ debugMode: enabled });
      }
    }

    _generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
    }

    _generateIdempotencyKey(action, url) {
      const hash = this._simpleHash(url + action + Date.now().toString());
      return `${action}-${hash}-${Date.now().toString(36)}`;
    }

    _simpleHash(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash;
      }
      return Math.abs(hash).toString(36);
    }

    /** Get JWT token (from Supabase auth session stored in extension) */
    async _getJwtToken() {
      if (this._jwtToken) return this._jwtToken;
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          const result = await chrome.storage.local.get(['supabaseSession']);
          this._jwtToken = result.supabaseSession?.access_token || null;
        }
      } catch (e) { /* Silent */ }
      return this._jwtToken;
    }

    /** Get extension token (legacy) */
    async _getExtensionToken() {
      if (this._extensionToken) return this._extensionToken;
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          const result = await chrome.storage.local.get(['extensionToken']);
          this._extensionToken = result.extensionToken || null;
        }
      } catch (e) { /* Silent */ }
      return this._extensionToken;
    }

    /** Detect platform from URL */
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
        if (pattern.test(url)) return platform;
      }
      return 'unknown';
    }

    /** Build auth headers */
    async _buildHeaders(requestId, idempotencyKey = null) {
      const jwt = await this._getJwtToken();
      const extToken = await this._getExtensionToken();

      const headers = {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'X-Extension-Id': EXTENSION_ID,
        'X-Extension-Version': EXTENSION_VERSION,
        'X-Request-Id': requestId,
      };

      if (jwt) {
        headers['Authorization'] = `Bearer ${jwt}`;
      }
      if (extToken) {
        headers['X-Extension-Token'] = extToken;
      }
      if (idempotencyKey) {
        headers['X-Idempotency-Key'] = idempotencyKey;
      }

      return headers;
    }

    _debugLog(label, data) {
      if (this.debugMode) {
        console.group(`[BackendImportClient] ${label}`);
        console.log(JSON.stringify(data, null, 2));
        console.groupEnd();
      }
    }

    // ═══════════════════════════════════════════
    // MAIN SCRAPE METHOD — Uses scrape-product edge function
    // ═══════════════════════════════════════════

    /**
     * Scrape a product URL via the Product Data Engine
     * @param {string} sourceUrl - Product page URL
     * @param {Object} options - { include_reviews, review_limit, enrich_with_ai }
     * @returns {Promise<Object>} - { ok, job_id, product, normalized, quality_score }
     */
    async scrapeProduct(sourceUrl, options = {}) {
      const requestId = this._generateUUID();
      const headers = await this._buildHeaders(requestId, this._generateIdempotencyKey('SCRAPE', sourceUrl));

      const payload = {
        url: sourceUrl,
        options: {
          include_reviews: options.includeReviews !== false,
          review_limit: options.reviewLimit || 50,
          enrich_with_ai: options.enrichWithAI || false,
        },
      };

      this._debugLog('SCRAPE REQUEST', { url: `${API_BASE}/scrape-product`, payload });

      try {
        const response = await fetch(`${API_BASE}/scrape-product`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        this._debugLog('SCRAPE RESPONSE', { status: response.status, data });

        if (!response.ok) {
          return this._handleErrorResponse(response, data, sourceUrl);
        }

        // Success — we get the full product data immediately
        const result = data.data || data;
        return {
          ok: true,
          job_id: result.job_id || result.jobId,
          product: result.product,
          normalized: result.normalized,
          quality_score: result.quality_score,
          message: 'Scraping terminé',
        };

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

    // ═══════════════════════════════════════════
    // LEGACY IMPORT — Via extension-gateway
    // ═══════════════════════════════════════════

    async importProduct(sourceUrl, options = {}) {
      const requestId = this._generateUUID();
      const idempotencyKey = this._generateIdempotencyKey('IMPORT_PROGRESSIVE', sourceUrl);
      const platform = this.detectPlatform(sourceUrl);
      const headers = await this._buildHeaders(requestId, idempotencyKey);

      const payload = {
        action: 'IMPORT_PROGRESSIVE',
        version: EXTENSION_VERSION,
        payload: {
          source_url: sourceUrl,
          platform,
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
        },
      };

      this._debugLog('IMPORT REQUEST', { url: GATEWAY_URL, payload });

      try {
        const response = await fetch(GATEWAY_URL, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        this._debugLog('IMPORT RESPONSE', { status: response.status, data });
        return this._handleImportResponse(response, data, sourceUrl);

      } catch (error) {
        return { ok: false, code: 'NETWORK_ERROR', message: error.message, requestId };
      }
    }

    // ═══════════════════════════════════════════
    // JOB STATUS POLLING
    // ═══════════════════════════════════════════

    async getJobStatus(jobId) {
      const requestId = this._generateUUID();
      const headers = await this._buildHeaders(requestId);

      const payload = {
        action: 'JOB_STATUS',
        version: EXTENSION_VERSION,
        payload: { job_id: jobId },
      };

      try {
        const response = await fetch(GATEWAY_URL, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (data.ok || data.success) {
          return {
            ok: true,
            job: data.data?.job || data.job,
            product: data.data?.product || data.product,
          };
        }
        return { ok: false, code: data.code || 'JOB_NOT_FOUND', message: data.message };
      } catch (error) {
        return { ok: false, code: 'NETWORK_ERROR', message: error.message };
      }
    }

    /**
     * Poll a job until completion
     * @param {string} jobId
     * @param {Function} onProgress - (progress, message) callback
     * @param {number} intervalMs - polling interval (default 2000)
     * @param {number} timeoutMs - max time (default 120000)
     * @returns {Promise<Object>}
     */
    async pollJob(jobId, onProgress, intervalMs = 2000, timeoutMs = 120000) {
      const startTime = Date.now();
      this._activeJobs.set(jobId, true);

      while (Date.now() - startTime < timeoutMs && this._activeJobs.get(jobId)) {
        const result = await this.getJobStatus(jobId);

        if (result.ok && result.job) {
          const { status, progress_percent, progress_message } = result.job;
          
          if (onProgress) {
            onProgress(progress_percent || 0, progress_message || status);
          }

          if (status === 'completed') {
            this._activeJobs.delete(jobId);
            return { ok: true, job: result.job, product: result.product };
          }
          if (status === 'failed') {
            this._activeJobs.delete(jobId);
            return { ok: false, code: 'JOB_FAILED', message: result.job.error_message || 'Job échoué' };
          }
        }

        await new Promise(r => setTimeout(r, intervalMs));
      }

      this._activeJobs.delete(jobId);
      return { ok: false, code: 'JOB_TIMEOUT', message: 'Délai dépassé' };
    }

    cancelJob(jobId) {
      this._activeJobs.delete(jobId);
    }

    // ═══════════════════════════════════════════
    // REVIEWS IMPORT
    // ═══════════════════════════════════════════

    async importReviews(productId, sourceUrl, options = {}) {
      const requestId = this._generateUUID();
      const idempotencyKey = this._generateIdempotencyKey('IMPORT_REVIEWS', productId + sourceUrl);
      const headers = await this._buildHeaders(requestId, idempotencyKey);

      const payload = {
        action: 'IMPORT_REVIEWS',
        version: EXTENSION_VERSION,
        payload: {
          product_id: productId,
          source_url: sourceUrl,
          limit: options.limit || 50,
        },
      };

      try {
        const response = await fetch(GATEWAY_URL, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        return this._handleImportResponse(response, data, sourceUrl);
      } catch (error) {
        return { ok: false, code: 'NETWORK_ERROR', message: error.message };
      }
    }

    // ═══════════════════════════════════════════
    // RESPONSE HANDLERS
    // ═══════════════════════════════════════════

    _handleErrorResponse(response, data) {
      if (response.status === 426) {
        return { ok: false, code: 'VERSION_OUTDATED', message: data.message || 'Mise à jour requise', forceUpdate: true };
      }
      if (response.status === 429) {
        return { ok: false, code: 'RATE_LIMITED', message: data.message || 'Limite atteinte', retryAfter: 60 };
      }
      if (response.status === 401) {
        return { ok: false, code: 'UNAUTHORIZED', message: 'Authentification requise', requiresAuth: true };
      }
      if (data.code === 'QUOTA_EXCEEDED') {
        return { ok: false, code: 'QUOTA_EXCEEDED', message: data.message || 'Quota épuisé' };
      }
      return { ok: false, code: data.code || 'UNKNOWN_ERROR', message: data.message || data.error || 'Erreur' };
    }

    _handleImportResponse(response, data, sourceUrl) {
      if (!response.ok) {
        return this._handleErrorResponse(response, data);
      }

      if (data.ok || data.success) {
        return {
          ok: true,
          job_id: data.data?.job_id || data.job_id,
          status: data.data?.status || 'received',
          message: 'Import lancé',
        };
      }

      return { ok: false, code: data.code || 'UNKNOWN_ERROR', message: data.message || 'Erreur' };
    }
  }

  // Export singleton
  window.BackendImportClient = new BackendImportClient();

})();

