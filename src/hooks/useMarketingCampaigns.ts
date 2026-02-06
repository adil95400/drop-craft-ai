import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type MarketingCampaign = Database['public']['Tables']['marketing_campaigns']['Row'];
type MarketingCampaignInsert = Database['public']['Tables']['marketing_campaigns']['Insert'];
type MarketingCampaignUpdate = Database['public']['Tables']['marketing_campaigns']['Update'];

export const useMarketingCampaigns = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: campaigns = [], isLoading, error } = useQuery({
    queryKey: ['marketing-campaigns', user?.id],
    queryFn: async (): Promise<MarketingCampaign[]> => {
      if (!user?.id) return [];
      const { data, error } = await supabase.from('marketing_campaigns')
        .select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const createCampaign = useMutation({
    mutationFn: async (campaignData: Omit<MarketingCampaignInsert, 'user_id'>) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase.from('marketing_campaigns')
        .insert({ ...campaignData, user_id: user.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      toast({ title: "Campagne créée", description: "Votre campagne a été créée avec succès" });
    },
  });

  const updateCampaign = useMutation({
    mutationFn: async ({ id, ...updates }: MarketingCampaignUpdate & { id: string }) => {
      const { data, error } = await supabase.from('marketing_campaigns')
        .update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      toast({ title: "Campagne mise à jour" });
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('marketing_campaigns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      toast({ title: "Campagne supprimée" });
    },
  });

  return {
    campaigns, isLoading, error,
    createCampaign: createCampaign.mutate, updateCampaign: updateCampaign.mutate,
    deleteCampaign: deleteCampaign.mutate,
    isCreating: createCampaign.isPending, isUpdating: updateCampaign.isPending, isDeleting: deleteCampaign.isPending,
  };
};
