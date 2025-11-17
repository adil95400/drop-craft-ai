import { supabase } from '@/integrations/supabase/client';
import { ConnectorManager } from './ConnectorManager';

export type SyncFrequency = 'hourly' | 'every_6_hours' | 'daily' | 'weekly';

export interface SyncSchedule {
  id: string;
  integration_id: string;
  user_id: string;
  sync_type: string;
  frequency_minutes: number;
  is_active: boolean;
  last_run_at?: string;
  next_run_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SyncExecution {
  schedule_id: string;
  status: 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  results: any;
  errors: any[];
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
  async createSchedule(
    integration_id: string,
    user_id: string,
    frequency_minutes: number,
    sync_type: string = 'products'
  ): Promise<SyncSchedule> {
    const { data, error } = await supabase
      .from('sync_schedules')
      .insert({
        integration_id,
        user_id,
        sync_type,
        frequency_minutes,
        is_active: true,
        next_run_at: new Date(Date.now() + frequency_minutes * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    this.scheduleSync(data);
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
    if (updates.frequency_minutes !== undefined || updates.is_active !== undefined) {
      this.unscheduleSync(scheduleId);
      if (data.is_active) {
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
    if (!schedule.is_active) return;

    const delay = schedule.frequency_minutes * 60 * 1000;
    
    const jobId = setTimeout(async () => {
      await this.executeSync(schedule.id);
      // Reschedule for next execution
      this.scheduleSync(schedule);
    }, delay);

    this.scheduledJobs.set(schedule.id, jobId);
    console.log(`📅 Scheduled sync for ${schedule.integration_id} - Next run in ${delay}ms`);
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
  async executeSync(scheduleId: string): Promise<any> {
    const { data: schedule } = await supabase
      .from('sync_schedules')
      .select('*')
      .eq('id', scheduleId)
      .single();

    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found`);
    }

    const startedAt = new Date().toISOString();

    try {
      // Use last_run_at for delta sync
      const syncOptions = {
        since: schedule.last_run_at,
        batchSize: 100,
        maxRetries: 3,
      };

      // Execute sync via connector manager
      const result = await this.connectorManager.syncConnector(
        schedule.integration_id,
        ['products'], // Default to products, can be extended
        syncOptions
      );

      const completedAt = new Date().toISOString();
      const duration = new Date(completedAt).getTime() - new Date(startedAt).getTime();

      // Update schedule
      await supabase
        .from('sync_schedules')
        .update({
          last_run_at: completedAt,
          next_run_at: new Date(Date.now() + schedule.frequency_minutes * 60 * 1000).toISOString(),
        })
        .eq('id', scheduleId);

      console.log(`✅ Sync completed for schedule ${scheduleId} in ${duration}ms`);

      return {
        schedule_id: scheduleId,
        status: 'completed',
        started_at: startedAt,
        completed_at: completedAt,
        duration_ms: duration,
        results: result,
      };

    } catch (error: any) {
      console.error(`❌ Sync failed for schedule ${scheduleId}:`, error);

      return {
        schedule_id: scheduleId,
        status: 'failed',
        started_at: startedAt,
        completed_at: new Date().toISOString(),
        errors: [{ entity: 'all', message: error.message, timestamp: new Date().toISOString() }],
      };
    }
  }

  /**
   * Get sync history for a schedule
   */
  async getSyncHistory(scheduleId: string): Promise<any[]> {
    // Return from activity logs or marketplace_sync_logs
    const { data } = await supabase
      .from('marketplace_sync_logs')
      .select('*')
      .eq('integration_id', scheduleId)
      .order('synced_at', { ascending: false })
      .limit(20);

    return data || [];
  }

  /**
   * Get all schedules for user
   */
  async getUserSchedules(userId: string): Promise<SyncSchedule[]> {
    const { data, error } = await supabase
      .from('sync_schedules')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Enable/disable schedule
   */
  async toggleSchedule(scheduleId: string, enabled: boolean): Promise<void> {
    await this.updateSchedule(scheduleId, { is_active: enabled });
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(scheduleId: string, days: number = 30): Promise<{
    total_syncs: number;
    avg_duration_ms: number;
    total_items_synced: number;
  }> {
    const { data: logs } = await supabase
      .from('marketplace_sync_logs')
      .select('*')
      .eq('integration_id', scheduleId)
      .gte('synced_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    return {
      total_syncs: logs?.length || 0,
      avg_duration_ms: 0,
      total_items_synced: logs?.reduce((sum, log) => sum + (log.products_synced || 0) + (log.orders_synced || 0), 0) || 0,
    };
  }
}
