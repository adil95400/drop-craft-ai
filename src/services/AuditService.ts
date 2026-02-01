/**
 * AuditService - Centralized audit logging for the application
 * Provides structured logging for all critical actions
 */

import { supabase } from '@/integrations/supabase/client';

export type AuditCategory = 
  | 'auth' 
  | 'data' 
  | 'admin' 
  | 'api' 
  | 'import' 
  | 'export' 
  | 'integration' 
  | 'billing' 
  | 'security' 
  | 'system' 
  | 'automation';

export type AuditSeverity = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export type ActorType = 'user' | 'system' | 'api' | 'webhook' | 'cron' | 'admin';

export interface AuditLogEntry {
  action: string;
  actionCategory: AuditCategory;
  severity?: AuditSeverity;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  description?: string;
  metadata?: Record<string, unknown>;
  actorType?: ActorType;
}

export interface AuditLogRecord {
  id: string;
  actor_email: string | null;
  actor_type: string;
  action: string;
  action_category: string;
  severity: string;
  resource_type: string | null;
  resource_id: string | null;
  resource_name: string | null;
  description: string | null;
  changed_fields: string[] | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AuditStatistics {
  total_events: number;
  unique_users: number;
  by_category: Record<string, number>;
  by_severity: Record<string, number>;
  critical_events: number;
  daily_trend: Array<{ date: string; count: number }>;
}

class AuditService {
  private sessionId: string;
  private pendingLogs: AuditLogEntry[] = [];
  private flushTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log an audit event
   */
  async log(entry: AuditLogEntry): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('create_audit_log', {
        p_action: entry.action,
        p_action_category: entry.actionCategory,
        p_severity: entry.severity || 'info',
        p_resource_type: entry.resourceType || null,
        p_resource_id: entry.resourceId || null,
        p_resource_name: entry.resourceName || null,
        p_old_values: entry.oldValues ? JSON.stringify(entry.oldValues) : null,
        p_new_values: entry.newValues ? JSON.stringify(entry.newValues) : null,
        p_description: entry.description || null,
        p_metadata: entry.metadata ? JSON.stringify({ ...entry.metadata, session_id: this.sessionId }) : JSON.stringify({ session_id: this.sessionId }),
        p_actor_type: entry.actorType || 'user'
      });

      if (error) {
        console.error('Failed to create audit log:', error);
        return null;
      }

