import { supabase } from '@/integrations/supabase/client';
import { ShopifyConnector } from './connectors/ShopifyConnector';
import { AmazonConnector } from './connectors/AmazonConnector';
import type { BaseConnector as BaseConnectorType } from './connectors/BaseConnector';
import type { ConnectorProduct, ConnectorOrder } from '@/types/connectors';
import { batchUpsert } from '@/utils/supabasePagination';

export interface SyncProgress {
  phase: 'fetching' | 'processing' | 'saving' | 'complete';
  current: number;
  total: number;
  errors: string[];
}

export class SyncEngine {
  private connectors: Map<string, BaseConnectorType> = new Map();
  private abortControllers: Map<string, AbortController> = new Map();
  
  async initializeConnector(platform: string, credentials: any): Promise<boolean> {
    try {
      let connector: BaseConnectorType;
      
      switch (platform.toLowerCase()) {
        case 'shopify':
          connector = new ShopifyConnector(credentials);
          break;
        case 'amazon':
          connector = new AmazonConnector(credentials);
          break;
        default:
          throw new Error(`Unknown platform: ${platform}`);
      }
      
      const isValid = await connector.validateCredentials();
      if (isValid) {
        this.connectors.set(platform, connector);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Failed to initialize ${platform} connector:`, error);
      return false;
    }
  }

  /**
   * Cancel an ongoing sync operation
   */
  cancelSync(platform: string): void {
    const controller = this.abortControllers.get(platform);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(platform);
    }
  }
  
  async syncProducts(
    platform: string, 
    userId: string,
    onProgress?: (progress: SyncProgress) => void
  ): Promise<{ success: boolean; count: number; errors: string[] }> {
    const connector = this.connectors.get(platform);
    if (!connector) {
      return { success: false, count: 0, errors: [`No connector found for ${platform}`] };
    }

    // Create abort controller for this sync
    const abortController = new AbortController();
    this.abortControllers.set(platform, abortController);
    
    try {
      console.log(`🔄 Starting product sync for ${platform}...`);
      onProgress?.({ phase: 'fetching', current: 0, total: 0, errors: [] });
      
      // Fetch ALL products with pagination (no 1000 limit)
      const products = await connector.fetchProducts();
      const errors: string[] = [];
      
      if (abortController.signal.aborted) {
        return { success: false, count: 0, errors: ['Sync cancelled by user'] };
      }
      
      console.log(`📦 Retrieved ${products.length} products from ${platform}`);
      onProgress?.({ phase: 'processing', current: 0, total: products.length, errors: [] });
      
      // Map products to our format
      const mappedProducts = products.map(product => ({
        user_id: userId,
        title: product.title || 'Untitled',
        description: product.description || '',
        price: product.price || 0,
        cost_price: product.costPrice || null,
        sku: product.sku || `${platform}-${product.id}`,
        category: product.category || 'General',
        stock_quantity: product.stock || 0,
        status: 'draft' as const,
        image_url: product.images?.[0] || null,
        images: product.images || [],
        tags: product.attributes?.tags || [],
        supplier: platform,
        external_id: product.id,
        external_platform: platform
      }));

      onProgress?.({ phase: 'saving', current: 0, total: mappedProducts.length, errors: [] });

      // Use batch upsert for efficiency
      const result = await batchUpsert(
        'products',
        mappedProducts,
        ['user_id', 'external_id', 'external_platform'],
        {
          batchSize: 50,
          onProgress: (processed, total) => {
            onProgress?.({ phase: 'saving', current: processed, total, errors });
          }
        }
      );

      errors.push(...result.errors);
      
      await this.logSyncActivity(userId, platform, 'products', result.success, errors);
      
      onProgress?.({ phase: 'complete', current: result.success, total: products.length, errors });
      console.log(`🎉 Sync complete: ${result.success} products imported, ${result.failed} errors`);
      
      this.abortControllers.delete(platform);
      return { success: true, count: result.success, errors };
    } catch (error: any) {
      const errorMessage = `Failed to sync products from ${platform}: ${error.message || error}`;
      console.error(errorMessage);
      await this.logSyncActivity(userId, platform, 'products', 0, [errorMessage]);
      this.abortControllers.delete(platform);
      return { success: false, count: 0, errors: [errorMessage] };
    }
  }
  
  async syncOrders(platform: string, userId: string): Promise<{ success: boolean; count: number; errors: string[] }> {
    const connector = this.connectors.get(platform);
    if (!connector) {
      return { success: false, count: 0, errors: [`No connector found for ${platform}`] };
    }
    
    try {
      console.log(`🔄 Starting order sync for ${platform}...`);
      
      // Fetch ALL orders (no limit)
      const orders = await connector.fetchOrders();
      const errors: string[] = [];
      let successCount = 0;
      
      console.log(`📦 Retrieved ${orders.length} orders from ${platform}`);
      
      for (const order of orders) {
        try {
          await this.saveOrderToDatabase(order, userId, platform);
          successCount++;
        } catch (error) {
          errors.push(`Failed to save order ${order.order_number}: ${error}`);
        }
      }
      
      await this.logSyncActivity(userId, platform, 'orders', successCount, errors);
      
      return { success: true, count: successCount, errors };
    } catch (error) {
      const errorMessage = `Failed to sync orders from ${platform}: ${error}`;
      await this.logSyncActivity(userId, platform, 'orders', 0, [errorMessage]);
      return { success: false, count: 0, errors: [errorMessage] };
    }
  }
  
  async updateInventory(platform: string, products: { sku: string; quantity: number }[]) {
    const connector = this.connectors.get(platform);
    if (!connector) {
      throw new Error(`No connector found for ${platform}`);
    }
    
    return await connector.updateInventory(products);
  }
  
  async updatePrices(platform: string, products: { sku: string; price: number }[]) {
    const connector = this.connectors.get(platform);
    if (!connector) {
      throw new Error(`No connector found for ${platform}`);
    }
    
    return await connector.updatePrices(products);
  }
  
  private async saveProductToDatabase(product: any, userId: string, platform: string) {
    const { error } = await supabase
      .from('products')
      .upsert({
        user_id: userId,
        title: product.title || 'Untitled',
        description: product.description || '',
        price: product.price || 0,
        cost_price: product.costPrice || product.cost_price || null,
        sku: product.sku || `${platform}-${product.id}`,
        category: product.category || 'General',
        stock_quantity: product.inventory_quantity || product.stock || 0,
        status: 'draft',
        image_url: product.images?.[0] || '',
        images: product.images || [],
        tags: product.tags || [],
        supplier: platform,
        external_id: product.external_id || product.id,
        external_platform: platform
      }, { onConflict: 'user_id,external_id,external_platform' });
    
    if (error) throw error;
  }
  
  private async saveOrderToDatabase(order: any, userId: string, platform: string) {
    const { error} = await supabase
      .from('orders')
      .upsert({
        user_id: userId,
        platform,
        external_id: order.external_id,
        order_number: order.order_number,
        status: order.status,
        total_amount: order.total_amount,
        currency: order.currency,
        customer_id: order.customer_id,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        billing_address: order.billing_address || {},
        shipping_address: order.shipping_address || {},
        order_items: order.line_items,
        fulfillment_status: order.fulfillment_status,
        tracking_number: order.tracking_number,
        carrier: order.carrier,
        notes: order.notes,
      }, { onConflict: 'user_id,platform,external_id' });
    
    if (error) throw error;
  }
  
  private async logSyncActivity(userId: string, platform: string, type: string, count: number, errors: string[]) {
    await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        action: `sync_${type}`,
        description: `Synchronized ${count} ${type} from ${platform}`,
        severity: errors.length > 0 ? 'warning' : 'info',
        metadata: {
          platform,
          type,
          count,
          errors: errors.slice(0, 10), // Limit errors logged
        },
      });
  }
}

export const syncEngine = new SyncEngine();