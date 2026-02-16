/**
 * ShopOpti+ Backend-First Import v1.0
 * 
 * MAIN INTEGRATION MODULE
 * Replaces local extraction with backend-only import.
 * Orchestrates: BackendImportClient + ImportResponseHandler
 * 
 * Usage:
 *   window.BackendFirstImport.import(url, options);
 */

;(function() {
  'use strict';

  if (window.__shopoptiBackendFirstImportLoaded) return;
  window.__shopoptiBackendFirstImportLoaded = true;

  // Debug logging utility
  const DEBUG_KEY = 'debugMode';
  let debugEnabled = false;

  async function loadDebugMode() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get([DEBUG_KEY]);
        debugEnabled = result[DEBUG_KEY] === true;
      }
    } catch (e) {
      // Silent fail
    }
  }
  loadDebugMode();

  function debugLog(label, data) {
    if (debugEnabled) {
      console.group(`[BackendFirstImport] ${label}`);
      console.log(JSON.stringify(data, null, 2));
      console.groupEnd();
    }
  }

  class BackendFirstImport {
    constructor() {
      this.lastImportUrl = null;
      this.lastImportOptions = null;
      this._setupRetryListener();
    }

    /**
     * Setup retry listener for failed imports
     */
    _setupRetryListener() {
      window.addEventListener('shopopti:retry-import', async () => {
        if (this.lastImportUrl) {
          await this.import(this.lastImportUrl, this.lastImportOptions);
        }
      });
    }

    /**
     * Main import method - Backend-first, no local extraction
     * 
     * @param {string} url - Product URL to import
     * @param {Object} options - Import options
     * @param {HTMLElement} button - Optional button element for state updates
     * @returns {Promise<Object>} - Import result
     */
    async import(url, options = {}, button = null) {
      // Store for retry
      this.lastImportUrl = url;
      this.lastImportOptions = options;

      debugLog('IMPORT_START', { url, options });

      // Validate URL
      if (!url || typeof url !== 'string') {
        const errorResult = {
          ok: false,
          code: 'INVALID_URL',
          message: 'URL invalide',
        };
        debugLog('IMPORT_ERROR', errorResult);
        return errorResult;
      }

      // Ensure clients are loaded
      if (!window.BackendImportClient) {
        console.error('[BackendFirstImport] BackendImportClient not loaded');
        const errorResult = {
          ok: false,
          code: 'CLIENT_NOT_LOADED',
          message: 'Client d\'import non chargé - essayez de recharger la page',
          canFallback: true,
        };
        debugLog('IMPORT_ERROR', errorResult);
        return errorResult;
      }

      // Set button loading state
      if (button && window.ImportResponseHandler) {
        window.ImportResponseHandler.setButtonState(button, 'loading');
      }

      try {
        // Call backend - NO local extraction
        debugLog('CALLING_BACKEND', { url, options });
        const response = await window.BackendImportClient.importProduct(url, options);
        debugLog('BACKEND_RESPONSE', response);

        // Handle response with UI feedback
        if (window.ImportResponseHandler) {
          window.ImportResponseHandler.handleResponse(response, button);
        }

        // Log to action logger if available
        if (window.ShopOptiActionLogger) {
          window.ShopOptiActionLogger.logAction({
            actionType: 'IMPORT_PROGRESSIVE',
            productUrl: url,
            platform: window.BackendImportClient?.detectPlatform?.(url),
            status: response.ok ? 'success' : 'error',
            metadata: {
              job_id: response.job_id,
              error_code: response.code,
            }
          });
        }

        // Mark response to allow fallback if network/server error
        if (!response.ok && ['NETWORK_ERROR', 'INTERNAL', 'CLIENT_NOT_LOADED'].includes(response.code)) {
          response.canFallback = true;
        }

        return response;

      } catch (error) {
        console.error('[BackendFirstImport] Import error:', error);
        debugLog('IMPORT_EXCEPTION', { message: error.message, stack: error.stack });

        const errorResponse = {
          ok: false,
          code: 'UNEXPECTED_ERROR',
          message: error.message || 'Erreur inattendue',
          canFallback: true,
        };

        if (window.ImportResponseHandler) {
          window.ImportResponseHandler.handleResponse(errorResponse, button);
        }

        return errorResponse;
      }
    }

    /**
     * Import with reviews (uses separate async job)
     */
    async importWithReviews(url, options = {}, button = null) {
      // First, import the product
      const importResult = await this.import(url, { ...options, importReviews: true }, button);
      return importResult;
    }

    /**
     * Quick import - Minimal options, fast path
     */
    async quickImport(url, button = null) {
      return this.import(url, {
        enrichWithAI: false,
        importReviews: false,
        autoPublish: false,
      }, button);
    }

    /**
     * Full import - All enrichments enabled
     */
    async fullImport(url, button = null) {
      return this.import(url, {
        enrichWithAI: true,
        importReviews: true,
        autoPublish: false,
      }, button);
    }

    /**
     * Check if URL is supported
     */
    isSupported(url) {
      if (!window.BackendImportClient) return false;
      const platform = window.BackendImportClient.detectPlatform(url);
      return platform !== 'unknown';
    }

    /**
     * Get platform info for URL
     */
    getPlatformInfo(url) {
      if (!window.BackendImportClient) {
        return { key: 'unknown', name: 'Inconnu', supported: false };
      }

      const platformKey = window.BackendImportClient.detectPlatform(url);
      
      const platformNames = {
        aliexpress: 'AliExpress',
        amazon: 'Amazon',
        ebay: 'eBay',
        temu: 'Temu',
        shein: 'Shein',
        shopify: 'Shopify',
        etsy: 'Etsy',
        walmart: 'Walmart',
        cdiscount: 'Cdiscount',
        fnac: 'Fnac',
        rakuten: 'Rakuten',
        banggood: 'Banggood',
        dhgate: 'DHgate',
        wish: 'Wish',
        cjdropshipping: 'CJ Dropshipping',
        homedepot: 'Home Depot',
        tiktok_shop: 'TikTok Shop',
        unknown: 'Inconnu',
      };

      return {
        key: platformKey,
        name: platformNames[platformKey] || 'Inconnu',
        supported: platformKey !== 'unknown',
      };
    }

    /**
     * Enable debug mode
     */
    async enableDebug() {
      if (window.BackendImportClient) {
        await window.BackendImportClient.setDebugMode(true);
      }
      debugEnabled = true;
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ [DEBUG_KEY]: true });
      }
      console.log('[BackendFirstImport] Debug mode enabled');
    }

    /**
     * Disable debug mode
     */
    async disableDebug() {
      if (window.BackendImportClient) {
        await window.BackendImportClient.setDebugMode(false);
      }
      debugEnabled = false;
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ [DEBUG_KEY]: false });
      }
      console.log('[BackendFirstImport] Debug mode disabled');
    }

    /**
     * Get job status
     */
    async getJobStatus(jobId) {
      if (!window.BackendImportClient) {
        return { ok: false, code: 'CLIENT_NOT_LOADED' };
      }
      return window.BackendImportClient.getJobStatus(jobId);
    }
  }

  // Export singleton
  window.BackendFirstImport = new BackendFirstImport();

  console.log('[ShopOpti+] BackendFirstImport v1.1 loaded - Backend-first architecture active');

})();
