/**
 * useTrackedAction – P2.2 Enhanced
 * Wraps any async action with:
 *   1. Pre-check via enforce-plan-gate (blocks if quota exceeded)
 *   2. Post-action consumption logging via logConsumption
 *   3. Visual alerts at 80% usage and upgrade CTA on block
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useConsumptionTracking, QuotaKey, ConsumptionSource } from '@/hooks/useConsumptionTracking';
import { toast } from 'sonner';

interface TrackedActionOptions {
  quotaKey: QuotaKey;
  actionType: string;
  /** The action key sent to enforce-plan-gate (e.g. "products:import") */
  gateAction?: string;
  source?: ConsumptionSource;
  tokensUsed?: number;
  costEstimate?: number;
}

interface QuotaInfo {
  allowed: boolean;
  remaining: number;
  limit: number;
  plan: string;
  upgrade_required: string | null;
}

interface TrackedActionReturn {
  execute: <T>(
    action: () => Promise<T>,
    detail?: Record<string, string | number | boolean>
  ) => Promise<T | null>;
  loading: boolean;
  error: string | null;
  quotaInfo: QuotaInfo | null;
}

/**
 * Wraps an async action to automatically check quota and log consumption on success.
 *
 * Usage:
 *   const { execute, loading, quotaInfo } = useTrackedAction({
 *     quotaKey: 'imports_monthly',
 *     actionType: 'csv_import',
 *     gateAction: 'products:import',
 *   });
 *   const result = await execute(() => doImport(file));
 */
export function useTrackedAction(options: TrackedActionOptions): TrackedActionReturn {
  const { logConsumption } = useConsumptionTracking();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);

  const execute = useCallback(
    async <T>(
      action: () => Promise<T>,
      detail?: Record<string, string | number | boolean>
    ): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        // ── 1. Pre-check quota via enforce-plan-gate ──────────────
        if (options.gateAction) {
          const { data: gateResult, error: gateError } = await supabase.functions.invoke(
            'enforce-plan-gate',
            { body: { action: options.gateAction, quantity: 1 } }
          );

          if (gateError) {
            console.warn('[TrackedAction] Gate check failed, proceeding anyway:', gateError.message);
          } else if (gateResult) {
            const info: QuotaInfo = {
              allowed: gateResult.allowed,
              remaining: gateResult.remaining,
              limit: gateResult.limit,
              plan: gateResult.plan,
              upgrade_required: gateResult.upgrade_required,
            };
            setQuotaInfo(info);

            // Block if not allowed
            if (!info.allowed) {
              const msg = info.upgrade_required
                ? `Quota atteinte (${info.limit}). Passez au plan ${info.upgrade_required} pour continuer.`
                : `Quota atteinte (${info.limit}). Contactez le support.`;
              toast.error('Limite atteinte', {
                description: msg,
                action: {
                  label: 'Upgrader',
                  onClick: () => (window.location.href = '/dashboard/subscription'),
                },
              });
              setError(msg);
              return null;
            }

            // Warn at 80%+ usage
            if (info.limit > 0 && info.remaining >= 0 && info.remaining <= Math.ceil(info.limit * 0.2)) {
              toast.warning('Quota bientôt atteinte', {
                description: `Il vous reste ${info.remaining} action(s) sur ${info.limit} ce mois-ci.`,
              });
            }
          }
        }

        // ── 2. Execute the actual action ──────────────────────────
        const result = await action();

        // ── 3. Log consumption (fire and forget) ──────────────────
        logConsumption({
          quotaKey: options.quotaKey,
          actionType: options.actionType,
          actionDetail: detail,
          tokensUsed: options.tokensUsed,
          costEstimate: options.costEstimate,
          source: options.source || 'web',
        }).catch((err) => console.warn('[TrackedAction] Failed to log:', err));

        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        toast.error('Erreur', { description: msg });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [logConsumption, options]
  );

  return { execute, loading, error, quotaInfo };
}

/**
 * Standalone function to log consumption without wrapping
 * Use when you want to log at a specific point rather than wrapping an entire action
 */
export function useLogAction() {
  const { logConsumption } = useConsumptionTracking();

  return useCallback(
    (
      quotaKey: QuotaKey,
      actionType: string,
      detail?: Record<string, string | number | boolean>,
      extra?: { tokensUsed?: number; costEstimate?: number; source?: ConsumptionSource }
    ) => {
      logConsumption({
        quotaKey,
        actionType,
        actionDetail: detail,
        tokensUsed: extra?.tokensUsed || 0,
        costEstimate: extra?.costEstimate || 0,
        source: extra?.source || 'web',
      }).catch((err) => console.warn('[LogAction] Failed to log:', err));
    },
    [logConsumption]
  );
}
