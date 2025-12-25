import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LoyaltyTier {
  id: string;
  user_id: string;
  name: string;
  min_points: number;
  discount_percent: number;
  benefits: string[];
  icon: string;
  color: string;
  created_at: string;
}

interface LoyaltyReward {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  points_cost: number;
  stock: number | null;
  is_active: boolean;
  created_at: string;
}

interface CustomerLoyalty {
  id: string;
  user_id: string;
  customer_id: string;
  tier_id: string | null;
  total_points: number;
  available_points: number;
  lifetime_points: number;
  created_at: string;
  updated_at: string;
  customers?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
  loyalty_tiers?: {
    name: string;
    color: string;
    icon: string;
  } | null;
}

interface LoyaltyTransaction {
  id: string;
  points: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
}

export function useLoyaltyProgram() {
  const queryClient = useQueryClient();

  // Fetch loyalty tiers
  const { data: tiers = [], isLoading: tiersLoading } = useQuery({
    queryKey: ['loyalty-tiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_tiers')
        .select('*')
        .order('min_points', { ascending: true });

      if (error) throw error;
      return (data || []).map(tier => ({
        ...tier,
        benefits: Array.isArray(tier.benefits) ? tier.benefits : []
      })) as LoyaltyTier[];
    },
  });

  // Fetch loyalty rewards
  const { data: rewards = [], isLoading: rewardsLoading } = useQuery({
    queryKey: ['loyalty-rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .order('points_cost', { ascending: true });

      if (error) throw error;
      return data as LoyaltyReward[];
    },
  });

  // Fetch customer loyalty with customer info
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['customer-loyalty'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_loyalty')
        .select(`
          *,
          customers (first_name, last_name, email),
          loyalty_tiers (name, color, icon)
        `)
        .order('lifetime_points', { ascending: false });

      if (error) throw error;
      return data as CustomerLoyalty[];
    },
  });

  // Fetch transactions
  const { data: transactions = [] } = useQuery({
    queryKey: ['loyalty-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as LoyaltyTransaction[];
    },
  });

  // Stats
  const stats = {
    totalMembers: members.length,
    totalPointsDistributed: transactions
      .filter(t => t.transaction_type === 'earned')
      .reduce((sum, t) => sum + t.points, 0),
    rewardsRedeemed: transactions.filter(t => t.transaction_type === 'redeemed').length,
    rewardsValue: transactions
      .filter(t => t.transaction_type === 'redeemed')
      .reduce((sum, t) => sum + Math.abs(t.points), 0),
    membersByTier: tiers.map(tier => ({
      ...tier,
      memberCount: members.filter(m => m.tier_id === tier.id).length
    }))
  };

  // Create tier mutation
  const createTierMutation = useMutation({
    mutationFn: async (tier: Partial<LoyaltyTier>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('loyalty_tiers')
        .insert({
          user_id: user.id,
          name: tier.name || 'Nouveau niveau',
          min_points: tier.min_points || 0,
          discount_percent: tier.discount_percent || 0,
          benefits: tier.benefits || [],
          icon: tier.icon || 'award',
          color: tier.color || 'text-primary'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-tiers'] });
      toast.success('Niveau de fidélité créé');
    },
    onError: (error) => {
      toast.error('Erreur lors de la création', { description: error.message });
    }
  });

  // Create reward mutation
  const createRewardMutation = useMutation({
    mutationFn: async (reward: Partial<LoyaltyReward>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('loyalty_rewards')
        .insert({
          user_id: user.id,
          name: reward.name || 'Nouvelle récompense',
          description: reward.description,
          points_cost: reward.points_cost || 100,
          stock: reward.stock,
          is_active: reward.is_active ?? true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-rewards'] });
      toast.success('Récompense créée');
    },
    onError: (error) => {
      toast.error('Erreur lors de la création', { description: error.message });
    }
  });

  // Delete tier mutation
  const deleteTierMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('loyalty_tiers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-tiers'] });
      toast.success('Niveau supprimé');
    }
  });

  // Delete reward mutation
  const deleteRewardMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('loyalty_rewards')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-rewards'] });
      toast.success('Récompense supprimée');
    }
  });

  return {
    tiers,
    rewards,
    members,
    transactions,
    stats,
    isLoading: tiersLoading || rewardsLoading || membersLoading,
    createTier: createTierMutation.mutate,
    createReward: createRewardMutation.mutate,
    deleteTier: deleteTierMutation.mutate,
    deleteReward: deleteRewardMutation.mutate,
    isCreatingTier: createTierMutation.isPending,
    isCreatingReward: createRewardMutation.isPending
  };
}
