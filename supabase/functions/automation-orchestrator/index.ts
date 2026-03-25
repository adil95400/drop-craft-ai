/**
 * Unified Automation Orchestrator
 * Master coordinator for all automation subsystems.
 * 
 * SECURITY:
 *  - Internal (CRON): Requires X-Cron-Secret header
 *  - User-triggered: Requires valid JWT + admin role
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getSecureCorsHeaders, handleCorsPreflightSecure } from '../_shared/secure-cors.ts';

Deno.serve(async (req) => {
  const corsHeaders = getSecureCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightSecure(req);
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const CRON_SECRET = Deno.env.get('CRON_SECRET');

    // ── AUTHENTICATION ──
    const cronSecret = req.headers.get('x-cron-secret');
    const authHeader = req.headers.get('Authorization');
    let authenticatedBy: 'cron' | 'admin' = 'cron';

    if (cronSecret) {
      if (!CRON_SECRET) {
        console.error('[orchestrator] CRON_SECRET not configured');
        return json(corsHeaders, { error: 'Server misconfigured' }, 503);
      }
      if (cronSecret !== CRON_SECRET) {
        const adminClient = createClient(supabaseUrl, supabaseKey);
        await adminClient.from('activity_logs').insert({
          action: 'orchestrator_auth_failed', entity_type: 'security',
          description: 'Unauthorized orchestrator trigger attempt',
          severity: 'warn', source: 'automation_orchestrator',
        });
        return json(corsHeaders, { error: 'Unauthorized' }, 403);
      }
      authenticatedBy = 'cron';
    } else if (authHeader) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const token = authHeader.replace('Bearer ', '');
      const { data, error: authError } = await supabase.auth.getClaims(token);

      if (authError || !data?.claims?.sub) {
        return json(corsHeaders, { error: 'Invalid token' }, 401);
      }

      const userId = data.claims.sub;
      const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
      if (!isAdmin) {
        return json(corsHeaders, { error: 'Admin access required' }, 403);
      }
      authenticatedBy = 'admin';
    } else {
      return json(corsHeaders, { error: 'Authentication required (X-Cron-Secret or Authorization header)' }, 401);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'run_all';

    console.log(`[orchestrator] Starting action: ${action} (auth: ${authenticatedBy})`);

    // ── IDEMPOTENCY CHECK ──
    const idempotencyKey = `orchestrator:${action}:${Math.floor(Date.now() / 120000)}`;
    const { data: existingRun } = await supabase
      .from('idempotency_keys').select('id').eq('key', idempotencyKey).maybeSingle();

    if (existingRun && authenticatedBy === 'cron') {
      console.log(`[orchestrator] Skipping duplicate run for ${action}`);
      return json(corsHeaders, { success: true, skipped: true, reason: 'duplicate_within_window' });
    }

    await supabase.from('idempotency_keys').upsert({
      key: idempotencyKey, expires_at: new Date(Date.now() + 300000).toISOString(),
    }).catch(() => {});

    const results: Record<string, any> = {};

    if (action === 'health') {
      return json(corsHeaders, {
        success: true, status: 'healthy', uptime: Date.now(), authenticated_by: authenticatedBy,
        subsystems: ['supplier-sync-cron', 'auto-reorder-engine', 'pricing-rules-engine', 'automation-alert-engine', 'workflow-executor', 'cart-recovery-cron', 'event-bus-processor'],
      });
    }

    if (action === 'run_all' || action === 'run_sync') {
      results.sync = await invokeWithRetry(supabaseUrl, supabaseKey, 'supplier-sync-cron', {});
    }
    if (action === 'run_all' || action === 'run_reorder') {
      results.reorder_check = await invokeWithRetry(supabaseUrl, supabaseKey, 'auto-reorder-engine', { action: 'check_and_reorder' });
      results.reorder_process = await invokeWithRetry(supabaseUrl, supabaseKey, 'auto-reorder-engine', { action: 'process_queue' });
      results.reorder_tracking = await invokeWithRetry(supabaseUrl, supabaseKey, 'auto-reorder-engine', { action: 'update_tracking' });
    }
    if (action === 'run_all' || action === 'run_workflows') {
      results.workflows = await executeScheduledWorkflows(supabase, supabaseUrl, supabaseKey);
    }
    if (action === 'run_all' || action === 'run_pricing') {
      results.pricing = await runBulkPricingOptimization(supabase);
    }
    if (action === 'run_all' || action === 'run_alerts') {
      results.alerts = await invokeWithRetry(supabaseUrl, supabaseKey, 'automation-alert-engine', { action: 'scan_all' });
    }
    if (action === 'run_all') {
      results.cart_recovery = await invokeWithRetry(supabaseUrl, supabaseKey, 'cart-recovery-cron', {});
    }
    if (action === 'run_all' || action === 'run_event_bus') {
      results.event_bus = await invokeWithRetry(supabaseUrl, supabaseKey, 'event-bus-processor', { action: 'process_queue' });
    }

    const totalTime = Date.now() - startTime;
    const failedSubsystems = Object.entries(results).filter(([_, v]) => v?.status === 'error').map(([k]) => k);

    await supabase.from('activity_logs').insert({
      action: 'automation_orchestrator_run', entity_type: 'system',
      description: `Orchestration ${action} completed in ${totalTime}ms (auth: ${authenticatedBy})${failedSubsystems.length ? ` — ${failedSubsystems.length} failures: ${failedSubsystems.join(', ')}` : ''}`,
      details: { action, results, duration_ms: totalTime, authenticated_by: authenticatedBy, failed: failedSubsystems },
      source: 'automation_orchestrator', severity: failedSubsystems.length > 0 ? 'warn' : 'info',
    });

    console.log(`[orchestrator] Completed ${action} in ${totalTime}ms (${failedSubsystems.length} failures)`);

    return json(corsHeaders, { success: true, action, duration_ms: totalTime, results, failed: failedSubsystems });
  } catch (error) {
    console.error('[orchestrator] Fatal error:', error);
    return json(corsHeaders, { success: false, error: String(error), duration_ms: Date.now() - startTime }, 500);
  }
});

async function invokeWithRetry(supabaseUrl: string, serviceKey: string, functionName: string, body: any, maxRetries = 2): Promise<any> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const url = `${supabaseUrl}/functions/v1/${functionName}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
        body: JSON.stringify(body),
      });

      const data = await response.json().catch(() => ({ status: response.status }));

      if (response.ok) return { status: 'success', data, attempts: attempt + 1 };

      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return { status: 'error', data, httpStatus: response.status, attempts: attempt + 1 };
      }

      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 8000) + Math.random() * 1000;
        console.warn(`[orchestrator] ${functionName} returned ${response.status}, retrying in ${Math.round(delay)}ms`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        return { status: 'error', data, httpStatus: response.status, attempts: attempt + 1 };
      }
    } catch (error) {
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 8000) + Math.random() * 1000;
        console.warn(`[orchestrator] ${functionName} threw, retrying in ${Math.round(delay)}ms: ${error}`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        console.error(`[orchestrator] ${functionName} failed after ${maxRetries + 1} attempts:`, error);
        return { status: 'error', error: String(error), attempts: attempt + 1 };
      }
    }
  }
}

async function executeScheduledWorkflows(supabase: any, supabaseUrl: string, serviceKey: string): Promise<any> {
  const now = new Date();
  const { data: workflows } = await supabase
    .from('automation_workflows').select('id, user_id, name, trigger_type, trigger_config, last_executed_at')
    .eq('is_active', true).in('trigger_type', ['schedule', 'cron', 'interval']);

  if (!workflows?.length) return { executed: 0, skipped: 0 };

  let executed = 0, skipped = 0;

  for (const wf of workflows) {
    const config = wf.trigger_config || {};
    const lastRun = wf.last_executed_at ? new Date(wf.last_executed_at) : null;
    const intervalMinutes = config.interval_minutes || config.frequency_minutes || 60;

    if (lastRun) {
      const elapsed = (now.getTime() - lastRun.getTime()) / 60000;
      if (elapsed < intervalMinutes) { skipped++; continue; }
    }

    if (config.cron_expression && !shouldRunCron(config.cron_expression, now)) { skipped++; continue; }

    try {
      await invokeWithRetry(supabaseUrl, serviceKey, 'workflow-executor', {
        workflowId: wf.id,
        triggerData: { trigger: 'scheduled', timestamp: now.toISOString() },
        manualExecution: false,
      });
      executed++;
    } catch (err) {
      console.error(`[orchestrator] Workflow ${wf.id} execution failed:`, err);
    }
  }

  return { total: workflows.length, executed, skipped };
}

function shouldRunCron(expression: string, now: Date): boolean {
  try {
    const parts = expression.split(' ');
    if (parts.length < 2) return true;
    const [minute, hour] = parts;
    return (minute === '*' || parseInt(minute) === now.getMinutes()) && (hour === '*' || parseInt(hour) === now.getHours());
  } catch { return true; }
}

async function runBulkPricingOptimization(supabase: any): Promise<any> {
  const { data: products } = await supabase
    .from('products').select('id, user_id, price, cost_price, buy_price')
    .not('cost_price', 'is', null).gt('cost_price', 0).limit(100);

  if (!products?.length) return { checked: 0, adjusted: 0 };

  let adjusted = 0;
  for (const p of products) {
    const cost = p.cost_price || p.buy_price || 0;
    if (cost <= 0 || !p.price) continue;
    const margin = ((p.price - cost) / p.price) * 100;
    if (margin < 5) {
      await supabase.from('ai_recommendations').insert({
        user_id: p.user_id, recommendation_type: 'pricing_review',
        title: `Prix à réviser (marge: ${margin.toFixed(1)}%)`,
        description: `Prix: ${p.price}€, Coût: ${cost}€. Marge insuffisante.`,
        confidence_score: 0.9, status: 'pending', source_product_id: p.id,
        metadata: { margin, price: p.price, cost },
      }).then(() => adjusted++);
    }
  }

  return { checked: products.length, adjusted };
}

function json(corsHeaders: Record<string, string>, data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
