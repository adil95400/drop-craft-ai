import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface MarketingCampaign {
  id: string; name: string; description?: string; type: string;
  status: 'draft' | 'active' | 'paused' | 'completed'; budget?: number; budget_spent: number;
  start_date?: string; end_date?: string; metrics?: any; user_id: string; created_at: string; updated_at: string;
}

export interface MarketingSegment {
  id: string; name: string; description?: string; criteria: any; contact_count: number;
  is_dynamic?: boolean; user_id: string; created_at: string; updated_at: string;
}

export const useMarketing = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['marketing-campaigns', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase.from('marketing_campaigns')
        .select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((c: any) => ({ ...c, budget_spent: c.spent || 0 })) as MarketingCampaign[];
    },
    enabled: !!user?.id,
  });

  const { data: segments = [], isLoading: isLoadingSegments } = useQuery({
    queryKey: ['marketing-segments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await (supabase.from('marketing_segments') as any)
        .select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as MarketingSegment[];
    },
    enabled: !!user?.id,
  });

  const createCampaign = useMutation({
    mutationFn: async (campaign: Omit<MarketingCampaign, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'budget_spent'>) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase.from('marketing_campaigns')
        .insert({ name: campaign.name, description: campaign.description, status: campaign.status || 'draft', budget: campaign.budget, user_id: user.id })
        .select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      toast({ title: "Campagne créée" });
    },
  });

  const updateCampaign = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<MarketingCampaign> }) => {
      const { data, error } = await supabase.from('marketing_campaigns')
        .update(updates as any).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      toast({ title: "Campagne mise à jour" });
    },
  });

  const createSegment = useMutation({
    mutationFn: async (segment: Omit<MarketingSegment, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'contact_count'>) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await (supabase.from('marketing_segments') as any)
        .insert({ name: segment.name, description: segment.description, criteria: segment.criteria, is_dynamic: segment.is_dynamic, user_id: user.id })
        .select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-segments'] });
      toast({ title: "Segment créé" });
    },
  });

  const stats = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    totalBudget: campaigns.reduce((sum, c) => sum + (c.budget || 0), 0),
    totalSpent: campaigns.reduce((sum, c) => sum + c.budget_spent, 0),
    totalSegments: segments.length,
    totalContacts: segments.reduce((sum, s) => sum + s.contact_count, 0),
  };

  return {
    campaigns, segments, stats, isLoading: isLoadingCampaigns || isLoadingSegments,
    createCampaign: createCampaign.mutate, updateCampaign: updateCampaign.mutate,
    createSegment: createSegment.mutate,
    isCreatingCampaign: createCampaign.isPending, isUpdatingCampaign: updateCampaign.isPending,
    isCreatingSegment: createSegment.isPending,
  };
};
