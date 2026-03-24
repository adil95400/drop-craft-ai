/**
 * external-cron-trigger
 * Endpoint for external cron services (cron-job.org, etc.) to trigger automation cycles.
 * Accepts a shared secret via X-Cron-Secret header for authentication.
 * 
 * Usage: POST /functions/v1/external-cron-trigger
 * Headers: X-Cron-Secret: <your-secret>
 * Body: { "jobs": ["all"] } or { "jobs": ["sync", "pricing", "inventory"] }
 */
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CRON_SECRET = Deno.env.get('CRON_SECRET');

interface JobConfig {
  functionName: string;
  body: Record<string, unknown>;
}

const JOB_MAP: Record<string, JobConfig> = {
  orchestrator: { functionName: 'automation-orchestrator', body: { action: 'run_all' } },
  sync: { functionName: 'supplier-sync-cron', body: {} },
  pricing: { functionName: 'pricing-rules-engine', body: { action: 'apply_all' } },
  inventory: { functionName: 'smart-inventory-engine', body: { action: 'check_and_reorder' } },
  alerts: { functionName: 'automation-alert-engine', body: { action: 'scan' } },
  cart: { functionName: 'cart-recovery-cron', body: {} },
  security: { functionName: 'automation-security-engine', body: { action: 'full_scan' } },
  webhooks: { functionName: 'webhook-retry', body: {} },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate via secret
    if (CRON_SECRET) {
      const providedSecret = req.headers.get('x-cron-secret') || req.headers.get('authorization')?.replace('Bearer ', '');
      if (providedSecret !== CRON_SECRET) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const { jobs = ['orchestrator'] } = await req.json().catch(() => ({ jobs: ['orchestrator'] }));

    const jobsToRun: string[] = jobs.includes('all') ? Object.keys(JOB_MAP) : jobs;
    const results: Record<string, { success: boolean; duration_ms: number; error?: string }> = {};

    for (const jobName of jobsToRun) {
      const config = JOB_MAP[jobName];
      if (!config) {
        results[jobName] = { success: false, duration_ms: 0, error: 'Unknown job' };
        continue;
      }

      const start = Date.now();
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/${config.functionName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify(config.body),
        });

        if (!res.ok) {
          const text = await res.text();
          results[jobName] = { success: false, duration_ms: Date.now() - start, error: text };
        } else {
          results[jobName] = { success: true, duration_ms: Date.now() - start };
        }
      } catch (err) {
        results[jobName] = { success: false, duration_ms: Date.now() - start, error: String(err) };
      }
    }

    // Log to activity_logs
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    await adminClient.from('activity_logs').insert({
      action: 'external_cron_trigger',
      entity_type: 'automation',
      description: `External cron executed ${jobsToRun.length} job(s)`,
      details: results,
      source: 'external_cron',
    });

    const successCount = Object.values(results).filter(r => r.success).length;

    return new Response(JSON.stringify({
      success: true,
      executed: jobsToRun.length,
      succeeded: successCount,
      failed: jobsToRun.length - successCount,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
