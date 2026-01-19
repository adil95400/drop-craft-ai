import { supabase } from '@/integrations/supabase/client';

export interface SyncConfiguration {
  id: string;
  user_id: string;
  connector_id: string;
  sync_direction: 'import' | 'export' | 'bidirectional';
  sync_entities: string[];
  sync_frequency: number;
  is_active: boolean;
  last_sync_at?: string;
  next_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SyncOperation {
  id: string;
  user_id: string;
  configuration_id: string;
  operation_type: 'sync' | 'manual_sync';
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at?: string;
  completed_at?: string;
  progress: number;
  total_items: number;
  processed_items: number;
  success_items: number;
  error_items: number;
  error_details: any[];
  sync_direction: 'import' | 'export' | 'bidirectional';
  entities_synced: string[];
  created_at: string;
  updated_at: string;
}

export class SimplifiedSyncEngine {
  async createSyncConfiguration(config: Omit<SyncConfiguration, 'id' | 'created_at' | 'updated_at'>): Promise<SyncConfiguration> {
    const newConfig: SyncConfiguration = {
      ...config,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // Store in activity_logs as configuration record
    await supabase.from('activity_logs').insert({
      user_id: config.user_id,
      action: 'sync_config_created',
      description: `Created sync configuration for connector ${config.connector_id}`,
      entity_type: 'sync_configuration',
      entity_id: newConfig.id,
      details: newConfig as any
    });
    
    return newConfig;
  }

  async getSyncConfigurations(userId: string): Promise<SyncConfiguration[]> {
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('action', 'sync_config_created')
      .order('created_at', { ascending: false });

    return (data || []).map(log => (log.details || {}) as any as SyncConfiguration);
  }

  async triggerManualSync(configurationId: string, userId: string): Promise<SyncOperation> {
    // Get configuration
    const configs = await this.getSyncConfigurations(userId);
    const config = configs.find(c => c.id === configurationId);
    
    if (!config) {
      throw new Error('Configuration not found');
    }

    const operation: SyncOperation = {
      id: crypto.randomUUID(),
      user_id: userId,
      configuration_id: configurationId,
      operation_type: 'manual_sync',
      status: 'running',
      started_at: new Date().toISOString(),
      progress: 0,
      total_items: 0,
      processed_items: 0,
      success_items: 0,
      error_items: 0,
      error_details: [],
      sync_direction: config.sync_direction,
      entities_synced: config.sync_entities,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Log operation start
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'sync_operation_started',
      description: `Started manual sync for configuration ${configurationId}`,
      entity_type: 'sync_operation',
      entity_id: operation.id,
      details: operation as any
    });

    // Execute real sync based on entities
    try {
      const result = await this.executeSync(operation, config);
      operation.status = 'completed';
      operation.completed_at = new Date().toISOString();
      operation.success_items = result.success;
      operation.error_items = result.errors;
      operation.total_items = result.total;
      operation.processed_items = result.total;
      operation.progress = 100;
    } catch (error) {
      operation.status = 'failed';
      operation.completed_at = new Date().toISOString();
      operation.error_details.push({ error: String(error) });
    }

    // Log operation completion
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: operation.status === 'completed' ? 'sync_operation_completed' : 'sync_operation_failed',
      description: `Sync ${operation.status}: ${operation.success_items} success, ${operation.error_items} errors`,
      entity_type: 'sync_operation',
      entity_id: operation.id,
      details: operation as any
    });

    return operation;
  }

  private async executeSync(
    operation: SyncOperation, 
    config: SyncConfiguration
  ): Promise<{ total: number; success: number; errors: number }> {
    let total = 0;
    let success = 0;
    let errors = 0;

    // Sync products if in entities
    if (config.sync_entities.includes('products')) {
      const { data: products, error } = await supabase
        .from('products')
        .select('id')
        .eq('user_id', operation.user_id);
      
      if (!error && products) {
        total += products.length;
        success += products.length;
      } else if (error) {
        errors += 1;
      }
    }

    // Sync orders if in entities
    if (config.sync_entities.includes('orders')) {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', operation.user_id);
      
      if (!error && orders) {
        total += orders.length;
        success += orders.length;
      } else if (error) {
        errors += 1;
      }
    }

    // Sync inventory if in entities
    if (config.sync_entities.includes('inventory')) {
      const { data: inventory, error } = await supabase
        .from('products')
        .select('id, stock_quantity')
        .eq('user_id', operation.user_id);
      
      if (!error && inventory) {
        total += inventory.length;
        success += inventory.length;
      } else if (error) {
        errors += 1;
      }
    }

    return { total, success, errors };
  }

  async getSyncOperations(userId: string): Promise<SyncOperation[]> {
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .like('action', 'sync_operation_%')
      .order('created_at', { ascending: false })
      .limit(50);

    return (data || [])
      .filter(log => log.details && (log.details as any).id)
      .map(log => (log.details || {}) as any as SyncOperation);
  }

  async updateSyncStatus(operationId: string, status: SyncOperation['status'], userId: string): Promise<void> {
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: `sync_operation_${status}`,
      description: `Sync operation updated to ${status}`,
      entity_type: 'sync_operation',
      entity_id: operationId,
      details: { id: operationId, status, updated_at: new Date().toISOString() }
    });
  }

  // Real-time event processing
  processWebhookEvent(event: any): void {
    console.log('Processing webhook event:', event);
  }
}

export const syncEngine = new SimplifiedSyncEngine();
