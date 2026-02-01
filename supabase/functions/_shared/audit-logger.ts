/**
 * Audit Logger for Edge Functions
 * Provides structured audit logging with consistent format
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

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

export interface AuditLogParams {
  action: string;
  category: AuditCategory;
  severity?: AuditSeverity;
  userId?: string | null;
  actorType?: ActorType;
  actorEmail?: string;
  actorIp?: string;
  actorUserAgent?: string;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  description?: string;
  metadata?: Record<string, unknown>;
  requestId?: string;
}

/**
 * Create an audit log entry in the database
 */
export async function createAuditLog(
  supabase: SupabaseClient,
  params: AuditLogParams
): Promise<string | null> {
  try {
    // Calculate changed fields if both old and new values provided
    let changedFields: string[] | null = null;
    if (params.oldValues && params.newValues) {
      changedFields = Object.keys(params.newValues).filter(
        key => JSON.stringify(params.oldValues?.[key]) !== JSON.stringify(params.newValues?.[key])
      );
    }

    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: params.userId || null,
        actor_type: params.actorType || 'system',
        actor_email: params.actorEmail || null,
        actor_ip: params.actorIp || null,
        actor_user_agent: params.actorUserAgent || null,
        action: params.action,
        action_category: params.category,
        severity: params.severity || 'info',
        resource_type: params.resourceType || null,
        resource_id: params.resourceId || null,
        resource_name: params.resourceName || null,
        old_values: params.oldValues || null,
        new_values: params.newValues || null,
        changed_fields: changedFields,
        description: params.description || null,
        metadata: params.metadata || {},
        request_id: params.requestId || null
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create audit log:', error);
      return null;
    }

    return data?.id || null;
  } catch (err) {
    console.error('Audit logging error:', err);
    return null;
  }
}

/**
 * Create an audit logger bound to a specific request context
 */
export function createAuditLogger(
  supabase: SupabaseClient,
  context: {
    userId?: string | null;
    actorType?: ActorType;
    actorEmail?: string;
    actorIp?: string;
    actorUserAgent?: string;
    requestId?: string;
  }
) {
  return {
    log: (params: Omit<AuditLogParams, 'userId' | 'actorType' | 'actorIp' | 'actorUserAgent' | 'requestId'>) =>
      createAuditLog(supabase, { ...context, ...params }),

    info: (action: string, category: AuditCategory, description?: string, metadata?: Record<string, unknown>) =>
      createAuditLog(supabase, { ...context, action, category, severity: 'info', description, metadata }),

    warn: (action: string, category: AuditCategory, description?: string, metadata?: Record<string, unknown>) =>
      createAuditLog(supabase, { ...context, action, category, severity: 'warn', description, metadata }),

    error: (action: string, category: AuditCategory, description?: string, metadata?: Record<string, unknown>) =>
      createAuditLog(supabase, { ...context, action, category, severity: 'error', description, metadata }),

    critical: (action: string, category: AuditCategory, description?: string, metadata?: Record<string, unknown>) =>
      createAuditLog(supabase, { ...context, action, category, severity: 'critical', description, metadata }),

    // Specialized loggers
    logDataChange: (
      action: string,
      resourceType: string,
      resourceId: string,
      oldValues?: Record<string, unknown>,
      newValues?: Record<string, unknown>
    ) => createAuditLog(supabase, {
      ...context,
      action,
      category: 'data',
      severity: 'info',
      resourceType,
      resourceId,
      oldValues,
      newValues
    }),

    logImport: (source: string, itemCount: number, success: boolean, details?: Record<string, unknown>) =>
      createAuditLog(supabase, {
        ...context,
        action: success ? 'import_completed' : 'import_failed',
        category: 'import',
        severity: success ? 'info' : 'error',
        description: success 
          ? `Imported ${itemCount} items from ${source}`
          : `Import from ${source} failed`,
        metadata: { source, item_count: itemCount, ...details }
      }),

    logApiCall: (endpoint: string, method: string, statusCode: number, durationMs: number) =>
      createAuditLog(supabase, {
        ...context,
        action: 'api_call',
        category: 'api',
        severity: statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'debug',
        resourceType: 'endpoint',
        resourceName: `${method} ${endpoint}`,
        metadata: { endpoint, method, status_code: statusCode, duration_ms: durationMs }
      }),

    logSecurityEvent: (action: string, severity: AuditSeverity, description: string, metadata?: Record<string, unknown>) =>
      createAuditLog(supabase, {
        ...context,
        action,
        category: 'security',
        severity,
        description,
        metadata
      })
  };
}

/**
 * Extract audit context from a request
 */
export function extractAuditContext(req: Request): {
  actorIp: string;
  actorUserAgent: string;
  requestId: string;
} {
  return {
    actorIp: req.headers.get('x-forwarded-for')?.split(',')[0].trim() 
      || req.headers.get('x-real-ip') 
      || 'unknown',
    actorUserAgent: req.headers.get('user-agent') || 'unknown',
    requestId: req.headers.get('x-request-id') || crypto.randomUUID()
  };
}
