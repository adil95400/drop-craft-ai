/**
 * useAutomationPolling
 * Client-side polling that triggers automation cycles at regular intervals
 * when the app is open and the user is authenticated.
 * 
 * Schedule (mirrors the planned pg_cron jobs):
 * - Orchestrator (full cycle): every 10 min
 * - Supplier sync: every 15 min
 * - Cart recovery: every 15 min
 * - Pricing rules: every 20 min
 * - Alert scan: every 30 min
 * - Smart inventory: every 30 min
 * - Security scan: every 60 min
 * - Webhook retry: every 2 min
 */
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PollingJob {
  name: string;
  functionName: string;
  body: Record<string, unknown>;
  intervalMs: number;
}

const JOBS: PollingJob[] = [
  { name: 'webhook-retry', functionName: 'webhook-retry', body: {}, intervalMs: 2 * 60_000 },
  { name: 'orchestrator', functionName: 'automation-orchestrator', body: { action: 'run_all' }, intervalMs: 10 * 60_000 },
  { name: 'supplier-sync', functionName: 'supplier-sync-cron', body: {}, intervalMs: 15 * 60_000 },
  { name: 'cart-recovery', functionName: 'cart-recovery-cron', body: {}, intervalMs: 15 * 60_000 },
  { name: 'pricing-rules', functionName: 'pricing-rules-engine', body: { action: 'apply_all' }, intervalMs: 20 * 60_000 },
  { name: 'alert-scan', functionName: 'automation-alert-engine', body: { action: 'scan' }, intervalMs: 30 * 60_000 },
  { name: 'smart-inventory', functionName: 'smart-inventory-engine', body: { action: 'check_and_reorder' }, intervalMs: 30 * 60_000 },
  { name: 'security-scan', functionName: 'automation-security-engine', body: { action: 'full_scan' }, intervalMs: 60 * 60_000 },
];

export function useAutomationPolling(enabled = true) {
  const timersRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
  const mountedRef = useRef(true);

  const runJob = useCallback(async (job: PollingJob) => {
    if (!mountedRef.current) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return; // Not authenticated, skip
      
      await supabase.functions.invoke(job.functionName, { body: job.body });
      console.log(`[AutoPolling] ✅ ${job.name} executed`);
    } catch (err) {
      console.warn(`[AutoPolling] ⚠️ ${job.name} failed:`, err);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    if (!enabled) return;

    // Stagger initial runs to avoid thundering herd
    JOBS.forEach((job, i) => {
      const initialDelay = (i + 1) * 5_000; // 5s between each first run

      const startTimeout = setTimeout(() => {
        if (!mountedRef.current) return;
        runJob(job);
        const interval = setInterval(() => runJob(job), job.intervalMs);
        timersRef.current.set(job.name, interval);
      }, initialDelay);

      // Store timeout as interval for cleanup
      timersRef.current.set(`init-${job.name}`, startTimeout as unknown as ReturnType<typeof setInterval>);
    });

    return () => {
      mountedRef.current = false;
      timersRef.current.forEach((timer) => clearInterval(timer));
      timersRef.current.clear();
    };
  }, [enabled, runJob]);
}
