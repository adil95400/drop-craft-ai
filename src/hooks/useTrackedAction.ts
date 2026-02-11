/**
 * useTrackedAction - Wrapper pour tracer automatiquement les actions consommatrices de quotas
 * Appelle logConsumption après chaque action réussie
 */
import { useCallback } from 'react';
import { useConsumptionTracking, QuotaKey, ConsumptionSource } from '@/hooks/useConsumptionTracking';

interface TrackedActionOptions {
  quotaKey: QuotaKey;
  actionType: string;
  source?: ConsumptionSource;
  tokensUsed?: number;
  costEstimate?: number;
}

/**
 * Wraps an async action to automatically log consumption on success
 * Usage:
 *   const trackedImport = useTrackedAction({ quotaKey: 'imports_monthly', actionType: 'csv_import' });
 *   const result = await trackedImport(() => doImport(file));
 */
export function useTrackedAction(options: TrackedActionOptions) {
  const { logConsumption } = useConsumptionTracking();

  const execute = useCallback(async <T>(
    action: () => Promise<T>,
    detail?: Record<string, string | number | boolean>
  ): Promise<T> => {
    const result = await action();
    
    // Fire and forget — don't block the action on tracking
    logConsumption({
      quotaKey: options.quotaKey,
      actionType: options.actionType,
      actionDetail: detail,
      tokensUsed: options.tokensUsed,
      costEstimate: options.costEstimate,
      source: options.source || 'web',
    }).catch(err => console.warn('[TrackedAction] Failed to log:', err));

    return result;
  }, [logConsumption, options]);

  return execute;
}

/**
 * Standalone function to log consumption without wrapping
 * Use when you want to log at a specific point rather than wrapping an entire action
 */
export function useLogAction() {
  const { logConsumption } = useConsumptionTracking();

  return useCallback((
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
    }).catch(err => console.warn('[LogAction] Failed to log:', err));
  }, [logConsumption]);
}
