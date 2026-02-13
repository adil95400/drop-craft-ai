/**
 * ShopOpti+ Pro - Backend Import Client
 * Handles communication with the ShopOpti backend for product imports
 */
;(function() {
  'use strict';

  const SUPABASE_URL = 'https://jsmwckzrmqecwwrswwrz.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzbXdja3pybXFlY3d3cnN3d3J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNjY0NDEsImV4cCI6MjA4MTc0MjQ0MX0.jhrwOY7-tKeNF54E3Ec6yRzjmTW8zJyKuE9R4rvi41I';

  class BackendImportClient {
    constructor() {
      this.baseUrl = SUPABASE_URL;
      this.anonKey = SUPABASE_ANON_KEY;
    }

    async getToken() {
      return new Promise((resolve) => {
        chrome.storage.local.get(['shopopti_session', 'extension_token'], (result) => {
          resolve(result.shopopti_session?.access_token || result.extension_token || null);
        });
      });
    }

    async importProduct(productData) {
      const token = await this.getToken();
      if (!token) return { success: false, error: 'Non authentifié' };

      try {
        const response = await fetch(`${this.baseUrl}/functions/v1/extension-realtime-import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': this.anonKey
          },
          body: JSON.stringify({
            action: 'import_single',
            product: productData
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        return await response.json();
      } catch (error) {
        console.error('[BackendImportClient] Import error:', error);
        return { success: false, error: error.message, canFallback: true };
      }
    }

    async bulkImport(products) {
      const token = await this.getToken();
      if (!token) return { success: false, error: 'Non authentifié' };

      try {
        const response = await fetch(`${this.baseUrl}/functions/v1/extension-realtime-import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': this.anonKey
          },
          body: JSON.stringify({
            action: 'import_bulk',
            products
          })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (error) {
        console.error('[BackendImportClient] Bulk import error:', error);
        return { success: false, error: error.message, canFallback: true };
      }
    }

    async importFromUrl(url) {
      const token = await this.getToken();
      if (!token) return { success: false, error: 'Non authentifié' };

      try {
        const response = await fetch(`${this.baseUrl}/functions/v1/quick-import-url`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': this.anonKey
          },
          body: JSON.stringify({ url })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (error) {
        console.error('[BackendImportClient] URL import error:', error);
        return { success: false, error: error.message, canFallback: true };
      }
    }
  }

  // Expose globally
  if (typeof window !== 'undefined') {
    window.BackendImportClient = BackendImportClient;
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.BackendImportClient = BackendImportClient;
  }
})();
