import { supabase } from '@/integrations/supabase/client';
import { deduplicationService } from './DeduplicationService';

export interface StockSyncConfig {
  enabled: boolean;
  sync_frequency: 'hourly' | 'daily' | 'weekly';
  auto_adjust_prices: boolean;
  stock_threshold: number;
  price_variance_limit: number;
}

export interface SyncResult {
  success: boolean;
  products_synced: number;
  errors: string[];
  execution_time: number;
}

export class StockSyncService {
  private static instance: StockSyncService;

  static getInstance(): StockSyncService {
    if (!StockSyncService.instance) {
      StockSyncService.instance = new StockSyncService();
    }
    return StockSyncService.instance;
  }

  // Bidirectional stock synchronization
  async syncStockBidirectional(userId: string, config: StockSyncConfig): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let productsSynced = 0;

    try {
      console.log('🔄 Starting bidirectional stock sync...');

      // 1. Sync FROM suppliers TO local inventory
      const supplierSyncResult = await this.syncFromSuppliers(userId, config);
      productsSynced += supplierSyncResult.products_synced;
      errors.push(...supplierSyncResult.errors);

      // 2. Sync FROM local inventory TO connected platforms (Shopify, WooCommerce)
      const platformSyncResult = await this.syncToPlatforms(userId, config);
      productsSynced += platformSyncResult.products_synced;
      errors.push(...platformSyncResult.errors);

      // 3. Handle price adjustments if enabled
      if (config.auto_adjust_prices) {
        const priceAdjustResult = await this.adjustPricesAutomatically(userId, config);
        errors.push(...priceAdjustResult.errors);
      }

      // 4. Log synchronization activity
      await this.logSyncActivity(userId, {
        type: 'bidirectional_sync',
        products_synced: productsSynced,
        errors: errors.length,
        execution_time: Date.now() - startTime
      });

      return {
        success: errors.length === 0,
        products_synced: productsSynced,
        errors,
        execution_time: Date.now() - startTime
      };

    } catch (error: any) {
      console.error('❌ Stock sync error:', error);
      errors.push(error?.message || 'Unknown error');
      
      return {
        success: false,
        products_synced: productsSynced,
        errors,
        execution_time: Date.now() - startTime
      };
    }
  }

  private async syncFromSuppliers(userId: string, config: StockSyncConfig): Promise<SyncResult> {
    const errors: string[] = [];
    let productsSynced = 0;

    try {
      // Get user's active suppliers
      const { data: suppliers, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (suppliersError) throw suppliersError;

      console.log(`📦 Syncing from ${suppliers?.length || 0} suppliers`);

      for (const supplier of suppliers || []) {
        try {
          console.log(`🔗 Syncing supplier: ${supplier.name}`);

          // Get products that need updates (older than threshold)
          const thresholdDate = new Date();
          thresholdDate.setHours(thresholdDate.getHours() - (config.sync_frequency === 'hourly' ? 1 : 24));

          const { data: products, error: productsError } = await supabase
            .from('imported_products')
            .select('*')
            .eq('user_id', userId)
            .eq('supplier_name', supplier.name)
            .or(`updated_at.lt.${thresholdDate.toISOString()},stock_quantity.lt.${config.stock_threshold}`)
            .limit(100);

          if (productsError) throw productsError;

          // Simulate supplier API calls (replace with real connector logic)
          for (const product of products || []) {
            const updatedStock = await this.fetchSupplierStock(supplier, product);
            const updatedPrice = await this.fetchSupplierPrice(supplier, product);

            // Update local inventory
            const { error: updateError } = await supabase
              .from('imported_products')
              .update({
                stock_quantity: updatedStock,
                price: updatedPrice,
                updated_at: new Date().toISOString(),
                last_synced_at: new Date().toISOString()
              })
              .eq('id', product.id);

            if (updateError) {
              errors.push(`Failed to update product ${product.sku}: ${updateError?.message || 'Unknown error'}`);
            } else {
              productsSynced++;
            }
          }

        } catch (error: any) {
          errors.push(`Supplier sync error (${supplier.name}): ${error?.message || 'Unknown error'}`);
        }
      }

    } catch (error: any) {
      errors.push(`Supplier sync setup error: ${error?.message || 'Unknown error'}`);
    }

    return { success: errors.length === 0, products_synced: productsSynced, errors, execution_time: 0 };
  }

  private async syncToPlatforms(userId: string, config: StockSyncConfig): Promise<SyncResult> {
    const errors: string[] = [];
    let productsSynced = 0;

    try {
      // Get user's active integrations
      const { data: integrations, error: integrationsError } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .in('platform_type', ['shopify', 'woocommerce']);

      if (integrationsError) throw integrationsError;

      console.log(`🛍️ Syncing to ${integrations?.length || 0} platforms`);

      for (const integration of integrations || []) {
        try {
          console.log(`📤 Syncing to ${integration.platform_type}`);

          // Get products that have been updated locally
          const { data: products, error: productsError } = await supabase
            .from('imported_products')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'published')
            .gte('updated_at', integration.last_sync_at || '2024-01-01')
            .limit(50);

          if (productsError) throw productsError;

          // Sync each product to the platform
          for (const product of products || []) {
            const syncResult = await this.syncProductToPlatform(product, integration);
            
            if (syncResult.success) {
              productsSynced++;
            } else {
              errors.push(`Failed to sync ${product.sku} to ${integration.platform_type}: ${syncResult.error}`);
            }
          }

          // Update integration last sync time
          await supabase
            .from('integrations')
            .update({ last_sync_at: new Date().toISOString() })
            .eq('id', integration.id);

        } catch (error: any) {
          errors.push(`Platform sync error (${integration.platform_type}): ${error?.message || 'Unknown error'}`);
        }
      }

    } catch (error: any) {
      errors.push(`Platform sync setup error: ${error?.message || 'Unknown error'}`);
    }

    return { success: errors.length === 0, products_synced: productsSynced, errors, execution_time: 0 };
  }

  private async fetchSupplierStock(supplier: any, product: any): Promise<number> {
    // Simulate API call to supplier
    // In real implementation, use appropriate connector (BigBuy, Eprolo, etc.)
    
    // Mock realistic stock fluctuation
    const currentStock = product.stock_quantity || 0;
    const variation = Math.floor(Math.random() * 21) - 10; // ±10 units
    const newStock = Math.max(0, currentStock + variation);
    
    console.log(`📦 ${supplier.name} - ${product.sku}: ${currentStock} → ${newStock}`);
    
    return newStock;
  }

  private async fetchSupplierPrice(supplier: any, product: any): Promise<number> {
    // Simulate API call to supplier for price updates
    const currentPrice = product.price || 0;
    const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
    const newPrice = Math.round(currentPrice * (1 + variation) * 100) / 100;
    
    console.log(`💰 ${supplier.name} - ${product.sku}: ${currentPrice} → ${newPrice}`);
    
    return newPrice;
  }

  private async syncProductToPlatform(product: any, integration: any): Promise<{success: boolean, error?: string}> {
    try {
      // Simulate platform API call
      console.log(`📤 Syncing ${product.sku} to ${integration.platform_type}`);

      switch (integration.platform_type) {
        case 'shopify':
          return await this.syncToShopify(product, integration);
        
        case 'woocommerce':
          return await this.syncToWooCommerce(product, integration);
        
        default:
          throw new Error(`Unsupported platform: ${integration.platform_type}`);
      }

    } catch (error: any) {
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  private async syncToShopify(product: any, integration: any): Promise<{success: boolean, error?: string}> {
    // Simulate Shopify API call
    // In real implementation, use Shopify Admin API
    
    const shopifyProduct = {
      id: product.external_id,
      title: product.name,
      body_html: product.description,
      vendor: product.brand,
      product_type: product.category,
      tags: product.tags?.join(','),
      variants: [{
        id: product.variant_id,
        inventory_quantity: product.stock_quantity,
        price: product.price.toString(),
        sku: product.sku,
        inventory_management: 'shopify'
      }]
    };

    // Mock API success with 95% rate
    const success = Math.random() > 0.05;
    
    if (success) {
      console.log(`✅ Shopify sync successful: ${product.sku}`);
      return { success: true };
    } else {
      return { success: false, error: 'Shopify API error (simulated)' };
    }
  }

  private async syncToWooCommerce(product: any, integration: any): Promise<{success: boolean, error?: string}> {
    // Simulate WooCommerce API call
    // In real implementation, use WooCommerce REST API
    
    const wooProduct = {
      id: product.external_id,
      name: product.name,
      description: product.description,
      short_description: product.description?.substring(0, 100),
      sku: product.sku,
      price: product.price.toString(),
      regular_price: product.price.toString(),
      stock_quantity: product.stock_quantity,
      manage_stock: true,
      categories: [{ name: product.category }],
      images: product.image_urls?.map((url: string) => ({ src: url }))
    };

    // Mock API success with 95% rate
    const success = Math.random() > 0.05;
    
    if (success) {
      console.log(`✅ WooCommerce sync successful: ${product.sku}`);
      return { success: true };
    } else {
      return { success: false, error: 'WooCommerce API error (simulated)' };
    }
  }

  private async adjustPricesAutomatically(userId: string, config: StockSyncConfig): Promise<{errors: string[]}> {
    const errors: string[] = [];

    try {
      console.log('💰 Auto-adjusting prices based on stock levels...');

      // Get products that might need price adjustment
      const { data: products, error: productsError } = await supabase
        .from('imported_products')
        .select('*')
        .eq('user_id', userId)
        .or(`stock_quantity.lt.${config.stock_threshold},stock_quantity.gt.${config.stock_threshold * 3}`)
        .limit(50);

      if (productsError) throw productsError;

      for (const product of products || []) {
        try {
          let newPrice = product.price;
          let reason = '';

          // Increase price if stock is low
          if (product.stock_quantity < config.stock_threshold) {
            const increase = 1 + (config.price_variance_limit / 100);
            newPrice = Math.round(product.price * increase * 100) / 100;
            reason = 'Low stock - price increased';
          }
          // Decrease price if stock is high
          else if (product.stock_quantity > config.stock_threshold * 3) {
            const decrease = 1 - (config.price_variance_limit / 100 * 0.5);
            newPrice = Math.round(product.price * decrease * 100) / 100;
            reason = 'High stock - price decreased';
          }

          if (newPrice !== product.price) {
            const { error: updateError } = await supabase
              .from('imported_products')
              .update({
                price: newPrice,
                updated_at: new Date().toISOString()
              })
              .eq('id', product.id);

            if (updateError) {
              errors.push(`Failed to update price for ${product.sku}: ${updateError?.message || 'Unknown error'}`);
            } else {
              console.log(`💲 ${product.sku}: ${product.price} → ${newPrice} (${reason})`);

              // Log price change
              await supabase.from('activity_logs').insert({
                user_id: userId,
                action: 'price_auto_adjusted',
                entity_type: 'product',
                entity_id: product.id,
                description: `${reason}: ${product.price} → ${newPrice}`,
                metadata: {
                  sku: product.sku,
                  old_price: product.price,
                  new_price: newPrice,
                  stock_quantity: product.stock_quantity,
                  reason
                }
              });
            }
          }

        } catch (error: any) {
          errors.push(`Price adjustment error for ${product.sku}: ${error?.message || 'Unknown error'}`);
        }
      }

    } catch (error: any) {
      errors.push(`Price adjustment setup error: ${error?.message || 'Unknown error'}`);
    }

    return { errors };
  }

  private async logSyncActivity(userId: string, activity: any): Promise<void> {
    try {
      await supabase.from('activity_logs').insert({
        user_id: userId,
        action: 'stock_sync_completed',
        entity_type: 'sync',
        description: `Stock sync completed: ${activity.products_synced} products, ${activity.errors} errors`,
        metadata: activity
      });
    } catch (error) {
      console.error('Failed to log sync activity:', error);
    }
  }

  // Schedule automatic stock sync
  async scheduleStockSync(userId: string, config: StockSyncConfig): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    // Create scheduled job
    // Create scheduled job
    await supabase.from('import_jobs').insert({
      user_id: userId,
      job_type: 'stock_sync',
      status: 'pending',
      import_settings: config as any,
      total_products: 0,
      processed_products: 0,
      successful_imports: 0,
      failed_imports: 0
    });

    console.log(`⏰ Stock sync scheduled for ${config.sync_frequency} intervals`);
  }

  private getNextScheduleTime(frequency: string): Date {
    const now = new Date();
    
    switch (frequency) {
      case 'hourly':
        return new Date(now.getTime() + 60 * 60 * 1000);
      
      case 'daily':
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(2, 0, 0, 0); // 2 AM
        return tomorrow;
      
      case 'weekly':
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        nextWeek.setHours(2, 0, 0, 0);
        return nextWeek;
      
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  // Get sync status and statistics
  async getSyncStatus(userId: string): Promise<{
    last_sync: string | null;
    next_sync: string | null;
    products_synced_today: number;
    error_rate: number;
    active_suppliers: number;
    connected_platforms: number;
  }> {
    // Get last sync activity
    const { data: lastSync } = await supabase
      .from('activity_logs')
      .select('created_at')
      .eq('user_id', userId)
      .eq('action', 'stock_sync_completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get next scheduled sync
    const { data: nextSync } = await supabase
      .from('import_jobs')
      .select('created_at')
      .eq('user_id', userId)
      .eq('job_type', 'stock_sync')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle() as { data: { created_at: string } | null };

    // Get today's sync statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todayLogs } = await supabase
      .from('activity_logs')
      .select('metadata')
      .eq('user_id', userId)
      .eq('action', 'stock_sync_completed')
      .gte('created_at', today.toISOString());

    const productsSyncedToday = todayLogs?.reduce((total, log) => {
      const metadata = log.metadata as any || {};
      return total + (metadata.products_synced || 0);
    }, 0) || 0;

    const totalSyncs = todayLogs?.length || 0;
    const errorSyncs = todayLogs?.filter(log => {
      const metadata = log.metadata as any || {};
      return (metadata.errors || 0) > 0;
    }).length || 0;
    const errorRate = totalSyncs > 0 ? (errorSyncs / totalSyncs) * 100 : 0;

    // Count active suppliers and platforms
    const { count: activeSuppliers } = await supabase
      .from('suppliers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active');

    const { count: connectedPlatforms } = await supabase
      .from('integrations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true);

    return {
      last_sync: lastSync?.created_at || null,
      next_sync: nextSync?.created_at || null,
      products_synced_today: productsSyncedToday,
      error_rate: Math.round(errorRate * 100) / 100,
      active_suppliers: activeSuppliers || 0,
      connected_platforms: connectedPlatforms || 0
    };
  }
}

export const stockSyncService = StockSyncService.getInstance();