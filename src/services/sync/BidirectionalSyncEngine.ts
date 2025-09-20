import { supabase } from '@/integrations/supabase/client';
import { AdvancedBaseConnector } from '../connectors/AdvancedBaseConnector';
import { ConnectorManager } from '../ConnectorManager';

export interface SyncConfiguration {
  id: string;
  user_id: string;
  connector_id: string;
  sync_direction: 'import' | 'export' | 'bidirectional';
  sync_frequency: 'manual' | 'realtime' | 'hourly' | 'daily';
  sync_entities: ('products' | 'orders' | 'customers' | 'inventory')[];
  auto_resolve_conflicts: boolean;
  conflict_resolution_rules: Record<string, 'source_wins' | 'destination_wins' | 'manual_review'>;
  field_mappings: Record<string, string>;
  filters: {
    products?: Record<string, any>;
    orders?: Record<string, any>;
    customers?: Record<string, any>;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_sync_at?: string;
}

export interface SyncJob {
  id: string;
  user_id: string;
  configuration_id: string;
  connector_id: string;
  job_type: 'full_sync' | 'incremental' | 'conflict_resolution';
  sync_direction: 'import' | 'export' | 'bidirectional';
  entities_to_sync: string[];
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'critical';
  scheduled_at: string;
  started_at?: string;
  completed_at?: string;
  progress_percentage: number;
  total_items: number;
  processed_items: number;
  success_count: number;
  error_count: number;
  conflict_count: number;
  execution_time_ms?: number;
  errors: Array<{
    entity_type: string;
    entity_id: string;
    error_message: string;
    timestamp: string;
  }>;
  conflicts: Array<{
    entity_type: string;
    entity_id: string;
    conflict_type: 'data_mismatch' | 'version_conflict' | 'duplicate_key';
    source_data: any;
    destination_data: any;
    resolution_required: boolean;
    auto_resolved: boolean;
    resolution_action?: string;
  }>;
  metadata: Record<string, any>;
}

export class BidirectionalSyncEngine {
  private static instance: BidirectionalSyncEngine;
  private connectorManager: ConnectorManager;
  private activeJobs: Map<string, SyncJob> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.connectorManager = ConnectorManager.getInstance();
    this.initializeScheduler();
  }

  static getInstance(): BidirectionalSyncEngine {
    if (!BidirectionalSyncEngine.instance) {
      BidirectionalSyncEngine.instance = new BidirectionalSyncEngine();
    }
    return BidirectionalSyncEngine.instance;
  }

  private initializeScheduler(): void {
    // Check for scheduled syncs every minute
    this.syncInterval = setInterval(() => {
      this.processScheduledSyncs();
    }, 60000);
  }

