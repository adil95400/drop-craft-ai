/**
 * Hook centralisé de monétisation — consomme API V1 /monetization/*
 * Remplace les anciens hooks fragmentés (usePlan, usePlanManager, useCreditAddons)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { monetizationApi, MonetizationPlan, MonetizationUsage, MonetizationCredits, MonetizationHistory, PlanGateResult } from '@/services/api/client';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useMonetization() {
  const queryClient = useQueryClient();

  const { data: plan, isLoading: planLoading } = useQuery({
    queryKey: ['monetization-plan'],
    queryFn: () => monetizationApi.getPlan(),
    staleTime: 60_000,
  });

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ['monetization-usage'],
    queryFn: () => monetizationApi.getUsage(),
    staleTime: 30_000,
  });

  const { data: credits, isLoading: creditsLoading } = useQuery({
    queryKey: ['monetization-credits'],
    queryFn: () => monetizationApi.getCredits(),
    staleTime: 30_000,
  });

  const { data: history } = useQuery({
    queryKey: ['monetization-history'],
    queryFn: () => monetizationApi.getHistory(30),
    staleTime: 60_000,
  });

  // Plan gate check mutation
  const gateMutation = useMutation({
    mutationFn: ({ resource, action }: { resource: string; action?: string }) =>
      monetizationApi.checkGate(resource, action),
  });

  const checkGate = async (resource: string, action?: string): Promise<PlanGateResult> => {
    try {
      return await gateMutation.mutateAsync({ resource, action });
    } catch {
      return { allowed: false, reason: 'error', upgrade_needed: true };
    }
  };

  const checkAndNotify = async (resource: string): Promise<boolean> => {
    const result = await checkGate(resource);
    if (!result.allowed) {
      toast.error(`Limite atteinte pour ${resource}`, {
        description: 'Passez au plan supérieur ou achetez des crédits.',
        action: {
          label: 'Voir les plans',
          onClick: () => window.location.href = '/dashboard/subscription',
        },
      });
    }
    return result.allowed;
  };

  // Purchase credits via existing edge function
  const purchaseMutation = useMutation({
    mutationFn: async (packId: string) => {
      const { data, error } = await supabase.functions.invoke('purchase-credits', {
        body: { pack_id: packId },
      });
      if (error) throw error;
      if (data.url) {
        window.open(data.url, '_blank');
        return { redirected: true };
      }
      return { redirected: false };
    },
    onSuccess: (result) => {
      if (!result.redirected) {
        toast.success('Crédits ajoutés avec succès !');
        queryClient.invalidateQueries({ queryKey: ['monetization-credits'] });
        queryClient.invalidateQueries({ queryKey: ['monetization-usage'] });
      }
    },
    onError: (error) => {
      toast.error("Erreur lors de l'achat", {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });

  const currentPlan = plan?.current_plan || 'free';
  const isPro = currentPlan === 'pro' || currentPlan === 'ultra_pro';
  const isUltraPro = currentPlan === 'ultra_pro';
  const nearLimitResources = usage?.alerts || [];

  return {
    // Plan
    currentPlan,
    planLimits: plan?.limits || {},
    isPro,
    isUltraPro,
    isUnlimited: plan?.is_unlimited || false,

    // Usage
    usage: usage?.usage || {},
    nearLimitResources,
    hasAlerts: nearLimitResources.length > 0,

    // Credits
    credits: credits?.credits || [],
    totalCreditsRemaining: credits?.total_remaining || 0,
    totalCreditsPurchased: credits?.total_purchased || 0,

    // History
    history,

    // Actions
    checkGate,
    checkAndNotify,
    purchaseCredits: purchaseMutation.mutate,
    isPurchasing: purchaseMutation.isPending,

    // Loading
    isLoading: planLoading || usageLoading || creditsLoading,
  };
}
