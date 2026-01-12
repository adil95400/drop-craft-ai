/**
 * Hook centralisé pour la gestion des plans
 * Remplace tous les hooks de plans dépréciés
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { planService } from '@/services/PlanService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';

export function usePlanManager() {
  const queryClient = useQueryClient();

  // Get current user
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Initialize plan service
  useEffect(() => {
    if (user?.id) {
      planService.initialize(user.id);
    }
  }, [user?.id]);

  // Get plan data
  const { data: planData, isLoading } = useQuery({
    queryKey: ['plan-data', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      await planService.refreshUsage(user.id);

      return {
        currentPlan: planService.getCurrentPlan(),
        limits: planService.getLimits(),
        usage: planService.getUsage(),
        recommendedPlan: planService.getRecommendedPlan(),
      };
    },
    enabled: !!user?.id,
    staleTime: 30000, // 30 seconds
  });

  // Upgrade mutation
  const upgradeMutation = useMutation({
    mutationFn: async (newPlan: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      return await planService.upgradePlan(newPlan as any, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-data'] });
      toast.success('Plan upgradé avec succès');
    },
    onError: (error) => {
      console.error('Failed to upgrade plan:', error);
      toast.error('Erreur lors de la mise à niveau du plan');
    },
  });

  // Helper functions
  const canUseFeature = (feature: string) => {
    return planService.canUseFeature(feature as any);
  };

  const canAddResource = (resource: string) => {
    return planService.canAddResource(resource as any);
  };

  const getRemainingQuota = (resource: string) => {
    return planService.getRemainingQuota(resource as any);
  };

  const getUsagePercentage = (resource: string) => {
    return planService.getUsagePercentage(resource as any);
  };

  const needsUpgrade = (resource: string) => {
    return planService.needsUpgrade(resource as any);
  };

  const checkLimitAndNotify = (resource: string): boolean => {
    if (!canAddResource(resource)) {
      toast.error(`Limite atteinte pour ${resource}`, {
        description: `Passez à un plan supérieur pour augmenter vos limites`,
        action: {
          label: 'Voir les plans',
          onClick: () => window.location.href = '/subscription',
        },
      });
      return false;
    }
    return true;
  };

  return {
    // Data
    currentPlan: planData?.currentPlan || 'free',
    limits: planData?.limits,
    usage: planData?.usage,
    recommendedPlan: planData?.recommendedPlan,
    isLoading,

    // Actions
    upgradePlan: upgradeMutation.mutate,
    isUpgrading: upgradeMutation.isPending,

    // Helpers
    canUseFeature,
    canAddResource,
    getRemainingQuota,
    getUsagePercentage,
    needsUpgrade,
    checkLimitAndNotify,
  };
}
