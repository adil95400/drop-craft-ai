/**
 * ShopOpti+ Action Logger v5.8.1
 * Logs extension actions to SaaS for visibility
 */

const ShopOptiActionLogger = {
  VERSION: '6.0.0',
  
  /**
   * Log an action to the SaaS backend
   */
  async logAction(actionData) {
    // Check if API client is available
    if (typeof ShopOptiAPI === 'undefined') {
      console.warn('[ActionLogger] ShopOptiAPI not available');
      return { success: false, error: 'API not initialized' };
    }
    
    try {
      const payload = {
        action_type: actionData.actionType,
        action_status: actionData.status || 'success',
        platform: actionData.platform || null,
        product_title: actionData.productTitle || null,
        product_url: actionData.productUrl || null,
        product_id: actionData.productId || null,
        metadata: actionData.metadata || {},
        extension_version: this.VERSION
      };
      
      // Use the gateway to log
      const result = await ShopOptiAPI.gateway('LOG_ACTION', payload);
      
      return result;
    } catch (error) {
      console.error('[ActionLogger] Failed to log action:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Log product import action
   */
  async logImport(product, status = 'success') {
    return this.logAction({
      actionType: 'IMPORT_PRODUCT',
      status,
      platform: product.platform,
      productTitle: product.title?.substring(0, 200),
      productUrl: product.url || product.source_url,
      productId: product.id,
      metadata: {
        variantsCount: product.variants?.length || 0,
        imagesCount: product.images?.length || 0,
        hasReviews: !!product.reviews?.length,
        price: product.price
      }
    });
  },
  
  /**
   * Log bulk import action
   */
  async logBulkImport(products, successCount, errorCount) {
    return this.logAction({
      actionType: 'IMPORT_BULK',
      status: errorCount === 0 ? 'success' : (successCount > 0 ? 'partial' : 'error'),
      metadata: {
        totalProducts: products.length,
        successCount,
        errorCount,
        platforms: [...new Set(products.map(p => p.platform).filter(Boolean))]
      }
    });
  },
  
  /**
   * Log AI optimization action
   */
  async logAIOptimization(type, product, status = 'success') {
    const actionTypeMap = {
      'title': 'AI_OPTIMIZE_TITLE',
      'description': 'AI_OPTIMIZE_DESCRIPTION',
      'full': 'AI_OPTIMIZE_FULL',
      'seo': 'AI_GENERATE_SEO',
      'tags': 'AI_GENERATE_TAGS'
    };
    
    return this.logAction({
      actionType: actionTypeMap[type] || 'AI_OPTIMIZE_FULL',
      status,
      platform: product.platform,
      productTitle: product.title?.substring(0, 200),
      productId: product.id,
      metadata: {
        optimizationType: type
      }
    });
  },
  
  /**
   * Log sync action
   */
  async logSync(type, productCount, status = 'success') {
    const actionTypeMap = {
      'stock': 'SYNC_STOCK',
      'price': 'SYNC_PRICE',
      'all': 'SYNC_ALL'
    };
    
    return this.logAction({
      actionType: actionTypeMap[type] || 'SYNC_ALL',
      status,
      metadata: {
        syncType: type,
        productCount
      }
    });
  },
  
  /**
   * Log scrape/analysis action
   */
  async logScrape(url, platform, status = 'success') {
    return this.logAction({
      actionType: 'SCRAPE_URL',
      status,
      platform,
      productUrl: url,
      metadata: {
        hostname: new URL(url).hostname
      }
    });
  },
  
  /**
   * Log error
   */
  async logError(actionType, error, context = {}) {
    return this.logAction({
      actionType,
      status: 'error',
      platform: context.platform,
      productTitle: context.productTitle,
      productUrl: context.productUrl,
      metadata: {
        errorMessage: error.message || String(error),
        errorCode: error.code,
        ...context
      }
    });
  }
};

// Export
if (typeof window !== 'undefined') {
  window.ShopOptiActionLogger = ShopOptiActionLogger;
}
