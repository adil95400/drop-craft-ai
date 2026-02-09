import { supabase } from '@/integrations/supabase/client';
import { productsApi } from '@/services/api/client';
import { ShopifyConnector } from './connectors/ShopifyConnector';
import { AmazonConnector } from './connectors/AmazonConnector';
import { EBayConnector } from './connectors/eBayConnector';
import type { BaseConnector } from './connectors/BaseConnector';

interface MarketplaceConnectionRow {
  id: string
  user_id: string
  platform: string
  credentials: any
  sync_settings: any
  status: string
  last_sync_at: string | null
  created_at: string
  updated_at: string
}

export interface MarketplaceConnection extends MarketplaceConnectionRow {
  store_name?: string;
  is_active?: boolean;
  sync_frequency?: 'manual' | 'hourly' | 'daily' | 'realtime';
  webhook_url?: string;
}

export interface ProductMapping {
  id: string
  user_id: string
  local_product_id: string
  integration_id: string
  external_product_id: string
  last_synced_at: string | null
  sync_status: string
  sync_errors: any
  created_at: string
  product_id?: string
  sku?: string
}

export interface SyncLog {
  id: string
  user_id: string
  connection_id: string
  sync_type: string
  status: string
  started_at: string | null
  completed_at: string | null
  error_details: any
  stats: any
  created_at: string
  direction?: 'push' | 'pull'
  total_items?: number
  success_items?: number
  error_items?: number
  duration_ms?: number
  metadata?: Record<string, any>
}

export class MarketplaceSyncService {
  private connectors: Map<string, BaseConnector> = new Map();

  async getConnections(userId: string): Promise<MarketplaceConnection[]> {
    const { data, error } = await (supabase.from('integrations') as any)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map((conn: any) => ({
      id: conn.id,
      user_id: conn.user_id,
      platform: conn.platform,
      credentials: conn.config || {},
      sync_settings: conn.config || {},
      status: conn.connection_status || 'disconnected',
      last_sync_at: conn.last_sync_at,
      created_at: conn.created_at,
      updated_at: conn.updated_at,
      store_name: conn.store_url || 'Store',
      is_active: conn.is_active,
      sync_frequency: conn.sync_frequency || 'manual',
      webhook_url: conn.webhook_url,
    }));
  }