  // Configuration Management
  async createSyncConfiguration(config: Partial<SyncConfiguration>): Promise<SyncConfiguration> {
    try {
      const newConfig: SyncConfiguration = {
        id: crypto.randomUUID(),
        user_id: config.user_id!,
        connector_id: config.connector_id!,
        sync_direction: config.sync_direction || 'bidirectional',
        sync_frequency: config.sync_frequency || 'manual',
        sync_entities: config.sync_entities || ['products', 'orders'],
        auto_resolve_conflicts: config.auto_resolve_conflicts ?? true,
        conflict_resolution_rules: config.conflict_resolution_rules || {
          'price': 'source_wins',
          'inventory': 'destination_wins',
          'description': 'manual_review'
        },
        field_mappings: config.field_mappings || {},
        filters: config.filters || {},
        is_active: config.is_active ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('sync_configurations')
        .insert(newConfig)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating sync configuration:', error);
      throw error;
    }
  }

  async getUserSyncConfigurations(userId: string): Promise<SyncConfiguration[]> {
    try {
      const { data, error } = await supabase
        .from('sync_configurations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sync configurations:', error);
      return [];
    }
  }

  // Sync Job Management
  async triggerManualSync(
    configurationId: string, 
    jobType: 'full_sync' | 'incremental' = 'incremental',
    priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'
  ): Promise<string> {
    try {
      // Get configuration
      const { data: config, error: configError } = await supabase
        .from('sync_configurations')
        .select('*')
        .eq('id', configurationId)
        .single();

      if (configError) throw configError;
      if (!config) throw new Error('Configuration not found');

      // Create sync job
      const job: SyncJob = {
        id: crypto.randomUUID(),
        user_id: config.user_id,
        configuration_id: configurationId,
        connector_id: config.connector_id,
        job_type: jobType,
        sync_direction: config.sync_direction,
        entities_to_sync: config.sync_entities,
        status: 'queued',
        priority: priority,
        scheduled_at: new Date().toISOString(),
        progress_percentage: 0,
        total_items: 0,
        processed_items: 0,
        success_count: 0,
        error_count: 0,
        conflict_count: 0,
        errors: [],
        conflicts: [],
        metadata: {}
      };

      // Save job to database
      const { data: savedJob, error: jobError } = await supabase
        .from('sync_operations')
        .insert({
          id: job.id,
          user_id: job.user_id,
          configuration_id: job.configuration_id,
          connector_id: job.connector_id,
          job_type: job.job_type,
          sync_direction: job.sync_direction,
          entities_to_sync: job.entities_to_sync,
          status: job.status,
          priority: job.priority,
          scheduled_at: job.scheduled_at,
          progress_percentage: job.progress_percentage,
          total_items: job.total_items,
          processed_items: job.processed_items,
          success_count: job.success_count,
          error_count: job.error_count,
          conflict_count: job.conflict_count,
          errors: job.errors,
          conflicts: job.conflicts,
          metadata: job.metadata
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Start processing immediately for manual triggers
      this.processSyncJob(job.id);

      return job.id;
    } catch (error) {
      console.error('Error triggering manual sync:', error);
      throw error;
    }
  }

  private async processScheduledSyncs(): Promise<void> {
    try {
      const now = new Date().toISOString();

      // Get configurations that need to be synced
      const { data: configs, error } = await supabase
        .from('sync_configurations')
        .select('*')
        .eq('is_active', true)
        .in('sync_frequency', ['hourly', 'daily'])
        .or(`last_sync_at.is.null,last_sync_at.lt.${this.getLastSyncThreshold('hourly')}`);

      if (error || !configs) return;

      for (const config of configs) {
        if (this.shouldTriggerSync(config)) {
          await this.triggerManualSync(config.id, 'incremental', 'normal');
        }
      }
    } catch (error) {
      console.error('Error processing scheduled syncs:', error);
    }
  }

  private shouldTriggerSync(config: SyncConfiguration): boolean {
    if (!config.last_sync_at) return true;

    const lastSync = new Date(config.last_sync_at);
    const now = new Date();
    const timeDiff = now.getTime() - lastSync.getTime();

    switch (config.sync_frequency) {
      case 'hourly':
        return timeDiff >= 60 * 60 * 1000; // 1 hour
      case 'daily':
        return timeDiff >= 24 * 60 * 60 * 1000; // 24 hours
      default:
        return false;
    }
  }

  private getLastSyncThreshold(frequency: string): string {
    const now = new Date();
    switch (frequency) {
      case 'hourly':
        return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      case 'daily':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      default:
        return now.toISOString();
    }
  }

  private async processSyncJob(jobId: string): Promise<void> {
    try {
      // Get job details
      const { data: job, error: jobError } = await supabase
        .from('sync_operations')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError || !job) throw new Error('Job not found');

      // Update job status to running
      await this.updateJobStatus(jobId, 'running', { started_at: new Date().toISOString() });

      // Get connector
      const connector = await this.connectorManager.getConnector(job.connector_id);
      if (!connector) throw new Error('Connector not found');

      // Execute sync based on direction and entities
      const results = await this.executeBidirectionalSync(connector, job);

      // Update job with results
      await this.updateJobStatus(jobId, 'completed', {
        completed_at: new Date().toISOString(),
        progress_percentage: 100,
        success_count: results.success_count,
        error_count: results.error_count,
        errors: results.errors
      });

      // Update configuration last sync time
      await supabase
        .from('sync_configurations')
        .update({ 
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', job.configuration_id);

    } catch (error) {
      console.error('Error processing sync job:', error);
      await this.updateJobStatus(jobId, 'failed', {
        error_count: 1,
        errors: [{
          entity_type: 'job',
          entity_id: jobId,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }]
      });
    }
  }

  private async executeBidirectionalSync(connector: AdvancedBaseConnector, job: any): Promise<{
    success_count: number;
    error_count: number;
    errors: any[];
  }> {
    const results = {
      success_count: 0,
      error_count: 0,
      errors: [] as any[]
    };

    const startTime = Date.now();

    try {
      for (const entity of job.entities_to_sync) {
        switch (entity) {
          case 'products':
            if (job.sync_direction === 'import' || job.sync_direction === 'bidirectional') {
              const productResult = await connector.syncProducts({ 
                incremental: job.job_type === 'incremental' 
              });
              results.success_count += productResult.imported;
              results.error_count += productResult.errors.length;
              results.errors.push(...productResult.errors);
            }
            break;

          case 'orders':
            if (job.sync_direction === 'import' || job.sync_direction === 'bidirectional') {
              const orderResult = await connector.syncOrders({ 
                incremental: job.job_type === 'incremental' 
              });
              results.success_count += orderResult.imported;
              results.error_count += orderResult.errors.length;
              results.errors.push(...orderResult.errors);
            }
            break;

          case 'customers':
            if (job.sync_direction === 'import' || job.sync_direction === 'bidirectional') {
              const customerResult = await connector.syncCustomers({ 
                incremental: job.job_type === 'incremental' 
              });
              results.success_count += customerResult.imported;
              results.error_count += customerResult.errors.length;
              results.errors.push(...customerResult.errors);
            }
            break;
        }
      }

      const executionTime = Date.now() - startTime;
      await this.updateJobStatus(job.id, job.status, { execution_time_ms: executionTime });

    } catch (error) {
      results.error_count++;
      results.errors.push({
        entity_type: 'sync',
        entity_id: job.id,
        error_message: error instanceof Error ? error.message : 'Unknown sync error',
        timestamp: new Date().toISOString()
      });
    }

    return results;
  }

  private async updateJobStatus(jobId: string, status: string, updates: Record<string, any> = {}): Promise<void> {
    try {
      await supabase
        .from('sync_operations')
        .update({
          status,
          updated_at: new Date().toISOString(),
          ...updates
        })
        .eq('id', jobId);
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  }

  // Monitoring and Analytics
  async getSyncJobHistory(userId: string, limit = 50): Promise<SyncJob[]> {
    try {
      const { data, error } = await supabase
        .from('sync_operations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sync job history:', error);
      return [];
    }
  }

  async getSyncJobStatus(jobId: string): Promise<SyncJob | null> {
    try {
      const { data, error } = await supabase
        .from('sync_operations')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching sync job status:', error);
      return null;
    }
  }

  async cancelSyncJob(jobId: string): Promise<boolean> {
    try {
      await this.updateJobStatus(jobId, 'cancelled');
      this.activeJobs.delete(jobId);
      return true;
    } catch (error) {
      console.error('Error canceling sync job:', error);
      return false;
    }
  }

  // Real-time sync for webhook events
  async processRealtimeEvent(connectorId: string, event: any): Promise<void> {
    try {
      const connector = await this.connectorManager.getConnector(connectorId);
      if (!connector) return;

      // Process the webhook event
      await connector.processWebhookEvent(event);

      // Log the real-time sync
      await supabase.from('sync_operations').insert({
        id: crypto.randomUUID(),
        user_id: event.user_id || 'system',
        configuration_id: 'realtime',
        connector_id: connectorId,
        job_type: 'incremental',
        sync_direction: 'import',
        entities_to_sync: [event.entity_type],
        status: 'completed',
        priority: 'high',
        scheduled_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        progress_percentage: 100,
        total_items: 1,
        processed_items: 1,
        success_count: 1,
        error_count: 0,
        conflict_count: 0,
        errors: [],
        conflicts: [],
        metadata: { realtime_event: true, webhook_data: event }
      });

    } catch (error) {
      console.error('Error processing realtime event:', error);
    }
  }

  // Cleanup
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.activeJobs.clear();
  }
}