/**
 * Event Bus Processor — Unified Event-Driven Architecture
 *
 * Consumes events from BOTH:
 *  1. `event_outbox` (trigger-based, new system)
 *  2. `unified_sync_queue` (legacy, backward compat)
 *
 * Actions:
 *  - process_queue: Process pending events from both sources
 *  - process_outbox: Process only event_outbox
 *  - process_legacy: Process only unified_sync_queue
 *  - dlq_retry: Retry dead-letter events
 *  - stats: Get queue statistics
 *  - cleanup: Remove old completed events
 *
 * SECURITY: CRON_SECRET or admin JWT required.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getSecureCorsHeaders, handleCorsPreflightSecure } from '../_shared/secure-cors.ts';

const MAX_RETRIES = 3;
const OUTBOX_BATCH = 50;
const LEGACY_BATCH = 25;
const HANDLER_TIMEOUT_MS = 15000;

// ── Route map: event_type → Edge Function handler ──
const OUTBOX_HANDLERS: Record<string, string> = {
  'products.created':      'sync-connected-stores',
  'products.updated':      'sync-connected-stores',
  'products.deleted':      'sync-connected-stores',
  'orders.created':        'order-hub',
  'orders.updated':        'order-hub',
  'orders.deleted':        'order-hub',
  'customers.created':     'sync-connected-stores',
  'customers.updated':     'sync-connected-stores',
  'customers.deleted':     'sync-connected-stores',
  'pricing_rules.created': 'pricing-rules-engine',
  'pricing_rules.updated': 'pricing-rules-engine',
  'pricing_rules.deleted': 'pricing-rules-engine',
};

const LEGACY_HANDLERS: Record<string, string> = {
  products:  'sync-connected-stores',
  orders:    'order-hub',
  customers: 'sync-connected-stores',
  pricing:   'pricing-rules-engine',
  stock:     'stock-price-sync',
  marketing: 'dynamic-campaigns',
};

// ── Types ──
interface OutboxEvent {
  id: string;
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
  user_id: string;
  payload: any;
  old_data: any;
  new_data: any;
  status: string;
  retry_count: number;
  priority: number;
  correlation_id: string | null;
  created_at: string;
}

interface LegacyEvent {
  id: string;
  user_id: string;
  sync_type: string;
  entity_type: string;
  entity_id: string;
  action: string;
  channels: any;
  payload: any;
  priority: number;
  status: string;
  retry_count: number;
  error_message: string | null;
  created_at: string;
}

Deno.serve(async (req) => {
  const corsHeaders = getSecureCorsHeaders(req);
  if (req.method === 'OPTIONS') return handleCorsPreflightSecure(req);

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const CRON_SECRET = Deno.env.get('CRON_SECRET');

    // ── AUTH ──
    const cronSecret = req.headers.get('x-cron-secret');
    const authHeader = req.headers.get('Authorization');

    if (cronSecret) {
      if (!CRON_SECRET || cronSecret !== CRON_SECRET) {
        return json(corsHeaders, { error: 'Unauthorized' }, 403);
      }
    } else if (authHeader) {
      const supabase = createClient(supabaseUrl, serviceKey);
      const token = authHeader.replace('Bearer ', '');
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data?.user) return json(corsHeaders, { error: 'Invalid token' }, 401);
      const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: data.user.id, _role: 'admin' });
      if (!isAdmin) return json(corsHeaders, { error: 'Admin required' }, 403);
    } else {
      return json(corsHeaders, { error: 'Auth required' }, 401);
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'process_queue';

    console.log(`[event-bus] Action: ${action}`);

    // ── STATS ──
    if (action === 'stats') {
      const [outboxStats, legacyStats] = await Promise.all([
        getOutboxStats(supabase),
        getLegacyStats(supabase),
      ]);
      return json(corsHeaders, {
        success: true,
        outbox: outboxStats,
        legacy: legacyStats,
        duration_ms: Date.now() - startTime,
      });
    }

    // ── CLEANUP ──
    if (action === 'cleanup') {
      const days = body.days || 7;
      const { data: deleted } = await supabase.rpc('cleanup_event_outbox', { p_days: days });
      return json(corsHeaders, { success: true, deleted_events: deleted, duration_ms: Date.now() - startTime });
    }

    // ── DLQ RETRY ──
    if (action === 'dlq_retry') {
      const [outboxResult, legacyResult] = await Promise.all([
        retryOutboxDeadLetters(supabase),
        retryLegacyDeadLetters(supabase),
      ]);
      return json(corsHeaders, {
        success: true,
        outbox: outboxResult,
        legacy: legacyResult,
        duration_ms: Date.now() - startTime,
      });
    }

    // ── PROCESS ──
    let outboxResult = { processed: 0, succeeded: 0, failed: 0, dead_lettered: 0 };
    let legacyResult = { processed: 0, succeeded: 0, failed: 0, dead_lettered: 0 };

    if (action === 'process_queue' || action === 'process_outbox') {
      outboxResult = await processOutbox(supabase, supabaseUrl, serviceKey);
    }
    if (action === 'process_queue' || action === 'process_legacy') {
      legacyResult = await processLegacyQueue(supabase, supabaseUrl, serviceKey);
    }

    const totalProcessed = outboxResult.processed + legacyResult.processed;
    const totalFailed = outboxResult.failed + legacyResult.failed;

    // Log activity
    if (totalProcessed > 0) {
      await supabase.from('activity_logs').insert({
        action: 'event_bus_processed',
        entity_type: 'system',
        description: `Event bus: ${totalProcessed} events (${outboxResult.processed} outbox, ${legacyResult.processed} legacy), ${totalFailed} failed — ${Date.now() - startTime}ms`,
        details: { outbox: outboxResult, legacy: legacyResult },
        source: 'event_bus_processor',
        severity: totalFailed > 0 ? 'warn' : 'info',
      });
    }

    return json(corsHeaders, {
      success: true,
      outbox: outboxResult,
      legacy: legacyResult,
      duration_ms: Date.now() - startTime,
    });
  } catch (error) {
    console.error('[event-bus] Fatal:', error);
    return json(corsHeaders, { error: String(error) }, 500);
  }
});

// ════════════════════════════════════════════════════════════
// OUTBOX PROCESSING (new event-driven system)
// ════════════════════════════════════════════════════════════

async function processOutbox(supabase: any, supabaseUrl: string, serviceKey: string) {
  const { data: events, error } = await supabase
    .from('event_outbox')
    .select('*')
    .in('status', ['pending', 'failed'])
    .lt('retry_count', MAX_RETRIES)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(OUTBOX_BATCH);

  if (error || !events?.length) {
    return { processed: 0, succeeded: 0, failed: 0, dead_lettered: 0 };
  }

  let succeeded = 0, failed = 0, deadLettered = 0;

  for (const evt of events as OutboxEvent[]) {
    // Mark processing
    await supabase.from('event_outbox')
      .update({ status: 'processing', processed_at: new Date().toISOString() })
      .eq('id', evt.id);

    try {
      await dispatchOutboxEvent(supabaseUrl, serviceKey, evt);

      await supabase.from('event_outbox')
        .update({ status: 'completed', completed_at: new Date().toISOString(), error_message: null })
        .eq('id', evt.id);
      succeeded++;
    } catch (err: any) {
      const newRetry = (evt.retry_count || 0) + 1;
      const errorMsg = String(err).slice(0, 500);

      if (newRetry >= MAX_RETRIES) {
        await supabase.from('event_outbox')
          .update({ status: 'dead_letter', retry_count: newRetry, error_message: errorMsg, completed_at: new Date().toISOString() })
          .eq('id', evt.id);
        deadLettered++;
        console.error(`[event-bus] Outbox ${evt.id} dead-lettered: ${errorMsg}`);
      } else {
        await supabase.from('event_outbox')
          .update({ status: 'failed', retry_count: newRetry, error_message: errorMsg })
          .eq('id', evt.id);
        console.warn(`[event-bus] Outbox ${evt.id} retry #${newRetry}`);
      }
      failed++;
    }
  }

  return { processed: events.length, succeeded, failed, dead_lettered: deadLettered };
}

async function dispatchOutboxEvent(supabaseUrl: string, serviceKey: string, evt: OutboxEvent) {
  const handler = OUTBOX_HANDLERS[evt.event_type] || 'sync-connected-stores';
  const url = `${supabaseUrl}/functions/v1/${handler}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HANDLER_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        action: 'outbox_event',
        event_id: evt.id,
        event_type: evt.event_type,
        aggregate_type: evt.aggregate_type,
        aggregate_id: evt.aggregate_id,
        user_id: evt.user_id,
        payload: evt.payload,
        old_data: evt.old_data,
        new_data: evt.new_data,
        correlation_id: evt.correlation_id,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Handler ${handler} returned ${response.status}: ${body.slice(0, 200)}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

async function retryOutboxDeadLetters(supabase: any) {
  const { data: dlq } = await supabase
    .from('event_outbox')
    .select('id')
    .eq('status', 'dead_letter')
    .order('created_at', { ascending: true })
    .limit(10);

  if (!dlq?.length) return { retried: 0 };

  for (const evt of dlq) {
    await supabase.from('event_outbox')
      .update({ status: 'pending', retry_count: 0, error_message: null })
      .eq('id', evt.id);
  }

  return { retried: dlq.length };
}

async function getOutboxStats(supabase: any) {
  const { data } = await supabase
    .from('event_outbox')
    .select('status, event_type, aggregate_type');

  if (!data?.length) return { total: 0, by_status: {}, by_event_type: {}, by_aggregate: {} };

  const byStatus: Record<string, number> = {};
  const byEventType: Record<string, number> = {};
  const byAggregate: Record<string, number> = {};

  for (const row of data) {
    byStatus[row.status] = (byStatus[row.status] || 0) + 1;
    byEventType[row.event_type] = (byEventType[row.event_type] || 0) + 1;
    byAggregate[row.aggregate_type] = (byAggregate[row.aggregate_type] || 0) + 1;
  }

  return { total: data.length, by_status: byStatus, by_event_type: byEventType, by_aggregate: byAggregate };
}

// ════════════════════════════════════════════════════════════
// LEGACY QUEUE PROCESSING (unified_sync_queue — backward compat)
// ════════════════════════════════════════════════════════════

async function processLegacyQueue(supabase: any, supabaseUrl: string, serviceKey: string) {
  const { data: events, error } = await supabase
    .from('unified_sync_queue')
    .select('*')
    .in('status', ['pending', 'retry'])
    .lt('retry_count', MAX_RETRIES)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(LEGACY_BATCH);

  if (error || !events?.length) {
    return { processed: 0, succeeded: 0, failed: 0, dead_lettered: 0 };
  }

  let succeeded = 0, failed = 0, deadLettered = 0;

  for (const evt of events as LegacyEvent[]) {
    await supabase.from('unified_sync_queue')
      .update({ status: 'processing', started_at: new Date().toISOString() })
      .eq('id', evt.id);

    try {
      await dispatchLegacyEvent(supabaseUrl, serviceKey, evt);

      await supabase.from('unified_sync_queue')
        .update({ status: 'completed', completed_at: new Date().toISOString(), error_message: null })
        .eq('id', evt.id);
      succeeded++;
    } catch (err: any) {
      const newRetry = (evt.retry_count || 0) + 1;
      const errorMsg = String(err).slice(0, 500);

      if (newRetry >= MAX_RETRIES) {
        await supabase.from('unified_sync_queue')
          .update({ status: 'dead_letter', retry_count: newRetry, error_message: errorMsg, completed_at: new Date().toISOString() })
          .eq('id', evt.id);
        deadLettered++;
      } else {
        const backoffMs = Math.min(1000 * Math.pow(2, newRetry), 30000);
        const nextRetryAt = new Date(Date.now() + backoffMs).toISOString();
        await supabase.from('unified_sync_queue')
          .update({ status: 'retry', retry_count: newRetry, error_message: errorMsg, next_retry_at: nextRetryAt })
          .eq('id', evt.id);
      }
      failed++;
    }
  }

  return { processed: events.length, succeeded, failed, dead_lettered: deadLettered };
}

async function dispatchLegacyEvent(supabaseUrl: string, serviceKey: string, evt: LegacyEvent) {
  const handler = LEGACY_HANDLERS[evt.sync_type] || 'sync-connected-stores';
  const url = `${supabaseUrl}/functions/v1/${handler}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HANDLER_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        action: 'sync_event',
        event_id: evt.id,
        sync_type: evt.sync_type,
        entity_type: evt.entity_type,
        entity_id: evt.entity_id,
        event_action: evt.action,
        channels: evt.channels,
        payload: evt.payload,
        user_id: evt.user_id,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Handler ${handler} returned ${response.status}: ${body.slice(0, 200)}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

async function retryLegacyDeadLetters(supabase: any) {
  const { data: dlq } = await supabase
    .from('unified_sync_queue')
    .select('id')
    .eq('status', 'dead_letter')
    .order('created_at', { ascending: true })
    .limit(10);

  if (!dlq?.length) return { retried: 0 };

  for (const evt of dlq) {
    await supabase.from('unified_sync_queue')
      .update({ status: 'retry', retry_count: 0, error_message: null })
      .eq('id', evt.id);
  }

  return { retried: dlq.length };
}

async function getLegacyStats(supabase: any) {
  const { data } = await supabase
    .from('unified_sync_queue')
    .select('status, sync_type');

  if (!data?.length) return { total: 0, by_status: {}, by_type: {} };

  const byStatus: Record<string, number> = {};
  const byType: Record<string, number> = {};
  for (const row of data) {
    byStatus[row.status] = (byStatus[row.status] || 0) + 1;
    byType[row.sync_type] = (byType[row.sync_type] || 0) + 1;
  }

  return { total: data.length, by_status: byStatus, by_type: byType };
}

// ── Helpers ──
function json(corsHeaders: Record<string, string>, data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