      return data as string;
    } catch (err) {
      console.error('Audit logging error:', err);
      return null;
    }
  }

  /**
   * Batch log multiple entries (queued for efficiency)
   */
  queueLog(entry: AuditLogEntry): void {
    this.pendingLogs.push(entry);
    
    if (!this.flushTimeout) {
      this.flushTimeout = setTimeout(() => this.flushLogs(), 1000);
    }
  }

  private async flushLogs(): Promise<void> {
    this.flushTimeout = null;
    const logs = [...this.pendingLogs];
    this.pendingLogs = [];

    await Promise.all(logs.map(log => this.log(log)));
  }

  // ==================== AUTH EVENTS ====================
  
  logLogin(success: boolean, method: string = 'email', metadata?: Record<string, unknown>): Promise<string | null> {
    return this.log({
      action: success ? 'user_login' : 'user_login_failed',
      actionCategory: 'auth',
      severity: success ? 'info' : 'warn',
      description: success ? `User logged in via ${method}` : `Login attempt failed via ${method}`,
      metadata: { method, ...metadata }
    });
  }

  logLogout(): Promise<string | null> {
    return this.log({
      action: 'user_logout',
      actionCategory: 'auth',
      severity: 'info',
      description: 'User logged out'
    });
  }

  logPasswordChange(success: boolean): Promise<string | null> {
    return this.log({
      action: 'password_change',
      actionCategory: 'auth',
      severity: success ? 'info' : 'warn',
      description: success ? 'Password changed successfully' : 'Password change failed'
    });
  }

  // ==================== DATA EVENTS ====================

  logCreate(resourceType: string, resourceId: string, resourceName?: string, newValues?: Record<string, unknown>): Promise<string | null> {
    return this.log({
      action: `${resourceType}_created`,
      actionCategory: 'data',
      severity: 'info',
      resourceType,
      resourceId,
      resourceName,
      newValues,
      description: `Created ${resourceType}: ${resourceName || resourceId}`
    });
  }

  logUpdate(
    resourceType: string, 
    resourceId: string, 
    oldValues?: Record<string, unknown>, 
    newValues?: Record<string, unknown>,
    resourceName?: string
  ): Promise<string | null> {
    return this.log({
      action: `${resourceType}_updated`,
      actionCategory: 'data',
      severity: 'info',
      resourceType,
      resourceId,
      resourceName,
      oldValues,
      newValues,
      description: `Updated ${resourceType}: ${resourceName || resourceId}`
    });
  }

  logDelete(resourceType: string, resourceId: string, resourceName?: string, oldValues?: Record<string, unknown>): Promise<string | null> {
    return this.log({
      action: `${resourceType}_deleted`,
      actionCategory: 'data',
      severity: 'warn',
      resourceType,
      resourceId,
      resourceName,
      oldValues,
      description: `Deleted ${resourceType}: ${resourceName || resourceId}`
    });
  }

  // ==================== ADMIN EVENTS ====================

  logAdminAction(action: string, targetUserId?: string, metadata?: Record<string, unknown>): Promise<string | null> {
    return this.log({
      action: `admin_${action}`,
      actionCategory: 'admin',
      severity: 'warn',
      resourceType: targetUserId ? 'user' : undefined,
      resourceId: targetUserId,
      metadata,
      actorType: 'admin',
      description: `Admin action: ${action}`
    });
  }

  // ==================== IMPORT/EXPORT EVENTS ====================

  logImport(source: string, itemCount: number, success: boolean, metadata?: Record<string, unknown>): Promise<string | null> {
    return this.log({
      action: success ? 'import_completed' : 'import_failed',
      actionCategory: 'import',
      severity: success ? 'info' : 'error',
      resourceType: 'import',
      description: success 
        ? `Imported ${itemCount} items from ${source}` 
        : `Import from ${source} failed`,
      metadata: { source, item_count: itemCount, ...metadata }
    });
  }

  logExport(format: string, itemCount: number, resourceType: string): Promise<string | null> {
    return this.log({
      action: 'data_exported',
      actionCategory: 'export',
      severity: 'info',
      resourceType,
      description: `Exported ${itemCount} ${resourceType} items as ${format}`,
      metadata: { format, item_count: itemCount }
    });
  }

  // ==================== INTEGRATION EVENTS ====================

  logIntegrationConnect(platform: string, success: boolean, metadata?: Record<string, unknown>): Promise<string | null> {
    return this.log({
      action: success ? 'integration_connected' : 'integration_connect_failed',
      actionCategory: 'integration',
      severity: success ? 'info' : 'error',
      resourceType: 'integration',
      resourceName: platform,
      description: success 
        ? `Connected to ${platform}` 
        : `Failed to connect to ${platform}`,
      metadata
    });
  }

  logIntegrationSync(platform: string, syncType: string, itemCount: number, success: boolean): Promise<string | null> {
    return this.log({
      action: success ? 'integration_sync_completed' : 'integration_sync_failed',
      actionCategory: 'integration',
      severity: success ? 'info' : 'error',
      resourceType: 'sync',
      resourceName: `${platform}_${syncType}`,
      description: success 
        ? `Synced ${itemCount} ${syncType} with ${platform}` 
        : `Sync with ${platform} failed`,
      metadata: { platform, sync_type: syncType, item_count: itemCount }
    });
  }

  // ==================== SECURITY EVENTS ====================

  logSecurityEvent(
    action: string, 
    severity: AuditSeverity, 
    description: string, 
    metadata?: Record<string, unknown>
  ): Promise<string | null> {
    return this.log({
      action,
      actionCategory: 'security',
      severity,
      description,
      metadata
    });
  }

  // ==================== API EVENTS ====================

  logApiCall(endpoint: string, method: string, statusCode: number, durationMs: number): Promise<string | null> {
    const severity: AuditSeverity = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'debug';
    
    return this.log({
      action: 'api_call',
      actionCategory: 'api',
      severity,
      resourceType: 'endpoint',
      resourceName: `${method} ${endpoint}`,
      metadata: { endpoint, method, status_code: statusCode, duration_ms: durationMs }
    });
  }

  // ==================== QUERY METHODS ====================

  async getAuditTrail(options?: {
    category?: AuditCategory;
    severity?: AuditSeverity;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<AuditLogRecord[]> {
    try {
      const { data, error } = await supabase.rpc('get_user_audit_trail', {
        p_user_id: null,
        p_category: options?.category || null,
        p_severity: options?.severity || null,
        p_from_date: options?.fromDate?.toISOString() || null,
        p_to_date: options?.toDate?.toISOString() || null,
        p_limit: options?.limit || 100,
        p_offset: options?.offset || 0
      });

      if (error) throw error;
      return (data || []) as AuditLogRecord[];
    } catch (err) {
      console.error('Failed to fetch audit trail:', err);
      return [];
    }
  }

  async getStatistics(days: number = 30): Promise<AuditStatistics | null> {
    try {
      const { data, error } = await supabase.rpc('get_audit_statistics', {
        p_days: days
      });

      if (error) throw error;
      
      // Safely parse the response
      if (!data || typeof data !== 'object') return null;
      
      const stats = data as unknown as AuditStatistics;
      return stats;
    } catch (err) {
      console.error('Failed to fetch audit statistics:', err);
      return null;
    }
  }
}

export const auditService = new AuditService();
