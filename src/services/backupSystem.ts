import { supabase } from '@/integrations/supabase/client';

export interface BackupConfig {
  tables: string[];
  includeStorage: boolean;
  compression: boolean;
  encryption: boolean;
  description?: string;
}

export interface BackupInfo {
  id: string;
  name: string;
  description: string;
  size: number;
  tables: string[];
  createdAt: string;
  type: 'manual' | 'automatic';
  status: 'creating' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt: string;
  user_id?: string;
}

export interface RestorePoint {
  timestamp: string;
  size: number;
  tables: string[];
  description: string;
}

export class BackupSystem {
  private static instance: BackupSystem;
  
  static getInstance(): BackupSystem {
    if (!BackupSystem.instance) {
      BackupSystem.instance = new BackupSystem();
    }
    return BackupSystem.instance;
  }

  /**
   * Create a manual backup
   */
  async createBackup(config: BackupConfig): Promise<string> {
    try {
      const backupId = crypto.randomUUID();
      const timestamp = new Date().toISOString();
      
      // Log backup initiation
      await supabase.from('security_events').insert({
        event_type: 'backup_initiated',
        severity: 'info',
        description: `Manual backup started: ${config.description || 'No description'}`,
        metadata: {
          backup_id: backupId,
          tables: config.tables,
          include_storage: config.includeStorage
        }
      });

      // Create backup record
      const backupInfo: Omit<BackupInfo, 'downloadUrl'> = {
        id: backupId,
        name: `backup_${timestamp.replace(/[:.]/g, '-')}`,
        description: config.description || `Manual backup ${new Date().toLocaleString()}`,
        size: 0, // Will be updated when backup completes
        tables: config.tables,
        createdAt: timestamp,
        type: 'manual',
        status: 'creating',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      };

      // Store backup info in activity logs instead
      await supabase.from('activity_logs').insert({
        user_id: (backupInfo as any).user_id,
        action: 'backup_created',
        description: backupInfo.description,
        entity_type: 'backup',
        entity_id: backupInfo.id,
        metadata: {
          backup_id: backupInfo.id,
          tables: backupInfo.tables,
          type: backupInfo.type,
          status: backupInfo.status
        }
      });

      // Initiate backup process
      const { data, error } = await supabase.functions.invoke('create-backup', {
        body: {
          backupId,
          config
        }
      });

      if (error) throw error;

      return backupId;
    } catch (error) {
      console.error('Backup creation failed:', error);
      throw error;
    }
  }

  /**
   * Get all available backups
   */
  async getBackups(): Promise<BackupInfo[]> {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('action', 'backup_created')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform activity logs to BackupInfo format
      return (data || []).map(log => {
        const details = (log.details || {}) as any;
        return {
          id: log.entity_id || log.id,
          name: `backup_${log.created_at}`,
          description: log.description || '',
          size: 0,
          tables: details?.tables || [],
          createdAt: log.created_at || '',
          type: details?.type || 'manual',
          status: details?.status || 'completed',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
      }) as BackupInfo[];
    } catch (error) {
      console.error('Failed to fetch backups:', error);
      return [];
    }
  }

  /**
   * Delete a backup
   */
  async deleteBackup(backupId: string): Promise<boolean> {
    try {
      // Remove from storage
      await supabase.functions.invoke('delete-backup', {
        body: { backupId }
      });

      // Remove record from activity logs
      const { error } = await supabase
        .from('activity_logs')
        .delete()
        .eq('entity_id', backupId)
        .eq('action', 'backup_created');

      if (error) throw error;

      // Log deletion
      await supabase.from('security_events').insert({
        event_type: 'backup_deleted',
        severity: 'info',
        description: `Backup deleted: ${backupId}`,
        metadata: { backup_id: backupId }
      });

      return true;
    } catch (error) {
      console.error('Backup deletion failed:', error);
      return false;
    }
  }

  /**
   * Restore from backup
   */
  async restoreBackup(backupId: string, options: {
    tables?: string[];
    confirmOverwrite: boolean;
  }): Promise<boolean> {
    try {
      if (!options.confirmOverwrite) {
        throw new Error('Restore operation requires explicit confirmation');
      }

      // Log restore initiation
      await supabase.from('security_events').insert({
        event_type: 'restore_initiated',
        severity: 'critical',
        description: `Database restore initiated from backup: ${backupId}`,
        metadata: {
          backup_id: backupId,
          tables: options.tables
        }
      });

      const { data, error } = await supabase.functions.invoke('restore-backup', {
        body: {
          backupId,
          options
        }
      });

      if (error) throw error;

      // Log successful restore
      await supabase.from('security_events').insert({
        event_type: 'restore_completed',
        severity: 'info',
        description: `Database restore completed successfully`,
        metadata: {
          backup_id: backupId,
          restore_job_id: data.jobId
        }
      });

      return true;
    } catch (error) {
      console.error('Restore failed:', error);
      
      // Log failed restore
      await supabase.from('security_events').insert({
        event_type: 'restore_failed',
        severity: 'error',
        description: `Database restore failed: ${error.message}`,
        metadata: {
          backup_id: backupId,
          error: error.message
        }
      });
      
      return false;
    }
  }

