// TEMPORARY WRAPPER - Migration vers useUnifiedPlan
// Ce fichier réexporte useUnifiedPlan pour compatibilité backwards

import { useUnifiedPlan } from '@/lib/unified-plan-system';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

export const usePlan = () => {
  const planState = useUnifiedPlan();
  const { user } = useUnifiedAuth();
  
  return {
    plan: planState.currentPlan,
    effectivePlan: planState.effectivePlan,
    isPro: planState.isPro,
    isUltraPro: planState.isUltraPro,
    isStandard: planState.currentPlan === 'standard',
    hasPlan: planState.hasPlan,
    hasFeature: planState.hasFeature,
    getFeatureConfig: (feature: string) => ({}), // Fallback simple
    loading: planState.loading,
    error: planState.error || '',
    refetch: () => {
      if (user?.id) {
        planState.loadUserPlan(user.id);
      }
    },
    updatePlan: async (newPlan: string) => {
      if (user?.id) {
        await planState.updateUserPlan(user.id, newPlan as any);
      }
      return true;
    },
  };
};

export type { PlanType } from '@/lib/unified-plan-system';
