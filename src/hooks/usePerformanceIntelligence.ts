/**
 * Performance Intelligence & Compliance/Security hooks — Phase 5
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

// --- Performance Intelligence ---
export function useSystemHealth() {
  return useMutation({
    mutationFn: (params?: Record<string, unknown>) =>
      invoke('ai-performance-intelligence', { action: 'system_health', ...(params || {}) }),
    onError: handleAIError,
  });
}

export function useBottleneckDetection() {
  return useMutation({
    mutationFn: (params?: Record<string, unknown>) =>
      invoke('ai-performance-intelligence', { action: 'bottleneck_detection', ...(params || {}) }),
    onError: handleAIError,
  });
}

export function useScalingRecommendations() {
  return useMutation({
    mutationFn: (params: { current_load?: string; growth_rate?: string }) =>
      invoke('ai-performance-intelligence', { action: 'scaling_recommendations', ...params }),
    onError: handleAIError,
  });
}

export function usePerformanceForecast() {
  return useMutation({
    mutationFn: (params: { horizon?: string }) =>
      invoke('ai-performance-intelligence', { action: 'performance_forecast', ...params }),
    onError: handleAIError,
  });
}

// --- Compliance & Security ---
export function useComplianceAudit() {
  return useMutation({
    mutationFn: (params: { jurisdictions?: string[] }) =>
      invoke('ai-compliance-security', { action: 'compliance_audit', ...params }),
    onError: handleAIError,
  });
}

export function useThreatAssessment() {
  return useMutation({
    mutationFn: (params?: Record<string, unknown>) =>
      invoke('ai-compliance-security', { action: 'threat_assessment', ...(params || {}) }),
    onError: handleAIError,
  });
}

export function usePrivacyScan() {
  return useMutation({
    mutationFn: (params?: Record<string, unknown>) =>
      invoke('ai-compliance-security', { action: 'privacy_scan', ...(params || {}) }),
    onError: handleAIError,
  });
}

export function useRegulatoryReport() {
  return useMutation({
    mutationFn: (params: { regulation?: string; period?: string }) =>
      invoke('ai-compliance-security', { action: 'regulatory_report', ...params }),
    onError: handleAIError,
  });
}
