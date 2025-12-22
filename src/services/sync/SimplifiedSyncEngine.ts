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
  private configurations: SyncConfiguration[] = [];
  private operations: SyncOperation[] = [];

  async createSyncConfiguration(config: Omit<SyncConfiguration, 'id' | 'created_at' | 'updated_at'>): Promise<SyncConfiguration> {
    const newConfig: SyncConfiguration = {
      ...config,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    this.configurations.push(newConfig);
    
    // Store in activity_logs for now as a workaround
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
    // For now, retrieve from activity_logs
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('action', 'sync_config_created')
      .order('created_at', { ascending: false });

    return (data || []).map(log => (log.details || {}) as any as SyncConfiguration);
  }

  async triggerManualSync(configurationId: string, userId: string): Promise<SyncOperation> {
    const config = this.configurations.find(c => c.id === configurationId);
    if (!config) {
      throw new Error('Configuration not found');
    }

    const operation: SyncOperation = {
      id: crypto.randomUUID(),
      user_id: userId,
      configuration_id: configurationId,
      operation_type: 'manual_sync',
      status: 'pending',
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

    this.operations.push(operation);

    // Store in activity_logs for now
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'sync_operation_started',
      description: `Started manual sync for configuration ${configurationId}`,
      entity_type: 'sync_operation',
      entity_id: operation.id,
      details: operation as any
    });

    // Simulate sync process
    this.simulateSync(operation);

    return operation;
  }

  async getSyncOperations(userId: string): Promise<SyncOperation[]> {
    // For now, retrieve from activity_logs
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .like('action', 'sync_operation_%')
      .order('created_at', { ascending: false });

    return (data || []).map(log => (log.details || {}) as any as SyncOperation);
  }

  private async simulateSync(operation: SyncOperation): Promise<void> {
    // Simulate sync progress
    operation.status = 'running';
    operation.started_at = new Date().toISOString();
    operation.total_items = 100;

    for (let i = 0; i <= 100; i += 10) {
      operation.progress = i;
      operation.processed_items = i;
      operation.success_items = Math.max(0, i - 2);
      operation.error_items = Math.min(2, i);
      
      if (i === 100) {
        operation.status = 'completed';
        operation.completed_at = new Date().toISOString();
      }

      // Update in activity_logs
      await supabase.from('activity_logs').insert({
        user_id: operation.user_id,
        action: 'sync_operation_progress',
        description: `Sync progress: ${i}%`,
        entity_type: 'sync_operation',
        entity_id: operation.id,
        details: { ...operation, progress_update: i }
      });

      // Wait a bit to simulate real processing
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  async updateSyncStatus(operationId: string, status: SyncOperation['status']): Promise<void> {
    const operation = this.operations.find(op => op.id === operationId);
    if (operation) {
      operation.status = status;
      operation.updated_at = new Date().toISOString();
      
      if (status === 'completed' || status === 'failed') {
        operation.completed_at = new Date().toISOString();
      }
    }
  }

  // Real-time event processing
  processWebhookEvent(event: any): void {
    console.log('Processing webhook event:', event);
    // Implementation for processing real-time webhook events
  }
}

export const syncEngine = new SimplifiedSyncEngine();
