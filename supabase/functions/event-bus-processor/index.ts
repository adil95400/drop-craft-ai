/**
 * Event Bus Processor — P2 Event-Driven Architecture
 * 
 * Consumes events from `unified_sync_queue`, dispatches to handlers,
 * implements retry with exponential backoff, and dead-letter routing.
 * 
 * Actions:
 *  - process_queue: Process pending events (called by cron or orchestrator)
 *  - dlq_retry: Retry dead-letter events
 *  - stats: Get queue statistics
 * 
 * SECURITY: CRON_SECRET or admin JWT required.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getSecureCorsHeaders, handleCorsPreflightSecure } from '../_shared/secure-cors.ts';

const MAX_RETRIES = 3;
const BATCH_SIZE = 25;
const HANDLER_TIMEOUT_MS = 15000;

interface QueueEvent {
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
      const stats = await getQueueStats(supabase);
      return json(corsHeaders, { success: true, stats, duration_ms: Date.now() - startTime });
    }

    // ── DLQ RETRY ──
    if (action === 'dlq_retry') {
      const result = await retryDeadLetters(supabase, supabaseUrl, serviceKey);
      return json(corsHeaders, { success: true, ...result, duration_ms: Date.now() - startTime });
    }

    // ── PROCESS QUEUE ──
    const result = await processQueue(supabase, supabaseUrl, serviceKey);

    await supabase.from('activity_logs').insert({
      action: 'event_bus_processed', entity_type: 'system',
      description: `Event bus processed ${result.processed} events (${result.failed} failed) in ${Date.now() - startTime}ms`,
      details: result, source: 'event_bus_processor',
      severity: result.failed > 0 ? 'warn' : 'info',
    });

    return json(corsHeaders, { success: true, ...result, duration_ms: Date.now() - startTime });
  } catch (error) {
    console.error('[event-bus] Fatal:', error);
    return json(corsHeaders, { error: String(error) }, 500);
  }
});

async function processQueue(supabase: any, supabaseUrl: string, serviceKey: string) {
  // Fetch pending events ordered by priority then creation time
  const { data: events, error } = await supabase
    .from('unified_sync_queue')
    .select('*')
    .in('status', ['pending', 'retry'])
    .lt('retry_count', MAX_RETRIES)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (error || !events?.length) {
    return { processed: 0, succeeded: 0, failed: 0, dead_lettered: 0 };
  }

  let succeeded = 0, failed = 0, deadLettered = 0;

  // Group events by sync_type for batch processing
  const grouped: Record<string, QueueEvent[]> = {};
  for (const evt of events) {
    const key = evt.sync_type || 'generic';
    (grouped[key] ??= []).push(evt);
  }

  for (const [syncType, batch] of Object.entries(grouped)) {
    for (const evt of batch) {
      // Mark as processing
      await supabase.from('unified_sync_queue')
        .update({ status: 'processing', started_at: new Date().toISOString() })
        .eq('id', evt.id);

      try {
        await dispatchEvent(supabaseUrl, serviceKey, evt);

        // Mark as completed
        await supabase.from('unified_sync_queue')
          .update({ status: 'completed', completed_at: new Date().toISOString(), error_message: null })
          .eq('id', evt.id);
        succeeded++;

      } catch (err: any) {
        const newRetryCount = (evt.retry_count || 0) + 1;
        const errorMsg = String(err).slice(0, 500);

        if (newRetryCount >= MAX_RETRIES) {
          // Move to dead letter
          await supabase.from('unified_sync_queue')
            .update({
              status: 'dead_letter',
              retry_count: newRetryCount,
              error_message: errorMsg,
              completed_at: new Date().toISOString(),
            })
            .eq('id', evt.id);
          deadLettered++;
          console.error(`[event-bus] Event ${evt.id} dead-lettered after ${MAX_RETRIES} retries: ${errorMsg}`);
        } else {
          // Schedule retry with exponential backoff
          const backoffMs = Math.min(1000 * Math.pow(2, newRetryCount), 30000);
          const nextRetryAt = new Date(Date.now() + backoffMs).toISOString();
          await supabase.from('unified_sync_queue')
            .update({
              status: 'retry',
              retry_count: newRetryCount,
              error_message: errorMsg,
              next_retry_at: nextRetryAt,
            })
            .eq('id', evt.id);
          console.warn(`[event-bus] Event ${evt.id} retry #${newRetryCount} scheduled at ${nextRetryAt}`);
        }
        failed++;
      }
    }
  }

  return { processed: events.length, succeeded, failed, dead_lettered: deadLettered };
}

async function dispatchEvent(supabaseUrl: string, serviceKey: string, evt: QueueEvent) {
  // Route event to the appropriate handler function based on sync_type
  const handlerMap: Record<string, string> = {
    products: 'sync-connected-stores',
    orders: 'order-hub',
    customers: 'sync-connected-stores',
    pricing: 'pricing-rules-engine',
    stock: 'stock-price-sync',
    marketing: 'dynamic-campaigns',
  };

  const handler = handlerMap[evt.sync_type] || 'sync-connected-stores';
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

async function retryDeadLetters(supabase: any, supabaseUrl: string, serviceKey: string) {
  const { data: dlqEvents } = await supabase
    .from('unified_sync_queue')
    .select('*')
    .eq('status', 'dead_letter')
    .order('created_at', { ascending: true })
    .limit(10);

  if (!dlqEvents?.length) return { retried: 0 };

  let retried = 0;
  for (const evt of dlqEvents) {
    await supabase.from('unified_sync_queue')
      .update({ status: 'retry', retry_count: 0, error_message: null })
      .eq('id', evt.id);
    retried++;
  }

  return { retried };
}

async function getQueueStats(supabase: any) {
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

function json(corsHeaders: Record<string, string>, data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