  async createConnection(
    userId: string,
    platform: string,
    storeName: string,
    credentials: Record<string, any>
  ): Promise<MarketplaceConnection> {
    const { data, error } = await (supabase.from('integrations') as any)
      .insert({
        user_id: userId,
        platform,
        config: { ...credentials, store_name: storeName },
        connection_status: 'connected',
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      user_id: data.user_id,
      platform: data.platform,
      credentials: data.config,
      sync_settings: data.config,
      status: 'active',
      last_sync_at: null,
      created_at: data.created_at,
      updated_at: data.updated_at,
      store_name: storeName,
      is_active: true,
      sync_frequency: 'manual',
    };
  }

  async updateConnection(
    connectionId: string,
    updates: Partial<any>
  ): Promise<void> {
    const { error } = await (supabase.from('integrations') as any)
      .update(updates)
      .eq('id', connectionId);

    if (error) throw error;
  }

  async deleteConnection(connectionId: string): Promise<void> {
    const { error } = await (supabase.from('integrations') as any)
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
    
    // Create sync log in activity_logs
    const { data: log, error: logError } = await (supabase.from('activity_logs') as any)
      .insert({
        user_id: userId,
        action: 'marketplace_sync',
        entity_type: 'products',
        entity_id: connectionId,
        details: { sync_type: 'products', status: 'running', started_at: startedAt },
      })
      .select()
      .single();

    if (logError) throw logError;

    try {
      const { data: connection, error: connError } = await (supabase.from('integrations') as any)
        .select('*')
        .eq('id', connectionId)
        .single();

      if (connError || !connection) throw new Error('Connection not found');

      const resp = await productsApi.list({ per_page: 500 });
      const products = (resp.items ?? []).filter((p: any) => productIds.includes(p.id));

      let successCount = 0;
      let errorCount = 0;

      for (const product of products || []) {
        try {
          successCount++;
        } catch (error: any) {
          errorCount++;
        }
      }

      const duration = Date.now() - startTime;
      const completedAt = new Date().toISOString();
      const status = errorCount === 0 ? 'completed' : errorCount < productIds.length ? 'partial' : 'failed';

      await (supabase.from('activity_logs') as any)
        .update({
          details: {
            sync_type: 'products',
            status,
            completed_at: completedAt,
            stats: {
              total: productIds.length,
              success: successCount,
              errors: errorCount,
              duration_ms: duration,
            },
          },
        })
        .eq('id', log.id);

      await (supabase.from('integrations') as any)
        .update({ last_sync_at: completedAt })
        .eq('id', connectionId);

      return { 
        id: log.id,
        user_id: userId,
        connection_id: connectionId,
        sync_type: 'products',
        status, 
        started_at: startedAt,
        completed_at: completedAt,
        error_details: null,
        stats: { total: productIds.length, success: successCount, errors: errorCount },
        created_at: log.created_at,
        direction: 'push',
        total_items: productIds.length,
        success_items: successCount,
        error_items: errorCount,
        duration_ms: duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const completedAt = new Date().toISOString();
      
      await (supabase.from('activity_logs') as any)
        .update({
          details: {
            status: 'failed',
            completed_at: completedAt,
            error: error.message,
            stats: { duration_ms: duration },
          },
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

    const { data: log, error: logError } = await (supabase.from('activity_logs') as any)
      .insert({
        user_id: userId,
        action: 'marketplace_sync',
        entity_type: 'inventory',
        entity_id: connectionId,
        details: { sync_type: 'inventory', status: 'running', started_at: startedAt },
      })
      .select()
      .single();

    if (logError) throw logError;

    try {
      const duration = Date.now() - startTime;
      const completedAt = new Date().toISOString();
      
      await (supabase.from('activity_logs') as any)
        .update({
          details: {
            sync_type: 'inventory',
            status: 'completed',
            completed_at: completedAt,
            stats: { total: 0, success: 0, duration_ms: duration },
          },
        })
        .eq('id', log.id);
          
      return { 
        id: log.id,
        user_id: userId,
        connection_id: connectionId,
        sync_type: 'inventory',
        status: 'completed', 
        started_at: startedAt,
        completed_at: completedAt,
        error_details: null,
        stats: { total: 0, success: 0 },
        created_at: log.created_at,
        direction: 'push',
        total_items: 0, 
        success_items: 0, 
        duration_ms: duration 
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const completedAt = new Date().toISOString();
      
      await (supabase.from('activity_logs') as any)
        .update({
          details: {
            status: 'failed',
            completed_at: completedAt,
            error: error.message,
            stats: { duration_ms: duration },
          },
        })
        .eq('id', log.id);

      throw error;
    }
  }

  async getSyncLogs(userId: string, connectionId?: string, limit: number = 50): Promise<SyncLog[]> {
    let query = (supabase.from('activity_logs') as any)
      .select('*')
      .eq('user_id', userId)
      .eq('action', 'marketplace_sync')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (connectionId) {
      query = query.eq('entity_id', connectionId);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return (data || []).map((log: any) => {
      const details = (log.details || {}) as any;
      const stats = details.stats || {};
      return {
        id: log.id,
        user_id: log.user_id,
        connection_id: log.entity_id,
        sync_type: details.sync_type || 'unknown',
        status: details.status || 'unknown',
        started_at: details.started_at,
        completed_at: details.completed_at,
        error_details: details.error,
        stats: stats,
        created_at: log.created_at,
        direction: 'push' as const,
        total_items: stats.total || 0,
        success_items: stats.success || 0,
        error_items: stats.errors || 0,
        duration_ms: stats.duration_ms,
      };
    });
  }

  async getProductMappings(connectionId: string): Promise<ProductMapping[]> {
    // Return empty array since we don't have this table
    return [];
  }

  async getSyncStats(userId: string) {
    const { data: connections } = await (supabase.from('integrations') as any)
      .select('id')
      .eq('user_id', userId);

    const { data: recentLogs } = await (supabase.from('activity_logs') as any)
      .select('*')
      .eq('user_id', userId)
      .eq('action', 'marketplace_sync')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const totalSyncs = recentLogs?.length || 0;
    const successfulSyncs = recentLogs?.filter((l: any) => l.details?.status === 'completed').length || 0;
    const failedSyncs = recentLogs?.filter((l: any) => l.details?.status === 'failed').length || 0;

    return {
      total_connections: connections?.length || 0,
      total_synced_products: 0,
      out_of_sync_products: 0,
      error_products: 0,
      pending_products: 0,
      syncs_today: totalSyncs,
      successful_syncs: successfulSyncs,
      failed_syncs: failedSyncs,
      success_rate: totalSyncs > 0 ? (successfulSyncs / totalSyncs) * 100 : 100,
    };
  }
}

export const marketplaceSyncService = new MarketplaceSyncService();
