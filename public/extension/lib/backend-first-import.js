/**
 * ShopOpti+ Pro - Backend-First Import Orchestrator
 * Tries backend import first, falls back to local extraction if needed
 */
;(function() {
  'use strict';

  class BackendFirstImport {
    constructor() {
      this.client = typeof BackendImportClient !== 'undefined' ? new BackendImportClient() : null;
    }

    async importProduct(productData, options = {}) {
      // Try backend first
      if (this.client) {
        const result = await this.client.importProduct(productData);
        if (result.success) {
          return ImportResponseHandler
            ? ImportResponseHandler.handleSuccess(result, productData.title)
            : result;
        }

        // If backend fails but fallback is allowed, try local
        if (result.canFallback && options.localExtractor) {
          console.log('[BackendFirstImport] Backend failed, trying local fallback');
          return this._localFallback(productData, options.localExtractor);
        }

        return ImportResponseHandler
          ? ImportResponseHandler.handleError(result)
          : result;
      }

      // No client available, try local
      if (options.localExtractor) {
        return this._localFallback(productData, options.localExtractor);
      }

      return { success: false, message: 'Aucun client d\'import disponible' };
    }

    async importFromUrl(url, options = {}) {
      if (this.client) {
        const result = await this.client.importFromUrl(url);
        if (result.success) return result;
        if (result.canFallback) {
          console.log('[BackendFirstImport] URL import failed, fallback not available for URL mode');
        }
        return result;
      }
      return { success: false, message: 'Client non disponible' };
    }

    async bulkImport(products, options = {}) {
      if (this.client) {
        const result = await this.client.bulkImport(products);
        return ImportResponseHandler
          ? ImportResponseHandler.handleBulkResult(result)
          : result;
      }
      return { success: false, message: 'Client non disponible' };
    }

    async _localFallback(productData, extractor) {
      try {
        const enrichedData = await extractor(productData);
        if (this.client) {
          const result = await this.client.importProduct(enrichedData);
          return result;
        }
        return { success: false, message: 'Impossible d\'envoyer au backend' };
      } catch (error) {
        return { success: false, message: `Fallback échoué: ${error.message}` };
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.BackendFirstImport = BackendFirstImport;
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.BackendFirstImport = BackendFirstImport;
  }
})();
