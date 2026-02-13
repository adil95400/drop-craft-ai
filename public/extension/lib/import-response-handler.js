/**
 * ShopOpti+ Pro - Import Response Handler
 * Maps backend responses to user-friendly notifications and UI updates
 */
;(function() {
  'use strict';

  class ImportResponseHandler {
    static handleSuccess(result, productTitle) {
      const message = result.imported
        ? `${result.imported} produit(s) importé(s) avec succès`
        : `"${(productTitle || 'Produit').substring(0, 40)}" importé`;

      return {
        success: true,
        title: 'Import réussi ✓',
        message,
        data: result
      };
    }

    static handleError(error) {
      let userMessage = 'Erreur inconnue lors de l\'import';

      if (typeof error === 'string') {
        userMessage = error;
      } else if (error?.message) {
        if (error.message.includes('401') || error.message.includes('authentif')) {
          userMessage = 'Session expirée. Reconnectez-vous.';
        } else if (error.message.includes('429')) {
          userMessage = 'Trop de requêtes. Réessayez dans quelques secondes.';
        } else if (error.message.includes('quota')) {
          userMessage = 'Quota d\'import atteint. Passez au plan supérieur.';
        } else {
          userMessage = error.message;
        }
      }

      return {
        success: false,
        title: 'Erreur d\'import',
        message: userMessage,
        canRetry: error?.canFallback || false
      };
    }

    static handleBulkResult(result) {
      const imported = result.imported || result.succeeded || 0;
      const failed = result.failed || 0;
      const total = imported + failed;

      return {
        success: imported > 0,
        title: failed > 0 ? 'Import partiel' : 'Import en masse réussi ✓',
        message: `${imported}/${total} produits importés${failed > 0 ? ` (${failed} échoués)` : ''}`,
        data: result
      };
    }
  }

  if (typeof window !== 'undefined') {
    window.ImportResponseHandler = ImportResponseHandler;
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.ImportResponseHandler = ImportResponseHandler;
  }
})();
