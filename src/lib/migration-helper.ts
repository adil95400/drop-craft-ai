/**
 * Utilitaires pour migrer progressivement vers le système unifié
 * Permet de maintenir la compatibilité pendant la transition
 */

import { useUnifiedPlan, type PlanType } from './unified-plan-system'

// Adaptateur pour l'ancien usePlan hook
export function useLegacyPlan(user?: any) {
  const unifiedStore = useUnifiedPlan()
  
  return {
    plan: unifiedStore.currentPlan,
    effectivePlan: unifiedStore.effectivePlan,
    role: unifiedStore.userRole,
    admin_mode: unifiedStore.adminMode,
    loading: unifiedStore.loading,
    error: unifiedStore.error,
    
    // Méthodes de compatibilité
    hasPlan: unifiedStore.hasPlan,
    isUltraPro: unifiedStore.isUltraPro,
    isPro: unifiedStore.isPro,
    updatePlan: (plan: PlanType) => user?.id && unifiedStore.updateUserPlan(user.id, plan),
    refetch: () => user?.id && unifiedStore.loadUserPlan(user.id)
  }
}

// Adaptateur pour useSimplePlan
export function useSimplePlan(user?: any) {
  const { isPro, isUltraPro, currentPlan } = useUnifiedPlan()
  
  return {
    plan: currentPlan,
    isPro: isPro(),
    isUltraPro: isUltraPro()
  }
}

// Adaptateur pour PlanContext
export function usePlanContext() {
  const unifiedStore = useUnifiedPlan()
  
  return {
    plan: unifiedStore.currentPlan,
    setPlan: (plan: PlanType) => unifiedStore.setPlan(plan),
    isUltraPro: unifiedStore.isUltraPro(),
    isPro: unifiedStore.isPro(),
    hasFeature: unifiedStore.hasFeature
  }
}

// Migration des features flags
export const LEGACY_FEATURE_MAP = {
  // Mapping des anciens noms vers les nouveaux
  'ai-analysis': 'ai-analysis',
  'advanced-filters': 'advanced-filters',
  'advanced-integrations': 'premium-integrations',
  'workflow-builder': 'workflow-builder',
  'ai-insights': 'ai-insights',
  'seo-automation': 'seo-automation',
  'real-time-tracking': 'real-time-tracking',
  'predictive-analytics': 'predictive-analytics',
  'advanced-automation': 'advanced-automation',
  'bulk-operations': 'bulk-operations',
  'premium-integrations': 'premium-integrations',
  'advanced-seo': 'advanced-seo',
  'crm-prospects': 'crm-prospects',
  'inventory-management': 'inventory-management',
  'advanced-tracking': 'advanced-tracking',
  'ai-import': 'ai-import',
  'marketing-automation': 'marketing-automation',
  'security-monitoring': 'security-monitoring',
  'analytics-insights': 'analytics-insights',
  'advanced-analytics': 'advanced-analytics',
  'bulk-import': 'bulk-import',
  'scheduled-import': 'scheduled-import'
}

export function mapLegacyFeature(oldFeature: string): string {
  return LEGACY_FEATURE_MAP[oldFeature as keyof typeof LEGACY_FEATURE_MAP] || oldFeature
}