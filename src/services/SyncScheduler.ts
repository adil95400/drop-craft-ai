import { supabase } from '@/integrations/supabase/client';
import { ConnectorManager } from './ConnectorManager';

export type SyncFrequency = 'manual' | 'hourly' | 'every_6_hours' | 'daily' | 'weekly' | 'realtime';
export type SyncStrategy = 'full' | 'delta' | 'smart';

export interface SyncSchedule {
  id: string;
  connector_id: string;
  user_id: string;
  frequency: SyncFrequency;
  strategy: SyncStrategy;
  entities: ('products' | 'orders' | 'customers' | 'inventory')[];
  enabled: boolean;
  last_sync_at?: string;
  next_sync_at?: string;
  sync_config: {
    batch_size: number;
    max_retries: number;
    conflict_resolution: 'source_wins' | 'destination_wins' | 'newest_wins' | 'manual';
    delta_field?: string; // Field to use for delta sync (e.g., 'updated_at')
    webhooks_enabled: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface SyncExecution {
  id: string;
  schedule_id: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  strategy_used: SyncStrategy;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  results: {
    products?: { total: number; imported: number; updated: number; errors: number };
    orders?: { total: number; imported: number; updated: number; errors: number };
    customers?: { total: number; imported: number; updated: number; errors: number };
    inventory?: { total: number; updated: number; errors: number };
  };
  errors: Array<{ entity: string; message: string; timestamp: string }>;
}

/**
 * Professional Sync Scheduler - Standards du marché
 * Inspired by: ChannelEngine, Sellercloud, Shopify Flow
 */
export class SyncScheduler {
  private static instance: SyncScheduler;
  private connectorManager: ConnectorManager;
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    this.connectorManager = ConnectorManager.getInstance();
    this.initializeScheduler();
  }

  static getInstance(): SyncScheduler {
    if (!SyncScheduler.instance) {
      SyncScheduler.instance = new SyncScheduler();
    }
    return SyncScheduler.instance;
  }

  /**
   * Initialize scheduler and load active schedules
   */
  private async initializeScheduler() {
    try {
      const { data: schedules } = await supabase
        .from('sync_schedules')
        .select('*')
        .eq('enabled', true);

      if (schedules) {
        for (const schedule of schedules) {
          this.scheduleSync(schedule);
        }
      }

      console.log(`✅ Sync Scheduler initialized with ${schedules?.length || 0} active schedules`);
    } catch (error) {
      console.error('Failed to initialize sync scheduler:', error);
    }
  }

  /**
   * Create a new sync schedule
   */
  async createSchedule(scheduleData: Omit<SyncSchedule, 'id' | 'created_at' | 'updated_at'>): Promise<SyncSchedule> {
    const { data, error } = await supabase
      .from('sync_schedules')
      .insert({
        ...scheduleData,
        next_sync_at: this.calculateNextSyncTime(scheduleData.frequency),
      })
      .select()
      .single();

    if (error) throw error;

    if (scheduleData.enabled) {
      this.scheduleSync(data);
    }

    return data;
  }

  /**
   * Update existing schedule
   */
  async updateSchedule(scheduleId: string, updates: Partial<SyncSchedule>): Promise<SyncSchedule> {
    const { data, error } = await supabase
      .from('sync_schedules')
      .update(updates)
      .eq('id', scheduleId)
      .select()
      .single();

    if (error) throw error;

    // Reschedule if frequency changed
    if (updates.frequency || updates.enabled !== undefined) {
      this.unscheduleSync(scheduleId);
      if (data.enabled) {
        this.scheduleSync(data);
      }
    }

    return data;
  }

  /**
   * Delete schedule
   */
  async deleteSchedule(scheduleId: string): Promise<void> {
    this.unscheduleSync(scheduleId);

    const { error } = await supabase
      .from('sync_schedules')
      .delete()
      .eq('id', scheduleId);

    if (error) throw error;
  }

  /**
   * Schedule a sync job
   */
  private scheduleSync(schedule: SyncSchedule) {
    if (schedule.frequency === 'manual' || schedule.frequency === 'realtime') {
      return; // Skip scheduling for manual/realtime
    }

    const delay = this.calculateDelayUntilNextSync(schedule.frequency);
    
    const jobId = setTimeout(async () => {
      await this.executeSync(schedule.id);
      // Reschedule for next execution
      this.scheduleSync(schedule);
    }, delay);

    this.scheduledJobs.set(schedule.id, jobId);
    console.log(`📅 Scheduled sync for ${schedule.connector_id} - Next run in ${delay}ms`);
  }

  /**
   * Unschedule a sync job
   */
  private unscheduleSync(scheduleId: string) {
    const jobId = this.scheduledJobs.get(scheduleId);
    if (jobId) {
      clearTimeout(jobId);
      this.scheduledJobs.delete(scheduleId);
    }
  }

  /**
   * Execute sync (can be called manually or by scheduler)
   */
  async executeSync(scheduleId: string): Promise<SyncExecution> {
    const { data: schedule } = await supabase
      .from('sync_schedules')
      .select('*')
      .eq('id', scheduleId)
      .single();

    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found`);
    }

    const execution: Partial<SyncExecution> = {
      schedule_id: scheduleId,
      status: 'running',
      strategy_used: schedule.strategy,
      started_at: new Date().toISOString(),
      results: {},
      errors: [],
    };

    // Save execution to database
    const { data: savedExecution } = await supabase
      .from('sync_executions')
      .insert(execution)
      .select()
      .single();

    const executionId = savedExecution!.id;

    try {
      // Determine sync strategy
      const shouldUseDelta = 
        schedule.strategy === 'delta' || 
        (schedule.strategy === 'smart' && schedule.last_sync_at);

      const syncOptions = {
        since: shouldUseDelta ? schedule.last_sync_at : undefined,
        batchSize: schedule.sync_config.batch_size,
        maxRetries: schedule.sync_config.max_retries,
      };

      // Execute sync for each entity
      const results: SyncExecution['results'] = {};

      for (const entity of schedule.entities) {
        try {
          const result = await this.connectorManager.syncConnector(
            schedule.connector_id,
            [entity],
            syncOptions
          );

          results[entity] = result[entity];
        } catch (entityError: any) {
          execution.errors!.push({
            entity,
            message: entityError.message,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Update execution status
      const completedAt = new Date().toISOString();
      const duration = new Date(completedAt).getTime() - new Date(execution.started_at!).getTime();

      await supabase
        .from('sync_executions')
        .update({
          status: 'completed',
          completed_at: completedAt,
          duration_ms: duration,
          results,
          errors: execution.errors,
        })
        .eq('id', executionId);

      // Update schedule's last_sync_at
      await supabase
        .from('sync_schedules')
        .update({
          last_sync_at: completedAt,
          next_sync_at: this.calculateNextSyncTime(schedule.frequency),
        })
        .eq('id', scheduleId);

      console.log(`✅ Sync completed for schedule ${scheduleId} in ${duration}ms`);

      return {
        ...execution,
        id: executionId,
        status: 'completed',
        completed_at: completedAt,
        duration_ms: duration,
        results,
      } as SyncExecution;

    } catch (error: any) {
      // Update execution as failed
      await supabase
        .from('sync_executions')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          errors: [
            ...execution.errors!,
            { entity: 'all', message: error.message, timestamp: new Date().toISOString() }
          ],
        })
        .eq('id', executionId);

      throw error;
    }
  }

  /**
   * Get sync history for a schedule
   */
  async getSyncHistory(scheduleId: string, limit: number = 10): Promise<SyncExecution[]> {
    const { data, error } = await supabase
      .from('sync_executions')
      .select('*')
      .eq('schedule_id', scheduleId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  /**
   * Cancel running sync
   */
  async cancelSync(executionId: string): Promise<void> {
    await supabase
      .from('sync_executions')
      .update({ status: 'cancelled' })
      .eq('id', executionId);
  }

  /**
   * Calculate delay until next sync
   */
  private calculateDelayUntilNextSync(frequency: SyncFrequency): number {
    const delays: Record<string, number> = {
      hourly: 60 * 60 * 1000, // 1 hour
      every_6_hours: 6 * 60 * 60 * 1000, // 6 hours
      daily: 24 * 60 * 60 * 1000, // 24 hours
      weekly: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    return delays[frequency] || delays.daily;
  }

  /**
   * Calculate next sync time
   */
  private calculateNextSyncTime(frequency: SyncFrequency): string {
    const delay = this.calculateDelayUntilNextSync(frequency);
    return new Date(Date.now() + delay).toISOString();
  }

  /**
   * Get all schedules for user
   */
  async getUserSchedules(userId: string): Promise<SyncSchedule[]> {
    const { data, error } = await supabase
      .from('sync_schedules')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Enable/disable schedule
   */
  async toggleSchedule(scheduleId: string, enabled: boolean): Promise<void> {
    await this.updateSchedule(scheduleId, { enabled });
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(scheduleId: string, days: number = 30): Promise<{
    total_syncs: number;
    successful_syncs: number;
    failed_syncs: number;
    avg_duration_ms: number;
    total_items_synced: number;
  }> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data: executions } = await supabase
      .from('sync_executions')
      .select('*')
      .eq('schedule_id', scheduleId)
      .gte('started_at', since);

    if (!executions || executions.length === 0) {
      return {
        total_syncs: 0,
        successful_syncs: 0,
        failed_syncs: 0,
        avg_duration_ms: 0,
        total_items_synced: 0,
      };
    }

    const successful = executions.filter(e => e.status === 'completed');
    const avgDuration = successful.reduce((sum, e) => sum + (e.duration_ms || 0), 0) / successful.length;
    
    const totalItems = executions.reduce((sum, e) => {
      const results = e.results || {};
      return sum + Object.values(results).reduce((s: number, r: any) => s + (r?.imported || 0) + (r?.updated || 0), 0);
    }, 0);

    return {
      total_syncs: executions.length,
      successful_syncs: successful.length,
      failed_syncs: executions.filter(e => e.status === 'failed').length,
      avg_duration_ms: avgDuration,
      total_items_synced: totalItems,
    };
  }
}