  /**
   * Schedule automatic backups
   */
  async scheduleAutomaticBackups(schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string; // HH:MM format
    retention: number; // days
    tables: string[];
  }): Promise<boolean> {
    try {
      const { error } = await supabase.functions.invoke('schedule-backups', {
        body: { schedule }
      });

      if (error) throw error;

      // Log scheduling
      await supabase.from('security_events').insert({
        event_type: 'backup_scheduled',
        severity: 'info',
        description: `Automatic backups scheduled: ${schedule.frequency} at ${schedule.time}`,
        metadata: { schedule }
      });

      return true;
    } catch (error) {
      console.error('Backup scheduling failed:', error);
      return false;
    }
  }

  /**
   * Get backup statistics
   */
  async getBackupStatistics(): Promise<{
    totalBackups: number;
    totalSize: number;
    lastBackup: string | null;
    nextScheduledBackup: string | null;
    successRate: number;
  }> {
    try {
      const { data: backups } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('action', 'backup_created');

      // No schedule table, use default values
      const schedule = null;

      const totalBackups = backups?.length || 0;
      const totalSize = 0; // Size not available in activity logs
      const lastBackup = backups?.[0]?.created_at || null;
      const successfulBackups = backups?.filter(b => ((b.details || {}) as any)?.status === 'completed').length || 0;
      const successRate = totalBackups > 0 ? (successfulBackups / totalBackups) * 100 : 0;

      let nextScheduledBackup = null;
      if (schedule) {
        // Calculate next backup time based on schedule
        const now = new Date();
        const [hours, minutes] = schedule.time.split(':').map(Number);
        const nextBackup = new Date(now);
        nextBackup.setHours(hours, minutes, 0, 0);
        
        // If time has passed today, schedule for next occurrence
        if (nextBackup <= now) {
          switch (schedule.frequency) {
            case 'daily':
              nextBackup.setDate(nextBackup.getDate() + 1);
              break;
            case 'weekly':
              nextBackup.setDate(nextBackup.getDate() + 7);
              break;
            case 'monthly':
              nextBackup.setMonth(nextBackup.getMonth() + 1);
              break;
          }
        }
        
        nextScheduledBackup = nextBackup.toISOString();
      }

      return {
        totalBackups,
        totalSize,
        lastBackup,
        nextScheduledBackup,
        successRate
      };
    } catch (error) {
      console.error('Failed to get backup statistics:', error);
      return {
        totalBackups: 0,
        totalSize: 0,
        lastBackup: null,
        nextScheduledBackup: null,
        successRate: 0
      };
    }
  }

  /**
   * Test backup integrity
   */
  async testBackupIntegrity(backupId: string): Promise<{
    valid: boolean;
    issues: string[];
    tables: { [table: string]: { records: number; valid: boolean } };
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('test-backup-integrity', {
        body: { backupId }
      });

      if (error) throw error;

      // Log integrity test
      await supabase.from('security_events').insert({
        event_type: 'backup_integrity_test',
        severity: 'info',
        description: `Backup integrity test ${data.valid ? 'passed' : 'failed'}: ${backupId}`,
        metadata: {
          backup_id: backupId,
          issues: data.issues,
          result: data
        }
      });

      return data;
    } catch (error) {
      console.error('Backup integrity test failed:', error);
      return {
        valid: false,
        issues: ['Integrity test failed to execute'],
        tables: {}
      };
    }
  }

  /**
   * Export backup metadata
   */
  async exportBackupManifest(): Promise<string> {
    try {
      const backups = await this.getBackups();
      const statistics = await this.getBackupStatistics();
      
      const manifest = {
        generatedAt: new Date().toISOString(),
        statistics,
        backups: backups.map(b => ({
          id: b.id,
          name: b.name,
          description: b.description,
          size: b.size,
          tables: b.tables,
          createdAt: b.createdAt,
          type: b.type,
          status: b.status
        }))
      };

      const blob = new Blob([JSON.stringify(manifest, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-manifest-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return 'Manifest exported successfully';
    } catch (error) {
      console.error('Failed to export backup manifest:', error);
      throw error;
    }
  }

  /**
   * Clean expired backups
   */
  async cleanExpiredBackups(): Promise<number> {
    try {
      const now = new Date().toISOString();
      
      const { data: expiredBackups } = await supabase
        .from('activity_logs')
        .select('id, entity_id')
        .eq('action', 'backup_created')
        .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (!expiredBackups || expiredBackups.length === 0) {
        return 0;
      }

      // Delete expired backups
      for (const backup of expiredBackups) {
        await this.deleteBackup(backup.entity_id || backup.id);
      }

      // Log cleanup
      await supabase.from('security_events').insert({
        event_type: 'backup_cleanup',
        severity: 'info',
        description: `Cleaned up ${expiredBackups.length} expired backup(s)`,
        metadata: {
          cleaned_count: expiredBackups.length,
          cleanup_date: now
        }
      });

      return expiredBackups.length;
    } catch (error) {
      console.error('Backup cleanup failed:', error);
      return 0;
    }
  }
}

export const backupSystem = BackupSystem.getInstance();