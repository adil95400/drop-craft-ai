/**
 * Hook unifié pour la gestion des quotas et limites par plan
 * Remplace useQuotaManager, useQuotas, usePlanManager
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type QuotaKey = 
  | 'products' 
  | 'imports_monthly' 
  | 'ai_generations' 
  | 'stores' 
  | 'suppliers' 
  | 'workflows' 
  | 'storage_mb'
  | 'seo_audits'
  | 'seo_generations'
  | 'seo_applies'
  | 'seo_category_audits'
  | 'seo_site_audits'
  | 'seo_languages'
  | 'seo_bulk_limit'
  | 'seo_history_days';

export type PlanName = 'free' | 'standard' | 'pro' | 'ultra_pro';

export interface QuotaInfo {
  can_proceed: boolean;
  current_usage: number;
  limit: number;
  plan: PlanName;
  remaining: number;
  percentage: number;
}

export interface PlanLimit {
  plan_name: PlanName;
  limit_key: QuotaKey;
  limit_value: number;
  description: string;
}

const QUOTA_LABELS: Record<QuotaKey, string> = {
  products: 'Produits',
  imports_monthly: 'Imports mensuels',
  ai_generations: 'Générations IA',
  stores: 'Boutiques',
  suppliers: 'Fournisseurs',
  workflows: 'Workflows',
  storage_mb: 'Stockage (Mo)',
  seo_audits: 'Audits SEO produits',
  seo_generations: 'Générations SEO IA',
  seo_applies: 'Applications SEO',
  seo_category_audits: 'Audits catégories',
  seo_site_audits: 'Audits site',
  seo_languages: 'Langues SEO',
  seo_bulk_limit: 'Bulk SEO',
  seo_history_days: 'Historique SEO (jours)',
};

export function useUnifiedQuotas() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const currentPlan = (profile?.subscription_plan as PlanName) || 'free';

  // Fetch all plan limits
  const { data: planLimits, isLoading: limitsLoading } = useQuery({
    queryKey: ['plan-limits', currentPlan],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plan_limits')
        .select('*')
        .eq('plan_name', currentPlan);

      if (error) throw error;
      return data as PlanLimit[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch user's quota usage
  const { data: quotaUsage, isLoading: usageLoading } = useQuery({
    queryKey: ['quota-usage', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quota_usage')
        .select('*')
        .eq('user_id', user!.id);

      if (error) throw error;
      return data as Array<{
        quota_key: QuotaKey;
        current_usage: number;
        period_end: string;
      }>;
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Check quota via RPC function
  const checkQuota = async (quotaKey: QuotaKey, increment: number = 1): Promise<QuotaInfo | null> => {
    if (!user) return null;

    const { data, error } = await supabase.rpc('check_user_quota', {
      p_user_id: user.id,
      p_quota_key: quotaKey,
      p_increment: increment
    });

    if (error) {
      console.error('Error checking quota:', error);
      return null;
    }

    return data as unknown as QuotaInfo;
  };

  // Increment quota mutation
  const incrementMutation = useMutation({
    mutationFn: async ({ quotaKey, increment = 1 }: { quotaKey: QuotaKey; increment?: number }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('increment_user_quota', {
        p_user_id: user.id,
        p_quota_key: quotaKey,
        p_increment: increment
      });

      if (error) throw error;
      
      const result = data as unknown as { success: boolean; error?: string; new_usage?: number; quota?: QuotaInfo };
      if (!result.success) throw new Error(result.error || 'Quota increment failed');

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quota-usage'] });
    },
    onError: (error, variables) => {
      toast.error(`Limite atteinte: ${QUOTA_LABELS[variables.quotaKey]}`, {
        description: 'Passez à un plan supérieur pour augmenter vos limites',
        action: {
          label: 'Voir les plans',
          onClick: () => window.location.href = '/dashboard/subscription',
        },
      });
    },
  });

  // Helper: Get quota info for a specific key
  const getQuotaInfo = (quotaKey: QuotaKey): { current: number; limit: number; percentage: number; isUnlimited: boolean } => {
    const limit = planLimits?.find(l => l.limit_key === quotaKey);
    const usage = quotaUsage?.find(u => u.quota_key === quotaKey);

    const limitValue = limit?.limit_value ?? 0;
    const currentUsage = usage?.current_usage ?? 0;
    const isUnlimited = limitValue === -1;

    return {
      current: currentUsage,
      limit: limitValue,
      percentage: isUnlimited ? 0 : Math.min(100, (currentUsage / limitValue) * 100),
      isUnlimited,
    };
  };

  // Helper: Check if action is allowed (without incrementing)
  const canPerformAction = (quotaKey: QuotaKey, count: number = 1): boolean => {
    const info = getQuotaInfo(quotaKey);
    if (info.isUnlimited) return true;
    return (info.current + count) <= info.limit;
  };

  // Helper: Increment with pre-check and notification
  const incrementWithCheck = async (quotaKey: QuotaKey, increment: number = 1): Promise<boolean> => {
    if (!canPerformAction(quotaKey, increment)) {
      toast.error(`Limite atteinte: ${QUOTA_LABELS[quotaKey]}`, {
        description: 'Passez à un plan supérieur pour continuer',
        action: {
          label: 'Upgrader',
          onClick: () => window.location.href = '/dashboard/subscription',
        },
      });
      return false;
    }

    try {
      await incrementMutation.mutateAsync({ quotaKey, increment });
      return true;
    } catch {
      return false;
    }
  };

  // Get all quotas summary
  const getAllQuotas = (): Array<{
    key: QuotaKey;
    label: string;
    current: number;
    limit: number;
    percentage: number;
    isUnlimited: boolean;
  }> => {
    if (!planLimits) return [];

    return planLimits.map(limit => {
      const info = getQuotaInfo(limit.limit_key as QuotaKey);
      return {
        key: limit.limit_key as QuotaKey,
        label: QUOTA_LABELS[limit.limit_key as QuotaKey] || limit.limit_key,
        ...info,
      };
    });
  };

  return {
    // State
    currentPlan,
    isLoading: limitsLoading || usageLoading,
    planLimits,
    quotaUsage,

    // Actions
    checkQuota,
    incrementQuota: incrementMutation.mutate,
    incrementWithCheck,

    // Helpers
    getQuotaInfo,
    canPerformAction,
    getAllQuotas,
    
    // Increment status
    isIncrementing: incrementMutation.isPending,
  };
}

// Shorthand hook for single quota check
export function useQuotaCheck(quotaKey: QuotaKey) {
  const { getQuotaInfo, canPerformAction, incrementWithCheck, isLoading } = useUnifiedQuotas();
  
  return {
    ...getQuotaInfo(quotaKey),
    canPerform: (count?: number) => canPerformAction(quotaKey, count),
    increment: (count?: number) => incrementWithCheck(quotaKey, count),
    isLoading,
  };
}
