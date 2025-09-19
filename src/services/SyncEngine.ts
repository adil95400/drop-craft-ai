import { supabase } from '@/integrations/supabase/client';
import { ShopifyConnector } from './connectors/ShopifyConnector';
import { AmazonConnector } from './connectors/AmazonConnector';
import { EBayConnector } from './connectors/eBayConnector';
import type { BaseConnector, ConnectorProduct, ConnectorOrder } from '@/types/connectors';

export class SyncEngine {
  private connectors: Map<string, BaseConnector> = new Map();
  
  async initializeConnector(platform: string, credentials: any): Promise<boolean> {
    try {
      let connector: BaseConnector;
      
      switch (platform.toLowerCase()) {
        case 'shopify':
          connector = new ShopifyConnector(credentials);
          break;
        case 'amazon':
          connector = new AmazonConnector(credentials);
          break;
        case 'ebay':
          connector = new EBayConnector(credentials);
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
  
  async syncProducts(platform: string, userId: string): Promise<{ success: boolean; count: number; errors: string[] }> {
    const connector = this.connectors.get(platform);
    if (!connector) {
      return { success: false, count: 0, errors: [`No connector found for ${platform}`] };
    }
    
    try {
      const products = await connector.fetchProducts({ limit: 100 });
      const errors: string[] = [];
      let successCount = 0;
      
      for (const product of products) {
        try {
          await this.saveProductToDatabase(product, userId, platform);
          successCount++;
        } catch (error) {
          errors.push(`Failed to save product ${product.sku}: ${error}`);
        }
      }
      
      await this.logSyncActivity(userId, platform, 'products', successCount, errors);
      
      return { success: true, count: successCount, errors };
    } catch (error) {
      const errorMessage = `Failed to sync products from ${platform}: ${error}`;
      await this.logSyncActivity(userId, platform, 'products', 0, [errorMessage]);
      return { success: false, count: 0, errors: [errorMessage] };
    }
  }
  
  async syncOrders(platform: string, userId: string): Promise<{ success: boolean; count: number; errors: string[] }> {
    const connector = this.connectors.get(platform);
    if (!connector) {
      return { success: false, count: 0, errors: [`No connector found for ${platform}`] };
    }
    
    try {
      const orders = await connector.fetchOrders({ limit: 100 });
      const errors: string[] = [];
      let successCount = 0;
      
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
  
  private async saveProductToDatabase(product: ConnectorProduct, userId: string, platform: string) {
    const { error } = await supabase
      .from('imported_products')
      .upsert({
        user_id: userId,
        platform,
        external_id: product.external_id,
        sku: product.sku,
        name: product.title,
        description: product.description,
        price: product.price,
        cost_price: product.cost_price,
        currency: product.currency,
        stock_quantity: product.inventory_quantity,
        category: product.category,
        brand: product.brand,
        tags: product.tags,
        image_url: product.images[0],
        image_urls: product.images,
        status: product.status,
        variants: product.variants,
        seo_title: product.seo_title,
        seo_description: product.seo_description,
        weight: product.weight,
        dimensions: product.dimensions,
      }, { onConflict: 'user_id,platform,external_id' });
    
    if (error) throw error;
  }
  
  private async saveOrderToDatabase(order: ConnectorOrder, userId: string, platform: string) {
    const { error } = await supabase
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
        billing_address: order.billing_address,
        shipping_address: order.shipping_address,
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