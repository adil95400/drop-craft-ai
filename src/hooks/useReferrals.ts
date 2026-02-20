import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReferralCode {
  id: string;
  code: string;
  reward_type: string;
  reward_value: number;
  referee_reward_type: string;
  referee_reward_value: number;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

interface Referral {
  id: string;
  referrer_id: string;
  referee_id: string;
  status: string;
  referrer_reward_given: boolean;
  referee_reward_given: boolean;
  referrer_reward_amount: number;
  referee_reward_amount: number;
  completed_at: string | null;
  created_at: string;
}

interface ReferralStats {
  codes: ReferralCode[];
  referrals: Referral[];
  stats: {
    total_referred: number;
    total_rewards: number;
    pending_rewards: number;
  };
}

export function useReferrals() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<ReferralStats>({
    queryKey: ['referral-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('manage-referrals', {
        body: { action: 'get_stats' },
      });
      if (error) throw error;
      return data as ReferralStats;
    },
    staleTime: 60_000,
  });

  const generateCode = useMutation({
    mutationFn: async (params: { custom_code?: string; reward_value?: number; referee_reward_value?: number; max_uses?: number }) => {
      const { data, error } = await supabase.functions.invoke('manage-referrals', {
        body: { action: 'generate_code', ...params },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Code de parrainage créé !');
      queryClient.invalidateQueries({ queryKey: ['referral-stats'] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erreur'),
  });

  const applyCode = useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.functions.invoke('manage-referrals', {
        body: { action: 'apply_code', code },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Code appliqué ! Vous recevez ${data.reward_value} ${data.reward_type === 'credits' ? 'crédits' : '€'}`);
      queryClient.invalidateQueries({ queryKey: ['referral-stats'] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Code invalide'),
  });

  return {
    codes: data?.codes || [],
    referrals: data?.referrals || [],
    stats: data?.stats || { total_referred: 0, total_rewards: 0, pending_rewards: 0 },
    isLoading,
    generateCode: generateCode.mutate,
    isGenerating: generateCode.isPending,
    applyCode: applyCode.mutate,
    isApplying: applyCode.isPending,
  };
}
