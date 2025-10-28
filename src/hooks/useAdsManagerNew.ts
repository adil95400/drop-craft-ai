import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useAdsManagerNew() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: campaigns, isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['ad-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase.from('ad_campaigns' as any).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as any;
    },
  });

  const { data: abTests, isLoading: isLoadingABTests } = useQuery({
    queryKey: ['ad-ab-tests'],
    queryFn: async () => {
      const { data, error } = await supabase.from('ad_ab_tests' as any).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as any;
    },
  });

  const { data: suggestions, isLoading: isLoadingSuggestions } = useQuery({
    queryKey: ['ad-suggestions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('ad_optimization_suggestions' as any).select('*').eq('is_applied', false).order('priority', { ascending: false });
      if (error) throw error;
      return data as any;
    },
  });

  const createCampaign = useMutation({
    mutationFn: async (params: any) => {
      const { data, error } = await supabase.from('ad_campaigns' as any).insert({
        name: params.name, platform: params.platform, objective: params.objective,
        budget_type: params.budgetType, budget_amount: params.budgetAmount,
        target_audience: { description: params.targetAudience },
        ai_optimization_enabled: params.aiOptimizationEnabled, status: 'draft'
      } as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Campagne créée!' });
      queryClient.invalidateQueries({ queryKey: ['ad-campaigns'] });
    },
  });

  const updateCampaignStatus = useMutation({
    mutationFn: async ({ campaignId, status }: any) => {
      const { data, error } = await supabase.from('ad_campaigns' as any).update({ status } as any).eq('id', campaignId).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Statut mis à jour' });
      queryClient.invalidateQueries({ queryKey: ['ad-campaigns'] });
    },
  });

  const generateCreative = useMutation({
    mutationFn: async (params: any) => {
      const { data, error } = await supabase.functions.invoke('ads-creative-generator', { body: params });
      if (error) throw error;
      return data;
    },
    onSuccess: () => toast({ title: 'Créatif généré!' }),
  });

  const applySuggestion = useMutation({
    mutationFn: async (suggestionId: string) => {
      const { error } = await supabase.from('ad_optimization_suggestions' as any).update({ 
        is_applied: true, applied_at: new Date().toISOString() 
      } as any).eq('id', suggestionId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Suggestion appliquée!' });
      queryClient.invalidateQueries({ queryKey: ['ad-suggestions', 'ad-campaigns'] });
    },
  });

  return {
    campaigns, isLoadingCampaigns,
    createCampaign: createCampaign.mutate, isCreatingCampaign: createCampaign.isPending,
    updateCampaignStatus: (campaignId: string, status: string) => updateCampaignStatus.mutate({ campaignId, status }),
    generateCreative: generateCreative.mutateAsync, isGeneratingCreative: generateCreative.isPending,
    abTests, isLoadingABTests,
    suggestions, isLoadingSuggestions, applySuggestion: applySuggestion.mutate,
  };
}
