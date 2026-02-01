/**
 * useAuditLog - React hooks for audit logging
 */

import { useCallback, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  auditService, 
  type AuditLogEntry, 
  type AuditLogRecord, 
  type AuditCategory,
  type AuditSeverity,
  type AuditStatistics 
} from '@/services/AuditService';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

interface UseAuditLogOptions {
  category?: AuditCategory;
  severity?: AuditSeverity;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  realtime?: boolean;
}

/**
 * Hook to fetch and subscribe to audit logs
 */
export function useAuditLogs(options: UseAuditLogOptions = {}) {
  const { user } = useUnifiedAuth();
  const [realtimeLogs, setRealtimeLogs] = useState<AuditLogRecord[]>([]);
  const queryClient = useQueryClient();

  const {
    data: logs = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['audit-logs', options],
    queryFn: () => auditService.getAuditTrail(options),
    enabled: !!user,
    staleTime: 30000
  });

  // Realtime subscription for new audit events
  useEffect(() => {
    if (!options.realtime || !user) return;

    const channel = supabase
      .channel('audit-logs-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newLog = payload.new as AuditLogRecord;
          setRealtimeLogs(prev => [newLog, ...prev].slice(0, 50));
          queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [options.realtime, user, queryClient]);

  // Merge realtime logs with query data
  const allLogs = options.realtime 
    ? [...realtimeLogs, ...logs.filter(log => !realtimeLogs.find(r => r.id === log.id))]
    : logs;

  return {
    logs: allLogs,
    isLoading,
    error,
    refetch
  };
}

/**
 * Hook for audit statistics (admin only)
 */
export function useAuditStatistics(days: number = 30) {
  const { user } = useUnifiedAuth();

  return useQuery<AuditStatistics | null>({
    queryKey: ['audit-statistics', days],
    queryFn: () => auditService.getStatistics(days),
    enabled: !!user,
    staleTime: 60000
  });
}

/**
 * Hook to create audit log entries
 */
export function useAuditLogger() {
  const log = useCallback((entry: AuditLogEntry) => {
    return auditService.log(entry);
  }, []);

  const logCreate = useCallback((
    resourceType: string, 
    resourceId: string, 
    resourceName?: string,
    newValues?: Record<string, unknown>
  ) => {
    return auditService.logCreate(resourceType, resourceId, resourceName, newValues);
  }, []);

  const logUpdate = useCallback((
    resourceType: string,
    resourceId: string,
    oldValues?: Record<string, unknown>,
    newValues?: Record<string, unknown>,
    resourceName?: string
  ) => {
    return auditService.logUpdate(resourceType, resourceId, oldValues, newValues, resourceName);
  }, []);

  const logDelete = useCallback((
    resourceType: string,
    resourceId: string,
    resourceName?: string,
    oldValues?: Record<string, unknown>
  ) => {
    return auditService.logDelete(resourceType, resourceId, resourceName, oldValues);
  }, []);

  const logImport = useCallback((
    source: string,
    itemCount: number,
    success: boolean,
    metadata?: Record<string, unknown>
  ) => {
    return auditService.logImport(source, itemCount, success, metadata);
  }, []);

  const logExport = useCallback((
    format: string,
    itemCount: number,
    resourceType: string
  ) => {
    return auditService.logExport(format, itemCount, resourceType);
  }, []);

  const logSecurityEvent = useCallback((
    action: string,
    severity: AuditSeverity,
    description: string,
    metadata?: Record<string, unknown>
  ) => {
    return auditService.logSecurityEvent(action, severity, description, metadata);
  }, []);

  return {
    log,
    logCreate,
    logUpdate,
    logDelete,
    logImport,
    logExport,
    logSecurityEvent
  };
}

/**
 * HOC-style hook that automatically logs component actions
 */
export function useAuditedAction<T extends (...args: unknown[]) => Promise<unknown>>(
  action: T,
  auditConfig: {
    actionName: string;
    category: AuditCategory;
    resourceType?: string;
    getResourceId?: (...args: Parameters<T>) => string;
    getResourceName?: (...args: Parameters<T>) => string;
  }
) {
  const { log } = useAuditLogger();

  const auditedAction = useCallback(async (...args: Parameters<T>) => {
    const startTime = Date.now();
    
    try {
      const result = await action(...args);
      
      await log({
        action: auditConfig.actionName,
        actionCategory: auditConfig.category,
        severity: 'info',
        resourceType: auditConfig.resourceType,
        resourceId: auditConfig.getResourceId?.(...args),
        resourceName: auditConfig.getResourceName?.(...args),
        metadata: { duration_ms: Date.now() - startTime }
      });
      
      return result;
    } catch (error) {
      await log({
        action: `${auditConfig.actionName}_failed`,
        actionCategory: auditConfig.category,
        severity: 'error',
        resourceType: auditConfig.resourceType,
        resourceId: auditConfig.getResourceId?.(...args),
        description: error instanceof Error ? error.message : 'Unknown error',
        metadata: { duration_ms: Date.now() - startTime }
      });
      
      throw error;
    }
  }, [action, auditConfig, log]);

  return auditedAction as T;
}
