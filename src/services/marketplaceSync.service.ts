import { supabase } from '@/integrations/supabase/client';
import { ShopifyConnector } from './connectors/ShopifyConnector';
import { AmazonConnector } from './connectors/AmazonConnector';
import { EBayConnector } from './connectors/eBayConnector';
import type { BaseConnector } from './connectors/BaseConnector';
import type { Database } from '@/integrations/supabase/types';

type MarketplaceConnectionRow = Database['public']['Tables']['marketplace_connections']['Row'];
type MarketplaceConnectionInsert = Database['public']['Tables']['marketplace_connections']['Insert'];
type ProductMappingRow = Database['public']['Tables']['marketplace_product_mappings']['Row'];
type SyncLogRow = Database['public']['Tables']['marketplace_sync_logs']['Row'];

export interface MarketplaceConnection extends MarketplaceConnectionRow {
  store_name?: string;
  is_active?: boolean;
  sync_frequency?: 'manual' | 'hourly' | 'daily' | 'realtime';
  webhook_url?: string;
}

export interface ProductMapping extends ProductMappingRow {
  product_id?: string;
  sku?: string;
}

export interface SyncLog extends SyncLogRow {
  direction?: 'push' | 'pull';
  total_items?: number;
  success_items?: number;
  error_items?: number;
  duration_ms?: number;
  metadata?: Record<string, any>;
}

export class MarketplaceSyncService {
  private connectors: Map<string, BaseConnector> = new Map();

