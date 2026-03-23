/**
 * Unified Automation Orchestrator
 * Master coordinator that runs all automation subsystems in sequence.
 * Called by pg_cron every 10 minutes.
 * 
 * Actions:
 *  - run_all: Execute full automation cycle
 *  - run_sync: Supplier sync only
 *  - run_reorder: Auto-reorder check only
 *  - run_alerts: Alert scan only
 *  - run_workflows: Scheduled workflow execution
 *  - run_pricing: Pricing optimization only
 *  - health: Return system health status
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'run_all';

    console.log(`[orchestrator] Starting action: ${action}`);

    const results: Record<string, any> = {};

    // ── HEALTH CHECK ────────────────────────────────────────
    if (action === 'health') {
      return json({ 
        success: true, 
        status: 'healthy', 
        uptime: Date.now(),
        subsystems: [
          'supplier-sync-cron',
          'auto-reorder-engine', 
          'pricing-rules-engine',
          'automation-alert-engine',
          'workflow-executor',
          'cart-recovery-cron',
        ]
      });
    }

    // ── 1. SUPPLIER SYNC ────────────────────────────────────
    if (action === 'run_all' || action === 'run_sync') {
      results.sync = await invokeSubsystem(supabaseUrl, supabaseKey, 'supplier-sync-cron', {});
    }

    // ── 2. AUTO-REORDER ─────────────────────────────────────
    if (action === 'run_all' || action === 'run_reorder') {
      // Check thresholds
      results.reorder_check = await invokeSubsystem(supabaseUrl, supabaseKey, 'auto-reorder-engine', { action: 'check_and_reorder' });
      // Process pending orders
      results.reorder_process = await invokeSubsystem(supabaseUrl, supabaseKey, 'auto-reorder-engine', { action: 'process_queue' });
      // Update tracking
      results.reorder_tracking = await invokeSubsystem(supabaseUrl, supabaseKey, 'auto-reorder-engine', { action: 'update_tracking' });
    }

    // ── 3. SCHEDULED WORKFLOWS ──────────────────────────────
    if (action === 'run_all' || action === 'run_workflows') {
      results.workflows = await executeScheduledWorkflows(supabase, supabaseUrl, supabaseKey);
    }

    // ── 4. PRICING OPTIMIZATION ─────────────────────────────
    if (action === 'run_all' || action === 'run_pricing') {
      results.pricing = await runBulkPricingOptimization(supabase);
    }

    // ── 5. ALERT SCAN ───────────────────────────────────────
    if (action === 'run_all' || action === 'run_alerts') {
      results.alerts = await invokeSubsystem(supabaseUrl, supabaseKey, 'automation-alert-engine', { action: 'scan_all' });
    }

    // ── 6. CART RECOVERY ────────────────────────────────────
    if (action === 'run_all') {
      results.cart_recovery = await invokeSubsystem(supabaseUrl, supabaseKey, 'cart-recovery-cron', {});
    }

    const totalTime = Date.now() - startTime;

    // Log orchestration run
    await supabase.from('activity_logs').insert({
      action: 'automation_orchestrator_run',
      entity_type: 'system',
      description: `Orchestration ${action} completed in ${totalTime}ms`,
      details: { action, results, duration_ms: totalTime },
      source: 'automation_orchestrator',
      severity: 'info',
    });

    console.log(`[orchestrator] Completed ${action} in ${totalTime}ms`);

    return json({ success: true, action, duration_ms: totalTime, results });
  } catch (error) {
    console.error('[orchestrator] Fatal error:', error);
    return json({ success: false, error: String(error), duration_ms: Date.now() - startTime }, 500);
  }
});

/**
 * Invoke a subsystem edge function
 */
async function invokeSubsystem(
  supabaseUrl: string, 
  serviceKey: string, 
  functionName: string, 
  body: any
): Promise<any> {
  try {
    const url = `${supabaseUrl}/functions/v1/${functionName}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({ status: response.status }));
    return { status: response.ok ? 'success' : 'error', data };
  } catch (error) {
    console.error(`[orchestrator] Subsystem ${functionName} failed:`, error);
    return { status: 'error', error: String(error) };
  }
}

/**
 * Execute workflows that have scheduled triggers
 */
async function executeScheduledWorkflows(supabase: any, supabaseUrl: string, serviceKey: string): Promise<any> {
  const now = new Date();
  
  // Get active workflows with schedule triggers
  const { data: workflows } = await supabase
    .from('automation_workflows')
    .select('id, user_id, name, trigger_type, trigger_config, last_executed_at')
    .eq('is_active', true)
    .in('trigger_type', ['schedule', 'cron', 'interval']);

  if (!workflows?.length) return { executed: 0, skipped: 0 };

  let executed = 0;
  let skipped = 0;

  for (const wf of workflows) {
    const config = wf.trigger_config || {};
    const lastRun = wf.last_executed_at ? new Date(wf.last_executed_at) : null;
    
    // Check if it's time to run
    const intervalMinutes = config.interval_minutes || config.frequency_minutes || 60;
    if (lastRun) {
      const elapsed = (now.getTime() - lastRun.getTime()) / 60000;
      if (elapsed < intervalMinutes) { skipped++; continue; }
    }

    // Check cron expression if provided
    if (config.cron_expression) {
      if (!shouldRunCron(config.cron_expression, now)) { skipped++; continue; }
    }

    // Execute the workflow
    try {
      await invokeSubsystem(supabaseUrl, serviceKey, 'workflow-executor', {
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

/**
 * Simple cron-like check (hour/minute matching)
 */
function shouldRunCron(expression: string, now: Date): boolean {
  try {
    const parts = expression.split(' ');
    if (parts.length < 2) return true;
    
    const [minute, hour] = parts;
    const currentMinute = now.getMinutes();
    const currentHour = now.getHours();

    const minuteMatch = minute === '*' || parseInt(minute) === currentMinute;
    const hourMatch = hour === '*' || parseInt(hour) === currentHour;

    return minuteMatch && hourMatch;
  } catch {
    return true;
  }
}

/**
 * Run bulk pricing optimization for products needing price review
 */
async function runBulkPricingOptimization(supabase: any): Promise<any> {
  // Find products with outdated pricing (cost changed but price not updated)
  const { data: products } = await supabase
    .from('products')
    .select('id, user_id, price, cost_price, buy_price')
    .not('cost_price', 'is', null)
    .gt('cost_price', 0)
    .limit(100);

  if (!products?.length) return { checked: 0, adjusted: 0 };

  let adjusted = 0;

  for (const p of products) {
    const cost = p.cost_price || p.buy_price || 0;
    if (cost <= 0 || !p.price) continue;

    const margin = ((p.price - cost) / p.price) * 100;

    // If margin dropped below 5%, flag for review
    if (margin < 5) {
      await supabase.from('ai_recommendations').insert({
        user_id: p.user_id,
        recommendation_type: 'pricing_review',
        title: `Prix à réviser (marge: ${margin.toFixed(1)}%)`,
        description: `Prix: ${p.price}€, Coût: ${cost}€. Marge insuffisante.`,
        confidence_score: 0.9,
        status: 'pending',
        source_product_id: p.id,
        metadata: { margin, price: p.price, cost },
      }).then(() => adjusted++);
    }
  }

  return { checked: products.length, adjusted };
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
