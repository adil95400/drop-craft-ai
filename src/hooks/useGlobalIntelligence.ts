/**
 * Global Intelligence & Automation Orchestrator hooks — Phase 5
 */
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

function handleAIError(err: any) {
  const msg = err?.message || 'Erreur AI';
  if (msg.includes('429') || msg.includes('Rate')) {
    toast.error('Limite IA atteinte. Réessayez dans quelques instants.');
  } else if (msg.includes('402') || msg.includes('Credits')) {
    toast.error('Crédits IA épuisés. Passez au plan supérieur.');
  } else {
    toast.error(msg);
  }
}

async function invoke(fn: string, body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (error) throw error;
  if (!data?.success) throw new Error(data?.error || 'Unknown error');
  return data;
}

// --- Global Intelligence ---
export function useMarketAnalysis() {
  return useMutation({
    mutationFn: (params: { regions?: string[]; categories?: string[]; currency?: string }) =>
      invoke('ai-global-intelligence', { action: 'market_analysis', ...params }),
    onError: handleAIError,
  });
}

export function useTrendPrediction() {
  return useMutation({
    mutationFn: (params: { timeframe?: string; categories?: string[] }) =>
      invoke('ai-global-intelligence', { action: 'trend_prediction', ...params }),
    onError: handleAIError,
  });
}

export function useExpansionOpportunities() {
  return useMutation({
    mutationFn: (params: { target_regions?: string[]; budget_range?: string }) =>
      invoke('ai-global-intelligence', { action: 'expansion_opportunities', ...params }),
    onError: handleAIError,
  });
}

export function useCompetitorLandscape() {
  return useMutation({
    mutationFn: (params: { industry?: string; competitors?: string[] }) =>
      invoke('ai-global-intelligence', { action: 'competitor_landscape', ...params }),
    onError: handleAIError,
  });
}

// --- Automation Orchestrator ---
export function useDesignWorkflow() {
  return useMutation({
    mutationFn: (params: { goal: string; triggers?: string[]; constraints?: Record<string, unknown> }) =>
      invoke('ai-automation-orchestrator', { action: 'design_workflow', ...params }),
    onError: handleAIError,
  });
}

export function useOptimizeWorkflow() {
  return useMutation({
    mutationFn: (params: { workflow_id: string }) =>
      invoke('ai-automation-orchestrator', { action: 'optimize_workflow', ...params }),
    onError: handleAIError,
  });
}

export function useDiagnoseWorkflowFailures() {
  return useMutation({
    mutationFn: (params: { workflow_id: string; time_range?: string }) =>
      invoke('ai-automation-orchestrator', { action: 'diagnose_failures', ...params }),
    onError: handleAIError,
  });
}

export function useSuggestAutomations() {
  return useMutation({
    mutationFn: (params?: Record<string, unknown>) =>
      invoke('ai-automation-orchestrator', { action: 'suggest_automations', ...(params || {}) }),
    onError: handleAIError,
  });
}