  async getConnections(userId: string): Promise<MarketplaceConnection[]> {
    const { data, error } = await supabase
      .from('marketplace_connections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(conn => ({
      ...conn,
      store_name: ((conn.sync_settings as any)?.store_name) || 'Store',
      is_active: conn.status === 'active',
      sync_frequency: ((conn.sync_settings as any)?.sync_frequency) || 'manual',
      webhook_url: (conn.sync_settings as any)?.webhook_url,
    }));
  }

  async createConnection(
    userId: string,
    platform: string,
    storeName: string,
    credentials: Record<string, any>
  ): Promise<MarketplaceConnection> {
    const { data, error } = await supabase
      .from('marketplace_connections')
      .insert({
        user_id: userId,
        platform,
        credentials,
        sync_settings: { store_name: storeName, sync_frequency: 'manual' },
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      ...data,
      store_name: storeName,
      is_active: true,
      sync_frequency: 'manual',
    };
  }

  async updateConnection(
    connectionId: string,
    updates: Partial<MarketplaceConnectionInsert>
  ): Promise<void> {
    const { error } = await supabase
      .from('marketplace_connections')
      .update(updates)
      .eq('id', connectionId);

    if (error) throw error;
  }

  async deleteConnection(connectionId: string): Promise<void> {
    const { error } = await supabase
      .from('marketplace_connections')
      .delete()
      .eq('id', connectionId);

    if (error) throw error;
  }

  private async getConnector(connection: MarketplaceConnection): Promise<BaseConnector> {
    const key = `${connection.platform}_${connection.id}`;
    
    if (this.connectors.has(key)) {
      return this.connectors.get(key)!;
    }

    let connector: BaseConnector;
    const creds = connection.credentials as any;
    
    switch (connection.platform) {
      case 'shopify':
        connector = new ShopifyConnector(creds);
        break;
      case 'amazon':
        connector = new AmazonConnector(creds);
        break;
      // case 'ebay':
      //   connector = new EBayConnector(creds);
      //   break;
      default:
        throw new Error(`Platform ${connection.platform} not supported yet`);
    }

    const isValid = await connector.validateCredentials();
    if (!isValid) {
      throw new Error(`Invalid credentials for ${connection.platform}`);
    }

    this.connectors.set(key, connector);
    return connector;
  }

  async syncProductsToMarketplace(
    connectionId: string,
    productIds: string[],
    userId: string
  ): Promise<SyncLog> {
    const startTime = Date.now();
    const startedAt = new Date().toISOString();
    
    const { data: log, error: logError } = await supabase
      .from('marketplace_sync_logs')
      .insert({
        user_id: userId,
        connection_id: connectionId,
        sync_type: 'products',
        status: 'running',
        started_at: startedAt,
      })
      .select()
      .single();

    if (logError) throw logError;

    try {
      const { data: connection, error: connError } = await supabase
        .from('marketplace_connections')
        .select('*')
        .eq('id', connectionId)
        .single();

      if (connError || !connection) throw new Error('Connection not found');

      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);

      if (prodError) throw prodError;

      const connector = await this.getConnector({
        ...connection,
        store_name: ((connection.sync_settings as any)?.store_name) || 'Store',
        is_active: connection.status === 'active',
      });
      
      let successCount = 0;
      let errorCount = 0;
      const errors: Record<string, string> = {};

      for (const product of products || []) {
        try {
          const { data: existingMapping } = await supabase
            .from('marketplace_product_mappings')
            .select('*')
            .eq('local_product_id', product.id)
            .eq('integration_id', connectionId)
            .maybeSingle();

          if (existingMapping) {
            await connector.updateInventory([{
              sku: product.sku,
              quantity: product.stock_quantity || 0,
            }]);
            
            await connector.updatePrices([{
              sku: product.sku,
              price: product.price,
            }]);

            await supabase
              .from('marketplace_product_mappings')
              .update({
                last_synced_at: new Date().toISOString(),
                sync_status: 'synced',
                sync_errors: null,
              })
              .eq('id', existingMapping.id);
          } else {
            const externalId = `product_${product.id}`;
            
            await supabase
              .from('marketplace_product_mappings')
              .insert({
                user_id: userId,
                local_product_id: product.id,
                integration_id: connectionId,
                external_product_id: externalId,
                last_synced_at: new Date().toISOString(),
                sync_status: 'synced',
              });
          }

          successCount++;
        } catch (error: any) {
          errorCount++;
          errors[product.sku] = error.message;
        }
      }

      const duration = Date.now() - startTime;
      const completedAt = new Date().toISOString();
      const status = errorCount === 0 ? 'completed' : errorCount < productIds.length ? 'partial' : 'failed';

      await supabase
        .from('marketplace_sync_logs')
        .update({
          status,
          completed_at: completedAt,
          error_details: Object.keys(errors).length > 0 ? errors : null,
          stats: {
            total: productIds.length,
            success: successCount,
            errors: errorCount,
            duration_ms: duration,
          },
        })
        .eq('id', log.id);

      await supabase
        .from('marketplace_connections')
        .update({ last_sync_at: completedAt })
        .eq('id', connectionId);

      return { 
        ...log, 
        status, 
        completed_at: completedAt,
        direction: 'push',
        total_items: productIds.length,
        success_items: successCount,
        error_items: errorCount,
        duration_ms: duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const completedAt = new Date().toISOString();
      
      await supabase
        .from('marketplace_sync_logs')
        .update({
          status: 'failed',
          completed_at: completedAt,
          error_details: { message: error.message },
          stats: { duration_ms: duration },
        })
        .eq('id', log.id);

      throw error;
    }
  }

  async syncInventoryToMarketplace(
    connectionId: string,
    userId: string
  ): Promise<SyncLog> {
    const startTime = Date.now();
    const startedAt = new Date().toISOString();

    const { data: log, error: logError } = await supabase
      .from('marketplace_sync_logs')
      .insert({
        user_id: userId,
        connection_id: connectionId,
        sync_type: 'inventory',
        status: 'running',
        started_at: startedAt,
      })
      .select()
      .single();

    if (logError) throw logError;

    try {
      const { data: connection } = await supabase
        .from('marketplace_connections')
        .select('*')
        .eq('id', connectionId)
        .single();

      if (!connection) throw new Error('Connection not found');

      const { data: mappings } = await supabase
        .from('marketplace_product_mappings')
        .select(`
          *,
          products:local_product_id (*)
        `)
        .eq('integration_id', connectionId)
        .in('sync_status', ['out_of_sync', 'synced', 'pending']);

      if (!mappings || mappings.length === 0) {
        const duration = Date.now() - startTime;
        const completedAt = new Date().toISOString();
        
        await supabase
          .from('marketplace_sync_logs')
          .update({
            status: 'completed',
            completed_at: completedAt,
            stats: { total: 0, success: 0, duration_ms: duration },
          })
          .eq('id', log.id);
          
        return { 
          ...log, 
          status: 'completed', 
          completed_at: completedAt,
          direction: 'push',
          total_items: 0, 
          success_items: 0, 
          duration_ms: duration 
        };
      }

      const connector = await this.getConnector({
        ...connection,
        store_name: ((connection.sync_settings as any)?.store_name) || 'Store',
        is_active: connection.status === 'active',
      });
      
      const inventoryUpdates = mappings
        .filter((m: any) => m.products)
        .map((mapping: any) => ({
          sku: mapping.external_product_id,
          quantity: mapping.products?.stock_quantity || 0,
        }));

      const result = await connector.updateInventory(inventoryUpdates);

      for (const mapping of mappings) {
        await supabase
          .from('marketplace_product_mappings')
          .update({
            last_synced_at: new Date().toISOString(),
            sync_status: 'synced',
            sync_errors: null,
          })
          .eq('id', mapping.id);
      }

      const duration = Date.now() - startTime;
      const completedAt = new Date().toISOString();
      
      await supabase
        .from('marketplace_sync_logs')
        .update({
          status: 'completed',
          completed_at: completedAt,
          error_details: result.errors.length > 0 ? { errors: result.errors } : null,
          stats: {
            total: mappings.length,
            success: result.updated,
            errors: result.errors.length,
            duration_ms: duration,
          },
        })
        .eq('id', log.id);

      await supabase
        .from('marketplace_connections')
        .update({ last_sync_at: completedAt })
        .eq('id', connectionId);

      return {
        ...log,
        status: 'completed',
        completed_at: completedAt,
        direction: 'push',
        total_items: mappings.length,
        success_items: result.updated,
        error_items: result.errors.length,
        duration_ms: duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const completedAt = new Date().toISOString();
      
      await supabase
        .from('marketplace_sync_logs')
        .update({
          status: 'failed',
          completed_at: completedAt,
          error_details: { message: error.message },
          stats: { duration_ms: duration },
        })
        .eq('id', log.id);

      throw error;
    }
  }

  async getSyncLogs(userId: string, connectionId?: string, limit: number = 50): Promise<SyncLog[]> {
    let query = supabase
      .from('marketplace_sync_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (connectionId) {
      query = query.eq('connection_id', connectionId);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return (data || []).map(log => {
      const stats = (log.stats as any) || {};
      return {
        ...log,
        direction: 'push' as const,
        total_items: stats.total || 0,
        success_items: stats.success || 0,
        error_items: stats.errors || 0,
        duration_ms: stats.duration_ms,
      };
    });
  }

  async getProductMappings(connectionId: string): Promise<ProductMapping[]> {
    const { data, error } = await supabase
      .from('marketplace_product_mappings')
      .select('*')
      .eq('integration_id', connectionId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(mapping => ({
      ...mapping,
      product_id: mapping.local_product_id || undefined,
      sku: mapping.external_product_id,
    }));
  }

  async getSyncStats(userId: string) {
    const { data: connections } = await supabase
      .from('marketplace_connections')
      .select('id')
      .eq('user_id', userId);

    const connectionIds = connections?.map(c => c.id) || [];

    const { data: mappings } = await supabase
      .from('marketplace_product_mappings')
      .select('sync_status')
      .in('integration_id', connectionIds);

    const { data: recentLogs } = await supabase
      .from('marketplace_sync_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const syncedCount = mappings?.filter(m => m.sync_status === 'synced').length || 0;
    const outOfSyncCount = mappings?.filter(m => m.sync_status === 'out_of_sync').length || 0;
    const errorCount = mappings?.filter(m => m.sync_status === 'error').length || 0;
    const pendingCount = mappings?.filter(m => m.sync_status === 'pending').length || 0;

    const totalSyncs = recentLogs?.length || 0;
    const successfulSyncs = recentLogs?.filter(l => l.status === 'completed').length || 0;
    const failedSyncs = recentLogs?.filter(l => l.status === 'failed').length || 0;

    return {
      total_connections: connections?.length || 0,
      total_products_mapped: mappings?.length || 0,
      synced: syncedCount,
      out_of_sync: outOfSyncCount,
      errors: errorCount,
      pending: pendingCount,
      syncs_24h: totalSyncs,
      successful_syncs_24h: successfulSyncs,
      failed_syncs_24h: failedSyncs,
    };
  }
}

export const marketplaceSyncService = new MarketplaceSyncService();
